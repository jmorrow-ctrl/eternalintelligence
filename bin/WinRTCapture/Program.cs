using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Windows.Media.Capture;
using Windows.Media.Devices;
using Windows.Media.MediaProperties;
using Windows.Storage;

namespace WinRTCapture;

class Program
{
    static async Task<int> CaptureAsync(string outputPath, int durationSec, string? deviceId)
    {
        var capture = new MediaCapture();
        var settings = new MediaCaptureInitializationSettings
        {
            StreamingCaptureMode = StreamingCaptureMode.Audio
        };

        if (deviceId != null)
            settings.AudioDeviceId = deviceId;

        try
        {
            await capture.InitializeAsync(settings);
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"FAIL_INIT:{ex.Message}");
            return 1;
        }

        // Log actual device being used
        try
        {
            var devController = capture.AudioDeviceController;
            await Console.Error.WriteLineAsync($"DEVICE:{devController.Id}");
        }
        catch { }

        var profile = new MediaEncodingProfile
        {
            Audio = AudioEncodingProperties.CreatePcm(16000, 1, 16),
            Container = ContainerEncodingProperties.CreateWav()
        };

        var folder = await StorageFolder.GetFolderFromPathAsync(Path.GetDirectoryName(outputPath));
        var file = await folder.CreateFileAsync(Path.GetFileName(outputPath), CreationCollisionOption.ReplaceExisting);

        try
        {
            await capture.StartRecordToStorageFileAsync(profile, file);
            await Console.Error.WriteLineAsync("REC_START");

            await Task.Delay(TimeSpan.FromSeconds(durationSec));

            await capture.StopRecordAsync();
            await Console.Error.WriteLineAsync("REC_STOP");
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"FAIL_REC:{ex.Message}");
            return 1;
        }
        finally
        {
            capture.Dispose();
        }

        var info = await file.GetBasicPropertiesAsync();
        await Console.Error.WriteLineAsync($"SIZE:{info.Size}");
        Console.WriteLine($"FILE_OK:{outputPath}");
        return 0;
    }

    static async Task ListDevicesAsync()
    {
        var devices = await DeviceInformation.FindAllAsync(DeviceClass.AudioCapture);
        Console.Error.WriteLine($"Found {devices.Count} audio capture device(s):");
        foreach (var d in devices)
            Console.Error.WriteLine($"  [{d.Id}] {d.Name} (enabled={d.IsEnabled})");
    }

    [STAThread]
    static int Main(string[] args)
    {
        int duration = 5;
        string output = Path.GetTempPath() + "winrt_capture.wav";
        string? deviceId = null;
        bool listDevices = false;

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "-d" && i + 1 < args.Length) duration = int.Parse(args[++i]);
            if (args[i] == "-o" && i + 1 < args.Length) output = args[++i];
            if (args[i] == "--device" && i + 1 < args.Length) deviceId = args[++i];
            if (args[i] == "--list-devices") listDevices = true;
        }

        if (listDevices)
            return ListDevicesAsync().GetAwaiter().GetResult();

        return CaptureAsync(output, duration, deviceId).GetAwaiter().GetResult();
    }
}
