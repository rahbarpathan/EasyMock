# EasyMock – Simple & Realistic Mock Test Platform

> **"Your Practice. Your Questions. Your Mock Test."**  
> *Upload any question paper, add its answer key, set your exam time, and start practicing in an authentic Computer-Based Test (CBT) environment.*

EasyMock is a responsive, single-page mock test platform designed for competitive exam aspirants (SSC, GATE, NTA, Banking, Civil Services). It allows students to upload their own question papers and answer keys (or paste them directly), configure exam parameters like duration and negative marking, attempt a timed mock test in an official CBT-style examination interface, and instantly receive a comprehensive performance report.

---

## 🚀 Key Highlights & Architectural Principles

- **100% Client-Side & Zero-Account Required:** No registration, login, databases, or cloud servers. All document parsing, OCR, and evaluation happens locally inside the user's browser.
- **Accurate PDF & Text Ingestion:** Powered by PDF.js with automated layout analysis and a Tesseract.js OCR fallback for scanned/image-based documents.
- **Robust Question & Answer-Key Parsers:**
  - Detects standard numbering styles: `1.`, `Q1:`, `1)`, `[1]`, `Question 1 -`.
  - Supports MCQs (`(A)`, `(B)`, `(C)`, `(D)`), inline options, True/False statements, and explanation blocks.
  - Matches diverse answer key formats (`1 - A`, `Q1: B`, `1. C`, `1 = D`, tabular keys) and reports missing or unmatched entries.
- **Authentic Computer-Based Test (CBT) Interface:**
  - Real-time countdown timer with 5-minute warning and 1-minute alert.
  - **Deadline-Based Timing:** Uses absolute target deadlines (`session.endTime`) so browser rendering delays, background tab throttling, or accidental page reloads never reset the clock or lose answers.
  - Question status palette matching official exam software:
    - 🟩 **Answered**
    - 🟥 **Not Answered**
    - 🟪 **Marked for Review**
    - 🟪+🟩 **Answered & Marked for Review**
    - ⬜ **Not Visited**
  - Full keyboard shortcuts (`1-4` / `A-D` for options, `ArrowLeft` / `P` for Previous, `ArrowRight` / `N` for Save & Next, `M` for Review, `C` for Clear).
  - Responsive mobile drawer for the question palette.
- **Deterministic Scoring & Negative Marking:**
  - Supports No Negative, 1/4 (-0.25), 1/3 (-0.33), and Custom penalties.
  - Strictly adheres to competitive exam rules: unanswered questions carry zero penalty.
  - Instant formula breakdown: `(Correct × Marks) - (Incorrect × Negative Marks) = Final Score`.
- **In-Depth Performance Analytics:**
  - Interactive SVG attempt breakdown doughnut chart.
  - Accuracy and attempt coverage meters.
  - Time spent per question and overall exam pace.
  - Filterable question-wise review (All, Correct, Incorrect, Unanswered, Marked for Review) with clear visual cues and original explanations.
- **Session Recovery & Local History:**
  - Auto-saves in-progress exam sessions to `localStorage`. If the user accidentally refreshes, their test resumes seamlessly.
  - Stored recent-attempt history with past scores, accuracy, and reports.
- **Printable Reports:**
  - Clean, dedicated print stylesheet for saving test reports or printing result summaries as PDF.
- **Instant Demo / 1-Click Samples:**
  - Includes pre-loaded sample mock papers (Computer Science & Engineering and General Studies) for instant testing without needing PDF files.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Document Processing:** PDF.js (`pdfjs-dist`)
- **OCR Fallback:** Tesseract.js
- **Confetti Animation:** `canvas-confetti`
- **Testing:** Vitest

---

## 📂 Project Structure

