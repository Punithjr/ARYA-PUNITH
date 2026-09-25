export interface OfficeSection {
  id: string;
  code: string; // e.g. 'ಆ1', 'ಆ2', 'ಆ3'
  name: string; // e.g. 'ಸ.ಪ್ರಾ.ಶಿ', 'ಪ್ರೌ.ಶಿ'
  description?: string;
  isDefault?: boolean;
}

export type LetterDirection = 'inward' | 'outward';

export type LetterCategory =
  | 'Government Order (GO)'
  | 'Circular & Directive'
  | 'School Inspection & Safety'
  | 'Grant & Budget Sanction'
  | 'Teacher Transfer & Deputation'
  | 'Scholarship & Student Welfare'
  | 'Examination & Curriculum'
  | 'Public Grievance & RTI'
  | 'Affiliation & NOC'
  | 'General Official Notice';

export type LetterPriority = 'Immediate' | 'Urgent' | 'Routine';

export type LetterStatus =
  | 'Pending Action'
  | 'Under Review'
  | 'Approved & Signed'
  | 'Dispatched'
  | 'Closed & Archived';

export type DepartmentSection =
  | 'Academic Wing'
  | 'Administration & Services'
  | 'Accounts & Grants'
  | 'Examination Board'
  | 'Inspection & Quality'
  | 'Legal & Grievances';

export type ConfidentialityLevel =
  | 'Public / Open'
  | 'Departmental Confidential'
  | 'Secret / Policy';

export interface ActionNote {
  id: string;
  author: string;
  designation: string;
  timestamp: string;
  note: string;
  actionType: 'Forward' | 'Approval' | 'Query' | 'Disposition' | 'Note';
}

export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  pageCount?: number;
  uploadedAt: string;
  description?: string;
  dataUrl?: string; // Base64 or Object URL for genuine PDF/JPG viewing & downloading
}

export interface EducationLetter {
  id: string;
  referenceNumber: string; // e.g. EDN-DIR/2026/CIR-104
  fileNumber: string; // Master Docket/File link e.g. FILE-2026/SCH-AFFL/402
  direction: LetterDirection; // inward or outward
  subject: string;
  category: LetterCategory;
  senderName: string;
  senderDepartment: string;
  senderDesignation: string;
  recipientName: string;
  recipientDepartment: string;
  recipientDesignation: string;
  dateReceivedOrIssued: string; // YYYY-MM-DD
  dueDate: string; // Action target date
  priority: LetterPriority;
  status: LetterStatus;
  assignedOfficer: string;
  section: DepartmentSection;
  confidentiality: ConfidentialityLevel;
  bodyText: string;
  actionNotes: ActionNote[];
  attachments: DocumentAttachment[];
  endorsements?: string[]; // "Copy forwarded for information and necessary action to: 1..."
  tags: string[];
  financialAmount?: number; // E.g. for Grant-in-aid sanctions
  lastUpdated: string;
  // Official Karnataka Government Inward & Outward Register fields:
  inwardNumber?: string; // ಆವಕ ಸಂಖ್ಯೆ (e.g. ಆವಕ-೧/೨೦೨೬-೨೭)
  outwardNumber?: string; // ಜಾವಕ ಸಂಖ್ಯೆ (e.g. ಜಾವಕ-೧/೨೦೨೬-೨೭)
  senderLetterNo?: string; // ಮೂಲ ಪತ್ರ ಸಂಖ್ಯೆ
  senderLetterDate?: string; // ಮೂಲ ಪತ್ರ ದಿನಾಂಕ
  dispatchMode?: 'Registered Post' | 'Speed Post' | 'Ordinary Post' | 'By Hand / Peon Book' | 'Email' | 'WhatsApp / Digital'; // ರವಾನೆ ವಿಧಾನ
  trackingNumber?: string; // ಅಂಚೆ ರಶೀದಿ / RL / ಕನ್‌ಸೈನ್‌ಮೆಂಟ್ ಸಂಖ್ಯೆ
  postalStampAmount?: number; // ಅಂಚೆ ವೆಚ್ಚ
  remarks?: string; // ಷರಾ
  fileLetterNumber?: string; // e.g. 45-1, 45-2
  sectionCode?: string; // e.g. ಆ1
  sectionName?: string; // e.g. ಸ.ಪ್ರಾ.ಶಿ
}

