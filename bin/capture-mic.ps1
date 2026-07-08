param(
  [int]$Duration = 5,
  [string]$OutputFile = "$env:TEMP\speech_input.wav"
)

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

public class WaveInRecorder
{
    private const int MM_WIM_OPEN = 0x3BE;
    private const int MM_WIM_CLOSE = 0x3BF;
    private const int MM_WIM_DATA = 0x3C0;
    private const int WAVE_FORMAT_PCM = 1;
    private const int CALLBACK_FUNCTION = 0x30000;
    private const int WIM_CLOSE = 0x3BF;
    private const int WIM_DATA = 0x3C0;

    [DllImport("winmm.dll")]
    private static extern int waveInOpen(out IntPtr hWaveIn, int uDeviceID, ref WAVEFORMATEX lpFormat, WaveDelegate dwCallback, IntPtr dwInstance, int fdwOpen);

    [DllImport("winmm.dll")]
    private static extern int waveInClose(IntPtr hWaveIn);

    [DllImport("winmm.dll")]
    private static extern int waveInPrepareHeader(IntPtr hWaveIn, ref WAVEHDR lpWaveInHdr, int uSize);

    [DllImport("winmm.dll")]
    private static extern int waveInUnprepareHeader(IntPtr hWaveIn, ref WAVEHDR lpWaveInHdr, int uSize);

    [DllImport("winmm.dll")]
    private static extern int waveInAddBuffer(IntPtr hWaveIn, ref WAVEHDR lpWaveInHdr, int uSize);

    [DllImport("winmm.dll")]
    private static extern int waveInStart(IntPtr hWaveIn);

    [DllImport("winmm.dll")]
    private static extern int waveInStop(IntPtr hWaveIn);

    [DllImport("winmm.dll")]
    private static extern int waveInReset(IntPtr hWaveIn);

    [StructLayout(LayoutKind.Sequential)]
    private struct WAVEFORMATEX
    {
        public ushort wFormatTag;
        public ushort nChannels;
        public uint nSamplesPerSec;
        public uint nAvgBytesPerSec;
        public ushort nBlockAlign;
        public ushort wBitsPerSample;
        public ushort cbSize;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct WAVEHDR
    {
        public IntPtr lpData;
        public uint dwBufferLength;
        public uint dwBytesRecorded;
        public IntPtr dwUser;
        public uint dwFlags;
        public uint dwLoops;
        public IntPtr lpNext;
        public IntPtr reserved;
    }

    private delegate void WaveDelegate(IntPtr hWaveIn, int uMsg, IntPtr dwInstance, ref WAVEHDR wavHdr, IntPtr dwParam2);

    private IntPtr hWaveIn;
    private GCHandle[] bufferHandles;
    private WAVEHDR[] headers;
    private byte[][] buffers;
    private MemoryStream audioStream;
    private int buffersFilled;
    private AutoResetEvent doneEvent;
    private int totalSamples;
    private int bufferSize;
    private int expectedBuffers;
    private WAVEFORMATEX format;

