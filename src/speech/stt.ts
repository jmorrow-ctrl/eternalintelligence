import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { getConfig } from '../config';

function audioBufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  return (buf.buffer as ArrayBuffer).slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export async function speechToText(audioBuffer: Buffer): Promise<string> {
  const { azureSpeechKey, azureSpeechRegion } = getConfig();

  if (!azureSpeechKey || !azureSpeechRegion) {
    throw new Error('Azure Speech credentials not configured');
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(azureSpeechKey, azureSpeechRegion);
  speechConfig.speechRecognitionLanguage = 'ru-RU';

  const pushStream = sdk.AudioInputStream.createPushStream();
  pushStream.write(audioBufferToArrayBuffer(audioBuffer));
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          resolve(result.text);
        } else if (result.reason === sdk.ResultReason.NoMatch) {
          resolve('');
        } else {
          reject(new Error(`STT failed: ${result.reason}`));
        }
      },
      (err) => {
        recognizer.close();
        reject(err);
      },
    );
  });
}
