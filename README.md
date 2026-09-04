# Multi-Agent KYC Onboarding Automation

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An intelligent, multi-agent Know Your Customer (KYC) onboarding automation platform designed for modern financial services. This platform implements a **dynamic, agentic workflow** where an AI Supervisor Agent reasons over case state and orchestrates specialized, deterministic worker tools to classify documents, extract structured fields, validate compliance rules, and flag anomalies for human review.

---

## 1. Business Problem & Project Objectives

KYC onboarding in banking and fintech involves high-friction, repetitive operations:
1. Receiving customer identity and address documents.
2. Identifying document categories (passports, driver's licenses, utility statements).
3. Extracting and standardizing entity fields.
4. Cross-referencing extracted data against authoritative customer CRM records.
5. Verifying compliance rules (age eligibility $\ge 18$, unexpired status, format validity).
6. Detecting cross-document discrepancies and potential identity conflicts.
7. Escalating high-risk or ambiguous cases to human compliance officers.
8. Maintaining an immutable audit log.

### Dynamic Agentic Reasoning vs. Fixed Pipelines
Unlike traditional hardcoded linear pipelines (`Classify` $\rightarrow$ `Extract` $\rightarrow$ `Validate` $\rightarrow$ `Review`), this system implements an **agentic architecture**:
- A **Supervisor Agent** (Microsoft Copilot Studio) maintains the high-level objective and dynamically determines the next best action based on the evolving state of the case.
- **Worker Tools** (Python FastAPI) execute bounded, deterministic micro-tasks with structured JSON outputs.
- An **Operations Frontend Dashboard** (React + TypeScript + Vite) provides interactive case exploration, live worker tool execution, compliance review queue, and real-time API auditing.

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Microsoft Copilot Studio (Supervisor Agent)               │
│               • Case Planning & Dynamic Next-Action Reasoning               │
│               • Tool Execution & State Interpretation                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         Power Automate Flow Trigger
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Power Automate Cloud Flows                       │
│               • HTTP REST Request Dispatching                               │
│               • JSON Schema Parsing & Data Transformation                   │
│               • SharePoint Document Handling & Human Approvals              │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
       HTTP REST API   │               Dataverse Sync  │
                       ▼                               ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     FastAPI Worker Services (Python) │  │        Microsoft Dataverse        │
│                                      │  │                                   │
│ • POST /api/v1/documents/classify    │  │ • KYC Cases Table                 │
│ • POST /api/v1/documents/extract     │  │ • Customer CRM Profiles           │
│ • POST /api/v1/documents/validate    │  │ • Document Metadata               │
│ • POST /api/v1/cases/* (Analysis)    │  │ • Immutable Audit Logs            │
└──────────────────▲───────────────────┘  └───────────────────────────────────┘
                   │
                   │ REST API (HTTP localhost:8000)
                   │
┌──────────────────┴──────────────────────────────────────────────────────────┐
│              KYC Operations Frontend Dashboard (React + TypeScript)         │
│  • Operations Overview & KPI Metrics      • Interactive Document Playground │
│  • KYC Case Explorer & Timeline           • Deterministic Validation Engine │
│  • Human Review Queue & Demo Escalations  • Live Technical API Activity Log │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Worker API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status for monitoring & container probes |
| `GET` | `/api/v1/version` | Service version, environment, and prefix metadata |
| `POST` | `/api/v1/documents/classify` | Identifies document category and returns confidence score |
| `POST` | `/api/v1/documents/extract` | Extracts structured key-value entities from document text |
| `POST` | `/api/v1/documents/validate` | Deterministically validates fields against CRM profiles |
| `POST` | `/api/v1/cases/check-requirements` | Evaluates completeness of KYC document checklist |
| `POST` | `/api/v1/cases/compare-customer-data`| Compares customer record attributes across all documents |
| `POST` | `/api/v1/cases/detect-inconsistencies`| Identifies cross-document conflicts (names, DOBs) |

---

## 4. Frontend Dashboard Pages

The frontend operations platform located in `frontend/` provides 7 specialized views:

1. **Overview**: Executive KPI metrics (cases, documents, information requests, review queue), demo metric counters, and recent cases table.
2. **KYC Cases Explorer**: Detailed case inspector with customer CRM profile data, uploaded documents, extracted key-values, and deterministic validation outcomes.
3. **Document Processing Playground**: Interactive tool allowing users to select synthetic scenarios or paste raw text to run `Classify`, `Extract`, `Validate`, or full sequential workflows.
4. **Deterministic Validation Engine**: Direct rule validator with presets for unexpired passports, expired dates, underage applicants, and name token mismatches.
5. **Compliance Review Queue**: Exception handling interface for cases flagged for manual review with demo actions (`Request Information`, `Escalate to Human`, `Mark Approved`).
6. **Technical API Activity Log**: Real-time HTTP audit log tracking endpoint, method, response status, duration in ms, and expandable raw JSON payloads.
7. **System Information**: Live backend connectivity discovery, semantic version, and available worker service contracts.

---

## 5. Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ (npm 9+)
- Git

### Step 1: Start the Backend (FastAPI)
```bash
# Clone the repository
git clone https://github.com/jayyy255/multi-agent-kyc.git
cd multi-agent-kyc

# Set up Python virtual environment
python -m venv venv
.\venv\Scripts\activate       # On Windows
# source venv/bin/activate    # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### Step 2: Start the Frontend (React + Vite)
In a separate terminal:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)

---

## 6. Running Tests

### Backend Test Suite (Pytest)
```bash
python -m pytest tests/ -v
```
*(28 unit and integration tests covering classification, extraction, validation, and error envelopes).*

### Frontend Test Suite (Vitest)
```bash
cd frontend
npm test
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 7. Running with Docker

```bash
docker-compose up --build -d
```

---

## 8. Detailed Documentation

- [Architecture Overview](docs/architecture.md) — Comprehensive system architecture, dynamic reasoning vs pipelines, and sequence diagrams.
- [API Contracts](docs/api-contracts.md) — Detailed endpoint schemas, request parameters, response bodies, and error formats.
- [Copilot Studio Integration Guide](docs/copilot-studio-integration.md) — Step-by-step setup for registering worker tools and supervisor prompt engineering.
- [Power Automate Integration Guide](docs/power-automate-integration.md) — Configuring cloud flows, JSON parsing, Dataverse updates, and retry policies.
- [Sample Case Walkthrough](docs/sample-case-walkthrough.md) — Complete trace of a customer onboarding case lifecycle.

---

## 9. Security & Responsible AI Considerations

- **Synthetic Test Data**: Only synthetic test fixtures are included in this repository. No real customer PII is stored or processed.
- **Stateless Operation**: Documents are processed in-memory without persistent disk retention on worker nodes.
- **PII Masking**: Logging facilities automatically sanitize and redact document identifiers, account numbers, and sensitive tokens.
- **Human-in-the-Loop Safeguards**: The system explicitly identifies uncertainties, inconsistencies, and low confidence scores, routing them for human compliance review.
- **Prototype Status**: This software is an architectural prototype and coding foundation for multi-agent workflows; it does not claim production regulatory certification.

---

## 10. Repository Structure

```
multi-agent-kyc/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── requirements.txt
├── README.md
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── models/
│   │   ├── enums.py
│   │   ├── errors.py
│   │   ├── requests.py
│   │   └── responses.py
│   ├── api/
│   │   ├── deps.py
│   │   └── routes/
│   │       ├── health.py
│   │       ├── classification.py
│   │       ├── extraction.py
│   │       ├── validation.py
│   │       └── cases.py
│   ├── services/
│   │   ├── classifier.py
│   │   ├── extractor.py
│   │   ├── validator.py
│   │   └── case_analyzer.py
│   └── utils/
│       ├── logging.py
│       ├── date_utils.py
│       └── security.py
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env.example
│   ├── README.md
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── data/
│       ├── pages/
│       ├── test/
│       └── types/
│
├── docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── copilot-studio-integration.md
│   ├── power-automate-integration.md
│   └── sample-case-walkthrough.md
│
├── sample_data/
│   ├── sample_passport.json
│   ├── sample_address_proof.json
│   ├── sample_driving_license.json
│   ├── sample_bank_statement.json
│   └── sample_customer.json
│
└── tests/
    ├── conftest.py
    ├── test_health.py
    ├── test_classification.py
    ├── test_extraction.py
    ├── test_validation.py
    ├── test_cases.py
    └── test_errors.py
```

---

## 11. Author & License

- **Author**: Jay Dalvi ([@jayyy255](https://github.com/jayyy255))
- **License**: MIT License