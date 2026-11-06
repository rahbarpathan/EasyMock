import React from 'react';
import { TestResult } from '../../types';
import { CheckCircle2, XCircle, MinusCircle, Clock, Zap, Target, TrendingUp } from 'lucide-react';

interface ResultAnalyticsProps {
  result: TestResult;
}

export const ResultAnalytics: React.FC<ResultAnalyticsProps> = ({ result }) => {
  const totalQuestions = Number(result.totalQuestions) || 0;
  const correct = Number(result.correct) || 0;
  const incorrect = Number(result.incorrect) || 0;
  const unanswered = Number(result.unanswered) || 0;
  const attempted = Number(result.attempted) || 0;
  const timeTakenSeconds = Number(result.timeTakenSeconds) || 0;
  const accuracyPercentage = Number(result.accuracyPercentage) || 0;
  const scorePercentage = Number(result.scorePercentage) || 0;

  // Doughnut Chart Geometry (radius 60, circumference ~ 376.99)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const correctFraction = totalQuestions > 0 ? Math.max(0, correct / totalQuestions) : 0;
  const incorrectFraction = totalQuestions > 0 ? Math.max(0, incorrect / totalQuestions) : 0;
  const unansweredFraction = totalQuestions > 0 ? Math.max(0, unanswered / totalQuestions) : 0;

  const correctOffset = 0;
  const correctLength = isNaN(correctFraction) ? 0 : correctFraction * circumference;

  const incorrectOffset = -correctLength;
  const incorrectLength = isNaN(incorrectFraction) ? 0 : incorrectFraction * circumference;

  const unansweredOffset = -(correctLength + incorrectLength);
  const unansweredLength = isNaN(unansweredFraction) ? 0 : unansweredFraction * circumference;

  // Format time taken
  const formatTime = (secs: number = 0) => {
    const validSecs = isNaN(secs) || secs < 0 ? 0 : secs;
    const mins = Math.floor(validSecs / 60);
    const remSecs = validSecs % 60;
    if (mins === 0) return `${remSecs}s`;
    return `${mins}m ${remSecs}s`;
  };

  const avgTimePerQuestion = attempted > 0 ? Math.round(timeTakenSeconds / attempted) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* SVG Doughnut Performance Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center text-center">
        <h4 className="font-bold text-sm text-slate-800 mb-4 self-start">Attempt Breakdown</h4>

        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-slate-100 stroke-current"
              strokeWidth="16"
              fill="transparent"
            />
            {/* Correct slice (Emerald) */}
            {correctLength > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-emerald-500 stroke-current transition-all duration-700 ease-out"
                strokeWidth="16"
                strokeDasharray={`${correctLength} ${circumference}`}
                strokeDashoffset={correctOffset}
                fill="transparent"
                strokeLinecap="round"
              />
            )}
            {/* Incorrect slice (Rose) */}
            {incorrectLength > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-rose-500 stroke-current transition-all duration-700 ease-out"
                strokeWidth="16"
                strokeDasharray={`${incorrectLength} ${circumference}`}
                strokeDashoffset={incorrectOffset}
                fill="transparent"
              />
            )}
            {/* Unanswered slice (Slate) */}
            {unansweredLength > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-300 stroke-current transition-all duration-700 ease-out"
                strokeWidth="16"
                strokeDasharray={`${unansweredLength} ${circumference}`}
                strokeDashoffset={unansweredOffset}
                fill="transparent"
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-slate-900">{scorePercentage}%</span>
            <span className="text-[11px] font-semibold text-slate-400">Score Share</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs font-semibold">
          <div className="flex items-center space-x-1.5 text-emerald-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Correct ({correct})</span>
          </div>
          <div className="flex items-center space-x-1.5 text-rose-600">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>Wrong ({incorrect})</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span>Skipped ({unanswered})</span>
          </div>
        </div>
      </div>

      {/* Accuracy & Efficiency Meter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
        <h4 className="font-bold text-sm text-slate-800 mb-4">Accuracy & Attempt Rate</h4>

        <div className="space-y-5">
          {/* Accuracy Progress */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-slate-600 flex items-center">
                <Target className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Accuracy Rate
              </span>
              <span className="text-slate-900 font-bold">{accuracyPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, accuracyPercentage))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {correct} correct out of {attempted} attempted
            </span>
          </div>

          {/* Attempt Rate */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-slate-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Attempt Coverage
              </span>
              <span className="text-slate-900 font-bold">
                {totalQuestions > 0 ? Math.round((attempted / totalQuestions) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${totalQuestions > 0 ? (attempted / totalQuestions) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {attempted} attempted of {totalQuestions} total questions
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          Tip: High accuracy with controlled negative deduction yields the highest competitive rank.
        </div>
      </div>

      {/* Time & Pace Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
        <h4 className="font-bold text-sm text-slate-800 mb-4">Time Efficiency</h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 flex items-center mb-1">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Total Time Spent
            </span>
            <div className="text-lg font-extrabold text-slate-900">{formatTime(timeTakenSeconds)}</div>
            <span className="text-[10px] text-slate-400">Limit: {result.durationMinutes}m</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 flex items-center mb-1">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Pace Per Question
            </span>
            <div className="text-lg font-extrabold text-slate-900">{avgTimePerQuestion}s</div>
            <span className="text-[10px] text-slate-400">Avg per attempt</span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900">
          <span className="font-bold">Exam Timing: </span>
          {result.submissionType === 'auto_time_expired' ? (
            <span className="text-amber-800">Completed automatically when duration expired.</span>
          ) : (
            <span className="text-emerald-800">Submitted manually before timer expired.</span>
          )}
        </div>
      </div>
    </div>
  );
};

