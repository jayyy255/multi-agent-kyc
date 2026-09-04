# Multi-Agent KYC Onboarding Automation

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.6+-e92063.svg?logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An intelligent, multi-agent Know Your Customer (KYC) onboarding automation system designed for modern financial services. This project implements a **dynamic, agentic workflow** where an AI Supervisor Agent reasons over case state and orchestrates specialized, deterministic worker tools to classify documents, extract structured fields, validate compliance rules, and flag anomalies for human review.

---

## 1. Business Problem & Project Objectives

KYC onboarding in banking and fintech involves high-friction, repetitive operations:
1. Receiving customer identity and address documents.
2. Identifying document categories (passports, driver's licenses, utility statements).
3. Extracting and standardizing entity fields.
4. Cross-referencing extracted data against authoritative customer CRM records.
5. Verifying compliance rules (age eligibility, unexpired status, format validity).
6. Detecting cross-document discrepancies and potential fraud.
7. Escalating high-risk or ambiguous cases to human compliance officers.
8. Maintaining an immutable audit log.

### Dynamic Agentic Reasoning vs. Fixed Pipelines
Unlike traditional hardcoded linear pipelines (`Classify` $\rightarrow$ `Extract` $\rightarrow$ `Validate` $\rightarrow$ `Review`), this system implements an **agentic architecture**:
- A **Supervisor Agent** (Microsoft Copilot Studio) maintains the high-level objective and dynamically determines the next best action based on the evolving state of the case.
- **Worker Tools** (Python FastAPI) execute bounded, deterministic micro-tasks with structured JSON outputs.

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
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

### Separation of Concerns:
- **Implemented in this Repository (Python Backend)**:
  - High-performance, stateless RESTful worker services.
  - Document classifier with heuristic pattern matching (extensible for ML/LLMs).
  - Structured entity extractor supporting passports, driver licenses, utility bills, and bank statements.
  - Deterministic validation engine with strict date arithmetic, format checks, and name fuzzy matching.
  - Standardized JSON schemas and error envelopes.
  - Docker containerization and comprehensive Pytest test suite.
- **Implemented Separately (Microsoft Power Platform)**:
  - Microsoft Copilot Studio Supervisor Agent instructions and reasoning loops.
  - Power Automate flows orchestrating HTTP calls and Dataverse updates.
  - Dataverse schema tables (cases, customers, documents, audit logs).
  - Human-in-the-loop Power Apps approval dashboard.

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

## 4. Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/jayyy255/multi-agent-kyc.git
cd multi-agent-kyc

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables
Copy `.env.example` to `.env` (optional for local testing):
```bash
cp .env.example .env
```

### Running the API Server Locally
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 5. Running Tests

Run the complete Pytest test suite with verbose output:
```bash
python -m pytest tests/ -v
```

Test coverage includes:
- Passport, driving license, utility bill, and unknown document classification.
- Structured entity extraction and critical missing field detection.
- Deterministic compliance validation (expiry checks, underage detection, name mismatch, address alignment).
- Global 422, 400, and 500 error envelopes.

---

## 6. Running with Docker

### Build and Run with Docker Compose
```bash
docker-compose up --build -d
```

### Run with Docker CLI
```bash
docker build -t multi-agent-kyc-backend .
docker run -p 8000:8000 --name kyc-api multi-agent-kyc-backend
```

---

## 7. Example API Payloads

### Document Classification (`POST /api/v1/documents/classify`)
```json
{
  "document_id": "doc-pass-001",
  "filename": "customer_passport_scan.pdf",
  "content_type": "application/pdf",
  "document_text": "PASSPORT / PASSEPORT\nType: P\nCode: USA\nPassport No: P98765432\nSurname: SMITH\nGiven Names: ELEANOR JANE\nNationality: USA"
}
```
**Response**:
```json
{
  "success": true,
  "document_id": "doc-pass-001",
  "document_type": "passport",
  "confidence": 0.94,
  "requires_manual_review": false,
  "message": "Document classified as passport with confidence 0.94"
}
```

### Deterministic Validation (`POST /api/v1/documents/validate`)
```json
{
  "case_id": "case-8821",
  "customer_id": "cust-8821",
  "document_type": "passport",
  "extracted_fields": {
    "full_name": "Eleanor Jane Smith",
    "passport_number": "P98765432",
    "date_of_birth": "1992-05-14",
    "expiry_date": "2030-06-01"
  },
  "customer_record": {
    "full_name": "Eleanor Jane Smith",
    "date_of_birth": "1992-05-14",
    "country_of_residence": "USA"
  }
}
```
**Response**:
```json
{
  "success": true,
  "case_id": "case-8821",
  "is_valid": true,
  "validation_status": "valid",
  "validation_results": [
    {
      "field": "expiry_date",
      "status": "valid",
      "message": "Document is valid until 2030-06-01"
    },
    {
      "field": "customer_name_match",
      "status": "valid",
      "message": "Exact name match"
    }
  ],
  "missing_information": [],
  "inconsistencies": [],
  "requires_manual_review": false,
  "recommendation": "proceed",
  "risk_level": "low",
  "message": "All deterministic validation rules passed successfully."
}
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