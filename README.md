# ESECURE-AI 🛡️⚡

**ESECURE-AI** is an advanced, AI-powered Cyber Forensics & Threat Intelligence Platform designed for deep phishing analysis, automated IOC extraction, threat campaign tracking, and interactive attack graph visualization.

---

## ✨ Features

- 🔍 **Automated EML & Email Analysis**: Parses MIME headers, HTML body content, attachment metadata, and extract URLs.
- 🧬 **TLSH Fuzzy Hashing & DNA Fingerprinting**: Detects mutated email phishing variants and clusters campaign actors.
- 🎯 **IOC Management**: Extracted IPv4s, domains, URLs, and file hashes with confidence scoring and STIX export support.
- 🕸️ **Interactive Attack Graphs**: Visualizes attack chains, root nodes, infected hosts, and C2 servers.
- 📊 **Evidentiary PDF Report Generation**: Automatically compiles forensic analysis into comprehensive PDF evidence packages.
- 🚀 **Next.js & FastAPI Stack**: High-performance asynchronous backend paired with a sleek glassmorphic Next.js UI.

---

## 🛠️ Getting Started

### Prerequisites

- **Python**: 3.10+
- **Node.js**: 18+
- **PostgreSQL / SQLite**: (Default MVP uses SQLite `mvp.db`)

### Backend Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run database migrations or startup initial tables
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API documentation at `http://localhost:8000/docs`.

---

## 📂 Repository Structure

```
ESECURE-AI/
├── app/
│   ├── api/routes/          # API Endpoints (Analyze, Campaigns, Attack Graphs, IOCs)
│   ├── models/              # SQLAlchemy Database Models
│   ├── schemas/             # Pydantic Request/Response Schemas
│   └── services/            # Core Engine (DNA, Forensic, Evidence, Campaign)
├── frontend/                # Next.js 14 Frontend Console
│   └── src/components/      # React / Tailwind / Lucide UI Components
├── data/                    # Dataset & Artifact Storage
└── tests/                   # Automated API & Unit Tests
```

---

## 📄 License

Internal Enterprise Security & Cyber Forensics Platform.
