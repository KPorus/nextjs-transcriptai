import { configureStore } from '@reduxjs/toolkit';
import transcriptReducer from './transcriptSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      transcript: transcriptReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['transcript/setVideoFile'],
          // Ignore these field paths in all actions
          ignoredActionPaths: ['payload.file'],
          // Ignore these paths in the state
          ignoredPaths: ['transcript.videoFile'],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