    public byte[] Record(int durationSec, int sampleRate)
    {
        audioStream = new MemoryStream();
        doneEvent = new AutoResetEvent(false);
        totalSamples = sampleRate * durationSec;
        bufferSize = sampleRate * 2; // ~1 second per buffer
        expectedBuffers = durationSec + 1; // a bit extra

        format = new WAVEFORMATEX
        {
            wFormatTag = WAVE_FORMAT_PCM,
            nChannels = 1,
            nSamplesPerSec = (uint)sampleRate,
            wBitsPerSample = 16,
            nBlockAlign = 2,
            nAvgBytesPerSec = (uint)(sampleRate * 2),
            cbSize = 0
        };

        WaveDelegate callback = WaveCallback;
        int result = waveInOpen(out hWaveIn, 0, ref format, callback, IntPtr.Zero, CALLBACK_FUNCTION);
        if (result != 0) throw new Exception("waveInOpen failed: " + result);

        buffers = new byte[expectedBuffers][];
        headers = new WAVEHDR[expectedBuffers];
        bufferHandles = new GCHandle[expectedBuffers];
        buffersFilled = 0;

        for (int i = 0; i < expectedBuffers; i++)
        {
            buffers[i] = new byte[bufferSize];
            bufferHandles[i] = GCHandle.Alloc(buffers[i], GCHandleType.Pinned);
            headers[i] = new WAVEHDR
            {
                lpData = bufferHandles[i].AddrOfPinnedObject(),
                dwBufferLength = (uint)bufferSize
            };
            waveInPrepareHeader(hWaveIn, ref headers[i], Marshal.SizeOf(typeof(WAVEHDR)));
            waveInAddBuffer(hWaveIn, ref headers[i], Marshal.SizeOf(typeof(WAVEHDR)));
        }

        waveInStart(hWaveIn);
        doneEvent.WaitOne(durationSec * 1000 + 2000);
        waveInStop(hWaveIn);
        waveInReset(hWaveIn);

        // Unprepare and free all headers
        for (int i = 0; i < expectedBuffers; i++)
        {
            try { waveInUnprepareHeader(hWaveIn, ref headers[i], Marshal.SizeOf(typeof(WAVEHDR))); } catch { }
            bufferHandles[i].Free();
        }

        waveInClose(hWaveIn);

        // Build WAV file
        byte[] pcmData = audioStream.ToArray();
        audioStream.Close();

        using (var wav = new MemoryStream())
        {
            using (var writer = new BinaryWriter(wav))
            {
                writer.Write(new char[] { 'R', 'I', 'F', 'F' });
                writer.Write((int)(36 + pcmData.Length));
                writer.Write(new char[] { 'W', 'A', 'V', 'E', 'f', 'm', 't', ' ' });
                writer.Write(16);
                writer.Write((short)1);
                writer.Write((short)1);
                writer.Write(sampleRate);
                writer.Write(sampleRate * 2);
                writer.Write((short)2);
                writer.Write((short)16);
                writer.Write(new char[] { 'd', 'a', 't', 'a' });
                writer.Write(pcmData.Length);
                writer.Write(pcmData);
            }
            return wav.ToArray();
        }
    }

    private void WaveCallback(IntPtr hWaveIn, int uMsg, IntPtr dwInstance, ref WAVEHDR wavHdr, IntPtr dwParam2)
    {
        if (uMsg == WIM_DATA)
        {
            int bytesRecorded = (int)wavHdr.dwBytesRecorded;
            if (bytesRecorded > 0)
            {
                byte[] data = new byte[bytesRecorded];
                Marshal.Copy(wavHdr.lpData, data, 0, bytesRecorded);
                audioStream.Write(data, 0, bytesRecorded);
                buffersFilled++;
            }

            if (buffersFilled < expectedBuffers)
            {
                waveInAddBuffer(hWaveIn, ref wavHdr, Marshal.SizeOf(typeof(WAVEHDR)));
            }
            else
            {
                doneEvent.Set();
            }
        }
    }
}
"@

try {
    $recorder = New-Object WaveInRecorder
    $wavBytes = $recorder.Record($Duration, 44100)
    
    # Convert to 16kHz mono WAV for transcription
    $tempRaw = [System.IO.Path]::GetTempPath() + "temp_raw_$([System.Guid]::NewGuid()).raw"
    [System.IO.File]::WriteAllBytes($tempRaw, $wavBytes)
    
    Write-Host "CAPTURED:$($wavBytes.Length) bytes at 44100Hz"
    
    # Resample to 16000 via ffmpeg
    & ffmpeg -y -f wav -i $tempRaw -ar 16000 -ac 1 -f wav $OutputFile -loglevel error 2>&1
    
    if (Test-Path $OutputFile) {
        Remove-Item $tempRaw -ErrorAction SilentlyContinue
        Write-Host "WAV OK:$((Get-Item $OutputFile).Length)"
    } else {
        # Fallback - try writing directly at 44100
        $outPath = $OutputFile -replace '\.wav$','_44100.wav'
        [System.IO.File]::WriteAllBytes($outPath, $wavBytes)
        Write-Host "FALLBACK:$outPath"
    }
} catch {
    Write-Host "ERROR:$_"
}
