# Power Automate Integration Guide

This guide details how to build Power Automate Cloud Flows that connect Microsoft Copilot Studio and Microsoft Dataverse to the Python FastAPI backend worker endpoints.

---

## 1. Architecture Flow

```
Copilot Studio Action Call
          │
          ▼
Power Automate Cloud Flow (HTTP Action)
          │
          ├─► 1. Read document text / metadata from Dataverse or SharePoint
          ├─► 2. Execute HTTP POST request to FastAPI Worker
          ├─► 3. Parse JSON response using predefined schema
          ├─► 4. Update Dataverse case record & audit log
          │
          ▼
Return structured JSON output to Copilot Studio
```

---

## 2. Step-by-Step Flow Construction

### Step 1: Flow Trigger
- Use trigger: **When Power Virtual Agents / Copilot Studio calls a flow** (or **Run a child flow**).
- Define input parameters (e.g., `case_id`, `document_id`, `document_text`, `customer_id`).

### Step 2: HTTP Action Configuration
Add the standard **HTTP** action to invoke the appropriate worker endpoint:

| Field | Configuration |
| :--- | :--- |
| **Method** | `POST` |
| **URI** | `https://<your-backend-host>/api/v1/documents/validate` |
| **Headers** | `Content-Type`: `application/json`<br>`X-API-Key`: `@{parameters('API_KEY')}` |
| **Body** | Raw JSON matching the endpoint schema |

#### Sample HTTP Action Body (for `/api/v1/documents/validate`):
```json
{
  "case_id": "@{triggerBody()?['case_id']}",
  "customer_id": "@{triggerBody()?['customer_id']}",
  "document_type": "@{triggerBody()?['document_type']}",
  "extracted_fields": @{json(triggerBody()?['extracted_fields'])},
  "customer_record": @{json(outputs('Get_Customer_Dataverse_Row')?['body'])}
}
```

---

## 3. Parse JSON Action & Schema

Add a **Parse JSON** action immediately following the HTTP action.

- **Content**: `@{body('HTTP')}`
- **Schema**: Use the validation response schema:

```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "case_id": {"type": "string"},
    "is_valid": {"type": "boolean"},
    "validation_status": {"type": "string"},
    "recommendation": {"type": "string"},
    "risk_level": {"type": "string"},
    "missing_information": {
      "type": "array",
      "items": {"type": "string"}
    },
    "inconsistencies": {
      "type": "array",
      "items": {"type": "string"}
    }
  }
}
```

---

## 4. Updating Dataverse Case State

Add the **Microsoft Dataverse - Update a row** action:
- **Table Name**: `KYC Cases` (`cr_kyc_cases`)
- **Row ID**: `@{triggerBody()?['case_id']}`
- **Fields to Update**:
  - `Validation Status`: `@{body('Parse_JSON')?['validation_status']}`
  - `Risk Level`: `@{body('Parse_JSON')?['risk_level']}`
  - `Supervisor Recommendation`: `@{body('Parse_JSON')?['recommendation']}`
  - `Requires Manual Review`: `@{body('Parse_JSON')?['requires_manual_review']}`
  - `Last Verified At`: `@{utcNow()}`

---

## 5. Robust Error Handling (Scope & Run After)

To ensure resilient execution in Power Automate:

1. Wrap the HTTP and Parse JSON actions inside a **Try Scope**.
2. Create a **Catch Scope** configured to run only if the Try Scope **has failed, timed out, or is skipped**.
3. Inside the Catch Scope:
   - Extract error status code and message from `@{result('Try_Scope')}`.
   - Record an incident entry in the Dataverse `KYC Audit Logs` table.
   - Return a graceful fallback response to Copilot Studio:
     ```json
     {
       "success": false,
       "error_code": "SERVICE_UNAVAILABLE",
       "recommendation": "escalate_human_review",
       "message": "Backend validation service timed out; routing case for manual check."
     }
     ```
