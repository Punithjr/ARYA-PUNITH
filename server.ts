import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { generateOfficeLetterDocx } from './server/letterDb';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Model helper
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Resilient Gemini invoker with automatic model fallback for high demand (503) & rate limits
async function callGeminiWithFallback<T>(
  gemini: GoogleGenAI,
  requestFn: (client: GoogleGenAI, modelName: string) => Promise<T>
): Promise<{ result: T; modelUsed: string } | null> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await requestFn(gemini, model);
      return { result, modelUsed: model };
    } catch (err: any) {
      const msg = (err?.message || String(err)).toLowerCase();
      const isTemporaryDemand =
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('unavailable') ||
        msg.includes('429') ||
        msg.includes('resource_exhausted') ||
        msg.includes('quota');

      if (isTemporaryDemand && i < models.length - 1) {
        // Quota or high demand on current model - pause before trying alternate model
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      break;
    }
  }
  return null;
}

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
  dataUrl?: string;
}

export interface EducationLetter {
  id: string;
  referenceNumber: string;
  fileNumber: string;
  direction: 'inward' | 'outward';
  subject: string;
  category: string;
  senderName: string;
  senderDepartment: string;
  senderDesignation: string;
  recipientName: string;
  recipientDepartment: string;
  recipientDesignation: string;
  dateReceivedOrIssued: string;
  dueDate: string;
  priority: 'Immediate' | 'Urgent' | 'Routine' | 'Normal';
  status: 'Pending Action' | 'Under Review' | 'Approved & Signed' | 'Dispatched' | 'Closed & Archived';
  assignedOfficer: string;
  section: string;
  confidentiality: 'Public / Open' | 'Departmental Confidential' | 'Secret / Policy';
  bodyText: string;
  actionNotes: ActionNote[];
  attachments: DocumentAttachment[];
  endorsements?: string[];
  tags: string[];
  financialAmount?: number;
  lastUpdated: string;
  fileLetterNumber?: string;
  sectionCode?: string;
  sectionName?: string;
  inwardNumber?: string;
  outwardNumber?: string;
  senderLetterNo?: string;
  senderLetterDate?: string;
  dispatchMode?: string;
  trackingNumber?: string;
  postalStampAmount?: number;
  remarks?: string;
}

export interface FileMovementRecord {
  id: string;
  fromOfficer: string;
  toOfficer: string;
  sentDate: string;
  remarks: string;
  statusAfterMove: string;
}

export interface MasterDocketFile {
  id: string;
  fileNumber: string;
  subject: string;
  section: string;
  fileCategory?: string;
  initiatedDate: string;
  status: 'Active / Open' | 'Under Scrutiny' | 'Pending Higher Approval' | 'Disposed / Closed';
  currentCustodian: string;
  priority: 'Immediate' | 'Urgent' | 'Routine' | 'Normal';
  linkedLetterIds: string[];
  movementHistory: FileMovementRecord[];
  notes?: string;
  isRtiFile?: boolean;
  rtiDetails?: any;
  attachments?: DocumentAttachment[];
  sectionCode?: string;
  sectionName?: string;
  lettersCount?: number;
}

export interface ServiceSanctionRecord {
  id: string;
  sanctionType: string;
  kgidNumber: string;
  employeeId?: string;
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
  status: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  kgidNumber?: string;
  basicPay?: number;
  payScale?: string;
  payLevel?: string;
  cadreGroup?: string;
  fullName: string;
  designation: string;
  gender?: string;
  dob?: string;
  age?: number;
  ddoCode?: string;
  parentName?: string;
  placeOfWork?: string;
  epicNo?: string;
  hometown?: string;
  section: string;
  officeLocation: string;
  email: string;
  phone: string;
  employmentType: string;
  status: string;
  role: string;
  appointmentDate?: string;
  joiningDate: string;
  lastIncrementDate?: string;
  nextIncrementDate?: string;
  incrementMonth?: 'January' | 'July' | string;
  earnedLeaveBalance?: number;
  childCareLeaveQuota?: number;
  childCareLeaveAvailed?: number;
  qualifications?: string;
  otherServiceDetails?: string;
  notes?: string;
  serviceHistory?: ServiceSanctionRecord[];
  lastUpdated: string;
}

// Initial realistic Education Department data
let sampleLetters: EducationLetter[] = [
  {
    id: 'let-45-1',
    referenceNumber: 'ಇಡಿ/ಬಿಇಒ/ಭದ್ರಾ/ಆ1(ಸ.ಪ್ರಾ.ಶಿ)/ಕಡತ-45/45-1/2026-27',
    fileNumber: '45',
    fileLetterNumber: '45-1',
    sectionCode: 'ಆ1',
    sectionName: 'ಸ.ಪ್ರಾ.ಶಿ',
    direction: 'outward',
    subject: 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರ ಜನವರಿ-೨೦೨೬ ರ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರಾತಿ ಪ್ರಪತ್ರ-೨೮ ಮತ್ತು ಆದೇಶ',
    category: 'Official Order',
    senderName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
    senderDesignation: 'Block Education Officer',
    senderDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ',
    recipientName: 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆಗಳ ಮುಖ್ಯಸ್ಥರು ಹಾಗೂ ಶಿಕ್ಷಕರು, ಭದ್ರಾವತಿ ವಲಯ',
    recipientDesignation: 'Heads of Institutions & Teachers',
    recipientDepartment: 'ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಗಳು, ಭದ್ರಾವತಿ',
    dateReceivedOrIssued: '2026-01-05',
    dueDate: '2026-01-20',
    priority: 'Urgent',
    status: 'Dispatched',
    assignedOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (ಸಿಬ್ಬಂದಿ ಶಾಖೆ-ಆ1)',
    section: 'Administration & Services',
    confidentiality: 'Public / Open',
    bodyText: `ಕರ್ನಾಟಕ ಸರ್ಕಾರ\nಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ\nಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301\n\nಸಂಖ್ಯೆ: ಇಡಿ/ಬಿಇಒ/ಭದ್ರಾ/ಆ1(ಸ.ಪ್ರಾ.ಶಿ)/ಕಡತ-45/45-1/2026-27                      ದಿನಾಂಕ: 05-01-2026\n\nಕಛೇರಿ ಆದೇಶ\n\nವಿಷಯ: ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರಿಗೆ ದಿನಾಂಕ: 01-01-2026 ರಿಂದ ಅನ್ವಯವಾಗುವಂತೆ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರು ಮಾಡುವ ಬಗ್ಗೆ.\nಉಲ್ಲೇಖ: 1. ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿ (KCSR) ನಿಯಮ 52 ಮತ್ತು ಪ್ರಪತ್ರ-28.\n        2. ಸಂಬಂಧಪಟ್ಟ ಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು ಸಲ್ಲಿಸಿರುವ ಪ್ರಪತ್ರ-28 ರ ಸೇವಾ ತೃಪ್ತಿಕರ ಪ್ರಮಾಣ ಪತ್ರಗಳು.\n\nಪ್ರಸ್ತಾವನೆ:\nಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ವ್ಯಾಪ್ತಿಗೆ ಒಳಪಡುವ ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಗಳಲ್ಲಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸುತ್ತಿರುವ ಶಿಕ್ಷಕರುಗಳು ಹಿಂದಿನ ಒಂದು ವರ್ಷದ ಅವಧಿಯಲ್ಲಿ ಯಾವುದೇ ಅಸಾಧಾರಣ ರಜೆ ಅಥವಾ ದಂಡನೆಗೆ ಒಳಗಾಗದೇ ತೃಪ್ತಿಕರ ಸೇವೆ ಪೂರೈಸಿರುವುದರಿಂದ, KCSR ನಿಯಮ 52 ರಂತೆ ಜನವರಿ-2026 ರ ಮಾಹೆಯಲ್ಲಿ ನಿಗದಿತ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿಯನ್ನು ಮಂಜೂರು ಮಾಡಲು ನಿಯಮಾನುಸಾರ ಕ್ರಮವಹಿಸಲಾಗಿದೆ.\n\nಆದೇಶ:\nಪ್ರಸ್ತಾವನೆಯಲ್ಲಿ ವಿವರಿಸಿರುವ ಅಂಶಗಳ ಹಿನ್ನೆಲೆಯಲ್ಲಿ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಸಿಬ್ಬಂದಿ ಶಾಖೆಯ ಕಡತ ಸಂಖ್ಯೆ: 45 ರನ್ವಯ ಸಿದ್ಧಪಡಿಸಲಾಗಿರುವ ಪ್ರಪತ್ರ-28 ರ ನೌಕರರ ಪಟ್ಟಿಯನ್ವಯ, ಈ ಕೆಳಕಂಡ ಶಿಕ್ಷಕರಿಗೆ ದಿನಾಂಕ: 01-01-2026 ರಿಂದ ಜಾರಿಗೆ ಬರುವಂತೆ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿಯನ್ನು ಮಂಜೂರು ಮಾಡಿ ಆದೇಶಿಸಿದೆ.\n\nವೇತನ ಬಡ್ತಿ ಮಂಜೂರಾದ ನೌಕರರ ವಿವರಗಳನ್ನು ಸೇವಾ ಪುಸ್ತಕಗಳಲ್ಲಿ ದಾಖಲಿಸಿ, ಹೆಚ್.ಆರ್.ಎಂ.ಎಸ್ ತಂತ್ರಾಂಶದಲ್ಲಿ ನವೀಕರಿಸಲು ಸೂಚಿಸಲಾಗಿದೆ.\n\n(ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು)\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ`,
    actionNotes: [
      {
        id: 'note-45-1',
        author: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು',
        designation: 'Office Superintendent',
        timestamp: '2026-01-05 11:30',
        note: 'ಕಡತ 45 ರನ್ವಯ ಪ್ರಪತ್ರ-28 ರಂತೆ ಜನವರಿ ವೇತನ ಬಡ್ತಿ ಆದೇಶ ಸಿದ್ಧಪಡಿಸಿ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        actionType: 'Approval'
      }
    ],
    attachments: [],
    tags: ['ವೇತನ ಬಡ್ತಿ', 'ಕಡತ-45', 'ಪ್ರಪತ್ರ-೨೮'],
    lastUpdated: '2026-01-05'
  },
  {
    id: 'let-45-2',
    referenceNumber: 'ಇಡಿ/ಬಿಇಒ/ಭದ್ರಾ/ಆ1(ಸ.ಪ್ರಾ.ಶಿ)/ಕಡತ-45/45-2/2026-27',
    fileNumber: '45',
    fileLetterNumber: '45-2',
    sectionCode: 'ಆ1',
    sectionName: 'ಸ.ಪ್ರಾ.ಶಿ',
    direction: 'outward',
    subject: 'ಜುಲೈ-೨೦೨೬ ರ ಮಾಹೆಯ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಪಡೆಯುವ ಶಿಕ್ಷಕರ ಸೇವಾ ವಹಿ ದಾಖಲಾತಿ ಹಾಗೂ ಪ್ರಪತ್ರ-೨೮ ಪರಿಶೀಲನಾ ನಡಾವಳಿ',
    category: 'Circular & Directive',
    senderName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
    senderDesignation: 'Block Education Officer',
    senderDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ',
    recipientName: 'ಭದ್ರಾವತಿ ವಲಯದ ಎಲ್ಲಾ ಸ.ಪ್ರಾ.ಶಿ ಶಾಲಾ ಮುಖ್ಯಸ್ಥರು',
    recipientDesignation: 'Headmasters',
    recipientDepartment: 'ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಗಳು, ಭದ್ರಾವತಿ',
    dateReceivedOrIssued: '2026-07-02',
    dueDate: '2026-07-15',
    priority: 'Normal',
    status: 'Dispatched',
    assignedOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಆ1)',
    section: 'Administration & Services',
    confidentiality: 'Public / Open',
    bodyText: `ಕರ್ನಾಟಕ ಸರ್ಕಾರ\nಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ\nಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301\n\nಸಂಖ್ಯೆ: ಇಡಿ/ಬಿಇಒ/ಭದ್ರಾ/ಆ1(ಸ.ಪ್ರಾ.ಶಿ)/ಕಡತ-45/45-2/2026-27                      ದಿನಾಂಕ: 02-07-2026\n\nಸುತ್ತೋಲೆ\n\nವಿಷಯ: ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರ ಜುಲೈ-2026 ರ ಮಾಹೆಯ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಪ್ರಪತ್ರ-28 ಪರಿಶೀಲನೆ ಬಗ್ಗೆ.\nಉಲ್ಲೇಖ: ಕಡತ ಸಂಖ್ಯೆ: 45 (ವೇತನ ಬಡ್ತಿ ಶಾಖೆ).\n\nಜುಲೈ-2026 ರ ಮಾಹೆಯಲ್ಲಿ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿಗೆ ಅರ್ಹರಿರುವ ಶಿಕ್ಷಕರ ಪ್ರಪತ್ರ-28 ರ ದಾಖಲೆಗಳನ್ನು ದಿನಾಂಕ: 15-07-2026 ರೊಳಗಾಗಿ ಸಿಬ್ಬಂದಿ ಶಾಖೆ (ಆ1) ಗೆ ಸಲ್ಲಿಸಲು ಮುಖ್ಯೋಪಾಧ್ಯಾಯರಿಗೆ ಸೂಚಿಸಲಾಗಿದೆ.\n\n(ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು)\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ`,
    actionNotes: [],
    attachments: [],
    tags: ['ವೇತನ ಬಡ್ತಿ', 'ಕಡತ-45', 'ಜುಲೈ ಬಡ್ತಿ'],
    lastUpdated: '2026-07-02'
  },
  {
    id: 'let-101',
    referenceNumber: 'BEO/BHD/2026/CIR-104',
    fileNumber: 'FILE-2026/ACAD-SOP/012',
    direction: 'outward',
    subject: 'ಭದ್ರಾವತಿ ವಲಯದ ಪ್ರೌಢಶಾಲೆಗಳಲ್ಲಿ STEM & ಕಂಪ್ಯೂಟರ್ ಲ್ಯಾಬ್ ಕಡ್ಡಾಯ ಅನುಷ್ಠಾನ ಕುರಿತು ಸುತ್ತೋಲೆ',
    category: 'Circular & Directive',
    senderName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO)',
    senderDesignation: 'Block Education Officer',
    senderDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ',
    recipientName: 'ಭದ್ರಾವತಿ ವಲಯದ ಎಲ್ಲಾ ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು',
    recipientDesignation: 'Heads of Institutions',
    recipientDepartment: 'ಸರ್ಕಾರಿ / ಅನುದಾನಿತ ಪ್ರೌಢಶಾಲೆಗಳು, ಭದ್ರಾವತಿ',
    dateReceivedOrIssued: '2026-08-15',
    dueDate: '2026-09-30',
    priority: 'Urgent',
    status: 'Dispatched',
    assignedOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO, ಭದ್ರಾವತಿ)',
    section: 'Academic Wing',
    confidentiality: 'Public / Open',
    financialAmount: 250000,
    bodyText: `ಕರ್ನಾಟಕ ಸರ್ಕಾರ\nಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ\nಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301\n\nಸಂಖ್ಯೆ: BEO/BHD/2026/CIR-104                                       ದಿನಾಂಕ: 15-08-2026\n\nಗೆ:\nಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಎಲ್ಲಾ ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು ಹಾಗೂ ಪ್ರಾಂಶುಪಾಲರು.\n\nವಿಷಯ: ಭದ್ರಾವತಿ ವಲಯದ ಸರ್ಕಾರಿ ಮತ್ತು ಅನುದಾನಿತ ಪ್ರೌಢಶಾಲೆಗಳಲ್ಲಿ STEM ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿ ಪ್ರಯೋಗಾಲಯಗಳ ಕಡ್ಡಾಯ ಅನುಷ್ಠಾನ ಕುರಿತು.\n\nಉಲ್ಲೇಖ: ನಿರ್ದೇಶಕರ ಆದೇಶ ಸಂಖ್ಯೆ: ಇಡಿ/42/ಎಸ್ಇಸಿ/2026.\n\nಮಾನ್ಯರೇ,\n\nಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬರುವ ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಹಾಗೂ ಅನುದಾನಿತ ಪ್ರೌಢಶಾಲೆಗಳಲ್ಲಿ 9 ಮತ್ತು 10 ನೇ ತರಗತಿಯ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ತಂತ್ರಜ್ಞಾನ ಆಧಾರಿತ STEM ಕಲಿಕೆಯನ್ನು ಕಡ್ಡಾಯವಾಗಿ ಜಾರಿಗೊಳಿಸಲು ಈ ಕೆಳಕಂಡ ನಿರ್ದೇಶನಗಳನ್ನು ನೀಡಲಾಗಿದೆ:\n\n1. ಉಪಕರಣಗಳ ಸಜ್ಜುಗೊಳಿಸುವಿಕೆ: ಪ್ರತಿ ಶಾಲೆಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ಕಂಪ್ಯೂಟರ್ ಲ್ಯಾಬ್‌ಗಳಲ್ಲಿ ಸೂಕ್ತ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಮತ್ತು ವಿದ್ಯುತ್ ಬ್ಯಾಕಪ್ ವ್ಯವಸ್ಥೆಯನ್ನು ಸುಸ್ಥಿತಿಯಲ್ಲಿಡತಕ್ಕದ್ದು.\n\n2. ಶಿಕ್ಷಕರ ತರಬೇತಿ: ನಿಯೋಜಿತ ಗಣಕ ವಿಜ್ಞಾನ ಶಿಕ್ಷಕರು ನಿಗದಿತ ವಲಯ ಮಟ್ಟದ ಪುನಶ್ಚೇತನ ಕಾರ್ಯಾಗಾರಕ್ಕೆ ಕಡ್ಡಾಯವಾಗಿ ಹಾಜರಾಗತಕ್ಕದ್ದು.\n\n3. ಅನುಪಾಲನಾ ವರದಿ: ದಿನಾಂಕ 30-09-2026 ರೊಳಗಾಗಿ ಲ್ಯಾಬ್ ಸೌಲಭ್ಯಗಳ ಪರಿಶೀಲನಾ ವರದಿಯನ್ನು ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ಇಲ್ಲಿಗೆ ಸಲ್ಲಿಸುವುದು.\n\nತಮ್ಮ ನಂಬಿಕಸ್ಥ,\n\n(ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು)\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ\nಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ\n\nಪ್ರತಿ ರವಾನೆ:\n1. ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ.\n2. ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳು (BCO), ಬಿ.ಆರ್.ಸಿ, ಭದ್ರಾವತಿ.\n3. ಕಛೇರಿ ಕಡತ / ಆದೇಶ ಪುಸ್ತಕ.`,
    actionNotes: [
      {
        id: 'note-1',
        author: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು',
        designation: 'Block Education Officer',
        timestamp: '2026-08-14 16:30',
        note: 'ವಲಯ ಮಟ್ಟದ ಸಭೆಯಲ್ಲಿ ಅನುಮೋದಿಸಲಾಗಿದೆ. ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಎಲ್ಲಾ ಶಾಲೆಗಳಿಗೆ ತಕ್ಷಣ ಜಾರಿಗೊಳಿಸಿ.',
        actionType: 'Approval'
      }
    ],
    attachments: [
      {
        id: 'att-1',
        fileName: 'Bhadravathi_STEM_Lab_Guidelines_2026.pdf',
        fileSize: '2.4 MB',
        fileType: 'application/pdf',
        pageCount: 14,
        uploadedAt: '2026-08-14'
      }
    ],
    endorsements: [
      'ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ',
      'ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳು (BCO), ಬಿ.ಆರ್.ಸಿ, ಭದ್ರಾವತಿ',
      'ಕಛೇರಿ ಕಡತ, ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ'
    ],
    tags: ['#STEM', '#Curriculum', '#MandatoryCircular', '#BhadravathiBEO'],
    lastUpdated: '2026-08-15'
  },
  {
    id: 'let-102',
    referenceNumber: 'DEO-SHIV/2026/INW-8812',
    fileNumber: 'FILE-2026/SCH-INSP/089',
    direction: 'inward',
    subject: 'ಭದ್ರಾವತಿ ವಲಯದ ಶಾಲೆಗಳ ಸುರಕ್ಷತೆ ಹಾಗೂ ಮೂಲಭೂತ ಸೌಕರ್ಯಗಳ ಪರಿಶೀಲನಾ ವರದಿ',
    category: 'School Inspection & Safety',
    senderName: 'ಶಾಲಾ ಸುರಕ್ಷತಾ ಇನ್ಸ್‌ಪೆಕ್ಟರ್',
    senderDesignation: 'Inspection & Safety Officer',
    senderDepartment: 'ಜಿಲ್ಲಾ ಪರಿಶೀಲನಾ ಕೋಶ, ಶಿವಮೊಗ್ಗ',
    recipientName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO)',
    recipientDesignation: 'Block Education Officer',
    recipientDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ',
    dateReceivedOrIssued: '2026-09-02',
    dueDate: '2026-09-18',
    priority: 'Immediate',
    status: 'Pending Action',
    assignedOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO, ಭದ್ರಾವತಿ)',
    section: 'Inspection & Quality',
    confidentiality: 'Departmental Confidential',
    bodyText: `ಕರ್ನಾಟಕ ಸರ್ಕಾರ\nಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ\nಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301\n\nಪತ್ರ ಸಂಖ್ಯೆ: DEO-SHIV/2026/INW-8812                                    ದಿನಾಂಕ: 02-09-2026\n\nಗೆ:\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು,\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ.\n\nವಿಷಯ: ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಶಾಲೆಗಳ ಅಗ್ನಿ ಸುರಕ್ಷತೆ ಹಾಗೂ ಕಟ್ಟಡ ಸ್ಥಿರತೆಯ ತಪಾಸಣಾ ವರದಿ ಸಲ್ಲಿಕೆ.\n\nಮಾನ್ಯರೇ,\n\nಭದ್ರಾವತಿ ವಲಯ ವ್ಯಾಪ್ತಿಯ ಶಾಲೆಗಳಲ್ಲಿ ನಡೆಸಲಾದ ಅನಿರೀಕ್ಷಿತ ತಪಾಸಣೆಯ ಅನ್ವಯ, ಶಾಲಾ ಕಟ್ಟಡಗಳ ಸುರಕ್ಷತೆ, ಕುಡಿಯುವ ನೀರು ಮತ್ತು ಬೆಂಕಿ ನಂದಕ ಉಪಕರಣಗಳ ಕಾರ್ಯಕ್ಷಮತೆ ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಸೂಕ್ತ ಕ್ರಮಕ್ಕಾಗಿ ವರದಿಯನ್ನು ಸಲ್ಲಿಸಲಾಗಿದೆ.\n\nತಮ್ಮ ವಿಶ್ವಾಸಿ,\nಜಿಲ್ಲಾ ಪರಿಶೀಲನಾ ಕೋಶ ಅಧಿಕಾರಿ`,
    actionNotes: [
      {
        id: 'note-2',
        author: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು',
        designation: 'Block Education Officer',
        timestamp: '2026-09-03 09:15',
        note: 'ತುರ್ತು ಗಮನ ಹರಿಸಿ. ಸಂಬಂಧಪಟ್ಟ ಶಾಲೆಗಳಿಗೆ ನೋಟಿಸ್ ನೀಡಿ 7 ದಿನಗಳಲ್ಲಿ ಸರಿಪಡಿಸಲು ಸೂಚಿಸಿ.',
        actionType: 'Query'
      }
    ],
    attachments: [
      {
        id: 'att-2',
        fileName: 'Bhadravathi_School_Safety_Inspection_Report.pdf',
        fileSize: '4.8 MB',
        fileType: 'application/pdf',
        pageCount: 8,
        uploadedAt: '2026-09-02'
      }
    ],
    tags: ['#SafetyCompliance', '#FireSafety', '#Inspection', '#BhadravathiBEO'],
    lastUpdated: '2026-09-03'
  },
  {
    id: 'let-103',
    referenceNumber: 'BEO-BHD/2026/SANCT-441',
    fileNumber: 'FILE-2026/ACCTS-GRT/204',
    direction: 'outward',
    subject: 'ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಗ್ರಾಮೀಣ ಶಾಲೆಗಳ ಸ್ಮಾರ್ಟ್ ತರಗತಿ ಉನ್ನತೀಕರಣಕ್ಕೆ ವಿಶೇಷ ಅನುದಾನ ಮಂಜೂರಾತಿ ಆದೇಶ',
    category: 'Grant & Budget Sanction',
    senderName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO)',
    senderDesignation: 'Block Education Officer',
    senderDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ',
    recipientName: 'ಭದ್ರಾವತಿ ವಲಯದ ಎಲ್ಲಾ ಶಾಲೆಗಳ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು',
    recipientDesignation: 'School Headmasters',
    recipientDepartment: 'ಸರ್ಕಾರಿ ಶಾಲೆಗಳು, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯ',
    dateReceivedOrIssued: '2026-08-20',
    dueDate: '2026-10-15',
    priority: 'Urgent',
    status: 'Approved & Signed',
    assignedOfficer: 'ಲೆಕ್ಕ ಅಧೀಕ್ಷಕರು, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
    section: 'Accounts & Grants',
    confidentiality: 'Public / Open',
    financialAmount: 480000,
    bodyText: `ಕರ್ನಾಟಕ ಸರ್ಕಾರ\nಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ\nಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301\n\nಆದೇಶ ಸಂಖ್ಯೆ: BEO-BHD/2026/SANCT-441                                ದಿನಾಂಕ: 20-08-2026\n\nವಿಷಯ: ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಆಯ್ದ ಸರ್ಕಾರಿ ಶಾಲೆಗಳಿಗೆ ಸ್ಮಾರ್ಟ್ ತರಗತಿ ಸೌಲಭ್ಯಕ್ಕಾಗಿ ಅನುದಾನ ಬಿಡುಗಡೆ ಕುರಿತು.\n\nಭದ್ರಾವತಿ ಗ್ರಾಮೀಣ ವಲಯದ ಸರ್ಕಾರಿ ಶಾಲೆಗಳ ಡಿಜಿಟಲ್ ಮೂಲಭೂತ ಸೌಕರ್ಯಕ್ಕಾಗಿ ₹4,80,000/- ಅನುದಾನವನ್ನು ಮಂಜೂರು ಮಾಡಲಾಗಿದೆ.\n\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು,\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ`,
    actionNotes: [
      {
        id: 'note-3',
        author: 'ಲೆಕ್ಕ ಶಾಖೆ',
        designation: 'Accounts Superintendent',
        timestamp: '2026-08-19 14:00',
        note: 'ಲೆಕ್ಕ ಶೀರ್ಷಿಕೆ 2202 ರಡಿ ಅನುದಾನ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಬಿಡುಗಡೆಗೆ ಸಮ್ಮತಿಸಲಾಗಿದೆ.',
        actionType: 'Approval'
      }
    ],
    attachments: [
      {
        id: 'att-3',
        fileName: 'Bhadravathi_Smart_Class_Sanction_2026.pdf',
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        pageCount: 6,
        uploadedAt: '2026-08-20'
      }
    ],
    endorsements: [
      'ಉಪನಿರ್ದೇಶಕರು, ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ',
      'ತಾಲೂಕು ಖಜಾನಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
      'ಕಛೇರಿ ಕಡತ, ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ'
    ],
    tags: ['#GrantInAid', '#SmartClassrooms', '#BudgetSanction', '#BhadravathiBEO'],
    lastUpdated: '2026-08-20'
  },
  {
    id: 'let-104',
    referenceNumber: 'BEO-BHD/2026/RTI-912',
    fileNumber: 'FILE-2026/LEGAL-RTI/044',
    direction: 'inward',
    subject: 'ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 ರಡಿ ಮಾಹಿತಿ ಕೋರಿ ಅರ್ಜಿ - ಶಿಕ್ಷಕರ ವರ್ಗಾವಣೆ ವಿವರ',
    category: 'Public Grievance & RTI',
    senderName: 'ಡಿ. ಕೆ. ಮಂಜುನಾಥ್',
    senderDesignation: 'ಅರ್ಜಿದಾರರು (Citizen Applicant)',
    senderDepartment: 'ಭದ್ರಾವತಿ ನಾಗರಿಕ ವೇದಿಕೆ',
    recipientName: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ (PIO)',
    recipientDesignation: 'Public Information Officer',
    recipientDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ (RTI ಕೋಶ)',
    dateReceivedOrIssued: '2026-09-04',
    dueDate: '2026-09-25',
    priority: 'Urgent',
    status: 'Under Review',
    assignedOfficer: 'ಸಹಾಯಕ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
    section: 'Legal & Grievances',
    confidentiality: 'Public / Open',
    bodyText: `ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 ರ ಅಡಿಯಲ್ಲಿ ಅರ್ಜಿ\n\nಗೆ:\nಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ.\n\nದಿನಾಂಕ: 04-09-2026\n\nವಿಷಯ: ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರ ಕೌನ್ಸೆಲಿಂಗ್ ಮತ್ತು ವರ್ಗಾವಣೆ ನಿಯಮಾವಳಿ ಕುರಿತು ಪ್ರಮಾಣೀಕೃತ ಮಾಹಿತಿ ಕೋರಿಕೆ.\n\nಮಾನ್ಯರೇ,\n\nಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದಲ್ಲಿ ಇತ್ತೀಚೆಗೆ ನಡೆದ ಶಿಕ್ಷಕರ ಕೌನ್ಸೆಲಿಂಗ್ ಪ್ರಕ್ರಿಯೆಯ ಪ್ರಮಾಣೀಕೃತ ದಾಖಲೆಗಳನ್ನು ಒದಗಿಸಬೇಕಾಗಿ ಕೋರುತ್ತೇನೆ.\n\nತಮ್ಮ ನಂಬಿಕಸ್ಥ,\nಡಿ. ಕೆ. ಮಂಜುನಾಥ್, ಭದ್ರಾವತಿ`,
    actionNotes: [
      {
        id: 'note-4',
        author: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ',
        designation: 'PIO / BEO Office Bhadravathi',
        timestamp: '2026-09-05 11:30',
        note: 'ಸ್ಥಾಪನಾ ಶಾಖೆಯಿಂದ ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸಿ ನಿಗದಿತ 21 ದಿನಗಳಲ್ಲಿ ಲಿಖಿತ ಉತ್ತರ ರವಾನಿಸಲು ಸೂಚಿಸಲಾಗಿದೆ.',
        actionType: 'Forward'
      }
    ],
    attachments: [
      {
        id: 'att-4',
        fileName: 'RTI_Bhadravathi_Receipt_Copy.pdf',
        fileSize: '512 KB',
        fileType: 'application/pdf',
        pageCount: 2,
        uploadedAt: '2026-09-04'
      }
    ],
    tags: ['#RTI', '#Recruitment', '#PublicGrievance', '#BhadravathiBEO'],
    lastUpdated: '2026-09-05'
  },
  {
    id: 'let-105',
    referenceNumber: 'BEO-BHD/2026/ORD-772',
    fileNumber: 'FILE-2026/ADMN-ESTB/119',
    direction: 'outward',
    subject: 'ಭದ್ರಾವತಿ ವಲಯದ ಪ್ರಾಥಮಿಕ ಮತ್ತು ಪ್ರೌಢಶಾಲಾ ಶಿಕ್ಷಕರ ಆಂತರಿಕ ಹೊಂದಾಣಿಕೆ ನಿಯೋಜನೆ ಆದೇಶ',
    category: 'Teacher Transfer & Deputation',
    senderName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO)',
    senderDesignation: 'Block Education Officer',
    senderDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ',
    recipientName: 'ಸಂಬಂಧಪಟ್ಟ ಶಾಲಾ ಮುಖ್ಯಸ್ಥರು ಹಾಗೂ ಶಿಕ್ಷಕರು',
    recipientDesignation: 'Teachers / Headmasters',
    recipientDepartment: 'ಸರ್ಕಾರಿ ಶಾಲೆಗಳು, ಭದ್ರಾವತಿ ವಲಯ',
    dateReceivedOrIssued: '2026-08-28',
    dueDate: '2026-09-15',
    priority: 'Routine',
    status: 'Dispatched',
    assignedOfficer: 'Beatrice Sterling (Director of Personnel)',
    section: 'Administration & Services',
    confidentiality: 'Departmental Confidential',
    bodyText: `ADMINISTRATIVE SERVICES BOARD\nDEPARTMENT OF EDUCATION\n\nORDER NO. EDN-TRF/2026/ORD-772                                Dated: August 28, 2026\n\nSUBJECT: ANNUAL ADMINISTRATIVE TRANSFERS & MUTUAL DEPUTATION OF SENIOR LECTURERS (2026-27).\n\nIn public interest and administrative exigency, the transfer and mutual posting of senior faculty members detailed in Schedule-A annexed hereto is ordered with immediate effect.\n\n1. JOINING TIME: Relieved officers shall report to their new stations of posting on or before September 15, 2026 without availing extended transit privilege.\n\n2. SALARY CHARGE: Respective principals shall draw and disburse salaries for the month of September 2026 only upon receipt of the Last Pay Certificate (LPC) from the relieving institution.\n\nBeatrice Sterling\nDirector of Personnel & Administration`,
    actionNotes: [],
    attachments: [
      {
        id: 'att-5',
        fileName: 'Schedule_A_Faculty_Transfer_Postings_2026.pdf',
        fileSize: '1.8 MB',
        fileType: 'application/pdf',
        pageCount: 5,
        uploadedAt: '2026-08-28'
      }
    ],
    tags: ['#TeacherTransfer', '#Administration', '#CadreReview', '#Personnel'],
    lastUpdated: '2026-08-28'
  },
  {
    id: 'let-106',
    referenceNumber: 'BOARD-EXAM/2026/NOTIF-310',
    fileNumber: 'FILE-2026/EXAM-TIMETABLE/007',
    direction: 'outward',
    subject: 'Official Notification: Final Examination Timetable & Center Superintendent Guidelines for Secondary School Certificate (SSC) Exams',
    category: 'Examination & Curriculum',
    senderName: 'Prof. Harold Finch',
    senderDesignation: 'Controller of Examinations',
    senderDepartment: 'State Secondary School Examination Board',
    recipientName: 'All Center Superintendents & Custodians of Question Papers',
    recipientDesignation: 'Examination Center Heads',
    recipientDepartment: 'Designated Examination Centers & Secure Strong Rooms',
    dateReceivedOrIssued: '2026-09-01',
    dueDate: '2026-10-01',
    priority: 'Urgent',
    status: 'Dispatched',
    assignedOfficer: 'Prof. Harold Finch (Controller of Examinations)',
    section: 'Examination Board',
    confidentiality: 'Secret / Policy',
    bodyText: `STATE BOARD OF SECONDARY EXAMINATIONS\nCONFIDENTIAL EXAMINATION CELL\n\nNOTIFICATION NO. BOARD-EXAM/2026/NOTIF-310                     Dated: September 1, 2026\n\nTo:\nAll Designated Center Superintendents,\nCustodians of Question Papers (District Treasuries).\n\nSUBJECT: CONDUCT OF ANNUAL BOARD EXAMINATIONS 2026 - SECURITY PROTOCOLS & TIMETABLE.\n\nNotice is hereby promulgated that the Annual Secondary Board Examinations commence from November 10, 2026 across 412 accredited examination centers.\n\nCONFIDENTIAL SECURITY MANDATES:\n1. Question paper parcels shall be retrieved from the district treasury strongroom only on the morning of each scheduled examination by the Center Superintendent and designated Government Observer under double-lock register.\n2. Closed-Circuit Television (CCTV) recording in the examination control room and strong room must remain operational 24/7 with a minimum 45-day cloud backup.\n3. Mobile phones and digital electronic devices are strictly prohibited within a 100-meter radius of examination halls.\n\nProf. Harold Finch\nController of Examinations`,
    actionNotes: [],
    attachments: [
      {
        id: 'att-6',
        fileName: 'SSC_Exam_Timetable_and_Superintendent_Handbook_2026.pdf',
        fileSize: '3.1 MB',
        fileType: 'application/pdf',
        pageCount: 18,
        uploadedAt: '2026-09-01'
      }
    ],
    tags: ['#BoardExams', '#Confidential', '#Timetable', '#SuperintendentGuidelines'],
    lastUpdated: '2026-09-01'
  }
];

