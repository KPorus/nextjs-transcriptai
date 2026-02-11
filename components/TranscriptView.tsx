'use client';

import React, { useState } from 'react';
import { Download, Copy, RefreshCcw, Check, FileText, Wifi } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { resetState, updateSegment } from '@/store/transcriptSlice';

const TranscriptView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { segments, videoMetadata } = useAppSelector((state) => state.transcript);
  const [copied, setCopied] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const handleTextChange = (id: string, newText: string) => {
    dispatch(updateSegment({ id, text: newText }));
  };

  const handleCopy = () => {
    const text = segments.map(s => `${s.timestamp} ${s.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = segments.map(s => `${s.timestamp} ${s.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${videoMetadata?.name || 'video'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Toolbar & Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Transcription Result
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <FileText size={16} />
              {videoMetadata?.name}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => dispatch(resetState())}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCcw size={18} />
            <span className="hidden sm:inline">New</span>
          </button>
          <button 
            onClick={handleCopy}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            {copied ? <Check size={18} className="text-green-600"/> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button 
            onClick={handleDownload}
            className="px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md shadow-brand-100"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto p-4 md:p-8 space-y-2 bg-slate-50/50">
          {segments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">
              No transcript content generated.
            </div>
          ) : (
            segments.map((segment) => (
              <div 
                key={segment.id} 
                className={`flex gap-3 md:gap-4 p-3 rounded-lg transition-all border border-transparent ${
                  activeSegmentId === segment.id ? 'bg-white border-brand-200 shadow-sm' : 'hover:bg-white hover:shadow-sm'
                }`}
              >
                <span className="flex-shrink-0 font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded h-fit select-none">
                  {segment.timestamp}
                </span>
                <textarea 
                  className="flex-1 bg-transparent resize-none outline-none text-slate-700 leading-relaxed text-lg font-sans min-h-[1.75em]"
                  rows={Math.max(1, Math.ceil(segment.text.length / 80))} 
                  value={segment.text}
                  onFocus={() => setActiveSegmentId(segment.id)}
                  onBlur={() => setActiveSegmentId(null)}
                  onChange={(e) => handleTextChange(segment.id, e.target.value)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptView;
