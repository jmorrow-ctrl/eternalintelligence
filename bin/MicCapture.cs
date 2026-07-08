using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

class MicCapture
{
    const int WAVE_FORMAT_PCM = 1;
    const int CALLBACK_FUNCTION = 0x30000;
    const int WIM_DATA = 0x3C0;

    [StructLayout(LayoutKind.Sequential)]
    struct WAVEFORMATEX
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
    struct WAVEHDR
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

    delegate void WaveDelegate(IntPtr hWaveIn, int uMsg, IntPtr dwInstance, ref WAVEHDR wavHdr, IntPtr dwParam2);

    [DllImport("winmm.dll")]
    static extern int waveInOpen(out IntPtr hWaveIn, int uDeviceID, ref WAVEFORMATEX lpFormat, WaveDelegate dwCallback, IntPtr dwInstance, int fdwOpen);

    [DllImport("winmm.dll")]
    static extern int waveInClose(IntPtr hWaveIn);

    [DllImport("winmm.dll")]
    static extern int waveInPrepareHeader(IntPtr hWaveIn, ref WAVEHDR lpWaveInHdr, int uSize);

    [DllImport("winmm.dll")]
    static extern int waveInUnprepareHeader(IntPtr hWaveIn, ref WAVEHDR lpWaveInHdr, int uSize);

    [DllImport("winmm.dll")]
    static extern int waveInAddBuffer(IntPtr hWaveIn, ref WAVEHDR lpWaveInHdr, int uSize);

    [DllImport("winmm.dll")]
    static extern int waveInStart(IntPtr hWaveIn);

    [DllImport("winmm.dll")]
    static extern int waveInStop(IntPtr hWaveIn);

    [DllImport("winmm.dll")]
    static extern int waveInReset(IntPtr hWaveIn);

    static AutoResetEvent done = new AutoResetEvent(false);
    static MemoryStream audioData = new MemoryStream();
    static int bufferCount = 0;
    static int totalBuffers;
    static int sampleRate;

    static void WaveCallback(IntPtr hWaveIn, int uMsg, IntPtr dwInstance, ref WAVEHDR wavHdr, IntPtr dwParam2)
    {
        if (uMsg == WIM_DATA)
        {
            int bytes = (int)wavHdr.dwBytesRecorded;
            if (bytes > 0)
            {
                byte[] buf = new byte[bytes];
                Marshal.Copy(wavHdr.lpData, buf, 0, bytes);
                audioData.Write(buf, 0, bytes);
            }
            bufferCount++;
            if (bufferCount < totalBuffers)
                waveInAddBuffer(hWaveIn, ref wavHdr, Marshal.SizeOf(typeof(WAVEHDR)));
            else
                done.Set();
        }
    }

    static void Main(string[] args)
    {
        int duration = 5;
        string output = "capture.wav";
        sampleRate = 48000;

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "-d" && i + 1 < args.Length) duration = int.Parse(args[i + 1]);
            if (args[i] == "-o" && i + 1 < args.Length) output = args[i + 1];
            if (args[i] == "-r" && i + 1 < args.Length) sampleRate = int.Parse(args[i + 1]);
        }

        WAVEFORMATEX fmt = new WAVEFORMATEX
        {
            wFormatTag = WAVE_FORMAT_PCM,
            nChannels = 1,
            nSamplesPerSec = (uint)sampleRate,
            wBitsPerSample = 16,
            nBlockAlign = 2,
            nAvgBytesPerSec = (uint)(sampleRate * 2),
            cbSize = 0
        };

        IntPtr hWaveIn;
        int result = waveInOpen(out hWaveIn, -1, ref fmt, WaveCallback, IntPtr.Zero, CALLBACK_FUNCTION);
        if (result != 0) { Console.Error.WriteLine("waveInOpen failed: " + result); return; }

        int bufSize = sampleRate * 2; // 1 second per buffer
        totalBuffers = duration + 1;
        GCHandle[] handles = new GCHandle[totalBuffers];
        WAVEHDR[] hdrs = new WAVEHDR[totalBuffers];

        for (int i = 0; i < totalBuffers; i++)
        {
            byte[] data = new byte[bufSize];
            handles[i] = GCHandle.Alloc(data, GCHandleType.Pinned);
            hdrs[i] = new WAVEHDR { lpData = handles[i].AddrOfPinnedObject(), dwBufferLength = (uint)bufSize };
            waveInPrepareHeader(hWaveIn, ref hdrs[i], Marshal.SizeOf(typeof(WAVEHDR)));
            waveInAddBuffer(hWaveIn, ref hdrs[i], Marshal.SizeOf(typeof(WAVEHDR)));
        }

        waveInStart(hWaveIn);
        Console.Error.WriteLine("Recording for " + duration + " seconds...");
        done.WaitOne();
        waveInStop(hWaveIn);
        waveInReset(hWaveIn);

        for (int i = 0; i < totalBuffers; i++)
        {
            waveInUnprepareHeader(hWaveIn, ref hdrs[i], Marshal.SizeOf(typeof(WAVEHDR)));
            handles[i].Free();
        }
        waveInClose(hWaveIn);

        byte[] pcm = audioData.ToArray();
        audioData.Close();

        using (FileStream fs = new FileStream(output, FileMode.Create))
        using (BinaryWriter w = new BinaryWriter(fs))
        {
            w.Write(new char[] { 'R', 'I', 'F', 'F' });
            w.Write(36 + pcm.Length);
            w.Write(new char[] { 'W', 'A', 'V', 'E', 'f', 'm', 't', ' ' });
            w.Write(16);
            w.Write((short)1);
            w.Write((short)1);
            w.Write(sampleRate);
            w.Write(sampleRate * 2);
            w.Write((short)2);
            w.Write((short)16);
            w.Write(new char[] { 'd', 'a', 't', 'a' });
            w.Write(pcm.Length);
            w.Write(pcm);
        }

        Console.Error.WriteLine("Captured " + pcm.Length + " bytes PCM");
        Console.WriteLine("FILE_OK:" + output);
    }
}
