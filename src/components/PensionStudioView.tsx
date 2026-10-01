import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, 
  FileText, 
  Award, 
  FolderGit2, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  CheckSquare, 
  Square, 
  Tag, 
  ExternalLink, 
  Send, 
  FileCheck2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Bookmark,
  Share2,
  Trash2,
  Edit,
  Eye,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Calculator
} from 'lucide-react';
import { 
  PensionCaseRecord, 
  PensionRetirementType, 
  PensionCaseStatus, 
  PensionLetterFormatType,
  PensionDocumentsChecklist,
  Employee, 
  AdminAuthUser, 
  MasterDocketFile,
  EducationLetter,
  OfficeConfig
} from '../types';
import { 
  computePensionDetails, 
  calculateRetirementDate,
  formatINR, 
  numberToKannadaWords, 
  renderPensionFormatHtml,
  DEFAULT_PENSION_OFFICE_CONFIG,
  KCSR_COMMUTATION_FACTORS
} from '../utils/pensionCalculator';

interface PensionStudioViewProps {
  currentUser?: AdminAuthUser | null;
  employees: Employee[];
  files: MasterDocketFile[];
  onSaveLetterToRegistry?: (letter: Partial<EducationLetter>) => void;
  onAttachToDocketFile?: (fileNumber: string, docName: string) => void;
  onRefreshData?: () => void;
  showToast: (msg: string) => void;
}

// Initial Sample Pension Cases for BEO Bhadravathi - including Sri Giriyappa H.
const INITIAL_PENSION_CASES: PensionCaseRecord[] = [
  {
    id: 'pen-case-giriyappa',
    caseNumber: 'BEO/BHD/PEN/2026/01',
    fileNumber: '56',
    fileId: 'file-pen-56',
    employeeId: 'emp-giriyappa',
    kgidNumber: '1042891',
    employeeName: 'ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಎಚ್. (GIRIYAPPA H)',
    parentOrSpouseName: 'ಹನುಮಂತಪ್ಪ',
    designation: 'ಸಹ ಶಿಕ್ಷಕರು (Assistant Teacher)',
    cadreGroup: 'ಗ್ರೂಪ್-ಸಿ',
    officeOrSchool: 'ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ ಹಳೇನಗರ, ಭದ್ರಾವತಿ (DISE: 29150109701)',
    gender: 'Male',
    dob: '1966-05-12',
    doa: '1993-07-01',
    dor: '2026-05-31',
    retirementAgeYears: 60,
    retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)',
    payScale: '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
    lastBasicPay: 68550,
    daPercentage: 42.5,
    averageEmoluments: 68550,
    earnedLeaveDays: 300,
    halfPayLeaveDays: 38,
    nonQualifyingDays: 0,
    commutationOpted: true,
    commutationPercentage: 40,
    ageNextBirthday: 61,
    nomineeName: 'ಶ್ರೀಮತಿ ಗಿರಿಜಮ್ಮ ಎಚ್. (ಪತ್ನಿ)',
    nomineeRelation: 'ಪತ್ನಿ (Wife)',
    nomineeDob: '1970-08-15',
    bankName: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
    bankBranch: 'ಭದ್ರಾವತಿ ಮುಖ್ಯ ಶಾಖೆ',
    bankAccountNo: '30849201948',
    ifscCode: 'SBIN0000812',
    treasuryName: 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ',
    ppoNumber: 'PPO/EDN/BHD/2026/1083',
    calculation: computePensionDetails({
      doa: '1993-07-01',
      dor: '2026-05-31',
      dob: '1966-05-12',
      retirementAgeYears: 60,
      lastBasicPay: 68550,
      daPercentage: 42.5,
      earnedLeaveDays: 300,
      halfPayLeaveDays: 38,
      commutationOpted: true,
      commutationPercentage: 40,
      ageNextBirthday: 61,
      nonQualifyingDays: 0
    }),
    checklist: {
      serviceBookVerified: true,
      form7Triplicate: true,
      jointPhotosAttested: true,
      specimenSignatures: true,
      noDueCertificate: true,
      lastPayCertificate: true,
      form1And2Nomination: true,
      aadharBankPassbook: true
    },
    status: 'BEO ಅನುಮೋದಿತ (Sanctioned by BEO)',
    movementHistory: [
      {
        id: 'mov-g1',
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಪಿಂಚಣಿ)',
        toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        sentDate: '2026-02-05 10:30',
        remarks: 'ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಎಚ್. ಇವರ ಸೇವಾ ಪುಸ್ತಕ ಹಾಗೂ ರಜೆ ಲೆಕ್ಕ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರ ಪಟ್ಟಿ ಸಿದ್ಧವಾಗಿದೆ.',
        statusAfterMove: 'ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ (Service Verified)'
      },
      {
        id: 'mov-g2',
        fromOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        toOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO)',
        sentDate: '2026-02-12 14:00',
        remarks: 'ಪಿಂಚಣಿ, ಉಪದಾನ, ಪರಿವರ್ತನೆ ಮತ್ತು ಗಳಿಕೆ ರಜೆ ಮಂಜೂರಾತಿ ಆದೇಶಗಳ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'BEO ಅನುಮೋದಿತ (Sanctioned by BEO)'
      }
    ],
    remarks: 'ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಪ್ರಕರಣ (Giriyappa Case) - ೩೨ ವರ್ಷ ೧೧ ತಿಂಗಳು ಅರ್ಹತಾ ಸೇವೆ. ಪೂರ್ಣ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳಿಗೆ ಅರ್ಹರು.',
    createdAt: '2026-02-01',
    lastUpdated: '2026-02-12'
  },
  {
    id: 'pen-case-01',
    caseNumber: 'BEO/BHD/PEN/2026/02',
    fileNumber: '57',
    fileId: 'file-pen-57',
    employeeId: 'emp-sunandamma',
    kgidNumber: '1182740',
    employeeName: 'ಸುನಂದಮ್ಮ ಬಿ. ಆರ್. (SUNANDAMMA B R)',
    parentOrSpouseName: 'ರಾಮಚಂದ್ರಪ್ಪ ಬಿ.',
    designation: 'ಮುಖ್ಯ ಶಿಕ್ಷಕರು (Headmaster - Grade 1)',
    cadreGroup: 'ಗ್ರೂಪ್-ಬಿ',
    officeOrSchool: 'ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ ಹಳೇನಗರ, ಭದ್ರಾವತಿ (DISE: 29150109701)',
    gender: 'Female',
    dob: '1966-04-15',
    doa: '1993-06-10',
    dor: '2026-04-30',
    retirementAgeYears: 60,
    retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)',
    payScale: '43100-1100-46400-1250-53900-1450-62600-1650-70850-1850-80400',
    lastBasicPay: 76550,
    daPercentage: 42.5,
    averageEmoluments: 76550,
    earnedLeaveDays: 284,
    halfPayLeaveDays: 20,
    nonQualifyingDays: 0,
    commutationOpted: true,
    commutationPercentage: 40,
    ageNextBirthday: 61,
    nomineeName: 'ರಾಮಚಂದ್ರಪ್ಪ ಬಿ. (ಪತಿ)',
    nomineeRelation: 'ಪತಿ (Husband)',
    nomineeDob: '1962-08-20',
    bankName: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
    bankBranch: 'ಭದ್ರಾವತಿ ಮುಖ್ಯ ಶಾಖೆ',
    bankAccountNo: '30492817402',
    ifscCode: 'SBIN0000812',
    treasuryName: 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ',
    ppoNumber: 'PPO/EDN/BHD/2026/1084',
    calculation: computePensionDetails({
      doa: '1993-06-10',
      dor: '2026-04-30',
      dob: '1966-04-15',
      retirementAgeYears: 60,
      lastBasicPay: 76550,
      daPercentage: 42.5,
      earnedLeaveDays: 284,
      halfPayLeaveDays: 20,
      commutationOpted: true,
      commutationPercentage: 40,
      ageNextBirthday: 61,
      nonQualifyingDays: 0
    }),
    checklist: {
      serviceBookVerified: true,
      form7Triplicate: true,
      jointPhotosAttested: true,
      specimenSignatures: true,
      noDueCertificate: true,
      lastPayCertificate: true,
      form1And2Nomination: true,
      aadharBankPassbook: true
    },
    status: 'BEO ಅನುಮೋದಿತ (Sanctioned by BEO)',
    movementHistory: [
      {
        id: 'mov-p1',
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಪಿಂಚಣಿ)',
        toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        sentDate: '2026-02-10 11:30',
        remarks: 'ಮೂಲ ಸೇವಾ ಪುಸ್ತಕ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಪ್ರಪತ್ರ-೭ ತಯಾರಿಸಿ ಮಂಡಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ (Service Verified)'
      },
      {
        id: 'mov-p2',
        fromOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        toOfficer: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (BEO)',
        sentDate: '2026-02-18 15:00',
        remarks: 'ಪಿಂಚಣಿ ಮಂಜೂರಾತಿ ಆದೇಶ ಮತ್ತು ಪರಿವರ್ತನೆ ಮಂಜೂರಾತಿಗಾಗಿ ಅನುಮೋದನೆಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
        statusAfterMove: 'BEO ಅನುಮೋದಿತ (Sanctioned by BEO)'
      }
    ],
    remarks: 'ಅರ್ಹತಾ ಸೇವೆ ೩೨ ವರ್ಷ ೧೦ ತಿಂಗಳು ೨೧ ದಿನಗಳು. ಪೂರ್ಣ ಪಿಂಚಣಿ ಸೌಲಭ್ಯಕ್ಕೆ ಅರ್ಹರಾಗಿರುತ್ತಾರೆ.',
    createdAt: '2026-02-01',
    lastUpdated: '2026-02-18'
  },
  {
    id: 'pen-case-02',
    caseNumber: 'BEO/BHD/PEN/2026/02',
    fileNumber: '72',
    fileId: 'file-pen-72',
    employeeId: 'emp-1515985',
    kgidNumber: '1515985',
    employeeName: 'ಆನಂದ ಎಂ. ಸಿ. (ANANDA M C)',
    parentOrSpouseName: 'ಚನ್ನಬಸಪ್ಪ ಎಂ.',
    designation: 'ಮುಖ್ಯ ಶಿಕ್ಷಕರು (Headmaster)',
    cadreGroup: 'ಗ್ರೂಪ್-ಬಿ',
    officeOrSchool: 'KPS GHPS ANTHARAGANGE (29150109702)',
    gender: 'Male',
    dob: '1966-07-20',
    doa: '1999-11-30',
    dor: '2026-07-31',
    retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)',
    payScale: '43100-1100-46400-1250-53900-1450-62600-1650-70850-1850-80400',
    lastBasicPay: 74200,
    daPercentage: 42.5,
    averageEmoluments: 74200,
    earnedLeaveDays: 300,
    nonQualifyingDays: 0,
    commutationOpted: true,
    commutationPercentage: 40,
    ageNextBirthday: 61,
    nomineeName: 'ರತ್ನಮ್ಮ ಎಂ. ಸಿ. (ಪತ್ನಿ)',
    nomineeRelation: 'ಪತ್ನಿ (Wife)',
    nomineeDob: '1970-03-12',
    bankName: 'ಕೆನರಾ ಬ್ಯಾಂಕ್ (Canara Bank)',
    bankBranch: 'ಹೊಳೆಹೊನ್ನೂರು ಶಾಖೆ',
    bankAccountNo: '11920834019',
    ifscCode: 'CNRB0001192',
    treasuryName: 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ',
    calculation: computePensionDetails({
      doa: '1999-11-30',
      dor: '2026-07-31',
      lastBasicPay: 74200,
      daPercentage: 42.5,
      earnedLeaveDays: 300,
      commutationOpted: true,
      commutationPercentage: 40,
      ageNextBirthday: 61,
      nonQualifyingDays: 0
    }),
    checklist: {
      serviceBookVerified: true,
      form7Triplicate: true,
      jointPhotosAttested: true,
      specimenSignatures: true,
      noDueCertificate: true,
      lastPayCertificate: false,
      form1And2Nomination: true,
      aadharBankPassbook: true
    },
    status: 'ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ (Service Verified)',
    movementHistory: [
      {
        id: 'mov-p3',
        fromOfficer: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಪಿಂಚಣಿ)',
        toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
        sentDate: '2026-03-01 10:45',
        remarks: 'ಸೇವಾ ಪುಸ್ತಕ ಪರಿಶೀಲನೆ ಮುಕ್ತಾಯ. LPC ಹೊರತುಪಡಿಸಿ ಎಲ್ಲಾ ದಾಖಲೆಗಳು ಸಿದ್ಧವಾಗಿವೆ.',
        statusAfterMove: 'ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ (Service Verified)'
      }
    ],
    remarks: 'ಜುಲೈ-೨೦೨೬ ರ ನಿವೃತ್ತಿ ಪ್ರಕರಣ. ಕಡತ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ.',
    createdAt: '2026-02-15',
    lastUpdated: '2026-03-01'
  }
];

