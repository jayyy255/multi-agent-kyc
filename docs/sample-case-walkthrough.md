# Sample Case Walkthrough — End-to-End KYC Lifecycle

This document traces an end-to-end walkthrough of a customer onboarding case as it moves dynamically through the Multi-Agent KYC Onboarding System.

---

## Scenario: Individual Customer Onboarding (`case-8821`)

- **Applicant**: Eleanor Jane Smith (DOB: 1992-05-14)
- **Customer CRM Profile**: `cust-8821` in Dataverse
- **Uploaded Files**:
  1. `customer_passport_scan.pdf` (Identity document)
  2. `utility_bill_electricity.pdf` (Proof of address)

---

## Step 1: Document Upload & Case Initialization

1. Customer submits files via onboarding portal.
2. Files are deposited into SharePoint; Dataverse registers `case-8821` with status `NEW_APPLICATION`.
3. **Supervisor Agent Reasoner**:
   > *"Case has 2 attached documents with status `UNPROCESSED`. Action: Classify Document 1."*

---

## Step 2: Document Classification

### Action Invocation: `POST /api/v1/documents/classify`

#### Request:
```json
{
  "document_id": "doc-pass-001",
  "filename": "customer_passport_scan.pdf",
  "content_type": "application/pdf",
  "document_text": "PASSPORT / PASSEPORT\nType: P\nPassport No: P98765432\nSurname: SMITH\nGiven Names: ELEANOR JANE\nNationality: USA"
}
```

#### Response:
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

- **Supervisor Agent State Update**:
  - `doc-pass-001` classified as `passport`.
  - Next planned action: Extract fields from `doc-pass-001`.

---

## Step 3: Structured Field Extraction

### Action Invocation: `POST /api/v1/documents/extract`

#### Request:
```json
{
  "document_id": "doc-pass-001",
  "document_type": "passport",
  "document_text": "PASSPORT / PASSEPORT\nType: P\nCode: USA\nPassport No: P98765432\nSurname: SMITH\nGiven Names: ELEANOR JANE\nNationality: USA\nDate of Birth: 1992-05-14\nDate of Expiry: 2030-06-01"
}
```

#### Response:
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
    "expiry_date": "2030-06-01"
  },
  "missing_fields": [],
  "confidence": 0.95,
  "requires_manual_review": false,
  "message": "Fields extracted successfully"
}
```

- **Supervisor Agent State Update**:
  - Fields extracted. All mandatory fields present.
  - Next planned action: Validate `doc-pass-001` against Dataverse customer profile.

---

## Step 4: Deterministic Validation

### Action Invocation: `POST /api/v1/documents/validate`

#### Request:
```json
{
  "case_id": "case-8821",
  "customer_id": "cust-8821",
  "document_type": "passport",
  "extracted_fields": {
    "full_name": "ELEANOR JANE SMITH",
    "passport_number": "P98765432",
    "date_of_birth": "1992-05-14",
    "expiry_date": "2030-06-01",
    "nationality": "USA"
  },
  "customer_record": {
    "full_name": "Eleanor Jane Smith",
    "date_of_birth": "1992-05-14",
    "country_of_residence": "USA"
  },
  "reference_date": "2026-09-01"
}
```

#### Response:
```json
{
  "success": true,
  "case_id": "case-8821",
  "is_valid": true,
  "validation_status": "valid",
  "validation_results": [
    {
      "field": "full_name",
      "status": "valid",
      "message": "Mandatory field 'full_name' is present."
    },
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

## Step 5: Document Requirement Completeness Check

### Action Invocation: `POST /api/v1/cases/check-requirements`

#### Request:
```json
{
  "case_id": "case-8821",
  "provided_document_types": ["passport", "proof_of_address"]
}
```

#### Response:
```json
{
  "case_id": "case-8821",
  "satisfied": true,
  "missing_document_types": [],
  "provided_document_types": ["passport", "proof_of_address"],
  "recommendation": "proceed",
  "message": "Document requirements satisfied."
}
```

---

## Step 6: Case Finalization

- **Supervisor Agent Final Decision**:
  - Passport is verified and valid.
  - Proof of address is verified and valid.
  - Overall requirements checklist is 100% satisfied.
  - Risk Level: `LOW`.
  - Final Action: Update Dataverse case status to `APPROVED_AUTOMATED` and emit audit record.
