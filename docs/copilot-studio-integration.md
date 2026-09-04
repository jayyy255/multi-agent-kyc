# Microsoft Copilot Studio Integration Guide

This guide details how to integrate the Python FastAPI worker services as **Tools/Actions** inside a **Microsoft Copilot Studio Supervisor Agent**.

---

## 1. Supervisor Agent Overview

In Copilot Studio, the **Supervisor Agent** acts as the dynamic decision maker. Rather than executing a hardcoded sequence of steps, the agent assesses the current state of a case stored in Dataverse and dynamically chooses the next tool to run.

```
┌────────────────────────────────────────────────────────┐
│         Copilot Studio Supervisor Agent Plan           │
│                                                        │
│  State: Case doc_001 uploaded, document_type = unknown │
│  Decision: Invoke 'classify_document' tool             │
│                                                        │
│  Result: document_type = 'passport', confidence = 0.94 │
│  Decision: Invoke 'extract_document_fields' tool       │
│                                                        │
│  Result: fields extracted, missing_fields = []         │
│  Decision: Invoke 'validate_fields' tool               │
│                                                        │
│  Result: is_valid = false, recommendation = 'escalate' │
│  Decision: Route case to Compliance Officer Queue      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Worker Tool Directory

Register the following tools in Copilot Studio (via Power Automate flows or OpenAPI custom connectors):

| Tool Name | HTTP Method | Endpoint | Purpose | Copilot Trigger Condition |
| :--- | :--- | :--- | :--- | :--- |
| `classify_document` | `POST` | `/api/v1/documents/classify` | Identifies document category (passport, utility bill, ID) | Trigger when a new document is attached or `document_type` is unknown. |
| `extract_document_fields` | `POST` | `/api/v1/documents/extract` | Extracts structured key-values (name, DOB, ID, expiry) | Trigger when `document_type` is known but extracted fields are empty. |
| `validate_fields` | `POST` | `/api/v1/documents/validate` | Validates deterministic rules and customer match | Trigger when fields are extracted and need verification against CRM profile. |
| `check_requirements` | `POST` | `/api/v1/cases/check-requirements` | Evaluates if all required KYC documents are present | Trigger when evaluating overall case completeness. |
| `detect_inconsistencies`| `POST` | `/api/v1/cases/detect-inconsistencies` | Finds conflicts across multiple case documents | Trigger before final case approval. |

---

## 3. Configuring Actions in Copilot Studio

### Step 1: Create a Custom Connector or Flow Action
1. In Microsoft Copilot Studio, navigate to **Actions** $\rightarrow$ **Add an action**.
2. Select **Flow** (Power Automate) or **Custom Connector** pointing to the FastAPI Swagger URL:
   ```
   https://<your-host-domain>/api/v1/openapi.json
   ```

### Step 2: Configure Tool Input & Output Parameters

#### `classify_document`:
- **Input Parameters**:
  - `document_id` (Text, Required)
  - `filename` (Text)
  - `document_text` (Text)
- **Output Parameters**:
  - `document_type` (Text)
  - `confidence` (Number)
  - `requires_manual_review` (Boolean)

#### `validate_fields`:
- **Input Parameters**:
  - `case_id` (Text, Required)
  - `document_type` (Text, Required)
  - `extracted_fields` (Object/Stringified JSON)
  - `customer_record` (Object/Stringified JSON)
- **Output Parameters**:
  - `is_valid` (Boolean)
  - `validation_status` (Text)
  - `recommendation` (Text: `proceed`, `request_additional_information`, `escalate_human_review`)
  - `risk_level` (Text: `low`, `medium`, `high`)
  - `missing_information` (List of strings)
  - `inconsistencies` (List of strings)

---

## 4. Supervisor Agent System Prompt / Instructions

Add the following instructions to the Copilot Studio agent:

```markdown
You are the KYC Onboarding Supervisor Agent for financial compliance.
Your objective is to guide incoming customer cases from initial document receipt to approval or human escalation.

Rules of Engagement:
1. Always evaluate the current state of the case before selecting an action.
2. If any uploaded document has an unknown document type, call the `classify_document` tool.
3. If a document type is identified but its fields are not extracted, call `extract_document_fields`.
4. Once fields are extracted, call `validate_fields` with the customer's authoritative profile record.
5. If `validate_fields` returns recommendation 'proceed', check whether all required documents (Identity + Address proof) are fulfilled.
6. If `validate_fields` returns 'request_additional_information', notify the customer specifying the exact missing fields.
7. If `validate_fields` returns 'escalate_human_review' or risk_level is 'high', immediately assign the case to the Human Compliance Review Queue with the listed inconsistencies.
8. Never attempt to guess or approve invalid dates or mismatched customer names without human approval.
```
