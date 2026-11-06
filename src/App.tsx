import React, { useState, useEffect } from 'react';
import { Question, TestConfig, TestSession, TestResult, TestHistoryItem } from './types';
import { Header } from './components/common/Header';
import { SetupScreen } from './components/setup/SetupScreen';
import { ExamScreen } from './components/exam/ExamScreen';
import { ResultScreen } from './components/results/ResultScreen';
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  getTestHistory,
  clearTestHistory,
  deleteHistoryItem,
} from './utils/storage';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'setup' | 'exam' | 'results'>('setup');
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);

  // Load active session and history on startup
  useEffect(() => {
    const saved = getActiveSession();
    if (saved && !saved.isSubmitted) {
      // Check if session hasn't expired by more than 10 minutes
      if (saved.endTime > Date.now()) {
        setActiveSession(saved);
      } else {
        // Expired while away
        clearActiveSession();
      }
    }

    setHistory(getTestHistory());
  }, []);

  // Start new exam
  const handleStartExam = (questions: Question[], config: TestConfig) => {
    let finalQuestions = [...questions];

    // Optional shuffling
    if (config.shuffleQuestions) {
      finalQuestions = [...finalQuestions].sort(() => Math.random() - 0.5);
      // Renumber
      finalQuestions = finalQuestions.map((q, i) => ({ ...q, number: i + 1 }));
    }

    if (config.shuffleOptions) {
      finalQuestions = finalQuestions.map((q) => {
        const optEntries = Object.entries(q.options).sort(() => Math.random() - 0.5);
        const newOpts: Record<string, string> = {};
        const oldToNewKey: Record<string, string> = {};

        optEntries.forEach(([oldKey, val], idx) => {
          const newKey = String.fromCharCode(65 + idx);
          newOpts[newKey] = val;
          oldToNewKey[oldKey] = newKey;
        });

        const newCorrect = q.correctAnswer ? oldToNewKey[q.correctAnswer] || q.correctAnswer : null;

        return {
          ...q,
          options: newOpts,
          correctAnswer: newCorrect,
        };
      });
    }

    const durationMs = config.durationMinutes * 60 * 1000;
    const now = Date.now();
    const endTime = now + durationMs;

    const initialStatuses: Record<string, any> = {};
    if (finalQuestions.length > 0) {
      initialStatuses[finalQuestions[0].id] = 'not_answered';
    }

    const newSession: TestSession = {
      testId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      config,
      questions: finalQuestions,
      answers: {},
      questionStatuses: initialStatuses,
      currentQuestionIndex: 0,
      startTime: now,
      endTime,
      durationMs,
      isSubmitted: false,
      timeSpentPerQuestion: {},
    };

    saveActiveSession(newSession);
    setActiveSession(newSession);
    setCurrentView('exam');

    if (config.enableFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // Resume active test
  const handleResumeActiveSession = () => {
    if (activeSession) {
      setCurrentView('exam');
    }
  };

  // Discard in-progress test
  const handleDiscardActiveSession = () => {
    clearActiveSession();
    setActiveSession(null);
  };

  // Test completed
  const handleTestComplete = (result: TestResult) => {
    clearActiveSession();
    setActiveSession(null);
    setCurrentResult(result);
    setHistory(getTestHistory());
    setCurrentView('results');

    // Exit fullscreen if active
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Retake test
  const handleRetakeTest = () => {
    if (!currentResult) return;
    const questionsWithoutAnswers = currentResult.questions.map((q) => {
      const { selectedAnswer, isAttempted, isCorrect, status, timeSpentSeconds, scoreAwarded, ...rawQ } = q;
      return rawQ;
    });

    const config: TestConfig = {
      testName: currentResult.testName,
      durationMinutes: currentResult.durationMinutes,
      enableNegativeMarking: currentResult.negativeMarksPerQuestion > 0,
      negativeScheme: 'quarter',
      customNegativeMarks: currentResult.negativeMarksPerQuestion,
      marksPerQuestion: currentResult.marksPerQuestion,
      shuffleQuestions: false,
      shuffleOptions: false,
      enableFullscreen: false,
      confirmManualSubmission: true,
    };

    handleStartExam(questionsWithoutAnswers, config);
  };

  // Create new test
  const handleCreateNewTest = () => {
    clearActiveSession();
    setActiveSession(null);
    setCurrentResult(null);
    setCurrentView('setup');
  };

  // View past result from history
  const handleSelectHistoryResult = (result: TestResult) => {
    setCurrentResult(result);
    setCurrentView('results');
  };

  // Clear history
  const handleClearHistory = () => {
    clearTestHistory();
    setHistory([]);
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    deleteHistoryItem(id);
    setHistory(getTestHistory());
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header
        currentView={currentView}
        testTitle={currentView === 'exam' ? activeSession?.config.testName : currentResult?.testName}
        onNavigateHome={() => setCurrentView('setup')}
      />

      <main className="flex-1">
        {currentView === 'setup' && (
          <SetupScreen
            onStartExam={handleStartExam}
            activeSession={activeSession}
            onResumeActiveSession={handleResumeActiveSession}
            onDiscardActiveSession={handleDiscardActiveSession}
            history={history}
            onSelectHistoryResult={handleSelectHistoryResult}
            onClearHistory={handleClearHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
          />
        )}

        {currentView === 'exam' && activeSession && (
          <ExamScreen
            session={activeSession}
            onTestComplete={handleTestComplete}
          />
        )}

        {currentView === 'results' && currentResult && (
          <ResultScreen
            result={currentResult}
            onRetakeTest={handleRetakeTest}
            onCreateNewTest={handleCreateNewTest}
          />
        )}
      </main>

      {/* Footer (only visible outside exam mode) */}
      {currentView !== 'exam' && (
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="font-semibold text-slate-700">
              EasyMock • Realistic Computer-Based Exam Testing Engine
            </div>
            <div className="text-slate-400">
              100% Client-Side. No account required. All exam sessions remain locally in your browser.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;