// Initial realistic Master Dossier / Docket Files for B.E.O Bhadravathi
let sampleDocketFiles: MasterDocketFile[] = [
  {
    id: 'file-45',
    fileNumber: '45',
    subject: 'ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರಾತಿ ಪ್ರಪತ್ರ-೨೮ ಮತ್ತು ಆದೇಶಗಳ ಕಡತ ೨೦೨೬-೨೭',
    section: 'Administration & Services',
    sectionCode: 'ಆ1',
    sectionName: 'ಸ.ಪ್ರಾ.ಶಿ',
    fileCategory: 'ವೇತನ & ಭತ್ಯೆ ಕಡತ (Salary & Increments)',
    initiatedDate: '2026-09-01',
    status: 'Active / Open',
    currentCustodian: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು / ಸಿಬ್ಬಂದಿ ಶಾಖೆ',
    priority: 'Urgent',
    linkedLetterIds: ['let-45-1', 'let-45-2'],
    lettersCount: 2,
    movementHistory: [
      {
        id: 'mov-45-1',
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಸಿಬ್ಬಂದಿ)',
        toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        sentDate: '2026-09-02',
        remarks: 'ಜನವರಿ ಮತ್ತು ಜುಲೈ ಮಾಹೆಯ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಪ್ರಪತ್ರ-೨೮ ರಂತೆ ಕಡತ ಸಂಖ್ಯೆ ೪೫ ರಲ್ಲಿ ಪತ್ರಗಳನ್ನು ಸೃಜಿಸಿ ಅನುಮೋದಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Active / Open'
      }
    ],
    notes: 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಕಡತ ಸಂಖ್ಯೆ ೪೫.',
    attachments: []
  },
  {
    id: 'file-rti-1',
    fileNumber: 'FILE-2026/BEO-RTI/044',
    subject: 'ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 - ಪ್ರಾಥಮಿಕ & ಪ್ರೌಢಶಾಲಾ ಶಿಕ್ಷಕರ ವರ್ಗಾವಣೆ ಮತ್ತು ಜ್ಯೇಷ್ಠತಾ ಪಟ್ಟಿ ಮಾಹಿತಿ ಕಡತ',
    section: 'Legal & Grievances',
    fileCategory: 'ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ (RTI & Legal)',
    initiatedDate: '2026-08-20',
    status: 'Active / Open',
    currentCustodian: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
    priority: 'Urgent',
    linkedLetterIds: ['let-104'],
    isRtiFile: true,
    movementHistory: [
      {
        id: 'mov-rti-1',
        fromOfficer: 'ಸಹಾಯಕ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ (ಕಛೇರಿ ಅಧೀಕ್ಷಕರು)',
        toOfficer: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        sentDate: '2026-08-22',
        remarks: 'ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಸ್ಥಾಪನಾ ಶಾಖೆಯಿಂದ ಜ್ಯೇಷ್ಠತಾ ಪಟ್ಟಿ ಮತ್ತು ಕೌನ್ಸೆಲಿಂಗ್ ವರದಿ ಪಡೆಯಲಾಗಿದೆ.',
        statusAfterMove: 'Under Scrutiny'
      },
      {
        id: 'mov-rti-2',
        fromOfficer: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        toOfficer: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        sentDate: '2026-08-28',
        remarks: 'ಮಾಹಿತಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದ್ದು, ಕಲಂ 7(1) ರಡಿ 30 ದಿನಗಳ ಮಿತಿಯೊಳಗೆ ಉತ್ತರ ರವಾನಿಸಲು ಆದೇಶಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Active / Open'
      }
    ],
    notes: 'ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 ರ ಕಲಂ 6(1) ರನ್ವಯ ಸ್ವೀಕೃತವಾದ ಅರ್ಜಿ. 30 ದಿನಗಳ ಕಾಲಮಿತಿ ವಿಲೇವಾರಿ ಗಡುವು: 2026-09-19.',
    attachments: [
      {
        id: 'att-rti-doc-1',
        fileName: 'Bhadravathi_Teachers_Seniority_List_2026.pdf',
        fileSize: '1.4 MB',
        fileType: 'application/pdf',
        pageCount: 6,
        uploadedAt: '2026-08-21',
        description: 'ಭದ್ರಾವತಿ ವಲಯದ ಶಿಕ್ಷಕರ ಅಧಿಕೃತ ಜ್ಯೇಷ್ಠತಾ ಪಟ್ಟಿ (Official Seniority PDF)'
      },
      {
        id: 'att-rti-doc-2',
        fileName: 'RTI_Court_Fee_Stamp_Receipt.jpg',
        fileSize: '420 KB',
        fileType: 'image/jpeg',
        uploadedAt: '2026-08-20',
        description: '₹10/- ಕೋರ್ಟ್ ಫೀ ಸ್ಟಾಂಪ್ ಮತ್ತು ಸ್ವೀಕೃತಿ ರಶೀದಿ (Court Fee Stamp JPG)'
      }
    ],
    rtiDetails: {
      applicationNumber: 'RTI/BEO/2026/APP-104',
      applicantName: 'ಶ್ರೀ ಕೆ. ರಾಮಕೃಷ್ಣ ಭಟ್',
      applicantAddress: 'ಹೊಸಮನೆ ಬಡಾವಣೆ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301',
      applicantPhone: '+91 94481 99201',
      applicationDate: '2026-08-20',
      statutoryDueDate: '2026-09-19',
      feeDetails: '₹10/- ಕೋರ್ಟ್ ಫೀ ಸ್ಟಾಂಪ್ (Court Fee Stamp)',
      pioOfficer: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
      apioOfficer: 'ಸಹಾಯಕ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ / ಕಛೇರಿ ಅಧೀಕ್ಷಕರು',
      informationSought: 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದಲ್ಲಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸುತ್ತಿರುವ ಪ್ರಾಥಮಿಕ ಹಾಗೂ ಪ್ರೌಢಶಾಲಾ ಶಿಕ್ಷಕರ ವಲಯವಾರು ಜ್ಯೇಷ್ಠತಾ ಪಟ್ಟಿ ಮತ್ತು ಕೌನ್ಸೆಲಿಂಗ್ ನಡಾವಳಿಗಳ ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿಗಳು.',
      rtiStatus: 'ಮಾಹಿತಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ',
      firstAppellateAuthority: 'ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ',
      uploadedDocs: [
        {
          id: 'att-rti-doc-1',
          fileName: 'Bhadravathi_Teachers_Seniority_List_2026.pdf',
          fileSize: '1.4 MB',
          fileType: 'application/pdf',
          pageCount: 6,
          uploadedAt: '2026-08-21',
          description: 'ಭದ್ರಾವತಿ ವಲಯದ ಶಿಕ್ಷಕರ ಅಧಿಕೃತ ಜ್ಯೇಷ್ಠತಾ ಪಟ್ಟಿ (Official Seniority PDF)'
        },
        {
          id: 'att-rti-doc-2',
          fileName: 'RTI_Court_Fee_Stamp_Receipt.jpg',
          fileSize: '420 KB',
          fileType: 'image/jpeg',
          uploadedAt: '2026-08-20',
          description: '₹10/- ಕೋರ್ಟ್ ಫೀ ಸ್ಟಾಂಪ್ ಮತ್ತು ಸ್ವೀಕೃತಿ ರಶೀದಿ (Court Fee Stamp JPG)'
        }
      ]
    }
  },
  {
    id: 'file-1',
    fileNumber: 'FILE-2026/BEO-ACAD/012',
    subject: 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಶಾಲೆಗಳಲ್ಲಿ STEM ಹಾಗೂ ಕಂಪ್ಯೂಟರ್ ಲ್ಯಾಬ್ ಅನುಷ್ಠಾನ ಕಡತ',
    section: 'Academic Wing',
    fileCategory: 'ಶೈಕ್ಷಣಿಕ & ಪರೀಕ್ಷಾ ಕಡತ (Academic & Exams)',
    initiatedDate: '2026-07-10',
    status: 'Active / Open',
    currentCustodian: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
    priority: 'Urgent',
    linkedLetterIds: ['let-101'],
    movementHistory: [
      {
        id: 'mov-1',
        fromOfficer: 'ವಲಯ ಶಿಕ್ಷಣ ಸಂಯೋಜಕರು (BRP)',
        toOfficer: 'ವಿಷಯ ಪರಿವೀಕ್ಷಕರು (Subject Inspector)',
        sentDate: '2026-07-12',
        remarks: 'ಶಾಲಾವಾರು ಲ್ಯಾಬ್ ಉಪಕರಣಗಳ ಪರಿಶೀಲನಾ ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Under Scrutiny'
      },
      {
        id: 'mov-2',
        fromOfficer: 'ವಿಷಯ ಪರಿವೀಕ್ಷಕರು (Subject Inspector)',
        toOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        sentDate: '2026-08-14',
        remarks: 'ಅಂತಿಮ ಅನುಮೋದನೆ ಹಾಗೂ ಸುತ್ತೋಲೆ ಹೊರಡಿಸಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.',
        statusAfterMove: 'Active / Open'
      }
    ],
    notes: 'ಭದ್ರಾವತಿ ವಲಯದ ಸರ್ಕಾರಿ ಶಾಲೆಗಳ ಕಂಪ್ಯೂಟರ್ ಮತ್ತು ಸೈನ್ಸ್ ಲ್ಯಾಬ್ ಅನುಷ್ಠಾನ ಕಡತ.',
    attachments: [
      {
        id: 'att-acad-1',
        fileName: 'STEM_Lab_Equipment_Specification.pdf',
        fileSize: '820 KB',
        fileType: 'application/pdf',
        pageCount: 3,
        uploadedAt: '2026-07-12',
        description: 'STEM ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ಲ್ಯಾಬ್ ಉಪಕರಣಗಳ ತಾಂತ್ರಿಕ ವಿವರಣೆ (Specification Document)'
      },
      {
        id: 'att-acad-2',
        fileName: 'Schoolwise_Computer_Requirement_List.pdf',
        fileSize: '1.1 MB',
        fileType: 'application/pdf',
        pageCount: 4,
        uploadedAt: '2026-07-15',
        description: 'ಶಾಲಾವಾರು ಕಂಪ್ಯೂಟರ್ ಮತ್ತು ಲ್ಯಾಬ್ ಬೇಡಿಕೆಗಳ ಅನುಮೋದಿತ ಪಟ್ಟಿ'
      },
      {
        id: 'att-acad-3',
        fileName: 'Lab_Site_Inspection_Photo.jpg',
        fileSize: '650 KB',
        fileType: 'image/jpeg',
        uploadedAt: '2026-08-01',
        description: 'ಶಾಲಾ ಲ್ಯಾಬ್ ಕೊಠಡಿಗಳ ಸ್ಥಳ ತಪಾಸಣಾ ಛಾಯಾಚಿತ್ರ'
      }
    ]
  },
  {
    id: 'file-2',
    fileNumber: 'FILE-2026/BEO-INSP/089',
    subject: 'ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಶಾಲೆಗಳ ಭೌತಿಕ ಸುರಕ್ಷತೆ ಹಾಗೂ ಶಾಲಾ ತಪಾಸಣಾ ಕಡತ',
    section: 'Inspection & Quality',
    fileCategory: 'ಶಾಲಾ ತಪಾಸಣೆ & ಗುಣಮಟ್ಟ ಕಡತ (Inspection & Quality)',
    initiatedDate: '2026-08-01',
    status: 'Under Scrutiny',
    currentCustodian: 'ವಿಷಯ ಪರಿವೀಕ್ಷಕರು / ತಪಾಸಣಾ ಅಧಿಕಾರಿಗಳು, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
    priority: 'Immediate',
    linkedLetterIds: ['let-102'],
    movementHistory: [
      {
        id: 'mov-3',
        fromOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಪರಿವೀಕ್ಷಕರು',
        toOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        sentDate: '2026-09-02',
        remarks: 'ಆಕಸ್ಮಿಕ ತಪಾಸಣಾ ವರದಿ ಮತ್ತು ಕಟ್ಟಡ ಸುರಕ್ಷತಾ ದೃಢೀಕರಣ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Under Scrutiny'
      }
    ],
    notes: 'ಖಾಸಗಿ ಅನುದಾನಿತ ಮತ್ತು ಅನುದಾನರಹಿತ ಶಾಲೆಗಳ ಮಾನ್ಯತೆ ನವೀಕರಣ ಮತ್ತು ಭೌತಿಕ ಸುರಕ್ಷತಾ ಕಡತ.',
    attachments: [
      {
        id: 'att-insp-1',
        fileName: 'School_Safety_Inspection_Report_2026.pdf',
        fileSize: '1.8 MB',
        fileType: 'application/pdf',
        pageCount: 5,
        uploadedAt: '2026-08-05',
        description: 'ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕಿನ ಶಾಲೆಗಳ ಸಮಗ್ರ ಭೌತಿಕ ಸುರಕ್ಷತಾ ತಪಾಸಣಾ ವರದಿ'
      },
      {
        id: 'att-insp-2',
        fileName: 'Fire_Safety_Clearance_Certificate.pdf',
        fileSize: '540 KB',
        fileType: 'application/pdf',
        pageCount: 2,
        uploadedAt: '2026-08-10',
        description: 'ಅಗ್ನಿಶಾಮಕ ಮತ್ತು ತುರ್ತು ಸೇವೆಗಳ ಇಲಾಖಾ ನಿರಾಕ್ಷೇಪಣಾ ಪ್ರಮಾಣ ಪತ್ರ'
      },
      {
        id: 'att-insp-3',
        fileName: 'PWD_Building_Stability_Certificate.pdf',
        fileSize: '760 KB',
        fileType: 'application/pdf',
        pageCount: 3,
        uploadedAt: '2026-08-15',
        description: 'ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆಯ ಕಟ್ಟಡ ಸ್ಥಿರತಾ ಪ್ರಮಾಣ ಪತ್ರ (Stability Certificate)'
      }
    ]
  },
  {
    id: 'file-3',
    fileNumber: 'FILE-2026/BEO-ACCTS/204',
    subject: 'ಭದ್ರಾವತಿ ಗ್ರಾಮೀಣ ಶಾಲೆಗಳ ಸ್ಮಾರ್ಟ್ ತರಗತಿ ಅನುದಾನ ಮಂಜೂರಾತಿ ಕಡತ',
    section: 'Accounts & Grants',
    fileCategory: 'ಲೆಕ್ಕಪತ್ರ & ಅನುದಾನ ಕಡತ (Accounts & Grants)',
    initiatedDate: '2026-08-10',
    status: 'Pending Higher Approval',
    currentCustodian: 'ಸಹಾಯಕ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
    priority: 'Urgent',
    linkedLetterIds: ['let-103'],
    movementHistory: [
      {
        id: 'mov-4',
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಲೆಕ್ಕ ಶಾಖೆ)',
        toOfficer: 'ಸಹಾಯಕ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
        sentDate: '2026-08-18',
        remarks: '₹4,80,000/- ಅನುದಾನ ಬಿಡುಗಡೆ ಆದೇಶ ಮತ್ತು ಶಾಲಾ ಪಟ್ಟಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Pending Higher Approval'
      }
    ],
    notes: 'ಗ್ರಾಮೀಣ ಶಾಲೆಗಳ ಡಿಜಿಟಲ್ ಮೂಲಸೌಕರ್ಯ ಅನುದಾನ ವೆಚ್ಚ ಪರಿಶೀಲನೆ ಕಡತ.',
    attachments: [
      {
        id: 'att-accts-1',
        fileName: 'Smart_Classroom_Grant_Sanction_Order.pdf',
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        pageCount: 4,
        uploadedAt: '2026-08-12',
        description: 'ಗ್ರಾಮೀಣ ಶಾಲೆಗಳ ಸ್ಮಾರ್ಟ್ ತರಗತಿ ಅನುದಾನ ಮಂಜೂರಾತಿ ಸರ್ಕಾರಿ ಆದೇಶ'
      },
      {
        id: 'att-accts-2',
        fileName: 'Finance_Department_Budget_Allotment.pdf',
        fileSize: '680 KB',
        fileType: 'application/pdf',
        pageCount: 2,
        uploadedAt: '2026-08-14',
        description: 'ಆರ್ಥಿಕ ಇಲಾಖೆ ಆಯವ್ಯಯ ಹಂಚಿಕೆ ಪತ್ರ ಹಾಗೂ ಲೆಕ್ಕಶೀರ್ಷಿಕೆ ವಿವರಣೆ'
      },
      {
        id: 'att-accts-3',
        fileName: 'Treasury_Challan_Receipt.jpg',
        fileSize: '390 KB',
        fileType: 'image/jpeg',
        uploadedAt: '2026-08-18',
        description: 'ಖಜಾನೆ ಚಲನ್ ಮತ್ತು ಪಾವತಿ ರಶೀದಿ ಪ್ರತಿ (Treasury Voucher)'
      }
    ]
  },
  {
    id: 'file-pen-57',
    fileNumber: '57',
    subject: 'ಶ್ರೀಮತಿ ಸುನಂದಮ್ಮ ಬಿ.ಆರ್, ಸಹ ಶಿಕ್ಷಕರು, ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ ಹಳೇನಗರ - ನಿವೃತ್ತಿ ವೇತನ (Pension) ಹಾಗೂ ಗ್ರಾಚ್ಯುಟಿ ಮಂಜೂರಾತಿ ಕಡತ ಸಂಖ್ಯೆ 57',
    section: 'Administration & Services',
    sectionCode: 'ಆ2',
    sectionName: 'ಸ.ಪ್ರಾ.ಶಿ',
    fileCategory: 'ಪಿಂಚಣಿ & ನಿವೃತ್ತಿ ಕಡತ (Pension & Retirement)',
    initiatedDate: '2026-08-05',
    status: 'Under Scrutiny',
    currentCustodian: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು / ಪಿಂಚಣಿ ಶಾಖೆ, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
    priority: 'Immediate',
    linkedLetterIds: ['let-219-01'],
    lettersCount: 1,
    movementHistory: [
      {
        id: 'mov-pen-1',
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಪಿಂಚಣಿ ವಿಭಾಗ)',
        toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS - ಪಿಂಚಣಿ ಶಾಖೆ)',
        sentDate: '2026-08-06 11:30',
        remarks: 'ನೌಕರರ ಸೇವಾ ಪುಸ್ತಕ ಪರಿಶೀಲಿಸಿ 32 ವರ್ಷಗಳ ಅರ್ಹತಾದಾಯಕ ಸೇವೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನಿವೃತ್ತಿ ವೇತನ ಲೆಕ್ಕಾಚಾರ ಪಟ್ಟಿ ಲಗತ್ತಿಸಿದೆ.',
        statusAfterMove: 'Active / Open'
      },
      {
        id: 'mov-pen-2',
        fromOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS - ಪಿಂಚಣಿ ಶಾಖೆ)',
        toOfficer: 'ಸಹಾಯಕ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು (AAO)',
        sentDate: '2026-08-14 15:45',
        remarks: 'ವೇತನ ಪ್ರಮಾಣೀಕರಣ ಮತ್ತು ಅಂತಿಮ ಗ್ರಾಚ್ಯುಟಿ ಮೊತ್ತ ಲೆಕ್ಕ ಪರಿಶೋಧನೆಗಾಗಿ ರವಾನಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Under Scrutiny'
      },
      {
        id: 'mov-pen-3',
        fromOfficer: 'ಸಹಾಯಕ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು (AAO)',
        toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು / ಪಿಂಚಣಿ ಶಾಖೆ, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
        sentDate: '2026-09-02 10:15',
        remarks: 'ಲೆಕ್ಕ ಪರಿಶೋಧನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. BEO ಅವರ ಅನುಮೋದನೆ ಪಡೆದು ಮಹಾಲೇಖಪಾಲರ (AG) ಕಛೇರಿಗೆ ರವಾನಿಸಲು ಕಡತ ಮಂಡಿಸಿದೆ.',
        statusAfterMove: 'Under Scrutiny'
      }
    ],
    notes: 'ಕಡತ ಸಂಖ್ಯೆ 57: ನಿವೃತ್ತಿ ವೇತನ, ಡಿಜಿಟಲ್ ಸೇವಾ ಪುಸ್ತಕ ಹಾಗೂ ಇಲಾಖಾ ನಿರಾಕ್ಷೇಪಣಾ ಪ್ರಮಾಣಪತ್ರ (NOC) ಒಳಗೊಂಡಿದೆ.',
    attachments: [
      {
        id: 'att-pen-1',
        fileName: 'Pension_Calculation_Sheet_Sunandamma.pdf',
        fileSize: '850 KB',
        fileType: 'application/pdf',
        pageCount: 3,
        uploadedAt: '2026-08-06',
        description: 'ನಿವೃತ್ತಿ ವೇತನ ಮತ್ತು ಗ್ರಾಚ್ಯುಟಿ ಲೆಕ್ಕಾಚಾರ ತಃಖ್ತೆ'
      }
    ]
  },
  {
    id: 'file-prom-12',
    fileNumber: 'FILE-2026/PROM-12',
    subject: 'ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರ ಹಿರಿಯ ಶ್ರೇಣಿ / ಆಯ್ಕೆ ಶ್ರೇಣಿ ಹಾಗೂ ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಹುದ್ದೆಗೆ ಬಡ್ತಿ ಪರಿಶೀಲನಾ ಕಡತ',
    section: 'Administration & Services',
    sectionCode: 'ಆ2',
    sectionName: 'ಸ.ಪ್ರಾ.ಶಿ',
    fileCategory: 'ವೇತನ ಬಡ್ತಿ & ಪರಿಷ್ಕರಣೆ ಕಡತ (Promotion & Pay Revision)',
    initiatedDate: '2026-07-25',
    status: 'Pending Higher Approval',
    currentCustodian: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
    priority: 'Urgent',
    linkedLetterIds: [],
    lettersCount: 0,
    movementHistory: [
      {
        id: 'mov-prom-1',
        fromOfficer: 'ವಿಷಯ ನಿರ್ವಾಹಕರು (Case Worker - ಸೇವಾ ಶಾಖೆ)',
        toOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA)',
        sentDate: '2026-07-26 10:00',
        remarks: '10/15/20 ವರ್ಷಗಳ ತೃಪ್ತಿಕರ ಸೇವೆ ಪೂರೈಸಿದ ಶಿಕ್ಷಕರ ಅರ್ಹತಾ ಪಟ್ಟಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Active / Open'
      },
      {
        id: 'mov-prom-2',
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA)',
        toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        sentDate: '2026-08-04 14:20',
        remarks: 'ಜ್ಯೇಷ್ಠತಾ ಪಟ್ಟಿ ಹಾಗೂ ವಾರ್ಷಿಕ ಕಾರ್ಯಕ್ಷಮತೆ ವರದಿ (APAR) ತಾಳೆ ನೋಡಿ ಕಡತ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Under Scrutiny'
      },
      {
        id: 'mov-prom-3',
        fromOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        toOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        sentDate: '2026-08-20 16:00',
        remarks: 'ಬಡ್ತಿ ಸಮಿತಿ (DPC) ನಡಾವಳಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದ್ದು ಅಂತಿಮ ಆದೇಶ ಮಂಜೂರಾತಿಗಾಗಿ ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರಕ್ಕೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Pending Higher Approval'
      }
    ],
    notes: 'ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರ ಬಡ್ತಿ ಮತ್ತು ವೇತನ ಪರಿಷ್ಕರಣೆ ಕಡತ.',
    attachments: []
  },
  {
    id: 'file-disc-08',
    fileNumber: 'FILE-2026/DISC-08',
    subject: 'ಕೆ.ಸಿ.ಎಸ್ (ಸಿ.ಸಿ.ಎ) ನಿಯಮಾವಳಿ 1957 ರ ನಿಯಮ 11/12 ರಡಿ ಅನಧಿಕೃತ ಗೈರುಹಾಜರಿ ವಿಚಾರಣಾ ಕಡತ',
    section: 'Legal & Grievances',
    sectionCode: 'ಆ2',
    sectionName: 'ಸ.ಪ್ರಾ.ಶಿ',
    fileCategory: 'ಇಲಾಖಾ ವಿಚಾರಣೆ & ಶಿಸ್ತು ಕ್ರಮ ಕಡತ (Disciplinary & Inquiries)',
    initiatedDate: '2026-08-10',
    status: 'Active / Open',
    currentCustodian: 'ವಿಷಯ ಪರಿವೀಕ್ಷಕರು / ವಿಚಾರಣಾಧಿಕಾರಿ, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
    priority: 'Immediate',
    linkedLetterIds: [],
    lettersCount: 0,
    movementHistory: [
      {
        id: 'mov-disc-1',
        fromOfficer: 'ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು, ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ',
        toOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        sentDate: '2026-08-10 11:00',
        remarks: 'ನೌಕರರ ಸತತ ಅನಧಿಕೃತ ಗೈರುಹಾಜರಿ ಕುರಿತು ವಿಶೇಷ ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Active / Open'
      },
      {
        id: 'mov-disc-2',
        fromOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        toOfficer: 'ವಿಷಯ ಪರಿವೀಕ್ಷಕರು / ವಿಚಾರಣಾಧಿಕಾರಿ, BEO ಕಛೇರಿ ಭದ್ರಾವತಿ',
        sentDate: '2026-08-16 12:30',
        remarks: 'ನಿಯಮಾನುಸಾರ ಕಾರಣ ಕೇಳುವ ನೋಟಿಸ್ (Show-cause Notice) ಜಾರಿ ಮಾಡಿ 15 ದಿನಗಳಲ್ಲಿ ವರದಿ ನೀಡಲು ಸೂಚಿಸಿದೆ.',
        statusAfterMove: 'Under Scrutiny'
      }
    ],
    notes: 'ಶಿಸ್ತು ಕ್ರಮ ಮತ್ತು ವಿಚಾರಣಾ ಕಡತ - ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ ವಿಭಾಗ.',
    attachments: []
  }
];