export interface FileMovementRecord {
  id: string;
  fromOfficer: string;
  toOfficer: string;
  sentDate: string;
  remarks: string;
  statusAfterMove: string;
}

export interface RtiDocketDetails {
  applicationNumber: string; // e.g. RTI/BEO/2026/042
  applicantName: string; // ಅರ್ಜಿದಾರರ ಹೆಸರು
  applicantAddress: string; // ವಿಳಾಸ
  applicantPhone?: string; // ಮೊಬೈಲ್ ಸಂಖ್ಯೆ
  applicationDate: string; // ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ (YYYY-MM-DD)
  statutoryDueDate: string; // 30 ದಿನಗಳ ಕಾಲಮಿತಿ ಗಡುವು
  feeDetails: string; // e.g. "₹10 ಕೋರ್ಟ್ ಫೀ ಸ್ಟಾಂಪ್" / "IPO ಸಂ: 54F-9812"
  pioOfficer: string; // ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ (BEO)
  apioOfficer: string; // ಸಹಾಯಕ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ
  informationSought: string; // ಕೋರಿದ ಮಾಹಿತಿಯ ವಿವರಗಳು
  rtiStatus: 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ' | 'ಕಡತ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' | 'ಮಾಹಿತಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ' | 'ಉತ್ತರ ರವಾನಿಸಲಾಗಿದೆ' | 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ';
  replyLetterReference?: string;
  replyDate?: string;
  firstAppellateAuthority: string; // ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ
  uploadedDocs?: DocumentAttachment[]; // PDF or JPG files uploaded
}

export type DocketFileCategory = 
  | 'ಪಿಂಚಣಿ & ನಿವೃತ್ತಿ ಕಡತ (Pension & Retirement)'
  | 'ವೇತನ ಬಡ್ತಿ & ಪರಿಷ್ಕರಣೆ ಕಡತ (Promotion & Pay Revision)'
  | 'ಇಲಾಖಾ ವಿಚಾರಣೆ & ಶಿಸ್ತು ಕ್ರಮ ಕಡತ (Disciplinary & Inquiries)'
  | 'ಆಡಳಿತ & ಸಿಬ್ಬಂದಿ ಕಡತ (Administration & Personnel)'
  | 'ವೇತನ & ಭತ್ಯೆ ಕಡತ (Salary & Increments)'
  | 'ಶೈಕ್ಷಣಿಕ & ಪರೀಕ್ಷಾ ಕಡತ (Academic & Exams)'
  | 'ಲೆಕ್ಕಪತ್ರ & ಅನುದಾನ ಕಡತ (Accounts & Grants)'
  | 'ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ (RTI & Legal)'
  | 'ಶಾಲಾ ತಪಾಸಣೆ & ಗುಣಮಟ್ಟ ಕಡತ (Inspection & Quality)'
  | 'ಇತರೆ ಸಾಮಾನ್ಯ ಕಡತ (General File)';

export interface MasterDocketFile {
  id: string;
  fileNumber: string;
  subject: string;
  section: DepartmentSection;
  fileCategory?: DocketFileCategory | string;
  initiatedDate: string;
  status: 'Active / Open' | 'Under Scrutiny' | 'Pending Higher Approval' | 'Disposed / Closed';
  currentCustodian: string;
  priority: LetterPriority;
  sectionCode?: string; // e.g. ಆ1
  sectionName?: string; // e.g. ಸ.ಪ್ರಾ.ಶಿ
  lettersCount?: number;
  linkedLetterIds: string[];
  movementHistory: FileMovementRecord[];
  notes?: string;
  isRtiFile?: boolean;
  rtiDetails?: RtiDocketDetails;
  attachments?: DocumentAttachment[];
}

