# HomeTask & IELTS Academic Platform — Master System Documentation

> **Complete Technical Specification, Architecture Manual & API Reference**  
> Exhaustive documentation covering every single page, route, modal, component, utility function, database table, RLS policy, and AI algorithm across the entire platform.

---

## Table of Contents
1. [System Architecture & Technology Stack](#1-system-architecture--technology-stack)
2. [Database Schema, Migrations & RLS Reference](#2-database-schema-migrations--rls-reference)
3. [Authentication, Session Persistence & Security](#3-authentication-session-persistence--security)
4. [Complete Page-by-Page Reference (Every Route & View)](#4-complete-page-by-page-reference-every-route--view)
   - [Auth & Gateway Pages](#41-auth--gateway-pages)
   - [Teacher Portal Pages](#42-teacher-portal-pages)
   - [Student Portal Pages](#43-student-portal-pages)
   - [Utility & Fallback Routes](#44-utility--fallback-routes)
5. [Complete Modal-by-Modal Reference (All 12 Modals)](#5-complete-modal-by-modal-reference-all-12-modals)
6. [Complete Component Reference (All 24 Components)](#6-complete-component-reference-all-24-components)
   - [Reading & IELTS CD Components](#61-reading--ielts-cd-components)
   - [Auth Components](#62-auth-components)
   - [Layout & Shell Components](#63-layout--shell-components)
   - [Common UI Primitives](#64-common-ui-primitives)
   - [Teacher Portal Components](#65-teacher-portal-components)
   - [Student Portal Components](#66-student-portal-components)
7. [IELTS Academic Reading Engine Specification](#7-ielts-academic-reading-engine-specification)
   - [HTML Ingestion & Automatic Answer Key Extraction](#71-html-ingestion--automatic-answer-key-extraction)
   - [Computer-Delivered (CD) Exam Simulation Interface](#72-computer-delivered-cd-exam-simulation-interface)
   - [Grading Engine & Official IELTS Band Score Calculator](#73-grading-engine--official-ielts-band-score-calculator)
8. [Complete Function-by-Function API Reference](#8-complete-function-by-function-api-reference)
   - [src/lib/gemini.js](#81-srclibgeminijs)
   - [src/lib/supabase/aiGrading.js](#82-srclibsupabaseaigradingjs)
   - [src/lib/supabase/readingTests.js](#83-srclibsupabasereadingtestsjs)
   - [src/lib/supabase/auth.js](#84-srclibsupabaseauthjs)
   - [src/lib/supabase/students.js](#85-srclibsupabasestudentsjs)
   - [src/lib/supabase/tasks.js](#86-srclibsupabasetasksjs)
   - [src/lib/supabase/assignments.js](#87-srclibsupabaseassignmentsjs)
   - [src/lib/supabase/submissions.js](#88-srclibsupabasesubmissionsjs)
   - [src/lib/supabase/storage.js](#89-srclibsupabasestoragejs)
   - [src/lib/supabase/transforms.js](#810-srclibsupabasetransformsjs)
   - [src/lib/supabase/client.js](#811-srclibsupabaseclientjs)
   - [src/utils/credentialsVault.js](#812-srcutilscredentialsvaultjs)
   - [src/utils/helpers.jsx](#813-srcutilshelpersjsx)
   - [src/utils/taskStatus.js](#814-srcutilstaskstatusjs)
   - [src/utils/dates.js](#815-srcutilsdatesjs)
   - [src/utils/statistics.js](#816-srcutilsstatisticsjs)
   - [src/context/DataContext.jsx](#817-srccontextdatacontextjsx)
9. [Supabase Edge Functions Specification](#9-supabase-edge-functions-specification)
10. [Local Development, Environment & Deployment](#10-local-development-environment--deployment)

---

## 1. System Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             React 18 SPA (Vite v8)                              │
│                                                                                 │
│   ┌────────────────────┐   ┌───────────────────┐   ┌────────────────────────┐   │
│   │   Teacher Portal   │   │  Student Portal   │   │      Auth Gateway      │   │
│   │ (Dashboard, Tasks, │   │ (Dashboard, Tasks,│   │ (Teacher/Student Auth, │   │
│   │ Reading, Reviews)  │   │ Exam CD, Results) │   │  1-Click Quick Login)  │   │
│   └─────────┬──────────┘   └─────────┬─────────┘   └───────────┬────────────┘   │
│             │                        │                         │                │
│             └────────────────┬───────┴─────────────────────────┘                │
│                              ▼                                                  │
│                     DataContext (Provider)                                      │
│       Session State · Realtime Subscriptions · Toast Notification System        │
│                              │                                                  │
└──────────────────────────────┼──────────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌───────────────────────────────┐   ┌─────────────────────────────────────────┐
│       Google Gemini API       │   │            Supabase Backend             │
│ Models: gemini-3.5-flash      │   │ - PostgreSQL 15 with Row-Level Security │
│ Fallback: gemini-3.5-flash-lite│   │ - GoTrue Auth & Triggers                │
│ - HTML Passage & QA Parser    │   │ - Storage Buckets (Task & Submissions)  │
│ - Semantic Answer Evaluator   │   │ - Realtime WebSocket Subscriptions      │
│ - Diagnostic Explanation AI   │   │ - Edge Function (grade-reading-test)    │
└───────────────────────────────┘   └─────────────────────────────────────────┘
```

### Core Technologies
- **Frontend Core**: React 18, Vite v8, React Router v6, Lucide React icons.
- **Styling Architecture**: Vanilla CSS + Glassmorphism design system (`index.css`), tailored HSL tokens, backdrop blur filters (`glass-1` to `glass-4`, `g-modal`, `g-btn`), zero Tailwind runtime lock-in.
- **State & Context**: `DataContext.jsx` providing unified multi-entity data caching, active session compatibility layer, auto-retry profile loaders, and Supabase Realtime channel subscriptions.
- **Backend Database**: Supabase PostgreSQL (`omzreoaaownshtzpqsdt.supabase.co`) with complete Row-Level Security (RLS) enforcement.
- **Artificial Intelligence**: Google Gemini API via official AI Studio REST endpoints utilizing `gemini-3.5-flash` with transparent `gemini-3.5-flash-lite` demand-spike failover.

---

## 2. Database Schema, Migrations & RLS Reference

### 2.1 Database Enums
1. `user_role`: `'teacher'`, `'student'`
2. `assignment_status`: `'not_started'`, `'in_progress'`, `'submitted'`, `'under_review'`, `'needs_revision'`, `'done'`
3. `task_type`: `'keyword'`, `'summary'`, `'vocabulary'`, `'writing'`, `'reading'`, `'listening'`, `'speaking'`, `'grammar'`, `'other'`

### 2.2 Tables & Relationships

```
 auth.users
     │ (1:1 ON DELETE CASCADE)
     ▼
 public.profiles ──(teacher_id 1:N self-ref)──► profiles (students)
     │
     ├──(1:N)──► task_templates ──(1:N)──► task_attachments
     │                  │
     │                  ▼
     ├──(1:N)──► assignments ──(1:N)──► assignment_attachments
     │                  │
     │                  ▼
     ├──(1:N)──► submissions ──(1:N)──► submission_attachments
     │
     ├──(1:N)──► reading_tests ──(1:N)──► reading_test_assignments
     │                                           │
     │                                           ▼
     └───────────────────────────────────► reading_test_submissions
```

#### 1. `profiles`
- `id` (UUID, PK, references `auth.users(id)` ON DELETE CASCADE)
- `first_name` (TEXT, NOT NULL)
- `last_name` (TEXT, NOT NULL)
- `email` (TEXT, nullable)
- `role` (`user_role`, NOT NULL)
- `teacher_id` (UUID, nullable, FK to `profiles(id)` ON DELETE SET NULL)
- `is_active` (BOOLEAN, default `true`)
- `created_at`, `updated_at` (TIMESTAMPTZ, default `now()`)
- **RLS**: Users can read their own profile; teachers can read profiles where `teacher_id = auth.uid()`.

#### 2. `task_templates`
- `id` (UUID, PK, default `gen_random_uuid()`)
- `teacher_id` (UUID, NOT NULL, FK to `profiles(id)` ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `type` (`task_type`, default `'other'`)
- `instructions` (TEXT)
- `submission_types` (JSONB, default `'["text"]'`)
- `metadata` (JSONB, default `'{}'`)
- `is_archived` (BOOLEAN, default `false`)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Teachers can manage templates where `teacher_id = auth.uid()`.

#### 3. `task_attachments`
- `id` (UUID, PK)
- `task_template_id` (UUID, FK to `task_templates(id)` ON DELETE CASCADE)
- `file_name` (TEXT, NOT NULL)
- `storage_path` (TEXT, NOT NULL)
- `file_size` (BIGINT), `mime_type` (TEXT), `created_at` (TIMESTAMPTZ)

#### 4. `assignments`
- `id` (UUID, PK)
- `task_template_id` (UUID, FK to `task_templates(id)` ON DELETE SET NULL)
- `teacher_id` (UUID, FK to `profiles(id)` ON DELETE CASCADE)
- `student_id` (UUID, FK to `profiles(id)` ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `type` (`task_type`, NOT NULL)
- `instructions` (TEXT)
- `submission_types` (JSONB)
- `deadline` (TIMESTAMPTZ, nullable)
- `status` (`assignment_status`, default `'not_started'`)
- `grade` (NUMERIC(5,2), nullable)
- `feedback` (TEXT, nullable)
- `reviewed_at` (TIMESTAMPTZ), `reviewed_by` (UUID)
- **RLS**: Teachers manage their own assignments; students read/update assignments where `student_id = auth.uid()`.

#### 5. `assignment_attachments`
- `id` (UUID, PK)
- `assignment_id` (UUID, FK to `assignments(id)` ON DELETE CASCADE)
- `file_name` (TEXT, NOT NULL)
- `storage_path` (TEXT, NOT NULL)
- `file_size` (BIGINT), `mime_type` (TEXT), `created_at` (TIMESTAMPTZ)

#### 6. `submissions`
- `id` (UUID, PK)
- `assignment_id` (UUID, FK to `assignments(id)` ON DELETE CASCADE)
- `student_id` (UUID, FK to `profiles(id)` ON DELETE CASCADE)
- `text_content` (TEXT)
- `version` (INT, default 1)
- `submitted_at`, `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Students manage submissions where `student_id = auth.uid()`; teachers read submissions for assignments they own.

#### 7. `submission_attachments`
- `id` (UUID, PK)
- `submission_id` (UUID, FK to `submissions(id)` ON DELETE CASCADE)
- `file_name` (TEXT, NOT NULL)
- `storage_path` (TEXT, NOT NULL)
- `file_size` (BIGINT), `mime_type` (TEXT), `created_at` (TIMESTAMPTZ)

#### 8. `reading_tests`
- `id` (UUID, PK, default `gen_random_uuid()`)
- `teacher_id` (UUID, NOT NULL, FK to `profiles(id)` ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `passages` (JSONB, NOT NULL) — Array of 3 passage objects containing passage titles, clean paragraph texts, and nested question definitions (1–40).
- `time_limit_mins` (INT, default 60)
- `total_questions` (INT, default 40)
- `is_archived` (BOOLEAN, default `false`)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Teachers can manage tests where `teacher_id = auth.uid()`.

#### 9. `reading_test_assignments`
- `id` (UUID, PK, default `gen_random_uuid()`)
- `reading_test_id` (UUID, NOT NULL, FK to `reading_tests(id)` ON DELETE CASCADE)
- `teacher_id` (UUID, NOT NULL, FK to `profiles(id)` ON DELETE CASCADE)
- `student_id` (UUID, NOT NULL, FK to `profiles(id)` ON DELETE CASCADE)
- `deadline` (TIMESTAMPTZ, nullable)
- `status` (TEXT, default `'assigned'`, check: `'assigned'`, `'in_progress'`, `'submitted'`, `'graded'`)
- `assigned_at`, `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Teachers manage assignments; students read assignments where `student_id = auth.uid()`.

#### 10. `reading_test_submissions`
- `id` (UUID, PK, default `gen_random_uuid()`)
- `assignment_id` (UUID, NOT NULL, FK to `reading_test_assignments(id)` ON DELETE CASCADE)
- `student_id` (UUID, NOT NULL, FK to `profiles(id)` ON DELETE CASCADE)
- `answers` (JSONB, NOT NULL) — Dictionary of student answers keyed by question ID (e.g. `{"q1":"TRUE","q2":"A",...}`).
- `score` (INT, default 0) — Raw score (0 to 40).
- `total_questions` (INT, default 40)
- `band_score` (NUMERIC(3,1), nullable) — Official IELTS Band Score (2.5 to 9.0).
- `time_spent_secs` (INT, nullable)
- `detailed_results` (JSONB, default `'[]'`) — Array of per-question breakdown objects (`questionId`, `studentAnswer`, `correctAnswer`, `isCorrect`, `explanation`).
- `ai_feedback` (TEXT, nullable) — Comprehensive AI performance summary and band appraisal.
- `submitted_at`, `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Students insert/view their own submissions; teachers view submissions for tests they assigned.

---

## 3. Authentication, Session Persistence & Security

### 3.1 GoTrue Triggers & Stored Procedures (`005_auth_helpers.sql`)
- `auto_confirm_users()`: Auto-populates `email_confirmed_at = now()` and clears confirmation tokens, guaranteeing frictionless login without manual email verification.
- `handle_new_user()`: Triggered `AFTER INSERT ON auth.users`. Synchronizes auth records with `public.profiles` and creates an identity in `auth.identities`.
- `create_student_by_teacher(p_first_name, p_last_name, p_email, p_password)`: Security-Definer RPC allowing authenticated teachers to create student accounts with cryptographically salted passwords (`crypt(p_password, gen_salt('bf'))`), assigning them to `auth.users` and `public.profiles`.
- `update_student_password_by_teacher(p_student_id, p_new_password)`: Security-Definer RPC allowing teachers to reset/update passwords of their assigned students.

### 3.2 Resilient Auth State Synchronization (`DataContext.jsx`)
- **Independent Storage Partitioning**: Teacher email is cached under `hw_remembered_teacher_email` (`teacher@ilmla.uz`); student email is cached under `hw_remembered_student_email` (`eldor@ilmla.uz`), preventing cross-contamination.
- **Fail-Safe Session Recovery**: In `initAuth` and `onAuthStateChange`, profile retrieval implements a retry backoff. If database network latency occurs during page reload, session state falls back to cached `auth.user.user_metadata`, preventing session destruction.
- **Role Guard Route Non-Bouncing**: Visiting `/teacher/login` while logged in as a student does not bounce the user to `/student/dashboard`. Instead, it presents an interactive account-switcher banner with 1-click "Sign Out" or "Dashboard" options.

---

## 4. Complete Page-by-Page Reference (Every Route & View)

### 4.1 Auth & Gateway Pages

#### 1. Teacher Login (`/teacher/login`)
- **File**: [`src/pages/auth/TeacherLogin.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/auth/TeacherLogin.jsx)
- **Subcomponents**: [`AuthCard.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/components/auth/AuthCard.jsx)
- **Access**: Public / Unauthenticated.
- **Features**:
  - Educator badge indicator with GraduationCap icon.
  - Pre-filled/remembered educator email (`teacher@ilmla.uz`).
  - Caps Lock warning detector.
  - Show/Hide password toggle.
  - Interactive "Demo Teacher Account" badge with 1-click **Quick Login** (`teacher@ilmla.uz` / `password123`).
  - Cross-role switcher link to `/student/login`.
  - Active Session Banner (if student session currently active) allowing instant logout or dashboard navigation.

#### 2. Student Login (`/student/login`)
- **File**: [`src/pages/auth/StudentLogin.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/auth/StudentLogin.jsx)
- **Subcomponents**: [`AuthCard.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/components/auth/AuthCard.jsx)
- **Access**: Public.
- **Features**:
  - Student Portal badge with BookOpen icon.
  - Pre-filled/remembered student email (`eldor@ilmla.uz`).
  - Interactive "Demo Student Account" badge with 1-click **Quick Login** (`eldor@ilmla.uz` / `password123`).
  - Switcher link to `/teacher/login`.

#### 3. Fallback Login Gateway (`/login`)
- **File**: [`src/pages/auth/Login.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/auth/Login.jsx)
- **Access**: Public.
- **Features**: Role selector cards directing users to either Teacher Login or Student Login, or redirecting active sessions to their respective dashboards.

#### 4. Forgot Password (`/teacher/forgot-password` & `/student/forgot-password`)
- **File**: [`src/pages/auth/ForgotPassword.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/auth/ForgotPassword.jsx)
- **Access**: Public.
- **Features**:
  - Role-aware header ("Reset Teacher Password" vs "Reset Student Password").
  - Form validation with email format check.
  - Calls `resetPassword(email)` via Supabase Auth.
  - Confirmation screen with resend link and return navigation.

---

### 4.2 Teacher Portal Pages

#### 5. Teacher Dashboard (`/teacher/dashboard`)
- **File**: [`src/pages/teacher/Dashboard.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/Dashboard.jsx)
- **Guard**: `TeacherRoute` (`session.role === 'TEACHER'`).
- **Features**:
  - **Quick Stats Metric Bar**: Total Students, Assigned Homeworks, Review Queue Count, Average Student Grade.
  - **Tabs System**: "Students Roster" tab and "Homework Tasks" tab.
  - **Student Views**: Toggleable Grid Cards View and Tabular Roster View.
  - **Credentials Vault Integration**:
    - "Copy Password" button on each student card.
    - "Copy Message Invite" (WhatsApp/Telegram formatted) button.
    - "Export Roster CSV" button (`downloadCredentialsCsv`).
    - "Copy All Credentials" formatted text summary button.
  - **Modals Triggered**: `AddStudentModal`, `EditPasswordModal`, `AssignStudentsModal`.

#### 6. Tasks & Library — Unified Task Hub (`/teacher/tasks`)
- **File**: [`src/pages/teacher/TaskLibrary.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/TaskLibrary.jsx) & [`src/pages/teacher/CreateTask.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/CreateTask.jsx)
- **Features**:
  - **Unified Single-Page Workflow**: Task Library and Add Task are consolidated onto one page with seamless view switching between `[ 📚 Task Library ]` and `[ ➕ Add New Task ]`.
  - **Task Library View**:
    - Reusable homework templates with status filters (`All Tasks`, `Assigned`, `Unassigned / Drafts`), type filter dropdown, and sorting options.
    - Search filter by title or instructions.
    - Clean action hierarchy: Primary `Assign` button, Secondary `View` link, and `ActionMenu` (`Duplicate Task`, `Delete Task`).
    - Quick assign modal integration (`AssignStudentsModal`).
  - **Add New Task View**:
    - Integrated directly on the page without navigating away.
    - Title, color-coded task type selector, instructions textarea.
    - Materials & Resources uploader (Web links, document files, image previews).
    - Accepted submission types chips (Text, Image, File, Audio).
    - Optional "Assign to students immediately" section with student checkboxes, search, select-all, and quick deadline presets (+1 Day, +3 Days, +1 Week, +2 Weeks).
    - "Save to library only" vs "Create & assign to students" dual actions.
    - On submission, saves and switches back to the library view automatically.

#### 8. Task Template Detail (`/teacher/tasks/:templateId`)
- **File**: [`src/pages/teacher/TaskDetail.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/TaskDetail.jsx)
- **Features**:
  - Comprehensive view of a single template.
  - Roster of all active assignments derived from this template.
  - Student progress table showing status (`not_started`, `in_progress`, `submitted`, `done`), grades, and submission timestamps.
  - Template file attachments list with direct download links.
  - **Modals Triggered**: `EditTaskModal`, `AssignStudentsModal`, `ImageZoomLightboxModal`.

#### 9. Student Profile & Performance Detail (`/teacher/students/:studentId`)
- **File**: [`src/pages/teacher/StudentDetail.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/StudentDetail.jsx)
- **Features**:
  - Student identity header with average grade pill and contact info.
  - Password & Credentials management section (Show/Copy password, Edit password).
  - Homework Assignment timeline and history.
  - **IELTS Reading Exams & Band Scores Section**:
    - Table of all assigned IELTS Academic Reading tests.
    - Band score badge (e.g. Band 8.5 Expert), raw accuracy (38/40), duration taken, and submission date.
    - Direct link to `ReadingSubmissionReview.jsx` to inspect student answers question-by-question.
  - **Modals Triggered**: `AssignStudentsModal`, `EditPasswordModal`.

#### 10. Homework Submission Review (`/teacher/submissions/:submissionId`)
- **File**: [`src/pages/teacher/SubmissionReview.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/SubmissionReview.jsx)
- **Features**:
  - Side-by-side or stacked review layout: Task instructions vs Student submitted text.
  - Submitted file attachments preview/download.
  - Grading panel: Score input (0–100), Status selector (`done`, `needs_revision`, `under_review`), and detailed teacher feedback textarea.

#### 11. Teacher Settings (`/teacher/settings`)
- **File**: [`src/pages/teacher/Settings.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/Settings.jsx)
- **Features**:
  - Tabbed interface: "Profile Information" and "Security & Password".
  - Profile editor (`first_name`, `last_name`).
  - Email update form requiring current password verification.
  - Password change form with current password verification via `verifyPassword` and `updatePassword`.

#### 12. IELTS Reading Tests Hub (`/teacher/reading-tests`)
- **File**: [`src/pages/teacher/ReadingTests.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/ReadingTests.jsx)
- **Features**:
  - Header with prominent **"Create Test with AI"** button.
  - **Metric Cards**: Total Test Templates, Active Assignments, Exams Completed, Average Band Score across all students.
  - **Dual Tabs**:
    - **Test Templates Tab**: Cards showing passage count, question count (40), duration (60m), "Assign to Students" button, and Delete button.
    - **Student Exam Results Tab**: Live table of all submitted IELTS exams with student name, test title, official IELTS Band Badge, raw score, time spent, and "Review Exam" link.
  - **Modal Triggered**: `QuickAssignModal`.

#### 13. Create IELTS Reading Test Studio (`/teacher/reading-tests/new`)
- **File**: [`src/pages/teacher/CreateReadingTest.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/CreateReadingTest.jsx)
- **Features**:
  - **Step 1: AI HTML Ingestion Studio**:
    - Drag-and-drop HTML file uploader (`.html`, `.htm`).
    - Raw HTML textarea.
    - "Load Cambridge 18 Sample Test" 1-click test button.
    - "Generate Full IELTS Test with AI" button with 3-step animated progress state.
  - **Step 2: Review, Answer Key Matrix & Assign Studio**:
    - Editable Test Title & Duration (60 mins).
    - **Answer Key Matrix (40 Questions)**: Visual grid showing all 40 questions with their extracted answers (e.g. `Q1: TRUE ✓`, `Q8: vertical farms ✓`).
    - **Inline Answer Quick-Edit**: Clicking any pill opens `InlineEditAnswerModal` to tweak the correct answer in 1 second.
    - **Passage Snapshot Tabs**: Part 1 (Q1–13), Part 2 (Q14–26), Part 3 (Q27–40) with word count and collapsible text inspector.
    - **Assign to Students Panel**: "Select All Students" chip, individual student avatar cards, and quick deadline buttons (*Tomorrow*, *In 3 Days*, *In 1 Week*).
    - Primary Action: **"Publish & Assign to Students"** or **"Save to Library"**.

#### 14. IELTS Reading Submission Review (`/teacher/reading-submissions/:submissionId`)
- **File**: [`src/pages/teacher/ReadingSubmissionReview.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/ReadingSubmissionReview.jsx)
- **Features**:
  - Official Band Score Celebration Banner with Band descriptor (e.g. "Band 7.5 — Good User"), accuracy percentage, and test duration.
  - AI Performance Appraisal & Feedback text block.
  - Filter questions by: "All (40)", "Incorrect Questions", "Correct Questions".
  - Split screen or collapsible view: Passage text on the left, student vs correct answers with AI explanations on the right.

---

### 4.3 Student Portal Pages

#### 15. Student Dashboard (`/student/dashboard`)
- **File**: [`src/pages/student/Dashboard.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/student/Dashboard.jsx)
- **Guard**: `StudentRoute` (`session.role === 'STUDENT'`).
- **Features**:
  - Greeting header with student initials.
  - Metric summary: Pending Homeworks, Completed Homeworks, Average Grade.
  - **IELTS Academic Reading Exams Card**:
    - Highlighted banner showing pending IELTS exam assignments with countdown deadline and "Start 60m IELTS Exam" button.
    - Completed IELTS exam results card showing achieved Band Score badge, raw accuracy (e.g. 36/40), and "View Results" link.
  - Regular homework tasks list grouped by urgency (Due Soon, Submitted, Done).

#### 16. Student Homework Tasks (`/student/tasks`)
- **File**: [`src/pages/student/Tasks.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/student/Tasks.jsx)
- **Features**:
  - Comprehensive list of all regular assignments.
  - Filter tabs: All, Pending, Submitted, Done.
  - Due date countdown badges and grade status.

#### 17. Student Task Detail & Submission (`/student/tasks/:assignmentId`)
- **File**: [`src/pages/student/TaskDetail.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/student/TaskDetail.jsx)
- **Features**:
  - Task instructions and teacher attachments download.
  - Submission interface: Rich text submission box and file uploader.
  - Feedback card: Displays teacher grade (0–100) and teacher feedback comments when reviewed.

#### 18. IELTS Computer-Delivered Exam Simulation (`/student/reading/:assignmentId`)
- **File**: [`src/pages/student/StudentReadingExam.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/student/StudentReadingExam.jsx)
- **Layout**: Fullscreen standalone simulation (sidebar and header hidden).
- **Features**:
  - Top bar with Test Title, Part 1 / Part 2 / Part 3 tabs, 60:00 live countdown timer with Hide/Show toggle.
  - **Split-Screen Layout**:
    - **Left Column**: Authentic Georgia serif passage typography with font size controls (Small, Medium, Large) and text highlighter / eraser tool.
    - **Right Column**: Interactive question cards with radio buttons, text inputs, and Review Flagging.
  - **Bottom Navigation Palette (1–40)**: Visual numbers colored by state (Answered = Dark, Unanswered = Gray, Flagged = Amber flag).
  - Previous / Next question navigation buttons.
  - Auto-submit trigger on timer expiration.
  - **Modals Triggered**: `SubmitExamModal`, `ExamHelpModal`.

#### 19. Student IELTS Reading Results (`/student/reading-results/:submissionId`)
- **File**: [`src/pages/student/StudentReadingResult.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/student/StudentReadingResult.jsx)
- **Features**:
  - Hero celebration banner with large official Band Badge (e.g. Band 8.0), accuracy score (36/40), and time taken.
  - AI Evaluation & Diagnostic Summary card.
  - Interactive Question Breakdown: Filter by All, Incorrect, or Correct.
  - Displays Student Answer vs Correct Answer with AI rationale explanation.

---

### 4.4 Utility & Fallback Routes

#### 20. Root Redirect (`/`)
- Redirects authenticated users to their respective portal (`/teacher/dashboard` or `/student/dashboard`). Unauthenticated users are redirected to `/student/login`.

#### 21. Pomodoro Route (`/student/pomodoro`)
- Redirects cleanly to `/student/dashboard`.

#### 22. Catch-All Unknown Routes (`*`)
- Gracefully redirects authenticated teachers to `/teacher/dashboard`, students to `/student/dashboard`, and unauthenticated users to `/student/login`.

---

## 5. Complete Modal-by-Modal Reference (All 12 Modals)

| # | Modal Name | Container / File | Trigger Event | Props / State | Purpose & Interactions |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **AddStudentModal** | [`src/pages/teacher/Dashboard.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/Dashboard.jsx) | "+ Add Student" button on Dashboard | `onClose`, form state (`firstName`, `lastName`, `email`, `password`) | Creates student account via `create_student_by_teacher` RPC, auto-stores password in credentials vault, and provides 1-click credential copying for WhatsApp/Telegram invite. |
| **2** | **EditPasswordModal** | [`src/components/teacher/EditPasswordModal.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/components/teacher/EditPasswordModal.jsx) | "Edit Password" button on student card | `student`, `onClose`, `onUpdated` | Updates student password via `update_student_password_by_teacher` RPC and synchronizes the local credentials vault. |
| **3** | **AssignStudentsModal** | [`src/components/tasks/AssignStudentsModal.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/components/tasks/AssignStudentsModal.jsx) | "Assign" button on task template or card | `template`, `students`, `existingAssignments`, `onClose`, `onAssign` | Allows selecting multiple students via checkboxes or "Select All", setting deadlines via presets (*Tomorrow*, *In 3 Days*, *Next Week*), and creating assignments. |
| **4** | **QuickAssignModal** | [`src/pages/teacher/ReadingTests.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/ReadingTests.jsx) | "Assign" button on IELTS test card | `assignModalTest`, `selectedStudentIds`, `assignDeadline` | Assigns an IELTS Academic Reading test to selected students with deadline selection. |
| **5** | **InlineEditAnswerModal** | [`src/pages/teacher/CreateReadingTest.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/CreateReadingTest.jsx) | Clicking any pill in 40-Question Answer Key Matrix | `editingAnswerQ`, `editAnswerValue` | Quick-edit modal allowing the teacher to tweak or correct any question's answer key in 1 second. |
| **6** | **SubmitExamModal** | [`src/pages/student/StudentReadingExam.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/student/StudentReadingExam.jsx) | "Finish / Submit" button in CD Exam | `showSubmitModal`, `answers`, `allQuestions` | Displays count of answered questions (e.g. "38 of 40 answered"), warns if questions are missing, and confirms submission. |
| **7** | **ExamHelpModal** | [`src/pages/student/StudentReadingExam.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/student/StudentReadingExam.jsx) | "Help" icon in CD Exam top bar | `showHelpModal` | Displays authentic IELTS CD test rules, navigation keyboard shortcuts, and question type instructions. |
| **8** | **CreateTaskModal** | [`src/components/teacher/CreateTaskModal.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/components/teacher/CreateTaskModal.jsx) | Quick create button | `onClose` | Fast template creation modal directly from dashboard view. |
| **9** | **ReviewSubmissionModal** | [`src/components/teacher/ReviewSubmissionModal.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/components/teacher/ReviewSubmissionModal.jsx) | "Review" button in table | `assignment`, `task`, `onClose` | Fast homework grading modal with grade input and feedback textarea. |
| **10** | **EditTaskModal** | [`src/pages/teacher/TaskDetail.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/TaskDetail.jsx) | "Edit Task" button in template detail | `template`, `onClose`, `onSave` | In-place modal to modify task template title, task type, and instructions. |
| **11** | **ImageZoomLightboxModal** | [`src/pages/teacher/TaskDetail.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/pages/teacher/TaskDetail.jsx) | Clicking on any image attachment | `zoomImage`, `setZoomImage` | Fullscreen lightbox modal with backdrop blur for inspecting high-resolution image materials. |
| **12** | **DemoSelectionModal** | [`src/components/layout/DemoSelection.jsx`](file:///home/eldor_firdavsov/Downloads/HomeTask-main/src/components/layout/DemoSelection.jsx) | Standalone demo switcher | None (internal router hooks) | Displays standalone interactive card for switching between Teacher Demo and Student Demo environments. |

---

## 6. Complete Component Reference (All 24 Components)

### 6.1 Reading & IELTS CD Components
1. **PassageViewer** (`src/components/reading/PassageViewer.jsx`): Renders IELTS passage text with paragraph parsing, heading extraction, bold/italic inline parsing, and responsive typography.
2. **QuestionRenderer** (`src/components/reading/QuestionRenderer.jsx`): Dynamic renderer supporting 8 IELTS question types (Multiple Choice, True/False/Not Given, Yes/No/Not Given, Short Answer, Sentence Completion, Summary Completion, Matching Headings, Matching Information) in both exam and review modes.
3. **ExamTimer** (`src/components/reading/ExamTimer.jsx`): Real-time countdown timer with color-coded warning states (Amber < 10m, Red < 2m), progress bar, monospace display, and automatic `onTimeUp` callback.
4. **ResultsCard** (`src/components/reading/ResultsCard.jsx`): Hero result card displaying official IELTS Band circle, color, descriptor, raw score, percentage, time spent, and detailed breakdown.

### 6.2 Auth Components
5. **AuthCard** (`src/components/auth/AuthCard.jsx`): Modern glassmorphism authentication card with 1-click Quick Login, Caps Lock detection, password visibility toggle, and active session switcher banner.
6. **AuthShowcase** (`src/components/auth/AuthShowcase.jsx`): Presentation side-panel for auth pages illustrating platform benefits, testimonials, and feature highlights.
7. **AuthLayout** (`src/components/auth/AuthLayout.jsx`): Responsive dual-column shell wrapping auth pages with dynamic backgrounds and blur filters.

### 6.3 Layout & Shell Components
8. **Layout** (`src/components/layout/Layout.jsx`): Main application frame providing desktop sidebar navigation, mobile top bar, slide-out drawer, scroll-to-top handler, and logout workflow.
9. **AppShell** (`src/components/layout/AppShell.jsx`): Core styling container enforcing responsive max-width boundaries and backdrop glass layers.
10. **DemoSelection** (`src/components/layout/DemoSelection.jsx`): Standalone demo picker card with quick role dispatching.

### 6.4 Common UI Primitives
11. **Button** (`src/components/common/Button.jsx`): Polymorphic button component supporting glass, primary, and ghost variants.
12. **Badge** (`src/components/common/Badge.jsx`): Visual pill indicator for status, type, and tags.
13. **ErrorBoundary** (`src/components/common/ErrorBoundary.jsx`): React error boundary catching render crashes with user-friendly recovery UI and reload button.
14. **LoadingScreen** (`src/components/common/LoadingScreen.jsx`): Fullscreen and card-level spinner with smooth pulse animation.

### 6.5 Teacher Portal Components
15. **TeacherDashboard** (`src/components/teacher/TeacherDashboard.jsx`): Dashboard layout subcomponent housing student metrics and assignment rosters.
16. **TeacherTasks** (`src/components/teacher/TeacherTasks.jsx`): Template management card list with task type badges and action buttons.
17. **TeacherAnalytics** (`src/components/teacher/TeacherAnalytics.jsx`): Visual charts and metric gauges for student performance and homework completion rates.
18. **TeacherTaskDetail** (`src/components/teacher/TeacherTaskDetail.jsx`): Detailed template breakdown with student submission status list.
19. **CreateTaskModal** (`src/components/teacher/CreateTaskModal.jsx`): Modal form for quick task template generation.
20. **ReviewSubmissionModal** (`src/components/teacher/ReviewSubmissionModal.jsx`): Modal for rapid homework assessment, grading, and feedback.
21. **EditPasswordModal** (`src/components/teacher/EditPasswordModal.jsx`): Student password update dialog with credentials vault sync.

### 6.6 Student Portal Components
22. **StudentTasks** (`src/components/student/StudentTasks.jsx`): Homework task list with status chips, deadlines, and submission action triggers.
23. **StudentTaskDetail** (`src/components/student/StudentTaskDetail.jsx`): Full view of homework assignment with instructions, attachments, and submission form.
24. **AssignStudentsModal** (`src/components/tasks/AssignStudentsModal.jsx`): Multi-student assignment dialog with bulk selection and deadline presets.

---

## 7. IELTS Academic Reading Engine Specification

### 7.1 HTML Ingestion & Automatic Answer Key Extraction
The engine accepts raw HTML files from Cambridge IELTS or teacher archives and extracts the complete test without manual form entry:

```
Raw IELTS HTML File
       │
       ├──► 1. Preprocessor (Preserves Answer Key Section at bottom)
       │
       ├──► 2. Client-Side Regex Scanner (`extractAnswerKeysFromRawHtml`)
       │       - Multi-column tables (<tr><td>1</td><td>TRUE</td><td>21</td><td>B</td></tr>)
       │       - Numbered lists (1. TRUE, 2. FALSE, 3. C, 4. keyword)
       │       - Ordered <ol> lists in solution divs
       │       - Data attributes & CSS classes ([data-answer], .answer, .correct)
       │       => Dict: { 1: "TRUE", 2: "FALSE", ..., 40: "keyword" }
       │
       ├──► 3. Gemini 3.5 Flash Model
       │       - Extracts 3 Passage Titles & clean paragraph texts
       │       - Classifies 40 questions into 8 standard IELTS question types
       │       - Generates sequential IDs (q1 to q40)
       │       - Cross-references pre-detected answer key hint
       │
       ▼
   Post-Processor: Merges Gemini output + Client Scanner keys
   => 100% Complete Test Structure with 40/40 Answer Keys populated
```

### 7.2 Computer-Delivered (CD) Exam Simulation Interface
Replicates the official British Council / IDP Computer-Delivered IELTS test environment:
- **Timer Engine**: 60-minute countdown with alert thresholds at 10 minutes (amber) and 5 minutes (red). Students can click "Hide" to toggle the countdown display.
- **Passage Typography**: Formatted with Georgia serif, optimal 1.85 line-height, paragraph labels (A, B, C...), and interactive text highlighter / eraser tools.
- **Question Navigation Palette (1–40)**: Bottom-docked sticky palette displaying question status:
  - *Answered*: Filled dark background (`#1e293b`).
  - *Unanswered*: Outlined gray background (`#f1f5f9`).
  - *Flagged for Review*: Amber flag icon and badge (`#fef3c7`).
- **Auto-Submission**: Automatically submits answers when the timer reaches 00:00.

### 7.3 Grading Engine & Official IELTS Band Score Calculator
The grading pipeline operates via dual-engine evaluation:

1. **Official IELTS Academic Band Conversion Table**:
   | Raw Score (out of 40) | IELTS Band Score | Level Descriptor |
   | :---: | :---: | :--- |
   | 39 – 40 | **9.0** | Expert User |
   | 37 – 38 | **8.5** | Very Good User (Upper) |
   | 35 – 36 | **8.0** | Very Good User |
   | 33 – 34 | **7.5** | Good User (Upper) |
   | 30 – 32 | **7.0** | Good User |
   | 27 – 29 | **6.5** | Competent User (Upper) |
   | 23 – 26 | **6.0** | Competent User |
   | 19 – 22 | **5.5** | Modest User (Upper) |
   | 15 – 18 | **5.0** | Modest User |
   | 13 – 14 | **4.5** | Limited User (Upper) |
   | 10 – 12 | **4.0** | Limited User |
   | 8 – 9 | **3.5** | Extremely Limited User |
   | 6 – 7 | **3.0** | Intermittent User |
   | 4 – 5 | **2.5** | Non User |
   | 0 – 3 | **2.0** | Did Not Attempt / Insufficient |

2. **Fuzzy String Matching & Typo Tolerance**:
   - `cleanString`: Lowercases, removes punctuation, trims extra spaces.
   - Article stripping: Strips leading `a`, `an`, `the` so `"the solar panels"` matches `"solar panels"`.
   - Number/Word equivalence: Recognizes `15%` ↔ `15 percent`, `1st` ↔ `first`, `two` ↔ `2`.
   - True/False shortcut equivalence: `T` ↔ `TRUE`, `F` ↔ `FALSE`, `NG` ↔ `NOT GIVEN`.
   - Levenshtein Distance tolerance: Permissive of 1 character typo for words ≥ 5 characters.
   - Acceptable alternatives: Evaluates against slash-separated values (e.g. `vertical farm / vertical farming`).

3. **Gemini AI Evaluator & Feedback**:
   - For short answers and summary blanks, Gemini evaluates contextual semantics.
   - Generates an explanation for every incorrect answer pointing back to the passage paragraph.
   - Produces a comprehensive Band diagnostic summary highlighting strengths and areas for vocabulary improvement.

---

## 8. Complete Function-by-Function API Reference

### 8.1 `src/lib/gemini.js`
- `callGemini(prompt, maxTokens = 8192)`: Dispatches structured JSON requests to `gemini-3.5-flash` with automatic fallback to `gemini-3.5-flash-lite`.
- `preprocessHtmlForGemini(html)`: Cleans HTML while preserving the Answer Key section at the bottom to prevent cutoff in large documents.
- `extractAnswerKeysFromRawHtml(html)`: Parses multi-column tables, numbered lists, classes, and regex patterns to extract answer keys directly from raw HTML into `{ [qNum]: answer }`.
- `parseReadingTestFromHTML(htmlContent)`: Core IELTS parser that orchestrates client-side scanning and Gemini AI extraction into structured test JSON.
- `gradeWithGemini(questions, studentAnswers, passageContext)`: Submits student answers and question keys to Gemini for semantic grading and explanatory feedback.

### 8.2 `src/lib/supabase/aiGrading.js`
- `calculateBandScore(correctCount)`: Converts raw score (0–40) to official IELTS Band (2.5–9.0).
- `getBandColor(band)`: Returns standard HSL/Hex color code for visual band badges.
- `getBandLabel(band)`: Returns official IELTS descriptor string (e.g. "Expert User").
- `levenshteinDistance(a, b)`: Computes edit distance between two strings.
- `cleanString(str)`: Normalizes casing, punctuation, and whitespace.
- `checkFuzzyMatch(studentAnswer, correctAnswer, acceptableAlternatives)`: Performs rule-based equivalence matching with typo tolerance.
- `gradeLocally(readingTest, studentAnswers)`: Client-side grading fallback calculating score, band score, and detailed per-question results.
- `generateAIFeedback(band, correctCount, totalQuestions, wrongQuestions)`: Synthesizes automated coaching feedback based on student performance.

### 8.3 `src/lib/supabase/readingTests.js`
- `getReadingTests()`: Fetches all reading tests created by the authenticated teacher.
- `getReadingTest(id)`: Fetches a single reading test by UUID.
- `createReadingTest(testData)`: Inserts a new test into `reading_tests`.
- `deleteReadingTest(id)`: Deletes a reading test (cascades to assignments/submissions).
- `assignReadingTest({ readingTestId, teacherId, studentIds, deadline })`: Creates rows in `reading_test_assignments`.
- `getTeacherReadingAssignments()`: Retrieves all test assignments for the teacher.
- `getMyReadingAssignments()`: Retrieves active/past test assignments for the logged-in student.
- `getReadingAssignment(id)`: Fetches a single assignment record.
- `getTeacherReadingSubmissions()`: Retrieves all completed reading test submissions.
- `getStudentReadingSubmissions(studentId)`: Retrieves submissions for a specific student.
- `getReadingSubmissionById(id)`: Fetches a single submission with detailed results.
- `submitReadingTestAnswers(...)`: Inserts answers into `reading_test_submissions` and updates assignment status.
- `gradeAndSubmitReadingTest({ assignmentId, studentId, readingTest, answers, timeSpentSecs })`: Executes grading (Edge Function with local fallback), records submission, and returns graded results.

### 8.4 `src/lib/supabase/auth.js`
- `signIn(email, password)`: Authenticates via Supabase GoTrue `signInWithPassword`.
- `signOut()`: Terminates active Supabase session.
- `getSession()`: Retrieves current session from storage.
- `getCurrentUser()`: Fetches current authenticated user object.
- `getProfile(userId)`: Queries `public.profiles` for user details.
- `resetPassword(email)`: Sends password reset link.
- `updatePassword(newPassword)`: Updates password for authenticated user.
- `updateEmail(newEmail)`: Updates user email and synchronizes `public.profiles`.
- `updateProfile(userId, updates)`: Updates first name, last name, or settings in `profiles`.
- `verifyPassword(email, password)`: Verifies current password before sensitive changes.
- `onAuthStateChange(callback)`: Registers auth state event subscriber.

### 8.5 `src/lib/supabase/students.js`
- `createStudent({ firstName, lastName, email, password })`: Calls `create_student_by_teacher` RPC to securely create student accounts.
- `getStudents()`: Fetches all active students assigned to the logged-in teacher.
- `getStudent(studentId)`: Fetches profile record for a single student.
- `deactivateStudent(studentId)`: Sets `is_active = false` (soft delete).
- `updateStudent(studentId, updates)`: Updates student profile fields.
- `updateStudentPassword(studentId, newPassword)`: Calls `update_student_password_by_teacher` RPC.

### 8.6 `src/lib/supabase/tasks.js`
- `getTaskTemplates()`: Queries `task_templates` with attachments for the teacher.
- `getTaskTemplate(id)`: Fetches a single task template.
- `createTaskTemplate(template, attachments)`: Creates template and inserts attachments.
- `updateTaskTemplate(id, updates)`: Updates template instructions, title, or metadata.
- `archiveTaskTemplate(id)`: Sets `is_archived = true`.

### 8.7 `src/lib/supabase/assignments.js`
- `getTeacherAssignments()`: Fetches assignments created by teacher with relations.
- `getStudentAssignments(studentId)`: Fetches assignments for a specific student.
- `getMyAssignments()`: Fetches assignments for the logged-in student.
- `getAssignment(assignmentId)`: Fetches single assignment details.
- `createAssignments(assignments)`: Batch inserts assignment records.
- `updateAssignmentStatus(assignmentId, status)`: Transitions assignment status.
- `gradeAssignment(assignmentId, grade, feedback)`: Records numeric grade and feedback.

### 8.8 `src/lib/supabase/submissions.js`
- `getTeacherSubmissions()`: Fetches all homework submissions across teacher's assignments.
- `getStudentSubmissions(studentId)`: Fetches submissions by student.
- `getAssignmentSubmissions(assignmentId)`: Fetches submissions for a given assignment.
- `createSubmission(assignmentId, studentId, textContent, files)`: Submits homework text and attachments, updating assignment status to `'submitted'`.
- `getSubmission(id)`: Retrieves single submission record.

### 8.9 `src/lib/supabase/storage.js`
- `uploadTaskAttachment(file, path)`: Uploads to `task-attachments` bucket.
- `uploadSubmissionAttachment(file, path)`: Uploads to `submission-attachments` bucket.
- `getAttachmentUrl(bucket, path)`: Generates signed or public download URL.
- `deleteAttachment(bucket, path)`: Deletes file from storage bucket.

### 8.10 `src/lib/supabase/transforms.js`
- `transformAssignment(dbRow)`: Maps database assignment schema to camelCase UI model.
- `transformTemplate(dbRow)`: Maps database template schema to UI model.
- `transformSubmission(dbRow)`: Maps database submission schema to UI model.
- `transformProfile(dbRow)`: Normalizes profile object and sets uppercase `role` (`'TEACHER'` | `'STUDENT'`).

### 8.11 `src/lib/supabase/client.js`
- `supabase`: Initialized Supabase client instance using `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` with local storage persistence and auto-refresh auth tokens.

### 8.12 `src/utils/credentialsVault.js`
- `getVault()`: Reads stored student credentials from `localStorage`.
- `saveVault(vault)`: Writes updated student credentials to `localStorage`.
- `getStudentPassword(student)`: Returns saved password or fallback seed.
- `saveStudentPassword(student, newPassword)`: Persists student password by ID and email.
- `formatStudentInvite(student, password)`: Formats Telegram/WhatsApp invite message.
- `formatAllStudentsRoster(students)`: Generates plain text student credentials roster.
- `downloadCredentialsCsv(students)`: Generates and downloads `students_roster_passwords.csv`.

### 8.13 `src/utils/helpers.jsx`
- `calcAverageGrade(studentId, assignments)`: Computes weighted average grade for a student.
- `gradeColor(grade)`: Returns HSL/Hex color based on numeric grade.
- `studentTaskCounts(studentId, assignments)`: Returns count of completed and pending tasks.
- `StatusBadge({ status })`: Renders visual pill badge for assignment status.
- `TypeChip({ type })`: Renders visual badge for task type.
- `formatDate(date)`: Formats date to `MMM D, YYYY`.
- `formatDateTime(date)`: Formats date to `MMM D, YYYY · h:mm A`.

### 8.14 `src/utils/taskStatus.js`
- `getTaskStatus(assignment, task)`: Computes unified assignment lifecycle state (`'unseen'`, `'in_progress'`, `'submitted'`, `'late_submitted'`, `'on_time'`, `'review'`, `'reviewed'`, `'overdue'`) based on submission time and task deadline.

### 8.15 `src/utils/dates.js`
- `getDeadlineCategory(deadlineStr)`: Categorizes deadline into `'overdue'`, `'today'`, `'tomorrow'`, `'next7days'`, or `'later'`.
- `getDeadlineLabel(deadlineStr)`: Returns human-friendly string label (`"Overdue"`, `"Due today"`, `"Due tomorrow"`, `"Due later"`).

### 8.16 `src/utils/statistics.js`
- `calculateCompletionRate(studentId, assignments)`: Computes percentage of completed/reviewed assignments for a student.
- `calculateOnTimeRate(studentId, assignments, tasks)`: Computes percentage of assignments submitted on or before the deadline.
- `calculateAverageScore(studentId, assignments)`: Calculates arithmetic mean of reviewed numerical scores.

### 8.17 `src/context/DataContext.jsx`
- `signInWithCredentials(email, password)`: High-level sign in orchestrator with profile loading, realtime initialization, and metadata fallback.
- `initAuth()`: Initial session hydration with retry and fallback profile logic.
- `setupRealtime(userProfile)`: Configures Supabase Realtime channel subscriptions for `assignments` and `submissions`.
- `refreshData()`: Reloads students, templates, assignments, and submissions.
- `refreshProfile()`: Reloads authenticated user profile.
- `logout()`: Cleans up subscriptions and signs out via Supabase Auth.
- `addToast(message, type)`: Dispatches floating toast notifications with auto-dismiss.

---

## 9. Supabase Edge Functions Specification

### `grade-reading-test` (`supabase/functions/grade-reading-test/index.ts`)
- **Runtime**: Deno / Supabase Edge Functions.
- **Endpoint**: `https://<project-ref>.supabase.co/functions/v1/grade-reading-test`
- **Request Headers**:
  - `Authorization: Bearer <supabase-anon-key>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "readingTest": { "passages": [ ... ] },
    "answers": { "q1": "TRUE", "q2": "A", ... },
    "timeSpentSecs": 2740
  }
  ```
- **Processing**:
  1. Compares student answers against question answer keys using fuzzy normalization.
  2. Submits ambiguous or text-based answers to Gemini AI for semantic evaluation.
  3. Calculates total correct answers (0–40) and converts to official IELTS Band (2.5–9.0).
  4. Generates question-by-question explanations and diagnostic feedback.
- **Response Body**:
  ```json
  {
    "score": 36,
    "totalQuestions": 40,
    "bandScore": 8.0,
    "detailedResults": [
      {
        "questionId": "q1",
        "studentAnswer": "TRUE",
        "correctAnswer": "TRUE",
        "isCorrect": true,
        "explanation": "Correct. Paragraph A confirms that vertical farming operates year-round."
      }
    ],
    "aiFeedback": "Strong performance across all three passages. Excellent accuracy on True/False/Not Given questions..."
  }
  ```

---

## 10. Local Development, Environment & Deployment

### Environment Variables (`.env`)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://omzreoaaownshtzpqsdt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API Key (for IELTS parsing and AI grading)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Local Development Commands
```bash
# Install dependencies
npm install

# Start development server (runs at http://localhost:5173/)
npm run dev

# Run production build validation
npm run build

# Push database schema migrations to remote Supabase
npx supabase db push
```

### Verified Demo Accounts
- **Teacher Account**: `teacher@ilmla.uz` / `password123`
- **Student Account**: `eldor@ilmla.uz` / `password123`
- Both portals feature 1-click **Quick Login** buttons on their respective login screens.
