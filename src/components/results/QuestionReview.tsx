import React, { useState } from 'react';
import { ScoredQuestion } from '../../types';
import { CheckCircle2, XCircle, MinusCircle, Bookmark, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface QuestionReviewProps {
  questions: ScoredQuestion[];
  hasAnswerKey: boolean;
}

export const QuestionReview: React.FC<QuestionReviewProps> = ({ questions, hasAnswerKey }) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered' | 'marked'>('all');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'correct') return q.isCorrect === true;
    if (filter === 'incorrect') return q.isCorrect === false;
    if (filter === 'unanswered') return !q.isAttempted;
    if (filter === 'marked') return q.status === 'marked_for_review' || q.status === 'answered_marked_for_review';
    return true;
  });

  const currentQ = filteredQuestions[activeQuestionIndex] || filteredQuestions[0];

  const getStatusBadge = (q: ScoredQuestion) => {
    if (!hasAnswerKey) {
      return (
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
          Attempted: {q.selectedAnswer || 'None'}
        </span>
      );
    }
    if (q.isCorrect === true) {
      return (
        <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          Correct (+{q.marks.toFixed(2)})
        </span>
      );
    }
    if (q.isCorrect === false) {
      return (
        <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
          Incorrect (-{q.negativeMarks.toFixed(2)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
        <MinusCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
        Unattempted (0.00)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Review Header & Filters */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Question-by-Question Review</h3>
          <p className="text-xs text-slate-500">
            Inspect your responses, verify correct solutions, and analyze marking.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => {
              setFilter('all');
              setActiveQuestionIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({questions.length})
          </button>
          {hasAnswerKey && (
            <>
              <button
                onClick={() => {
                  setFilter('correct');
                  setActiveQuestionIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                Correct ({questions.filter(q => q.isCorrect === true).length})
              </button>
              <button
                onClick={() => {
                  setFilter('incorrect');
                  setActiveQuestionIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'incorrect'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                Incorrect ({questions.filter(q => q.isCorrect === false).length})
              </button>
            </>
          )}
          <button
            onClick={() => {
              setFilter('unanswered');
              setActiveQuestionIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'unanswered'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unanswered ({questions.filter(q => !q.isAttempted).length})
          </button>
          <button
            onClick={() => {
              setFilter('marked');
              setActiveQuestionIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'marked'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            Marked ({questions.filter(q => q.status === 'marked_for_review' || q.status === 'answered_marked_for_review').length})
          </button>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No questions in this filter category.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          {/* Question Index Sidebar / Strip */}
          <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 p-4 bg-slate-50/50 flex lg:flex-col overflow-x-auto lg:overflow-y-auto max-h-96 gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 hidden lg:block">
              Jump to Question
            </span>
            <div className="flex lg:grid lg:grid-cols-4 gap-2 w-full">
              {filteredQuestions.map((q, idx) => {
                const isCurrent = idx === activeQuestionIndex;
                let bgStyle = 'bg-white border-slate-200 text-slate-700';

                if (hasAnswerKey) {
                  if (q.isCorrect === true) bgStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
                  else if (q.isCorrect === false) bgStyle = 'bg-rose-50 border-rose-300 text-rose-800 font-bold';
                  else bgStyle = 'bg-slate-100 border-slate-200 text-slate-500';
                } else if (q.isAttempted) {
                  bgStyle = 'bg-blue-50 border-blue-200 text-blue-800 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-9 w-9 lg:w-full rounded-xl text-xs flex items-center justify-center border transition ${bgStyle} ${
                      isCurrent ? 'ring-2 ring-indigo-600 scale-105 font-bold shadow-xs' : 'hover:opacity-80'
                    }`}
                  >
                    {q.number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Review Card */}
          {currentQ && (
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentQ.number}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Question {activeQuestionIndex + 1} of {filteredQuestions.length}
                  </span>
                </div>
                <div>{getStatusBadge(currentQ)}</div>
              </div>

              {/* Question Prompt */}
              <div className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed select-text">
                {currentQ.question}
              </div>

              {/* Options Breakdown with Visual Status */}
              <div className="space-y-3">
                {Object.entries(currentQ.options).map(([key, text]) => {
                  const isUserSelection = currentQ.selectedAnswer === key;
                  const isCorrectKey = currentQ.correctAnswer === key;

                  let cardStyle = 'border-slate-200 bg-white text-slate-700';
                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
                  let feedbackTag = null;

                  if (hasAnswerKey) {
                    if (isCorrectKey) {
                      cardStyle = 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-medium';
                      badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                      feedbackTag = (
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded ml-auto">
                          Correct Solution
                        </span>
                      );
                    } else if (isUserSelection && !isCorrectKey) {
                      cardStyle = 'border-rose-400 bg-rose-50/60 text-rose-950';
                      badgeStyle = 'bg-rose-500 text-white border-rose-500';
                      feedbackTag = (
                        <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded ml-auto">
                          Your Answer (Incorrect)
                        </span>
                      );
                    }
                  } else if (isUserSelection) {
                    cardStyle = 'border-indigo-500 bg-indigo-50/60 text-indigo-950 font-medium';
                    badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
                    feedbackTag = (
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded ml-auto">
                        Your Choice
                      </span>
                    );
                  }

                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-xl border flex items-center space-x-3 transition ${cardStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center border shrink-0 ${badgeStyle}`}
                      >
                        {key}
                      </span>
                      <span className="text-sm flex-1 leading-snug">{text}</span>
                      {feedbackTag}
                    </div>
                  );
                })}
              </div>

              {/* Explanation (if present in original question data) */}
              {currentQ.explanation && (
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                  <span className="font-bold text-indigo-800 block mb-1">Explanation:</span>
                  <p className="leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              {/* Prev / Next Question in Review */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-0.5" />
                  Previous
                </button>
                <span className="text-xs text-slate-400 font-medium">
                  {activeQuestionIndex + 1} of {filteredQuestions.length}
                </span>
                <button
                  type="button"
                  disabled={activeQuestionIndex === filteredQuestions.length - 1}
                  onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

