# KYC Onboarding Intelligence Platform — Frontend

A React, TypeScript, and Vite-powered enterprise financial operations dashboard designed to interact with the Python FastAPI KYC worker backend.

---

## 1. Features

- **Operations Dashboard**: KPI metrics (cases, documents, information requests, review queue) computed from local synthetic datasets.
- **KYC Cases Explorer**: Full case inspector with customer CRM profile data, uploaded documents, extracted key-values, and deterministic validation outcomes.
- **Document Processing Playground**: Test individual worker services (`classify`, `extract`, `validate`) or run full sequential workflows on synthetic documents.
- **Deterministic Validation Engine**: Direct rule tester with real-time feedback for future expiry dates, minimum age ($\ge 18$), and fuzzy customer name matching.
- **Compliance Review Queue**: Exception handling interface for cases flagged for manual review with demo actions (request info, escalate, mark approved).
- **Technical API Activity Log**: Live HTTP request and response inspector with latency measurements, status codes, and expandable raw JSON payloads.
- **System Information**: Live backend connectivity discovery, semantic version, and available worker service contracts.

---

## 2. Setup & Development

### Prerequisites
- Node.js 18+ (Tested on v22)
- npm 9+

### Installation
```bash
cd frontend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```
VITE_API_BASE_URL=http://localhost:8000
```

### Running Locally
```bash
npm run dev
```
The application will be available at [http://localhost:5173](http://localhost:5173).

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```
The compiled static assets will be output to `frontend/dist/`.