export interface DakRegisterSummary {
  totalLetters: number;
  totalInward: number;
  totalOutward: number;
  pendingActionCount: number;
  overdueCount: number;
  closedCount: number;
  disposalRate: number; // percentage
  totalGrantsSanctioned: number;
  categoryBreakdown: Record<string, number>;
  sectionBreakdown: Record<string, { total: number; pending: number }>;
  priorityBreakdown: Record<string, number>;
  totalEmployees?: number;
  activeEmployees?: number;
  totalFiles?: number;
  filesBreakdown?: Record<string, number>;
  fileWiseTotals?: Array<{
    fileNumber: string;
    subject: string;
    section: string;
    currentCustodian: string;
    status: string;
    priority: string;
    lettersCount: number;
    financialAmount: number;
  }>;
  aiExecutiveOverview?: string;
}

export interface LetterTemplate {
  id: string;
  title: string;
  category: LetterCategory;
  description: string;
  defaultDirection: LetterDirection;
  suggestedRecipient: string;
  sampleBody: string;
}

export type EmploymentType = 'Permanent' | 'Contractual' | 'Deputation' | 'Probation';
export type EmployeeStatus = 'Active' | 'On Leave' | 'Transferred' | 'Deputation' | 'Retired';
export type EmployeeRole = 
  | 'Director / HOD'
  | 'District Officer'
  | 'Section Officer'
  | 'Superintendent'
  | 'Clerk / Assistant'
  | 'Inspector / Evaluator'
  | 'Faculty / Principal';

export type ServiceSanctionType =
  | 'ಗಳಿಕೆ ರಜೆ'
  | 'ಶಿಶುಪಾಲನ ರಜೆ'
  | '10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ'
  | '15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ'
  | '20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ'
  | '25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ'
  | '30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ';

export interface ServiceSanctionRecord {
  id: string;
  sanctionType: ServiceSanctionType;
  kgidNumber: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  schoolOrOffice: string;
  fileNumber: string;
  orderNumber: string;
  sanctionDate: string;
  effectiveDate: string;
  previousBasicPay?: number;
  revisedBasicPay?: number;
  payScale?: string;
  leaveFrom?: string;
  leaveTo?: string;
  totalDays?: number;
  leaveReason?: string;
  remarks?: string;
  status: 'Sanctioned' | 'In Process' | 'Forwarded to Treasury';
}

export interface AdminAuthUser {
  username: string;
  role: 'Admin' | 'Administrator' | 'Data Entry Operator' | 'Viewer';
  displayName: string;
  designation: string;
  loginTime: string;
}

export type CadreGroup = 'ಗ್ರೂಪ್-ಎ' | 'ಗ್ರೂಪ್-ಬಿ' | 'ಗ್ರೂಪ್-ಸಿ' | 'ಗ್ರೂಪ್-ಡಿ';

export interface Employee {
  id: string;
  employeeCode: string; // e.g. EDN-EMP-1042
  kgidNumber?: string; // Karnataka Government Insurance Department (KGID) Number
  basicPay?: number; // Current Basic Pay (ಮೂಲ ವೇತನ) in ₹
  payScale?: string; // e.g. 37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850
  payLevel?: string; // e.g. 'Level-9'
  fullName: string;
  parentName?: string; // ತಂದೆ/ತಾಯಿ ಹೆಸರು
  designation: string; // ಹುದ್ದೆ
  cadreGroup?: CadreGroup; // ಹುದ್ದೆಯ ವರ್ಗ (Group A/B/C/D)
  section: DepartmentSection;
  officeLocation: string; // ಕಚೇರಿ/ಇಲಾಖೆ / ಶಾಲೆ
  appointmentDate?: string; // ನೇಮಕಾತಿ ದಿನಾಂಕ
  joiningDate: string; // ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ
  lastIncrementDate?: string; // ಹಿಂದಿನ ವೇತನ ಬಡ್ತಿ ದಿನಾಂಕ
  nextIncrementDate?: string; // ಮುಂದಿನ ವೇತನ ಬಡ್ತಿ ದಿನಾಂಕ
  incrementMonth?: 'January' | 'July' | string; // ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ತಿಂಗಳು (ಜನವರಿ / ಜುಲೈ)
  earnedLeaveBalance?: number; // ಗಳಿಕೆ ರಜೆ ಶಿಲ್ಕು
  childCareLeaveQuota?: number; // ಶಿಶುಪಾಲನ ರಜೆ ಒಟ್ಟು ಕೋಟಾ (Default 180 days for female employees, editable)
  childCareLeaveAvailed?: number; // ಶಿಶುಪಾಲನ ರಜೆ ತೆಗೆದುಕೊಂಡ ದಿನಗಳು
  gender?: string;
  dob?: string;
  age?: number;
  ddoCode?: string;
  placeOfWork?: string;
  epicNo?: string;
  hometown?: string;
  email: string;
  phone: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  role: EmployeeRole;
  qualifications?: string;
  notes?: string;
  otherServiceDetails?: string; // ಇತರೆ ಅಗತ್ಯ ಸೇವಾ ವಿವರಗಳು
  serviceHistory?: ServiceSanctionRecord[];
  salaryHistory?: SalaryHistoryRecord[];
  lastUpdated: string;
}