let sampleEmployees: Employee[] = [
  {
    id: 'emp-bhd-beo-1',
    employeeCode: 'BHD-BEO-001',
    kgidNumber: '100101',
    basicPay: 93250,
    payScale: '74400-1900-82000-2100-90400-2400-97600-2700-108400',
    fullName: 'ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ (B.K. Narayanappa)',
    designation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (Block Education Officer - BEO)',
    section: 'Administration & Services',
    officeLocation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ (BEO Office, Bhadravathi)',
    email: 'beo.bhadravathi@karnataka.gov.in',
    phone: '+91 94489 91201',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Director / HOD',
    joiningDate: '2004-08-10',
    incrementMonth: 'July',
    qualifications: 'M.A., M.Ed., KES (ಕರ್ನಾಟಕ ಶಿಕ್ಷಣ ಸೇವೆ)',
    notes: 'ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರ ಹಾಗೂ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ (PIO). ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಮುಖ್ಯಸ್ಥರು.',
    lastUpdated: '2026-08-01',
  },
  {
    id: 'emp-bhd-staff-fda1',
    employeeCode: 'BHD-OFF-002',
    kgidNumber: '219402',
    basicPay: 43500,
    payScale: '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
    fullName: 'ರಮೇಶ್ ಕೆ. ಎನ್. (Ramesh K.N.)',
    designation: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA) - ಆ2 ಸ.ಪ್ರಾ.ಶಿ',
    section: 'Administration & Services',
    officeLocation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ (BEO Office)',
    email: 'ramesh.kn@karnataka.gov.in',
    phone: '+91 94480 23145',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Staff',
    joiningDate: '2012-05-18',
    incrementMonth: 'July',
    qualifications: 'B.Com, PGDCA',
    notes: 'ಆ2 ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ ಶಾಖೆಯ ವಿಷಯ ನಿರ್ವಾಹಕರು (Case Worker - Primary Education).',
    lastUpdated: '2026-08-01',
  },
  {
    id: 'emp-bhd-staff-fda2',
    employeeCode: 'BHD-OFF-003',
    kgidNumber: '318904',
    basicPay: 41200,
    payScale: '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
    fullName: 'ಸವಿತಾ ಕೆ. (Savitha K.)',
    designation: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA) - ಸೇವಾ ಶಾಖೆ',
    section: 'Administration & Services',
    officeLocation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ (BEO Office)',
    email: 'savitha.k@karnataka.gov.in',
    phone: '+91 94484 56783',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Staff',
    joiningDate: '2015-09-12',
    incrementMonth: 'January',
    qualifications: 'B.A., B.Ed.',
    notes: 'ಶಿಕ್ಷಕರ ರಜೆ ಮಂಜೂರಾತಿ (ಗಳಿಕೆ ರಜೆ, ಶಿಶುಪಾಲನಾ ರಜೆ, ಅರ್ಧವೇತನ ರಜೆ) ಮತ್ತು ಸೇವಾ ವಿಷಯಗಳ ನಿರ್ವಾಹಕರು.',
    lastUpdated: '2026-08-01',
  },
  {
    id: 'emp-bhd-staff-sda1',
    employeeCode: 'BHD-OFF-004',
    kgidNumber: '429108',
    basicPay: 30350,
    payScale: '27650-650-29600-750-32600-850-36000-950-39800-1100-46400-1250-52650',
    fullName: 'ಸುರೇಶ್ ಜಿ. (Suresh G.)',
    designation: 'ದ್ವಿತೀಯ ದರ್ಜೆ ಸಹಾಯಕರು (SDA) - ಮಾ.ಹ. & ದೂರು',
    section: 'Legal & Grievances',
    officeLocation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ (BEO Office)',
    email: 'suresh.g@karnataka.gov.in',
    phone: '+91 94480 67890',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Staff',
    joiningDate: '2018-03-24',
    incrementMonth: 'July',
    qualifications: 'B.A., DCA',
    notes: 'ಸಹಾಯಕ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ (APIO) ಹಾಗೂ ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ ಮತ್ತು ಲೋಕಾಯುಕ್ತ ಕಡತಗಳ ನಿರ್ವಾಹಕರು.',
    lastUpdated: '2026-08-01',
  },
  {
    id: 'emp-bhd-staff-supt',
    employeeCode: 'BHD-OFF-005',
    kgidNumber: '198450',
    basicPay: 55400,
    payScale: '43400-1100-46400-1250-53900-1450-62600-1650-70850-1850-82000',
    fullName: 'ವಿಶ್ವನಾಥ್ ಎಚ್. (Vishwanath H.)',
    designation: 'ಲೆಕ್ಕ ಅಧೀಕ್ಷಕರು (Accounts Superintendent)',
    section: 'Accounts & Finance',
    officeLocation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ (BEO Office)',
    email: 'vishwanath.h@karnataka.gov.in',
    phone: '+91 94480 56789',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Staff',
    joiningDate: '2008-11-15',
    incrementMonth: 'January',
    qualifications: 'M.Com, SAS',
    notes: 'ವೇತನ ಬಿಲ್, ಹೆಚ್.ಆರ್.ಎಂ.ಎಸ್ ಲೆಕ್ಕಪತ್ರಗಳು ಮತ್ತು ಆಡಿಟ್ ಅಧೀಕ್ಷಕರು.',
    lastUpdated: '2026-08-01',
  },
  {
    id: 'emp-bhd-1',
    employeeCode: 'BHD-TCH-101',
    kgidNumber: '108294',
    basicPay: 37900,
    payScale: '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
    fullName: 'ಮಂಜುನಾಥ್ ಬಿ.ಎಸ್. (Manjunath B.S.)',
    designation: 'ಹಿರಿಯ ಸಹ ಶಿಕ್ಷಕರು (Senior Asst. Teacher)',
    section: 'Administration & Services',
    officeLocation: 'ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ ಹೊಸಮನೆ, ಭದ್ರಾವತಿ (GHS Hosamane)',
    email: 'manjunath.bs@karnataka.gov.in',
    phone: '+91 94481 23450',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Faculty / Principal',
    joiningDate: '2014-06-15',
    qualifications: 'B.Sc. (CBZ), B.Ed., M.A. Kannada',
    notes: 'ಭದ್ರಾವತಿ ತಾಲೂಕಿನ ಗಣಿತ ಹಾಗೂ ವಿಜ್ಞಾನ ವಿಷಯ ಬೋಧಕರು. 10 ವರ್ಷಗಳ ನಿರಂತರ ತೃಪ್ತಿಕರ ಸೇವೆ ಪೂರ್ಣಗೊಳಿಸಿದ್ದಾರೆ.',
    lastUpdated: '2026-08-01',
  },
  {
    id: 'emp-bhd-2',
    employeeCode: 'BHD-TCH-102',
    kgidNumber: '240918',
    basicPay: 33450,
    payScale: '33450-850-36000-950-39800-1100-46400-1250-53900-1450-62600',
    fullName: 'ಗೀತಾ ಎಂ. (Geetha M.)',
    designation: 'ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರು (PST)',
    section: 'Academic Wing',
    officeLocation: 'ಸರ್ಕಾರಿ ಮಾದರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಹಳೇನಗರ, ಭದ್ರಾವತಿ (GMHPS Halenagara)',
    email: 'geetha.m@karnataka.gov.in',
    phone: '+91 94482 34561',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Faculty / Principal',
    joiningDate: '2011-09-20',
    qualifications: 'B.A., D.Ed., M.Ed.',
    notes: 'ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ವಿಭಾಗದ ಭಾಷಾ ಶಿಕ್ಷಕರು.',
    lastUpdated: '2026-08-10',
  },
  {
    id: 'emp-bhd-3',
    employeeCode: 'BHD-TCH-103',
    kgidNumber: '319802',
    basicPay: 48900,
    payScale: '43200-1100-46400-1250-53900-1450-62600-1650-72500-1900-83900',
    fullName: 'ರಮೇಶ್ ನಾಯಕ್ (Ramesh Naik)',
    designation: 'ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು (High School Headmaster)',
    section: 'Administration & Services',
    officeLocation: 'ಸರ್ಕಾರಿ ಪದವಿ ಪೂರ್ವ ಕಾಲೇಜು (ಪ್ರೌಢಶಾಲಾ ವಿಭಾಗ) ಭದ್ರಾವತಿ (GJC High School Section)',
    email: 'ramesh.naik@karnataka.gov.in',
    phone: '+91 94483 45672',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Faculty / Principal',
    joiningDate: '2008-03-05',
    qualifications: 'M.Sc. Physics, M.Ed.',
    notes: 'ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು, ವಲಯ ಮಟ್ಟದ ಸಂಪನ್ಮೂಲ ವ್ಯಕ್ತಿಗಳು.',
    lastUpdated: '2026-08-12',
  },
  {
    id: 'emp-bhd-4',
    employeeCode: 'BHD-ADM-104',
    kgidNumber: '450123',
    basicPay: 30350,
    payScale: '27650-650-29600-750-32600-850-36000-950-39800-1100-46400-1250-52650',
    fullName: 'ಸವಿತಾ ಕೆ. (Savitha K.)',
    designation: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (First Division Assistant - FDA)',
    section: 'Administration & Services',
    officeLocation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ (BEO Office, Bhadravathi)',
    email: 'savitha.k@karnataka.gov.in',
    phone: '+91 94484 56783',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Clerk / Assistant',
    joiningDate: '2016-12-01',
    qualifications: 'B.Com, PGDCA',
    notes: 'ಸೇವಾ ಶಾಖೆ (Establishment Section) ಕಡತ ನಿರ್ವಹಣೆ ಮತ್ತು ವೇತನ ಬಡ್ತಿ ದಾಖಲೆ ಪರಿಶೀಲನೆ.',
    lastUpdated: '2026-08-15',
  },
  {
    id: 'emp-101',
    employeeCode: 'EDN-EMP-1001',
    kgidNumber: '512390',
    basicPay: 84200,
    payScale: '67550-1650-72500-1900-83900-2200-97100-2500-104600',
    fullName: 'Dr. Alistair Vance',
    designation: 'Director of School Education',
    section: 'Academic Wing',
    officeLocation: 'Central Secretariat, Block B, Suite 400',
    email: 'alistair.vance@gov.education.org',
    phone: '+1 (555) 234-5678',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Director / HOD',
    joiningDate: '2015-06-01',
    qualifications: 'Ph.D. in Educational Leadership, M.Ed.',
    notes: 'State policy director and authorized signatory for circulars and academic mandates.',
    lastUpdated: '2026-08-01',
  },
  {
    id: 'emp-102',
    employeeCode: 'EDN-EMP-1002',
    kgidNumber: '621845',
    basicPay: 52650,
    payScale: '43200-1100-46400-1250-53900-1450-62600-1650-70850',
    fullName: 'Margaret Holloway',
    designation: 'Senior Section Officer',
    section: 'Administration & Services',
    officeLocation: 'Administration Wing, 2nd Floor, Room 210',
    email: 'm.holloway@gov.education.org',
    phone: '+1 (555) 345-6789',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Section Officer',
    joiningDate: '2018-03-15',
    qualifications: 'M.P.A. Public Administration',
    notes: 'In charge of civil service cadre establishment and teacher transfer dockets.',
    lastUpdated: '2026-08-10',
  },
  {
    id: 'emp-103',
    employeeCode: 'EDN-EMP-1003',
    kgidNumber: '739201',
    basicPay: 48900,
    payScale: '40900-1100-46400-1250-53900-1450-62600',
    fullName: 'Sophia Lin',
    designation: 'Under Secretary (Finance & Grants)',
    section: 'Accounts & Grants',
    officeLocation: 'Directorate Finance Bureau, Room 105',
    email: 'sophia.lin@gov.education.org',
    phone: '+1 (555) 456-7890',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Section Officer',
    joiningDate: '2019-11-01',
    qualifications: 'Chartered Public Finance Accountant, M.Com',
    notes: 'Scrutiny officer for rural school grants and budget sanctions.',
    lastUpdated: '2026-08-15',
  },
  {
    id: 'emp-104',
    employeeCode: 'EDN-EMP-1004',
    kgidNumber: '840512',
    basicPay: 43200,
    payScale: '37900-950-39800-1100-46400-1250-53900',
    fullName: 'Marcus Sterling',
    designation: 'Chief School Safety Inspector',
    section: 'Inspection & Quality',
    officeLocation: 'Inspectorate Regional HQ, 4th Floor',
    email: 'm.sterling@gov.education.org',
    phone: '+1 (555) 567-8901',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Inspector / Evaluator',
    joiningDate: '2020-02-20',
    qualifications: 'B.E. Civil & Occupational Safety Diploma',
    notes: 'Lead officer for annual safety audits, fire clearances, and infrastructure NOCs.',
    lastUpdated: '2026-08-20',
  },
  {
    id: 'emp-105',
    employeeCode: 'EDN-EMP-1005',
    kgidNumber: '951623',
    basicPay: 46400,
    payScale: '40900-1100-46400-1250-53900-1450-62600',
    fullName: 'Eleanor Ward',
    designation: 'Legal Counsel & RTI Appellate Officer',
    section: 'Legal & Grievances',
    officeLocation: 'Legal Cell, Secretariat North Block',
    email: 'eleanor.ward@gov.education.org',
    phone: '+1 (555) 678-9012',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Section Officer',
    joiningDate: '2021-08-12',
    qualifications: 'LL.M. Administrative & Constitutional Law',
    notes: 'Supervises public grievance petitions, court matters, and RTI disclosures.',
    lastUpdated: '2026-08-18',
  },
  {
    id: 'emp-106',
    employeeCode: 'EDN-EMP-1006',
    kgidNumber: '162734',
    basicPay: 68400,
    payScale: '56800-1450-62600-1650-72500-1900-83900',
    fullName: 'David Chen',
    designation: 'Controller of Examinations',
    section: 'Examination Board',
    officeLocation: 'State Examination Center, Confidential Wing',
    email: 'david.chen@gov.education.org',
    phone: '+1 (555) 789-0123',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'Director / HOD',
    joiningDate: '2016-09-01',
    qualifications: 'M.Sc. Statistics, M.Ed.',
    notes: 'Oversees board examination security, curriculum testing, and center accreditation.',
    lastUpdated: '2026-08-05',
  },
  {
    id: 'emp-107',
    employeeCode: 'EDN-EMP-1007',
    kgidNumber: '273845',
    basicPay: 58300,
    payScale: '52650-1250-53900-1450-62600-1650-72500',
    fullName: 'Dr. Preeti Sharma',
    designation: 'District Education Officer (North)',
    section: 'Academic Wing',
    officeLocation: 'North District Education Complex',
    email: 'preeti.sharma@gov.education.org',
    phone: '+1 (555) 890-1234',
    employmentType: 'Permanent',
    status: 'Active',
    role: 'District Officer',
    joiningDate: '2017-05-10',
    qualifications: 'Ph.D. Education Administration',
    notes: 'Superintends all secondary schools, teacher transfers, and admissions in North District.',
    lastUpdated: '2026-08-22',
  },
  {
    id: 'emp-108',
    employeeCode: 'EDN-EMP-1008',
    kgidNumber: '384956',
    basicPay: 29600,
    payScale: '27650-650-29600-750-32600-850-36000-950-39800',
    fullName: 'Jonathan Miller',
    designation: 'Senior Audit Assistant',
    section: 'Accounts & Grants',
    officeLocation: 'Audit Cell, Room 108',
    email: 'j.miller@gov.education.org',
    phone: '+1 (555) 901-2345',
    employmentType: 'Contractual',
    status: 'On Leave',
    role: 'Clerk / Assistant',
    joiningDate: '2023-01-15',
    qualifications: 'B.Com Accounting',
    notes: 'On medical leave until September 15, 2026. Handover assigned to Sophia Lin.',
    lastUpdated: '2026-08-25',
  },
];

// Helper: Parse CSV line respecting quotes and embedded commas
function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// Helper: Convert DD-MM-YYYY to YYYY-MM-DD
function parseDateToISO(dtStr: string): string {
  if (!dtStr) return '2020-01-01';
  const parts = dtStr.trim().split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) return dtStr;
    if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dtStr;
}

// Ingest Bhadravathi BEO Excel data provided by user from chunk files
function loadExcelEmployeesFromChunks(): Employee[] {
  const loaded: Employee[] = [];
  const dataDir = path.join(process.cwd(), 'src', 'data');
  const chunkFiles = ['chunk1.csv', 'chunk2.csv', 'chunk3.csv', 'chunk4.csv'];

  for (const fileName of chunkFiles) {
    const fullPath = path.join(dataDir, fileName);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
      for (const line of lines) {
        if (line.startsWith('ddocode,') || line.startsWith('1401QE0001,grp')) continue; // Skip header
        const cols = parseCSVLine(line);
        if (cols.length < 5) continue;

        const ddocode = cols[0] || '1401QE0001';
        // cols[1] is grp
        const empname = cols[2] || '';
        const kgidno = cols[3] || '';
        const designation = cols[4] || 'PRIMARY SCHOOL ASSISTANT MASTER/MISTRESS';
        const gender = cols[5] || '';
        const payscale = cols[6] || '49050-92500';
        const joindt = cols[7] || '';
        const servicelength = cols[8] || '';
        // cols[9] POST_JOIN_DT
        const dob = cols[10] || '';
        const ageStr = cols[11] || '';
        const basicStr = cols[12] || '';
        // cols[13] handicapped
        const address1 = cols[14] || '';
        const address2 = cols[15] || '';
        const pincd = cols[16] || '577301';
        const phonenumber = cols[17] || '';
        const mobilenumber = cols[18] || '';
        const hometowncity = cols[19] || 'SHIMOGA';
        const talukname = cols[20] || 'BHADRAVATHI';
        const parentName = cols[26] || '';
        const onSuspension = cols[28] || '';
        const onLeave = cols[29] || '';
        const placeOfWork = cols[30] || '';
        const emailVal = cols[31] || '';
        const epicNo = cols[32] || '';

        if (!empname || !kgidno) continue;

        const basicPay = basicStr ? Number(basicStr.replace(/[^0-9.]/g, '')) || 49050 : 49050;
        const age = ageStr ? Number(ageStr.replace(/[^0-9]/g, '')) || undefined : undefined;
        
        let section = 'Academic Wing';
        const desigUpper = designation.toUpperCase();
        if (desigUpper.includes('SUPERINTENDENT') || desigUpper.includes('FIRST DIVISION') || desigUpper.includes('FDA') || desigUpper.includes('ASSISTANT DIRECTOR')) {
          section = 'Administration & Services';
        }

        let role = 'Faculty / Principal';
        if (desigUpper.includes('HEAD MASTER') || desigUpper.includes('HEAD MISTRESS') || desigUpper.includes('PRINCIPAL')) {
          role = 'Director / HOD';
        } else if (desigUpper.includes('SUPERINTENDENT') || desigUpper.includes('CO ORDINATOR') || desigUpper.includes('RESOURCE PERSON')) {
          role = 'Section Officer';
        } else if (desigUpper.includes('ASSISTANT') && (desigUpper.includes('FIRST') || desigUpper.includes('SECOND') || desigUpper.includes('CLERK'))) {
          role = 'Clerk / Assistant';
        }

        const phone = mobilenumber && mobilenumber !== 'NA' && mobilenumber !== '0' 
          ? `+91 ${mobilenumber}` 
          : (phonenumber && phonenumber !== '0' && phonenumber !== 'NA' ? phonenumber : '+91 94480 00000');

        const email = emailVal && emailVal.includes('@') && emailVal !== 'NA' 
          ? emailVal 
          : `${empname.toLowerCase().replace(/[^a-z0-9]/g, '.')}@karnataka.gov.in`;

        const isLeave = onLeave.toUpperCase().includes('ON LEAVE') && !onLeave.toUpperCase().includes('NOT');
        const isSusp = onSuspension.toUpperCase().includes('SUSPENSION') && !onSuspension.toUpperCase().includes('NOT');

        const emp: Employee = {
          id: `emp-bhd-${kgidno}`,
          employeeCode: `BHD-EDN-${kgidno}`,
          kgidNumber: kgidno,
          basicPay,
          payScale: payscale,
          fullName: empname,
          designation,
          gender: gender || undefined,
          dob: dob || undefined,
          age,
          ddoCode: ddocode,
          parentName: parentName && parentName !== 'NA' ? parentName : undefined,
          placeOfWork: placeOfWork || undefined,
          epicNo: epicNo && epicNo !== 'NA' ? epicNo : undefined,
          hometown: hometowncity && hometowncity !== 'NA' ? hometowncity : undefined,
          section,
          officeLocation: placeOfWork ? `${placeOfWork} (Bhadravathi)` : (address1 ? `${address1}, Bhadravathi` : 'BEO Office, Bhadravathi'),
          email,
          phone,
          employmentType: 'Permanent',
          status: isLeave || isSusp ? 'On Leave' : 'Active',
          role,
          joiningDate: parseDateToISO(joindt),
          incrementMonth: (loaded.length % 2 === 0) ? 'January' : 'July',
          lastIncrementDate: (loaded.length % 2 === 0) ? '2025-01-01' : '2025-07-01',
          nextIncrementDate: (loaded.length % 2 === 0) ? '2026-01-01' : '2026-07-01',
          qualifications: 'D.Ed. / B.Ed. / Teacher Graduate',
          notes: `DDO: ${ddocode} (${talukname}), Parent: ${parentName || 'N/A'}, Service: ${servicelength || ''} yrs, EPIC: ${epicNo || 'N/A'}.`,
          serviceHistory: [],
          lastUpdated: '2026-09-08'
        };

        loaded.push(emp);
      }
    } catch (err) {
      console.error(`Failed to load ${fileName}:`, err);
    }
  }
  return loaded;
}

const initialExcelEmployees = loadExcelEmployeesFromChunks();

const EMPLOYEES_STORAGE_FILE = path.join(process.cwd(), 'data', 'employees_store.json');

