# JOB SCHEDULER: Distributed Job Scheduler

JOB SCHEDULER is a production-inspired, highly reliable, and clean distributed job scheduling platform. It executes asynchronous background jobs concurrently across multiple workers, supporting immediate, delayed, scheduled, recurring (cron), and batch jobs. 

This project is built as a submission for the backend engineering internship assignment.

---

## 🌟 Key Features

1. **Robust Authentication & Workspaces**: JWT-based secure user auth with logical organization and project-level isolation.
2. **Flexible Job Scheduler**: Create immediate, delayed, scheduled, recurring (cron), and batch jobs. Powered by a node-cron engine.
3. **Atomic Polling Worker**: Standalone background workers that poll queues and atomically claim jobs using `SELECT FOR UPDATE SKIP LOCKED` transaction semantics to guarantee no double-executions.
4. **Resiliency & DLQ Support**: Supports configurable retry policies (Fixed, Linear, Exponential backoffs) and automatically moves permanently failing jobs to a Dead Letter Queue (DLQ).
5. **Interactive Live Dashboard**: Built with React & Tailwind CSS v4, visualizing cluster health, active worker counts, queue pending backlogs, job explorations, execution traces, and manual retry options.
6. **Built-in Swagger Docs**: Real-time interactive OpenAPI documentation hosted directly at `/api-docs`.

---

## 🚀 Tech Stack

* **Frontend**: React.js, Tailwind CSS v4, Axios, React Router, Lucide Icons.
* **Backend**: Node.js, Express.js, JWT, Bcrypt.js, Prisma ORM.
* **Database**: PostgreSQL.
* **Engine**: Node-cron & Cron-parser.

---

## 📂 Project Directory Structure

```
distributed-job-scheduler/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma schemas & models
│   ├── src/
│   │   ├── controllers/          # Business logic handlers
│   │   ├── routes/               # API Router bindings
│   │   ├── middleware/           # Auth validation guards
│   │   ├── scheduler/            # Cron checks and scheduling enqueuer
│   │   ├── workers/              # Database job polling, claiming & processing
│   │   ├── app.js                # App init and Swagger setup
│   │   └── server.js             # Server startup entry
│   ├── .env.example              # Template config env variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbars, reusable layouts
│   │   ├── pages/                # Dashboards, Workspaces, Jobs, Workers
│   │   ├── services/             # Axios API client helper
│   │   ├── App.jsx               # Main React router and protected boundaries
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind imports
│   └── package.json
│
└── README.md                     # Main documentation
```

---

## 🛠️ Local Setup & Run Guide

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **PostgreSQL** service running locally

### 1. Database Setup
Ensure PostgreSQL is running and has a database named `distributed_job_scheduler`.
Configure your `.env` in `backend/` with the correct credentials:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/distributed_job_scheduler"
JWT_SECRET="your_secret_key"
```

From the `backend/` directory, run:
```bash
# Install dependencies
npm install

# Push database schema & generate client
npx prisma db push
```

### 2. Running the Backend
From the `backend/` directory, run:
```bash
# Start API Server in dev mode (port 5000)
npm run dev
```
Interactive API docs will be available at: **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**.

### 3. Running the Scheduler
The scheduler moves jobs from the `scheduled_jobs` table into the active execution queues when their time is due.
From the `backend/` directory in a new terminal, run:
```bash
node src/scheduler/scheduler.js
```

### 4. Running a Worker
Workers claim and run jobs from active queues concurrently.
From the `backend/` directory in a new terminal, run:
```bash
node src/workers/worker.js
```
*(You can launch multiple worker processes in parallel terminals to test distributed claiming and load distribution!)*

### 5. Running the Frontend
From the `frontend/` directory, run:
```bash
# Install dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔍 Database Design & Entity Relationships

The schema is fully normalized:
* **users**: Stores usernames, passwords (hashed), roles.
* **organizations** & **projects**: Establish tenant boundaries. An organization has projects; a project owns multiple job queues.
* **queues**: Manage status (ACTIVE/PAUSED), concurrency limits, and reference a `retry_policies` template.
* **jobs**: Core tasks with status (`QUEUED`, `SCHEDULED`, `RUNNING`, `COMPLETED`, `FAILED`, `DEAD_LETTER`).
* **scheduled_jobs**: Cron definitions/next run times for scheduled/recurring jobs.
* **job_executions** & **job_logs**: Captures step-by-step audit traces of run attempts, durations, and outputs on specific workers.
* **workers** & **worker_heartbeats**: Tracks worker availability and load metrics.
* **dead_letter_queue**: Holds records of permanently failed jobs along with failure reasons.

---

## 💡 Important Design Decisions

1. **Atomic Lock Claiming (`SELECT ... FOR UPDATE SKIP LOCKED`)**: 
   Standard database queries under race conditions cause multiple workers to claim the same job. By using a transaction containing PostgreSQL's native `FOR UPDATE SKIP LOCKED` syntax, workers claim jobs atomically and concurrently with zero overlap.
2. **Prisma BigInt JSON Serialization**: 
   Since JavaScript natively fails to serialize BigInts, a global custom serialization middleware is registered in `app.js` which parses BigInts safely.
3. **Tailwind CSS v4 (CSS-First Utility)**: 
   Leveraging the latest Tailwind v4 specifications, styling is streamlined directly inside the Vite configuration, avoiding clutter from old tailwind configuration files.
