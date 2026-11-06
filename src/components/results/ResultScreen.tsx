import React, { useEffect } from 'react';
import { TestResult } from '../../types';
import { ResultAnalytics } from './ResultAnalytics';
import { QuestionReview } from './QuestionReview';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  PlusCircle,
  Printer,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ResultScreenProps {
  result: TestResult;
  onRetakeTest: () => void;
  onCreateNewTest: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRetakeTest,
  onCreateNewTest,
}) => {
  const marksPerQ = typeof result.marksPerQuestion === 'number' && !isNaN(result.marksPerQuestion) ? result.marksPerQuestion : 1;
  const negMarksPerQ = typeof result.negativeMarksPerQuestion === 'number' && !isNaN(result.negativeMarksPerQuestion) ? result.negativeMarksPerQuestion : 0;
  const correctCount = Number(result.correct) || 0;
  const incorrectCount = Number(result.incorrect) || 0;
  const unansweredCount = Number(result.unanswered) || 0;
  const finalScoreVal = Number(result.finalScore) || 0;
  const maxScoreVal = Number(result.maxScore) || 0;
  const accuracyVal = Number(result.accuracyPercentage) || 0;
  const scorePercentVal = Number(result.scorePercentage) || 0;

  // Trigger celebratory confetti on good score
  useEffect(() => {
    if (result.hasAnswerKey && accuracyVal >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback if canvas not available
      }
    }
  }, [result, accuracyVal]);

  const handlePrint = () => {
    window.print();
  };

  const formatSubmittedDate = (timestamp?: number) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';
    try {
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Submission Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Exam Result Report</span>
            <span>•</span>
            <span>{formatSubmittedDate(result.submittedAt)}</span>
            {result.submissionType === 'auto_time_expired' ? (
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                Auto Submitted – Time Expired
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                Submitted Manually
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {result.testName || 'Mock Test Report'}
          </h1>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center space-x-2.5 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-2xs"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={onRetakeTest}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Test</span>
          </button>
          <button
            type="button"
            onClick={onCreateNewTest}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center space-x-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Mock Test</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards (7 core metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Final Score */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-600 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold">
            <span>FINAL SCORE</span>
            <Award className="w-4 h-4 text-amber-300" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {finalScoreVal}
            </span>
            <span className="text-indigo-200 text-sm ml-1">/ {maxScoreVal}</span>
          </div>
          <div className="text-xs text-indigo-200 font-medium">
            Score Percentage: <strong className="text-white font-bold">{scorePercentVal}%</strong>
          </div>
        </div>

        {/* 2. Accuracy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accuracy</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
            {accuracyVal}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Of attempted answers</span>
        </div>

        {/* 3. Total Questions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
            {result.totalQuestions || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Questions in paper</span>
        </div>

        {/* 4. Correct */}
        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Correct</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 my-1">
            {correctCount}
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">+{(correctCount * marksPerQ).toFixed(2)} marks</span>
        </div>

        {/* 5. Incorrect */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/20 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Incorrect</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 my-1">
            {incorrectCount}
          </div>
          <span className="text-[11px] text-rose-800 font-medium">
            -{ (incorrectCount * negMarksPerQ).toFixed(2) } marks
          </span>
        </div>

        {/* 6. Unanswered */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unanswered</span>
            <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-600 my-1">
            {unansweredCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">0.00 penalty</span>
        </div>
      </div>

      {/* Scoring Formula Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-700 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
          <span>Scoring Formula & Calculation</span>
        </div>
        <div className="font-mono bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 overflow-x-auto">
          Final Score = (Correct × Marks Per Question) - (Incorrect × Negative Marks)
          <br />
          Final Score = ({correctCount} × {marksPerQ.toFixed(2)}) - ({incorrectCount} × {negMarksPerQ.toFixed(2)})
          = {(correctCount * marksPerQ).toFixed(2)} - {(incorrectCount * negMarksPerQ).toFixed(2)}
          = <strong className="text-indigo-600 font-bold">{finalScoreVal}</strong>
        </div>
        <p className="text-[11px] text-slate-500">
          Unanswered questions ({unansweredCount}) are neither awarded nor penalized.
        </p>
      </div>

      {/* Visual Analytics */}
      <ResultAnalytics result={result} />

      {/* Question-wise Review with Filters */}
      <QuestionReview
        questions={result.questions}
        hasAnswerKey={result.hasAnswerKey}
      />

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-slate-900 text-base">Practice makes perfect</h3>
          <p className="text-xs text-slate-500">
            Retake this mock to improve your speed and eliminate incorrect attempts, or upload a new paper.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onRetakeTest}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Retake Same Test</span>
          </button>
          <button
            type="button"
            onClick={onCreateNewTest}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Mock Test</span>
          </button>
        </div>
      </div>
    </div>
  );
};