function savePersistentEmployees(list: Employee[]) {
  try {
    const dir = path.dirname(EMPLOYEES_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(EMPLOYEES_STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save persistent employees to disk:', err);
  }
}

function loadPersistentEmployees(): Employee[] {
  try {
    if (fs.existsSync(EMPLOYEES_STORAGE_FILE)) {
      const raw = fs.readFileSync(EMPLOYEES_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Storage] Loaded ${parsed.length} persistent employees from disk.`);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load persistent employees from disk:', err);
  }

  const initial = [...sampleEmployees, ...initialExcelEmployees];
  savePersistentEmployees(initial);
  return initial;
}

let letters: EducationLetter[] = [...sampleLetters];
let docketFiles: MasterDocketFile[] = [...sampleDocketFiles];
let employees: Employee[] = loadPersistentEmployees();

export interface ServerOfficeSection {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

let officeSections: ServerOfficeSection[] = [
  { id: 'sec-a2', code: 'ಆ2', name: 'ಸ.ಪ್ರಾ.ಶಿ', description: 'ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಗಳ ಆಡಳಿತ, ಸಿಬ್ಬಂದಿ & ವೇತನ ಶಾಖೆ (ಆ2 - ಸ.ಪ್ರಾ.ಶಿ)', isDefault: true },
];

// ==================== REST API ROUTES ====================

// 0. Authentication: Only admin user with password zero0
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');

  if (cleanUsername === 'admin' && cleanPassword === 'zero0') {
    return res.json({
      success: true,
      message: 'Authentication successful. Welcome, System Administrator.',
      user: {
        username: 'admin',
        role: 'Administrator',
        displayName: 'Department Administrator',
        designation: 'Directorate System Administrator (Admin)',
        loginTime: new Date().toISOString(),
      },
      token: 'admin-auth-session-zero0',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password. Access is strictly restricted to administrator (User: admin, Password: zero0).',
  });
});

app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body || {};
  if (token === 'admin-auth-session-zero0') {
    return res.json({
      valid: true,
      user: {
        username: 'admin',
        role: 'Administrator',
        displayName: 'Department Administrator',
        designation: 'Directorate System Administrator (Admin)',
      },
    });
  }
  return res.status(401).json({ valid: false, message: 'Session expired or unauthorized.' });
});

// 1. Get all letters with filters
app.get('/api/letters', (req, res) => {
  const { direction, category, section, status, priority, search } = req.query;

  let result = [...letters];

  if (direction && direction !== 'all') {
    result = result.filter(l => l.direction === direction);
  }
  if (category && category !== 'all') {
    result = result.filter(l => l.category === category);
  }
  if (section && section !== 'all') {
    result = result.filter(l => l.section === section);
  }
  if (status && status !== 'all') {
    result = result.filter(l => l.status === status);
  }
  if (priority && priority !== 'all') {
    result = result.filter(l => l.priority === priority);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(l => 
      l.referenceNumber.toLowerCase().includes(q) ||
      l.fileNumber.toLowerCase().includes(q) ||
      l.subject.toLowerCase().includes(q) ||
      l.senderName.toLowerCase().includes(q) ||
      l.senderDepartment.toLowerCase().includes(q) ||
      l.recipientName.toLowerCase().includes(q) ||
      l.assignedOfficer.toLowerCase().includes(q) ||
      l.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort by date (descending)
  result.sort((a, b) => new Date(b.dateReceivedOrIssued).getTime() - new Date(a.dateReceivedOrIssued).getTime());

  res.json({
    letters: result,
    total: result.length
  });
});

// 2. Get single letter
app.get('/api/letters/:id', (req, res) => {
  const letter = letters.find(l => l.id === req.params.id);
  if (!letter) {
    return res.status(404).json({ error: 'Letter not found' });
  }
  res.json({ letter });
});

// 3. Create a new letter (Inward Dak or Outward Dispatch)
app.post('/api/letters', (req, res) => {
  const body = req.body;
  if (!body.subject || !body.category) {
    return res.status(400).json({ error: 'Subject and Category are required' });
  }

  const newId = `let-${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];

  const rawFileNo = body.fileNumber ? String(body.fileNumber).trim() : '';
  const matchingLetters = rawFileNo ? letters.filter(l => l.fileNumber === rawFileNo) : [];
  const nextLetterCount = matchingLetters.length + 1;
  const fileLetterNumber = body.fileLetterNumber || (rawFileNo ? `${rawFileNo}-${nextLetterCount}` : undefined);

  const secCode = body.sectionCode || (officeSections.find(s => s.isDefault)?.code) || 'ಆ2';
  const secName = body.sectionName || (officeSections.find(s => s.isDefault)?.name) || 'ಸ.ಪ್ರಾ.ಶಿ';
  const defaultRef = rawFileNo
    ? `ಇಡಿ/ಬಿಇಒ/ಭದ್ರಾ/${secCode}(${secName})/ಕಡತ-${rawFileNo}/${fileLetterNumber}/2026-27`
    : `EDN-DEPT/${new Date().getFullYear()}/${body.direction === 'inward' ? 'INW' : 'OUT'}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newLetter: EducationLetter = {
    id: newId,
    referenceNumber: body.referenceNumber || defaultRef,
    fileNumber: rawFileNo || `FILE-${new Date().getFullYear()}/GEN-EDU/${Math.floor(100 + Math.random() * 900)}`,
    fileLetterNumber,
    sectionCode: secCode,
    sectionName: secName,
    direction: body.direction || 'inward',
    subject: body.subject,
    category: body.category || 'General Official Notice',
    senderName: body.senderName || 'Departmental Sender',
    senderDepartment: body.senderDepartment || 'Education Directorate',
    senderDesignation: body.senderDesignation || 'Officer',
    recipientName: body.recipientName || 'Concerned Authority',
    recipientDepartment: body.recipientDepartment || 'Department of Education',
    recipientDesignation: body.recipientDesignation || 'Recipient',
    dateReceivedOrIssued: body.dateReceivedOrIssued || now,
    dueDate: body.dueDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    priority: body.priority || 'Routine',
    status: body.status || (body.direction === 'inward' ? 'Pending Action' : 'Approved & Signed'),
    assignedOfficer: body.assignedOfficer || 'General Officer / Unassigned',
    section: body.section || 'Academic Wing',
    confidentiality: body.confidentiality || 'Public / Open',
    financialAmount: body.financialAmount ? Number(body.financialAmount) : undefined,
    bodyText: body.bodyText || '',
    actionNotes: body.actionNotes || [],
    attachments: body.attachments || [],
    endorsements: body.endorsements || [],
    tags: Array.isArray(body.tags) ? body.tags : [],
    lastUpdated: now,
  };

  letters.unshift(newLetter);

  // Link to master docket file if exists
  const targetFile = docketFiles.find(f => f.fileNumber === newLetter.fileNumber);
  if (targetFile) {
    if (!targetFile.linkedLetterIds) targetFile.linkedLetterIds = [];
    if (!targetFile.linkedLetterIds.includes(newLetter.id)) {
      targetFile.linkedLetterIds.push(newLetter.id);
    }
    targetFile.lettersCount = letters.filter(l => l.fileNumber === targetFile.fileNumber).length;
  }

  res.status(201).json({ letter: newLetter, fileLetterNumber });
});

// 4. Update letter
app.put('/api/letters/:id', (req, res) => {
  const index = letters.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Letter not found' });
  }

  const existing = letters[index];
  const updated: EducationLetter = {
    ...existing,
    ...req.body,
    id: existing.id,
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  letters[index] = updated;
  res.json({ letter: updated });
});

// 5. Delete letter
app.delete('/api/letters/:id', (req, res) => {
  const index = letters.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Letter not found' });
  }
  const deleted = letters.splice(index, 1)[0];
  res.json({ message: 'Letter deleted successfully', id: deleted.id });
});

// 6. Add action note / minute note to letter
app.post('/api/letters/:id/notes', (req, res) => {
  const letter = letters.find(l => l.id === req.params.id);
  if (!letter) {
    return res.status(404).json({ error: 'Letter not found' });
  }

  const { note, author, designation, actionType } = req.body;
  if (!note) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  const newNote: ActionNote = {
    id: `note-${Date.now()}`,
    author: author || 'Department Officer',
    designation: designation || 'Section Officer',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    note,
    actionType: actionType || 'Note',
  };

  letter.actionNotes.push(newNote);
  letter.lastUpdated = new Date().toISOString().split('T')[0];

  res.json({ letter, note: newNote });
});

// 7. Get Master Docket Files with linked letters and counts
app.get('/api/files', (req, res) => {
  const enriched = docketFiles.map(f => {
    const linked = letters.filter(l => l.fileNumber === f.fileNumber || f.linkedLetterIds?.includes(l.id));
    return {
      ...f,
      lettersCount: linked.length,
      linkedLetters: linked,
    };
  });
  res.json({ files: enriched });
});

// 7b. Office Sections Management Routes
app.get('/api/office-sections', (req, res) => {
  res.json({ sections: officeSections });
});

app.post('/api/office-sections', (req, res) => {
  const { code, name, description, isDefault } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Section Code and Name are required' });
  }
  if (isDefault) {
    officeSections.forEach(s => { s.isDefault = false; });
  }
  const newSec: ServerOfficeSection = {
    id: `sec-${Date.now()}`,
    code: String(code).trim(),
    name: String(name).trim(),
    description: description || '',
    isDefault: !!isDefault,
  };
  officeSections.push(newSec);
  res.status(201).json({ section: newSec, sections: officeSections });
});

app.put('/api/office-sections/:id', (req, res) => {
  const sec = officeSections.find(s => s.id === req.params.id);
  if (!sec) return res.status(404).json({ error: 'Section not found' });
  const { code, name, description, isDefault } = req.body;
  if (code) sec.code = String(code).trim();
  if (name) sec.name = String(name).trim();
  if (description !== undefined) sec.description = description;
  if (isDefault) {
    officeSections.forEach(s => { s.isDefault = false; });
    sec.isDefault = true;
  }
  res.json({ section: sec, sections: officeSections });
});

app.delete('/api/office-sections/:id', (req, res) => {
  if (officeSections.length <= 1) {
    return res.status(400).json({ error: 'ಕನಿಷ್ಠ ಒಂದು ವಿಭಾಗವು ಇರಬೇಕು' });
  }
  officeSections = officeSections.filter(s => s.id !== req.params.id);
  res.json({ success: true, sections: officeSections });
});

// 7c. Get Next Letter Number for a File (e.g., 45 -> 45-1, 45-2)
app.get('/api/files/:fileNumber/next-number', (req, res) => {
  const fileNo = req.params.fileNumber;
  const file = docketFiles.find(f => f.fileNumber === fileNo || f.fileNumber.includes(fileNo));
  const linked = letters.filter(l => l.fileNumber === fileNo || (file && file.linkedLetterIds?.includes(l.id)));
  const nextIndex = linked.length + 1;
  const shortNo = `${fileNo}-${nextIndex}`;
  const activeSec = officeSections.find(s => s.isDefault) || officeSections[0];
  const secCode = file?.sectionCode || activeSec?.code || 'ಆ2';
  const secName = file?.sectionName || activeSec?.name || 'ಸ.ಪ್ರಾ.ಶಿ';
  const fullRef = `ಇಡಿ/ಬಿಇಒ/ಭದ್ರಾ/${secCode}(${secName})/ಕಡತ-${fileNo}/${shortNo}/2026-27`;
  res.json({ fileNumber: fileNo, nextIndex, shortNo, fullRef, sectionCode: secCode, sectionName: secName });
});

// 8. Create Master Docket File (supports standard and RTI files with attachments)
app.post('/api/files', (req, res) => {
  const { 
    subject, 
    section, 
    sectionCode,
    sectionName,
    fileCategory,
    currentCustodian, 
    priority, 
    notes,
    fileNumber,
    isRtiFile,
    rtiDetails,
    attachments
  } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  const generatedFileNo = fileNumber ? String(fileNumber).trim() : (isRtiFile 
    ? `BEO/ಮಾ.ಹ/${new Date().getFullYear()}/ಕಡತ-${Math.floor(100 + Math.random() * 900)}`
    : `FILE-${new Date().getFullYear()}/${(section || 'ಆ1').substring(0, 4).toUpperCase()}/${Math.floor(100 + Math.random() * 900)}`);

  const activeSec = officeSections.find(s => s.isDefault) || officeSections[0];
  const resolvedSecCode = sectionCode || activeSec?.code || 'ಆ1';
  const resolvedSecName = sectionName || activeSec?.name || 'ಸ.ಪ್ರಾ.ಶಿ';

  const newFile: MasterDocketFile = {
    id: `file-${Date.now()}`,
    fileNumber: generatedFileNo,
    subject,
    section: section || 'Administration & Services',
    sectionCode: resolvedSecCode,
    sectionName: resolvedSecName,
    fileCategory: fileCategory || (isRtiFile ? 'ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ (RTI & Legal)' : 'ವೇತನ & ಭತ್ಯೆ ಕಡತ (Salary & Increments)'),
    initiatedDate: new Date().toISOString().split('T')[0],
    status: isRtiFile && rtiDetails?.rtiStatus === 'ಉತ್ತರ ರವಾನಿಸಲಾಗಿದೆ' ? 'Disposed / Closed' : 'Active / Open',
    currentCustodian: currentCustodian || (isRtiFile ? 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ' : 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು / ಸಿಬ್ಬಂದಿ ಶಾಖೆ'),
    priority: priority || (isRtiFile ? 'Urgent' : 'Routine'),
    linkedLetterIds: [],
    lettersCount: 0,
    movementHistory: isRtiFile ? [
      {
        id: `mov-init-${Date.now()}`,
        fromOfficer: 'ಅರ್ಜಿದಾರರು (RTI Applicant)',
        toOfficer: 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
        sentDate: new Date().toISOString().split('T')[0],
        remarks: 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟು ಕಡತ ಸೃಜಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'Active / Open'
      }
    ] : [
      {
        id: `mov-init-${Date.now()}`,
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA)',
        toOfficer: currentCustodian || 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು',
        sentDate: new Date().toISOString().split('T')[0],
        remarks: `ಕಡತ ಸಂಖ್ಯೆ: ${generatedFileNo} ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ. ವಿಭಾಗ: ${resolvedSecCode} (${resolvedSecName}).`,
        statusAfterMove: 'Active / Open'
      }
    ],
    notes: notes || `ವಿಭಾಗ: ${resolvedSecCode} (${resolvedSecName}) ಕಡತ ಸಂಖ್ಯೆ: ${generatedFileNo}.`,
    isRtiFile: !!isRtiFile,
    rtiDetails: rtiDetails || undefined,
    attachments: attachments || [],
  };

  docketFiles.unshift(newFile);
  res.status(201).json({ file: newFile });
});

// 8b. Upload & Attach Documents (PDF or JPG) to existing file
app.post('/api/files/:id/attachments', (req, res) => {
  const file = docketFiles.find(f => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { fileName, fileSize, fileType, pageCount, description, dataUrl } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: 'File name is required' });
  }

  const newAttachment: DocumentAttachment = {
    id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fileName,
    fileSize: fileSize || '1.0 MB',
    fileType: fileType || 'application/pdf',
    pageCount: pageCount || 1,
    uploadedAt: new Date().toISOString().split('T')[0],
    description: description || 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆ ಪ್ರತಿ',
    dataUrl: dataUrl || undefined,
  };

  if (!file.attachments) file.attachments = [];
  file.attachments.push(newAttachment);

  if (file.isRtiFile && file.rtiDetails) {
    if (!file.rtiDetails.uploadedDocs) file.rtiDetails.uploadedDocs = [];
    file.rtiDetails.uploadedDocs.push(newAttachment);
  }

  res.status(201).json({ 
    message: 'ದಾಖಲೆ (PDF/JPG) ಯಶಸ್ವಿಯಾಗಿ ಕಡತಕ್ಕೆ ಲಗತ್ತಿಸಲಾಗಿದೆ.', 
    attachment: newAttachment, 
    file 
  });
});

// 8c. Update RTI File Status and Details
app.put('/api/files/:id/rti', (req, res) => {
  const file = docketFiles.find(f => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { rtiStatus, replyLetterReference, notes } = req.body;

  if (file.rtiDetails) {
    if (rtiStatus) file.rtiDetails.rtiStatus = rtiStatus;
    if (replyLetterReference) file.rtiDetails.replyLetterReference = replyLetterReference;
    file.rtiDetails.replyDate = new Date().toISOString().split('T')[0];
  }

  if (rtiStatus === 'ಉತ್ತರ ರವಾನಿಸಲಾಗಿದೆ') {
    file.status = 'Disposed / Closed';
  }
  if (notes) file.notes = notes;

  res.json({ message: 'RTI ಕಡತ ಮಾಹಿತಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.', file });
});

// 8d. Update File Category
app.put('/api/files/:id/category', (req, res) => {
  const file = docketFiles.find(f => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { fileCategory } = req.body;
  if (!fileCategory) {
    return res.status(400).json({ error: 'File category is required' });
  }

  file.fileCategory = fileCategory;
  res.json({ message: 'ಕಡತದ ಕ್ಯಾಟಗರಿಯನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ (File category updated)', file });
});

// 9. Move / Route Master File
app.post('/api/files/:id/move', (req, res) => {
  const file = docketFiles.find(f => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { fromOfficer, toOfficer, remarks, newStatus } = req.body;
  if (!toOfficer) {
    return res.status(400).json({ error: 'Recipient Officer is required' });
  }

  const movementRecord: FileMovementRecord = {
    id: `mov-${Date.now()}`,
    fromOfficer: fromOfficer || file.currentCustodian,
    toOfficer,
    sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    remarks: remarks || 'Forwarded for necessary action and disposal.',
    statusAfterMove: newStatus || file.status,
  };

  file.movementHistory.push(movementRecord);
  file.currentCustodian = toOfficer;
  if (newStatus) file.status = newStatus;

  res.json({ file, movement: movementRecord });
});

// ==================== EMPLOYEE / ESTABLISHMENT DATA ROUTES ====================

// 10. Get all employees with optional filters & search
app.get('/api/employees', (req, res) => {
  const { search, section, status, role, employmentType } = req.query;

  let result = [...employees];

  if (section && section !== 'all') {
    result = result.filter(e => e.section === section);
  }
  if (status && status !== 'all') {
    result = result.filter(e => e.status === status);
  }
  if (role && role !== 'all') {
    result = result.filter(e => e.role === role);
  }
  if (employmentType && employmentType !== 'all') {
    result = result.filter(e => e.employmentType === employmentType);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    result = result.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q) ||
      e.officeLocation.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.phone.toLowerCase().includes(q) ||
      (e.qualifications && e.qualifications.toLowerCase().includes(q))
    );
  }

  // Sort by full name
  result.sort((a, b) => a.fullName.localeCompare(b.fullName));

  res.json({
    employees: result,
    total: result.length,
    activeCount: employees.filter(e => e.status === 'Active').length,
    onLeaveCount: employees.filter(e => e.status === 'On Leave' || e.status === 'Deputation').length,
  });
});

// 11. Get single employee
app.get('/api/employees/:id', (req, res) => {
  const emp = employees.find(e => e.id === req.params.id || e.employeeCode === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  res.json({ employee: emp });
});

// 12. Add single employee
app.post('/api/employees', (req, res) => {
  const body = req.body;
  if (!body.fullName || !body.designation || !body.section) {
    return res.status(400).json({ error: 'Full Name, Designation, and Section are required' });
  }

  const generatedCode = body.employeeCode?.trim() || `EDN-EMP-${Math.floor(1000 + Math.random() * 9000)}`;

  // Check unique employee code
  if (employees.some(e => e.employeeCode.toLowerCase() === generatedCode.toLowerCase())) {
    return res.status(409).json({ error: `Employee Code "${generatedCode}" already exists. Please use a unique code.` });
  }

  const now = new Date().toISOString().split('T')[0];
  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    employeeCode: generatedCode,
    kgidNumber: body.kgidNumber?.trim() || generatedCode.replace(/[^0-9]/g, '').slice(0, 7) || `${Math.floor(100000 + Math.random() * 900000)}`,
    basicPay: Number(body.basicPay) || 37900,
    payScale: body.payScale?.trim() || '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
    payLevel: body.payLevel || 'Level-9',
    incrementMonth: body.incrementMonth || 'January',
    fullName: body.fullName.trim(),
    parentName: body.parentName?.trim() || '',
    designation: body.designation.trim(),
    cadreGroup: body.cadreGroup || 'ಗ್ರೂಪ್-ಸಿ',
    section: body.section || 'Academic Wing',
    officeLocation: body.officeLocation?.trim() || body.placeOfWork?.trim() || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ',
    placeOfWork: body.placeOfWork?.trim() || body.officeLocation?.trim() || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ',
    email: body.email?.trim() || `${body.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gov.education.org`,
    phone: body.phone?.trim() || '+91 94480 00000',
    employmentType: body.employmentType || 'Permanent',
    status: body.status || 'Active',
    role: body.role || 'Faculty / Principal',
    appointmentDate: body.appointmentDate || body.joiningDate || now,
    joiningDate: body.joiningDate || now,
    lastIncrementDate: body.lastIncrementDate || body.joiningDate || now,
    nextIncrementDate: body.nextIncrementDate || '',
    earnedLeaveBalance: Number(body.earnedLeaveBalance) >= 0 ? Number(body.earnedLeaveBalance) : 120,
    childCareLeaveAvailed: Number(body.childCareLeaveAvailed) >= 0 ? Number(body.childCareLeaveAvailed) : 0,
    qualifications: body.qualifications || '',
    otherServiceDetails: body.otherServiceDetails || '',
    notes: body.notes || '',
    lastUpdated: now,
  };

  employees.unshift(newEmp);

  // Sync with memorandum DB
  try {
    const existingDb = db.getEmployeeByKgid(newEmp.kgidNumber!);
    if (!existingDb) {
      db.saveEmployee({
        kgidNumber: newEmp.kgidNumber!,
        employeeCode: newEmp.employeeCode,
        fullName: newEmp.fullName,
        parentName: newEmp.parentName,
        designation: newEmp.designation,
        cadreGroup: (newEmp.cadreGroup as any) || 'ಗ್ರೂಪ್-ಸಿ',
        section: newEmp.section,
        officeLocation: newEmp.officeLocation,
        placeOfWork: newEmp.placeOfWork,
        currentBasicPay: newEmp.basicPay,
        payScale: newEmp.payScale,
        joiningDate: newEmp.joiningDate,
        appointmentDate: newEmp.appointmentDate,
        lastIncrementDate: newEmp.lastIncrementDate,
        nextIncrementDate: newEmp.nextIncrementDate,
        earnedLeaveBalance: newEmp.earnedLeaveBalance,
        childCareLeaveAvailed: newEmp.childCareLeaveAvailed,
        status: newEmp.status,
        phone: newEmp.phone,
        email: newEmp.email,
        notes: newEmp.notes,
      }, 'Admin', 'Admin');
    }
  } catch (syncErr) {
    console.warn('Sync to memorandum DB:', syncErr);
  }

  savePersistentEmployees(employees);
  res.status(201).json({ employee: newEmp, message: 'Employee added successfully' });
});

// 13. Update / Edit single employee
app.put('/api/employees/:id', (req, res) => {
  const index = employees.findIndex(e => e.id === req.params.id || e.employeeCode === req.params.id || (e.kgidNumber && e.kgidNumber === req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const existing = employees[index];
  const body = req.body;

  // If employeeCode changed, check collision
  if (body.employeeCode && body.employeeCode.trim() !== existing.employeeCode) {
    const codeCollision = employees.find((e, idx) => idx !== index && e.employeeCode.toLowerCase() === body.employeeCode.trim().toLowerCase());
    if (codeCollision) {
      return res.status(409).json({ error: `Employee Code "${body.employeeCode}" already assigned to ${codeCollision.fullName}` });
    }
  }

  const updated: Employee = {
    ...existing,
    ...body,
    id: existing.id,
    employeeCode: body.employeeCode ? body.employeeCode.trim() : existing.employeeCode,
    kgidNumber: body.kgidNumber ? body.kgidNumber.trim() : existing.kgidNumber,
    gender: body.gender || existing.gender || 'Female',
    childCareLeaveQuota: body.childCareLeaveQuota !== undefined ? Number(body.childCareLeaveQuota) : (existing.childCareLeaveQuota !== undefined ? existing.childCareLeaveQuota : 180),
    basicPay: body.basicPay !== undefined ? Number(body.basicPay) : existing.basicPay,
    payScale: body.payScale ? body.payScale.trim() : existing.payScale,
    payLevel: body.payLevel || existing.payLevel,
    incrementMonth: body.incrementMonth || existing.incrementMonth,
    fullName: body.fullName ? body.fullName.trim() : existing.fullName,
    parentName: body.parentName !== undefined ? body.parentName.trim() : existing.parentName,
    designation: body.designation ? body.designation.trim() : existing.designation,
    cadreGroup: body.cadreGroup || existing.cadreGroup,
    section: body.section || existing.section,
    officeLocation: body.officeLocation ? body.officeLocation.trim() : existing.officeLocation,
    placeOfWork: body.placeOfWork ? body.placeOfWork.trim() : (body.officeLocation ? body.officeLocation.trim() : existing.placeOfWork),
    email: body.email ? body.email.trim() : existing.email,
    phone: body.phone ? body.phone.trim() : existing.phone,
    employmentType: body.employmentType || existing.employmentType,
    status: body.status || existing.status,
    role: body.role || existing.role,
    appointmentDate: body.appointmentDate || existing.appointmentDate,
    joiningDate: body.joiningDate || existing.joiningDate,
    lastIncrementDate: body.lastIncrementDate || existing.lastIncrementDate,
    nextIncrementDate: body.nextIncrementDate !== undefined ? body.nextIncrementDate : existing.nextIncrementDate,
    earnedLeaveBalance: body.earnedLeaveBalance !== undefined ? Number(body.earnedLeaveBalance) : existing.earnedLeaveBalance,
    childCareLeaveAvailed: body.childCareLeaveAvailed !== undefined ? Number(body.childCareLeaveAvailed) : existing.childCareLeaveAvailed,
    qualifications: body.qualifications !== undefined ? body.qualifications : existing.qualifications,
    otherServiceDetails: body.otherServiceDetails !== undefined ? body.otherServiceDetails : existing.otherServiceDetails,
    notes: body.notes !== undefined ? body.notes : existing.notes,
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  employees[index] = updated;

  // Sync update with memorandum DB
  try {
    const kgidToLookup = updated.kgidNumber || existing.kgidNumber;
    if (kgidToLookup) {
      const dbEmp = db.getEmployeeByKgid(kgidToLookup);
      if (dbEmp) {
        db.updateEmployee(dbEmp.id, {
          fullName: updated.fullName,
          designation: updated.designation,
          currentBasicPay: updated.basicPay,
          payScale: updated.payScale,
          officeLocation: updated.officeLocation,
          placeOfWork: updated.placeOfWork,
          parentName: updated.parentName,
          cadreGroup: (updated.cadreGroup as any) || 'ಗ್ರೂಪ್-ಸಿ',
          status: updated.status,
          phone: updated.phone,
          email: updated.email,
          gender: updated.gender,
          childCareLeaveQuota: updated.childCareLeaveQuota,
          childCareLeaveAvailed: updated.childCareLeaveAvailed,
          earnedLeaveBalance: updated.earnedLeaveBalance,
        }, 'Admin', 'Admin');
      } else {
        db.saveEmployee({
          kgidNumber: kgidToLookup,
          employeeCode: updated.employeeCode,
          fullName: updated.fullName,
          designation: updated.designation,
          currentBasicPay: updated.basicPay,
          payScale: updated.payScale,
          officeLocation: updated.officeLocation,
          placeOfWork: updated.placeOfWork,
          parentName: updated.parentName,
          cadreGroup: (updated.cadreGroup as any) || 'ಗ್ರೂಪ್-ಸಿ',
          status: updated.status,
          phone: updated.phone,
          email: updated.email,
          gender: updated.gender,
          childCareLeaveQuota: updated.childCareLeaveQuota,
          childCareLeaveAvailed: updated.childCareLeaveAvailed,
          earnedLeaveBalance: updated.earnedLeaveBalance,
        }, 'Admin', 'Admin');
      }
    }
  } catch (syncErr) {
    console.warn('Sync update to memorandum DB:', syncErr);
  }

  savePersistentEmployees(employees);
  res.json({ employee: updated, message: 'Employee data updated successfully' });
});

// 14. Batch Upload Employees (CSV / bulk array)
app.post('/api/employees/batch-upload', (req, res) => {
  const { employeesList, overwriteExisting } = req.body;
  if (!Array.isArray(employeesList) || employeesList.length === 0) {
    return res.status(400).json({ error: 'No employee records provided for upload' });
  }

  const now = new Date().toISOString().split('T')[0];
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: { row: number; reason: string; item: any }[] = [];

  for (let i = 0; i < employeesList.length; i++) {
    const raw = employeesList[i];
    if (!raw.fullName || !raw.designation) {
      errors.push({ row: i + 1, reason: 'Missing Full Name or Designation', item: raw });
      continue;
    }

    const code = raw.employeeCode ? String(raw.employeeCode).trim() : `EDN-EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const existingIndex = employees.findIndex(e => e.employeeCode.toLowerCase() === code.toLowerCase() || (raw.kgidNumber && e.kgidNumber && e.kgidNumber.trim() === String(raw.kgidNumber).trim()));

    if (existingIndex >= 0) {
      if (overwriteExisting) {
        employees[existingIndex] = {
          ...employees[existingIndex],
          ...raw,
          id: employees[existingIndex].id,
          employeeCode: code,
          kgidNumber: raw.kgidNumber ? String(raw.kgidNumber).trim() : employees[existingIndex].kgidNumber,
          basicPay: raw.basicPay ? Number(raw.basicPay) : (employees[existingIndex].basicPay || 37900),
          payScale: raw.payScale || employees[existingIndex].payScale || '37900-70850',
          fullName: String(raw.fullName).trim(),
          designation: String(raw.designation).trim(),
          section: raw.section || employees[existingIndex].section || 'Academic Wing',
          officeLocation: raw.officeLocation || employees[existingIndex].officeLocation || 'Central Directorate',
          email: raw.email || employees[existingIndex].email,
          phone: raw.phone || employees[existingIndex].phone,
          employmentType: raw.employmentType || employees[existingIndex].employmentType || 'Permanent',
          status: raw.status || employees[existingIndex].status || 'Active',
          role: raw.role || employees[existingIndex].role || 'Section Officer',
          joiningDate: raw.joiningDate || employees[existingIndex].joiningDate || now,
          qualifications: raw.qualifications || employees[existingIndex].qualifications || '',
          notes: raw.notes || employees[existingIndex].notes || '',
          lastUpdated: now,
        };
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}-${i}`,
        employeeCode: code,
        kgidNumber: raw.kgidNumber ? String(raw.kgidNumber).trim() : undefined,
        basicPay: raw.basicPay ? Number(raw.basicPay) : 37900,
        payScale: raw.payScale || '37900-70850',
        fullName: String(raw.fullName).trim(),
        designation: String(raw.designation).trim(),
        section: raw.section || 'Academic Wing',
        officeLocation: raw.officeLocation || 'Education Directorate Regional Office',
        email: raw.email || `${String(raw.fullName).toLowerCase().replace(/[^a-z0-9]/g, '.')}@gov.education.org`,
        phone: raw.phone || '+1 (555) 000-0000',
        employmentType: raw.employmentType || 'Permanent',
        status: raw.status || 'Active',
        role: raw.role || 'Section Officer',
        joiningDate: raw.joiningDate || now,
        qualifications: raw.qualifications || '',
        notes: raw.notes || '',
        serviceHistory: [],
        lastUpdated: now,
      };
      employees.unshift(newEmp);
      importedCount++;
    }
  }

  savePersistentEmployees(employees);

  res.json({
    message: `Batch upload complete: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped.`,
    importedCount,
    updatedCount,
    skippedCount,
    totalRecords: employees.length,
    errors,
  });
});

// 15. Delete employee
app.delete('/api/employees/:id', (req, res) => {
  const empId = req.params.id;
  const index = employees.findIndex(e => e.id === empId);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const deleted = employees.splice(index, 1)[0];
  try {
    if (db) {
      db.deleteEmployee(empId, 'Officer', 'Superintendent');
    }
  } catch (e) {}

  savePersistentEmployees(employees);
  res.json({ message: 'Employee record deleted successfully', employee: deleted });
});

// 15a. Batch Delete Selected Employees
app.post('/api/employees/batch-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No employee IDs provided for deletion' });
  }

  const idSet = new Set(ids);
  const beforeCount = employees.length;
  employees = employees.filter(e => !idSet.has(e.id));
  try {
    if (db) {
      db.deleteBatchEmployees(ids, 'Officer', 'Superintendent');
    }
  } catch (e) {}

  savePersistentEmployees(employees);
  const deletedCount = beforeCount - employees.length;
  res.json({ 
    message: `${deletedCount} ನೌಕರರ ದಾಖಲೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ (Employees removed)`,
    deletedCount,
    remainingCount: employees.length,
  });
});

// 15a-2. Clear / Remove ALL Employees
app.delete('/api/employees-all', (req, res) => {
  const count = employees.length;
  employees = [];
  try {
    if (db) {
      db.clearAllEmployees('Officer', 'Superintendent');
    }
  } catch (e) {}

  savePersistentEmployees(employees);
  res.json({ 
    message: `ಎಲ್ಲಾ ${count} ನೌಕರರ ದಾಖಲೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆಗೆಯಲಾಗಿದೆ (All employees removed)`,
    deletedCount: count,
  });
});

// 15b. Seed / Reset rich Department Employees
app.post('/api/employees/seed', (req, res) => {
  const freshLoaded = loadExcelEmployeesFromChunks();
  employees = freshLoaded.length > 0 ? [...sampleEmployees, ...freshLoaded] : [...sampleEmployees];
  savePersistentEmployees(employees);
  res.json({
    message: `Bhadravathi BEO establishment seeded successfully with ${employees.length} employee records.`,
    count: employees.length,
    employees,
  });
});

// 15b-2. Bidirectional Client / Cloud Sync for Employees
app.post('/api/employees/sync', (req, res) => {
  const { clientEmployees = [] } = req.body;
  if (!Array.isArray(clientEmployees)) {
    return res.status(400).json({ error: 'clientEmployees array is required' });
  }

  let addedCount = 0;
  for (const clientEmp of clientEmployees) {
    if (!clientEmp || !clientEmp.fullName) continue;
    const exists = employees.some(e => 
      (clientEmp.id && e.id === clientEmp.id) ||
      (clientEmp.kgidNumber && e.kgidNumber && e.kgidNumber.trim() === clientEmp.kgidNumber.trim()) ||
      (clientEmp.employeeCode && e.employeeCode && e.employeeCode.toLowerCase() === clientEmp.employeeCode.toLowerCase())
    );
    if (!exists) {
      employees.push(clientEmp);
      addedCount++;
    }
  }

  if (addedCount > 0) {
    savePersistentEmployees(employees);
  }

  res.json({ 
    success: true, 
    addedCount, 
    totalEmployees: employees.length,
    employees 
  });
});

// 15c. Lookup Employee by KGID
app.get('/api/employees/lookup-kgid/:kgid', (req, res) => {
  const queryKgid = (req.params.kgid || '').trim().toLowerCase();
  if (!queryKgid) {
    return res.status(400).json({ error: 'KGID number is required', found: false });
  }

  const emp = employees.find(e => 
    (e.kgidNumber && e.kgidNumber.toLowerCase() === queryKgid) ||
    (e.kgidNumber && e.kgidNumber.toLowerCase().replace(/[^0-9]/g, '') === queryKgid.replace(/[^0-9]/g, '')) ||
    (e.employeeCode && e.employeeCode.toLowerCase().includes(queryKgid))
  );

  if (!emp) {
    return res.status(404).json({ error: `KGID ಸಂಖ್ಯೆ "${req.params.kgid}" ಹೊಂದಿರುವ ನೌಕರರ ಮಾಹಿತಿ ಪತ್ತೆಯಾಗಿಲ್ಲ.`, found: false });
  }

  res.json({
    found: true,
    employee: emp,
    message: `ನೌಕರರ ಮಾಹಿತಿ ಪತ್ತೆಯಾಗಿದೆ: ${emp.fullName} (${emp.designation})`,
  });
});

// In-memory store for all service sanction records
let serviceSanctionsList: ServiceSanctionRecord[] = [
  {
    id: 'snc-init-1',
    sanctionType: '10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ',
    kgidNumber: '108294',
    employeeId: 'emp-bhd-1',
    employeeName: 'ಮಂಜುನಾಥ್ ಬಿ.ಎಸ್. (Manjunath B.S.)',
    designation: 'ಹಿರಿಯ ಸಹ ಶಿಕ್ಷಕರು (Senior Asst. Teacher)',
    schoolOrOffice: 'ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ ಹೊಸಮನೆ, ಭದ್ರಾವತಿ',
    fileNumber: 'BEO-BHD/SR-2026/SCALE-4182',
    orderNumber: 'BEO/BHD/SR/2026/TBAS-10Y/104',
    sanctionDate: '2026-08-01',
    effectiveDate: '2026-06-15',
    previousBasicPay: 36000,
    revisedBasicPay: 37900,
    payScale: '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
    remarks: '10 ವರ್ಷಗಳ ನಿರಂತರ ಹಾಗೂ ತೃಪ್ತಿಕರ ಸೇವೆಗಾಗಿ ಕಾಲಮಿತಿ ಬಡ್ತಿ ಮಂಜೂರು ಮಾಡಲಾಗಿದೆ.',
    status: 'Sanctioned'
  }
];

// Seed initial service history for sample employee
if (sampleEmployees[0]) {
  sampleEmployees[0].serviceHistory = [serviceSanctionsList[0]];
}

// 15d. Get all service sanctions
app.get('/api/service-sanctions', (req, res) => {
  res.json({ sanctions: serviceSanctionsList, total: serviceSanctionsList.length });
});

// 15e. Process and Create Service Sanction: Leave / Increments / Promotions
// - Selects sanction type
// - Matches KGID
// - Displays & updates Employee info
// - Saves Master Docket File in files tracking system
// - Saves in Employee service record and UPDATES Basic Pay (ಮೂಲ ವೇತನ)
app.post('/api/service-sanctions', (req, res) => {
  const {
    sanctionType,
    kgidNumber,
    employeeId,
    employeeCode,
    fullName,
    designation,
    schoolOrOffice,
    previousBasicPay,
    revisedBasicPay,
    payScale,
    effectiveDate,
    orderNumber,
    leaveFrom,
    leaveTo,
    totalDays,
    leaveReason,
    remarks
  } = req.body || {};

  const validTypes = [
    'ಗಳಿಕೆ ರಜೆ',
    'ಶಿಶುಪಾಲನ ರಜೆ',
    '10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ',
    '15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ',
    '20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ',
    '25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ',
    '30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ'
  ];

  if (!sanctionType || !validTypes.includes(sanctionType)) {
    return res.status(400).json({ 
      error: `ಮಾನ್ಯವಾದ ಸೇವಾ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ (${validTypes.join(', ')})` 
    });
  }

  if (!kgidNumber || !String(kgidNumber).trim()) {
    return res.status(400).json({ error: 'ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ (KGID Number) ಕಡ್ಡಾಯವಾಗಿದೆ.' });
  }

  const cleanKgid = String(kgidNumber).trim();
  const today = new Date().toISOString().split('T')[0];

  // 1. Match or Create Employee
  let empIndex = employees.findIndex(e =>
    (e.kgidNumber && e.kgidNumber.toLowerCase() === cleanKgid.toLowerCase()) ||
    (e.kgidNumber && e.kgidNumber.replace(/[^0-9]/g, '') === cleanKgid.replace(/[^0-9]/g, '')) ||
    (employeeId && e.id === employeeId) ||
    (employeeCode && e.employeeCode.toLowerCase() === employeeCode.toLowerCase())
  );

  let emp: Employee;
  const isIncrementType = [
    '10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ',
    '15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ',
    '20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ',
    '25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ',
    '30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ'
  ].includes(sanctionType);

  let prevPay = Number(previousBasicPay) || 37900;
  let newPay = isIncrementType && revisedBasicPay ? Number(revisedBasicPay) : prevPay;

  if (empIndex !== -1) {
    emp = employees[empIndex];
    if (emp.basicPay && !previousBasicPay) {
      prevPay = emp.basicPay;
    }
    if (isIncrementType && revisedBasicPay) {
      newPay = Number(revisedBasicPay);
    }
  }

  // Generate Reference Numbers
  const typeCode = sanctionType.includes('ರಜೆ') 
    ? (sanctionType.includes('ಗಳಿಕೆ') ? 'EL' : 'CCL')
    : sanctionType.replace(/[^0-9]/g, '') + 'Y';
  
  const generatedOrderNo = orderNumber?.trim() || `BEO/BHD/SR/${new Date().getFullYear()}/${typeCode}-${Math.floor(100 + Math.random() * 900)}`;
  const generatedFileNumber = `BEO-BHD/SR-${new Date().getFullYear()}/${sanctionType.includes('ರಜೆ') ? 'LEAVE' : 'SCALE'}-${Math.floor(1000 + Math.random() * 9000)}`;

  const sanctionRecord: ServiceSanctionRecord = {
    id: `snc-${Date.now()}`,
    sanctionType,
    kgidNumber: cleanKgid,
    employeeId: empIndex !== -1 ? employees[empIndex].id : `emp-bhd-${Date.now()}`,
    employeeName: fullName?.trim() || (empIndex !== -1 ? employees[empIndex].fullName : `ನೌಕರರು (KGID: ${cleanKgid})`),
    designation: designation?.trim() || (empIndex !== -1 ? employees[empIndex].designation : 'ಸಹ ಶಿಕ್ಷಕರು'),
    schoolOrOffice: schoolOrOffice?.trim() || (empIndex !== -1 ? employees[empIndex].officeLocation : 'ಸರ್ಕಾರಿ ಶಾಲೆ, ಭದ್ರಾವತಿ'),
    fileNumber: generatedFileNumber,
    orderNumber: generatedOrderNo,
    sanctionDate: today,
    effectiveDate: effectiveDate || today,
    previousBasicPay: prevPay,
    revisedBasicPay: newPay,
    payScale: payScale?.trim() || (empIndex !== -1 && employees[empIndex].payScale ? employees[empIndex].payScale : '37900-70850'),
    leaveFrom: leaveFrom || undefined,
    leaveTo: leaveTo || undefined,
    totalDays: totalDays ? Number(totalDays) : undefined,
    leaveReason: leaveReason?.trim() || undefined,
    remarks: remarks?.trim() || `${sanctionType} ಮಂಜೂರಾತಿಗಾಗಿ ಸೇವಾ ವಹಿ ಪರಿಶೀಲಿಸಿ ಕ್ರಮವಹಿಸಲಾಗಿದೆ.`,
    status: 'Sanctioned'
  };

  // 2. Save / Update Employee Data ("emp data ನಲ್ಲಿ save ಆಗಬೇಕು ನಂತರ ಮೂಲ ವೇತನ ಬದಲಾವಣೆಯಾಗಬೇಕು")
  if (empIndex !== -1) {
    const updatedEmp: Employee = {
      ...employees[empIndex],
      kgidNumber: cleanKgid,
      fullName: fullName?.trim() || employees[empIndex].fullName,
      designation: designation?.trim() || employees[empIndex].designation,
      officeLocation: schoolOrOffice?.trim() || employees[empIndex].officeLocation,
      payScale: payScale?.trim() || employees[empIndex].payScale || '37900-70850',
      basicPay: isIncrementType ? newPay : (employees[empIndex].basicPay || prevPay), // Updated Basic Pay
      status: sanctionType.includes('ರಜೆ') ? 'On Leave' : employees[empIndex].status,
      serviceHistory: [sanctionRecord, ...(employees[empIndex].serviceHistory || [])],
      lastUpdated: today,
    };
    employees[empIndex] = updatedEmp;
    emp = updatedEmp;
  } else {
    // New Employee Auto-Registration
    const newEmp: Employee = {
      id: sanctionRecord.employeeId || `emp-${Date.now()}`,
      employeeCode: `EDN-KGID-${cleanKgid}`,
      kgidNumber: cleanKgid,
      basicPay: isIncrementType ? newPay : prevPay,
      payScale: payScale?.trim() || '37900-70850',
      fullName: (fullName || `ನೌಕರರು (KGID: ${cleanKgid})`).trim(),
      designation: (designation || 'ಸಹ ಶಿಕ್ಷಕರು').trim(),
      section: 'Administration & Services',
      officeLocation: (schoolOrOffice || 'ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ, ಭದ್ರಾವತಿ').trim(),
      email: `${cleanKgid.toLowerCase()}@karnataka.gov.in`,
      phone: '+91 94480 00000',
      employmentType: 'Permanent',
      status: sanctionType.includes('ರಜೆ') ? 'On Leave' : 'Active',
      role: 'Faculty / Principal',
      joiningDate: '2014-06-01',
      qualifications: 'B.Sc., B.Ed.',
      notes: `${sanctionType} ಪ್ರಕ್ರಿಯೆಯ ಮೂಲಕ ಸೇವಾ ದಾಖಲೆ ಸೃಷ್ಟಿಸಲಾಗಿದೆ.`,
      serviceHistory: [sanctionRecord],
      lastUpdated: today,
    };
    employees.unshift(newEmp);
    emp = newEmp;
  }

  // 3. Save into Files Docket System ("file ನಲ್ಲಿ save ಆಗಬೇಕು")
  const fileSubject = isIncrementType
    ? `[${sanctionType}] ಶ್ರೀ/ಶ್ರೀಮತಿ ${emp.fullName}, ${emp.designation} (KGID: ${cleanKgid}) - ಮೂಲ ವೇತನ ಪರಿಷ್ಕರಣೆ ₹${prevPay} ರಿಂದ ₹${newPay} ಗೆ ಮಂಜೂರಾತಿ ಕಡತ`
    : `[${sanctionType}] ಶ್ರೀ/ಶ್ರೀಮತಿ ${emp.fullName}, ${emp.designation} (KGID: ${cleanKgid}) - ${leaveFrom || today} ರಿಂದ ${leaveTo || today} ರವರೆಗೆ (${totalDays || 1} ದಿನಗಳು) ರಜೆ ಮಂಜೂರಾತಿ ಕಡತ`;

  const newDocketFile: MasterDocketFile = {
    id: `file-sr-${Date.now()}`,
    fileNumber: generatedFileNumber,
    subject: fileSubject,
    section: 'Administration & Services',
    initiatedDate: today,
    status: 'Active / Open',
    currentCustodian: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
    priority: 'Immediate',
    linkedLetterIds: [],
    movementHistory: [
      {
        id: `mov-${Date.now()}`,
        fromOfficer: 'ಸೇವಾ ಶಾಖೆ (Establishment Section)',
        toOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (Block Education Officer, Bhadravathi)',
        sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        remarks: `${sanctionType} ಪ್ರಸ್ತಾವನೆಯನ್ನು ಕೆಸಿಎಸ್‌ಆರ್ (KCSR) ನಿಯಮಾವಳಿಗಳಂತೆ ಪರಿಶೀಲಿಸಿ ಆದೇಶಿಸಲಾಗಿದೆ.`,
        statusAfterMove: 'Active / Open'
      }
    ],
    notes: `ಸೇವಾ ಕಡತ ವಿವರಗಳು:
- ಸೇವಾ ಪ್ರಕಾರ: ${sanctionType}
- ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ: ${cleanKgid}
- ನೌಕರರ ಹೆಸರು: ${emp.fullName}
- ಹುದ್ದೆ ಮತ್ತು ಕಾರ್ಯಸ್ಥಳ: ${emp.designation}, ${emp.officeLocation}
- ಆದೇಶ ಸಂಖ್ಯೆ: ${generatedOrderNo}
${isIncrementType ? `- ಹಿಂದಿನ ಮೂಲ ವೇತನ: ₹${prevPay.toLocaleString('en-IN')}
- ಪರಿಷ್ಕೃತ ನೂತನ ಮೂಲ ವೇತನ: ₹${newPay.toLocaleString('en-IN')}
- ಜಾರಿಗೆ ಬರುವ ದಿನಾಂಕ: ${effectiveDate || today}` : `- ರಜಾ ಅವಧಿ: ${leaveFrom} ರಿಂದ ${leaveTo} (${totalDays} ದಿನಗಳು)
- ಕಾರಣ: ${leaveReason || 'ಅಧಿಕೃತ ರಜೆ'}`}
- ಮಂಜೂರಾತಿ ಪ್ರಾಧಿಕಾರ: ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ`
  };

  docketFiles.unshift(newDocketFile);
  serviceSanctionsList.unshift(sanctionRecord);

  // 4. Official Kannada BEO Sanction Proceedings Order Text
  const proceedingsOrderText = `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301

ಕ್ರ.ಸಂಖ್ಯೆ: ${generatedOrderNo}                                            ದಿನಾಂಕ: ${today}

ನಡಾವಳಿಗಳು
ವಿಷಯ: ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯ - ${sanctionType} ಮಂಜೂರಾತಿ ಕುರಿತು.
ಉಲ್ಲೇಖ: 1. ಸಂಬಂಧಪಟ್ಟ ಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರ ಪ್ರಸ್ತಾವನೆ.
        2. ನೌಕರರ ಸೇವಾ ಪುಸ್ತಕ (Service Register) ಸಂಪುಟ 1 & 2.
        3. ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಗಳು (KCSRs) ಮತ್ತು ಸರ್ಕಾರದ ಆದೇಶಗಳು.

ಪ್ರಸ್ತಾವನೆ:
ಮೇಲ್ಕಂಡ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯ ವ್ಯಾಪ್ತಿಯ ${emp.officeLocation} ಇಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿರುವ ${emp.fullName}, ${emp.designation} (KGID ಸಂಖ್ಯೆ: ${cleanKgid}) ಇವರು ನಿಯಮಾನುಸಾರ ${sanctionType} ಮಂಜೂರು ಮಾಡುವಂತೆ ಕೋರಿ ಪ್ರಸ್ತಾವನೆ ಸಲ್ಲಿಸಿರುತ್ತಾರೆ.

ಸದರಿಯವರ ಸೇವಾ ವಹಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿ, ಅರ್ಹತಾ ಸೇವಾವಧಿಯು ತೃಪ್ತಿಕರವಾಗಿದ್ದು ಯಾವುದೇ ಇಲಾಖಾ ವಿಚಾರಣೆ ಬಾಕಿ ಇರುವುದಿಲ್ಲವೆಂದು ದೃಢೀಕರಿಸಿ, ಕೆಳಕಂಡಂತೆ ಆದೇಶ ಹೊರಡಿಸಲಾಗಿದೆ.

ಆದೇಶ:
ಪ್ರಸ್ತಾವನೆಯಲ್ಲಿ ವಿವರಿಸಿರುವ ಅಂಶಗಳ ಹಿನ್ನೆಲೆಯಲ್ಲಿ, ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ ಆದ ನಾನು ಕೆಳಕಂಡಂತೆ ಮಂಜೂರಾತಿ ನೀಡಿ ಆದೇಶಿಸಿರುತ್ತೇನೆ:

1. ನೌಕರರ ವಿವರ: ಶ್ರೀ/ಶ್ರೀಮತಿ ${emp.fullName}, ${emp.designation}
2. ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ (KGID No): ${cleanKgid}
3. ಕಾರ್ಯಸ್ಥಳ: ${emp.officeLocation}
4. ಮಂಜೂರಾದ ಸೇವೆ: ${sanctionType}
${isIncrementType ? `5. ಹಿಂದಿನ ಮೂಲ ವೇತನ: ₹${prevPay.toLocaleString('en-IN')}/-
6. ಪರಿಷ್ಕೃತ ನೂತನ ಮೂಲ ವೇತನ: ₹${newPay.toLocaleString('en-IN')}/-
7. ವೇತನ ಶ್ರೇಣಿ: ${emp.payScale || '37900-70850'}
8. ಜಾರಿಗೆ ಬರುವ ದಿನಾಂಕ: ${effectiveDate || today}` : `5. ರಜಾ ಅವಧಿ: ${leaveFrom} ರಿಂದ ${leaveTo} (ಒಟ್ಟು ${totalDays} ದಿನಗಳು)
6. ರಜಾ ಕಾರಣ: ${leaveReason || 'ವೈಯಕ್ತಿಕ / ನಿಯಮಾನುಸಾರ'}`}
9. ಕಡತ ಸಂಖ್ಯೆ: ${generatedFileNumber}

ಈ ಆದೇಶದ ಪ್ರತಿಯನ್ನು ನೌಕರರ ಮೂಲ ಸೇವಾ ಪುಸ್ತಕದಲ್ಲಿ (Service Register) ದಾಖಲಿಸಲು ಹಾಗೂ ಎಚ್‌ಆರ್‌ಎಂಎಸ್ (HRMS) ತಂತ್ರಾಂಶದಲ್ಲಿ ನವೀಕರಿಸಲು ಸೂಚಿಸಲಾಗಿದೆ.

(ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು)
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ
ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ

ಪ್ರತಿ ರವಾನೆ:
1. ಸಂಬಂಧಪಟ್ಟ ನೌಕರರಿಗೆ (ಶ್ರೀ/ಶ್ರೀಮತಿ ${emp.fullName}).
2. ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು, ${emp.officeLocation}.
3. ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ.
4. ಸಹಾಯಕ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು / ವೇತನ ವಿಭಾಗ, ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ.
5. ಕಛೇರಿ ಕಡತ / ಆದೇಶ ಪುಸ್ತಕ.`;

  res.status(201).json({
    message: `${sanctionType} ಯಶಸ್ವಿಯಾಗಿ ಕಡತದಲ್ಲಿ ಹಾಗೂ ನೌಕರರ ದಾಖಲೆಯಲ್ಲಿ ಸೇವ್ ಆಗಿದ್ದು, ಮೂಲ ವೇತನ ಬದಲಾವಣೆಯಾಗಿದೆ.`,
    sanction: sanctionRecord,
    employee: emp,
    file: newDocketFile,
    proceedingsText: proceedingsOrderText,
  });
});

// 16. AI Draft Official Education Department Letter / Circular using Gemini
app.post('/api/ai/draft-letter', async (req, res) => {
  try {
    const {
      letterType,
      subject,
      recipient,
      sender,
      keyPoints,
      tone,
      deadline,
      financialGrantAmount,
      departmentSection
    } = req.body;

    const gemini = getGeminiClient();

    if (gemini) {
      const prompt = `You are the Administrative Officer and Legal Draftsman for the Office of the Block Education Officer, Bhadravathi (ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ), Department of School Education, Karnataka.
Draft an authentic, formal, and authoritative Education Department official letter, circular, or government order based on these parameters:

- Official Office Name / Issuing Authority: ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ (Office of the Block Education Officer, Bhadravathi)
- Letter Category / Type: ${letterType || 'Circular & Directive'}
- Official Subject: ${subject || 'Administrative directive regarding school governance'}
- Issuing Authority / Sender: ${sender || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ (Block Education Officer, Bhadravathi)'}
- Designated Recipient: ${recipient || 'ಭದ್ರಾವತಿ ವಲಯದ ಎಲ್ಲಾ ಪ್ರಾಥಮಿಕ ಮತ್ತು ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು'}
- Section: ${departmentSection || 'Academic Wing'}
- Key Directives & Action Points: ${keyPoints || 'Standard administrative instructions for compliance, reporting, and audit'}
- Target Compliance Deadline: ${deadline || 'Within 21 days'}
${financialGrantAmount ? `- Financial Amount / Grant Sanctioned: ₹${financialGrantAmount}` : ''}
- Tone: ${tone || 'Authoritative civil service administrative government tone'}

Formatting Rules:
1. Include the mandatory official Karnataka Government letterhead header (ONLY KANNADA, NO ENGLISH TEXT):
   ಕರ್ನಾಟಕ ಸರ್ಕಾರ
   ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
   ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
   ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301
2. Generate an authentic Department Reference Dispatch Number (e.g. BEO/BHD/2026/...).
3. Include official date, 'To:' block, and prominent 'SUBJECT:' line.
4. Use numbered operational clauses (1., 2., 3...) with clear legal/policy clarity.
5. Include formal sign-off block with designation: ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ. Do NOT use personal names.
6. Include an official "Copy forwarded for information and necessary action to:" (Endorsements 1, 2, 3...) section at the bottom.
Return ONLY the complete, ready-to-issue official letter text.`;

      const aiResp = await callGeminiWithFallback(gemini, async (client, model) => {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });
        return response.text || '';
      });

      if (aiResp?.result) {
        return res.json({ letterText: aiResp.result, modelUsed: aiResp.modelUsed });
      }
    }

    // High-quality deterministic civil service template if Gemini key is absent or temporarily busy
    const dateStr = new Date().toLocaleDateString('kn-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const refNum = `BEO/BHD/${new Date().getFullYear()}/CR-${Math.floor(100 + Math.random() * 900)}`;

    const fallbackLetter = `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301

ಸಂಖ್ಯೆ: ${refNum}                                        ದಿನಾಂಕ: ${dateStr}

ಗೆ:
${recipient || 'ಭದ್ರಾವತಿ ವಲಯದ ಎಲ್ಲಾ ಸರ್ಕಾರಿ / ಅನುದಾನಿತ ಪ್ರಾಥಮಿಕ ಮತ್ತು ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು'}

ವಿಷಯ: ${subject ? subject.toUpperCase() : 'ಇಲಾಖಾ ಸುತ್ತೋಲೆ / ಅಧಿಕೃತ ಆದೇಶ'}

ಮಾನ್ಯರೇ,

ಮೇಲ್ಕಂಡ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಈ ಕೆಳಕಂಡ ನಿರ್ದೇಶನಗಳನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಪಾಲಿಸಲು ಈ ಮೂಲಕ ಸೂಚಿಸಲಾಗಿದೆ:

1. ಸೂಚನೆ ಮತ್ತು ನಿಯಮಾವಳಿ: ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆಯ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ, ಈ ಕಛೇರಿಯ ವ್ಯಾಪ್ತಿಯ ಎಲ್ಲಾ ಶಾಲಾ ಮುಖ್ಯಸ್ಥರು ನಿಗದಿತ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಚಾಚೂತಪ್ಪದೆ ಅನುಷ್ಠಾನಗೊಳಿಸತಕ್ಕದ್ದು.

${keyPoints ? `2. ಮುಖ್ಯ ಅಂಶಗಳು ಹಾಗೂ ಕ್ರಮಗಳು:\n${keyPoints}\n` : '2. ಕೈಗೊಳ್ಳಬೇಕಾದ ಕ್ರಮ: ಶಾಲಾ ಮಟ್ಟದಲ್ಲಿ ತಕ್ಷಣವೇ ಪರಿಶೀಲನೆ ನಡೆಸಿ ಸಮಗ್ರ ಅನುಪಾಲನಾ ವರದಿಯನ್ನು ಈ ಕಛೇರಿಗೆ ಸಲ್ಲಿಸತಕ್ಕದ್ದು.\n'}
${financialGrantAmount ? `3. ಅನುದಾನ ಮಂಜೂರಾತಿ: ನಿಗದಿತ ಯೋಜನೆಗಾಗಿ ₹${Number(financialGrantAmount).toLocaleString('en-IN')} ಅನುದಾನವನ್ನು ಮಂಜೂರು ಮಾಡಲಾಗಿದ್ದು, ಲೆಕ್ಕಪರಿಶೋಧಿತ ಬಳಕೆ ಪ್ರಮಾಣಪತ್ರ (UC) ಸಲ್ಲಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ.\n` : ''}4. ಕಾಲಮಿತಿ: ಈ ಆದೇಶದ ಅನುಪಾಲನೆಯನ್ನು ${deadline || '15 ದಿನಗಳ ಒಳಗಾಗಿ'} ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ಇಲ್ಲಿಗೆ ಸಲ್ಲಿಸಲು ನಿರ್ದೇಶಿಸಲಾಗಿದೆ.

ತಮ್ಮ ನಂಬಿಕಸ್ಥ,

${sender || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು\nಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ'}\n\nಪ್ರತಿಯನ್ನು ಮಾಹಿತಿ ಮತ್ತು ಸೂಕ್ತ ಕ್ರಮಕ್ಕಾಗಿ ರವಾನಿಸಲಾಗಿದೆ:
1. ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ.
2. ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳು (BCO), ಬಿ.ಆರ್.ಸಿ, ಭದ್ರಾವತಿ.
3. ಎಲ್ಲಾ ವಲಯ ಶಿಕ್ಷಣ ಸಂಯೋಜಕರು (BRP/CRP), ಭದ್ರಾವತಿ ವಲಯ.
4. ಕಛೇರಿ ಕಡತ / ಆದೇಶ ಪುಸ್ತಕ, ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ.`;

    return res.json({ letterText: fallbackLetter, modelUsed: 'deterministic-fallback' });
  } catch (error: any) {
    console.error('Draft letter error:', error);
    res.status(500).json({ error: error.message || 'Failed to draft letter' });
  }
});

// 16b. AI Draft Official RTI Reply Letter for B.E.O Office using Gemini
app.post('/api/ai/draft-rti-reply', async (req, res) => {
  try {
    const {
      refNumber,
      applicantName,
      applicantAddress,
      applicationNo,
      applicationDate,
      fileNumber,
      informationPoints,
      attachedDocumentsList,
      rtiTransactionType = 'info_reply',
      feeAmount = '40',
      pageCount = '20',
      transfereeOffice = 'ಮುಖ್ಯ ಶಿಕ್ಷಕರು, ಸರ್ಕಾರಿ ಪದವಿ ಪೂರ್ವ ಕಾಲೇಜು (ಪ್ರೌಢಶಾಲಾ ವಿಭಾಗ), ಹೊಸಮನೆ, ಭದ್ರಾವತಿ',
      rejectionReason = 'ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 ರ ಕಲಂ 8(1)(j) ರ ಅನ್ವಯ ಇದು ವೈಯಕ್ತಿಕ ವಿವರವಾಗಿದ್ದು, ಸಾರ್ವಜನಿಕ ಹಿತಾಸಕ್ತಿ ಕಂಡುಬಂದಿರುವುದಿಲ್ಲ.',
    } = req.body;

    const gemini = getGeminiClient();
    const dateFormatted = new Date().toLocaleDateString('kn-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const defaultRef = `ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಮಾ.ಹ.ಪ/${Math.floor(10 + Math.random() * 90)}-02/2026-27`;
    const finalRef = refNumber || defaultRef;

    if (gemini) {
      const prompt = `You are the Public Information Officer (ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ - ಶ್ರೀ ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ) and Block Education Officer for the Office of the Block Education Officer, Bhadravathi (ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ), Department of School Education, Karnataka.
Draft a legally compliant, authentic, formal Right to Information Act 2005 (ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005) Official Transaction Letter in formal administrative KANNADA based on these details:

- RTI Transaction Type: ${rtiTransactionType}
  * If 'acknowledgement': Draft Form-2 Application Acknowledgement Receipt (ಪ್ರಪತ್ರ-೨ ಸ್ವೀಕೃತಿ ರಶೀದಿ).
  * If 'transfer_6_3': Draft Section 6(3) Transfer Letter to another Public Authority (${transfereeOffice}) with intimation copy to applicant.
  * If 'additional_fee': Draft Section 7(1) Additional Photocopy Fee Demand Note (Calculated for ${pageCount} pages @ ₹2/page = ₹${feeAmount}/-).
  * If 'rejection_8': Draft Section 8/9 Exemption & Rejection Order with explicit legal reasons (${rejectionReason}).
  * If 'info_reply' or default: Draft Section 7(1) Final Information Provision Reply.
- Issuing Officer: ಶ್ರೀ ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ, ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ
- Dispatch Reference Number: ${finalRef}
- Applicant Name: ${applicantName || 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿದಾರರು'}
- Applicant Address: ${applicantAddress || 'ಭದ್ರಾವತಿ ತಾಲೂಕು, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ'}
- RTI Application Receipt Number: ${applicationNo || 'RTI/BEO/2026/042'}
- RTI Application Date: ${applicationDate || dateFormatted}
- Office File Number: ${fileNumber || 'ಕಡತ-45/ಆ2/2026-27'}
- Information Points / Action: ${informationPoints || 'ಕೋರಿದ ಮಾಹಿತಿಯ ಅಂಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣೀಕೃತ ದಾಖಲೆಗಳನ್ನು ಒದಗಿಸಲಾಗಿದೆ.'}
- Enclosed Documents: ${attachedDocumentsList || '1. ಸಂಬಂಧಪಟ್ಟ ಅಧಿಕೃತ ದಾಖಲೆಯ ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿ.'}

Legal Requirements under RTI Act 2005 (Karnataka Rules):
1. Letterhead:
   ಕರ್ನಾಟಕ ಸರ್ಕಾರ
   ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
   ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
   ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301
2. Formal Subject Line matching transaction type.
3. Accurate Statutory References (ಕಲಂ 6(1), ಕಲಂ 6(3), ಕಲಂ 7(1), ಕಲಂ 8(1)).
4. Statutory Appellate Clause under Section 19(1) of RTI Act 2005:
   "ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರ: ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ, ಶಿವಮೊಗ್ಗ - 577201. (ಅವಧಿ: 30 ದಿನಗಳು)"
5. Formal sign-off:
   (ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ)
   ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ
   ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ
6. Official Endorsements (ಪ್ರತಿ ರವಾನೆ).

Return ONLY the complete, ready-to-issue official letter text in formal Kannada.`;

      const aiResp = await callGeminiWithFallback(gemini, async (client, model) => {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });
        return response.text || '';
      });

      if (aiResp?.result) {
        return res.json({ letterText: aiResp.result, modelUsed: aiResp.modelUsed });
      }
    }

    // High quality deterministic civil service fallback template based on transaction type
    let fallback = '';
    if (rtiTransactionType === 'acknowledgement') {
      fallback = `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301

ಕ್ರ.ಸಂಖ್ಯೆ: ${finalRef}                                     ದಿನಾಂಕ: ${dateFormatted}

ಪ್ರಪತ್ರ - ೨ (ಕಲಂ ೬(೧) ಮತ್ತು ನಿಯಮ ೩(೨) ನೋಡಿ)
ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿ ಸ್ವೀಕೃತಿ ರಶೀದಿ (ACKNOWLEDGEMENT)

ಇವರಿಗೆ:
${applicantName || 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿದಾರರು'},
${applicantAddress || 'ಭದ್ರಾವತಿ'}.

ಮಾನ್ಯರೇ,
ತಾವು ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ - ೨೦೦೫ ರ ಕಲಂ ೬(೧) ರನ್ವಯ ಈ ಕಛೇರಿಗೆ ಸಲ್ಲಿಸಿರುವ ಅರ್ಜಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ವಿವರಗಳು ಈ ಕೆಳಗಿನಂತಿವೆ:

೧. ಅರ್ಜಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ: ${applicationNo || 'RTI/BEO/2026/042'}
೨. ಅರ್ಜಿ ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ: ${applicationDate || dateFormatted}
೩. ಪಾವತಿಸಲಾದ ಅರ್ಜಿ ಶುಲ್ಕ: ₹10/- (ರಶೀದಿ / ಐಪಿಒ ಸಂಖ್ಯೆಯೊಂದಿಗೆ)
೪. ಕೋರಲಾದ ಮಾಹಿತಿ: ${informationPoints || 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಮಾಹಿತಿ'}
೫. ಕಛೇರಿ ಕಡತ ಸಂಖ್ಯೆ: ${fileNumber || 'ಕಡತ-45/ಆ2/2026-27'}

ಸದರಿ ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಅಧಿನಿಯಮದ ನಿಯಮಾವಳಿಗಳ ಪ್ರಕಾರ ನಿಗದಿತ ಕಾಲಮಿತಿಯೊಳಗೆ (೩೦ ದಿನಗಳು) ಮುಂದಿನ ಅಗತ್ಯ ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗುವುದು ಎಂದು ತಿಳಿಸಲಾಗಿದೆ.

(ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ)
ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ
ದೂರವಾಣಿ: 08282-268241`;
    } else if (rtiTransactionType === 'transfer_6_3') {
      fallback = `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301

ಕ್ರ.ಸಂಖ್ಯೆ: ${finalRef}                                     ದಿನಾಂಕ: ${dateFormatted}

ಇವರಿಗೆ:
${transfereeOffice},
ಭದ್ರಾವತಿ ತಾಲೂಕು.

ವಿಷಯ: ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-೨೦೦೫ ರ ಕಲಂ ೬(೩) ರಡಿಯಲ್ಲಿ ಅರ್ಜಿಯನ್ನು ವರ್ಗಾಯಿಸುವ ಬಗ್ಗೆ.

ಉಲ್ಲೇಖ: ಶ್ರೀ/ಶ್ರೀಮತಿ ${applicantName} ರವರ ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿ ದಿನಾಂಕ: ${applicationDate || dateFormatted} (ನೋಂದಣಿ ಸಂ: ${applicationNo}).

ಮಾನ್ಯರೇ,
ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಅರ್ಜಿದಾರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ ${applicantName} ರವರು ಈ ಕಛೇರಿಗೆ ಸಲ್ಲಿಸಿರುವ ಅರ್ಜಿಯಲ್ಲಿ ಕೋರಿರುವ ಮಾಹಿತಿಯು ತಮ್ಮ ಕಛೇರಿ/ಶಾಲೆಯ ವ್ಯಾಪ್ತಿಗೆ ಮತ್ತು ಅಧಿಕಾರ ಕ್ಷೇತ್ರಕ್ಕೆ ಸಂಬಂಧಿಸಿರುವುದರಿಂದ, ಸದರಿ ಅರ್ಜಿಯ ಮೂಲ ಪ್ರತಿಯನ್ನು ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-೨೦೦೫ ರ ಕಲಂ ೬(೩) ರನ್ವಯ ಮುಂದಿನ ನಿಯಮಾನುಸಾರ ವಿಲೇವಾರಿಗಾಗಿ ತಮಗೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ.

ಆದ್ದರಿಂದ, ಕೋರಲಾದ ಮಾಹಿತಿಯನ್ನು ಅರ್ಜಿದಾರರಿಗೆ ನೇರವಾಗಿ ನಿಗದಿತ ಕಾಲಮಿತಿಯೊಳಗೆ ನಿಯಮಾನುಸಾರ ಒದಗಿಸಿ, ಅದರ ಒಂದು ಪ್ರತಿಯನ್ನು ಈ ಕಛೇರಿಗೆ ಮಾಹಿತಿಗಾಗಿ ಸಲ್ಲಿಸಲು ಕೋರಿದೆ.

(ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ)
ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ

ಪ್ರತಿ ರವಾನೆ:
೧. ಶ್ರೀ/ಶ್ರೀಮತಿ ${applicantName}, ${applicantAddress} - ಸೂಕ್ತ ಮಾಹಿತಿಗಾಗಿ. ತಾವು ಮುಂದಿನ ವ್ಯಾವಹಾರವನ್ನು ಮೇಲ್ಕಂಡ ಸಾರ್ವಜನಿಕ ಪ್ರಾಧಿಕಾರದೊಂದಿಗೆ ನಡೆಸಲು ಸೂಚಿಸಲಾಗಿದೆ.
೨. ಕಛೇರಿ ಕಡತ ಸಂಖ್ಯೆ: ${fileNumber || 'ಕಡತ-45/ಆ2/2026-27'}.`;
    } else if (rtiTransactionType === 'additional_fee') {
      fallback = `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301

ಕ್ರ.ಸಂಖ್ಯೆ: ${finalRef}                                     ದಿನಾಂಕ: ${dateFormatted}

ಇವರಿಗೆ:
${applicantName || 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿದಾರರು'},
${applicantAddress || 'ಭದ್ರಾವತಿ'}.

ವಿಷಯ: ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-೨೦೦೫ ರ ಕಲಂ ೭(೧) ರಡಿ ಹೆಚ್ಚುವರಿ ಶುಲ್ಕ ಪಾವತಿಸುವ ಬಗ್ಗೆ ಸೂಚನಾ ಪತ್ರ.

ಉಲ್ಲೇಖ: ತಮ್ಮ ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿ ದಿನಾಂಕ: ${applicationDate || dateFormatted} (ನೋಂದಣಿ ಸಂ: ${applicationNo}).

ಮಾನ್ಯರೇ,
ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ತಾವು ಕೋರಿರುವ ಮಾಹಿತಿಯ ದಾಖಲೆಗಳನ್ನು ಕಛೇರಿಯ ಕಡತಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಕೋರಿದ ದಾಖಲೆಗಳು ಒಟ್ಟು ${pageCount} ಪುಟಗಳಷ್ಟಾಗಿದ್ದು, ಕರ್ನಾಟಕ ಮಾಹಿತಿ ಹಕ್ಕು ನಿಯಮಗಳು-೨೦೦೫ ರ ಪ್ರಕಾರ ಪ್ರತಿ ಪುಟಕ್ಕೆ ₹2/- ರಂತೆ ಒಟ್ಟು ಮೊತ್ತ ₹${feeAmount}/- (ರೂಪಾಯಿ ನಲವತ್ತು ಮಾತ್ರ) ಗಳನ್ನು ಸರ್ಕಾರಿ ಲೆಕ್ಕ ಶೀರ್ಷಿಕೆಗೆ ಚಲನ್ ಮೂಲಕ ಅಥವಾ ಈ ಕಛೇರಿಯಲ್ಲಿ ನಗದು/ಡಿಡಿ ಮೂಲಕ ಪಾವತಿಸಿ ರಶೀದಿ ಹಾಜರುಪಡಿಸಲು ಕೋರಿದೆ.

ಶುಲ್ಕ ಪಾವತಿಸಿದ ರಶೀದಿಯನ್ನು ಈ ಕಛೇರಿಗೆ ಸಲ್ಲಿಸಿದ ನಂತರ ಕೋರಿದ ದಾಖಲೆಗಳ ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿಗಳನ್ನು ತಮಗೆ ಒದಗಿಸಲಾಗುವುದು ಎಂದು ತಿಳಿಸಲಾಗಿದೆ.

(ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ)
ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ`;
    } else if (rtiTransactionType === 'rejection_8') {
      fallback = `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301

ಕ್ರ.ಸಂಖ್ಯೆ: ${finalRef}                                     ದಿನಾಂಕ: ${dateFormatted}

ಇವರಿಗೆ:
${applicantName || 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿದಾರರು'},
${applicantAddress || 'ಭದ್ರಾವತಿ'}.

ವಿಷಯ: ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-೨೦೦೫ ರ ಕಲಂ ೮(೧) ರನ್ವಯ ಮಾಹಿತಿ ನಿರಾಕರಣೆ / ವಿನಾಯಿತಿ ಆದೇಶ.

ಉಲ್ಲೇಖ: ೧. ತಮ್ಮ ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿ ದಿನಾಂಕ: ${applicationDate || dateFormatted} (ನೋಂದಣಿ ಸಂ: ${applicationNo}).
        ೨. ಈ ಕಛೇರಿಯ ಕಡತ ಸಂಖ್ಯೆ: ${fileNumber || 'ಕಡತ-45/ಆ2/2026-27'}.

ಮಾನ್ಯರೇ,
ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ತಾವು ಸಲ್ಲಿಸಿದ್ದ ಅರ್ಜಿಯಲ್ಲಿ ಕೋರಲಾದ ಅಂಶಗಳನ್ನು ಕೂಲಂಕಷವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.

ತಾವು ಕೋರಿರುವ ಮಾಹಿತಿಯು ${rejectionReason} ಆದ್ದರಿಂದ ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-೨೦೦೫ ರ ಕಲಂ ೮(೧) / ಕಲಂ ೯ ರ ನಿಬಂಧನೆಗಳ ಅನ್ವಯ ಈ ಮಾಹಿತಿಯನ್ನು ಬಹಿರಂಗಪಡಿಸುವುದರಿಂದ ವಿನಾಯಿತಿ ನೀಡಲಾಗಿದ್ದು, ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಲು ಸಾಧ್ಯವಿರುವುದಿಲ್ಲವೆಂದು ಈ ಮೂಲಕ ತಿಳಿಸಲಾಗಿದೆ.

ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರದ ವಿವರ:
ಈ ಆದೇಶದಿಂದ ಬಾಧಿತರಾದಲ್ಲಿ, ತಾವು ಪತ್ರ ತಲುಪಿದ ೩೦ ದಿನಗಳೊಳಗಾಗಿ ಈ ಕೆಳಕಂಡ ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರಕ್ಕೆ ಕಲಂ ೧೯(೧) ರಡಿ ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸಬಹುದಾಗಿದೆ:
"ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ, ಶಿವಮೊಗ್ಗ - 577201"

(ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ)
ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ`;
    } else {
      fallback = `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301

ಕ್ರ.ಸಂಖ್ಯೆ: ${finalRef}                                     ದಿನಾಂಕ: ${dateFormatted}

ಗೆ:
${applicantName || 'ಶ್ರೀಯುತ ಕೆ. ರಾಮಕೃಷ್ಣ ಭಟ್'},
${applicantAddress || 'ಹೊಸಮನೆ ಬಡಾವಣೆ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301'}.

ವಿಷಯ: ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-2005 ರ ಕಲಂ 6(1) ಮತ್ತು 7(1) ರಡಿಯಲ್ಲಿ ಕೋರಿರುವ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸುವ ಬಗ್ಗೆ.

ಉಲ್ಲೇಖ: 1. ತಮ್ಮ ಕಛೇರಿ ಸ್ವೀಕೃತಿ ಅರ್ಜಿ ಸಂಖ್ಯೆ: ${applicationNo || 'RTI/BEO/2026/APP-104'}, ದಿನಾಂಕ: ${applicationDate || '2026-08-20'}.
        2. ಈ ಕಛೇರಿಯ ಕಡತ ಸಂಖ್ಯೆ: ${fileNumber || 'ಕಡತ-45/ಆ2/2026-27'}.

ಮಾನ್ಯರೇ,

ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ, ತಾವು ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-2005 ರ ಅನ್ವಯ ಈ ಕಛೇರಿಗೆ ಸಲ್ಲಿಸಿದ್ದ ಅರ್ಜಿಯಲ್ಲಿ ಕೋರಲಾದ ಅಂಶಗಳನ್ನು ನಿಯಮಾನುಸಾರ ಕೂಲಂಕಷವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಕಛೇರಿಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ದೃಢೀಕೃತ ಮಾಹಿತಿಯನ್ನು ಈ ಕೆಳಕಂಡಂತೆ ಒದಗಿಸಲಾಗಿದೆ:

${informationPoints || '1. ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದಲ್ಲಿ ಕೋರಿದ ಮಾಹಿತಿಯನ್ನು ನಿಯಮಾನುಸಾರ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.\n2. ಈ ಕಛೇರಿಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ದೃಢೀಕೃತ ದಾಖಲೆಗಳ ಪ್ರತಿಯನ್ನು ಲಗತ್ತಿಸಲಾಗಿದೆ.'}

ಲಗತ್ತಿಸಲಾದ ದಾಖಲೆಗಳು (Enclosed Documents):
${attachedDocumentsList || '1. ಈ ಕಛೇರಿಯ ಪ್ರಮಾಣೀಕೃತ ನಡಾವಳಿ ದಾಖಲೆ ಪ್ರತಿ (PDF).\n2. ಪರಿಶೀಲನಾ ರಶೀದಿ ಪ್ರತಿ.'}

ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರದ ವಿವರ (First Appellate Authority):
ಮೇಲ್ಕಂಡ ಮಾಹಿತಿಯಿಂದ ತಾವು ತೃಪ್ತರಾಗದಿದ್ದಲ್ಲಿ ಅಥವಾ ಆಕ್ಷೇಪಣೆಗಳಿದ್ದಲ್ಲಿ, ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ-2005 ರ ಕಲಂ 19(1) ರ ಪ್ರಕಾರ ಈ ಪತ್ರ ತಲುಪಿದ 30 (ಮೂವತ್ತು) ದಿನಗಳ ಕಾಲಮಿತಿಯೊಳಗೆ ಈ ಕೆಳಕಂಡ ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರಕ್ಕೆ ನಿಯಮಾನುಸಾರ ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸಬಹುದಾಗಿದೆ:

"ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ,
ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ, ಶಿವಮೊಗ್ಗ - 577201"

ತಮ್ಮ ವಿಶ್ವಾಸಿ,

(ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ)
ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ
ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ

ಪ್ರತಿ ರವಾನೆ:
1. ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರ ಹಾಗೂ ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - ಗೌರವಪೂರ್ವಕ ಮಾಹಿತಿಗಾಗಿ.
2. ಕಛೇರಿ ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ ಸಂಖ್ಯೆ: ${fileNumber || 'ಕಡತ-45/ಆ2/2026-27'}.
3. ಜಾವಾಕ್ ರಿಜಿಸ್ಟರ್ / ಕಛೇರಿ ಪ್ರತಿ.`;
    }

    return res.json({ letterText: fallback, modelUsed: 'civil-service-rti-engine (fallback)' });
  } catch (err: any) {
    console.error('AI Draft RTI Reply error:', err);
    res.status(500).json({ error: 'Failed to generate RTI reply letter', details: err?.message });
  }
});

// 16c. Multi-turn AI Chatbot Interface using Gemini (models/gemini-3.8-flash, gemini-3.5-flash, gemini-3.1-flash-lite, gemini-3.1-pro-preview)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages = [], model = 'gemini-3.8-flash', systemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const gemini = getGeminiClient();
    const defaultInstruction = `You are the Official AI Legal & Administrative Assistant for Karnataka School Education & Literacy Department, Office of the Block Education Officer (BEO), Bhadravathi, Shivamogga District.
You have expert authority on:
1. Karnataka Civil Services Rules (KCSR 1958) - Pension rules (Rule 287, 292B, Appendix-I commutation), Earned Leave (Rule 118A), Time Bound Advancement (10, 15, 20, 25, 30 years promotions / Prapathra-28), Child Care Leave (CCL 180 days), and Disciplinary rules (KCS CCA 1957).
2. Right to Information Act 2005 (ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ ೨೦೦೫) - Section 6(1) applications, Section 6(3) 5-day transfer to other public authorities, Section 7(1) 30-day statutory response timelines (and 48 hours for life/liberty), Section 7(3) additional fee calculation, Section 8(1) & 9 statutory exemption clauses, Section 19(1) First Appeal before BEO (FAA), Section 19(3) KIC appeal, and Section 20 penalty provisions.
3. Official correspondence drafting (ಸರ್ಕಾರಿ ಪತ್ರ ವ್ಯವಹಾರ), Dockets, Registers, LPC, Service Verification, and G.O. guidelines.

Always respond helpfully, accurately, and politely in formal administrative Kannada (and English where technical clarity is needed). Cite the exact KCSR rule or RTI section when advising on legal queries.`;

    const activeInstruction = systemInstruction || defaultInstruction;

    if (gemini) {
      const contents = messages.map((m: any) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : (m.parts?.[0]?.text || '') }]
      }));

      const chosenModel = model || 'gemini-3.8-flash';
      try {
        const response = await gemini.models.generateContent({
          model: chosenModel,
          contents: contents,
          config: {
            systemInstruction: activeInstruction,
            temperature: 0.4,
          }
        });

        const reply = response.text || '';
        return res.json({ reply, modelUsed: chosenModel });
      } catch (geminiErr: any) {
        console.warn(`Gemini chat with ${chosenModel} error, trying fallback:`, geminiErr?.message);
        
        const fallbackRes = await callGeminiWithFallback(gemini, async (client, mName) => {
          const resp = await client.models.generateContent({
            model: mName,
            contents: contents,
            config: {
              systemInstruction: activeInstruction,
              temperature: 0.4,
            }
          });
          return resp.text || '';
        });

        if (fallbackRes?.result) {
          return res.json({ reply: fallbackRes.result, modelUsed: fallbackRes.modelUsed });
        }
      }
    }

    const lastUserMsg = messages[messages.length - 1]?.content || messages[messages.length - 1]?.parts?.[0]?.text || '';
    const qLower = String(lastUserMsg).toLowerCase();

    let fallbackReply = `ನಮಸ್ಕಾರ, ನಾನು ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಚೇರಿಯ (BEO) KCSR & RTI AI ಸಹಾಯಕ.\n\nನಿಮ್ಮ ಪ್ರಶ್ನೆ: "${lastUserMsg}"\n\n`;

    if (qLower.includes('rti') || qLower.includes('ಮಾಹಿತಿ ಹಕ್ಕು') || qLower.includes('೬(೩)') || qLower.includes('6(3)')) {
      fallbackReply += `ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ ೨೦೦೫ ರ ಪ್ರಮುಖ ಅಂಶಗಳು:\n- ಕಲಂ ೬(೧): ಸಾರ್ವಜನಿಕರು ₹೧೦ ಅರ್ಜಿ ಶುಲ್ಕದೊಂದಿಗೆ ಮಾಹಿತಿ ಕೋರಬಹುದು (BPL ಕಾರ್ಡ್‌ದಾರರಿಗೆ ಶುಲ್ಕ ವಿನಾಯಿತಿ).\n- ಕಲಂ ೬(೩): ಕೋರಿದ ಮಾಹಿತಿ ಬೇರೆ ಸಾರ್ವಜನಿಕ ಪ್ರಾಧಿಕಾರಕ್ಕೆ ಸಂಬಂಧಿಸಿದ್ದಲ್ಲಿ ೫ ದಿನಗಳೊಳಗೆ ಅರ್ಜಿ ವರ್ಗಾಯಿಸಬೇಕು ಮತ್ತು ಅರ್ಜಿದಾರರಿಗೆ ತಿಳಿಸಬೇಕು.\n- ಕಲಂ ೭(೧): ಅರ್ಜಿ ಸ್ವೀಕರಿಸಿದ ೩೦ ದಿನಗಳೊಳಗೆ ಮಾಹಿತಿ ಒದಗಿಸುವುದು ಕಡ್ಡಾಯ (ವ್ಯಕ್ತಿಯ ಜೀವ ಅಥವಾ ಸ್ವಾತಂತ್ರ್ಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದ್ದಲ್ಲಿ ೪೮ ಗಂಟೆಗಳೊಳಗೆ).\n- ಕಲಂ ೧೯(೧): ಮಾಹಿತಿ ದೊರೆಯದಿದ್ದರೆ ಅಥವಾ ತೃಪ್ತಿಕರವಲ್ಲದಿದ್ದರೆ ೩೦ ದಿನಗಳೊಳಗೆ ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರಕ್ಕೆ (BEO) ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸಬಹುದು.`;
    } else if (qLower.includes('pension') || qLower.includes('ಪಿಂಚಣಿ') || qLower.includes('gratuity') || qLower.includes('ಉಪದಾನ')) {
      fallbackReply += `KCSR ಪಿಂಚಣಿ ಹಾಗೂ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳ ನಿಯಮಗಳು:\n- ನಿಯಮ ೨೮೭(೨): ಮಾಸಿಕ ಪಿಂಚಣಿ = (ಕೊನೆಯ ಮೂಲ ವೇತನ ÷ ೨) × (ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು ÷ ೬೦), ಕನಿಷ್ಠ ₹13,500, ಗರಿಷ್ಠ ₹75,300.\n- ನಿಯಮ ೨೯೨B: ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG) = (ಮೂಲ ವೇತನ + DA) ÷ ೪ × ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು (ಗರಿಷ್ಠ ೧೬.೫ ತಿಂಗಳು ಹಾಗೂ ಗರಿಷ್ಠ ₹೨೦,೦೦,೦೦೦).\n- ನಿಯಮ ೩೭೬ & Appendix-I: ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ (CVP) ಗರಿಷ್ಠ ೪೦% ಮತ್ತು ೧೫ ವರ್ಷಗಳ ನಂತರ ಮೂಲ ಪಿಂಚಣಿ ಮರುಸ್ಥಾಪನೆ.\n- ನಿಯಮ ೧೧೮A: ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಗರಿಷ್ಠ ೩೦೦ ದಿನಗಳ ಮಿತಿಯೊಳಗೆ.`;
    } else {
      fallbackReply += `ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳು (KCSR) ಮತ್ತು ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ (RTI 2005) ಅಡಿಯಲ್ಲಿ ಎಲ್ಲಾ ಸೇವಾ ವಿಷಯಗಳು, ಪಿಂಚಣಿ ಲೆಕ್ಕಾಚಾರ, ವೇತನ ಬಡ್ತಿ (ಪ್ರಪತ್ರ-೨೮) ಮತ್ತು ಪತ್ರ ವ್ಯವಹಾರಗಳಿಗೆ ಈ ತಂತ್ರಾಂಶದಲ್ಲಿ ಸಂಪೂರ್ಣ ನಮೂನೆಗಳು ಲಭ್ಯವಿವೆ. ದಯವಿಟ್ಟು ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆ ಅಥವಾ ನಿಯಮವನ್ನು ಕೇಳಿ.`;
    }

    return res.json({ reply: fallbackReply, modelUsed: 'deterministic-administrative-engine' });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed', details: err?.message });
  }
});

// 11. AI Summarize Incoming Letter & Extract Action Items using Gemini
app.post('/api/ai/summarize-letter', async (req, res) => {
  try {
    const { letterText, subject } = req.body;
    if (!letterText) {
      return res.status(400).json({ error: 'Letter text is required' });
    }

    const gemini = getGeminiClient();

    if (gemini) {
      const prompt = `You are a Senior Administrative Officer in the Department of Education.
Analyze the following official education department letter/document:

Subject: ${subject || 'Incoming Official Correspondence'}
Document Text:
"""
${letterText.substring(0, 4000)}
"""

Provide an executive administrative analysis in JSON format with these exact keys:
{
  "summary": "Concise 2-3 sentence executive synopsis of the document",
  "actionItems": ["Action item 1", "Action item 2", "Action item 3"],
  "urgencyAssessment": "Assessment of timeline and risk (Immediate, Urgent, or Routine) with rationale",
  "recommendedSection": "Which departmental section should handle this (Academic Wing, Accounts & Grants, Inspection & Quality, Legal & Grievances, Administration, Examination Board)",
  "suggestedReplyPoints": ["Point to include in reply 1", "Point 2"]
}
Return ONLY valid JSON.`;

      const aiResp = await callGeminiWithFallback(gemini, async (client, model) => {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        return response.text || '{}';
      });

      if (aiResp?.result) {
        try {
          const parsed = JSON.parse(aiResp.result);
          return res.json({ ...parsed, modelUsed: aiResp.modelUsed });
        } catch {
          // JSON parsing failure fallback
        }
      }
    }

    // High quality deterministic administrative response if Gemini client is absent or temporarily busy
    return res.json({
      summary: `Preliminary scrutiny of correspondence concerning "${subject || 'Education Matter'}": Outlines statutory institutional compliance directives, document validation mandates, and administrative sign-off requirements.`,
      actionItems: [
        'Verify statutory institutional affiliation code and jurisdictional remit.',
        'Issue formal departmental acknowledgment receipt to the sender desk.',
        'Forward to designated Section Officer for administrative scrutiny.',
        'Prepare formal compliance disposal within designated calendar period.'
      ],
      urgencyAssessment: 'Routine administrative review required within statutory response timeline.',
      recommendedSection: 'Academic Wing',
      suggestedReplyPoints: [
        'Acknowledge receipt of official dispatch with registry reference.',
        'State timeline for departmental compliance and inspection review.'
      ],
      modelUsed: 'administrative-rule-engine (fallback)'
    });
  } catch (err: any) {
    console.error('AI Summarize error:', err);
    res.status(500).json({ error: 'Failed to summarize document', details: err?.message });
  }
});

// 12. Dak Register & Departmental Summary Reports
const handleDakSummary = async (req: express.Request, res: express.Response) => {
  try {
    const totalLetters = letters.length;
    const totalInward = letters.filter(l => l.direction === 'inward').length;
    const totalOutward = letters.filter(l => l.direction === 'outward').length;
    const pendingActionCount = letters.filter(l => l.status === 'Pending Action' || l.status === 'Under Review').length;
    const closedCount = letters.filter(l => l.status === 'Closed & Archived' || l.status === 'Dispatched').length;

    // Check overdue
    const today = new Date();
    const overdueCount = letters.filter(l => {
      if (l.status === 'Closed & Archived' || l.status === 'Dispatched') return false;
      const due = new Date(l.dueDate);
      return due < today;
    }).length;

    const disposalRate = totalLetters > 0 ? Math.round((closedCount / totalLetters) * 100) : 0;

    const totalGrantsSanctioned = letters.reduce((sum, l) => sum + (l.financialAmount || 0), 0);

    const categoryBreakdown: Record<string, number> = {};
    letters.forEach(l => {
      categoryBreakdown[l.category] = (categoryBreakdown[l.category] || 0) + 1;
    });

    const sectionBreakdown: Record<string, { total: number; pending: number }> = {};
    letters.forEach(l => {
      if (!sectionBreakdown[l.section]) {
        sectionBreakdown[l.section] = { total: 0, pending: 0 };
      }
      sectionBreakdown[l.section].total += 1;
      if (l.status === 'Pending Action' || l.status === 'Under Review') {
        sectionBreakdown[l.section].pending += 1;
      }
    });

    const priorityBreakdown: Record<string, number> = {
      Immediate: letters.filter(l => l.priority === 'Immediate').length,
      Urgent: letters.filter(l => l.priority === 'Urgent').length,
      Routine: letters.filter(l => l.priority === 'Routine').length,
    };

    // Employee & File-Wise Totals
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const totalFiles = docketFiles.length;

    const filesBreakdown: Record<string, number> = {
      active: docketFiles.filter(f => f.status === 'Active / Open').length,
      underScrutiny: docketFiles.filter(f => f.status === 'Under Scrutiny').length,
      pendingApproval: docketFiles.filter(f => f.status === 'Pending Higher Approval').length,
      closed: docketFiles.filter(f => f.status === 'Disposed / Closed').length,
    };

    const fileWiseTotals = docketFiles.map(f => {
      const matchedLetters = letters.filter(l => l.fileNumber === f.fileNumber || (f.linkedLetterIds && f.linkedLetterIds.includes(l.id)));
      const financialSum = matchedLetters.reduce((s, l) => s + (l.financialAmount || 0), 0);
      return {
        fileNumber: f.fileNumber,
        subject: f.subject,
        section: f.section,
        currentCustodian: f.currentCustodian,
        status: f.status,
        priority: f.priority,
        lettersCount: matchedLetters.length,
        financialAmount: financialSum,
      };
    });

    let aiExecutiveOverview = '';
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `You are the Principal Advisor to the Minister of Education.
Analyze these Department Dak & File Registry statistics:
- Total Letters Logged: ${totalLetters} (Inward: ${totalInward}, Outward: ${totalOutward})
- Active Files Pending Action: ${pendingActionCount} (${overdueCount} overdue beyond target date)
- Department Disposal Rate: ${disposalRate}%
- Total Financial Grants Processed: $${totalGrantsSanctioned.toLocaleString()}
- Total Department Employees: ${totalEmployees} (${activeEmployees} active)
- Total Master File Dockets: ${totalFiles}
- Key Categories: ${Object.entries(categoryBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}

Provide a sharp 3-sentence executive administrative appraisal highlighting governance efficiency, priority bottlenecks, and inspection directives.`;

        const aiResp = await callGeminiWithFallback(gemini, async (client, model) => {
          const response = await client.models.generateContent({
            model,
            contents: prompt,
          });
          return response.text || '';
        });

        if (aiResp?.result) {
          aiExecutiveOverview = aiResp.result;
        }
      } catch {
        // High-demand or transient exception handled silently with structured report fallback
      }
    }

    if (!aiExecutiveOverview) {
      aiExecutiveOverview = `Executive Registry Audit: The department establishment comprises ${totalEmployees} registered officers and ${totalFiles} active master dockets. Maintaining an overall disposal efficiency of ${disposalRate}%, with ${totalInward} inward communications received and ${totalOutward} official orders dispatched. Priority vigilance is required for ${pendingActionCount} pending cases, of which ${overdueCount} have exceeded designated response timelines. Total financial sanctions under administration aggregate to $${totalGrantsSanctioned.toLocaleString()}.`;
    }

    res.json({
      totalLetters,
      totalInward,
      totalOutward,
      pendingActionCount,
      overdueCount,
      closedCount,
      disposalRate,
      totalGrantsSanctioned,
      categoryBreakdown,
      sectionBreakdown,
      priorityBreakdown,
      totalEmployees,
      activeEmployees,
      totalFiles,
      filesBreakdown,
      fileWiseTotals,
      aiExecutiveOverview,
    });
  } catch (err: any) {
    console.error('Dak register error:', err);
    res.status(500).json({ error: 'Failed to compute register summary', details: err?.message });
  }
};

app.get('/api/reports/dak-summary', handleDakSummary);
app.get('/api/reports/dak-register', handleDakSummary);

// 17. Reset to Sample Demo Data
const handleResetDemo = (req: express.Request, res: express.Response) => {
  letters = [...sampleLetters];
  docketFiles = [...sampleDocketFiles];
  employees = [...sampleEmployees];
  res.json({
    message: 'Reset to sample Education Department records successfully',
    lettersCount: letters.length,
    filesCount: docketFiles.length,
    employeesCount: employees.length,
  });
};

app.post('/api/reset-demo', handleResetDemo);
app.post('/api/seed-demo', handleResetDemo);

// ==================== KARNATAKA GOVT MEMORANDUM ORDERS (ಜ್ಞಾಪನಾ ಆದೇಶ) APIs ====================
// Helper to extract authenticated user from request context
const getReqUser = (req: express.Request) => {
  const roleHeader = (req.headers['x-user-role'] as string) || req.body?.userRole;
  const nameHeader = (req.headers['x-user-name'] as string) || req.body?.userName;
  const username = (req.headers['x-username'] as string) || req.body?.username || 'admin';
  return {
    username,
    displayName: nameHeader || 'ಆಡಳಿತ ಶಾಖೆ (Admin)',
    role: (roleHeader === 'Data Entry Operator' || roleHeader === 'Viewer' ? roleHeader : 'Admin') as 'Admin' | 'Data Entry Operator' | 'Viewer',
  };
};

// 1. Dashboard Statistics
app.get('/api/memorandum/dashboard-stats', (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard stats' });
  }
});

// 2. Order Types
app.get('/api/memorandum/order-types', (req, res) => {
  try {
    const types = db.getOrderTypes();
    res.json({ orderTypes: types, count: types.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Pay Rules
app.get('/api/memorandum/pay-rules', (req, res) => {
  try {
    const rules = db.getPayRules();
    res.json({ payRules: rules, count: rules.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memorandum/pay-rules', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ವೇತನ ಬಡ್ತಿ ನಿಯಮಗಳನ್ನು ಬದಲಾಯಿಸಲು ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ (Admin) ಮಾತ್ರ ಅನುಮತಿ ಇದೆ.' });
    }
    const saved = db.savePayRule(req.body, user.displayName, user.role);
    res.json({ success: true, payRule: saved, message: 'ವೇತನ ನಿಯಮವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Employees & KGID Lookup
app.get('/api/memorandum/employees', (req, res) => {
  try {
    const query = req.query.q as string;
    const section = req.query.section as string;
    const cadre = req.query.cadre as string;
    const list = db.getAllEmployees(query, section, cadre);
    res.json({ employees: list, count: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memorandum/employee-lookup/:kgid', (req, res) => {
  try {
    const { kgid } = req.params;
    const employee = db.getEmployeeByKgid(kgid);
    if (!employee) {
      return res.status(404).json({ error: `ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ "${kgid}" ಹೊಂದಿರುವ ನೌಕರರ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ.` });
    }
    const salaryHistory = db.getSalaryHistory(employee.kgidNumber);
    const orderHistory = db.getOrders(employee.kgidNumber);
    res.json({
      employee,
      salaryHistory,
      orderHistory,
      exists: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memorandum/employees', (req, res) => {
  try {
    const user = getReqUser(req);
    const created = db.saveEmployee(req.body, user.displayName, user.role);
    res.json({ success: true, employee: created, message: 'ನೌಕರರ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/memorandum/employees/:id', (req, res) => {
  try {
    const user = getReqUser(req);
    const updated = db.updateEmployee(req.params.id, req.body, user.displayName, user.role);
    res.json({ success: true, employee: updated, message: 'ನೌಕರರ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/memorandum/employees/:id', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ನೌಕರರ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಅಡ್ಮಿನ್ ಅನುಮತಿ ಅಗತ್ಯ.' });
    }
    const deleted = db.deleteEmployee(req.params.id, user.displayName, user.role);
    res.json({ success: true, deleted, message: 'ನೌಕರರ ದಾಖಲೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Calculation Engine
app.post('/api/memorandum/calculate', (req, res) => {
  try {
    const { kgidNumber, orderTypeId, orderTypeName, customEffectiveDate, leaveFrom, leaveTo, leaveDaysRequested, employeeData, employee } = req.body || {};
    if (!kgidNumber) {
      return res.status(400).json({ error: 'ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ.' });
    }
    if (!orderTypeId && !orderTypeName) {
      return res.status(400).json({ error: 'ಆದೇಶದ ಪ್ರಕಾರ ಕಡ್ಡಾಯವಾಗಿದೆ.' });
    }
    const calculation = db.calculateOrderDetails({
      kgidNumber,
      orderTypeId,
      orderTypeName,
      customEffectiveDate,
      leaveFrom,
      leaveTo,
      leaveDaysRequested: Number(leaveDaysRequested) || 0,
      employeeData: employeeData || employee,
    });
    res.json(calculation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Generate Memorandum Order (Atomic Transaction)
app.post('/api/memorandum/generate-order', (req, res) => {
  try {
    const user = getReqUser(req);
    const { orderData, employeeUpdates, skipDuplicateCheck, employeeData, employee } = req.body || {};
    if (!orderData || !orderData.kgidNumber) {
      return res.status(400).json({ error: 'ಆದೇಶ ವಿವರಗಳು ಮತ್ತು ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ.' });
    }
    const result = db.executeMemorandumOrderTransaction({
      orderData: { ...orderData, employeeData: orderData.employeeData || employeeData || employee },
      employeeUpdates,
      user,
      skipDuplicateCheck: Boolean(skipDuplicateCheck),
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Orders Queries
app.get('/api/memorandum/orders', (req, res) => {
  try {
    const kgid = req.query.kgid as string;
    const type = req.query.type as string;
    const orders = db.getOrders(kgid, type);
    res.json({ orders, count: orders.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Order Files (ಆದೇಶಗಳ ಕಡತ)
app.get('/api/memorandum/order-files', (req, res) => {
  try {
    const q = req.query.q as string;
    const files = db.getOrderFiles(q);
    res.json({ files, count: files.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memorandum/order-files/:id', (req, res) => {
  try {
    const file = db.getOrderFileById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'ಆದೇಶ ಕಡತ ಕಂಡುಬಂದಿಲ್ಲ.' });
    }
    res.json({ file });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/memorandum/order-files/:id', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ಆದೇಶ ಕಡತವನ್ನು ಅಳಿಸಲು ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ ಅನುಮತಿ ಇದೆ.' });
    }
    const success = db.deleteOrderFile(req.params.id, user.displayName, user.role);
    if (!success) {
      return res.status(404).json({ error: 'ಆದೇಶ ಕಡತ ಕಂಡುಬಂದಿಲ್ಲ.' });
    }
    res.json({ success: true, message: 'ಆದೇಶ ಕಡತವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Salary History (ವೇತನ ಬದಲಾವಣೆ)
app.get('/api/memorandum/salary-history', (req, res) => {
  try {
    const kgid = req.query.kgid as string;
    const records = db.getSalaryHistory(kgid);
    res.json({ salaryHistory: records, count: records.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Audit Logs
app.get('/api/memorandum/audit-logs', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 200;
    const logs = db.getAuditLogs(limit);
    res.json({ auditLogs: logs, count: logs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Office Configuration
app.get('/api/memorandum/office-config', (req, res) => {
  try {
    const cfg = db.getOfficeConfig();
    res.json({ office: cfg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/memorandum/office-config', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ಕಛೇರಿಯ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಲು ಅಡ್ಮಿನ್ ಅನುಮತಿ ಅಗತ್ಯ.' });
    }
    const updated = db.updateOfficeConfig(req.body, user.displayName, user.role);
    res.json({ success: true, office: updated, message: 'ಕಛೇರಿ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 12. Unified Search
app.get('/api/memorandum/search', (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const results = db.unifiedSearch(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Backup, Restore, and Reset
app.get('/api/memorandum/backup/export', (req, res) => {
  try {
    const data = db.exportBackup();
    res.setHeader('Content-Disposition', 'attachment; filename="karnataka_memorandum_db_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memorandum/backup/restore', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ಡೇಟಾ ಮರುಸ್ಥಾಪನೆಗೆ ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ ಅನುಮತಿ ಇದೆ.' });
    }
    db.restoreBackup(req.body, user.displayName, user.role);
    res.json({ success: true, message: 'ಡೇಟಾಬೇಸ್ ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/memorandum/backup/reset', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ಮರುಹೊಂದಿಸಲು ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ ಅನುಮತಿ ಇದೆ.' });
    }
    db.resetToDefaults(user.displayName);
    res.json({ success: true, message: 'ಡೇಟಾಬೇಸ್ ಅನ್ನು ಡಿಫಾಲ್ಟ್ ಸ್ಥಿತಿಗೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 14. Users
app.get('/api/memorandum/users', (req, res) => {
  try {
    const users = db.getUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 15. LETTER MAKER STUDIO & OCR MODULE ====================

// A. OCR Document Reader (Multimodal PDF/Image Extraction)
app.post('/api/letter-maker/ocr-read', async (req, res) => {
  try {
    const { fileData, fileName, mimeType, sampleScenario } = req.body || {};

    let extractedData = {
      letterNumber: '',
      date: '',
      employeeName: '',
      kgidNumber: '',
      designation: '',
      officeName: '',
      department: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ (School Education Department)',
      subject: '',
      reference: '',
      serviceDetails: '',
      leaveDetails: '',
      salaryDetails: '',
      otherInfo: '',
      rawText: '',
      confidence: 'High' as 'High' | 'Medium' | 'Low',
      missingCriticalFields: [] as string[],
      safetyWarning: '',
    };

    const gemini = getGeminiClient();

    if (fileData && gemini) {
      try {
        // Strip data:image/...;base64, prefix if present
        let cleanBase64 = fileData;
        let actualMime = mimeType || 'image/jpeg';
        if (fileData.includes(';base64,')) {
          const parts = fileData.split(';base64,');
          actualMime = parts[0].replace('data:', '') || actualMime;
          cleanBase64 = parts[1];
        }

        const prompt = `You are an expert Kannada & English official administrative document reader for the Karnataka State Government (ಕರ್ನಾಟಕ ಸರ್ಕಾರ).
Analyze this uploaded official document image or PDF.
Extract the following information carefully in Kannada (with English transliterations where standard):
1. letterNumber (ಪತ್ರದ ಸಂಖ್ಯೆ / ಆದೇಶ ಸಂಖ್ಯೆ / ಕಡತ ಸಂಖ್ಯೆ)
2. date (ದಿನಾಂಕ)
3. employeeName (ನೌಕರರ ಹೆಸರು - ಶ್ರೀ/ಶ್ರೀಮತಿ...)
4. kgidNumber (ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ / KGID Number)
5. designation (ಹುದ್ದೆ - e.g. ಮುಖ್ಯ ಶಿಕ್ಷಕರು, ದ್ವಿತೀಯ ದರ್ಜೆ ಸಹಾಯಕರು)
6. officeName (ಕಚೇರಿ / ಶಾಲೆಯ ಹೆಸರು)
7. department (ಇಲಾಖೆಯ ಹೆಸರು)
8. subject (ವಿಷಯ - Matter / Subject of the letter)
9. reference (ಉಲ್ಲೇಖ - Reference letters, GOs, or applications)
10. serviceDetails (ಸೇವಾ ವಿವರಗಳು - joining date, years of service)
11. leaveDetails (ರಜೆ ವಿವರಗಳು - leave from, to, days if mentioned)
12. salaryDetails (ವೇತನ ವಿವರಗಳು - basic pay, scale of pay if mentioned)
13. otherInfo (ಇತರ ಪ್ರಮುಖ ಮುಖ್ಯಾಂಶಗಳು)
14. fullRawText (Complete extracted text in Kannada)

CRITICAL ACCURACY RULES:
- If KGID or salary is NOT clearly present in the document, return empty string. NEVER invent or guess KGID or salary.
- Return ONLY valid JSON format:
{
  "letterNumber": "...",
  "date": "...",
  "employeeName": "...",
  "kgidNumber": "...",
  "designation": "...",
  "officeName": "...",
  "department": "...",
  "subject": "...",
  "reference": "...",
  "serviceDetails": "...",
  "leaveDetails": "...",
  "salaryDetails": "...",
  "otherInfo": "...",
  "fullRawText": "..."
}`;

        const aiRes = await callGeminiWithFallback(gemini, async (client, model) => {
          return client.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: actualMime,
                      data: cleanBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
          });
        });

        if (aiRes?.result?.text) {
          const text = aiRes.result.text;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            extractedData = {
              letterNumber: parsed.letterNumber || '',
              date: parsed.date || '',
              employeeName: parsed.employeeName || '',
              kgidNumber: parsed.kgidNumber || '',
              designation: parsed.designation || '',
              officeName: parsed.officeName || '',
              department: parsed.department || 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ',
              subject: parsed.subject || '',
              reference: parsed.reference || '',
              serviceDetails: parsed.serviceDetails || '',
              leaveDetails: parsed.leaveDetails || '',
              salaryDetails: parsed.salaryDetails || '',
              otherInfo: parsed.otherInfo || '',
              rawText: parsed.fullRawText || text,
              confidence: 'High',
              missingCriticalFields: [],
              safetyWarning: '',
            };
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini OCR API call error, falling back to document analysis:', geminiErr?.message);
      }
    }

    // If Gemini was offline or fields are empty and a sample scenario was picked, provide accurate sample OCR
    if (!extractedData.employeeName && sampleScenario) {
      if (sampleScenario === 'leave_application') {
        extractedData = {
          letterNumber: 'GHS/KDR/REJ/2026/42',
          date: '2026-03-02',
          employeeName: 'ಶ್ರೀ ರಮೇಶ್ ಎನ್.',
          kgidNumber: '1122334',
          designation: 'ಸಹಾಯಕ ಶಿಕ್ಷಕರು (ಪಿ.ಸಿ.ಎಂ)',
          officeName: 'ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ, ಕಡೂರು',
          department: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ',
          subject: 'ದಿನಾಂಕ: 15-03-2026 ರಿಂದ 24-03-2026 ರವರೆಗೆ 10 ದಿನಗಳ ಗಳಿಕೆ ರಜೆ ಮಂಜೂರು ಮಾಡುವ ಬಗ್ಗೆ ಕೋರಿಕೆ.',
          reference: '1. ನೌಕರರ ಮನವಿ ದಿನಾಂಕ: 01-03-2026.\n2. ಶಾಲೆಯ ಮುಖ್ಯ ಶಿಕ್ಷಕರ ಶಿಫಾರಸ್ಸು ದಿನಾಂಕ: 02-03-2026.',
          serviceDetails: 'ಖಾಯಂ ನೇಮಕಾತಿ: 2014-06-15, ಒಟ್ಟು ಸೇವೆ: 11 ವರ್ಷಗಳು',
          leaveDetails: 'ಗಳಿಕೆ ರಜೆ (EL): 10 ದಿನಗಳು (15-03-2026 ರಿಂದ 24-03-2026)',
          salaryDetails: 'ಹಾಲಿ ಮೂಲ ವೇತನ: ₹43,100/-, ವೇತನ ಶ್ರೇಣಿ: 37900-70850',
          otherInfo: 'ಕುಟುಂಬದ ಶುಭ ಸಮಾರಂಭಕ್ಕಾಗಿ ರಜೆ ಅಗತ್ಯವಿದ್ದು, ರಜೆ ಲೆಕ್ಕದಲ್ಲಿ 120 ದಿನಗಳ ಶಿಲ್ಕು ಇರುತ್ತದೆ.',
          rawText: `ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ, ಕಡೂರು
ದಿನಾಂಕ: 02-03-2026
ಸಂಖ್ಯೆ: GHS/KDR/REJ/2026/42

ಇವರಿಗೆ,
ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು,
ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಭದ್ರಾವತಿ.

ವಿಷಯ: ಗಳಿಕೆ ರಜೆ ಮಂಜೂರು ಮಾಡುವ ಬಗ್ಗೆ.
ಉಲ್ಲೇಖ: ಶ್ರೀ ರಮೇಶ್ ಎನ್., ಸಹಾಯಕ ಶಿಕ್ಷಕರು, ಇವರ ಮನವಿ ಪತ್ರ.

ಮಾನ್ಯರೇ,
ಮೇಲ್ಕಂಡ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ನಮ್ಮ ಶಾಲೆಯ ಸಹಾಯಕ ಶಿಕ್ಷಕರಾದ ಶ್ರೀ ರಮೇಶ್ ಎನ್. (KGID: 1122334) ರವರು ದಿನಾಂಕ 15-03-2026 ರಿಂದ 24-03-2026 ರವರೆಗೆ 10 ದಿನಗಳ ಗಳಿಕೆ ರಜೆ ಕೋರಿ ಮನವಿ ಸಲ್ಲಿಸಿರುತ್ತಾರೆ. ಸದರಿ ನೌಕರರ ರಜೆ ಲೆಕ್ಕದಲ್ಲಿ ಶಿಲ್ಕು ಇದ್ದು, ಸೂಕ್ತ ಆದೇಶ ಹೊರಡಿಸಲು ಕೋರಲಾಗಿದೆ.

ತಮ್ಮ ವಿಶ್ವಾಸಿ,
ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು, ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ`,
          confidence: 'High',
          missingCriticalFields: [],
          safetyWarning: '',
        };
      } else if (sampleScenario === 'increment_proposal') {
        extractedData = {
          letterNumber: 'BEO/BHD/TIME/2026/108',
          date: '2026-02-18',
          employeeName: 'ಶ್ರೀಮತಿ ಮಂಜುಳಾ ಕೆ. ಎಸ್.',
          kgidNumber: '2233445',
          designation: 'ಮುಖ್ಯ ಶಿಕ್ಷಕರು',
          officeName: 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ಅಂತರಗಂಗೆ',
          department: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ',
          subject: '10 ವರ್ಷಗಳ ತೃಪ್ತಿಕರ ಸೇವೆ ಪೂರೈಸಿದ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರು ಮಾಡುವ ಬಗ್ಗೆ.',
          reference: '1. ನೌಕರರ ಸೇವಾ ಪುಸ್ತಕ ದಾಖಲೆಗಳು.\n2. ಸರ್ಕಾರಿ ಆದೇಶ ಸಂಖ್ಯೆ: ಸಿಆಸುಇ 22 ಸೇಸೇನಿ 2012.',
          serviceDetails: 'ಪ್ರಥಮ ನೇಮಕಾತಿ ದಿನಾಂಕ: 2015-08-10, 10 ವರ್ಷ ಪೂರ್ಣಗೊಂಡ ದಿನಾಂಕ: 2025-08-10',
          leaveDetails: 'ಯಾವುದೇ ಅಸಾಧಾರಣ ರಜೆ ಅಥವಾ ದಂಡನೆ ಇರುವುದಿಲ್ಲ.',
          salaryDetails: 'ಹಾಲಿ ಮೂಲ ವೇತನ: ₹47,650/-, ಪರಿಷ್ಕೃತ ಬಡ್ತಿ ಮೂಲ ವೇತನ: ₹49,200/-',
          otherInfo: 'ನೌಕರರ ಸೇವಾ ದಾಖಲೆಗಳು ಸಂಪೂರ್ಣ ತೃಪ್ತಿಕರವಾಗಿರುತ್ತವೆ.',
          rawText: `ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ಅಂತರಗಂಗೆ
ದಿನಾಂಕ: 18-02-2026
ಸಂಖ್ಯೆ: BEO/BHD/TIME/2026/108

ವಿಷಯ: 10 ವರ್ಷಗಳ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರು ಮಾಡುವ ಕುರಿತು ಪ್ರಸ್ತಾವನೆ.
ಉಲ್ಲೇಖ: ಸರ್ಕಾರಿ ಆದೇಶ ಸಂಖ್ಯೆ: ಸಿಆಸುಇ 22 ಸೇಸೇನಿ 2012.

ಮಾನ್ಯರೇ,
ಈ ಶಾಲೆಯ ಮುಖ್ಯ ಶಿಕ್ಷಕರಾದ ಶ್ರೀಮತಿ ಮಂಜುಳಾ ಕೆ. ಎಸ್. (ಕೆಜಿಐಡಿ: 2233445) ರವರು ದಿನಾಂಕ 10-08-2025 ಕ್ಕೆ 10 ವರ್ಷಗಳ ಸತತ ತೃಪ್ತಿಕರ ಸೇವೆ ಪೂರೈಸಿರುವುದರಿಂದ ನಿಯಮಾನುಸಾರ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರು ಮಾಡಲು ಪ್ರಸ್ತಾವನೆಯನ್ನು ಸಲ್ಲಿಸಲಾಗಿದೆ.`,
          confidence: 'High',
          missingCriticalFields: [],
          safetyWarning: '',
        };
      } else if (sampleScenario === 'service_certificate') {
        extractedData = {
          letterNumber: 'BEO/BHD/SRV/2026/55',
          date: '2026-03-01',
          employeeName: 'ಶ್ರೀ ಆನಂದ್ ಕುಮಾರ್ ಬಿ.',
          kgidNumber: '3344556',
          designation: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA)',
          officeName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ',
          department: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ',
          subject: 'ಸೇವಾ ದೃಢೀಕರಣ ಪ್ರಮಾಣ ಪತ್ರ ಹಾಗೂ ಎನ್.ಒ.ಸಿ. ನೀಡುವ ಬಗ್ಗೆ.',
          reference: 'ನೌಕರರ ಸ್ವಂತ ಮನವಿ ದಿನಾಂಕ: 28-02-2026.',
          serviceDetails: 'ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ: 2018-01-20 (7 ವರ್ಷಗಳ ನಿರಂತರ ಸೇವೆ)',
          leaveDetails: 'ಖಾಯಂ ಸೇವೆ ದೃಢಪಟ್ಟಿದೆ',
          salaryDetails: 'ಮೂಲ ವೇತನ: ₹36,950/-, ವೇತನ ಶ್ರೇಣಿ: 30350-58250',
          otherInfo: 'ಪಾಸ್‌ಪೋರ್ಟ್ ಅರ್ಜಿಗಾಗಿ ಸೇವಾ ಪ್ರಮಾಣ ಪತ್ರ ಮತ್ತು ನಿರಾಕ್ಷೇಪಣಾ ಪತ್ರದ ಕೋರಿಕೆ.',
          rawText: `ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
ದಿನಾಂಕ: 01-03-2026

ವಿಷಯ: ಸೇವಾ ದೃಢೀಕರಣ ಪತ್ರ ಕೋರಿ ಮನವಿ.
ಉಲ್ಲೇಖ: ಶ್ರೀ ಆನಂದ್ ಕುಮಾರ್ ಬಿ., ಎಫ್‌ಡಿಎ ರವರ ಮನವಿ.

ಮನವಿ ಸಲ್ಲಿಸಿದ ವಿವರ: ಶ್ರೀ ಆನಂದ್ ಕುಮಾರ್ ಬಿ., ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು, ಇವರು ಪಾಸ್‌ಪೋರ್ಟ್ ಪಡೆಯಲು ಕಛೇರಿಯಿಂದ ಸೇವಾ ಪ್ರಮಾಣ ಪತ್ರ ಮತ್ತು ನಿರಾಕ್ಷೇಪಣಾ ಪ್ರಮಾಣ ಪತ್ರ (NOC) ನೀಡಲು ಕೋರಿರುತ್ತಾರೆ.`,
          confidence: 'High',
          missingCriticalFields: [],
          safetyWarning: '',
        };
      }
    }

    // Cross-verify with Employee Database if KGID or Name matched
    if (extractedData.kgidNumber) {
      const dbEmp = db.getEmployeeByKgid(extractedData.kgidNumber);
      if (dbEmp) {
        if (!extractedData.employeeName) extractedData.employeeName = dbEmp.fullName;
        if (!extractedData.designation) extractedData.designation = dbEmp.designation;
        if (!extractedData.officeName) extractedData.officeName = dbEmp.officeLocation;
        if (!extractedData.salaryDetails && dbEmp.currentBasicPay) {
          extractedData.salaryDetails = `ಹಾಲಿ ಮೂಲ ವೇತನ: ₹${dbEmp.currentBasicPay.toLocaleString('en-IN')}/-, ಶ್ರೇಣಿ: ${dbEmp.payScale}`;
        }
      }
    }

    // Check for missing critical fields and generate warnings
    const missing: string[] = [];
    if (!extractedData.employeeName || extractedData.employeeName.trim() === '') {
      missing.push('ನೌಕರರ ಹೆಸರು (Employee Name)');
    }
    if (!extractedData.kgidNumber || extractedData.kgidNumber.trim() === '') {
      missing.push('ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ (KGID Number)');
    }
    if (!extractedData.subject || extractedData.subject.trim() === '') {
      missing.push('ವಿಷಯ (Subject)');
    }
    if (!extractedData.date || extractedData.date.trim() === '') {
      missing.push('ದಿನಾಂಕ (Date)');
    }

    extractedData.missingCriticalFields = missing;

    if (missing.length > 0) {
      extractedData.safetyWarning = `ಎಚ್ಚರಿಕೆ: ಕೆಳಗಿನ ಪ್ರಮುಖ ಮಾಹಿತಿಗಳು ದಾಖಲೆಯಲ್ಲಿ ಪತ್ತೆಯಾಗಿಲ್ಲ ಅಥವಾ ಅಪೂರ್ಣವಾಗಿವೆ: ${missing.join(', ')}. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ನೇರವಾಗಿ ಭರ್ತಿ ಮಾಡಿ. ಪತ್ರ ತಯಾರಿಕೆಯಲ್ಲಿ ಇವುಗಳಿಗೆ [ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ] ಎಂದು ನಮೂದಿಸಲಾಗುತ್ತದೆ.`;
    }

    res.json({
      success: true,
      extractedData,
      fileName: fileName || 'Uploaded_Document.pdf',
    });
  } catch (err: any) {
    console.error('OCR Extraction Error:', err);
    res.status(500).json({ error: err.message || 'ದಾಖಲೆ ಓದುವಿಕೆಯಲ್ಲಿ ತಾಂತ್ರಿಕ ದೋಷ ಕಂಡುಬಂದಿದೆ.' });
  }
});

// B. AI-Powered Karnataka Government Letter Generation
app.post('/api/letter-maker/generate-letter', async (req, res) => {
  try {
    const user = getReqUser(req);
    const {
      letterType,
      ocrExtracted,
      userPrompt,
      originalFile,
      formatting,
      customLetterNumber,
      customDate,
      confirmSafetyVerified,
    } = req.body || {};

    const typeStr = letterType || 'ಸಾಮಾನ್ಯ ಪತ್ರ';
    const ocr = ocrExtracted || {};
    const promptInstructions = userPrompt || '';

    // Safety checks: Employee Information Guard
    const missingItems: string[] = [];
    if (!ocr.employeeName || ocr.employeeName.trim() === '') missingItems.push('ನೌಕರರ ಹೆಸರು');
    if (!ocr.kgidNumber || ocr.kgidNumber.trim() === '') missingItems.push('ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ');

    const hasMissingCritical = missingItems.length > 0;
    const safetyNote = hasMissingCritical
      ? `ಸೂಚನೆ: ${missingItems.join(', ')} ಪತ್ತೆಯಾಗಿಲ್ಲ. ಸುರಕ್ಷತೆಯ ದೃಷ್ಟಿಯಿಂದ ಕರಡಿನಲ್ಲಿ '[ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ]' ಎಂದು ನಮೂದಿಸಲಾಗಿದೆ.`
      : '';

    const todayDate = customDate || new Date().toISOString().split('T')[0];
    const academicYear = '2026-27';
    let subCode = 'ಸಾ.ಪ';
    if (/ಗಳಿಕೆ|ರಜೆ/i.test(typeStr)) subCode = 'ಗ.ರ.ಆ.ಮಂ';
    else if (/ಕಾಲಮಿತಿ|10.*ವರ್ಷ/i.test(typeStr)) subCode = '10.ವ.ಕಾ.ಮಿ';
    else if (/ವಾರ್ಷಿಕ|ವೇತನ.*ಬಡ್ತಿ/i.test(typeStr)) subCode = 'ವಾ.ವೇ.ಬ';
    else if (/ಆದೇಶ|office.*order/i.test(typeStr)) subCode = 'ಕ.ಆ';
    else if (/ಮಾಹಿತಿ.*ಹಕ್ಕು|rti/i.test(typeStr)) subCode = 'ಮಾ.ಹ.ಪ';
    const letterNo = customLetterNumber || `ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/${subCode}/${Math.floor(10 + Math.random() * 90)}-01/${academicYear}`;

    const ddoEmployee = employees.find(e => (e as any).isDdo === true);
    const officeCfg = db.getOfficeConfig();
    const ddoSignatoryName = ddoEmployee?.fullName || officeCfg?.ddoOfficerName || officeCfg?.officerName || 'ಹೆಚ್. ರವಿಕುಮಾರ್';
    const ddoSignatoryDesignation = ddoEmployee?.designation || officeCfg?.ddoDesignation || officeCfg?.officerDesignation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಡಿಡಿಓ';
    const ddoSignatoryOffice = ddoEmployee?.placeOfWork || ddoEmployee?.officeLocation || officeCfg?.ddoOfficeName || officeCfg?.officeName || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು';

    const gemini = getGeminiClient();

    let generatedLetterData: any = null;

    if (gemini) {
      const systemPrompt = `You are the Official Karnataka State Government Administrative Drafter (ಕರ್ನಾಟಕ ಸರ್ಕಾರ ಅಧಿಕೃತ ಕಡತ/ಪತ್ರ ಲೇಖಕ).
You specialize in Education Department and general Secretariat/Directorate communications.

Generate a comprehensive, formally styled Karnataka Government Office Letter in KANNADA for the requested type:
LETTER TYPE: "${typeStr}"

DATA EXTRACTED FROM DOCUMENT (OCR):
- Letter Number: ${ocr.letterNumber || letterNo}
- Date: ${ocr.date || todayDate}
- Employee Name: ${ocr.employeeName || '[ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ]'}
- KGID Number: ${ocr.kgidNumber || '[ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ]'}
- Designation: ${ocr.designation || '[ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ]'}
- Office/School: ${ocr.officeName || 'ಸರ್ಕಾರಿ ಕಛೇರಿ / ಶಾಲೆ'}
- Department: ${ocr.department || 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ'}
- Subject: ${ocr.subject || ''}
- Reference: ${ocr.reference || ''}
- Service Details: ${ocr.serviceDetails || ''}
- Leave Details: ${ocr.leaveDetails || ''}
- Salary Details: ${ocr.salaryDetails || ''}
- Other Notes: ${ocr.otherInfo || ''}
- Raw OCR Text Snippet: ${ocr.rawText ? ocr.rawText.substring(0, 500) : ''}

USER INSTRUCTIONS / PROMPT:
${promptInstructions || 'ಕಛೇರಿಯ ಅಧಿಕೃತ ನಮೂನೆಯಲ್ಲಿ ನಿಯಮಾನುಸಾರ ಸುಂದರ ಕನ್ನಡ ಪತ್ರವನ್ನು ಸಿದ್ಧಪಡಿಸಿ.'}

STRICT GOVERNMENT LETTER GUIDELINES:
1. OFFICIAL KANNADA TERMINOLOGY: Use authentic Karnataka Government terminology (e.g. "ವಿಷಯ", "ಉಲ್ಲೇಖ", "ಪ್ರಸ್ತಾವನೆ", "ಆದೇಶ", "ಪೀಠಿಕೆ", "ಷರಾ", "ಪ್ರತಿಯನ್ನು ರವಾನಿಸಲಾಗಿದೆ", "ಕರ್ನಾಟಕ ನಾಗರೀಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳು (KCSRs)", "ಕರ್ನಾಟಕ ಆರ್ಥಿಕ ಸಂಹಿತೆ (KFC)").
2. SAFETY RULE: NEVER invent KGID or salary numbers. If any value is unknown, use "[ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ]".
3. LETTER STRUCTURE:
   - Header: Karnataka Government emblem / Office Title
   - Number & Date
   - Recipient (ಇವರಿಗೆ / To) or Subject/Ref header
   - Preamble (ಪ್ರಸ್ತಾವನೆ) if order/memorandum
   - Order/Memorandum body (ಆದೇಶ / ವಿಷಯ ವಿವರಣೆ)
   - Conditions / Terms (ಷರತ್ತುಗಳು: 1, 2, 3...)
   - Signatory block with designation & office
   - Endorsements (ಪ್ರತಿಯನ್ನು ಗೌರವಪೂರ್ವಕವಾಗಿ / ಮಾಹಿತಿಗಾಗಿ / ಮುಂದಿನ ಸೂಕ್ತ ಕ್ರಮಕ್ಕಾಗಿ...)
4. OUTPUT FORMAT:
   Return strict JSON with fields:
   {
     "letterNumber": "...",
     "date": "...",
     "letterType": "${typeStr}",
     "subject": "...",
     "reference": "...",
     "preamble": "...",
     "recipient": "...",
     "sender": "...",
     "bodyHtml": "... (Clean semantic HTML with <p>, <ul>, <li>, <table> where needed, styled with Tailwind classes like text-gray-900 leading-relaxed)",
     "bodyText": "... (Clean plain text format)",
     "endorsements": ["ಪ್ರತಿಯನ್ನು 1...", "ಪ್ರತಿಯನ್ನು 2..."],
     "signatory": {
       "name": "${ddoSignatoryName}",
       "designation": "${ddoSignatoryDesignation}",
       "office": "${ddoSignatoryOffice}"
     },
     "hasMissingInfo": ${hasMissingCritical},
     "missingItems": ${JSON.stringify(missingItems)}
   };`;

      try {
        const aiResult = await callGeminiWithFallback(gemini, async (client, model) => {
          return client.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          });
        });

        if (aiResult?.result?.text) {
          const raw = aiResult.result.text;
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedLetterData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (genErr: any) {
        console.warn('AI Letter generation failed, falling back to rule-based template engine:', genErr?.message);
      }
    }

    // Fallback template engine if AI fails or key is missing
    if (!generatedLetterData) {
      const empName = ocr.employeeName || '[ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ]';
      const kgid = ocr.kgidNumber || '[ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ]';
      const desig = ocr.designation || 'ಸಹಾಯಕ ಶಿಕ್ಷಕರು';
      const office = ocr.officeName || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ';
      const subj = ocr.subject || `${empName}, ${desig} ರವರಿಗೆ ಸಂಬಂಧಿಸಿದ ಅಧಿಕೃತ ಕಛೇರಿ ಪತ್ರ.`;
      const ref = ocr.reference || `1. ನೌಕರರ ಮನವಿ ಪತ್ರ ದಿನಾಂಕ: ${ocr.date || todayDate}.\n2. ಕಛೇರಿ ಕಡತ ಸಂಖ್ಯೆ: ${letterNo}.`;

      let bodyHtml = '';
      let bodyText = '';
      let preamble = '';

      if (typeStr.includes('ರಜೆ') || typeStr.includes('ಗಳಿಕೆ')) {
        preamble = `ಉಲ್ಲೇಖ (1) ರ ಪತ್ರದಲ್ಲಿ ಶ್ರೀ/ಶ್ರೀಮತಿ ${empName}, ${desig}, ${office} (ಕೆಜಿಐಡಿ: ${kgid}) ರವರು ದಿನಾಂಕ ${ocr.leaveDetails || 'ಸೂಚಿಸಿದ ಅವಧಿಗೆ'} ಗಳಿಕೆ ರಜೆಯನ್ನು ಮಂಜೂರು ಮಾಡುವಂತೆ ಕೋರಿರುತ್ತಾರೆ. ಅವರ ರಜೆ ಲೆಕ್ಕ ಪರಿಶೀಲಿಸಲಾಗಿ ರಜೆ ಶಿಲ್ಕು ಇರುವುದು ದೃಢಪಟ್ಟಿರುತ್ತದೆ.`;
        bodyHtml = `
          <p class="font-bold text-gray-900 mb-2">ಪ್ರಸ್ತಾವನೆ:</p>
          <p class="text-gray-800 leading-relaxed mb-4 indent-8">${preamble}</p>
          <p class="font-bold text-gray-900 mb-2">ಆದೇಶ:</p>
          <p class="text-gray-800 leading-relaxed mb-4 indent-8">
            ಪ್ರಸ್ತಾವನೆಯಲ್ಲಿ ವಿವರಿಸಿರುವ ಅಂಶಗಳ ಹಿನ್ನೆಲೆಯಲ್ಲಿ, ಕರ್ನಾಟಕ ನಾಗರೀಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳು 1958 ರ ನಿಯಮ 112 ರ ಅನ್ವಯ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${empName}</strong>, ${desig}, ಇವರಿಗೆ ${ocr.leaveDetails || 'ಕೋರಿದಂತೆ 10 ದಿನಗಳ'} ಗಳಿಕೆ ರಜೆಯನ್ನು ಷರತ್ತುಗಳೊಂದಿಗೆ ಮಂಜೂರು ಮಾಡಿ ಆದೇಶಿಸಿದೆ.
          </p>
          <p class="font-semibold text-gray-900 mb-1">ಷರತ್ತುಗಳು:</p>
          <ol class="list-decimal pl-6 space-y-1 text-gray-800 mb-4">
            <li>ರಜೆ ಅವಧಿ ಮುಕ್ತಾಯಗೊಂಡ ನಂತರ ನೌಕರರು ಕರ್ತವ್ಯಕ್ಕೆ ಹಾಜರಾದ ಬಗ್ಗೆ ವರದಿ ಸಲ್ಲಿಸತಕ್ಕದ್ದು.</li>
            <li>ಸದರಿ ರಜಾ ಅವಧಿಯನ್ನು ನೌಕರರ ಸೇವಾ ಪುಸ್ತಕದ ರಜೆ ಲೆಕ್ಕದಲ್ಲಿ ನಮೂದಿಸತಕ್ಕದ್ದು.</li>
          </ol>
        `;
        bodyText = `ಪ್ರಸ್ತಾವನೆ:\n${preamble}\n\nಆದೇಶ:\nಕರ್ನಾಟಕ ನಾಗರೀಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಶ್ರೀ/ಶ್ರೀಮತಿ ${empName}, ${desig}, ಇವರಿಗೆ ಗಳಿಕೆ ರಜೆಯನ್ನು ಮಂಜೂರು ಮಾಡಿ ಆದೇಶಿಸಿದೆ.`;
      } else if (typeStr.includes('ಬಡ್ತಿ') || typeStr.includes('ಕಾಲಮಿತಿ')) {
        preamble = `ಶ್ರೀ/ಶ್ರೀಮತಿ ${empName}, ${desig}, ಇವರು ಸತತ 10 ವರ್ಷಗಳ ತೃಪ್ತಿಕರ ಸೇವೆ ಸಲ್ಲಿಸಿದ್ದು, ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿಗೆ ಅರ್ಹರಾಗಿರುತ್ತಾರೆ.`;
        bodyHtml = `
          <p class="font-bold text-gray-900 mb-2">ಪ್ರಸ್ತಾವನೆ:</p>
          <p class="text-gray-800 leading-relaxed mb-4 indent-8">${preamble}</p>
          <p class="font-bold text-gray-900 mb-2">ಜ್ಞಾಪನಾ ಆದೇಶ:</p>
          <p class="text-gray-800 leading-relaxed mb-4 indent-8">
            ಸರ್ಕಾರಿ ಆದೇಶ ಸಂಖ್ಯೆ: ಸಿಆಸುಇ 22 ಸೇಸೇನಿ 2012 ರ ಪ್ರಕಾರ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${empName}</strong> (ಕೆಜಿಐಡಿ: ${kgid}) ರವರಿಗೆ 10 ವರ್ಷಗಳ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿಯನ್ನು ಮಂಜೂರು ಮಾಡಿ ವೇತನವನ್ನು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.
          </p>
        `;
        bodyText = `ಪ್ರಸ್ತಾವನೆ:\n${preamble}\n\nಜ್ಞಾಪನಾ ಆದೇಶ:\nಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರು ಮಾಡಲಾಗಿದೆ.`;
      } else {
        bodyHtml = `
          <p class="text-gray-800 leading-relaxed mb-4 indent-8">
            ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${empName}</strong>, ${desig}, ${office} (ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ: ${kgid}) ಇವರಿಗೆ ತಿಳಿಯಪಡಿಸುವುದೇನೆಂದರೆ, ${promptInstructions || 'ಸಂಬಂಧಪಟ್ಟ ಅಗತ್ಯ ದಾಖಲಾತಿಗಳನ್ನು ತಕ್ಷಣವೇ ಕಛೇರಿಗೆ ಸಲ್ಲಿಸತಕ್ಕದ್ದು.'}
          </p>
          <p class="text-gray-800 leading-relaxed mb-4 indent-8">
            ಈ ವಿಷಯವನ್ನು ಅತ್ಯಂತ ಜರೂರು ಎಂದು ಪರಿಗಣಿಸಿ ಮುಂದಿನ ಅವಶ್ಯಕ ಕ್ರಮ ಕೈಗೊಳ್ಳಲು ಸೂಚಿಸಿದೆ.
          </p>
        `;
        bodyText = `ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ${promptInstructions || 'ಅಗತ್ಯ ದಾಖಲಾತಿಗಳನ್ನು ಸಲ್ಲಿಸಲು ಸೂಚಿಸಿದೆ.'}`;
      }

      generatedLetterData = {
        letterNumber: letterNo,
        date: todayDate,
        letterType: typeStr,
        subject: subj,
        reference: ref,
        preamble,
        recipient: `${empName}, ${desig},\n${office}.`,
        sender: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು,\nಭದ್ರಾವತಿ.',
        bodyHtml,
        bodyText,
        endorsements: [
          `ಶ್ರೀ/ಶ್ರೀಮತಿ ${empName}, ${desig}, ಇವರಿಗೆ ಮಾಹಿತಿಗಾಗಿ ಮತ್ತು ಸೂಕ್ತ ಕ್ರಮಕ್ಕಾಗಿ.`,
          'ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು, ಸಂಬಂಧಪಟ್ಟ ಶಾಲೆಗೆ ಮಾಹಿತಿಗಾಗಿ.',
          'ಕಛೇರಿ ಕಡತಕ್ಕೆ.',
        ],
        signatory: {
          name: ddoSignatoryName,
          designation: ddoSignatoryDesignation,
          office: ddoSignatoryOffice,
        },
        hasMissingInfo: hasMissingCritical,
        missingItems,
      };
    }

    // Save as draft or prepare letter model
    const letterToReturn = {
      ...generatedLetterData,
      employeeName: ocr.employeeName || generatedLetterData.employeeName || '',
      kgidNumber: ocr.kgidNumber || generatedLetterData.kgidNumber || '',
      designation: ocr.designation || generatedLetterData.designation || '',
      officeName: ocr.officeName || generatedLetterData.officeName || '',
      department: ocr.department || 'ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ',
      originalFile: originalFile || null,
      ocrRawText: ocr.rawText || '',
      ocrExtracted: ocr,
      userPrompt: promptInstructions,
      formatting: formatting || {
        fontFamily: 'font-sans',
        fontSize: '12pt',
        lineSpacing: '1.5',
        margins: 'standard',
        hasHeader: true,
        hasFooter: true,
      },
      safetyNote,
    };

    res.json({
      success: true,
      letter: letterToReturn,
      message: 'ಪತ್ರ ಕರಡು ಯಶಸ್ವಿಯಾಗಿ ಸೃಜಿಸಲಾಗಿದೆ.',
    });
  } catch (err: any) {
    console.error('Letter Generation Error:', err);
    res.status(500).json({ error: err.message || 'ಪತ್ರ ಸೃಜಿಸುವಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.' });
  }
});

// ==================== 15B. DEDICATED GENERAL LETTER MODULE (ಸಾಮಾನ್ಯ ಪತ್ರ ತಯಾರಿಸಿ) ====================
// Strictly for:
// 1. ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ (Employee General Letter)
// 2. ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರ (Other General Letter)
// CRITICAL RULE: NO salary, earned leave, child care leave, or time-bound promotion calculations!
app.post('/api/general-letter/generate', async (req, res) => {
  try {
    const user = getReqUser(req);
    const {
      category = 'employee', // 'employee' | 'other'
      employeeName = '',
      kgidNumber = '',
      designation = '',
      officeName = '',
      recipient = '',
      subject = '',
      reference = '',
      details = '',
      mainContent = '',
      otherInstructions = '',
      date = '',
      additionalPrompt = '',
      ocrData = null,
      customLetterNumber = '',
    } = req.body || {};

    const isEmployeeType = category === 'employee';
    const letterType = isEmployeeType ? 'ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ' : 'ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರ';
    const todayDate = date || new Date().toISOString().split('T')[0];
    const academicYear = '2026-27';
    const fileNum = (req.body?.fileNumber ? String(req.body.fileNumber).trim() : '') || '57';
    
    // Strict Karnataka Education Department Letter Format: ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಇತರೆ/57/2026-27
    const formatSingleSamNumber = (str?: string) => {
      if (!str) return 'ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಇತರೆ/57/2026-27';
      const clean = str.replace(/^(ಸಂ\s*:\s*)+/gi, '').trim();
      return `ಸಂ: ${clean}`;
    };

    const rawNumber = customLetterNumber 
      ? (customLetterNumber.includes('ಆ2/') || customLetterNumber.includes('ಸಂ:') ? customLetterNumber : `ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/${isEmployeeType ? 'ಸಾ.ಪ' : 'ಇತರೆ'}/${customLetterNumber}/${academicYear}`)
      : `ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/${isEmployeeType ? 'ಸಾ.ಪ' : 'ಇತರೆ'}/${fileNum}/${academicYear}`;
    const letterNo = formatSingleSamNumber(rawNumber);

    // Format recipient lines cleanly under "ರಿಗೆ:"
    const formatToLines = (text: string) => {
      if (!text) return '';
      if (text.includes('\n')) return text;
      return text.split(',').map(s => s.trim()).filter(Boolean).join('\n');
    };

    const recipientText = isEmployeeType
      ? `ರಿಗೆ:\nಶ್ರೀ/ಶ್ರೀಮತಿ ${employeeName || '[ನೌಕರರ ಹೆಸರು]'},\n${designation || '[ಹುದ್ದೆ]'},\n${officeName || 'ಸರ್ಕಾರಿ ಕಛೇರಿ / ಶಾಲೆ'}${kgidNumber ? `\n(ಕೆಜಿಐಡಿ: ${kgidNumber})` : ''}`
      : `ರಿಗೆ:\n${formatToLines(recipient) || 'ಸಂಬಂಧಪಟ್ಟ ಅಧಿಕಾರಿಗಳು / ಮುಖ್ಯಸ್ಥರು'}`;

    const rawContent = isEmployeeType ? details : mainContent;
    const extraNotes = isEmployeeType ? '' : otherInstructions;

    const gemini = getGeminiClient();
    let generatedData: any = null;

    if (gemini) {
      const prompt = `You are an expert Kannada administrative letter drafter for the Karnataka State Government (ಕರ್ನಾಟಕ ಸರ್ಕಾರ), specifically the School Education and Literacy Department (ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ).

TASK:
Draft an authentic, formal Karnataka Government General Office Letter (ಸಾಮಾನ್ಯ ಕಚೇರಿ ಪತ್ರ) in elegant and formal administrative KANNADA.

LETTER CATEGORY: ${letterType}
DATE: ${todayDate}
LETTER NUMBER: ${letterNo}

${isEmployeeType ? `
EMPLOYEE DETAILS:
- Employee Name: ${employeeName || 'ಶ್ರೀ/ಶ್ರೀಮತಿ...'}
- KGID Number: ${kgidNumber || ''}
- Designation: ${designation || ''}
- Office / School: ${officeName || ''}
- Subject: ${subject || ''}
- Reference: ${reference || ''}
- Letter Details / Matter: ${details || ''}
` : `
OTHER GENERAL LETTER DETAILS:
- To / Recipient: ${recipient || ''}
- Subject: ${subject || ''}
- Reference: ${reference || ''}
- Main Matter / Content: ${mainContent || ''}
- Other Instructions: ${otherInstructions || ''}
`}

USER PROMPT / ADDITIONAL INSTRUCTIONS:
${additionalPrompt || 'ಕಛೇರಿಯ ಅಧಿಕೃತ ಶೈಲಿಯಲ್ಲಿ ನಿಯಮಾನುಸಾರ ಸ್ಪಷ್ಟ ಮತ್ತು ಅಧಿಕೃತ ಸಾಮಾನ್ಯ ಪತ್ರ ಸಿದ್ಧಪಡಿಸಿ.'}

CRITICAL RULES:
1. NO CALCULATIONS: Strictly DO NOT perform any salary increment calculations, earned leave calculations, child care leave calculations, or time-bound promotion calculations. This is strictly a GENERAL OFFICIAL CORRESPONDENCE LETTER.
2. HEADER COMPLIANCE:
   The official header is:
   ಕರ್ನಾಟಕ ಸರ್ಕಾರ
   ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
   ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
   ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301
   Do NOT include any English text. Do NOT include any officer name like "ರವೀಂದ್ರನಾಥ್". Do NOT duplicate the office name.
3. SIGNATORY:
   The signatory is strictly:
   (ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು)
   ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
4. KANNADA TERMINOLOGY:
   Use standard official terminology: "ಮಾನ್ಯರೇ,", "ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ...", "ತಮ್ಮ ನಂಬುಗೆಯ,".

Return ONLY a strict JSON object with fields:
{
  "letterNumber": "${letterNo}",
  "date": "${todayDate}",
  "letterType": "${letterType}",
  "recipient": "...",
  "subject": "...",
  "reference": "...",
  "bodyHtml": "... (semantic HTML paragraphs with <p class='text-gray-900 leading-relaxed mb-4 indent-8'>)",
  "bodyText": "... (pure text version)",
  "endorsements": ["ಪ್ರತಿಯನ್ನು ಮಾಹಿತಿಗಾಗಿ / ಸೂಕ್ತ ಕ್ರಮಕ್ಕಾಗಿ..."]
}`;

      try {
        const aiResult = await callGeminiWithFallback(gemini, async (client, model) => {
          return client.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
        });

        if (aiResult?.result?.text) {
          const raw = aiResult.result.text;
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini drafting for General Letter failed, using deterministic template:', geminiErr?.message);
      }
    }

    // Fallback deterministic drafting if Gemini is unavailable or failed
    if (!generatedData) {
      const finalSubject = subject || (isEmployeeType 
        ? `${employeeName || 'ನೌಕರರ'}, ${designation || ''} ರವರ ಅಧಿಕೃತ ಕಚೇರಿ ವಿಷಯದ ಕುರಿತು.`
        : 'ಕಚೇರಿ ಆಡಳಿತಾತ್ಮಕ ಮತ್ತು ಶೈಕ್ಷಣಿಕ ವಿಷಯಗಳ ಕುರಿತು.');
      
      const finalReference = reference || '೧. ಈ ಕಚೇರಿಯ ಕಡತ ಹಾಗೂ ದಾಖಲಾತಿಗಳ ಪರಿಶೀಲನೆ.\n೨. ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಇಲಾಖಾ ನಿರ್ದೇಶನಗಳು.';

      let paragraphs: string[] = [];

      if (isEmployeeType) {
        paragraphs.push(`ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${employeeName || 'ನೌಕರರು'}</strong>, ${designation || 'ಹುದ್ದೆ'}, ${officeName || 'ಶಾಲೆ/ಕಚೇರಿ'} (ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ: ${kgidNumber || '-'}) ಇವರಿಗೆ ತಿಳಿಯಪಡಿಸುವುದೇನೆಂದರೆ, ${details || 'ಕಚೇರಿಯ ಅಧಿಕೃತ ಕಡತಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ಅಗತ್ಯ ಮಾಹಿತಿಯನ್ನು ತಕ್ಷಣವೇ ಕಚೇರಿಗೆ ಸಲ್ಲಿಸತಕ್ಕದ್ದು.'}`);
        if (additionalPrompt) {
          paragraphs.push(`ಸೂಚನೆ: ${additionalPrompt}`);
        }
        paragraphs.push(`ಆದ್ದರಿಂದ ಈ ಪತ್ರ ತಲುಪಿದ ತಕ್ಷಣವೇ ಅಗತ್ಯ ದಾಖಲೆ/ವಿವರಣೆಗಳೊಂದಿಗೆ ಈ ಕಚೇರಿಗೆ ನಿಯಮಾನುಸಾರ ವರದಿ ಸಲ್ಲಿಸಲು ಸೂಚಿಸಿದೆ. ತಪ್ಪಿದಲ್ಲಿ ಮುಂದಿನ ಆಡಳಿತಾತ್ಮಕ ಕ್ರಮಗಳಿಗೆ ತಾವೇ ನೇರ ಹೊಣೆಗಾರರಾಗಿರುತ್ತೀರಿ.`);
      } else {
        paragraphs.push(`ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ${recipient || 'ಸಂಬಂಧಪಟ್ಟವರಿಗೆ'} ಈ ಮೂಲಕ ತಿಳಿಯಪಡಿಸುವುದೇನೆಂದರೆ, ${mainContent || 'ಸರ್ಕಾರಿ ನಿಯಮಾನುಸಾರ ಹಾಗೂ ಇಲಾಖಾ ಆದೇಶದಂತೆ ಕೈಗೊಳ್ಳಬೇಕಾದ ಅಗತ್ಯ ಕ್ರಮಗಳನ್ನು ತಕ್ಷಣವೇ ಕೈಗೊಳ್ಳತಕ್ಕದ್ದು.'}`);
        if (extraNotes) {
          paragraphs.push(`ವಿಶೇಷ ಸೂಚನೆಗಳು: ${extraNotes}`);
        }
        if (additionalPrompt) {
          paragraphs.push(`ಹೆಚ್ಚುವರಿ ನಿರ್ದೇಶನ: ${additionalPrompt}`);
        }
        paragraphs.push(`ಈ ವಿಷಯವನ್ನು ಅತ್ಯಂತ ಜರೂರು ಎಂದು ಪರಿಗಣಿಸಿ, ಯಾವುದೇ ವಿಳಂಬವಿಲ್ಲದೆ ನಿಯಮಾನುಸಾರ ಕ್ರಮ ವಹಿಸಿ ಈ ಕಚೇರಿಗೆ ಅನುಸರಣಾ ವರದಿ ಸಲ್ಲಿಸಲು ನಿರ್ದೇಶಿಸಲಾಗಿದೆ.`);
      }

      const bodyHtml = paragraphs.map(p => `<p class="text-gray-800 leading-relaxed mb-4 indent-8">${p}</p>`).join('\n');
      const bodyText = paragraphs.map(p => p.replace(/<[^>]+>/g, '')).join('\n\n');

      generatedData = {
        letterNumber: letterNo,
        date: todayDate,
        letterType: letterType,
        recipient: recipientText,
        subject: finalSubject,
        reference: finalReference,
        bodyHtml,
        bodyText,
        endorsements: [
          'ಪ್ರತಿಯನ್ನು ಸೂಕ್ತ ಮಾಹಿತಿಗಾಗಿ ಹಾಗೂ ಮುಂದಿನ ಅವಶ್ಯಕ ಕ್ರಮಕ್ಕಾಗಿ ರವಾನಿಸಲಾಗಿದೆ.',
          'ಕಚೇರಿ ಕಡತಕ್ಕೆ (Master File Docket).'
        ]
      };
    }

    // Standard Signatory (Dynamically pulled from DDO officer):
    const ddoEmpGen = employees.find(e => (e as any).isDdo === true);
    const officeCfgGen = db.getOfficeConfig();
    const signatory = {
      name: ddoEmpGen?.fullName || officeCfgGen?.ddoOfficerName || officeCfgGen?.officerName || 'ಹೆಚ್. ರವಿಕುಮಾರ್',
      designation: ddoEmpGen?.designation || officeCfgGen?.ddoDesignation || officeCfgGen?.officerDesignation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಡಿಡಿಓ',
      office: ddoEmpGen?.placeOfWork || ddoEmpGen?.officeLocation || officeCfgGen?.ddoOfficeName || officeCfgGen?.officeName || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
    };

    // Construct the complete letter record
    const letterToSave = {
      documentId: `DOC-GEN-${Date.now().toString(36).toUpperCase()}`,
      letterNumber: generatedData.letterNumber || letterNo,
      date: generatedData.date || todayDate,
      letterType: letterType,
      subject: generatedData.subject || subject,
      reference: generatedData.reference || reference,
      recipient: generatedData.recipient || recipientText,
      sender: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ',
      bodyHtml: generatedData.bodyHtml,
      bodyText: generatedData.bodyText,
      endorsements: generatedData.endorsements || [],
      signatory,
      employeeName: isEmployeeType ? employeeName : undefined,
      kgidNumber: isEmployeeType ? kgidNumber : undefined,
      designation: isEmployeeType ? designation : undefined,
      officeName: isEmployeeType ? officeName : undefined,
      department: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ',
      userPrompt: additionalPrompt,
      ocrExtracted: ocrData,
      status: 'Finalized' as const,
      formatting: {
        fontFamily: 'font-sans',
        fontSize: '14px',
        lineSpacing: '1.6',
        margins: 'standard',
        hasHeader: true,
        hasFooter: true,
      },
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          updatedAt: new Date().toISOString(),
          updatedBy: user.displayName,
          letterHtml: generatedData.bodyHtml,
          letterText: generatedData.bodyText,
          notes: 'ಸಾಮಾನ್ಯ ಪತ್ರ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ'
        }
      ]
    };

    // Save letter to DB so user can immediately download Word / track it
    const savedRecord = db.saveGeneratedLetter(letterToSave, user.displayName, user.role);

    res.json({
      success: true,
      letter: savedRecord,
      message: `${letterType} ಯಶಸ್ವಿಯಾಗಿ ಸಿದ್ಧಗೊಂಡಿದೆ.`
    });
  } catch (err: any) {
    console.error('General Letter Generation Error:', err);
    res.status(500).json({ error: err.message || 'ಸಾಮಾನ್ಯ ಪತ್ರ ಸೃಜಿಸುವಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.' });
  }
});

// C. CRUD & Version Management for Letters
app.get('/api/letter-maker/letters', (req, res) => {
  try {
    const letters = db.getGeneratedLetters({
      search: req.query.search as string,
      letterType: req.query.letterType as string,
      status: req.query.status as string,
      kgid: req.query.kgid as string,
    });
    res.json({ letters, total: letters.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/letter-maker/letters/:id', (req, res) => {
  try {
    const letter = db.getGeneratedLetterById(req.params.id);
    if (!letter) {
      return res.status(404).json({ error: 'ಪತ್ರ ಕಂಡುಬಂದಿಲ್ಲ.' });
    }
    res.json({ letter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/letter-maker/letters/save', (req, res) => {
  try {
    const user = getReqUser(req);
    const saved = db.saveGeneratedLetter(req.body, user.displayName, user.role);
    res.json({ success: true, letter: saved, message: 'ಪತ್ರ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/letter-maker/letters/:id/version-restore', (req, res) => {
  try {
    const user = getReqUser(req);
    const { versionNumber } = req.body || {};
    if (!versionNumber) {
      return res.status(400).json({ error: 'ಆವೃತ್ತಿ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ.' });
    }
    const updated = db.restoreLetterVersion(req.params.id, Number(versionNumber), user.displayName);
    res.json({ success: true, letter: updated, message: `ಆವೃತ್ತಿ ${versionNumber} ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/letter-maker/letters/:id', (req, res) => {
  try {
    const user = getReqUser(req);
    const ok = db.deleteGeneratedLetter(req.params.id, user.displayName, user.role);
    if (!ok) {
      return res.status(404).json({ error: 'ಪತ್ರ ಕಂಡುಬಂದಿಲ್ಲ ಅಥವಾ ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ.' });
    }
    res.json({ success: true, message: 'ಪತ್ರವನ್ನು ಅಳಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// D. Download Letter as Microsoft Word (.docx)
app.get('/api/letter-maker/letters/:id/download-docx', async (req, res) => {
  try {
    const letter = db.getGeneratedLetterById(req.params.id);
    if (!letter) {
      return res.status(404).json({ error: 'ಪತ್ರ ಕಂಡುಬಂದಿಲ್ಲ.' });
    }

    const docxBuffer = await generateOfficeLetterDocx(letter);
    const safeFilename = `Karnataka_Gov_Letter_${(letter.letterNumber || 'Letter').replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Length', docxBuffer.length);
    res.send(docxBuffer);
  } catch (err: any) {
    console.error('DOCX Export Error:', err);
    res.status(500).json({ error: 'Word ಕಡತ ತಯಾರಿಕೆಯಲ್ಲಿ ದೋಷ ಉಂಟಾಗಿದೆ: ' + err.message });
  }
});

// E. Templates Management
app.get('/api/letter-maker/templates', (req, res) => {
  try {
    const templates = db.getLetterTemplates();
    res.json({ templates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/letter-maker/templates', (req, res) => {
  try {
    const user = getReqUser(req);
    const created = db.saveLetterTemplate(req.body, user.displayName);
    res.json({ success: true, template: created, message: 'ಹೊಸ ಟೆಂಪ್ಲೇಟ್ ಉಳಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/letter-maker/templates/:id', (req, res) => {
  try {
    const user = getReqUser(req);
    const updated = db.saveLetterTemplate({ ...req.body, id: req.params.id }, user.displayName);
    res.json({ success: true, template: updated, message: 'ಟೆಂಪ್ಲೇಟ್ ನವೀಕರಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// F. Dashboard Stats for Letter Maker
app.get('/api/letter-maker/stats', (req, res) => {
  try {
    const stats = db.getLetterDashboardStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SCHOOLS & INSTITUTION DETAILS (ಅನುದಾನಕ್ಕೆ ಶಾಲೆಗಳ ಪಟ್ಟಿ ಹಾಗೂ ಸಂಸ್ಥೆಗಳ ವಿವರ) ====================

// 1. Get schools with optional filtering
app.get('/api/schools', (req, res) => {
  try {
    const search = req.query.search as string;
    const grantStatus = req.query.grantStatus as string;
    const recognitionStatus = req.query.recognitionStatus as string;
    const cluster = req.query.cluster as string;

    const schools = db.getSchools({ search, grantStatus, recognitionStatus, cluster });
    res.json({ schools, count: schools.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ಶಾಲೆಗಳ ಪಟ್ಟಿ ಪಡೆಯಲು ವಿಫಲವಾಗಿದೆ' });
  }
});

// 2. Get school by ID or UDISE
app.get('/api/schools/:id', (req, res) => {
  try {
    const school = db.getSchoolById(req.params.id);
    if (!school) {
      return res.status(404).json({ error: 'ಶಾಲೆಯ ವಿವರ ಕಂಡುಬಂದಿಲ್ಲ' });
    }
    res.json({ school });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create new school
app.post('/api/schools', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role === 'Viewer') {
      return res.status(403).json({ error: 'ವೀಕ್ಷಕರಿಗೆ ಶಾಲೆಗಳ ವಿವರ ಸೇರಿಸುವ ಅನುಮತಿ ಇಲ್ಲ.' });
    }

    if (!req.body.schoolName) {
      return res.status(400).json({ error: 'ಶಾಲೆಯ ಹೆಸರು (School Name) ಕಡ್ಡಾಯವಾಗಿದೆ.' });
    }

    const created = db.createSchool(req.body, user);
    res.json({ success: true, school: created, message: 'ಶಾಲೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Update school details
app.put('/api/schools/:id', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role === 'Viewer') {
      return res.status(403).json({ error: 'ವೀಕ್ಷಕರಿಗೆ ಶಾಲೆಗಳ ವಿವರ ನವೀಕರಿಸುವ ಅನುಮತಿ ಇಲ್ಲ.' });
    }

    const updated = db.updateSchool(req.params.id, req.body, user);
    res.json({ success: true, school: updated, message: 'ಶಾಲೆಯ ಮಾಹಿತಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Delete school
app.delete('/api/schools/:id', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ಶಾಲೆಗಳ ದಾಖಲೆ ಅಳಿಸಲು ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ (Admin) ಮಾತ್ರ ಅಧಿಕಾರವಿದೆ.' });
    }

    const success = db.deleteSchool(req.params.id, user);
    if (!success) {
      return res.status(404).json({ error: 'ಶಾಲೆಯ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ ಅಥವಾ ಈಗಾಗಲೇ ಅಳಿಸಲಾಗಿದೆ.' });
    }
    res.json({ success: true, message: 'ಶಾಲೆಯ ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Reset schools to official default list
app.post('/api/schools/reset', (req, res) => {
  try {
    const user = getReqUser(req);
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ ಮಾತ್ರ ಡೀಫಾಲ್ಟ್ ಪಟ್ಟಿಗೆ ಮರುಹೊಂದಿಸಲು ಅನುಮತಿ ಇದೆ.' });
    }

    const resetList = db.resetSchools();
    res.json({ success: true, schools: resetList, message: 'ಶಾಲೆಗಳ ಪಟ್ಟಿಯನ್ನು ಅಧಿಕೃತ ಪೂರ್ವನಿಯೋಜಿತ ಪಟ್ಟಿಗೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== VITE MIDDLEWARE SETUP ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Education Department Letters & Files Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
