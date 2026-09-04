import { DocumentType } from '../types/kyc';

export interface SampleDocumentItem {
  id: string;
  name: string;
  category: string;
  document_type: DocumentType;
  filename: string;
  content_type: string;
  document_text: string;
  description: string;
  tags: string[];
}

export const SAMPLE_DOCUMENTS: SampleDocumentItem[] = [
  {
    id: 'sample-pass-001',
    name: 'Standard US Passport (Valid)',
    category: 'Proof of Identity',
    document_type: 'passport',
    filename: 'customer_passport_scan.pdf',
    content_type: 'application/pdf',
    description: 'Clean passport scan for Eleanor Jane Smith with unexpired date (2030).',
    tags: ['Standard', 'Unexpired', 'Identity'],
    document_text: `PASSPORT / PASSEPORT
Type: P
Code: USA
Passport No: P98765432
Surname: SMITH
Given Names: ELEANOR JANE
Nationality: USA
Date of Birth: 1992-05-14
Sex: F
Place of Birth: CALIFORNIA, USA
Date of Issue: 2020-06-01
Date of Expiry: 2030-06-01
Authority: UNITED STATES DEPARTMENT OF STATE
P<USASMITH<<ELEANOR<JANE<<<<<<<<<<<<<<<<<<<<<
P987654320USA9205142F3006015<<<<<<<<<<<<<<04`,
  },
  {
    id: 'sample-addr-002',
    name: 'Electricity Utility Bill (Valid)',
    category: 'Proof of Address',
    document_type: 'proof_of_address',
    filename: 'utility_bill_electricity.pdf',
    content_type: 'application/pdf',
    description: 'Recent monthly power utility statement with matching service address.',
    tags: ['Standard', 'Utility', 'Address'],
    document_text: `METROPOLITAN ELECTRIC & GAS UTILITY
Monthly Billing Statement
Account Number: 8492-3021-99
Statement Date: 2026-08-15
Due Date: 2026-09-10

Service Address:
ELEANOR JANE SMITH
742 EVERGREEN TERRACE, APT 4B
SPRINGFIELD, OR 97477
UNITED STATES

Total Amount Due: $142.50
Payment Status: Paid in Full`,
  },
  {
    id: 'sample-dl-003',
    name: 'State Driver License (Valid)',
    category: 'Proof of Identity',
    document_type: 'driving_license',
    filename: 'oregon_drivers_license.jpg',
    content_type: 'image/jpeg',
    description: 'Real ID-compliant state driver license with complete entity anchors.',
    tags: ['Driver License', 'State ID', 'Identity'],
    document_text: `STATE DRIVER LICENSE / PERMIT
DL No: DL77391024
EXP: 2029-05-14
LN: SMITH
FN: ELEANOR JANE
DOB: 1992-05-14
ADDR: 742 EVERGREEN TERRACE, APT 4B, SPRINGFIELD, OR 97477
ISS: 2021-05-14
CLASS: C`,
  },
  {
    id: 'sample-bank-004',
    name: 'Bank Account Statement (Valid)',
    category: 'Financial Statement',
    document_type: 'bank_statement',
    filename: 'first_national_bank_statement_aug.pdf',
    content_type: 'application/pdf',
    description: 'Monthly checking account statement from First National Bank.',
    tags: ['Bank', 'Financial', 'Address Proof'],
    document_text: `FIRST NATIONAL BANK OF COMMERCE
Customer Account Statement
Account Holder: ELEANOR JANE SMITH
Account Number: 9812-4412-001
Statement Period: 2026-08-01 to 2026-08-31
Issue Date: 2026-09-01
Address: 742 EVERGREEN TERRACE, APT 4B, SPRINGFIELD, OR 97477
Closing Balance: $8,450.25`,
  },
  {
    id: 'sample-exp-005',
    name: 'Expired Passport (Edge Case)',
    category: 'Anomaly / Expired',
    document_type: 'passport',
    filename: 'expired_passport_robert.pdf',
    content_type: 'application/pdf',
    description: 'Passport with expiration date in 2020 designed to test deterministic date alerts.',
    tags: ['Anomaly', 'Expired', 'High Risk'],
    document_text: `PASSPORT / PASSEPORT
Type: P
Code: GBR
Passport No: G10293847
Surname: JOHNSON
Given Names: ROBERT
Nationality: GBR
Date of Birth: 1980-03-22
Date of Expiry: 2020-01-15
Authority: HMPO`,
  },
  {
    id: 'sample-unk-006',
    name: 'Unrecognized Document (Edge Case)',
    category: 'Unknown / Uncategorized',
    document_type: 'unknown',
    filename: 'meeting_notes_generic.txt',
    content_type: 'text/plain',
    description: 'Uncategorized text notes designed to test low confidence and manual review flags.',
    tags: ['Unclassified', 'Review Required'],
    document_text: `Internal Project Notes
Date: September 4, 2026
Attendees: Team sync regarding platform release.
Agenda: Architecture review and deployment schedule.`,
  },
];