export interface OrderTypeConfig {
  id: string;
  nameKannada: string;
  nameEnglish: string;
  category: 'leave' | 'increment' | 'advancement';
  description: string;
  isActive: boolean;
  defaultRuleId?: string;
}

export interface PayRule {
  id: string;
  orderTypeId: string;
  orderTypeName: string;
  qualifyingYears: number; // e.g. 10, 15, 20, 25, 30
  incrementType: 'matrix_stage' | 'percentage' | 'fixed_amount' | 'promotional_scale';
  incrementValue: number; // e.g. 1 (stage), 3 (percent), 1250 (amount)
  minBasicPay?: number;
  maxBasicPay?: number;
  effectiveDateRule: 'completion_date' | 'first_of_next_month' | 'order_date';
  governmentOrderRef: string; // e.g. 'ಸರ್ಕಾರಿ ಆದೇಶ ಸಂ: ಆಇ 16 ಎಸ್ಆರ್ಪಿ 2018, ದಿನಾಂಕ: 07-03-2018'
  kcsrRuleRef?: string; // e.g. 'ಕೆಸಿಎಸ್ಆರ್ ನಿಯಮಾವಳಿ 53(ಬಿ)'
  remarks?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SalaryHistoryRecord {
  id: string;
  employeeId: string;
  kgidNumber: string;
  employeeName: string;
  date: string; // Record date
  orderType: string;
  orderNumber: string;
  oldBasicPay: number;
  increment: number;
  newBasicPay: number;
  effectiveDate: string;
  changedBy: string;
  changedRole: string;
  timestamp: string;
  remarks?: string;
}

export interface MemorandumOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderTypeId: string;
  orderTypeName: string;
  kgidNumber: string;
  employeeId?: string;
  employeeName: string;
  parentName?: string;
  designation: string;
  cadreGroup?: string;
  officeName?: string;
  officeLocation?: string;
  officeDepartment?: string;
  officeAddress?: string;
  oldBasicPay: number;
  incrementAmount: number;
  newBasicPay: number;
  payScale?: string;
  effectiveDate: string;
  ruleReference?: string;
  subject: string;
  preamble: string;
  orderText: string;
  officialRemarks?: string;
  leaveDetails?: {
    leaveType: string;
    leaveFrom: string;
    leaveTo: string;
    totalDays: number;
    reason?: string;
    balanceBefore?: number;
    balanceAfter?: number;
  };
  signatoryName: string;
  signatoryDesignation: string;
  copiesForwardedTo: string[];
  status: 'Approved' | 'Draft' | 'Cancelled';
  createdBy: string;
  createdRole: string;
  createdAt: string;
  fileId?: string;
}

export interface OrderFile {
  id: string;
  fileId: string;
  orderNumber: string;
  kgidNumber: string;
  employeeName: string;
  orderType: string;
  orderDate: string;
  effectiveDate: string;
  oldBasicPay: number;
  newBasicPay: number;
  createdBy: string;
  createdDate: string;
  generatedDocumentHtml: string;
  generatedDocumentText: string;
  fileSize?: string;
  remarks?: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  action: 'SALARY_CHANGE' | 'MEMORANDUM_GENERATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_CREATED' | 'PAY_RULE_EDITED' | 'ORDER_DELETED' | 'BACKUP_RESTORED' | 'LOGIN';
  kgidNumber?: string;
  employeeName?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  role: string;
  details: string;
  orderNumber?: string;
}

