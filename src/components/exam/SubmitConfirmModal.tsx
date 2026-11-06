import React from 'react';
import { Question, QuestionStatus } from '../../types';
import { AlertTriangle, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  questions: Question[];
  questionStatuses: Record<string, QuestionStatus>;
  answers: Record<string, string>;
  remainingTimeString: string;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  questions,
  questionStatuses,
  answers,
  remainingTimeString,
}) => {
  if (!isOpen) return null;

  const total = questions.length;
  let answered = 0;
  let marked = 0;

  questions.forEach(q => {
    if (answers[q.id]) answered++;
    const s = questionStatuses[q.id];
    if (s === 'marked_for_review' || s === 'answered_marked_for_review') marked++;
  });

  const unanswered = total - answered;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Submit Exam Confirmation</h3>
            <p className="text-xs text-slate-500">Remaining time: {remainingTimeString}</p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="my-5 bg-slate-50 rounded-xl p-4 border border-slate-200 divide-y divide-slate-200/80 text-xs">
          <div className="flex justify-between py-2">
            <span className="text-slate-600 font-medium">Total Questions:</span>
            <span className="font-bold text-slate-900">{total}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-emerald-700 font-medium flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Answered Questions:
            </span>
            <span className="font-bold text-emerald-700">{answered}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-rose-600 font-medium flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Unanswered Questions:
            </span>
            <span className="font-bold text-rose-600">{unanswered}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-purple-700 font-medium flex items-center">
              <Bookmark className="w-3.5 h-3.5 mr-1" />
              Marked for Review:
            </span>
            <span className="font-bold text-purple-700">{marked}</span>
          </div>
        </div>

        {unanswered > 0 && (
          <div className="mb-5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <strong>Note:</strong> You have {unanswered} unanswered question{unanswered > 1 ? 's' : ''}. Unanswered questions carry zero penalty, but you cannot change answers once submitted.
          </div>
        )}

        <p className="text-sm font-semibold text-slate-800 text-center mb-6">
          Are you sure you want to submit your test?
        </p>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            Go Back to Test
          </button>
          <button
            type="button"
            onClick={onConfirmSubmit}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition"
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
};

