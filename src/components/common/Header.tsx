import React, { useState } from 'react';
import { BookOpen, Maximize, Minimize, HelpCircle, FileCheck, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentView: 'setup' | 'exam' | 'results';
  testTitle?: string;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, testTitle, onNavigateHome }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={currentView !== 'exam' ? onNavigateHome : undefined}
              className={`flex items-center space-x-2.5 focus:outline-hidden ${currentView !== 'exam' ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">Easy<span className="text-indigo-600">Mock</span></span>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-indigo-200/60 uppercase tracking-wider">CBT</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Competitive Exam Mock Platform</span>
              </div>
            </button>

            {testTitle && currentView !== 'setup' && (
              <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-200 ml-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam:</span>
                <span className="text-sm font-semibold text-slate-700 max-w-xs truncate">{testTitle}</span>
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2">
            {/* View Indicator Badge */}
            <div className="hidden sm:flex items-center mr-2">
              {currentView === 'setup' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <FileCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Test Setup
                </span>
              )}
              {currentView === 'exam' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                  Exam in Progress
                </span>
              )}
              {currentView === 'results' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  Report Ready
                </span>
              )}
            </div>

            {/* Help Shortcuts button */}
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Keyboard Shortcuts & Guidance"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">Exam Platform Shortcuts & Guide</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <p>
                EasyMock provides an authentic Computer-Based Test (CBT) environment designed for competitive exams like SSC, GATE, Banking, and NTA.
              </p>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Keyboard Shortcuts (during exam)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">1, 2, 3, 4</span>
                    <span className="text-slate-500">Select Option A-D</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">A, B, C, D</span>
                    <span className="text-slate-500">Select Option</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">Right Arrow / N</span>
                    <span className="text-slate-500">Save & Next</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">Left Arrow / P</span>
                    <span className="text-slate-500">Previous</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">M</span>
                    <span className="text-slate-500">Mark for Review</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">C</span>
                    <span className="text-slate-500">Clear Answer</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Auto-Save & Refresh Recovery</h4>
                <p className="text-xs text-slate-500">
                  Your exam session is continuously saved locally. If you accidentally close or refresh your tab, your test answers, statuses, and deadline will be restored automatically.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

