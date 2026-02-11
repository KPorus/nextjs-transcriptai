import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState, VideoMetadata, TranscriptSegment } from '../types';

const initialState: AppState['transcript'] = {
  videoFile: null,
  videoMetadata: null,
  rawTranscript: '',
  segments: [],
  status: 'idle',
  error: null,
  youtubeUrl: '',
  activeTab: 'upload'
};

const transcriptSlice = createSlice({
  name: 'transcript',
  initialState,
  reducers: {
    setVideoFile: (state, action: PayloadAction<{ file: File; metadata: VideoMetadata }>) => {
      state.videoFile = action.payload.file;
      state.videoMetadata = action.payload.metadata;
      state.status = 'idle';
      state.error = null;
      state.rawTranscript = '';
      state.segments = [];
    },
    setYoutubeUrl: (state, action: PayloadAction<string>) => {
      state.youtubeUrl = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<'upload' | 'youtube'>) => {
      state.activeTab = action.payload;
      state.error = null;
    },
    setStatus: (state, action: PayloadAction<AppState['transcript']['status']>) => {
      state.status = action.payload;
    },
    setTranscriptData: (state, action: PayloadAction<{ raw: string; segments: TranscriptSegment[] }>) => {
      state.rawTranscript = action.payload.raw;
      state.segments = action.payload.segments;
      state.status = 'completed';
    },
    updateSegment: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const segment = state.segments.find(s => s.id === action.payload.id);
      if (segment) {
        segment.text = action.payload.text;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'error';
    },
    resetState: (state) => {
      state.videoFile = null;
      state.videoMetadata = null;
      state.rawTranscript = '';
      state.segments = [];
      state.status = 'idle';
      state.error = null;
    }
  },
});

export const { 
  setVideoFile, 
  setYoutubeUrl, 
  setActiveTab, 
  setStatus, 
  setTranscriptData, 
  updateSegment,
  setError, 
  resetState 
} = transcriptSlice.actions;

export default transcriptSlice.reducer;
