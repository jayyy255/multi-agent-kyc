# API Contracts — Multi-Agent KYC Onboarding Worker Services

This document defines the complete RESTful contract for all Python worker services designed to integrate with Microsoft Power Automate and Microsoft Copilot Studio.

---

## Global Error Envelope

All failed requests return HTTP status codes $400$, $401$, $422$, or $500$ with a standardized JSON envelope:

```json
{
  "success": false,
  "error_code": "VALIDATION_ERROR",
  "message": "The request payload failed schema validation.",
  "details": {
    "errors": [
      {
        "field": "body -> document_id",
        "issue": "Field required",
        "type": "missing"
      }
    ]
  }
}
```

---

## 1. Document Classification Service

Identifies the document type from text, filename cues, or metadata.

- **Endpoint**: `POST /api/v1/documents/classify`
- **Authentication**: Optional `X-API-Key` header
- **Content-Type**: `application/json`

### Request Schema (`DocumentClassifyRequest`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `document_id` | string | Yes | Unique document tracking ID |
| `filename` | string | No | Original filename (e.g. `passport_scan.pdf`) |
| `content_type` | string | No | MIME type (e.g. `application/pdf`) |
| `document_text` | string | No | Extracted OCR or text body |
| `file_reference` | string | No | SharePoint / Blob URL |
| `metadata` | object | No | Key-value pairs of additional context |

#### Example Request:
```json
{
  "document_id": "doc-pass-001",
  "filename": "customer_passport_scan.pdf",
  "content_type": "application/pdf",
  "document_text": "PASSPORT / PASSEPORT\nType: P\nCode: USA\nPassport No: P98765432\nSurname: SMITH\nGiven Names: ELEANOR JANE"
}
```

### Response Schema (`DocumentClassifyResponse`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `success` | boolean | Indicates successful classification execution |
| `document_id` | string | Echoed document tracking ID |
| `document_type` | string | Classified type (`passport`, `driving_license`, `proof_of_address`, `bank_statement`, `tax_document`, `national_id`, `unknown`) |
| `confidence` | float | Score from `0.0` to `1.0` |
| `extracted_metadata` | object | Matched keywords and scoring details |
| `requires_manual_review` | boolean | Flag for low confidence or ambiguous classification |
| `warnings` | array | Diagnostic notices |
| `message` | string | Status summary |

#### Example Response:
```json
{
  "success": true,
  "document_id": "doc-pass-001",
  "document_type": "passport",
  "confidence": 0.94,
  "extracted_metadata": {
    "matched_keywords": ["PASSPORT", "PASSEPORT", "SURNAME", "GIVEN NAMES"],
    "filename_hint": "passport"
  },
  "requires_manual_review": false,
  "warnings": [],
  "message": "Document classified as passport with confidence 0.94"
}
```

---

## 2. Document Field Extraction Service

Extracts structured key-value entities based on the document type.

- **Endpoint**: `POST /api/v1/documents/extract`
- **Content-Type**: `application/json`

### Request Schema (`DocumentExtractRequest`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `document_id` | string | Yes | Unique document tracking ID |
| `document_type` | string | Yes | Classified document type |
| `document_text` | string | No | Raw OCR or body text |
| `file_reference` | string | No | SharePoint / Blob URL |
| `extraction_config` | object | No | Target configuration parameters |

#### Example Request:
```json
{
  "document_id": "doc-pass-001",
  "document_type": "passport",
  "document_text": "PASSPORT / PASSEPORT\nPassport No: P98765432\nSurname: SMITH\nGiven Names: ELEANOR JANE\nNationality: USA\nDate of Birth: 1992-05-14\nDate of Expiry: 2030-06-01\nDate of Issue: 2020-06-01"
}
```

### Response Schema (`DocumentExtractResponse`)

```json
{
  "success": true,
  "document_id": "doc-pass-001",
  "document_type": "passport",
  "extracted_fields": {
    "passport_number": "P98765432",
    "surname": "SMITH",
    "given_names": "ELEANOR JANE",
    "full_name": "ELEANOR JANE SMITH",
    "nationality": "USA",
    "date_of_birth": "1992-05-14",
    "expiry_date": "2030-06-01",
    "issue_date": "2020-06-01"
  },
  "missing_fields": [],
  "confidence": 0.95,
  "requires_manual_review": false,
  "warnings": [],
  "message": "Fields extracted successfully"
}
```

---

## 3. Deterministic Validation Service

Validates extracted fields against business rules and customer records.

- **Endpoint**: `POST /api/v1/documents/validate`
- **Content-Type**: `application/json`

### Request Schema (`DocumentValidateRequest`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `case_id` | string | Yes | Case tracking ID |
| `customer_id` | string | No | Customer ID in Dataverse |
| `document_type` | string | Yes | Document type being verified |
| `extracted_fields` | object | Yes | Key-value pairs extracted from document |
| `customer_record` | object | No | Authoritative customer profile from CRM |
| `required_fields` | array | No | Custom mandatory field checklist |
| `reference_date` | string | No | Reference date `YYYY-MM-DD` for expiry calculations |

#### Example Request:
```json
{
  "case_id": "case-001",
  "customer_id": "cust-8821",
  "document_type": "passport",
  "extracted_fields": {
    "full_name": "Eleanor Jane Smith",
    "passport_number": "P98765432",
    "date_of_birth": "1992-05-14",
    "expiry_date": "2030-06-01",
    "nationality": "USA"
  },
  "customer_record": {
    "full_name": "Eleanor Jane Smith",
    "date_of_birth": "1992-05-14",
    "country_of_residence": "USA"
  }
}
```

### Response Schema (`DocumentValidateResponse`)

```json
{
  "success": true,
  "case_id": "case-001",
  "is_valid": true,
  "validation_status": "valid",
  "validation_results": [
    {
      "field": "full_name",
      "status": "valid",
      "message": "Mandatory field 'full_name' is present.",
      "details": {"value_present": true}
    },
    {
      "field": "expiry_date",
      "status": "valid",
      "message": "Document is valid until 2030-06-01",
      "details": {"is_expired": false, "expiry_date": "2030-06-01"}
    },
    {
      "field": "date_of_birth",
      "status": "valid",
      "message": "Customer meets legal age requirement (calculated age: 34).",
      "details": {"calculated_age": 34}
    },
    {
      "field": "customer_name_match",
      "status": "valid",
      "message": "Exact name match",
      "details": {
        "extracted_name": "Eleanor Jane Smith",
        "customer_record_name": "Eleanor Jane Smith"
      }
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

## 4. Health & Version Endpoints

### `GET /health`
```json
{
  "status": "healthy",
  "timestamp": "2026-09-04T04:15:00.000000Z",
  "service": "multi-agent-kyc-backend"
}
```

### `GET /api/v1/version`
```json
{
  "service": "multi-agent-kyc-backend",
  "version": "0.1.0",
  "environment": "development",
  "api_prefix": "/api/v1"
}
```
