import React from 'react';
import { Question, QuestionStatus } from '../../types';
import { Check, Bookmark, AlertCircle, Eye, Circle } from 'lucide-react';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  questionStatuses: Record<string, QuestionStatus>;
  onSelectQuestion: (index: number) => void;
  answers: Record<string, string>;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  questionStatuses,
  onSelectQuestion,
  answers,
}) => {
  // Count statuses
  let answeredCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;
  let markedCount = 0;
  let answeredMarkedCount = 0;

  questions.forEach((q) => {
    const status = questionStatuses[q.id] || 'not_visited';
    switch (status) {
      case 'answered':
        answeredCount++;
        break;
      case 'not_answered':
        notAnsweredCount++;
        break;
      case 'marked_for_review':
        markedCount++;
        break;
      case 'answered_marked_for_review':
        answeredMarkedCount++;
        break;
      case 'not_visited':
      default:
        notVisitedCount++;
        break;
    }
  });

  const getStatusBadgeStyle = (status: QuestionStatus) => {
    switch (status) {
      case 'answered':
        return 'bg-emerald-600 text-white border-emerald-700 shadow-2xs';
      case 'not_answered':
        return 'bg-rose-500 text-white border-rose-600 shadow-2xs';
      case 'marked_for_review':
        return 'bg-purple-600 text-white border-purple-700 shadow-2xs';
      case 'answered_marked_for_review':
        return 'bg-purple-700 text-white border-purple-800 ring-2 ring-emerald-400 shadow-2xs';
      case 'not_visited':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col h-full">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="font-bold text-sm text-slate-800">Question Palette</h3>
        <p className="text-[11px] text-slate-400">Click any question number to navigate</p>
      </div>

      {/* Live Status Counters */}
      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
        <div className="flex items-center space-x-2 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
          <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
            {answeredCount}
          </span>
          <span className="text-emerald-900 font-medium text-[11px]">Answered</span>
        </div>

        <div className="flex items-center space-x-2 bg-rose-50/70 p-2 rounded-xl border border-rose-100">
          <span className="w-5 h-5 rounded-md bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
            {notAnsweredCount}
          </span>
          <span className="text-rose-900 font-medium text-[11px]">Not Answered</span>
        </div>

        <div className="flex items-center space-x-2 bg-purple-50/70 p-2 rounded-xl border border-purple-100">
          <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center">
            {markedCount}
          </span>
          <span className="text-purple-900 font-medium text-[11px]">Marked Review</span>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
            {notVisitedCount}
          </span>
          <span className="text-slate-700 font-medium text-[11px]">Not Visited</span>
        </div>
      </div>

      {/* Answered & Marked for Review Counter if any */}
      {answeredMarkedCount > 0 && (
        <div className="mb-3 flex items-center space-x-2 bg-purple-50 p-2 rounded-xl border border-purple-200 text-xs">
          <span className="w-5 h-5 rounded-md bg-purple-700 text-white text-[11px] font-bold ring-2 ring-emerald-400 flex items-center justify-center">
            {answeredMarkedCount}
          </span>
          <span className="text-purple-900 font-medium text-[11px]">
            Answered & Marked for Review
          </span>
        </div>
      )}

      {/* Number Buttons Grid */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 py-1">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const status = questionStatuses[q.id] || 'not_visited';
            const isCurrent = idx === currentIndex;
            const style = getStatusBadgeStyle(status);

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`relative h-10 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${style} ${
                  isCurrent
                    ? 'ring-3 ring-indigo-500 ring-offset-2 scale-105 z-10'
                    : 'hover:opacity-90 active:scale-95'
                }`}
                title={`Question ${q.number} - Status: ${status.replace(/_/g, ' ')}`}
              >
                <span>{q.number}</span>
                {status === 'answered_marked_for_review' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="pt-3 border-t border-slate-100 mt-2 space-y-1.5 text-[11px] text-slate-500">
        <div className="font-semibold text-slate-700 mb-1">Status Legend:</div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-600 shrink-0"></span>
            <span>Answered</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0"></span>
            <span>Not Answered</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-purple-600 shrink-0"></span>
            <span>Marked Review</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300 shrink-0"></span>
            <span>Not Visited</span>
          </div>
        </div>
      </div>
    </div>
  );
};

