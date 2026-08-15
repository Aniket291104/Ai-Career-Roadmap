# AI Career Roadmap Generator 🚀

An enterprise-grade, gamified platform designed to help developers assess skills, build interactive career roadmaps, practice mock interviews, and receive AI-driven project code reviews.

---

## 🗺️ Key Features

* **Interactive SVG Mindmap**: A Figma-style zoomable and pannable mindmap canvas built with responsive SVGs, connecting roadmap months to weekly checkpoints. Styled dynamically based on completion (Emerald = Complete, Amber = In Progress, Slate = Pending).
* **Daily Quests & Gamification**: Features a quest widget that tracks consistency. Users can claim XP rewards (+10 to +50 XP) for logging in, completing roadmap nodes, and running sandbox coding challenges.
* **Inline Weekly MCQ Quizzes**: Synthesizes 5-question multiple-choice quizzes dynamically tailored by Gemini to that week's specific learning topics, complete with inline grading and detailed explanations.
* **AI Senior Developer Auditor**: Simulates code review audits for GitHub repository links, grading structural layout, CORS security settings, test folder layouts, and awarding XP on completion.
* **ATS Resume & Portfolio Analyzer**: Computes ATS-compatibility scores, recommends keywords, and fetches real GitHub repository metadata for active developer evaluations.
* **Interactive Coding Sandbox**: Features a compiler sandbox supporting multi-language execution (JavaScript, Python, C++, etc.), user hints (costing 50 XP), and follow-up interviewer chat rooms.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15, React 19, TailwindCSS, Framer Motion, Radix UI, Recharts, Lucide |
| **Backend** | Node.js, Express, Mongoose (MongoDB), Redis, Socket.io, Nodemailer |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Payment Gateways** | Stripe API, Razorpay Checkout SDK |
| **Deployment** | Docker, Docker Compose, GitHub Actions |

---

## 🚀 Quick Start (Local Development)

The easiest way to run the entire stack locally (frontend, backend, database, and cache) is using **Docker Compose**:

### 1. Prerequisites
Ensure you have **Docker Desktop** installed and running on your system.

### 2. Configure Environment Files
Ensure your environment files exist and are configured:
* Root directory: `.env` (defines variables like `GEMINI_API_KEY`, etc.)
* `/backend/.env`: Configures database ports, API secrets, and mailers
* `/frontend/.env.local`: Points client to `http://localhost:5000/api`

### 3. Spin Up Services
Run the following command in the root folder of the project to build and start the containers in detached mode:
```bash
docker-compose up --build -d
```

Once Docker builds the images and spins up the containers, the application will be accessible at:
* **Frontend UI**: [http://localhost:3000](http://localhost:3000)
* **Backend API Gateway**: [http://localhost:5000](http://localhost:5000)
* **API Health Status**: [http://localhost:5000/health](http://localhost:5000/health)

To view backend runtime logs, run:
```bash
docker logs roadmap-backend -f
```

To stop all containers, run:
```bash
docker-compose down
```

---

## 📁 Directory Structure

```
├── backend/               # Node/Express API server
│   ├── src/
│   │   ├── controllers/   # Route handler controllers (Quests, Roadmaps, Sandbox, etc.)
│   │   ├── models/        # Mongoose database schemas
│   │   ├── routes/        # Express router mappings
│   │   ├── services/      # Gemini AI and external services
│   │   └── app.ts         # Express server bootstrap
│   └── Dockerfile
│
├── frontend/              # Next.js 15 client
│   ├── src/
│   │   ├── app/           # App router page components
│   │   ├── components/    # Reusable Radix & Glassmorphism elements
│   │   └── store/         # Zustand global state management
│   └── Dockerfile
│
├── docker-compose.yml     # Orchestration file mapping Mongo, Redis, Backend, and Frontend
└── DEPLOYMENT.md          # Cloud deployment documentation (Render, Vercel, MongoDB Whitelists)
```
