import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { getConfig } from '../config';

function audioBufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  return (buf.buffer as ArrayBuffer).slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export interface PronunciationResult {
  score: number;
  phonemeFeedback: string;
}

export async function pronunciationAssessment(
  audioBuffer: Buffer,
  referenceText: string,
): Promise<PronunciationResult> {
  const { azureSpeechKey, azureSpeechRegion } = getConfig();

  if (!azureSpeechKey || !azureSpeechRegion) {
    throw new Error('Azure Speech credentials not configured');
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(azureSpeechKey, azureSpeechRegion);
  speechConfig.speechRecognitionLanguage = 'ru-RU';

  const pronConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true,
  );

  const pushStream = sdk.AudioInputStream.createPushStream();
  pushStream.write(audioBufferToArrayBuffer(audioBuffer));
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  pronConfig.applyTo(recognizer);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        try {
          const pronResult = sdk.PronunciationAssessmentResult.fromResult(result);
          resolve({
            score: pronResult.accuracyScore ?? 0,
            phonemeFeedback: JSON.stringify(pronResult.detailResult?.Words ?? []),
          });
        } catch {
          resolve({ score: 0, phonemeFeedback: '' });
        }
      },
      (err) => {
        recognizer.close();
        reject(err);
      },
    );
  });
}