```
EasyMock/
├── public/
│   ├── favicon.svg
│   └── pdf.worker.min.mjs            # PDF.js Web Worker
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx            # CBT Header bar with shortcuts modal & fullscreen
│   │   │   └── Modal.tsx
│   │   ├── setup/
│   │   │   ├── SetupScreen.tsx       # 4-Section Setup Screen (A, B, C, D)
│   │   │   ├── ExtractionReviewModal.tsx # Question review, add/edit/delete options
│   │   │   └── RecentHistory.tsx     # Past test attempts dashboard
│   │   ├── exam/
│   │   │   ├── ExamScreen.tsx        # Authentic CBT exam interface
│   │   │   ├── QuestionPalette.tsx   # Status-coded question grid & legend
│   │   │   └── SubmitConfirmModal.tsx # Submission confirmation modal
│   │   └── results/
│   │       ├── ResultScreen.tsx      # Results overview & summary cards
│   │       ├── ResultAnalytics.tsx   # SVG doughnut & pace metrics
│   │       └── QuestionReview.tsx    # Filterable question-by-question review
│   ├── types/
│   │   └── index.ts                  # Structured models (Question, TestConfig, etc.)
│   ├── utils/
│   │   ├── parser/
│   │   │   ├── pdfParser.ts          # PDF text extractor with OCR fallback
│   │   │   ├── questionExtractor.ts  # Regex & heuristic question/option parser
│   │   │   ├── questionExtractor.test.ts
│   │   │   ├── answerKeyExtractor.ts # Answer-key matcher & validator
│   │   │   └── answerKeyExtractor.test.ts
│   │   ├── scoring.ts                # Deterministic scoring engine
│   │   ├── scoring.test.ts
│   │   ├── statusTransitions.test.ts # CBT state machine unit tests
│   │   ├── storage.ts                # Local storage & session recovery
│   │   ├── storage.test.ts
│   │   └── sampleData.ts             # Pre-configured sample mock papers
│   ├── App.tsx                       # Main application view manager
│   ├── main.tsx                      # React root
│   └── index.css                     # Tailwind CSS & print styles
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### Installation

```bash
# Clone or navigate to the repository
cd EasyMock

# Install dependencies
npm install
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Unit Tests

```bash
npm run test
```

All 21 unit tests covering parsers, answer key matching, scoring calculations, status transitions, and storage persistence will execute.

### Building for Production

```bash
npm run build
```

This compiles TypeScript and outputs production-ready assets into the `dist/` directory.

---

## 📋 Acceptance Criteria Verification

| Test Scenario | Status | Verified Functionality |
| :--- | :---: | :--- |
| **1. Upload Question Paper PDF & Answer Key PDF** | ✅ Pass | Drag-and-drop & file picker with progress bar and OCR fallback. |
| **2. Paste Questions & Paste Answer Key** | ✅ Pass | Direct text input tabs with immediate live parsing. |
| **3. Question Numbers & Options Extraction** | ✅ Pass | Handles `1.`, `Q1`, `(A)-(D)`, inline options, True/False, and explanations. |
| **4. Answer Key Mapping & Mismatch Detection** | ✅ Pass | Identifies missing keys, duplicate keys, and unmatched answers. |
| **5. Negative Marking Configurations** | ✅ Pass | Verified for No Negative, 1/4, 1/3, and Custom penalties. |
| **6. Navigation & Question Answers Retention** | ✅ Pass | Options persist when navigating via buttons or palette. |
| **7. Mark for Review & Question Statuses** | ✅ Pass | All 5 CBT statuses render accurately with live counter updates. |
| **8. Manual Submission Confirmation** | ✅ Pass | Modal shows summary of answered, unanswered, and marked questions. |
| **9. Auto-Submission on Timer Expiry** | ✅ Pass | Automatic single-trigger submission when deadline reaches zero. |
| **10. Browser Refresh Session Recovery** | ✅ Pass | Restores active test and calculates remaining time from stored deadline. |
| **11. Deterministic Scoring** | ✅ Pass | Correct marks awarded, wrong marks deducted, zero unanswered penalty. |
| **12. Retake & Create New Test** | ✅ Pass | Reset answers with fresh timer or start a new test. |
| **13. Print / Save Results** | ✅ Pass | Clean print layout hiding navigation bars. |
| **14. Responsive Layout** | ✅ Pass | Verified for desktop, tablet, and mobile screens. |

---

## 📄 License

MIT License. Built for students and educators worldwide.

