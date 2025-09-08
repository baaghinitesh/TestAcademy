The project must be built with:

Frontend: React (Next.js optional), TailwindCSS (for styling), Recharts (for charts), PDF.js (for embedded PDF viewing).

Backend: Node.js with Express.js.

Database: MongoDB (Atlas recommended).

Authentication: JWT-based login/signup with role-based access (student, admin).

Realtime: Socket.io (for autosave + server-authoritative timer).

Storage: AWS S3 or local file storage for PDFs.

📌 Core Features
1. Home Page

Navbar with Home, Study, Test, Dashboard, Signup/Login (responsive for mobile).

Role-based Navbar:

If user is student, hide the Admin Dashboard option.

If user is admin, show the Admin Dashboard option.

A Study Material section with cards for Class 5–10.

Clicking a class → opens subject cards (Math, Science, English, etc.).

Clicking a subject → opens sections: Notes & Books.

Each note/book is a PDF file:

Embedded view in browser (with PDF.js).

Cannot directly download until "Download PDF" button is clicked.

Provide sample PDF as demo.

2. Test Page

Cards for Class 5–10.

Click class → opens subject cards.

Click subject → opens list of tests (Test 1, Test 2, etc.).

Click test → Test Instructions page with:

1-minute countdown timer before test starts.

After countdown, test panel opens full-screen (works on desktop & mobile).

Test Panel UI:

Left side question navigation panel: shows all question numbers, status (answered, unanswered, flagged).

Main panel: shows current question with options (MCQ, single-select, multi-select).

Navigation buttons: Next, Previous, Mark for Review, Submit.

Top bar: Timer (server-authoritative, synced with backend).

Autosave answers every 10s or on selection.

Test Features:

Supports multi-select MCQs (with partial scoring if configured).

Answers stored in backend (no local-only storage).

At timeout or submission → test auto-submits.

3. Result & Analytics

After test → auto-grading based on correct answers in backend.

Show:

Total score.

Pie chart of correct vs wrong vs skipped.

Section-wise performance.

Review mode: each question shows user’s answer, correct answer, and explanation.

4. Dashboard

Student dashboard shows:

Past attempts.

Progress charts.

Subject-wise performance.

Admin dashboard (only visible to admin users):

Full CRUD management of content.

5. Admin Panel (critical requirement)

Default admin:

Name: Nitesh

Email: baaghinitesh@gmail.com

Admin login allows:

User management (view students, reset password).

Test management:

Add/Edit/Delete tests.

Upload/update questions.

Add explanations and solutions.

Question management:

Add MCQs (single/multi-select).

Upload via form or CSV/Excel import.

Notes & PDF management:

Upload/update/delete PDFs for study materials.

Assign PDFs to specific class & subject.

Toggle “view-only” vs “allow download”.

Admin panel must be fully functional — no code edits required to add/update tests or notes. Everything should be handled from the admin UI.

📌 Technical Flow & Architecture

Authentication: JWT auth with bcrypt-hashed passwords.

Roles: student, admin.

Default admin seeded at DB setup.

Role-based navbar visibility (admin vs student).

Database models:

User (name, email, passwordHash, role, class).

Class (name, subjects).

Subject (belongs to class).

Material (title, type, PDF storage path, allowDownload).

Test (title, subject, duration, questions).

Question (text, type, options, correct answers, explanation, marks).

Attempt (user, test, answers, score, analytics).

APIs:

/auth/signup, /auth/login.

/study/classes, /study/subjects/:classId, /study/materials/:subjectId.

/tests/:classId/:subjectId, /tests/:id/start, /attempts/:id/save, /attempts/:id/submit.

/admin/tests, /admin/questions, /admin/materials.

Timer:

Backend creates startAt timestamp when test starts.

Client calculates remaining time with server offset.

Prevent cheating by rejecting late submissions.

PDFs:

Stored in /uploads/pdfs (local dev) or S3 bucket (production).

Served via signed URLs for “view-only” embedding.

Download button triggers signed download link.

Charts:

Recharts for pie/bar charts.

📌 Deployment & Scaling

MVP:

Frontend: Netlify or Vercel.

Backend: Render or Railway.

DB: MongoDB Atlas free tier.

Storage: S3 free tier or local.

Scaling path:

Containerize backend (Docker).

Deploy on AWS ECS/EKS or GCP GKE.

Use Redis for socket scaling (Socket.io adapter).

CDN for PDFs.

Shard MongoDB when users/tests grow large.

📌 Deliverables

Full MERN project with clean code.

Responsive React frontend (desktop + mobile).

Role-based Navbar (Admin Dashboard visible only for admins).

Admin panel with full CRUD for tests, questions, and study materials.

Secure backend with JWT auth + role-based access.

Database seeded with:

Default admin user (Nitesh, baaghinitesh@gmail.com
).

Sample class, subject, test, questions, and study PDFs.