export interface MemorandumDashboardSummary {
  totalOrders: number;
  totalEmployees: number;
  totalSalaryChanges: number;
  financialImpactMonthly: number;
  ordersByType: Record<string, number>;
  recentOrders: MemorandumOrder[];
  recentSalaryChanges: SalaryHistoryRecord[];
  recentAuditLogs: AuditLogRecord[];
}

export interface OfficeConfig {
  id?: string;
  governmentName?: string;
  departmentName?: string;
  officeName?: string;
  officeAddress: string;
  officerName: string;
  officerDesignation?: string;
  district: string;
  pincode?: string;
  email?: string;
  phone?: string;
  orderPrefix?: string;
  kcsrEdition?: string;
  officeNameKannada?: string;
  officeNameEnglish?: string;
  officerDesignationKannada?: string;
  departmentKannada?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface OcrExtractedData {
  letterNumber?: string;
  date?: string;
  employeeName?: string;
  kgidNumber?: string;
  designation?: string;
  officeName?: string;
  department?: string;
  subject?: string;
  reference?: string;
  serviceDetails?: string;
  leaveDetails?: string;
  salaryDetails?: string;
  otherInfo?: string;
}

export interface LetterVersion {
  versionNumber: number;
  updatedAt: string;
  updatedBy: string;
  letterHtml: string;
  letterText: string;
  notes?: string;
}

export interface LetterFormattingOptions {
  fontFamily: string;
  fontSize: string;
  lineSpacing: string;
  margins: string;
  hasHeader: boolean;
  hasFooter: boolean;
}

export interface GeneratedOfficeLetter {
  id: string; // Internal PK
  documentId: string; // Formatted Document ID e.g. DOC-2026/09/LET-482
  letterNumber: string; // Official Letter or Order Number e.g. BEO/BHD/MEMO/2026/104
  date: string; // YYYY-MM-DD
  letterType: string; // e.g. 'ಸಾಮಾನ್ಯ ಪತ್ರ', 'ಜ್ಞಾಪನಾ ಆದೇಶ', 'ಕಚೇರಿ ಆದೇಶ', etc.
  letterCategory: 'normal' | 'memorandum' | 'office_order' | 'leave' | 'increment' | 'certificate' | 'custom';

  // Linked original document
  originalFile?: {
    fileName: string;
    fileSize: string;
    fileType: string;
    uploadedAt: string;
    dataUrl?: string; // base64 or preview data
  };

  // OCR raw & extracted
  ocrRawText?: string;
  ocrExtracted: OcrExtractedData;

  // Prompt / User instruction
  userPrompt: string;

  // Generated Content & Editor fields
  subject: string;
  reference: string;
  preamble?: string;
  recipient?: string;
  sender?: string;
  bodyHtml: string;
  bodyText: string;
  endorsements: string[]; // Copies to (ಪ್ರತಿ ರವಾನೆ)
  signatory: {
    name: string;
    designation: string;
    office: string;
  };

  // Linked employee fields
  employeeName?: string;
  kgidNumber?: string;
  designation?: string;
  officeName?: string;
  department?: string;

  // Formatting options
  formatting?: LetterFormattingOptions;

  status: 'Draft' | 'Finalized' | 'Approved' | 'Dispatched';
  createdBy: string;
  createdAt: string;
  lastUpdated: string;

