import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, QuestionStatus, TestSession, TestResult } from '../../types';
import { scoreTestSession } from '../../utils/scoring';
import { saveActiveSession, clearActiveSession, saveTestToHistory } from '../../utils/storage';
import { QuestionPalette } from './QuestionPalette';
import { SubmitConfirmModal } from './SubmitConfirmModal';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  RotateCcw,
  CheckCircle,
  Menu,
  X,
  Send,
  Flag,
} from 'lucide-react';

interface ExamScreenProps {
  session: TestSession;
  onTestComplete: (result: TestResult) => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({ session: initialSession, onTestComplete }) => {
  const [session, setSession] = useState<TestSession>(() => {
    // If current question index has no status yet, mark as not_answered if visited
    const initStatuses = { ...initialSession.questionStatuses };
    const currentQ = initialSession.questions[initialSession.currentQuestionIndex];
    if (currentQ && !initStatuses[currentQ.id]) {
      initStatuses[currentQ.id] = initialSession.answers[currentQ.id] ? 'answered' : 'not_answered';
    }
    return {
      ...initialSession,
      questionStatuses: initStatuses,
    };
  });

  const [currentIndex, setCurrentIndex] = useState<number>(session.currentQuestionIndex);
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>(session.questionStatuses);
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>(session.timeSpentPerQuestion || {});

  // Mobile drawer state
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Time remaining calculated from deadline (session.endTime)
  const calculateRemainingSeconds = useCallback(() => {
    const diff = Math.floor((session.endTime - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [session.endTime]);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);
  const hasAutoSubmittedRef = useRef(false);
  const currentQuestionStartTimeRef = useRef(Date.now());

  const currentQuestion = session.questions[currentIndex];

  // Helper to persist session to localStorage
  const persistSession = useCallback((
    updatedIndex: number,
    updatedAnswers: Record<string, string>,
    updatedStatuses: Record<string, QuestionStatus>,
    updatedTimeSpent: Record<string, number>
  ) => {
    const updated: TestSession = {
      ...session,
      currentQuestionIndex: updatedIndex,
      answers: updatedAnswers,
      questionStatuses: updatedStatuses,
      timeSpentPerQuestion: updatedTimeSpent,
    };
    setSession(updated);
    saveActiveSession(updated);
  }, [session]);

  // Record time spent on current question when leaving it
  const recordQuestionTime = useCallback(() => {
    if (!currentQuestion) return;
    const elapsed = Math.floor((Date.now() - currentQuestionStartTimeRef.current) / 1000);
    currentQuestionStartTimeRef.current = Date.now();

    const prevSpent = timeSpent[currentQuestion.id] || 0;
    const newSpent = { ...timeSpent, [currentQuestion.id]: prevSpent + elapsed };
    setTimeSpent(newSpent);
    return newSpent;
  }, [currentQuestion, timeSpent]);

  // Submit test handler
  const executeSubmission = useCallback((submissionType: 'manual' | 'auto_time_expired') => {
    recordQuestionTime();
    clearActiveSession();

    const finalSession: TestSession = {
      ...session,
      answers,
      questionStatuses,
      timeSpentPerQuestion: timeSpent,
      isSubmitted: true,
      submissionType,
      submittedAt: Date.now(),
    };

    const result = scoreTestSession(finalSession, submissionType);
    saveTestToHistory(result);
    onTestComplete(result);
  }, [session, answers, questionStatuses, timeSpent, recordQuestionTime, onTestComplete]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        clearInterval(timer);
        executeSubmission('auto_time_expired');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateRemainingSeconds, executeSubmission]);

  // Format timer as HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Select an option for current question
  const handleSelectOption = (optionKey: string) => {
    if (!currentQuestion) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: optionKey };
    setAnswers(nextAnswers);

    // Keep status as answered or answered_marked_for_review
    const currentStatus = questionStatuses[currentQuestion.id];
    let nextStatus: QuestionStatus = 'answered';
    if (currentStatus === 'marked_for_review' || currentStatus === 'answered_marked_for_review') {
      nextStatus = 'answered_marked_for_review';
    }

    const nextStatuses = { ...questionStatuses, [currentQuestion.id]: nextStatus };
    setQuestionStatuses(nextStatuses);
    persistSession(currentIndex, nextAnswers, nextStatuses, timeSpent);
  };

  // Clear answer
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const nextAnswers = { ...answers };
    delete nextAnswers[currentQuestion.id];
    setAnswers(nextAnswers);

    const currentStatus = questionStatuses[currentQuestion.id];
    let nextStatus: QuestionStatus = 'not_answered';
    if (currentStatus === 'answered_marked_for_review' || currentStatus === 'marked_for_review') {
      nextStatus = 'marked_for_review';
    }

    const nextStatuses = { ...questionStatuses, [currentQuestion.id]: nextStatus };
    setQuestionStatuses(nextStatuses);
    persistSession(currentIndex, nextAnswers, nextStatuses, timeSpent);
  };

