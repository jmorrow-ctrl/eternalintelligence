using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Media.Capture;
using Windows.Media.MediaProperties;
using Windows.Storage;
using Windows.Storage.Streams;

class WinRTCapture
{
    static async Task CaptureAsync(string outputPath, int durationSec)
    {
        var capture = new MediaCapture();
        await capture.InitializeAsync();

        var profile = MediaEncodingProfile.CreateWav(AudioEncodingQuality.High);
        profile.Audio = AudioEncodingProperties.CreatePcm(16000, 1, 16);

        var file = await StorageFile.GetFileFromPathAsync(outputPath);
        await capture.StartRecordToStorageFileAsync(profile, file);

        await Task.Delay(TimeSpan.FromSeconds(durationSec));

        await capture.StopRecordAsync();
        capture.Dispose();
    }

    static void Main(string[] args)
    {
        int duration = 5;
        string output = "capture.wav";

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "-d") duration = int.Parse(args[++i]);
            if (args[i] == "-o") output = args[++i];
        }

        Console.Error.WriteLine($"Recording {duration}s to {output}...");
        CaptureAsync(output, duration).GetAwaiter().GetResult();
        Console.Error.WriteLine("Done");
        Console.WriteLine($"FILE_OK:{output}");
    }
}
