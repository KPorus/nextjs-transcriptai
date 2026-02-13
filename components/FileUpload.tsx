'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Youtube, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setVideoFile, setError, setActiveTab, setYoutubeUrl } from '@/store/transcriptSlice';

const MAX_SIZE_MB = 1000;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav'];

const FileUpload: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTab, youtubeUrl } = useAppSelector((state) => state.transcript);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      dispatch(setError(`Invalid file type. Allowed: MP4, WebM, MOV, MP3, WAV.`));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      dispatch(setError(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max ${MAX_SIZE_MB}MB.`));
      return;
    }

    dispatch(setVideoFile({
      file,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
      }
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 justify-center">
        <button
          onClick={() => dispatch(setActiveTab('upload'))}
          className={`pb-2 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'upload' 
            ? 'border-brand-600 text-brand-600' 
            : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upload Video
        </button>
        {/* <button
          onClick={() => dispatch(setActiveTab('youtube'))}
          className={`pb-2 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'youtube' 
            ? 'border-brand-600 text-brand-600' 
            : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          YouTube Link
        </button> */}
      </div>

      <div className="rounded-2xl p-1 bg-white shadow-xl">
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 transition-all min-h-[300px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
          
          {activeTab === 'upload' ? (
            <div 
              className="w-full h-full flex flex-col items-center justify-center z-10"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                onChange={handleChange}
                accept={ALLOWED_TYPES.join(',')}
              />
              
              <div className={`p-4 rounded-full bg-blue-100 text-brand-600 mb-4 transition-transform duration-300 ${dragActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                <UploadCloud size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {dragActive ? "Drop video here" : "Drag & Drop video"}
              </h3>
              <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                Supports MP4, MOV, WebM. Max size {MAX_SIZE_MB}MB.
              </p>
              <button 
                onClick={() => inputRef.current?.click()}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-md transition-all active:scale-95"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center z-10 px-8">
              <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4">
                <Youtube size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                YouTube Transcription
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Paste a YouTube URL to generate a transcript.
              </p>
              <div className="w-full flex gap-2">
                <input 
                  type="text" 
                  value={youtubeUrl}
                  onChange={(e) => dispatch(setYoutubeUrl(e.target.value))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
                <button 
                  className="px-6 py-2 bg-slate-200 text-slate-400 cursor-not-allowed rounded-lg font-medium"
                  disabled
                  title="Requires Backend Server for Youtube Download"
                >
                  Analyze
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-amber-600 text-xs bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                <AlertCircle size={14} />
                <span>YouTube processing requires additional backend setup. Use &quot;Upload Video&quot; for now.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