  // Versioning
  currentVersion: number;
  versions: LetterVersion[];
}

export interface OfficeLetterTemplate {
  id: string;
  typeKey: string;
  nameKannada: string;
  nameEnglish: string;
  category: string;
  description: string;
  defaultSubject: string;
  defaultReference: string;
  templateHtml: string;
  templateText: string;
  defaultEndorsements: string[];
  isCustom?: boolean;
  updatedAt: string;
}

export interface LetterDashboardStatistics {
  totalLetters: number;
  todayCount: number;
  normalLettersCount: number;
  memorandumOrdersCount: number;
  leaveOrdersCount: number;
  incrementOrdersCount: number;
  pendingDraftsCount: number;
  customLettersCount: number;
}

export type GeneralLetterCategory = 'employee' | 'other';

export interface GeneralLetterFormData {
  category: GeneralLetterCategory;
  // Type 1: ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ
  employeeName: string;
  kgidNumber: string;
  designation: string;
  officeName: string;
  employeeDetails: string;
  // Type 2: ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರ
  recipient: string;
  mainContent: string;
  otherInstructions: string;
  // Common
  fileNumber?: string; // ಕಡತ ಸಂಖ್ಯೆ (ಉದಾ: 57) - ನಿಯಮ: ಮೊದಲು ಕಡತ ತಯಾರಿಸಬೇಕು ನಂತರ ಪತ್ರ ತಯಾರಿಸಬೇಕು
  subject: string;
  reference: string;
  date: string;
  additionalPrompt: string;
}

// ==================== NAVIGATION TABS ====================
export type AppNavTab = 
  | 'home'
  | 'fileDashboard'
  | 'leaveCalendar'
  | 'pension'
  | 'generalLetter'
  | 'officialLetter'
  | 'memorandum' 
  | 'employees' 
  | 'orderFiles' 
  | 'salaryChanges' 
  | 'reports' 
  | 'search' 
  | 'settings' 
  | 'schools'
  | 'registry' 
  | 'files' 
  | 'drafter' 
  | 'rti'
  | 'prapathra28'
  | 'circularStudio'
  | 'masterAudit';

export type LeaveCategory = 
  | 'ಶಿಶುಪಾಲನ ರಜೆ (Child Care Leave)' 
  | 'ಹೆರಿಗೆ ರಜೆ (Maternity Leave)' 
  | 'ಗಳಿಕೆ ರಜೆ (Earned Leave)' 
  | 'ಪರಿವರ್ತಿತ ರಜೆ (Commuted Leave)' 
  | 'ಸಾಂದರ್ಭಿಕ ರಜೆ (Casual Leave)';

export interface LeaveRequestRecord {
  id: string;
  employeeId?: string;
  employeeName: string;
  kgidNumber: string;
  designation: string;
  gender?: string;
  placeOfWork?: string;
  leaveType: LeaveCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  status: 'Sanctioned' | 'Pending Approval' | 'Under Review' | 'Completed' | 'Rejected';
  orderNumber?: string;
  orderDate?: string;
  reason: string;
  quotaBefore: number;
  quotaConsumed: number;
  quotaRemaining: number;
  childDetails?: string; // e.g. "ಮಗುವಿನ ಹೆಸರು: ಆನ್ವಿ (ವಯಸ್ಸು ೪ ವರ್ಷ)"
  sanctioningAuthority?: string; // e.g. "ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ"
  notes?: string;
  createdAt?: string;
}


export type SchoolGrantStatus = 'Aided' | 'Unaided' | 'Proposed for Grant' | 'Partially Aided';
export type SchoolCategoryType = 'Pre-Primary' | 'Primary (1-5)' | 'Higher Primary (1-8)' | 'High School (8-10)' | 'Composite (1-10)';

export interface SchoolInstitution {
  id: string;
  schoolCode: string;
  schoolName: string;
  udiseCode: string;
  institutionName: string; // ಸಂಸ್ಥೆ / ಟ್ರಸ್ಟ್ / ಆಡಳಿತ ಮಂಡಳಿ ಹೆಸರು
  managementName?: string; // ಆಡಳಿತ ಮಂಡಳಿ ಹೆಸರು (Alias)
  societyRegNumber: string; // ಸೊಸೈಟಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ ಮತ್ತು ದಿನಾಂಕ
  grantStatus: SchoolGrantStatus; // ಅನುದಾನ ಸ್ಥಿತಿ (ವೇತನಾನುದಾನಿತ / ಅನುದಾನ ರಹಿತ / ಪ್ರಸ್ತಾವಿತ ಅನುದಾನ)
  grantOrderNumber?: string; // ಅನುದಾನ ಮಂಜೂರಾತಿ ಆದೇಶ ಸಂಖ್ಯೆ
  grantOrderDate?: string; // ಅನುದಾನ ಆದೇಶ ದಿನಾಂಕ
  schoolPhone?: string; // ಶಾಲಾ ಕಚೇರಿ ದೂರವಾಣಿ
  hmName: string; // ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಹೆಸರು
  hmPhone: string; // ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ
  secretaryName?: string; // ಸಂಸ್ಥೆಯ ಅಧ್ಯಕ್ಷರು / ಕಾರ್ಯದರ್ಶಿ ಹೆಸರು
  secretaryPhone?: string; // ಕಾರ್ಯದರ್ಶಿ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ
  email?: string;
  address?: string;
  locationCluster: string; // ಕ್ಲಸ್ಟರ್ (e.g. ಹಳೇನಗರ, ಹೊಸನಗರ, ಕುದ್ರಿಗೆರೆ, ಹೊಳೆಹೊನ್ನೂರು)
  medium: 'Kannada' | 'English' | 'Kannada & English';
  schoolCategory: SchoolCategoryType;
  studentCount: number;
  aidedTeachersCount: number;
  unaidedTeachersCount: number;
  recognitionValidUpto: string; // e.g. '2026-27'
  recognitionStatus: 'Valid' | 'Renewal Due' | 'Expired';
  fireSafetyNocValidUpto?: string;
  buildingSafetyValidUpto?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  notes?: string;
  lastUpdated?: string;
}

// ==================== PENSION MANAGEMENT & RETIREMENT BENEFITS ====================

export type PensionRetirementType = 
  | 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)'
  | 'ಸ್ವಯಂ ನಿವೃತ್ತಿ (Voluntary Retirement)'
  | 'ಅಶಕ್ತತಾ ಪಿಂಚಣಿ (Invalid Pension)'
  | 'ಸೇವೆಯಲ್ಲಿದ್ದಾಗ ಮರಣ (Family Pension on Death)'
  | 'ಕಡ್ಡಾಯ ನಿವೃತ್ತಿ (Compulsory Retirement)';