export const PensionStudioView: React.FC<PensionStudioViewProps> = ({
  currentUser,
  employees,
  files,
  onSaveLetterToRegistry,
  onAttachToDocketFile,
  showToast
}) => {
  // Navigation tabs within Pension Module: includes dedicated calculations tab
  const [activeSubTab, setActiveSubTab] = useState<'cases' | 'input' | 'calculations' | 'letters' | 'checklist' | 'labels'>('cases');

  // Stored Pension Cases
  const [pensionCases, setPensionCases] = useState<PensionCaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('edu_pension_cases_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load pension cases from localStorage:', e);
    }
    return INITIAL_PENSION_CASES;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('edu_pension_cases_data', JSON.stringify(pensionCases));
    } catch (e) {
      console.error('Failed to save pension cases to localStorage:', e);
    }
  }, [pensionCases]);

  // Active / Selected Case for Viewing & Letter Studio
  const [selectedCase, setSelectedCase] = useState<PensionCaseRecord>(() => pensionCases[0] || INITIAL_PENSION_CASES[0]);

  // Selected Letter Format for Preview & Print
  const [selectedFormat, setSelectedFormat] = useState<PensionLetterFormatType>('pension_calc_sheet');

  // Search & Filter in Cases Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ---------------------------------------------------------------------------
  // NEW / EDIT PENSION CASE FORM STATE (Supports 60 vs 65 years retirement age)
  // ---------------------------------------------------------------------------
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fileNumber: '56',
    kgidNumber: '1042891',
    employeeName: 'ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಎಚ್. (GIRIYAPPA H)',
    parentOrSpouseName: 'ಹನುಮಂತಪ್ಪ',
    designation: 'ಸಹ ಶಿಕ್ಷಕರು (Assistant Teacher)',
    cadreGroup: 'ಗ್ರೂಪ್-ಸಿ',
    officeOrSchool: 'ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ ಹಳೇನಗರ, ಭದ್ರಾವತಿ (DISE: 29150109701)',
    gender: 'Male',
    dob: '1966-05-12',
    doa: '1993-07-01',
    dor: '2026-05-31',
    retirementAgeYears: 60 as 60 | 65,
    retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)' as PensionRetirementType,
    payScale: '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
    lastBasicPay: 68550,
    daPercentage: 42.5,
    averageEmoluments: 68550,
    earnedLeaveDays: 300,
    halfPayLeaveDays: 38,
    nonQualifyingDays: 0,
    commutationOpted: true,
    commutationPercentage: 40,
    ageNextBirthday: 61,
    nomineeName: 'ಶ್ರೀಮತಿ ಗಿರಿಜಮ್ಮ ಎಚ್. (ಪತ್ನಿ)',
    nomineeRelation: 'ಪತ್ನಿ (Wife)',
    nomineeDob: '1970-08-15',
    bankName: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
    bankBranch: 'ಭದ್ರಾವತಿ ಮುಖ್ಯ ಶಾಖೆ',
    bankAccountNo: '30849201948',
    ifscCode: 'SBIN0000812',
    treasuryName: 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ',
    remarks: 'ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಪ್ರಕರಣ - ೩೨ ವರ್ಷ ೧೧ ತಿಂಗಳು ಅರ್ಹತಾ ಸೇವೆ.'
  });

  // Quick Employee Search Dropdown Filter
  const [empSearch, setEmpSearch] = useState('');

  // Handle Retirement Age Selection (60 Years vs 65 Years)
  const handleRetirementAgeChange = (age: 60 | 65) => {
    const verified = calculateRetirementDate(formData.dob, age);
    setFormData(prev => ({
      ...prev,
      retirementAgeYears: age,
      dor: verified.dor || prev.dor,
      ageNextBirthday: verified.ageNextBirthday,
      retirementType: (age === 65 
        ? 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)' // standard retirement category
        : 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)') as PensionRetirementType
    }));
    showToast(`ನಿವೃತ್ತಿ ವಯಸ್ಸು ${age} ವರ್ಷಗಳಿಗೆ ಹೊಂದಿಸಲಾಗಿದೆ: ನಿವೃತ್ತಿ ದಿನಾಂಕ ${verified.dor}`);
  };

  // Handle Date of Birth Change with KCSR Rule 95 Auto-Verification
  const handleDobChange = (newDob: string) => {
    const verified = calculateRetirementDate(newDob, formData.retirementAgeYears || 60);
    setFormData(prev => ({
      ...prev,
      dob: newDob,
      dor: verified.dor || prev.dor,
      ageNextBirthday: verified.ageNextBirthday
    }));
  };

  // 1-Click Preset to Load Sri Giriyappa H. Case
  const handleLoadGiriyappaCase = () => {
    const giriyappa = INITIAL_PENSION_CASES[0];
    setEditingCaseId(null);
    setFormData({
      fileNumber: giriyappa.fileNumber,
      kgidNumber: giriyappa.kgidNumber,
      employeeName: giriyappa.employeeName,
      parentOrSpouseName: giriyappa.parentOrSpouseName,
      designation: giriyappa.designation,
      cadreGroup: giriyappa.cadreGroup,
      officeOrSchool: giriyappa.officeOrSchool,
      gender: giriyappa.gender,
      dob: giriyappa.dob,
      doa: giriyappa.doa,
      dor: giriyappa.dor,
      retirementAgeYears: giriyappa.retirementAgeYears || 60,
      retirementType: giriyappa.retirementType,
      payScale: giriyappa.payScale,
      lastBasicPay: giriyappa.lastBasicPay,
      daPercentage: giriyappa.daPercentage,
      averageEmoluments: giriyappa.averageEmoluments || giriyappa.lastBasicPay,
      earnedLeaveDays: giriyappa.earnedLeaveDays,
      halfPayLeaveDays: giriyappa.halfPayLeaveDays || 38,
      nonQualifyingDays: giriyappa.nonQualifyingDays || 0,
      commutationOpted: giriyappa.commutationOpted,
      commutationPercentage: giriyappa.commutationPercentage,
      ageNextBirthday: giriyappa.ageNextBirthday,
      nomineeName: giriyappa.nomineeName,
      nomineeRelation: giriyappa.nomineeRelation,
      nomineeDob: giriyappa.nomineeDob,
      bankName: giriyappa.bankName,
      bankBranch: giriyappa.bankBranch,
      bankAccountNo: giriyappa.bankAccountNo,
      ifscCode: giriyappa.ifscCode,
      treasuryName: giriyappa.treasuryName,
      remarks: giriyappa.remarks || ''
    });
    setSelectedCase(giriyappa);
    showToast('ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಪ್ರಕರಣದ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಲೋಡ್ ಮಾಡಲಾಗಿದೆ!');
  };

  // Live Pension Calculation based on Form Data
  const liveCalculation = useMemo(() => {
    return computePensionDetails({
      doa: formData.doa,
      dor: formData.dor,
      dob: formData.dob,
      retirementAgeYears: formData.retirementAgeYears || 60,
      nonQualifyingDays: Number(formData.nonQualifyingDays) || 0,
      lastBasicPay: Number(formData.lastBasicPay) || 0,
      daPercentage: Number(formData.daPercentage) || 0,
      averageEmoluments: Number(formData.averageEmoluments) || Number(formData.lastBasicPay) || 0,
      earnedLeaveDays: Number(formData.earnedLeaveDays) || 0,
      halfPayLeaveDays: Number(formData.halfPayLeaveDays) || 0,
      commutationOpted: formData.commutationOpted,
      commutationPercentage: Number(formData.commutationPercentage) || 0,
      ageNextBirthday: Number(formData.ageNextBirthday) || (formData.retirementAgeYears === 65 ? 66 : 61)
    });
  }, [
    formData.doa,
    formData.dor,
    formData.dob,
    formData.retirementAgeYears,
    formData.nonQualifyingDays,
    formData.lastBasicPay,
    formData.daPercentage,
    formData.averageEmoluments,
    formData.earnedLeaveDays,
    formData.halfPayLeaveDays,
    formData.commutationOpted,
    formData.commutationPercentage,
    formData.ageNextBirthday
  ]);

  // Handle selecting an employee from the staff directory to auto-fill
  const handleSelectEmployee = (emp: Employee) => {
    const dob = emp.dob || '1966-01-01';
    const verified = calculateRetirementDate(dob, formData.retirementAgeYears || 60);

    setFormData(prev => ({
      ...prev,
      kgidNumber: emp.kgidNumber || '',
      employeeName: emp.fullName,
      parentOrSpouseName: emp.parentName || '',
      designation: emp.designation,
      cadreGroup: emp.cadreGroup || 'ಗ್ರೂಪ್-ಸಿ',
      officeOrSchool: emp.officeLocation || emp.placeOfWork || 'ಸರ್ಕಾರಿ ಶಾಲೆ, ಭದ್ರಾವತಿ',
      gender: emp.gender || 'Male',
      dob,
      doa: emp.joiningDate || '1995-01-01',
      dor: verified.dor || '2026-05-31',
      ageNextBirthday: verified.ageNextBirthday,
      payScale: emp.payScale || '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
      lastBasicPay: emp.basicPay || 53900,
      averageEmoluments: emp.basicPay || 53900,
      earnedLeaveDays: emp.earnedLeaveBalance || 240,
      nomineeName: emp.parentName ? `${emp.parentName} (ಕುಟುಂಬ ಸದಸ್ಯರು)` : '',
      bankName: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
      bankBranch: 'ಭದ್ರಾವತಿ ಶಾಖೆ',
      bankAccountNo: '',
      ifscCode: 'SBIN0000812'
    }));

    showToast(`ನೌಕರರ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ: ${emp.fullName}`);
    setEmpSearch('');
  };

  // Handle Save / Submit of Pension Case
  const handleSavePensionCase = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.kgidNumber || !formData.employeeName) {
      showToast('ದಯವಿಟ್ಟು KGID ಸಂಖ್ಯೆ ಮತ್ತು ನೌಕರರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.');
      return;
    }

    const calc = computePensionDetails({
      doa: formData.doa,
      dor: formData.dor,
      dob: formData.dob,
      retirementAgeYears: formData.retirementAgeYears || 60,
      nonQualifyingDays: Number(formData.nonQualifyingDays) || 0,
      lastBasicPay: Number(formData.lastBasicPay) || 0,
      daPercentage: Number(formData.daPercentage) || 0,
      averageEmoluments: Number(formData.averageEmoluments) || Number(formData.lastBasicPay) || 0,
      earnedLeaveDays: Number(formData.earnedLeaveDays) || 0,
      halfPayLeaveDays: Number(formData.halfPayLeaveDays) || 0,
      commutationOpted: formData.commutationOpted,
      commutationPercentage: Number(formData.commutationPercentage) || 0,
      ageNextBirthday: Number(formData.ageNextBirthday) || (formData.retirementAgeYears === 65 ? 66 : 61)
    });

    const now = new Date().toISOString().split('T')[0];

    if (editingCaseId) {
      // Update existing
      setPensionCases(prev => prev.map(c => {
        if (c.id === editingCaseId) {
          const updated = {
            ...c,
            fileNumber: formData.fileNumber,
            kgidNumber: formData.kgidNumber,
            employeeName: formData.employeeName,
            parentOrSpouseName: formData.parentOrSpouseName,
            designation: formData.designation,
            cadreGroup: formData.cadreGroup,
            officeOrSchool: formData.officeOrSchool,
            gender: formData.gender,
            dob: formData.dob,
            doa: formData.doa,
            dor: formData.dor,
            retirementAgeYears: formData.retirementAgeYears,
            retirementType: formData.retirementType,
            payScale: formData.payScale,
            lastBasicPay: formData.lastBasicPay,
            daPercentage: formData.daPercentage,
            averageEmoluments: formData.averageEmoluments,
            earnedLeaveDays: formData.earnedLeaveDays,
            halfPayLeaveDays: formData.halfPayLeaveDays,
            nonQualifyingDays: formData.nonQualifyingDays,
            commutationOpted: formData.commutationOpted,
            commutationPercentage: formData.commutationPercentage,
            ageNextBirthday: formData.ageNextBirthday,
            nomineeName: formData.nomineeName,
            nomineeRelation: formData.nomineeRelation,
            nomineeDob: formData.nomineeDob,
            bankName: formData.bankName,
            bankBranch: formData.bankBranch,
            bankAccountNo: formData.bankAccountNo,
            ifscCode: formData.ifscCode,
            treasuryName: formData.treasuryName,
            calculation: calc,
            remarks: formData.remarks,
            lastUpdated: now
          };
          if (selectedCase.id === editingCaseId) setSelectedCase(updated);
          return updated;
        }
        return c;
      }));
      showToast(`ಪಿಂಚಣಿ ಪ್ರಕರಣವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ (Case Updated): ${formData.employeeName}`);
    } else {
      // Create new
      const newCase: PensionCaseRecord = {
        id: `pen-case-${Date.now()}`,
        caseNumber: `BEO/BHD/PEN/${new Date().getFullYear()}/${String(pensionCases.length + 1).padStart(2, '0')}`,
        fileNumber: formData.fileNumber,
        kgidNumber: formData.kgidNumber,
        employeeName: formData.employeeName,
        parentOrSpouseName: formData.parentOrSpouseName,
        designation: formData.designation,
        cadreGroup: formData.cadreGroup,
        officeOrSchool: formData.officeOrSchool,
        gender: formData.gender,
        dob: formData.dob,
        doa: formData.doa,
        dor: formData.dor,
        retirementAgeYears: formData.retirementAgeYears,
        retirementType: formData.retirementType,
        payScale: formData.payScale,
        lastBasicPay: formData.lastBasicPay,
        daPercentage: formData.daPercentage,
        averageEmoluments: formData.averageEmoluments,
        earnedLeaveDays: formData.earnedLeaveDays,
        halfPayLeaveDays: formData.halfPayLeaveDays,
        nonQualifyingDays: formData.nonQualifyingDays,
        commutationOpted: formData.commutationOpted,
        commutationPercentage: formData.commutationPercentage,
        ageNextBirthday: formData.ageNextBirthday,
        nomineeName: formData.nomineeName,
        nomineeRelation: formData.nomineeRelation,
        nomineeDob: formData.nomineeDob,
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        bankAccountNo: formData.bankAccountNo,
        ifscCode: formData.ifscCode,
        treasuryName: formData.treasuryName,
        calculation: calc,
        checklist: {
          serviceBookVerified: true,
          form7Triplicate: true,
          jointPhotosAttested: false,
          specimenSignatures: false,
          noDueCertificate: false,
          lastPayCertificate: false,
          form1And2Nomination: false,
          aadharBankPassbook: false
        },
        status: 'ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ (Drafting)',
        movementHistory: [
          {
            id: `mov-${Date.now()}`,
            fromOfficer: currentUser?.displayName || 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಪಿಂಚಣಿ)',
            toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)',
            sentDate: now,
            remarks: 'ಹೊಸ ಪಿಂಚಣಿ ಪ್ರಕರಣ ದಾಖಲಿಸಲಾಗಿದೆ. ೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರ ಪಟ್ಟಿ ಸಿದ್ಧವಾಗಿದೆ.',
            statusAfterMove: 'ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ (Drafting)'
          }
        ],
        remarks: formData.remarks,
        createdAt: now,
        lastUpdated: now
      };

      setPensionCases(prev => [newCase, ...prev]);
      setSelectedCase(newCase);
      showToast(`ಹೊಸ ಪಿಂಚಣಿ ಪ್ರಕರಣ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${formData.employeeName}`);
    }

    setEditingCaseId(null);
    setActiveSubTab('calculations'); // Switch to 4 separate calculations view
  };

  // Switch to Edit Mode
  const handleEditCase = (c: PensionCaseRecord) => {
    setEditingCaseId(c.id);
    setFormData({
      fileNumber: c.fileNumber,
      kgidNumber: c.kgidNumber,
      employeeName: c.employeeName,
      parentOrSpouseName: c.parentOrSpouseName || '',
      designation: c.designation,
      cadreGroup: c.cadreGroup,
      officeOrSchool: c.officeOrSchool,
      gender: c.gender || 'Male',
      dob: c.dob,
      doa: c.doa,
      dor: c.dor,
      retirementAgeYears: c.retirementAgeYears || 60,
      retirementType: c.retirementType,
      payScale: c.payScale,
      lastBasicPay: c.lastBasicPay,
      daPercentage: c.daPercentage,
      averageEmoluments: c.averageEmoluments || c.lastBasicPay,
      earnedLeaveDays: c.earnedLeaveDays,
      halfPayLeaveDays: c.halfPayLeaveDays || 0,
      nonQualifyingDays: c.nonQualifyingDays || 0,
      commutationOpted: c.commutationOpted,
      commutationPercentage: c.commutationPercentage,
      ageNextBirthday: c.ageNextBirthday,
      nomineeName: c.nomineeName,
      nomineeRelation: c.nomineeRelation,
      nomineeDob: c.nomineeDob,
      bankName: c.bankName,
      bankBranch: c.bankBranch,
      bankAccountNo: c.bankAccountNo,
      ifscCode: c.ifscCode,
      treasuryName: c.treasuryName,
      remarks: c.remarks || ''
    });
    setActiveSubTab('input');
  };

  // Toggle checklist item
  const handleToggleChecklist = (caseId: string, itemKey: keyof PensionDocumentsChecklist) => {
    setPensionCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const updatedChecklist = {
          ...c.checklist,
          [itemKey]: !c.checklist[itemKey]
        };
        const updated = {
          ...c,
          checklist: updatedChecklist,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        if (selectedCase.id === caseId) setSelectedCase(updated);
        return updated;
      }
      return c;
    }));
    showToast('ದಾಖಲಾತಿ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ ನವೀಕರಿಸಲಾಗಿದೆ.');
  };

  // Update Status of Case
  const handleUpdateStatus = (caseId: string, newStatus: PensionCaseStatus) => {
    setPensionCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const now = new Date().toISOString().split('T')[0];
        const newMov = {
          id: `mov-${Date.now()}`,
          fromOfficer: currentUser?.displayName || 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು',
          toOfficer: newStatus.includes('ರವಾನೆ') ? 'ಮಹಾಲೆಕ್ಕಪಾಲರು (AG), ಬೆಂಗಳೂರು' : 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು',
          sentDate: now,
          remarks: `ಸ್ಥಿತಿಯನ್ನು "${newStatus}" ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.`,
          statusAfterMove: newStatus
        };
        const updated = {
          ...c,
          status: newStatus,
          movementHistory: [...c.movementHistory, newMov],
          lastUpdated: now
        };
        if (selectedCase.id === caseId) setSelectedCase(updated);
        return updated;
      }
      return c;
    }));
    showToast(`ಪ್ರಕರಣದ ಸ್ಥಿತಿಯನ್ನು "${newStatus}" ಗೆ ನವೀಕರಿಸಲಾಗಿದೆ.`);
  };

  // Save active letter format to Dak Registry
  const handleSaveActiveLetterToRegistry = () => {
    if (!selectedCase) return;
    const refNum = `ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಪಿಂಚಣಿ/${selectedCase.kgidNumber}/${selectedFormat}/2026-27`;
    const formatTitles: Record<PensionLetterFormatType, string> = {
      pension_calc_sheet: '೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರ ತಃಖ್ಯೆ (ಪಿಂಚಣಿ, ಉಪದಾನ, ಪರಿವರ್ತನೆ & ರಜೆ ನಗದೀಕರಣ)',
      form7: 'ಪ್ರಪತ್ರ-೭ ಪಿಂಚಣಿ ಮತ್ತು ಉಪದಾನ ಮಂಜೂರಾತಿ ಪ್ರಸ್ತಾವನೆ',
      form1_2: 'ನಮೂನೆ-೧ ಮತ್ತು ೨ ಪಿಂಚಣಿ ಅರ್ಜಿ ಹಾಗೂ ಕುಟುಂಬ ನಾಮನಿರ್ದೇಶನ',
      form6: 'ನಮೂನೆ-೬ ಸೇವಾ ಪರಿಶೀಲನೆ ಹಾಗೂ ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ',
      sanction_order: 'ಪಿಂಚಣಿ ಮತ್ತು ನಿವೃತ್ತಿ ಉಪದಾನ ಮಂಜೂರಾತಿ ಜ್ಞಾಪನಾ ಆದೇಶ',
      gratuity_order: 'ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG) ಮಂಜೂರಾತಿ ಆದೇಶ',
      commutation_order: 'ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ (CVP) ಮಂಜೂರಾತಿ ಆದೇಶ',
      el_encashment_order: 'ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಮಂಜೂರಾತಿ ಆದೇಶ',
      service_verification_cert: 'ಸೇವಾ ಪರಿಶೀಲನಾ ಪ್ರಮಾಣಪತ್ರ',
      provisional_order: 'ತಾತ್ಕಾಲಿಕ ಪಿಂಚಣಿ ಮತ್ತು ಉಪದಾನ ಮಂಜೂರಾತಿ ಆದೇಶ (KCSR 341)',
      ag_forwarding: 'ಮಹಾಲೆಕ್ಕಪಾಲರಿಗೆ (AG Karnataka) ಪ್ರಸ್ತಾವನಾ ರವಾನೆ ಪತ್ರ',
      no_dues_cert: 'ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ (No Dues Certificate)'
    };

    const htmlContent = renderPensionFormatHtml(selectedFormat, selectedCase, DEFAULT_PENSION_OFFICE_CONFIG);

    if (onSaveLetterToRegistry) {
      onSaveLetterToRegistry({
        referenceNumber: refNum,
        fileNumber: selectedCase.fileNumber,
        direction: 'outward',
        subject: `${formatTitles[selectedFormat]} - ಶ್ರೀ/ಶ್ರೀಮತಿ ${selectedCase.employeeName}, KGID: ${selectedCase.kgidNumber}`,
        category: 'Official Order',
        senderName: DEFAULT_PENSION_OFFICE_CONFIG.officerName,
        senderDesignation: DEFAULT_PENSION_OFFICE_CONFIG.officerDesignation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು',
        senderDepartment: DEFAULT_PENSION_OFFICE_CONFIG.officeName,
        recipientName: selectedFormat === 'ag_forwarding' ? 'ಪ್ರಧಾನ ಮಹಾಲೆಕ್ಕಪಾಲರು (A&E), ಕರ್ನಾಟಕ, ಬೆಂಗಳೂರು' : selectedCase.employeeName,
        recipientDesignation: selectedFormat === 'ag_forwarding' ? 'Accountant General' : selectedCase.designation,
        recipientDepartment: selectedCase.officeOrSchool,
        priority: 'Immediate',
        status: 'Approved & Signed',
        section: 'Administration & Services',
        sectionCode: 'ಆ2',
        sectionName: 'ಸ.ಪ್ರಾ.ಶಿ',
        bodyText: htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        financialAmount: selectedCase.calculation.dcrgSanctioned + selectedCase.calculation.commutationLumpSum,
        tags: ['Pension', 'KCSR', 'Retirement', selectedCase.kgidNumber, selectedFormat]
      });
      showToast(`ಪತ್ರವನ್ನು ಜಾವಕ ರಿಜಿಸ್ಟ್ರಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${refNum}`);
    } else {
      showToast('ಪತ್ರವನ್ನು ರಿಜಿಸ್ಟ್ರಿಗೆ ನಮೂದಿಸಲಾಗಿದೆ.');
    }
  };

  // Print Active Letter
  const handlePrintDocument = () => {
    window.print();
  };

  // Copy HTML to Clipboard
  const handleCopyHtml = () => {
    if (!selectedCase) return;
    const html = renderPensionFormatHtml(selectedFormat, selectedCase, DEFAULT_PENSION_OFFICE_CONFIG);
    navigator.clipboard.writeText(html);
    showToast('ದಾಖಲಾತಿಯ HTML ಪಠ್ಯವನ್ನು ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ.');
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    return pensionCases.filter(c => {
      const matchSearch = searchQuery === '' || 
        c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.kgidNumber.includes(searchQuery) ||
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.fileNumber.includes(searchQuery) ||
        c.officeOrSchool.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [pensionCases, searchQuery, statusFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = pensionCases.length;
    const sanctioned = pensionCases.filter(c => c.status.includes('ಅನುಮೋದಿತ') || c.status.includes('PPO')).length;
    const sentToAg = pensionCases.filter(c => c.status.includes('ರವಾನೆ')).length;
    const inProcess = total - sanctioned;
    const totalTerminalLumpSum = pensionCases.reduce((sum, c) => sum + (c.calculation?.totalTerminalLumpSum || 0), 0);
    const totalMonthlyPension = pensionCases.reduce((sum, c) => sum + (c.calculation?.basicServicePension || 0), 0);

    return { total, sanctioned, sentToAg, inProcess, totalTerminalLumpSum, totalMonthlyPension };
  }, [pensionCases]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 pb-12 font-sans">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-xl p-4 sm:p-5 border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-kannada text-amber-300">
                  ಪಿಂಚಣಿ ನಿರ್ವಹಣಾ ತಂತ್ರಾಂಶ (Pension Management System)
                </h1>
                <span className="bg-amber-400 text-stone-950 text-[10px] font-mono-code font-bold px-2 py-0.5 rounded">
                  KCSR & 7TH PAY
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 font-kannada">
                ನಿವೃತ್ತಿ ವೇತನ ಲೆಕ್ಕಾಚಾರ (೬೦/೬೫ ವರ್ಷಗಳ ಪರಿಶೀಲನೆ), ೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರಗಳು (ಪಿಂಚಣಿ, ಉಪದಾನ, ಪರಿವರ್ತನೆ, ಗಳಿಕೆ ರಜೆ), ನಮೂನೆಗಳು & ಕಡತ ನಿರ್ವಹಣೆ
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <span className="text-stone-400 block text-[10px]">ಒಟ್ಟು ಪ್ರಕರಣಗಳು</span>
              <span className="font-bold text-base text-amber-400 font-mono-code">{stats.total}</span>
            </div>
            <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <span className="text-stone-400 block text-[10px]">ಮಂಜೂರಾದವು</span>
              <span className="font-bold text-base text-emerald-400 font-mono-code">{stats.sanctioned}</span>
            </div>
            <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <span className="text-stone-400 block text-[10px]">ಒಟ್ಟು ಉಪದಾನ & ಗಂಟು ಮೊತ್ತ</span>
              <span className="font-bold text-base text-sky-400 font-mono-code">{formatINR(stats.totalTerminalLumpSum)}</span>
            </div>
            <button
              onClick={() => {
                setEditingCaseId(null);
                setActiveSubTab('input');
              }}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ಹೊಸ ಪಿಂಚಣಿ ಪ್ರಕರಣ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 overflow-x-auto gap-2 scrollbar-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('cases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-2 border-stone-800 ${
              activeSubTab === 'cases'
                ? 'bg-stone-900 text-amber-300 shadow-[3px_3px_0px_#f59e0b]'
                : 'bg-white text-stone-800 hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-amber-500" />
            <span>೧. ಪ್ರಕರಣಗಳು & ಕಡತಗಳು ({pensionCases.length})</span>
          </button>

          <button
            onClick={() => {
              if (!editingCaseId) {
                // reset form
                setFormData({
                  fileNumber: '56',
                  kgidNumber: '1042891',
                  employeeName: 'ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಎಚ್. (GIRIYAPPA H)',
                  parentOrSpouseName: 'ಹನುಮಂತಪ್ಪ',
                  designation: 'ಸಹ ಶಿಕ್ಷಕರು (Assistant Teacher)',
                  cadreGroup: 'ಗ್ರೂಪ್-ಸಿ',
                  officeOrSchool: 'ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ ಹಳೇನಗರ, ಭದ್ರಾವತಿ (DISE: 29150109701)',
                  gender: 'Male',
                  dob: '1966-05-12',
                  doa: '1993-07-01',
                  dor: '2026-05-31',
                  retirementAgeYears: 60,
                  retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)',
                  payScale: '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850',
                  lastBasicPay: 68550,
                  daPercentage: 42.5,
                  averageEmoluments: 68550,
                  earnedLeaveDays: 300,
                  halfPayLeaveDays: 38,
                  nonQualifyingDays: 0,
                  commutationOpted: true,
                  commutationPercentage: 40,
                  ageNextBirthday: 61,
                  nomineeName: 'ಶ್ರೀಮತಿ ಗಿರಿಜಮ್ಮ ಎಚ್. (ಪತ್ನಿ)',
                  nomineeRelation: 'ಪತ್ನಿ (Wife)',
                  nomineeDob: '1970-08-15',
                  bankName: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
                  bankBranch: 'ಭದ್ರಾವತಿ ಮುಖ್ಯ ಶಾಖೆ',
                  bankAccountNo: '30849201948',
                  ifscCode: 'SBIN0000812',
                  treasuryName: 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ',
                  remarks: 'ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಪ್ರಕರಣ - ೩೨ ವರ್ಷ ೧೧ ತಿಂಗಳು ಅರ್ಹತಾ ಸೇವೆ.'
                });
              }
              setActiveSubTab('input');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-2 border-stone-800 ${
              activeSubTab === 'input'
                ? 'bg-stone-900 text-amber-300 shadow-[3px_3px_0px_#f59e0b]'
                : 'bg-white text-stone-800 hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>೨. ದತ್ತಾಂಶ ನಮೂದು & ವಯೋನಿವೃತ್ತಿ ಪರಿಶೀಲನೆ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('calculations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-2 border-stone-800 ${
              activeSubTab === 'calculations'
                ? 'bg-stone-900 text-amber-300 shadow-[3px_3px_0px_#f59e0b]'
                : 'bg-white text-stone-800 hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-500" />
            <span>೩. ೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರಗಳು (4 Calculations)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('letters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-2 border-stone-800 ${
              activeSubTab === 'letters'
                ? 'bg-stone-900 text-amber-300 shadow-[3px_3px_0px_#f59e0b]'
                : 'bg-white text-stone-800 hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>೪. ಅಧಿಕೃತ ನಮೂನೆಗಳು & ಮಂಜೂರಾತಿ ಆದೇಶಗಳು</span>
          </button>

          <button
            onClick={() => setActiveSubTab('checklist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-2 border-stone-800 ${
              activeSubTab === 'checklist'
                ? 'bg-stone-900 text-amber-300 shadow-[3px_3px_0px_#f59e0b]'
                : 'bg-white text-stone-800 hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>೫. ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('labels')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-2 border-stone-800 ${
              activeSubTab === 'labels'
                ? 'bg-stone-900 text-amber-300 shadow-[3px_3px_0px_#f59e0b]'
                : 'bg-white text-stone-800 hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
            }`}
          >
            <Tag className="w-4 h-4 text-purple-600" />
            <span>೬. ಕಡತ ಅಂಟಿಸುವ ಲೇಬಲ್‌ಗಳು (Docket Labels)</span>
          </button>
        </div>

        {/* Selected Case Indicator Chip */}
        {selectedCase && (
          <div className="hidden lg:flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg text-xs">
            <span className="text-stone-500 font-medium">ಪ್ರಸ್ತುತ ಪ್ರಕರಣ:</span>
            <span className="font-bold text-stone-900">{selectedCase.employeeName}</span>
            <span className="font-mono-code text-[11px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-bold">
              KGID: {selectedCase.kgidNumber}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PENSION CASES DIRECTORY & FILE DOCKET TRACKER                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'cases' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="ಹೆಸರು, KGID, ಕಡತ ಸಂಖ್ಯೆ ಅಥವಾ ಶಾಲೆಯಿಂದ ಹುಡುಕಿ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-stone-600 font-medium whitespace-nowrap">ಸ್ಥಿತಿ:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು ({pensionCases.length})</option>
                <option value="ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ (Drafting)">ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ</option>
                <option value="ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ (Service Verified)">ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ</option>
                <option value="BEO ಅನುಮೋದಿತ (Sanctioned by BEO)">BEO ಅನುಮೋದಿತ</option>
                <option value="ಮಹಾಲೆಕ್ಕಪಾಲರ ಕಚೇರಿಗೆ ರವಾನೆ (Sent to AG Karnataka)">ಮಹಾಲೆಕ್ಕಪಾಲರ ಕಚೇರಿಗೆ ರವಾನೆ</option>
                <option value="PPO ಮಂಜೂರಾಗಿದೆ (PPO Issued)">PPO ಮಂಜೂರಾಗಿದೆ</option>
              </select>
            </div>
          </div>

          {/* Cases Cards / Table */}
          <div className="grid grid-cols-1 gap-3">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b] p-6">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-stone-800">ಯಾವುದೇ ಪಿಂಚಣಿ ಪ್ರಕರಣ ಕಂಡುಬಂದಿಲ್ಲ</h3>
                <p className="text-xs text-stone-500 mt-1">ಹೊಸ ಪ್ರಕರಣವನ್ನು ಸೇರಿಸಲು ಮೇಲಿನ ಬಟನ್ ಬಳಸಿ.</p>
              </div>
            ) : (
              filteredCases.map(c => {
                const isSelected = selectedCase?.id === c.id;
                const calc = c.calculation;
                const verifiedDocsCount = Object.values(c.checklist).filter(Boolean).length;

                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-xl border-2 border-stone-800 p-4 transition-all shadow-[3px_3px_0px_#2b2b2b] ${
                      isSelected ? 'ring-2 ring-amber-500 bg-amber-50/20' : 'hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: Employee info & File identifiers */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-code font-bold text-xs bg-stone-900 text-amber-400 px-2 py-0.5 rounded">
                            {c.caseNumber}
                          </span>
                          <span className="font-bold text-xs bg-amber-100 text-stone-900 border border-stone-800 px-2 py-0.5 rounded">
                            📁 ಕಡತ ಸಂ: {c.fileNumber}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-stone-700 bg-stone-100 text-stone-800">
                            {c.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <h3 className="font-bold text-base text-stone-900 font-kannada">
                            {c.employeeName}
                          </h3>
                          <span className="font-mono-code text-xs text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">
                            KGID: {c.kgidNumber}
                          </span>
                        </div>

                        <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{c.designation} ({c.cadreGroup})</span>
                          <span>•</span>
                          <span className="text-stone-800 font-medium">{c.officeOrSchool}</span>
                          <span>•</span>
                          <span className="text-rose-800 font-bold">ನಿವೃತ್ತಿ: {c.dor} ({c.retirementType.split(' ')[0]})</span>
                        </div>
                      </div>

                      {/* Middle: Calculated Benefit Highlights */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-300 text-xs">
                        <div>
                          <span className="text-[10px] text-stone-500 block">ಅರ್ಹತಾ ಸೇವೆ</span>
                          <span className="font-bold text-stone-900">
                            {calc.netQualifyingYears}ವ {calc.netQualifyingMonths}ತಿ ({calc.qualifyingHalfYears} ಅರ್ಧವಾರ್ಷಿಕ)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">ಮೂಲ ಮಾಸಿಕ ಪಿಂಚಣಿ</span>
                          <span className="font-bold text-emerald-800 font-mono-code text-sm">
                            {formatINR(calc.basicServicePension)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG)</span>
                          <span className="font-bold text-blue-900 font-mono-code text-sm">
                            {formatINR(calc.dcrgSanctioned)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">ಪರಿವರ್ತನೆ ಗಂಟು ಮೊತ್ತ</span>
                          <span className="font-bold text-purple-900 font-mono-code text-sm">
                            {formatINR(calc.commutationLumpSum)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 lg:justify-end shrink-0">
                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setSelectedFormat('form7');
                            setActiveSubTab('letters');
                          }}
                          className="bg-amber-400 hover:bg-amber-300 text-stone-950 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1 cursor-pointer"
                          title="ಎಲ್ಲಾ ನಮೂನೆ ಪತ್ರಗಳು & ಆದೇಶಗಳು"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>ಪತ್ರಗಳು & ಆದೇಶಗಳು</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setActiveSubTab('checklist');
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1 cursor-pointer"
                          title="ದಾಖಲಾತಿಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-700" />
                          <span>ದಾಖಲೆಗಳು ({verifiedDocsCount}/8)</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setActiveSubTab('labels');
                          }}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-950 p-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                          title="ಭೌತಿಕ ಕಡತ ಲೇಬಲ್ & QR ಕೋಡ್"
                        >
                          <Tag className="w-4 h-4 text-purple-700" />
                        </button>

                        <button
                          onClick={() => handleEditCase(c)}
                          className="bg-white hover:bg-stone-100 text-stone-800 p-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                          title="ಸಂಪಾದಿಸಿ"
                        >
                          <Edit className="w-4 h-4 text-stone-600" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`ಶ್ರೀ/ಶ್ರೀಮತಿ ${c.employeeName} ರವರ ಪಿಂಚಣಿ ಪ್ರಕರಣವನ್ನು ಅಳಿಸಲು ಖಚಿತಪಡಿಸಿ?`)) {
                              setPensionCases(prev => prev.filter(item => item.id !== c.id));
                              showToast('ಪಿಂಚಣಿ ಪ್ರಕರಣವನ್ನು ಅಳಿಸಲಾಗಿದೆ.');
                            }
                          }}
                          className="bg-white hover:bg-rose-50 text-rose-700 p-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                          title="ಅಳಿಸಿ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress / Status Update row */}
                    <div className="mt-3 pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-500">ಸ್ಥಿತಿ ಬದಲಿಸಿ:</span>
                        <select
                          value={c.status}
                          onChange={e => handleUpdateStatus(c.id, e.target.value as PensionCaseStatus)}
                          className="text-[11px] font-bold border border-stone-400 rounded px-2 py-0.5 bg-white cursor-pointer"
                        >
                          <option value="ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ (Drafting)">ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ</option>
                          <option value="ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ (Service Verified)">ಸೇವಾ ಪರಿಶೀಲನೆ ಪೂರ್ಣ</option>
                          <option value="BEO ಅನುಮೋದಿತ (Sanctioned by BEO)">BEO ಅನುಮೋದಿತ</option>
                          <option value="ಮಹಾಲೆಕ್ಕಪಾಲರ ಕಚೇರಿಗೆ ರವಾನೆ (Sent to AG Karnataka)">ಮಹಾಲೆಕ್ಕಪಾಲರ ಕಚೇರಿಗೆ ರವಾನೆ</option>
                          <option value="PPO ಮಂಜೂರಾಗಿದೆ (PPO Issued)">PPO ಮಂಜೂರಾಗಿದೆ</option>
                          <option value="ವಿಲೇವಾರಿ ಮುಕ್ತಾಯ (Completed & Disposed)">ವಿಲೇವಾರಿ ಮುಕ್ತಾಯ</option>
                        </select>
                      </div>

                      <div className="text-[11px] text-stone-500 font-mono-code">
                        ಬ್ಯಾಂಕ್: {c.bankName} (ಖಾತೆ: {c.bankAccountNo || 'ನಮೂದಿಸಿಲ್ಲ'}) | ಖಜಾನೆ: {c.treasuryName}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PENSION DATA INPUT & LIVE CALCULATION ENGINE                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Form: Data Entry (8 Columns) */}
          <div className="lg:col-span-8 bg-white p-5 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-stone-900 font-kannada">
                  {editingCaseId ? 'ಪಿಂಚಣಿ ಪ್ರಕರಣದ ವಿವರಗಳ ತಿದ್ದುಪಡಿ' : 'ಹೊಸ ಪಿಂಚಣಿ ಪ್ರಕರಣ - ದತ್ತಾಂಶ ನಮೂದು'}
                </h2>
              </div>
              <span className="text-[11px] text-stone-500 font-mono-code">
                ಆ2 (ಸ.ಪ್ರಾ.ಶಿ) ಶಾಖೆ
              </span>
            </div>

            {/* Quick Employee Selector dropdown & 1-Click Giriyappa Case Preset */}
            <div className="mb-5 p-3 bg-amber-50 rounded-lg border border-amber-300 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-stone-800">
                  ⚡ ನೌಕರರ ಡೇಟಾಬೇಸ್‌ನಿಂದ ತ್ವರಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಿ (Quick Auto-Fill from Staff Directory):
                </label>
                <button
                  type="button"
                  onClick={handleLoadGiriyappaCase}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>ಶ್ರೀ ಗಿರಿಯಪ್ಪ ಪ್ರಕರಣ ಲೋಡ್ ಮಾಡಿ (Giriyappa Preset)</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="ನೌಕರರ ಹೆಸರು ಅಥವಾ KGID ನಮೂದಿಸಿ..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {empSearch && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto bg-white border-2 border-stone-800 rounded-lg shadow-lg">
                    {employees
                      .filter(e => 
                        e.fullName.toLowerCase().includes(empSearch.toLowerCase()) || 
                        (e.kgidNumber && e.kgidNumber.includes(empSearch))
                      )
                      .slice(0, 8)
                      .map(emp => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectEmployee(emp)}
                          className="p-2 text-xs hover:bg-amber-100 cursor-pointer border-b border-stone-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-stone-900 block">{emp.fullName}</span>
                            <span className="text-[11px] text-stone-500">{emp.designation} • {emp.officeLocation}</span>
                          </div>
                          <span className="font-mono-code font-bold text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                            KGID: {emp.kgidNumber || 'N/A'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSavePensionCase} className="space-y-4">
              {/* SECTION 1: Personal & Service Identifiers */}
              <div>
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider bg-stone-100 px-2 py-1 rounded border-l-4 border-amber-500 mb-3">
                  ೧. ನೌಕರರ ಸೇವಾ ವಿವರಗಳು & ವಯೋನಿವೃತ್ತಿ ಪರಿಶೀಲನೆ (Employee & Service Details)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಕಡತ ಸಂಖ್ಯೆ (File No)*</label>
                    <input
                      type="text"
                      required
                      value={formData.fileNumber}
                      onChange={e => setFormData({ ...formData, fileNumber: e.target.value })}
                      placeholder="ಉದಾ: 56"
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">KGID ಸಂಖ್ಯೆ*</label>
                    <input
                      type="text"
                      required
                      value={formData.kgidNumber}
                      onChange={e => setFormData({ ...formData, kgidNumber: e.target.value })}
                      placeholder="ಉದಾ: 1042891"
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ನೌಕರರ ಪೂರ್ಣ ಹೆಸರು*</label>
                    <input
                      type="text"
                      required
                      value={formData.employeeName}
                      onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                      placeholder="ನೌಕರರ ಹೆಸರು"
                      className="w-full p-2 border border-stone-300 rounded font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ತಂದೆ / ಗಂಡನ ಹೆಸರು</label>
                    <input
                      type="text"
                      value={formData.parentOrSpouseName}
                      onChange={e => setFormData({ ...formData, parentOrSpouseName: e.target.value })}
                      placeholder="ತಂದೆ/ಗಂಡನ ಹೆಸರು"
                      className="w-full p-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಹುದ್ದೆ (Designation)*</label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಹುದ್ದೆಯ ವರ್ಗ (Cadre)</label>
                    <select
                      value={formData.cadreGroup}
                      onChange={e => setFormData({ ...formData, cadreGroup: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded bg-white"
                    >
                      <option value="ಗ್ರೂಪ್-ಎ">ಗ್ರೂಪ್-ಎ</option>
                      <option value="ಗ್ರೂಪ್-ಬಿ">ಗ್ರೂಪ್-ಬಿ</option>
                      <option value="ಗ್ರೂಪ್-ಸಿ">ಗ್ರೂಪ್-ಸಿ</option>
                      <option value="ಗ್ರೂಪ್-ಡಿ">ಗ್ರೂಪ್-ಡಿ</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-700 font-bold mb-1">ಕೊನೆಯದಾಗಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸಿದ ಶಾಲೆ / ಕಚೇರಿ</label>
                    <input
                      type="text"
                      value={formData.officeOrSchool}
                      onChange={e => setFormData({ ...formData, officeOrSchool: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ನಿವೃತ್ತಿ ಪ್ರಕಾರ (Retirement Type)</label>
                    <select
                      value={formData.retirementType}
                      onChange={e => setFormData({ ...formData, retirementType: e.target.value as PensionRetirementType })}
                      className="w-full p-2 border border-stone-300 rounded bg-white font-medium"
                    >
                      <option value="ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)">ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)</option>
                      <option value="ಸ್ವಯಂ ನಿವೃತ್ತಿ (Voluntary Retirement)">ಸ್ವಯಂ ನಿವೃತ್ತಿ (Voluntary Retirement)</option>
                      <option value="ಅಶಕ್ತತಾ ಪಿಂಚಣಿ (Invalid Pension)">ಅಶಕ್ತತಾ ಪಿಂಚಣಿ (Invalid Pension)</option>
                      <option value="ಸೇವೆಯಲ್ಲಿದ್ದಾಗ ಮರಣ (Family Pension on Death)">ಸೇವೆಯಲ್ಲಿದ್ದಾಗ ಮರಣ (Family Pension)</option>
                      <option value="ಕಡ್ಡಾಯ ನಿವೃತ್ತಿ (Compulsory Retirement)">ಕಡ್ಡಾಯ ನಿವೃತ್ತಿ (Compulsory)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಜನ್ಮ ದಿನಾಂಕ (DOB)*</label>
                    <input
                      type="date"
                      required
                      value={formData.dob}
                      onChange={e => handleDobChange(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ (DOA)*</label>
                    <input
                      type="date"
                      required
                      value={formData.doa}
                      onChange={e => setFormData({ ...formData, doa: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ನಿವೃತ್ತಿ ದಿನಾಂಕ (DOR)*</label>
                    <input
                      type="date"
                      required
                      value={formData.dor}
                      onChange={e => setFormData({ ...formData, dor: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold text-rose-900"
                    />
                  </div>

                  {/* RETIREMENT AGE VERIFICATION (೬೦ vs ೬೫ ವರ್ಷಗಳು) */}
                  <div className="sm:col-span-3 p-3 bg-stone-100 rounded-lg border-2 border-stone-800 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-xs text-stone-900">
                          ವಯೋನಿವೃತ್ತಿ ವಯಸ್ಸು ಪರಿಶೀಲನೆ (Retirement Age Verification - KCSR Rule 95):
                        </span>
                      </div>
                      <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded text-stone-700 font-mono-code">
                        ಪರಿಶೀಲಿಸಿ ಆಯ್ಕೆಮಾಡಿ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleRetirementAgeChange(60)}
                        className={`p-2.5 rounded-lg border-2 text-left cursor-pointer transition-all ${
                          formData.retirementAgeYears === 60
                            ? 'bg-amber-100 border-amber-600 shadow-sm text-amber-950 font-bold'
                            : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">೬೦ ವರ್ಷಗಳು (60 Years)</span>
                          {formData.retirementAgeYears === 60 && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5 font-normal">
                          ಸಾಮಾನ್ಯ ಸರ್ಕಾರಿ ನೌಕರರು / ಪ್ರಾಥಮಿಕ & ಪ್ರೌಢಶಾಲಾ ಶಿಕ್ಷಕರು
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRetirementAgeChange(65)}
                        className={`p-2.5 rounded-lg border-2 text-left cursor-pointer transition-all ${
                          formData.retirementAgeYears === 65
                            ? 'bg-indigo-100 border-indigo-600 shadow-sm text-indigo-950 font-bold'
                            : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">೬೫ ವರ್ಷಗಳು (65 Years)</span>
                          {formData.retirementAgeYears === 65 && <Check className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5 font-normal">
                          ಯುಜಿಸಿ / ವಿಶ್ವವಿದ್ಯಾಲಯ / ಕಾಲೇಜು ಪ್ರಾಧ್ಯಾಪಕರು / ವೈದ್ಯಕೀಯ ವಿಶೇಷ ವೃಂದ
                        </div>
                      </button>
                    </div>

                    {/* Verification Live Details */}
                    <div className="bg-white p-2.5 rounded border border-stone-300 text-[11px] space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-stone-700">
                        <span>
                          ಹುಟ್ಟಿದ ದಿನಾಂಕ: <strong className="font-mono-code">{formData.dob}</strong> ➔ 
                          ವಯೋನಿವೃತ್ತಿ ದಿನಾಂಕ: <strong className="font-mono-code text-rose-700 font-bold">{formData.dor}</strong>
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded font-mono-code text-[10px]">
                          ವಯಸ್ಸು: {formData.retirementAgeYears} ವರ್ಷಗಳು
                        </span>
                      </div>
                      <div className="text-stone-600 flex flex-wrap justify-between gap-1 pt-0.5 border-t border-stone-200">
                        <span>ಮುಂದಿನ ಜನ್ಮದಿನದ ವಯಸ್ಸು (Age next birthday): <strong className="font-mono-code">{formData.ageNextBirthday}</strong></span>
                        <span>ಪರಿವರ್ತನಾ ಅಪವರ್ತನ: <strong className="font-mono-code">{liveCalculation.commutationFactor}</strong></span>
                        <span>ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು: <strong className="font-mono-code">{liveCalculation.qualifyingHalfYears} / 60</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Pay, Emoluments & Leave Encashment */}
              <div>
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider bg-stone-100 px-2 py-1 rounded border-l-4 border-emerald-500 mb-3">
                  ೨. ವೇತನ, ಭತ್ಯೆ ಹಾಗೂ ರಜೆ ವಿವರಗಳು (Pay, Allowances & Leave Details)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-stone-700 font-bold mb-1">ವೇತನ ಶ್ರೇಣಿ (Pay Scale)</label>
                    <input
                      type="text"
                      value={formData.payScale}
                      onChange={e => setFormData({ ...formData, payScale: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಕೊನೆಯ ಮೂಲ ವೇತನ (Last Basic Pay ₹)*</label>
                    <input
                      type="number"
                      required
                      value={formData.lastBasicPay}
                      onChange={e => setFormData({ ...formData, lastBasicPay: Number(e.target.value) || 0, averageEmoluments: Number(e.target.value) || 0 })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold text-emerald-950 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ತುಟ್ಟಿಭತ್ಯೆ ದರ (DA Rate %)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={formData.daPercentage}
                      onChange={e => setFormData({ ...formData, daPercentage: Number(e.target.value) || 0 })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಗಳಿಕೆ ರಜೆ ಶಿಲ್ಕು (EL Days - ಗರಿಷ್ಠ 300)</label>
                    <input
                      type="number"
                      max={300}
                      value={formData.earnedLeaveDays}
                      onChange={e => setFormData({ ...formData, earnedLeaveDays: Number(e.target.value) || 0 })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಅರ್ಧ ವೇತನ ರಜೆ (HPL Days)</label>
                    <input
                      type="number"
                      value={formData.halfPayLeaveDays}
                      onChange={e => setFormData({ ...formData, halfPayLeaveDays: Number(e.target.value) || 0 })}
                      placeholder="ಉದಾ: 38"
                      className="w-full p-2 border border-stone-300 rounded font-mono-code"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಅನರ್ಹತಾ ಸೇವೆ (Non-qualifying days - EOL)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.nonQualifyingDays}
                      onChange={e => setFormData({ ...formData, nonQualifyingDays: Number(e.target.value) || 0 })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Commutation of Pension */}
              <div>
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider bg-stone-100 px-2 py-1 rounded border-l-4 border-purple-500 mb-3">
                  ೩. ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ (Commutation of Pension - CVP)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-purple-50/40 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="chk-commutation"
                      checked={formData.commutationOpted}
                      onChange={e => setFormData({ ...formData, commutationOpted: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="chk-commutation" className="font-bold text-stone-800 cursor-pointer">
                      ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಬಯಸಿದ್ದಾರೆ (Opted for CVP)
                    </label>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಪರಿವರ್ತನಾ ಶೇಕಡಾವಾರು (% - ಗರಿಷ್ಠ 40%)</label>
                    <input
                      type="number"
                      max={40}
                      min={1}
                      disabled={!formData.commutationOpted}
                      value={formData.commutationPercentage}
                      onChange={e => setFormData({ ...formData, commutationPercentage: Math.min(40, Math.max(1, Number(e.target.value) || 0)) })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold disabled:bg-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಮುಂದಿನ ಜನ್ಮದಿನದ ವಯಸ್ಸು (Age Next Birthday)</label>
                    <input
                      type="number"
                      min={50}
                      max={70}
                      disabled={!formData.commutationOpted}
                      value={formData.ageNextBirthday}
                      onChange={e => setFormData({ ...formData, ageNextBirthday: Number(e.target.value) || 61 })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold disabled:bg-stone-200"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Nominee & Bank Details */}
              <div>
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider bg-stone-100 px-2 py-1 rounded border-l-4 border-blue-500 mb-3">
                  ೪. ಕುಟುಂಬ ನಾಮನಿರ್ದೇಶನ ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ (Nominee & Treasury Bank Details)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ನಾಮನಿರ್ದೇಶಿತರ ಹೆಸರು (Nominee Name)*</label>
                    <input
                      type="text"
                      required
                      value={formData.nomineeName}
                      onChange={e => setFormData({ ...formData, nomineeName: e.target.value })}
                      placeholder="ಪತಿ / ಪತ್ನಿ ಹೆಸರು"
                      className="w-full p-2 border border-stone-300 rounded font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಸಂಬಂಧ (Relationship)</label>
                    <input
                      type="text"
                      value={formData.nomineeRelation}
                      onChange={e => setFormData({ ...formData, nomineeRelation: e.target.value })}
                      placeholder="ಪತಿ / ಪತ್ನಿ"
                      className="w-full p-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ನಾಮನಿರ್ದೇಶಿತರ ಜನ್ಮ ದಿನಾಂಕ</label>
                    <input
                      type="date"
                      value={formData.nomineeDob}
                      onChange={e => setFormData({ ...formData, nomineeDob: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಬ್ಯಾಂಕ್ ಹೆಸರು</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಶಾಖೆ (Branch)</label>
                    <input
                      type="text"
                      value={formData.bankBranch}
                      onChange={e => setFormData({ ...formData, bankBranch: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಖಾತೆ ಸಂಖ್ಯೆ (Bank A/c No)</label>
                    <input
                      type="text"
                      value={formData.bankAccountNo}
                      onChange={e => setFormData({ ...formData, bankAccountNo: e.target.value })}
                      placeholder="ಖಾತೆ ಸಂಖ್ಯೆ"
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">IFSC ಕೋಡ್</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-700 font-bold mb-1">ಸಂಬಂಧಪಟ್ಟ ಖಜಾನೆ (Treasury)</label>
                    <input
                      type="text"
                      value={formData.treasuryName}
                      onChange={e => setFormData({ ...formData, treasuryName: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t-2 border-stone-800 flex items-center justify-end gap-3">
                {editingCaseId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCaseId(null);
                      setActiveSubTab('cases');
                    }}
                    className="px-4 py-2 border-2 border-stone-800 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 cursor-pointer"
                  >
                    ರದ್ದುಗೊಳಿಸಿ (Cancel)
                  </button>
                )}

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-all border-2 border-stone-800 shadow-[3px_3px_0px_#000] cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCaseId ? 'ಪ್ರಕರಣ ನವೀಕರಿಸಿ (Update Case)' : 'ಪಿಂಚಣಿ ಪ್ರಕರಣ ಉಳಿಸಿ (Save Pension Case)'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Calculation Inspector Card (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-stone-900 text-white p-4 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b]">
              <div className="flex items-center justify-between pb-2 border-b border-stone-700 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wide text-amber-300 font-kannada">
                    ಸ್ವಯಂಚಾಲಿತ ಲೆಕ್ಕಾಚಾರ ಪಟ್ಟಿ (Live Calculation Inspector)
                  </h3>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/40 font-mono-code font-bold">
                  KCSR Rule 287
                </span>
              </div>

              {/* Service Calculation */}
              <div className="space-y-2.5 text-xs">
                <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700">
                  <div className="text-[10px] text-stone-400">ನಿವ್ವಳ ಅರ್ಹತಾ ಸೇವೆ (Qualifying Service):</div>
                  <div className="font-bold text-sm text-amber-300 font-mono-code mt-0.5">
                    {liveCalculation.netQualifyingYears} ವರ್ಷ {liveCalculation.netQualifyingMonths} ತಿಂಗಳು {liveCalculation.netQualifyingDays} ದಿನ
                  </div>
                  <div className="text-[11px] text-stone-300 mt-1 flex justify-between">
                    <span>ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು:</span>
                    <strong className="text-white font-mono-code">{liveCalculation.qualifyingHalfYears} / 60 (ಗರಿಷ್ಠ)</strong>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    {liveCalculation.isEligibleForFullPension ? '✓ ಪೂರ್ಣ ಪಿಂಚಣಿಗೆ ಅರ್ಹರು (30+ ವರ್ಷ)' : '✓ ಸೇವಾ ಅವಧಿಗೆ ಅನುಗುಣವಾದ ಪಿಂಚಣಿ'}
                  </div>
                </div>

                {/* Monthly Pension Box */}
                <div className="bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800">
                  <div className="text-[10px] text-emerald-300">ಮೂಲ ಮಾಸಿಕ ಪಿಂಚಣಿ (Basic Monthly Pension):</div>
                  <div className="font-bold text-lg text-emerald-300 font-mono-code">
                    {formatINR(liveCalculation.basicServicePension)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    50% of Basic Pay ({formatINR(liveCalculation.lastBasicPay)})
                  </div>
                </div>

                {/* Commutation Details */}
                {formData.commutationOpted && (
                  <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-800 space-y-1">
                    <div className="text-[10px] text-purple-300 flex justify-between">
                      <span>ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ({formData.commutationPercentage}%):</span>
                      <strong className="font-mono-code">{formatINR(liveCalculation.commutedPortion)} / ತಿಂಗಳು</strong>
                    </div>
                    <div className="text-[10px] text-stone-400 flex justify-between">
                      <span>ಪರಿವರ್ತನಾ ಅಪವರ್ತನ (ವಯಸ್ಸು {formData.ageNextBirthday}):</span>
                      <strong className="font-mono-code text-white">{liveCalculation.commutationFactor}</strong>
                    </div>
                    <div className="text-[11px] text-purple-200 font-bold pt-1 border-t border-purple-800/60 flex justify-between">
                      <span>ಪರಿವರ್ತಿತ ಗಂಟು ಮೊತ್ತ (CVP):</span>
                      <strong className="text-amber-300 font-mono-code">{formatINR(liveCalculation.commutationLumpSum)}</strong>
                    </div>
                    <div className="text-[10px] text-stone-400 pt-0.5 flex justify-between">
                      <span>ಪರಿವರ್ತನೆಯ ನಂತರದ ಮಾಸಿಕ ಪಿಂಚಣಿ:</span>
                      <strong className="text-white font-mono-code">{formatINR(liveCalculation.reducedMonthlyPension)}</strong>
                    </div>
                  </div>
                )}

                {/* DCRG / Gratuity */}
                <div className="bg-blue-950/40 p-2.5 rounded-lg border border-blue-800">
                  <div className="text-[10px] text-blue-300">ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG):</div>
                  <div className="font-bold text-base text-blue-300 font-mono-code">
                    {formatINR(liveCalculation.dcrgSanctioned)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    ಗರಿಷ್ಠ ಮಿತಿ: ₹20,00,000 | ಸೂತ್ರ: (ವೇತನ + DA) / 4 × {liveCalculation.qualifyingHalfYears}
                  </div>
                </div>

                {/* Leave Encashment */}
                <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-stone-400 block">ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ({liveCalculation.earnedLeaveDays} ದಿನ)</span>
                    <span className="font-bold text-stone-200 font-mono-code">{formatINR(liveCalculation.leaveEncashmentAmount)}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono-code font-bold">ಗರಿಷ್ಠ 300 ದಿನ</span>
                </div>

                {/* Family Pension */}
                <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700 text-[11px] space-y-1">
                  <div className="text-[10px] text-stone-400">ಕುಟುಂಬ ಪಿಂಚಣಿ (Family Pension):</div>
                  <div className="flex justify-between">
                    <span className="text-stone-300">ಸಾಮಾನ್ಯ ದರ (30%):</span>
                    <strong className="font-mono-code text-white">{formatINR(liveCalculation.familyPensionNormal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-300">ಹೆಚ್ಚುವರಿ ದರ (50%):</span>
                    <strong className="font-mono-code text-amber-300">{formatINR(liveCalculation.familyPensionEnhanced)}</strong>
                  </div>
                </div>

                {/* Grand Total Terminal Benefits */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 p-3 rounded-lg border border-amber-400 shadow-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    ಒಟ್ಟು ಇಡಿಗಂಟು ಸೌಲಭ್ಯಗಳು (Grand Total Terminal Lump Sum):
                  </div>
                  <div className="font-bold text-xl font-mono-code mt-0.5">
                    {formatINR(liveCalculation.totalTerminalLumpSum)}
                  </div>
                  <div className="text-[10px] font-medium text-stone-900 mt-1">
                    (DCRG + ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ + ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರಗಳು (4 DISTINCT SEPARATE PENSION CALCULATIONS) */}
      {/* 1. Monthly Pension, 2. Retirement Gratuity, 3. Commutation, 4. EL Encashment */}
      {/* ========================================================================= */}
      {activeSubTab === 'calculations' && selectedCase && (
        <div className="space-y-5">
          {/* Header & Quick Case Switcher Bar */}
          <div className="bg-white p-4 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold border-2 border-stone-800 shadow-[2px_2px_0px_#000]">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 font-kannada">
                  ಪಿಂಚಣಿ ಹಾಗೂ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳ ೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರಗಳು (4 Distinct Calculations)
                </h3>
                <p className="text-xs text-stone-600 font-kannada">
                  ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿ (KCSR) & ೭ನೇ ವೇತನ ಆಯೋಗದ ನಿಯಮಾನುಸಾರ ಅಧಿಕೃತ ಲೆಕ್ಕಾಚಾರ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('pension_calc_sheet');
                  setActiveSubTab('letters');
                }}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>ಸಮಗ್ರ ಲೆಕ್ಕಾಚಾರ ತಃಖ್ಯೆ (Full Sheet)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleEditCase(selectedCase);
                  setActiveSubTab('input');
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-stone-600" />
                <span>ದತ್ತಾಂಶ ತಿದ್ದುಪಡಿ</span>
              </button>
            </div>
          </div>

          {/* RETIREMENT AGE VERIFICATION BANNER (೬೦ ವರ್ಷಗಳು vs ೬೫ ವರ್ಷಗಳು ಪರಿಶೀಲನೆ) */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-4 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold tracking-wide uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ವಯೋನಿವೃತ್ತಿ ವಯಸ್ಸು & ಅರ್ಹತಾ ಸೇವಾ ಪರಿಶೀಲನೆ (Retirement Age Verification - KCSR Rule 95):</span>
                </div>
                <div className="text-base font-bold font-kannada text-white mt-1">
                  {selectedCase.employeeName} — {selectedCase.designation} ({selectedCase.officeOrSchool})
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-300 mt-1 font-mono-code">
                  <span>KGID: <strong className="text-amber-300">{selectedCase.kgidNumber}</strong></span>
                  <span>ಜನ್ಮ ದಿನಾಂಕ (DOB): <strong className="text-white">{selectedCase.dob}</strong></span>
                  <span>ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ (DOA): <strong className="text-white">{selectedCase.doa}</strong></span>
                  <span>ನಿವೃತ್ತಿ ದಿನಾಂಕ (DOR): <strong className="text-rose-400 font-bold">{selectedCase.dor}</strong></span>
                  <span>ಅರ್ಹತಾ ಸೇವೆ: <strong className="text-emerald-400">{selectedCase.calculation.netQualifyingYears} ವರ್ಷ {selectedCase.calculation.netQualifyingMonths} ತಿಂಗಳು</strong></span>
                </div>
              </div>

              {/* Age Selection Toggle (60 vs 65) */}
              <div className="bg-stone-800/90 p-2.5 rounded-lg border border-stone-700 space-y-1.5 shrink-0 min-w-[320px]">
                <div className="text-[11px] font-bold text-stone-300 flex items-center justify-between">
                  <span>ವಯೋನಿವೃತ್ತಿ ವರ್ಗ ಆಯ್ಕೆಮಾಡಿ:</span>
                  <span className="font-mono-code text-[10px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded font-bold">
                    ಪ್ರಸ್ತುತ: {selectedCase.calculation.retirementAgeYears || 60} ವರ್ಷಗಳು
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const verified = calculateRetirementDate(selectedCase.dob, 60);
                      const updatedCalc = computePensionDetails({
                        doa: selectedCase.doa,
                        dor: verified.dor,
                        dob: selectedCase.dob,
                        retirementAgeYears: 60,
                        nonQualifyingDays: selectedCase.nonQualifyingDays,
                        lastBasicPay: selectedCase.lastBasicPay,
                        daPercentage: selectedCase.daPercentage,
                        averageEmoluments: selectedCase.averageEmoluments,
                        earnedLeaveDays: selectedCase.earnedLeaveDays,
                        halfPayLeaveDays: selectedCase.halfPayLeaveDays,
                        commutationOpted: selectedCase.commutationOpted,
                        commutationPercentage: selectedCase.commutationPercentage,
                        ageNextBirthday: verified.ageNextBirthday
                      });
                      const updatedCase: PensionCaseRecord = {
                        ...selectedCase,
                        dor: verified.dor,
                        retirementAgeYears: 60,
                        ageNextBirthday: verified.ageNextBirthday,
                        calculation: updatedCalc,
                        lastUpdated: new Date().toISOString().split('T')[0]
                      };
                      setPensionCases(prev => prev.map(c => c.id === selectedCase.id ? updatedCase : c));
                      setSelectedCase(updatedCase);
                      showToast('೬೦ ವರ್ಷಗಳ ವಯೋನಿವೃತ್ತಿ ಪರಿಶೀಲಿಸಿ ಲೆಕ್ಕಾಚಾರ ನವೀಕರಿಸಲಾಗಿದೆ.');
                    }}
                    className={`py-1.5 px-2 rounded text-xs font-bold transition-all border text-center cursor-pointer ${
                      (selectedCase.calculation.retirementAgeYears || 60) === 60
                        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm'
                        : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    ೬೦ ವರ್ಷಗಳು (60 Yrs)
                    <div className="text-[9px] font-normal text-stone-800 leading-tight">ಸಾಮಾನ್ಯ ಶಿಕ್ಷಕರು / ನೌಕರರು</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const verified = calculateRetirementDate(selectedCase.dob, 65);
                      const updatedCalc = computePensionDetails({
                        doa: selectedCase.doa,
                        dor: verified.dor,
                        dob: selectedCase.dob,
                        retirementAgeYears: 65,
                        nonQualifyingDays: selectedCase.nonQualifyingDays,
                        lastBasicPay: selectedCase.lastBasicPay,
                        daPercentage: selectedCase.daPercentage,
                        averageEmoluments: selectedCase.averageEmoluments,
                        earnedLeaveDays: selectedCase.earnedLeaveDays,
                        halfPayLeaveDays: selectedCase.halfPayLeaveDays,
                        commutationOpted: selectedCase.commutationOpted,
                        commutationPercentage: selectedCase.commutationPercentage,
                        ageNextBirthday: verified.ageNextBirthday
                      });
                      const updatedCase: PensionCaseRecord = {
                        ...selectedCase,
                        dor: verified.dor,
                        retirementAgeYears: 65,
                        ageNextBirthday: verified.ageNextBirthday,
                        calculation: updatedCalc,
                        lastUpdated: new Date().toISOString().split('T')[0]
                      };
                      setPensionCases(prev => prev.map(c => c.id === selectedCase.id ? updatedCase : c));
                      setSelectedCase(updatedCase);
                      showToast('೬೫ ವರ್ಷಗಳ (UGC/ವಿಶೇಷ ವೃಂದ) ವಯೋನಿವೃತ್ತಿ ಪರಿಶೀಲಿಸಿ ಲೆಕ್ಕಾಚಾರ ನವೀಕರಿಸಲಾಗಿದೆ.');
                    }}
                    className={`py-1.5 px-2 rounded text-xs font-bold transition-all border text-center cursor-pointer ${
                      selectedCase.calculation.retirementAgeYears === 65
                        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm'
                        : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    ೬೫ ವರ್ಷಗಳು (65 Yrs)
                    <div className="text-[9px] font-normal text-stone-800 leading-tight">UGC / ವಿಶೇಷ ವೃಂದ</div>
                  </button>
                </div>
                <div className="text-[10px] text-stone-400 text-center">
                  ಪರಿವರ್ತನಾ ಅಪವರ್ತನ: <strong className="text-amber-300 font-mono-code">{selectedCase.calculation.commutationFactor}</strong> (ಮುಂದಿನ ಜನ್ಮದಿನದ ವಯಸ್ಸು {selectedCase.calculation.ageNextBirthday})
                </div>
              </div>
            </div>
          </div>

          {/* THE 4 DISTINCT PENSION CALCULATIONS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* --------------------------------------------------------------------- */}
            {/* 1. MONTHLY PENSION CALCULATION (ಮಾಸಿಕ ಪಿಂಚಣಿ ಲೆಕ್ಕಾಚಾರ)                   */}
            {/* --------------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between border-b-2 border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs border border-emerald-400">
                      ೧
                    </span>
                    <h4 className="font-bold text-sm font-kannada">
                      ಮಾಸಿಕ ಪಿಂಚಣಿ ಲೆಕ್ಕಾಚಾರ (Monthly Pension Calculation)
                    </h4>
                  </div>
                  <span className="bg-emerald-950 text-emerald-200 text-[10px] font-mono-code px-2 py-0.5 rounded font-bold border border-emerald-600">
                    KCSR Rule 287(2)
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Formula banner */}
                  <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-lg text-emerald-950">
                    <span className="font-bold block text-[11px] text-emerald-900">ಲೆಕ್ಕಾಚಾರದ ಸೂತ್ರ (Formula):</span>
                    <span className="font-mono-code font-bold text-xs">
                      (ಕೊನೆಯ ಮೂಲ ವೇತನ ÷ ೨) × (ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು ÷ ೬೦)
                    </span>
                    <div className="text-[10px] text-emerald-800 mt-1">
                      (ಕನಿಷ್ಠ ಪಿಂಚಣಿ: ₹13,500 | ಗರಿಷ್ಠ ಪಿಂಚಣಿ: ₹75,300)
                    </div>
                  </div>

                  {/* Calculations Table */}
                  <div className="space-y-1.5 divide-y divide-stone-200">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಕೊನೆಯ ಮೂಲ ವೇತನ (Last Basic Pay):</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.lastBasicPay)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಸರಾಸರಿ ಲಭ್ಯತೆಗಳು (Average Emoluments):</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.averageEmoluments)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಅರ್ಹತಾ ಸೇವೆ (Qualifying Service):</span>
                      <strong className="font-mono-code text-stone-900">
                        {selectedCase.calculation.netQualifyingYears} ವರ್ಷ {selectedCase.calculation.netQualifyingMonths} ತಿಂಗಳು {selectedCase.calculation.netQualifyingDays} ದಿನ
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು (Qualifying Half Years):</span>
                      <strong className="font-mono-code text-emerald-800 font-bold">
                        {selectedCase.calculation.qualifyingHalfYears} / 60 (ಗರಿಷ್ಠ)
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಪೂರ್ಣ ಪಿಂಚಣಿ ಅರ್ಹತೆ (Full Pension Status):</span>
                      <span className="font-bold text-emerald-700">
                        {selectedCase.calculation.isEligibleForFullPension ? '✓ ಪೂರ್ಣ ಪಿಂಚಣಿಗೆ ಅರ್ಹರು (30+ ವರ್ಷ)' : 'ಅವಧಿಗೆ ಅನುಗುಣವಾದ ಪಿಂಚಣಿ'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 bg-emerald-100/60 px-2 rounded">
                      <span className="font-bold text-emerald-950">ಮಂಜೂರಾದ ಮಾಸಿಕ ಮೂಲ ಪಿಂಚಣಿ (Basic Monthly Pension):</span>
                      <strong className="font-mono-code font-bold text-base text-emerald-900">
                        {formatINR(selectedCase.calculation.basicServicePension)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ತುಟ್ಟಿಭತ್ಯೆ (DA on Pension @ {selectedCase.calculation.daPercentage}%):</span>
                      <strong className="font-mono-code text-stone-800">{formatINR(selectedCase.calculation.daOnPension)}</strong>
                    </div>
                    <div className="flex justify-between py-1 bg-stone-100 px-2 rounded font-bold text-stone-900">
                      <span>ಒಟ್ಟು ಮಾಸಿಕ ಪಿಂಚಣಿ (Gross Monthly Pension):</span>
                      <strong className="font-mono-code text-base text-emerald-950">
                        {formatINR(selectedCase.calculation.grossMonthlyPension)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">ಪ್ರಪತ್ರ-೭ & ಮಂಜೂರಾತಿ ಆದೇಶ</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat('sanction_order');
                    setActiveSubTab('letters');
                  }}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>ಪಿಂಚಣಿ ಆದೇಶ ವೀಕ್ಷಿಸಿ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 2. RETIREMENT GRATUITY (DCRG) CALCULATION (ನಿವೃತ್ತಿ ಉಪದಾನ ಲೆಕ್ಕಾಚಾರ)      */}
            {/* --------------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-blue-800 text-white p-3.5 flex items-center justify-between border-b-2 border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs border border-blue-400">
                      ೨
                    </span>
                    <h4 className="font-bold text-sm font-kannada">
                      ನಿವೃತ್ತಿ ಉಪದಾನ ಲೆಕ್ಕಾಚಾರ (Retirement Gratuity / DCRG)
                    </h4>
                  </div>
                  <span className="bg-blue-950 text-blue-200 text-[10px] font-mono-code px-2 py-0.5 rounded font-bold border border-blue-600">
                    KCSR Rule 292B
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Formula banner */}
                  <div className="bg-blue-50 border border-blue-300 p-2.5 rounded-lg text-blue-950">
                    <span className="font-bold block text-[11px] text-blue-900">ಲೆಕ್ಕಾಚಾರದ ಸೂತ್ರ (Formula):</span>
                    <span className="font-mono-code font-bold text-xs">
                      (ಕೊನೆಯ ಮೂಲ ವೇತನ + ತುಟ್ಟಿಭತ್ಯೆ) ÷ ೪ × ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು
                    </span>
                    <div className="text-[10px] text-blue-800 mt-1">
                      (ಗರಿಷ್ಠ ೧೬.೫ ತಿಂಗಳ ಲಭ್ಯತೆಗಳು | ಸರ್ಕಾರದ ಶಾಸನಬದ್ಧ ಗರಿಷ್ಠ ಮಿತಿ: ₹೨೦,೦೦,೦೦೦)
                    </div>
                  </div>

                  {/* Calculations Table */}
                  <div className="space-y-1.5 divide-y divide-stone-200">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಮೂಲ ವೇತನ (Basic Pay):</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.lastBasicPay)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ತುಟ್ಟಿಭತ್ಯೆ (DA @ {selectedCase.calculation.daPercentage}%):</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.dcrgDaAmount)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಒಟ್ಟು ಲಭ್ಯತೆಗಳು (Pay + DA Emoluments):</span>
                      <strong className="font-mono-code text-blue-900 font-bold">{formatINR(selectedCase.calculation.dcrgEmoluments)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು:</span>
                      <strong className="font-mono-code text-stone-900">{selectedCase.calculation.qualifyingHalfYears} ಅವಧಿಗಳು</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಪ್ರತಿ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗೆ 1/4 ರಷ್ಟು ಲಭ್ಯತೆ:</span>
                      <strong className="font-mono-code text-stone-700">{formatINR(selectedCase.calculation.dcrgEmoluments / 4)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಸೂತ್ರದನ್ವಯ ಲೆಕ್ಕಾಚಾರ ಮೊತ್ತ:</span>
                      <strong className="font-mono-code text-stone-800">
                        {formatINR((selectedCase.calculation.dcrgEmoluments / 4) * selectedCase.calculation.qualifyingHalfYears)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">೧೬.೫ ತಿಂಗಳುಗಳ ಲಭ್ಯತೆಯ ಮಿತಿ:</span>
                      <strong className="font-mono-code text-stone-700">{formatINR(selectedCase.calculation.dcrgMax16HalfMonths)}</strong>
                    </div>
                    <div className="flex justify-between py-1 bg-blue-100/60 px-2 rounded">
                      <span className="font-bold text-blue-950">ಅಂತಿಮ ಮಂಜೂರಾದ ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG):</span>
                      <strong className="font-mono-code font-bold text-base text-blue-950">
                        {formatINR(selectedCase.calculation.dcrgSanctioned)}
                      </strong>
                    </div>
                    <div className="py-1 text-[10px] text-stone-600 font-kannada">
                      ಅಕ್ಷರಗಳಲ್ಲಿ: <strong>{numberToKannadaWords(selectedCase.calculation.dcrgSanctioned)} ರೂಪಾಯಿಗಳು ಮಾತ್ರ</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">KCSR ನಿಯಮ 292B ಉಪದಾನ ಆದೇಶ</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat('gratuity_order');
                    setActiveSubTab('letters');
                  }}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>ಉಪದಾನ ಆದೇಶ ವೀಕ್ಷಿಸಿ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 3. COMMUTATION OF PENSION (ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ - CVP ಲೆಕ್ಕಾಚಾರ)               */}
            {/* --------------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-purple-800 text-white p-3.5 flex items-center justify-between border-b-2 border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs border border-purple-400">
                      ೩
                    </span>
                    <h4 className="font-bold text-sm font-kannada">
                      ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಲೆಕ್ಕಾಚಾರ (Commutation of Pension - CVP)
                    </h4>
                  </div>
                  <span className="bg-purple-950 text-purple-200 text-[10px] font-mono-code px-2 py-0.5 rounded font-bold border border-purple-600">
                    KCSR Appendix-I
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Formula banner */}
                  <div className="bg-purple-50 border border-purple-300 p-2.5 rounded-lg text-purple-950">
                    <span className="font-bold block text-[11px] text-purple-900">ಲೆಕ್ಕಾಚಾರದ ಸೂತ್ರ (Formula):</span>
                    <span className="font-mono-code font-bold text-xs">
                      ಮಾಸಿಕ ಪರಿವರ್ತಿತ ಭಾಗ × ೧೨ × ವಯೋಮಾನ ಅಪವರ್ತನ (Commutation Factor)
                    </span>
                    <div className="text-[10px] text-purple-800 mt-1">
                      (ಗರಿಷ್ಠ ೪೦% ಪರಿವರ್ತನೆಗೆ ಅವಕಾಶ | ೧೫ ವರ್ಷಗಳ ನಂತರ ಪೂರ್ಣ ಪಿಂಚಣಿ ಮರುಸ್ಥಾಪನೆ)
                    </div>
                  </div>

                  {/* Calculations Table */}
                  <div className="space-y-1.5 divide-y divide-stone-200">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಮೂಲ ಮಾಸಿಕ ಪಿಂಚಣಿ:</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.basicServicePension)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಪರಿವರ್ತನೆ ಬಯಸಿದ ಶೇಕಡಾವಾರು (%):</span>
                      <strong className="font-mono-code text-purple-800 font-bold">{selectedCase.calculation.commutationPercentage}%</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಮಾಸಿಕ ಪರಿವರ್ತಿತ ಭಾಗ (Commuted Portion):</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.commutedPortion)} / ತಿಂಗಳಿಗೆ</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಮುಂದಿನ ಜನ್ಮದಿನದ ವಯಸ್ಸು (Age Next Birthday):</span>
                      <strong className="font-mono-code text-stone-900">
                        {selectedCase.calculation.ageNextBirthday} ವರ್ಷಗಳು 
                        <span className="text-stone-500 font-normal text-[11px]"> ({selectedCase.calculation.retirementAgeYears || 60} ವರ್ಷದ ನಿವೃತ್ತಿಗೆ)</span>
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 bg-purple-50 px-2 rounded">
                      <span className="font-bold text-purple-900">ಸರ್ಕಾರಿ ಪರಿವರ್ತನಾ ಅಪವರ್ತನ (Factor):</span>
                      <strong className="font-mono-code text-purple-950 font-bold text-sm">
                        {selectedCase.calculation.commutationFactor}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 bg-purple-100/60 px-2 rounded">
                      <span className="font-bold text-purple-950">ಪರಿವರ್ತಿತ ಪಿಂಚಣಿ ಗಂಟು ಮೊತ್ತ (CVP Lump Sum):</span>
                      <strong className="font-mono-code font-bold text-base text-purple-950">
                        {formatINR(selectedCase.calculation.commutationLumpSum)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಪರಿವರ್ತನೆ ನಂತರದ ನಿವ್ವಳ ಮೂಲ ಪಿಂಚಣಿ:</span>
                      <strong className="font-mono-code text-emerald-800 font-bold">
                        {formatINR(selectedCase.calculation.reducedMonthlyPension)} / ತಿಂಗಳಿಗೆ
                      </strong>
                    </div>
                    <div className="py-1 text-[10px] text-stone-600 font-kannada">
                      ೧೫ ವರ್ಷಗಳ ನಂತರ (Rule 376 ರಂತೆ) ಮೂಲ ಪಿಂಚಣಿ {formatINR(selectedCase.calculation.basicServicePension)} ಮರುಸ್ಥಾಪನೆಯಾಗುತ್ತದೆ.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">CVP ಅಧಿಕೃತ ಮಂಜೂರಾತಿ ಆದೇಶ</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat('commutation_order');
                    setActiveSubTab('letters');
                  }}
                  className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>ಪರಿವರ್ತನೆ ಆದೇಶ ವೀಕ್ಷಿಸಿ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4. EARNED LEAVE ENCASHMENT (ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಲೆಕ್ಕಾಚಾರ)                  */}
            {/* --------------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-amber-700 text-white p-3.5 flex items-center justify-between border-b-2 border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs border border-amber-400">
                      ೪
                    </span>
                    <h4 className="font-bold text-sm font-kannada">
                      ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಲೆಕ್ಕಾಚಾರ (Earned Leave & HPL Encashment)
                    </h4>
                  </div>
                  <span className="bg-amber-950 text-amber-200 text-[10px] font-mono-code px-2 py-0.5 rounded font-bold border border-amber-500">
                    KCSR Rule 118A
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Formula banner */}
                  <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-lg text-amber-950">
                    <span className="font-bold block text-[11px] text-amber-900">ಲೆಕ್ಕಾಚಾರದ ಸೂತ್ರ (Formula):</span>
                    <span className="font-mono-code font-bold text-xs">
                      (ಕೊನೆಯ ಮೂಲ ವೇತನ + ತುಟ್ಟಿಭತ್ಯೆ) ÷ ೩೦ × ಗಳಿಕೆ ರಜೆ ದಿನಗಳು
                    </span>
                    <div className="text-[10px] text-amber-800 mt-1">
                      (ಗರಿಷ್ಠ ೩೦೦ ದಿನಗಳ ಮಿತಿಯೊಳಗೆ ಗಳಿಕೆ ರಜೆ ಹಾಗೂ ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ಅರ್ಧವೇತನ ರಜೆ ಸರಿಹೊಂದಿಕೆ)
                    </div>
                  </div>

                  {/* Calculations Table */}
                  <div className="space-y-1.5 divide-y divide-stone-200">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಕೊನೆಯ ಮೂಲ ವೇತನ (Basic Pay):</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.lastBasicPay)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ತುಟ್ಟಿಭತ್ಯೆ (DA @ {selectedCase.calculation.daPercentage}%):</span>
                      <strong className="font-mono-code text-stone-900">
                        {formatINR(Math.round((selectedCase.calculation.lastBasicPay * selectedCase.calculation.daPercentage) / 100))}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ರಜೆ ನಗದೀಕರಣದ ಮಾಸಿಕ ಲಭ್ಯತೆಗಳು (Pay + DA):</span>
                      <strong className="font-mono-code text-amber-950 font-bold">{formatINR(selectedCase.calculation.leaveEmoluments)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ದಿನವೊಂದರ ವೇತನ ದರ (Daily Rate = Emoluments ÷ 30):</span>
                      <strong className="font-mono-code text-stone-900">{formatINR(selectedCase.calculation.leaveDailyRate)} / ದಿನಕ್ಕೆ</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಜಮೆಯಿರುವ ಗಳಿಕೆ ರಜೆ ದಿನಗಳು (EL Balance Days):</span>
                      <strong className="font-mono-code text-amber-900 font-bold">{selectedCase.calculation.earnedLeaveDays} ದಿನಗಳು (ಗರಿಷ್ಠ 300)</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600">ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಮೊತ್ತ:</span>
                      <strong className="font-mono-code text-stone-800">{formatINR(selectedCase.calculation.earnedLeaveAmount)}</strong>
                    </div>
                    {selectedCase.calculation.halfPayLeaveDays > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-stone-600">ಅರ್ಧ ವೇತನ ರಜೆ (HPL) ದಿನಗಳು:</span>
                        <strong className="font-mono-code text-stone-700">{selectedCase.calculation.halfPayLeaveDays} ದಿನಗಳು</strong>
                      </div>
                    )}
                    <div className="flex justify-between py-1 bg-amber-100/60 px-2 rounded">
                      <span className="font-bold text-amber-950">ಒಟ್ಟು ಮಂಜೂರಾದ ರಜೆ ನಗದೀಕರಣ ಮೊತ್ತ:</span>
                      <strong className="font-mono-code font-bold text-base text-amber-950">
                        {formatINR(selectedCase.calculation.leaveEncashmentAmount)}
                      </strong>
                    </div>
                    <div className="py-1 text-[10px] text-stone-600 font-kannada">
                      ಅಕ್ಷರಗಳಲ್ಲಿ: <strong>{numberToKannadaWords(selectedCase.calculation.leaveEncashmentAmount)} ರೂಪಾಯಿಗಳು ಮಾತ್ರ</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">KCSR ನಿಯಮ 118A ನಗದೀಕರಣ ಆದೇಶ</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat('el_encashment_order');
                    setActiveSubTab('letters');
                  }}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>ರಜೆ ನಗದೀಕರಣ ಆದೇಶ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUMMARY OF TERMINAL BENEFITS (ಸಮಗ್ರ ನಿವೃತ್ತಿ ಇಡಿಗಂಟು ಸೌಲಭ್ಯಗಳ ಸಾರಾಂಶ)         */}
          {/* ========================================================================= */}
          <div className="bg-stone-900 text-white p-5 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-700">
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                  ಸಮಗ್ರ ಪಾವತಿ ಸಾರಾಂಶ (Grand Summary of Terminal Benefits)
                </span>
                <h3 className="text-xl font-bold font-kannada text-white mt-0.5">
                  ಒಟ್ಟು ನಿವೃತ್ತಿ ಇಡಿಗಂಟು ಮೊತ್ತ & ಮಾಸಿಕ ಪಿಂಚಣಿ ಸಾರಾಂಶ
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat('pension_calc_sheet');
                    setActiveSubTab('letters');
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition-all border-2 border-stone-700 shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರ ತಃಖ್ಯೆ ಮುದ್ರಿಸಿ (Print Statement)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-stone-800 p-3 rounded-lg border border-stone-700">
                <span className="text-stone-400 text-xs block">೧. ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG):</span>
                <span className="text-lg font-bold text-blue-300 font-mono-code mt-1 block">
                  {formatINR(selectedCase.calculation.dcrgSanctioned)}
                </span>
                <span className="text-[10px] text-stone-400">KCSR ನಿಯಮ 292B</span>
              </div>

              <div className="bg-stone-800 p-3 rounded-lg border border-stone-700">
                <span className="text-stone-400 text-xs block">೨. ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ (CVP):</span>
                <span className="text-lg font-bold text-purple-300 font-mono-code mt-1 block">
                  {formatINR(selectedCase.calculation.commutationLumpSum)}
                </span>
                <span className="text-[10px] text-stone-400">ಅಪವರ್ತನ {selectedCase.calculation.commutationFactor} (ವಯಸ್ಸು {selectedCase.calculation.ageNextBirthday})</span>
              </div>

              <div className="bg-stone-800 p-3 rounded-lg border border-stone-700">
                <span className="text-stone-400 text-xs block">೩. ರಜೆ ನಗದೀಕರಣ (EL Encashment):</span>
                <span className="text-lg font-bold text-amber-300 font-mono-code mt-1 block">
                  {formatINR(selectedCase.calculation.leaveEncashmentAmount)}
                </span>
                <span className="text-[10px] text-stone-400">{selectedCase.calculation.earnedLeaveDays} ದಿನಗಳ ಗಳಿಕೆ ರಜೆ</span>
              </div>

              <div className="bg-stone-800 p-3 rounded-lg border border-emerald-500/60 bg-emerald-950/40">
                <span className="text-emerald-300 text-xs block">೪. ಪ್ರತಿ ತಿಂಗಳ ನಿವ್ವಳ ಪಿಂಚಣಿ:</span>
                <span className="text-lg font-bold text-emerald-300 font-mono-code mt-1 block">
                  {formatINR(selectedCase.calculation.reducedMonthlyPension + selectedCase.calculation.daOnPension)}
                </span>
                <span className="text-[10px] text-stone-400">(ಮೂಲ {formatINR(selectedCase.calculation.reducedMonthlyPension)} + DA)</span>
              </div>
            </div>

            {/* Big Grand Total Highlight */}
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  ಒಟ್ಟು ಇಡಿಗಂಟು ಸೌಲಭ್ಯಗಳ ಪಾವತಿ ಮೊತ್ತ (Grand Total Lump Sum Amount):
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono-code mt-0.5 block">
                  {formatINR(selectedCase.calculation.totalTerminalLumpSum)}
                </span>
                <span className="text-xs font-bold text-stone-900 mt-1 block font-kannada">
                  (ಅಕ್ಷರಗಳಲ್ಲಿ: {numberToKannadaWords(selectedCase.calculation.totalTerminalLumpSum)} ರೂಪಾಯಿಗಳು ಮಾತ್ರ)
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block bg-stone-900 text-amber-300 font-mono-code text-xs px-3 py-1.5 rounded-lg border border-stone-800 font-bold">
                  BEO ಭದ್ರಾವತಿ ಕಾರ್ಯಾಲಯ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: ALL FORMAT LETTERS & SANCTION ORDERS STUDIO (NO QR CODE!)      */}
      {/* ========================================================================= */}
      {activeSubTab === 'letters' && selectedCase && (
        <div className="space-y-4">
          {/* Top Controls: Format Switcher & Actions */}
          <div className="bg-white p-3.5 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-stone-700 mr-1">ಅಧಿಕೃತ ಪತ್ರ / ಆದೇಶ:</span>

              <button
                type="button"
                onClick={() => setSelectedFormat('pension_calc_sheet')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'pension_calc_sheet' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ೪ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರ ತಃಖ್ಯೆ (Calc Sheet)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('form7')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'form7' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಪ್ರಪತ್ರ-೭ (Form 7)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('sanction_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'sanction_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಪಿಂಚಣಿ ಮಂಜೂರಾತಿ ಆದೇಶ
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('gratuity_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'gratuity_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಉಪದಾನ ಆದೇಶ (DCRG)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('commutation_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'commutation_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಪರಿವರ್ತನೆ ಆದೇಶ (CVP)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('el_encashment_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'el_encashment_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ರಜೆ ನಗದೀಕರಣ ಆದೇಶ
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('service_verification_cert')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'service_verification_cert' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಸೇವಾ ಪ್ರಮಾಣಪತ್ರ (SVC)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('form1_2')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'form1_2' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ನಮೂನೆ-೧ ಮತ್ತು ೨ (ಅರ್ಜಿ)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('form6')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'form6' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ನಮೂನೆ-೬ (ಸೇವಾ ಪರಿಶೀಲನೆ)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('provisional_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'provisional_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ತಾತ್ಕಾಲಿಕ ಪಿಂಚಣಿ (KCSR 341)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('ag_forwarding')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'ag_forwarding' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಮಹಾಲೆಕ್ಕಪಾಲರಿಗೆ ರವಾನೆ ಪತ್ರ
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('no_dues_cert')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'no_dues_cert' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ
              </button>
            </div>

            {/* Action Buttons: Print, Registry, Copy */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintDocument}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                title="A4 ಗಾತ್ರದಲ್ಲಿ ಮುದ್ರಿಸಿ ಅಥವಾ PDF ಉಳಿಸಿ"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>ಮುದ್ರಿಸಿ (Print A4)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveActiveLetterToRegistry}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                title="ಅಧಿಕೃತ ಜಾವಕ ರಿಜಿಸ್ಟ್ರಿಗೆ ಸೇರಿಸಿ"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ರಿಜಿಸ್ಟ್ರಿಗೆ ಉಳಿಸಿ</span>
              </button>

              <button
                type="button"
                onClick={handleCopyHtml}
                className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold p-2 rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] cursor-pointer"
                title="HTML ಪಠ್ಯ ನಕಲಿಸಿ"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Preview Card with A4 Paper Container (NO QR Code as per strict instruction) */}
          <div className="bg-stone-200/80 p-4 sm:p-8 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b] overflow-x-auto">
            <div className="max-w-[820px] mx-auto bg-white shadow-2xl rounded-sm p-4 sm:p-8 border border-stone-400 relative">
              {/* Official Karnataka Government Docket Badge / Reference Header (No QR Code!) */}
              <div className="absolute top-6 right-6 flex flex-col items-center bg-stone-50 p-2 border-2 border-stone-800 rounded shadow-sm text-center">
                <div className="font-bold text-[9px] text-stone-900 font-mono-code">ಅಧಿಕೃತ ಮುದ್ರಿಕೆ</div>
                <div className="text-[11px] font-mono-code font-bold text-stone-800">BEO / ಭದ್ರಾವತಿ</div>
                <div className="text-[9px] text-stone-600 font-mono-code font-bold mt-0.5">KGID: {selectedCase.kgidNumber}</div>
                <div className="text-[8px] bg-amber-200 text-stone-900 px-1 py-0.5 rounded font-mono-code font-bold mt-1">ಮೂಲ ದಾಖಲೆ</div>
              </div>

              {/* Rendered HTML */}
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: renderPensionFormatHtml(selectedFormat, selectedCase, DEFAULT_PENSION_OFFICE_CONFIG) 
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PHYSICAL DOCUMENTS CHECKLIST & MOVEMENT HISTORY                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'checklist' && selectedCase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Statutory 8 Documents Checklist */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900 font-kannada">
                  ಭೌತಿಕ ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ (Physical Documents Checklist)
                </h3>
                <p className="text-xs text-stone-500 font-kannada">
                  ಪ್ರಕರಣ: <strong>{selectedCase.employeeName}</strong> | ಕಡತ: <strong>{selectedCase.fileNumber}</strong>
                </p>
              </div>
              <span className="bg-amber-100 text-stone-900 font-bold px-2 py-0.5 rounded border border-stone-800 text-xs font-mono-code">
                {Object.values(selectedCase.checklist).filter(Boolean).length} / 8 ಪೂರ್ಣ
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { key: 'serviceBookVerified' as const, label: '೧. ಮೂಲ ಸೇವಾ ಪುಸ್ತಕ (Service Book - Volume I & II)', desc: 'ಎಲ್ಲಾ ವೇತನ ಬಡ್ತಿ ಮತ್ತು ಸೇವಾ ದೃಢೀಕರಣ ನಮೂದುಗಳು ಸಹಿ ಆಗಿರಬೇಕು.' },
                { key: 'form7Triplicate' as const, label: '೨. ಪ್ರಪತ್ರ-೭ (Form 7 - ೩ ಪ್ರತಿಗಳಲ್ಲಿ)', desc: 'ನೇಮಕಾತಿ ಪ್ರಾಧಿಕಾರದ ಸಹಿ ಮತ್ತು ಕಚೇರಿ ಅಧಿಕೃತ ಮೊಹರು ಹೊಂದಿರಬೇಕು.' },
                { key: 'jointPhotosAttested' as const, label: '೩. ಜಂಟಿ ಭಾವಚಿತ್ರಗಳು (Joint Photos - ೪ ಪ್ರತಿಗಳು)', desc: 'ಗೆಜೆಟೆಡ್ ಅಧಿಕಾರಿಯಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಭಾವಚಿತ್ರಗಳು.' },
                { key: 'specimenSignatures' as const, label: '೪. ಮಾದರಿ ಸಹಿ & ಹೆಬ್ಬೆರಳ ಗುರುತು (Specimen Signatures)', desc: 'ನಮೂನೆ-೧ ಮತ್ತು ನಮೂನೆ-೨ ರಂತೆ ೩ ಮಾದರಿ ಸಹಿಗಳು ಹಾಗೂ ಎಡಗೈ ಹೆಬ್ಬೆರಳ ಗುರುತು.' },
                { key: 'noDueCertificate' as const, label: '೫. ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ (No Dues Certificate - NDC)', desc: 'ಶಾಲೆ, ಇಲಾಖೆ ಹಾಗೂ ಸರ್ಕಾರಕ್ಕೆ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲವೆಂದು ದೃಢೀಕರಣ.' },
                { key: 'lastPayCertificate' as const, label: '೬. ಕೊನೆಯ ವೇತನ ಪ್ರಮಾಣಪತ್ರ (Last Pay Certificate - LPC)', desc: 'DDO ರವರಿಂದ ಅಧಿಕೃತವಾಗಿ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಕೊನೆಯ ತಿಂಗಳ ವೇತನ ಪ್ರಮಾಣಪತ್ರ.' },
                { key: 'form1And2Nomination' as const, label: '೭. ಪಿಂಚಣಿ ಅರ್ಜಿ & ನಾಮನಿರ್ದೇಶನ ಪತ್ರ (Form 1 & 2)', desc: 'ನೌಕರರ ಪೂರ್ಣ ವಿವರಗಳು ಮತ್ತು ಕುಟುಂಬ ಸದಸ್ಯರ ನಾಮನಿರ್ದೇಶನ ವಿವರಗಳು.' },
                { key: 'aadharBankPassbook' as const, label: '೮. ಆಧಾರ್ ಕಾರ್ಡ್ & ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಪ್ರತಿ', desc: 'ಪಿಂಚಣಿ ಜಮೆ ಮಾಡುವ ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ & IFSC ವಿವರಗಳ ದೃಢೀಕೃತ ಪ್ರತಿ.' },
              ].map(item => {
                const isChecked = selectedCase.checklist[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggleChecklist(selectedCase.id, item.key)}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked 
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950' 
                        : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isChecked ? (
                        <div className="w-5 h-5 rounded bg-emerald-700 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-stone-400 bg-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs font-kannada">{item.label}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: File Movement Tracking History */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b] space-y-4">
            <div className="pb-3 border-b-2 border-stone-800">
              <h3 className="font-bold text-base text-stone-900 font-kannada">
                ಕಡತ ಚಲನವಲನ ಇತಿಹಾಸ (File Movement & Audit Trail)
              </h3>
              <p className="text-xs text-stone-500 font-kannada">
                ಕಡತ ಸಂ: <strong>{selectedCase.fileNumber}</strong> | BEO ಕಾರ್ಯಾಲಯ ಭದ್ರಾವತಿ
              </p>
            </div>

            <div className="space-y-3">
              {selectedCase.movementHistory.map((mov, idx) => (
                <div key={mov.id} className="relative pl-6 pb-2 border-l-2 border-amber-500 text-xs">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                  <div className="font-bold text-stone-900">{mov.sentDate}</div>
                  <div className="text-stone-600 mt-0.5">
                    <strong>{mov.fromOfficer}</strong> ➔ <strong>{mov.toOfficer}</strong>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-200 mt-1 text-[11px] text-stone-700">
                    {mov.remarks}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Movement Add */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-300 text-xs space-y-2">
              <div className="font-bold text-stone-800">ಹೊಸ ಚಲನವಲನ ನಮೂದು (Forward File):</div>
              <input
                type="text"
                id="inp-mov-to"
                placeholder="ಸ್ವೀಕರಿಸುವ ಅಧಿಕಾರಿ (ಉದಾ: AAO / BEO / ಮಹಾಲೆಕ್ಕಪಾಲರು)"
                className="w-full p-2 border border-stone-300 rounded text-xs"
              />
              <textarea
                id="inp-mov-rem"
                placeholder="ಷರಾ / ಟಿಪ್ಪಣಿ ನಮೂದಿಸಿ..."
                className="w-full p-2 border border-stone-300 rounded text-xs resize-none"
                rows={2}
              />
              <button
                type="button"
                onClick={() => {
                  const toInput = (document.getElementById('inp-mov-to') as HTMLInputElement)?.value;
                  const remInput = (document.getElementById('inp-mov-rem') as HTMLTextAreaElement)?.value;
                  if (!toInput) {
                    showToast('ದಯವಿಟ್ಟು ಅಧಿಕಾರಿಯ ಹುದ್ದೆ ನಮೂದಿಸಿ.');
                    return;
                  }
                  const now = new Date().toISOString().split('T')[0];
                  const newMov = {
                    id: `mov-${Date.now()}`,
                    fromOfficer: currentUser?.displayName || 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು',
                    toOfficer: toInput,
                    sentDate: now,
                    remarks: remInput || 'ಕಡತವನ್ನು ಮುಂದಿನ ಕ್ರಮಕ್ಕಾಗಿ ರವಾನಿಸಲಾಗಿದೆ.',
                    statusAfterMove: selectedCase.status
                  };
                  setPensionCases(prev => prev.map(c => {
                    if (c.id === selectedCase.id) {
                      const updated = {
                        ...c,
                        movementHistory: [...c.movementHistory, newMov],
                        lastUpdated: now
                      };
                      setSelectedCase(updated);
                      return updated;
                    }
                    return c;
                  }));
                  (document.getElementById('inp-mov-to') as HTMLInputElement).value = '';
                  (document.getElementById('inp-mov-rem') as HTMLTextAreaElement).value = '';
                  showToast('ಕಡತ ಚಲನವಲನ ನಮೂದಿಸಲಾಗಿದೆ.');
                }}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded text-xs transition-all border border-stone-800 cursor-pointer"
              >
                ಕಡತ ರವಾನೆ ದಾಖಲಿಸಿ (Record Movement)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: ಭೌತಿಕ ಕಡತ ಅಂಟಿಸುವ ಅಧಿಕೃತ ಲೇಬಲ್‌ಗಳು (NO QR CODE!)                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'labels' && selectedCase && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-stone-900 font-kannada">
                ಭೌತಿಕ ಕಡತ ಅಂಟಿಸುವ ಲೇಬಲ್‌ಗಳು (Printable Adhesive Labels for Physical Files)
              </h3>
              <p className="text-xs text-stone-500 font-kannada">
                ಭೌತಿಕ ಕಡತಗಳಿಗೆ ಅಂಟಿಸಲು ಅಧಿಕೃತ ಮುದ್ರಿಕೆ ಸಹಿತ ಲೇಬಲ್ - ಕಚೇರಿ ಕಡತಗಳ ಭಂಡಾರ ಮತ್ತು ರ್ಯಾಕ್ ನಿರ್ವಹಣೆಗೆ
              </p>
            </div>
            <button
              onClick={handlePrintDocument}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] flex items-center gap-2 cursor-pointer text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>ಲೇಬಲ್‌ಗಳನ್ನು ಮುದ್ರಿಸಿ (Print Labels)</span>
            </button>
          </div>

          {/* Printable Labels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Label 1: Main Front Cover Label (No QR Code) */}
            <div className="bg-white border-2 border-dashed border-stone-800 rounded-lg p-5 shadow-sm space-y-3 relative">
              <div className="text-center pb-2 border-b-2 border-stone-800">
                <div className="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
                <div className="font-bold text-sm text-stone-950 font-kannada">ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ</div>
                <div className="font-bold text-xs bg-amber-400 text-stone-950 inline-block px-3 py-0.5 rounded mt-1">
                  ಪಿಂಚಣಿ ಮತ್ತು ನಿವೃತ್ತಿ ಕಡತ (PENSION DOCKET)
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 text-xs">
                  <div><strong>ಕಡತ ಸಂಖ್ಯೆ:</strong> <span className="font-mono-code font-bold text-base bg-stone-100 px-2 py-0.5 rounded border border-stone-400">{selectedCase.fileNumber}</span></div>
                  <div><strong>ಪ್ರಕರಣ ಸಂಖ್ಯೆ:</strong> <span className="font-mono-code font-bold">{selectedCase.caseNumber}</span></div>
                  <div><strong>ನೌಕರರ ಹೆಸರು:</strong> <span className="font-bold font-kannada text-sm text-stone-900">{selectedCase.employeeName}</span></div>
                  <div><strong>KGID ಸಂಖ್ಯೆ:</strong> <span className="font-mono-code font-bold">{selectedCase.kgidNumber}</span></div>
                  <div><strong>ಹುದ್ದೆ:</strong> {selectedCase.designation}</div>
                  <div><strong>ಶಾಲೆ / ಕಚೇರಿ:</strong> {selectedCase.officeOrSchool}</div>
                  <div><strong>ನಿವೃತ್ತಿ ದಿನಾಂಕ:</strong> <span className="font-bold text-rose-800 font-mono-code">{selectedCase.dor}</span></div>
                  <div><strong>ಶಾಖೆ:</strong> ಆ2 (ಸ.ಪ್ರಾ.ಶಿ)</div>
                </div>

                {/* Official Government Seal & Office Dispatch Docket Badge (NO QR) */}
                <div className="shrink-0 text-center border-2 border-stone-800 p-2.5 rounded bg-stone-50 min-w-[100px]">
                  <div className="font-bold text-xs font-mono-code text-stone-900">BEO OFFICE</div>
                  <div className="font-mono-code text-[11px] text-amber-800 font-bold mt-1">BHADRAVATHI</div>
                  <div className="text-[9px] font-bold text-stone-600 border-t border-stone-300 pt-1 mt-1">DAK VERIFIED</div>
                  <div className="text-[8px] bg-stone-900 text-amber-300 px-1 py-0.5 rounded font-mono-code mt-1 font-bold">ಆ2 ಶಾಖೆ</div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-300 text-[10px] text-stone-600 flex justify-between">
                <span>ರಕ್ಷಣಾ ವರ್ಗ: ಶಾಶ್ವತ ಕಡತ (Class A)</span>
                <span>ದಾಖಲಿಸಿದ ದಿನಾಂಕ: {selectedCase.createdAt}</span>
              </div>
            </div>

            {/* Label 2: File Spine / Side Strip Label (No QR Code) */}
            <div className="bg-white border-2 border-dashed border-stone-800 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="text-center pb-2 border-b-2 border-stone-800">
                <div className="font-bold text-xs">ಕಡತ ಪಟ್ಟಿಕೆ ಲೇಬಲ್ (FILE SPINE LABEL)</div>
                <div className="text-xs text-stone-600">ಕಡತಗಳ ರ್ಯಾಕ್‌ನಲ್ಲಿ ಸುಲಭವಾಗಿ ಗುರುತಿಸಲು</div>
              </div>

              <div className="bg-amber-100/60 p-3 rounded border border-amber-300 flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold font-mono-code text-stone-950">ಕಡತ: {selectedCase.fileNumber}</div>
                  <div className="font-bold font-kannada text-sm text-stone-900 mt-1">{selectedCase.employeeName}</div>
                  <div className="text-xs font-mono-code text-stone-700">KGID: {selectedCase.kgidNumber} • DOR: {selectedCase.dor}</div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-stone-900 text-amber-300 px-2 py-1 rounded text-xs font-mono-code font-bold border border-stone-700">
                    BEO/BHD/PEN
                  </span>
                  <div className="text-[10px] font-mono-code text-stone-700 mt-1 font-bold">ಆ2/ಸ.ಪ್ರಾ.ಶಿ</div>
                </div>
              </div>

              <div className="text-[10px] text-stone-500 text-center italic">
                ಕಡತಗಳ ಭಂಡಾರ (Record Room) • ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ ಭದ್ರಾವತಿ
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
