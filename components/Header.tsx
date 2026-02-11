'use client';

import React from 'react';
import { FileVideo } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-brand-500 to-cyan-500 rounded-lg shadow-md">
            <FileVideo className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Transcript<span className="text-brand-600">AI</span>
          </h1>
        </div>
        {/* <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-semibold text-xs">
            Powered by Gemini
          </span>
        </div> */}
      </div>
    </header>
  );
};

export default Header;