export interface PensionCalculationResult {
  // Service calculations
  grossYears: number;
  grossMonths: number;
  grossDays: number;
  nonQualifyingDays: number;
  netQualifyingYears: number;
  netQualifyingMonths: number;
  netQualifyingDays: number;
  qualifyingHalfYears: number; // completed 6-monthly periods (cap: 60)
  isEligibleForFullPension: boolean; // 60 half-years (30 years)
  isEligibleForRegularPension: boolean; // >= 20 half-years (10 years)

  // Emoluments
  lastBasicPay: number;
  daPercentage: number;
  daAmount: number;
  averageEmoluments: number;

  // Monthly Pension
  fullPension: number; // 50% of Basic Pay
  basicServicePension: number; // proportionate to qualifying service
  commutedPortion: number; // Portion commuted (up to 40% or 33.33%)
  reducedMonthlyPension: number; // basicServicePension - commutedPortion
  dearnessRelief: number; // DR on basicServicePension
  medicalAllowance: number; // Fixed ₹500
  totalMonthlyReceivable: number; // reducedMonthlyPension + DR + medical

  // Lump sum Benefits
  commutationFactor: number;
  commutationLumpSum: number; // commutedPortion * 12 * factor
  commutationRestorationYears: number; // 15 years

  // DCRG (Death-cum-Retirement Gratuity)
  dcrgRaw: number;
  dcrgSanctioned: number; // Capped at ₹20,00,000 & 16.5 months

  // Family Pension
  familyPensionNormal: number; // 30% of Basic Pay (min ₹13,500)
  familyPensionEnhanced: number; // 50% of Basic Pay (for 7 yrs or till 67 age)

  // Leave Encashment
  earnedLeaveDays: number;
  leaveEncashmentAmount: number; // (Basic + DA) / 30 * days (max 300)

  // Grand Total Terminal Lump Sum
  totalTerminalLumpSum: number; // DCRG + Commutation + Leave Encashment
}

export interface PensionDocumentsChecklist {
  serviceBookVerified: boolean; // ಮೂಲ ಸೇವಾ ಪುಸ್ತಕ ಪರಿಶೀಲನೆ & ದೃಢೀಕರಣ
  form7Triplicate: boolean; // ಪ್ರಪತ್ರ-೭ (ಮೂರು ಪ್ರತಿಗಳಲ್ಲಿ)
  jointPhotosAttested: boolean; // ಜಂಟಿ ಭಾವಚಿತ್ರಗಳು (ದೃಢೀಕರಿಸಿದ)
  specimenSignatures: boolean; // ಮಾದರಿ ಸಹಿ & ಹೆಬ್ಬೆರಳ ಗುರುತು (ನಮೂನೆ-೧/೨)
  noDueCertificate: boolean; // ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ (NDC)
  lastPayCertificate: boolean; // ಕೊನೆಯ ವೇತನ ಪ್ರಮಾಣಪತ್ರ (LPC)
  form1And2Nomination: boolean; // ನಾಮನಿರ್ದೇಶನ ಪತ್ರ
  aadharBankPassbook: boolean; // ಆಧಾರ್ & ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಪ್ರತಿ
}

