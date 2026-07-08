declare module 'node-record-lpcm16' {
  interface RecordingOptions {
    recorder?: string;
    sampleRate?: number;
    channels?: number;
    audioType?: string;
    silence?: number;
    threshold?: number;
  }

  interface Recording {
    stream(): NodeJS.ReadableStream;
    stop(): void;
  }

  interface Record {
    record(options?: RecordingOptions): Recording;
  }

  const record: Record;
  export default record;
  export = record;
}
