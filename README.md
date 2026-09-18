# AI Interview Prep Kit Platform 🚀

A full-stack, monorepo application that turns any job description and company website URL into a personalized, structured interview preparation kit — including company intelligence brief, role breakdown, categorised question bank, active-recall flashcards, and a deterministic day-by-day study schedule.

---

## 📋 Table of Contents
1. [Core Features & Architecture](#core-features--architecture)
2. [Quickstart & Setup](#quickstart--setup)
3. [Deployment Options](#deployment-options)
4. [Batch Evaluation CLI](#batch-evaluation-cli)
5. [Scraping Engine & Anti-Bot Strategy](#scraping-engine--anti-bot-strategy)
6. [State Management & Section Regeneration](#state-management--section-regeneration)
7. [Deterministic Scheduling & Coverage Guarantee](#deterministic-scheduling--coverage-guarantee)
8. [Testing](#testing)

---

## 🚢 Deployment Options

Complete deployment configuration files are included for containerized and cloud deployments:

- **Docker Compose**: Run `docker compose up -d --build` for one-command local/VPS deployment.
- **Render.com**: `render.yaml` pre-configured for Express API backend.
- **Vercel**: `apps/web/vercel.json` pre-configured for Next.js frontend.
- **Detailed Deployment Guide**: See [docs/DEPLOYMENT.md](file:///home/mukesh-kumar/Mukeshkumar/Work/Learning/agents/jobprepassistant/docs/DEPLOYMENT.md) for step-by-step cloud deployment instructions.

---

## 🏗️ Core Features & Architecture

Built with a modern monorepo architecture powered by **Turborepo**:
- **`apps/web`**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide icons, SSE live progress streaming.
- **`apps/api`**: Express.js, TypeScript, Mongoose (MongoDB Atlas), Cheerio scraping engine, Google Gemini 2.5 Flash API client.
- **`packages/shared`**: Shared TypeScript types, Zod schemas for runtime validation, and referential integrity checkers.

### Key Highlights
- **SSRF-Safe Scraping Engine**: Validates inputs, parses `robots.txt` rules, enforces rate limits per domain, and heuristics-ranks URLs without LLM overhead.
- **Multi-Pass LLM Pipeline**: Extracts requirements, generates categorized questions, and runs automated secondary passes to eliminate coverage gaps.
- **State Preservation on Regeneration**: Editing a question, flashcard, or brief marks it as `pinned`. Regenerating a category replaces only unpinned items.
- **Deterministic Schedule Allocator**: Pure mathematical distribution of topics across requested days available. Harder materials land earlier. Integer minutes guaranteed.
- **Weak Spots Report**: Interactive practice mode tracks 1-5 confidence scores and generates targeted weakness breakdown by requirement.

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Node.js**: v18.x or v20.x or higher
- **MongoDB**: Running instance or MongoDB Atlas Connection URI
- **Google Gemini API Key**: Free tier or paid key (`GEMINI_API_KEY`)

### Installation & Local Run

1. **Clone & Install Dependencies:**
   ```bash
   git clone <repository-url>
   cd jobprepassistant
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
   Fill in the required credentials:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/jobprepassistant
   JWT_SECRET=your_super_secret_jwt_key_here
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

3. **Build Shared Packages:**
   ```bash
   npm run build --workspace=@jobprep/shared
   ```

4. **Run Development Mode:**
   ```bash
   npm run dev
   ```
   - Frontend UI: `http://localhost:3000`
   - Express Backend API: `http://localhost:3001`

---

## ⚡ Batch Evaluation CLI

As mandated in Section 9 of the brief, you can batch generate prep kits from a JSON input file:

### Command Format
```bash
npm run evaluate -- --input <path-to-cases.json> --output <path-to-kits.json>
```

### Input File Format (`cases.json`)
```json
[
  {
    "id": "case-01",
    "jd": "Senior Engineer job description text...",
    "company_url": "https://posthog.com",
    "days": 5
  }
]
```

### Output File Format (`kits.json`)
Conforms strictly to Appendix B JSON schema:
```json
{
  "version": "1.0",
  "generated_at": "2026-09-18T13:30:00.000Z",
  "kits": [
    {
      "id": "case-01",
      "status": "ok",
      "kit": { ... },
      "error": null
    }
  ]
}
```

---

## 🕸️ Scraping Engine & Anti-Bot Strategy

1. **SSRF Protection**: `urlValidator.ts` blocks private/loopback IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS metadata endpoints).
2. **Robots.txt Compliance**: Cached parsing of domain `robots.txt` respects `User-agent`, disallowed paths, and `crawl-delay`.
3. **Deterministic Heuristic Link Ranker**: Rates internal homepage links using keyword weighting (`careers`, `about`, `engineering`, `jobs`, `culture`) to select the top 4 most informative pages without wasting LLM tokens.
4. **Resilient Fetching**: Automatic retry with exponential backoff (up to 3 retries), content-length caps (5MB max), HTML text extraction via Cheerio, stripping script/nav/footer noise.

---

## 📌 State Management & Section Regeneration

To solve the state preservation challenge (Section 6 of Brief):
- Every question, flashcard, and brief section contains `_meta`:
  ```json
  { "origin": "generated", "edited": false, "pinned": false }
  ```
- When a user hand-edits or creates an item in the UI, `edited` and `pinned` become `true`.
- **Section Regeneration Logic**:
  1. Filters section items into `pinnedItems` and `unpinnedItems`.
  2. Generates fresh candidates from Gemini for `unpinnedItems`.
  3. Merges `pinnedItems` back into the final list, preserving user edits intact.
  4. Recalculates coverage and schedule deterministically.

---

## 📐 Deterministic Scheduling & Coverage Guarantee

- **Coverage Checker**: Compares referenced requirement IDs (`q.requirement_ids`) against extracted requirements. If must-have requirements remain uncovered after Pass 1, a Pass 2 target prompt generates gap questions specifically for those missing IDs.
- **Schedule Allocator**: Pure mathematical bucket distribution.
  - Sorts questions by priority score (`difficulty * priorityWeight`).
  - Distributes items into day buckets so harder and must-have material lands earlier in the schedule.
  - Guarantees integer minute allocations per day matching `days_available`.

---

## 🧪 Testing

Run Jest unit test suite:
```bash
npm test --workspace=@jobprep/api
```

Test Coverage includes:
- `scheduler.test.ts`: Allocator integer minutes, priority ordering, days count matching.
- `coverage.test.ts`: Gap identification and coverage percentage calculation.
- `validator.test.ts`: Zod validation & referential integrity checks.
