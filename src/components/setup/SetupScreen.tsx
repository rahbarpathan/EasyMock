import React, { useState, useRef, useEffect } from 'react';
import {
  Question,
  TestConfig,
  AnswerKeyMatchResult,
  TestResult,
  TestHistoryItem,
  TestSession,
} from '../../types';
import { extractTextFromPDF, ParseProgress } from '../../utils/parser/pdfParser';
import { extractQuestionsFromText } from '../../utils/parser/questionExtractor';
import { extractAnswerKeyFromText, matchAnswerKeyWithQuestions } from '../../utils/parser/answerKeyExtractor';
import { calculateNegativeMarkValue } from '../../utils/scoring';
import { SAMPLE_PAPERS } from '../../utils/sampleData';
import { ExtractionReviewModal } from './ExtractionReviewModal';
import { RecentHistory } from './RecentHistory';
import {
  Upload,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Settings,
  Play,
  RotateCcw,
  Zap,
  Check,
  X,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

interface SetupScreenProps {
  onStartExam: (questions: Question[], config: TestConfig) => void;
  activeSession: TestSession | null;
  onResumeActiveSession: () => void;
  onDiscardActiveSession: () => void;
  history: TestHistoryItem[];
  onSelectHistoryResult: (result: TestResult) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartExam,
  activeSession,
  onResumeActiveSession,
  onDiscardActiveSession,
  history,
  onSelectHistoryResult,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  // Mode selection: Upload vs Paste
  const [qpInputMode, setQpInputMode] = useState<'upload' | 'paste'>('upload');
  const [akInputMode, setAkInputMode] = useState<'upload' | 'paste'>('paste');

  // Question Paper State
  const [qpFile, setQpFile] = useState<File | null>(null);
  const [qpText, setQpText] = useState<string>('');
  const [qpProgress, setQpProgress] = useState<ParseProgress | null>(null);
  const [qpError, setQpError] = useState<string | null>(null);

  // Answer Key State
  const [akFile, setAkFile] = useState<File | null>(null);
  const [akText, setAkText] = useState<string>('');
  const [akProgress, setAkProgress] = useState<ParseProgress | null>(null);

  // Extracted Data
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [matchResult, setMatchResult] = useState<AnswerKeyMatchResult | null>(null);

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Test Configuration State
  const [testName, setTestName] = useState<string>('My Mock Test');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [enableNegativeMarking, setEnableNegativeMarking] = useState<boolean>(true);
  const [negativeScheme, setNegativeScheme] = useState<'none' | 'quarter' | 'third' | 'custom'>('quarter');
  const [customNegativeMarks, setCustomNegativeMarks] = useState<number>(0.25);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);

  // Optional Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(false);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(false);
  const [enableFullscreen, setEnableFullscreen] = useState<boolean>(false);
  const [confirmManualSubmission, setConfirmManualSubmission] = useState<boolean>(true);

  // Drag and Drop Dragging flags
  const [isDraggingQP, setIsDraggingQP] = useState(false);
  const [isDraggingAK, setIsDraggingAK] = useState(false);

  const qpFileInputRef = useRef<HTMLInputElement>(null);
  const akFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Question Paper File Upload
  const handleQpFileSelect = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setQpError('Please select a valid PDF file (.pdf)');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setQpError('File is too large (max 50MB)');
      return;
    }

    setQpFile(file);
    setQpError(null);

    // Auto-derive test name from file name
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTestName(cleanName);

    try {
      const { text, usedOCR } = await extractTextFromPDF(file, (p) => setQpProgress(p));
      setQpText(text);
      processQuestions(text);
    } catch (err: any) {
      console.error(err);
      setQpError('Failed to extract text from PDF. You can also paste questions directly.');
    }
  };

  // Handle Answer Key File Upload
  const handleAkFileSelect = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return;
    }
    setAkFile(file);
    try {
      const { text } = await extractTextFromPDF(file, (p) => setAkProgress(p));
      setAkText(text);
      processAnswerKey(text, extractedQuestions);
    } catch (err) {
      console.error(err);
    }
  };

  // Process text into questions
  const processQuestions = (text: string) => {
    if (!text.trim()) {
      setExtractedQuestions([]);
      return;
    }
    const negativeVal = calculateNegativeMarkValue({
      testName,
      durationMinutes,
      enableNegativeMarking,
      negativeScheme,
      customNegativeMarks,
      marksPerQuestion,
      shuffleQuestions,
      shuffleOptions,
      enableFullscreen,
      confirmManualSubmission,
    });

    const questions = extractQuestionsFromText(text, marksPerQuestion, negativeVal);
    setExtractedQuestions(questions);

    // Re-match answer key if already present
    if (akText) {
      processAnswerKey(akText, questions);
    }
  };

  // Process text into answer key
  const processAnswerKey = (text: string, currentQuestions: Question[] = extractedQuestions) => {
    if (!text.trim()) {
      setMatchResult(null);
      return;
    }
    const entries = extractAnswerKeyFromText(text);
    const { updatedQuestions, matchResult: res } = matchAnswerKeyWithQuestions(entries, currentQuestions);
    setExtractedQuestions(updatedQuestions);
    setMatchResult(res);
  };

  // Load a Pre-configured Sample Paper
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_PAPERS.find(s => s.id === sampleId);
    if (!sample) return;

    setTestName(sample.title);
    setDurationMinutes(sample.durationMinutes);
    setQpText(sample.questionRawText);
    setAkText(sample.answerKeyRawText);
    setQpFile(null);
    setAkFile(null);
    setQpInputMode('paste');
    setAkInputMode('paste');
    setQpError(null);

    const questions = extractQuestionsFromText(sample.questionRawText, marksPerQuestion, 0.25);
    const entries = extractAnswerKeyFromText(sample.answerKeyRawText);
    const { updatedQuestions, matchResult: res } = matchAnswerKeyWithQuestions(entries, questions);

    setExtractedQuestions(updatedQuestions);
    setMatchResult(res);
  };

  // When text changes in textarea
  const handleQpTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setQpText(val);
    processQuestions(val);
  };

  const handleAkTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setAkText(val);
    processAnswerKey(val);
  };

  // Build final config & trigger exam
  const handleStartExamClick = () => {
    if (extractedQuestions.length === 0) return;

    const config: TestConfig = {
      testName: testName.trim() || 'Mock Test',
      durationMinutes: Math.max(1, durationMinutes),
      enableNegativeMarking,
      negativeScheme,
      customNegativeMarks,
      marksPerQuestion,
      shuffleQuestions,
      shuffleOptions,
      enableFullscreen,
      confirmManualSubmission,
    };

    onStartExam(extractedQuestions, config);
  };

  const currentNegativeMarkVal = calculateNegativeMarkValue({
    testName,
    durationMinutes,
    enableNegativeMarking,
    negativeScheme,
    customNegativeMarks,
    marksPerQuestion,
    shuffleQuestions,
    shuffleOptions,
    enableFullscreen,
    confirmManualSubmission,
  });

  const validQuestionsCount = extractedQuestions.filter(q => Object.keys(q.options).length >= 2).length;
  const matchedKeysCount = extractedQuestions.filter(q => Boolean(q.correctAnswer)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Active Session Recovery Banner */}
      {activeSession && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-base">In-Progress Exam Session Detected</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                You have an active exam: <strong className="font-semibold">{activeSession.config.testName}</strong> with answers already saved.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={onDiscardActiveSession}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Discard
            </button>
            <button
              onClick={onResumeActiveSession}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition flex items-center"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Hero Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Client-Side CBT Mock Test Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Your Practice. Your Questions. <br className="hidden sm:inline" />
          <span className="text-indigo-600">Your Mock Test.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 font-normal">
          Upload any question paper, add its answer key, set your exam time, and start practicing in a real CBT exam interface.
        </p>

        {/* 1-Click Sample Test Chips */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Instant Demo:</span>
          {SAMPLE_PAPERS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample.id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-500" />
              <span>{sample.title.split(' ')[0]} {sample.category}</span>
              <span className="text-[10px] text-slate-400 font-normal">({sample.durationMinutes}m)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Upload Question Paper & Upload Answer Key */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION A: Upload Question Paper */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                A
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">Upload Question Paper</h2>
                <p className="text-xs text-slate-500">PDF document or paste questions</p>
              </div>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setQpInputMode('upload')}
                className={`px-2.5 py-1 rounded-md transition ${
                  qpInputMode === 'upload' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => setQpInputMode('paste')}
                className={`px-2.5 py-1 rounded-md transition ${
                  qpInputMode === 'paste' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* Mode: Upload PDF */}
          {qpInputMode === 'upload' ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingQP(true);
                }}
                onDragLeave={() => setIsDraggingQP(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingQP(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleQpFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => qpFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                  isDraggingQP
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : qpFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
                }`}
              >
                <input
                  ref={qpFileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleQpFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {qpFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="font-semibold text-slate-800 text-sm">{qpFile.name}</div>
                    <div className="text-xs text-slate-500">
                      {(qpFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQpFile(null);
                        setQpText('');
                        setExtractedQuestions([]);
                      }}
                      className="text-xs text-red-500 hover:underline font-medium inline-block mt-1"
                    >
                      Remove and replace file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      Drag & drop your question paper PDF here
                    </div>
                    <p className="text-xs text-slate-400">or click to browse your computer</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 shadow-2xs">
                      Browse PDF
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {qpProgress && qpProgress.stage !== 'completed' && (
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{qpProgress.message}</span>
                    <span>{qpProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${qpProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error state */}
              {qpError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{qpError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Mode: Paste Text */
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-xs font-semibold text-slate-700">
                Paste question text (numbered questions with options A, B, C, D):
              </label>
              <textarea
                value={qpText}
                onChange={handleQpTextChange}
                placeholder={`1. What is the capital of France?
(A) London
(B) Paris
(C) Berlin
(D) Rome

2. Which data structure follows LIFO?
(A) Queue
(B) Stack
(C) Tree
(D) Graph`}
                rows={9}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none bg-slate-50/50"
              />
            </div>
          )}

          {/* Quick Format Acceptance Guide */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Accepts formats: 1., Q1, 1), Options (A)-(D), True/False</span>
            {extractedQuestions.length > 0 && (
              <span className="font-bold text-indigo-600">
                {extractedQuestions.length} Questions Detected
              </span>
            )}
          </div>
        </div>

        {/* SECTION B: Upload Answer Key */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                B
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">Upload Answer Key</h2>
                <p className="text-xs text-slate-500">Optional for practice mode</p>
              </div>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAkInputMode('paste')}
                className={`px-2.5 py-1 rounded-md transition ${
                  akInputMode === 'paste' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Key
              </button>
              <button
                type="button"
                onClick={() => setAkInputMode('upload')}
                className={`px-2.5 py-1 rounded-md transition ${
                  akInputMode === 'upload' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload PDF
              </button>
            </div>
          </div>

          {/* Mode: Paste Answer Key */}
          {akInputMode === 'paste' ? (
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Paste answers (e.g., 1-B, 2-C, 3. A, Q4: D):</span>
                {matchResult && (
                  <span className="text-[11px] font-bold text-emerald-600">
                    {matchResult.matched} of {extractedQuestions.length} matched
                  </span>
                )}
              </label>
              <textarea
                value={akText}
                onChange={handleAkTextChange}
                placeholder={`1 - B
2 - C
3 - A
4 - D
5 - B`}
                rows={9}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none bg-slate-50/50"
              />
            </div>
          ) : (
            /* Mode: Upload PDF Key */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingAK(true);
                }}
                onDragLeave={() => setIsDraggingAK(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingAK(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleAkFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => akFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                  isDraggingAK
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : akFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/60'
                }`}
              >
                <input
                  ref={akFileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleAkFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {akFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="font-semibold text-slate-800 text-sm">{akFile.name}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAkFile(null);
                        setAkText('');
                        processAnswerKey('');
                      }}
                      className="text-xs text-red-500 hover:underline font-medium"
                    >
                      Remove key
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      Drop Answer Key PDF here
                    </div>
                    <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 shadow-2xs">
                      Browse PDF
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Status & Feedback */}
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
            {matchResult ? (
              <div className="space-y-1">
                <div className="flex items-center text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>
                    Matched {matchResult.matched} of {extractedQuestions.length} questions
                  </span>
                </div>
                {matchResult.missingInKey.length > 0 && (
                  <div className="text-slate-500 text-[11px]">
                    Questions without key: {matchResult.missingInKey.slice(0, 8).join(', ')}
                    {matchResult.missingInKey.length > 8 ? '...' : ''}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Without an answer key, you can still practice the test, but automatic scoring will be disabled.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION C: Test Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            C
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Test Configuration</h2>
            <p className="text-xs text-slate-500">Configure timer, scoring formula, and negative marking</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Test Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Test Name</label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full text-sm font-medium p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
              placeholder="e.g. UPSC Prelims Mock 1"
            />
          </div>

          {/* 2. Duration */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Test Duration (Minutes)</label>
              <span className="text-xs font-bold text-indigo-600">{durationMinutes} mins</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={360}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              {/* Quick Select Chips */}
              <div className="flex-1 flex flex-wrap gap-1.5">
                {[15, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Marks Per Question */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Marks Per Correct Answer</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={marksPerQuestion}
              onChange={(e) => setMarksPerQuestion(Math.max(0.5, parseFloat(e.target.value) || 1))}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* 4. Negative Marking Section */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Negative Marking</h3>
              <p className="text-xs text-slate-500">Deduct marks for incorrect answers (standard in CBT exams)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableNegativeMarking}
                onChange={(e) => setEnableNegativeMarking(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {enableNegativeMarking && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { id: 'none', label: 'No Negative', factor: '0' },
                { id: 'quarter', label: '1/4 Negative', factor: `-${(marksPerQuestion / 4).toFixed(2)}` },
                { id: 'third', label: '1/3 Negative', factor: `-${(marksPerQuestion / 3).toFixed(2)}` },
                { id: 'custom', label: 'Custom', factor: 'Specify' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNegativeScheme(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    negativeScheme === opt.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800">{opt.label}</div>
                  <div className="text-xs text-indigo-600 font-semibold mt-0.5">{opt.factor} per wrong</div>
                </button>
              ))}
            </div>
          )}

          {enableNegativeMarking && negativeScheme === 'custom' && (
            <div className="flex items-center space-x-3 pt-2">
              <label className="text-xs font-semibold text-slate-700">Custom Deduction Per Incorrect Answer:</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={customNegativeMarks}
                onChange={(e) => setCustomNegativeMarks(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-28 text-xs font-semibold p-2 rounded-lg border border-slate-300"
              />
            </div>
          )}

          {/* Scoring Formula Preview */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-600 font-medium">
              Scoring Rule:{' '}
              <strong className="text-emerald-700">Correct: +{marksPerQuestion}</strong> |{' '}
              <strong className="text-red-600">Incorrect: -{currentNegativeMarkVal.toFixed(2)}</strong> |{' '}
              <strong className="text-slate-600">Unanswered: 0</strong>
            </span>
            <span className="text-[11px] text-slate-400">Unanswered questions carry zero penalty</span>
          </div>
        </div>

        {/* 5. More Settings Expandable */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>More Settings (Shuffle, Fullscreen, Confirmation)</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Shuffle question order</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Shuffle answer options</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFullscreen}
                  onChange={(e) => setEnableFullscreen(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Request fullscreen on start</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmManualSubmission}
                  onChange={(e) => setConfirmManualSubmission(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ask for confirmation before manual submission</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* SECTION D: Start Test Bar & Summary */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Mock Test Summary</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-2xl font-extrabold text-white">{extractedQuestions.length}</div>
              <div className="text-xs text-indigo-200">Questions Detected</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400">{validQuestionsCount}</div>
              <div className="text-xs text-indigo-200">With Valid Options</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-blue-300">{matchedKeysCount}</div>
              <div className="text-xs text-indigo-200">Answer Keys Matched</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-300">{durationMinutes}m</div>
              <div className="text-xs text-indigo-200">Test Duration</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {extractedQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsReviewOpen(true)}
              className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-white/20"
            >
              Review Questions ({extractedQuestions.length})
            </button>
          )}

          <button
            type="button"
            disabled={extractedQuestions.length === 0}
            onClick={handleStartExamClick}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-lg transition flex items-center justify-center space-x-2 ${
              extractedQuestions.length > 0
                ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/30 cursor-pointer active:scale-98'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Generate Mock Test & Start Practicing</span>
          </button>
        </div>
      </div>

      {/* Local Test History Section */}
      <RecentHistory
        history={history}
        onSelectResult={onSelectHistoryResult}
        onClearHistory={onClearHistory}
        onDeleteHistoryItem={onDeleteHistoryItem}
      />

      {/* Extraction Review Modal */}
      <ExtractionReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        questions={extractedQuestions}
        matchResult={matchResult}
        onSaveQuestions={(updated) => setExtractedQuestions(updated)}
        onProceedToTest={handleStartExamClick}
      />
    </div>
  );
};

