export interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
}

export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  duration?: number;
  url?: string;
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error: string | null;
}

export interface AppState {
  transcript: {
    videoFile: File | null;
    videoMetadata: VideoMetadata | null;
    rawTranscript: string;
    segments: TranscriptSegment[];
    status: ProcessingState['status'];
    error: string | null;
    youtubeUrl: string;
    activeTab: 'upload' | 'youtube';
  };
}

export interface TranscriptResponse {
  raw: string;
  segments: TranscriptSegment[];
}