export type PensionCaseStatus = 
  | 'ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ (Drafting)'
  | 'ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ (Service Verified)'
  | 'BEO ಅನುಮೋದಿತ (Sanctioned by BEO)'
  | 'ಮಹಾಲೆಕ್ಕಪಾಲರ ಕಚೇರಿಗೆ ರವಾನೆ (Sent to AG Karnataka)'
  | 'PPO ಮಂಜೂರಾಗಿದೆ (PPO Issued)'
  | 'ವಿಲೇವಾರಿ ಮುಕ್ತಾಯ (Completed & Disposed)';

export interface PensionCaseRecord {
  id: string;
  caseNumber: string; // e.g. BEO/BHD/PEN/2026/01
  fileNumber: string; // e.g. ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಪಿಂಚಣಿ/ಕಡತ-14/2026-27
  fileId?: string;
  employeeId?: string;
  kgidNumber: string;
  employeeName: string;
  parentOrSpouseName: string;
  designation: string;
  cadreGroup: string;
  officeOrSchool: string;
  gender: string;
  dob: string;
  doa: string; // Date of Appointment
  dor: string; // Date of Retirement
  retirementType: PensionRetirementType;

  // Pay & Service
  payScale: string;
  lastBasicPay: number;
  daPercentage: number;
  averageEmoluments?: number;
  earnedLeaveDays: number; // EL balance (max 300)
  nonQualifyingDays: number; // EOL, Dies-non etc.

  // Commutation
  commutationOpted: boolean;
  commutationPercentage: number; // e.g. 40 or 33.33
  ageNextBirthday: number; // e.g. 61

  // Nominee & Bank Details
  nomineeName: string;
  nomineeRelation: string;
  nomineeDob: string;
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  ifscCode: string;
  treasuryName: string; // e.g. 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ'
  ppoNumber?: string; // Pension Payment Order Number

  // Calculations & Checklist
  calculation: PensionCalculationResult;
  checklist: PensionDocumentsChecklist;
  status: PensionCaseStatus;
  movementHistory: FileMovementRecord[];
  remarks?: string;
  createdAt: string;
  lastUpdated: string;
}

export type PensionLetterFormatType = 
  | 'form7' // ಪ್ರಪತ್ರ-೭ (ಪಿಂಚಣಿ ಮತ್ತು ಉಪದಾನದ ಮಂಜೂರಾತಿ ಪ್ರಸ್ತಾವನೆ - Form 7)
  | 'form1_2' // ನಮೂನೆ-೧ & ೨ (ಪಿಂಚಣಿ ಅರ್ಜಿ ಮತ್ತು ಕುಟುಂಬ ವಿವರ / ನಾಮನಿರ್ದೇಶನ)
  | 'form6' // ನಮೂನೆ-೬ (ಸೇವಾ ಪರಿಶೀಲನೆ ಮತ್ತು ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ)
  | 'sanction_order' // ಪಿಂಚಣಿ ಮಂಜೂರಾತಿ ಜ್ಞಾಪನಾ ಆದೇಶ (BEO Sanction Memorandum)
  | 'provisional_order' // ತಾತ್ಕಾಲಿಕ ಪಿಂಚಣಿ ಮತ್ತು ಉಪದಾನ ಮಂಜೂರಾತಿ ಆದೇಶ (KCSR 341)
  | 'commutation_order' // ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಮಂಜೂರಾತಿ ಆದೇಶ (Commutation Sanction Order)
  | 'ag_forwarding' // ಮಹಾಲೆಕ್ಕಪಾಲರಿಗೆ (AG Karnataka) ಪ್ರಸ್ತಾವನಾ ರವಾನೆ ಪತ್ರ
  | 'no_dues_cert'; // ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ (No Dues & Vigilance Clearance Certificate)
