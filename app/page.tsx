'use client';

import { useEffect } from 'react';
import { Loader2, AlertTriangle, FileVideo } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import TranscriptView from '@/components/TranscriptView';
import { setStatus, setTranscriptData, setError } from '@/store/transcriptSlice';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { status, videoFile, error } = useAppSelector((state) => state.transcript);

  useEffect(() => {
    const processVideo = async () => {
      if (videoFile && status === 'idle') {
        try {
          dispatch(setStatus('processing'));

          console.log('Step 1: Getting presigned upload URL...');
          
          // Step 1: Get presigned URL for upload
          const urlResponse = await fetch('/api/upload-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: videoFile.name,
              contentType: videoFile.type,
            }),
          });

          if (!urlResponse.ok) {
            const errorData = await urlResponse.json();
            throw new Error(errorData.error || 'Failed to get upload URL');
          }

          const { uploadUrl, key } = await urlResponse.json();
          console.log('Got presigned URL, key:', key);

          // Step 2: Upload file directly to R2
          console.log('Step 2: Uploading to R2...');
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: videoFile,
            headers: {
              'Content-Type': videoFile.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload to R2');
          }

          console.log('Upload successful!');

          // Step 3: Process transcript from R2
          console.log('Step 3: Generating transcript...');
          const transcriptResponse = await fetch('/api/generate-transcript', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              r2Key: key,
              contentType: videoFile.type,
            }),
          });

          if (!transcriptResponse.ok) {
            const errorData = await transcriptResponse.json();
            throw new Error(errorData.error || 'Failed to generate transcript');
          }

          const result = await transcriptResponse.json();
          console.log('Transcript generated successfully!');
          
          dispatch(setTranscriptData(result));
        } catch (err: any) {
          console.error('Processing error:', err);
          dispatch(setError(err.message || 'An unknown error occurred'));
        }
      }
    };

    if (videoFile && status === 'idle') {
      processVideo();
    }
  }, [videoFile, status, dispatch]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />
      
      <main className="flex-1 flex flex-col p-6 md:p-12 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col">
          
          {/* Hero Text (Only show when not viewing results) */}
          {status !== 'completed' && (
            <div className="text-center mb-12 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
                Video to Text, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-500">Instantly.</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Upload any video in any language. Our AI generates a precise English transcript with timestamps in seconds.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="max-w-2xl mx-auto w-full mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
              <AlertTriangle className="flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Processing Error</h4>
                <p className="text-sm opacity-90">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 text-xs font-bold underline hover:text-red-900"
                >
                  Reset App
                </button>
              </div>
            </div>
          )}

          {/* Conditional Views */}
          {status === 'processing' ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileVideo className="text-slate-300 animate-pulse" size={24} />
                </div>
              </div>
              <h3 className="mt-8 text-xl font-bold text-slate-800">Analyzing Video Content...</h3>
              <p className="text-slate-500 mt-2 text-center max-w-md">
                We&apos;re extracting audio, translating if necessary, and generating your timestamped transcript.
                <br />
                <span className="text-sm opacity-75 mt-2 block">This may take a minute for larger videos.</span>
              </p>
            </div>
          ) : status === 'completed' ? (
            <TranscriptView />
          ) : (
            <FileUpload />
          )}

        </div>
      </main>
      
      <footer className="py-6 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} TranscriptAi. Built with Next.js, Tailwind & Gemini.
      </footer>
    </div>
  );
}
