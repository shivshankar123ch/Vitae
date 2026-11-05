python -m pip install -r requirements.txt

python -m uvicorn main:app --reload

Configure the database connection in the project-root `.env` file using
`DATABASE_URL`. The database named in that URL must already exist in PostgreSQL.
An operating-system `DATABASE_URL` environment variable takes precedence over
the value in `.env`.

On Windows, activate the project virtual environment before installing
dependencies or starting the app:

```powershell
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The public `GET /public/stats` endpoint returns the live homepage totals:
registered student accounts, registered recruiter accounts, active non-blacklisted
companies, and all posted drives. The frontend displays these database counts
directly; they are not seeded marketing estimates.

Student registration creates the corresponding profile row, and startup
backfills profile rows for existing registered accounts. The authenticated
`PUT /students/profile/me` endpoint saves profile fields, structured profile
details, and experience entries to the database. Resume uploads (PDF, DOC, or
DOCX; maximum 10 MB) are stored as binary data in the `students.resume_data`
column, with filename and content type metadata; the authenticated
`GET /students/profile/me/resume` endpoint downloads the database copy. Resume
files are also retained under `/uploads/resumes/` for compatibility with
existing links, and startup backfills database copies for existing resume files.

Recruiter feedback is available from `GET /public/feedback`. A signed-in
recruiter can post a comment to `POST /public/feedback` using multipart form
fields `comment` and `photo` (JPEG, PNG, GIF, or WebP; maximum 5 MB).
The API associates each post with the recruiter account from its access token;
uploaded photos are served from `/uploads/recruiter-feedback/`.

The frontend is gated by an email OTP check before any page is shown. Configure
`SMTP_KEY` with a Brevo API key and `SMTP_FROM_EMAIL` with a sender address
verified in Brevo. `SMTP_KEY` is used as an API key; no SMTP connection is
made. Set `OTP_SESSION_SECRET` to a separate random secret of at least 32
characters in the backend `.env` file (see `.env.example`). OTP challenges
expire after five minutes, have a six-digit code and a five-attempt limit, and
are rate-limited per email address. Only hashed email addresses and OTPs are
stored for each challenge. Successful verification sets an HttpOnly
verification cookie for 12 hours.
`CORS_ORIGINS` must include the frontend origin; use `OTP_COOKIE_SECURE=true`
when serving over HTTPS. The frontend API base URL can be set with
`REACT_APP_API_BASE_URL`; for local development it defaults to
`http://localhost:8000`.

The homepage founder galaxy loads its portrait from
`BRD/uploads/founder/founder-photo.jpg`, served at
`/uploads/founder/founder-photo.jpg`. Place the founder photo at that path
and refresh the homepage; the galaxy and motion effects work without the photo.

Recruiter plans use Razorpay Checkout. Set `RAZORPAY_KEY_ID` and
`RAZORPAY_KEY_SECRET` in the backend `.env` file (use Razorpay test-mode keys
for testing; see `.env.example`). Keep the secret private and restart the
backend after adding the keys. Without both keys, checkout returns a clear
configuration error and no plan is activated. Orders are created and verified
by the backend; Applied Students
remain unavailable until Razorpay confirms a captured payment. Both
`GET /recruiter/applied-students` and the recruiter student-list endpoint
`GET /students/students` require an active paid plan. The applied-student
response includes saved employee profile details, and resume downloads through
`GET /students/students/{student_id}/resume` also require an active paid plan.
Resume files under `/uploads/resumes/` are protected by the same paid-plan
check. Monthly plans grant 30 days of access, annual plans grant 365 days, and
Pay as You Go grants 30 days.
The initial annual prices are 12 months at 40% of the monthly rates; checkout
uses the annual prices currently saved in the plan catalog.

Recruiter pricing is served from the `recruiter_plans` database table. The
first request to `GET /recruiter/billing/plans` seeds the existing plan
catalog if the table is empty. Set `PLAN_ADMIN_USERNAME` and
`PLAN_ADMIN_PASSWORD` in the backend `.env` file to provision the initial plan
administrator. Sign in at `POST /recruiter/admin/token` using form fields
`username` and `password`, then authorize with the returned bearer token in
`GET /recruiter/admin/plans` or `PUT /recruiter/admin/plans`. The PUT endpoint
replaces the catalog and manages plan prices, credits, seats, visibility,
salary limits, and AI/sourcing feature availability. Checkout amounts are
read from the same database catalog. Set `PLAN_ADMIN_JWT_SECRET` to a separate,
long random secret; admin tokens use this key and are not signed with the
recruiter token key. Use `/docs` to submit the complete plan list to the PUT
endpoint. Each plan includes `name`, `subtitle`, `sort_order`, `is_active`,
`featured`, `job_postings`, `salary_limit`, `monthly_unlock_credits`,
`monthly_price_rupees`, `monthly_billing_label`, `annual_unlock_credits`,
`annual_price_rupees`, `recruiter_seats`, and `features`. Feature keys are
`zero_shot_ai_matching`, `multi_channel_sourcing`, `full_resume_preview`, and
`priority_job_visibility`; set each to `true` or `false`.