  // Mark for review & toggle
  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    const hasAnswer = Boolean(answers[currentQuestion.id]);
    const currentStatus = questionStatuses[currentQuestion.id];

    let nextStatus: QuestionStatus;
    if (currentStatus === 'marked_for_review' || currentStatus === 'answered_marked_for_review') {
      // Unmark
      nextStatus = hasAnswer ? 'answered' : 'not_answered';
    } else {
      // Mark
      nextStatus = hasAnswer ? 'answered_marked_for_review' : 'marked_for_review';
    }

    const nextStatuses = { ...questionStatuses, [currentQuestion.id]: nextStatus };
    setQuestionStatuses(nextStatuses);
    persistSession(currentIndex, answers, nextStatuses, timeSpent);
  };

  // Navigate to target question index
  const navigateToQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= session.questions.length || targetIndex === currentIndex) {
      return;
    }
    const updatedTime = recordQuestionTime() || timeSpent;

    // Check status of target question: if 'not_visited', turn to 'not_answered'
    const targetQ = session.questions[targetIndex];
    let updatedStatuses = { ...questionStatuses };
    if (!updatedStatuses[targetQ.id] || updatedStatuses[targetQ.id] === 'not_visited') {
      updatedStatuses[targetQ.id] = answers[targetQ.id] ? 'answered' : 'not_answered';
      setQuestionStatuses(updatedStatuses);
    }

    setCurrentIndex(targetIndex);
    setShowMobilePalette(false);
    persistSession(targetIndex, answers, updatedStatuses, updatedTime);
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (currentIndex < session.questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  // Mark for Review & Next
  const handleMarkAndNext = () => {
    handleToggleMarkForReview();
    if (currentIndex < session.questions.length - 1) {
      setTimeout(() => navigateToQuestion(currentIndex + 1), 50);
    }
  };

  // Previous
  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea or modal
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) || showConfirmModal) {
        return;
      }

      const key = e.key.toUpperCase();

      // Number keys 1, 2, 3, 4 -> Options A, B, C, D
      if (['1', '2', '3', '4'].includes(key)) {
        const letter = String.fromCharCode(64 + parseInt(key, 10));
        if (currentQuestion?.options[letter]) {
          handleSelectOption(letter);
        }
      }
      // Letters A, B, C, D
      else if (['A', 'B', 'C', 'D'].includes(key)) {
        if (currentQuestion?.options[key]) {
          handleSelectOption(key);
        }
      }
      // Right Arrow or N -> Save & Next
      else if (e.key === 'ArrowRight' || key === 'N') {
        handleSaveAndNext();
      }
      // Left Arrow or P -> Previous
      else if (e.key === 'ArrowLeft' || key === 'P') {
        handlePrevious();
      }
      // M -> Mark for Review
      else if (key === 'M') {
        handleToggleMarkForReview();
      }
      // C -> Clear Response
      else if (key === 'C') {
        handleClearResponse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, answers, questionStatuses, showConfirmModal]);

  const isLastQuestion = currentIndex === session.questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  const is5MinWarning = remainingSeconds <= 300 && remainingSeconds > 60;
  const is1MinWarning = remainingSeconds <= 60;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* CBT Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              CBT
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate max-w-[200px] sm:max-w-md">
                {session.config.testName}
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">
                Question {currentIndex + 1} of {session.questions.length}
              </span>
            </div>
          </div>

          {/* Right Header: Timer & Mobile Palette Toggle */}
          <div className="flex items-center space-x-3">
            {/* Countdown Timer with Warning states */}
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border font-mono transition-all ${
                is1MinWarning
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse font-bold ring-2 ring-rose-400'
                  : is5MinWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-800 font-semibold'
              }`}
            >
              <Clock className={`w-4 h-4 ${is1MinWarning ? 'text-rose-600' : 'text-slate-500'}`} />
              <div className="flex flex-col text-right">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-sans -mb-1 font-bold">
                  Time Left
                </span>
                <span className="text-base sm:text-lg">{formatTimer(remainingSeconds)}</span>
              </div>
            </div>

            {/* Mobile Palette Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobilePalette(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center"
              title="Open Question Palette"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full flex flex-col lg:flex-row gap-6">
        {/* Left/Main Question Display Card */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Question Meta Header */}
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold">
                Question {currentQuestion?.number || currentIndex + 1}
              </span>
              {currentQuestion?.pageNumber && (
                <span className="text-xs text-slate-400">Page {currentQuestion.pageNumber}</span>
              )}
            </div>

            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +{session.config.marksPerQuestion || 1}.00
              </span>
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                -{currentQuestion?.negativeMarks?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          {/* Question Text & Options */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
            <div className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed whitespace-pre-wrap select-text">
              {currentQuestion?.question}
            </div>

            {/* Multiple Choice Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion &&
                Object.entries(currentQuestion.options).map(([key, text]) => {
                  const isSelected = answers[currentQuestion.id] === key;

                  return (
                    <label
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                      }`}
                    >
                      {/* Radio Indicator */}
                      <div className="pt-0.5 mr-3.5 shrink-0 flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>

                      {/* Option Letter Badge & Text */}
                      <div className="flex-1 flex items-start space-x-2 text-sm sm:text-base">
                        <span className={`font-bold shrink-0 ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                          ({key})
                        </span>
                        <span className={`leading-snug ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {text}
                        </span>
                      </div>

                      {/* Keyboard shortcut hint */}
                      <span className="hidden sm:inline-block text-[11px] font-mono text-slate-300 ml-2 pt-0.5">
                        [{key}]
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Bottom Action Bar for Current Question */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleToggleMarkForReview}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition flex items-center space-x-1.5 ${
                  questionStatuses[currentQuestion?.id || ''] === 'marked_for_review' ||
                  questionStatuses[currentQuestion?.id || ''] === 'answered_marked_for_review'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                }`}
                title="Mark for Review (Shortcut: M)"
              >
                <Bookmark className="w-4 h-4" />
                <span>Mark for Review</span>
              </button>

              <button
                type="button"
                disabled={!answers[currentQuestion?.id || '']}
                onClick={handleClearResponse}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Clear Selected Answer (Shortcut: C)"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isFirstQuestion}
                onClick={handlePrevious}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                Previous
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition flex items-center"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="ml-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Exam</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar Desktop Question Palette */}
        <div className="hidden lg:block w-80 shrink-0">
          <QuestionPalette
            questions={session.questions}
            currentIndex={currentIndex}
            questionStatuses={questionStatuses}
            onSelectQuestion={navigateToQuestion}
            answers={answers}
          />
        </div>
      </div>

      {/* Mobile Collapsible Question Palette Drawer */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setShowMobilePalette(false)}
          />
          <div className="relative ml-auto w-80 max-w-full bg-white h-full shadow-2xl p-4 flex flex-col z-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Question Palette</h3>
              <button
                onClick={() => setShowMobilePalette(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-2">
              <QuestionPalette
                questions={session.questions}
                currentIndex={currentIndex}
                questionStatuses={questionStatuses}
                onSelectQuestion={navigateToQuestion}
                answers={answers}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Submission Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirmSubmit={() => {
          setShowConfirmModal(false);
          executeSubmission('manual');
        }}
        questions={session.questions}
        questionStatuses={questionStatuses}
        answers={answers}
        remainingTimeString={formatTimer(remainingSeconds)}
      />
    </div>
  );
};

