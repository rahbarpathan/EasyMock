import React from 'react';
import { TestHistoryItem, TestResult } from '../../types';
import { Clock, Award, Trash2, ArrowUpRight, CheckCircle2, History } from 'lucide-react';

interface RecentHistoryProps {
  history: TestHistoryItem[];
  onSelectResult: (result: TestResult, historyItem?: TestHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const RecentHistory: React.FC<RecentHistoryProps> = ({
  history,
  onSelectResult,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  if (history.length === 0) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Recent Test Attempts</h3>
            <p className="text-xs text-slate-500">Stored locally in your browser</p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-red-600 flex items-center transition"
          title="Clear all stored history"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Clear History
        </button>
      </div>

      <div className="mt-4 divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {history.map((item) => {
          const scorePercent = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;
          const isGoodScore = scorePercent >= 60;

          return (
            <div
              key={item.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{item.testName}</h4>
                  {item.submissionType === 'auto_time_expired' && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-medium px-1.5 py-0.5 rounded border border-amber-200">
                      Auto-submitted
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(item.date)}
                  </span>
                  <span>•</span>
                  <span>{item.totalQuestions} Questions</span>
                  <span>•</span>
                  <span>{item.durationMinutes} min limit</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-auto">
                <div className="text-right">
                  <div className="flex items-center space-x-1.5 justify-end">
                    <span className={`text-sm font-bold ${isGoodScore ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {item.score}
                    </span>
                    <span className="text-xs text-slate-400">/ {item.maxScore}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Acc: <strong className="text-slate-700">{item.accuracy}%</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onSelectResult(item.resultData || (item as unknown as TestResult), item)}
                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-semibold text-xs flex items-center transition cursor-pointer"
                    title="View Performance Analysis"
                  >
                    <span>View Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    title="Remove entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

