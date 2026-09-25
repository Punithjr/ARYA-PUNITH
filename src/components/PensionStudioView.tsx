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
  QrCode, 
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
  FileSpreadsheet
} from 'lucide-react';
import QRCode from 'qrcode';
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

// Initial Sample Pension Cases for BEO Bhadravathi
const INITIAL_PENSION_CASES: PensionCaseRecord[] = [
  {
    id: 'pen-case-01',
    caseNumber: 'BEO/BHD/PEN/2026/01',
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
    retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)',
    payScale: '43100-1100-46400-1250-53900-1450-62600-1650-70850-1850-80400',
    lastBasicPay: 76550,
    daPercentage: 42.5,
    averageEmoluments: 76550,
    earnedLeaveDays: 284,
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
      lastBasicPay: 76550,
      daPercentage: 42.5,
      earnedLeaveDays: 284,
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
  // Navigation tabs within Pension Module
  const [activeSubTab, setActiveSubTab] = useState<'cases' | 'input' | 'letters' | 'checklist' | 'labels'>('cases');

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
  const [selectedFormat, setSelectedFormat] = useState<PensionLetterFormatType>('form7');

  // Search & Filter in Cases Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // QR Code Data URL for active letter/order
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // ---------------------------------------------------------------------------
  // NEW / EDIT PENSION CASE FORM STATE
  // ---------------------------------------------------------------------------
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fileNumber: '58',
    kgidNumber: '',
    employeeName: '',
    parentOrSpouseName: '',
    designation: 'ಮುಖ್ಯ ಶಿಕ್ಷಕರು (Headmaster)',
    cadreGroup: 'ಗ್ರೂಪ್-ಬಿ',
    officeOrSchool: 'ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ, ಭದ್ರಾವತಿ',
    gender: 'Male',
    dob: '1966-05-15',
    doa: '1995-06-01',
    dor: '2026-05-31',
    retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)' as PensionRetirementType,
    payScale: '43100-1100-46400-1250-53900-1450-62600-1650-70850-1850-80400',
    lastBasicPay: 65900,
    daPercentage: 42.5,
    averageEmoluments: 65900,
    earnedLeaveDays: 300,
    nonQualifyingDays: 0,
    commutationOpted: true,
    commutationPercentage: 40,
    ageNextBirthday: 61,
    nomineeName: '',
    nomineeRelation: 'ಪತ್ನಿ (Wife)',
    nomineeDob: '1970-01-01',
    bankName: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
    bankBranch: 'ಭದ್ರಾವತಿ ಶಾಖೆ',
    bankAccountNo: '',
    ifscCode: 'SBIN0000812',
    treasuryName: 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ',
    remarks: ''
  });

  // Quick Employee Search Dropdown Filter
  const [empSearch, setEmpSearch] = useState('');

  // Live Pension Calculation based on Form Data
  const liveCalculation = useMemo(() => {
    return computePensionDetails({
      doa: formData.doa,
      dor: formData.dor,
      dob: formData.dob,
      nonQualifyingDays: Number(formData.nonQualifyingDays) || 0,
      lastBasicPay: Number(formData.lastBasicPay) || 0,
      daPercentage: Number(formData.daPercentage) || 0,
      averageEmoluments: Number(formData.averageEmoluments) || Number(formData.lastBasicPay) || 0,
      earnedLeaveDays: Number(formData.earnedLeaveDays) || 0,
      commutationOpted: formData.commutationOpted,
      commutationPercentage: Number(formData.commutationPercentage) || 0,
      ageNextBirthday: Number(formData.ageNextBirthday) || 61
    });
  }, [
    formData.doa,
    formData.dor,
    formData.dob,
    formData.nonQualifyingDays,
    formData.lastBasicPay,
    formData.daPercentage,
    formData.averageEmoluments,
    formData.earnedLeaveDays,
    formData.commutationOpted,
    formData.commutationPercentage,
    formData.ageNextBirthday
  ]);

  // Handle selecting an employee from the staff directory to auto-fill
  const handleSelectEmployee = (emp: Employee) => {
    const dob = emp.dob || '1966-01-01';
    let dor = '2026-01-31';

    if (emp.dob) {
      try {
        const bDate = new Date(emp.dob);
        const rYear = bDate.getFullYear() + 60;
        const rMonth = bDate.getMonth();
        // Last day of month
        const lastDay = new Date(rYear, rMonth + 1, 0).getDate();
        const mStr = String(rMonth + 1).padStart(2, '0');
        dor = `${rYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
      } catch (e) {
        dor = '2026-05-31';
      }
    }

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
      dor,
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

  // Generate QR Code whenever selectedCase or selectedFormat changes
  useEffect(() => {
    if (!selectedCase) return;
    const refNum = `ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಪಿಂಚಣಿ/${selectedCase.kgidNumber}/${selectedFormat}/2026-27`;
    const qrData = `ಕನಾಟಕ ಸರ್ಕಾರ | ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ ಭದ್ರಾವತಿ\nಕಡತ: ${selectedCase.fileNumber}\nಪ್ರಕರಣ: ${selectedCase.caseNumber}\nಪತ್ರ ಸಂ: ${refNum}\nನೌಕರರು: ${selectedCase.employeeName}\nKGID: ${selectedCase.kgidNumber}\nಮೂಲ ಪಿಂಚಣಿ: ${formatINR(selectedCase.calculation.basicServicePension)}\nDCRG: ${formatINR(selectedCase.calculation.dcrgSanctioned)}\nದಿನಾಂಕ: ${selectedCase.dor}`;

    QRCode.toDataURL(qrData, { width: 140, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
  }, [selectedCase, selectedFormat]);

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
      nonQualifyingDays: Number(formData.nonQualifyingDays) || 0,
      lastBasicPay: Number(formData.lastBasicPay) || 0,
      daPercentage: Number(formData.daPercentage) || 0,
      averageEmoluments: Number(formData.averageEmoluments) || Number(formData.lastBasicPay) || 0,
      earnedLeaveDays: Number(formData.earnedLeaveDays) || 0,
      commutationOpted: formData.commutationOpted,
      commutationPercentage: Number(formData.commutationPercentage) || 0,
      ageNextBirthday: Number(formData.ageNextBirthday) || 61
    });

    const now = new Date().toISOString().split('T')[0];

    if (editingCaseId) {
      // Update existing
      setPensionCases(prev => prev.map(c => {
        if (c.id === editingCaseId) {
          return {
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
            retirementType: formData.retirementType,
            payScale: formData.payScale,
            lastBasicPay: Number(formData.lastBasicPay) || 0,
            daPercentage: Number(formData.daPercentage) || 0,
            averageEmoluments: Number(formData.averageEmoluments) || Number(formData.lastBasicPay) || 0,
            earnedLeaveDays: Number(formData.earnedLeaveDays) || 0,
            nonQualifyingDays: Number(formData.nonQualifyingDays) || 0,
            commutationOpted: formData.commutationOpted,
            commutationPercentage: Number(formData.commutationPercentage) || 0,
            ageNextBirthday: Number(formData.ageNextBirthday) || 61,
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
        }
        return c;
      }));

      const updated = pensionCases.find(c => c.id === editingCaseId);
      if (updated) setSelectedCase(updated);
      showToast('ಪಿಂಚಣಿ ಪ್ರಕರಣವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!');
    } else {
      // Create new
      const nextNum = pensionCases.length + 1;
      const padNum = String(nextNum).padStart(2, '0');
      const newCase: PensionCaseRecord = {
        id: `pen-case-${Date.now()}`,
        caseNumber: `BEO/BHD/PEN/2026/${padNum}`,
        fileNumber: formData.fileNumber,
        fileId: `file-pen-${formData.fileNumber}`,
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
        retirementType: formData.retirementType,
        payScale: formData.payScale,
        lastBasicPay: Number(formData.lastBasicPay) || 0,
        daPercentage: Number(formData.daPercentage) || 0,
        averageEmoluments: Number(formData.averageEmoluments) || Number(formData.lastBasicPay) || 0,
        earnedLeaveDays: Number(formData.earnedLeaveDays) || 0,
        nonQualifyingDays: Number(formData.nonQualifyingDays) || 0,
        commutationOpted: formData.commutationOpted,
        commutationPercentage: Number(formData.commutationPercentage) || 0,
        ageNextBirthday: Number(formData.ageNextBirthday) || 61,
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
          jointPhotosAttested: true,
          specimenSignatures: true,
          noDueCertificate: true,
          lastPayCertificate: false,
          form1And2Nomination: true,
          aadharBankPassbook: true
        },
        status: 'ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ (Drafting)',
        movementHistory: [
          {
            id: `mov-${Date.now()}`,
            fromOfficer: currentUser?.displayName || 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA)',
            toOfficer: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS - ಪಿಂಚಣಿ ಶಾಖೆ)',
            sentDate: now,
            remarks: 'ಹೊಸ ಪಿಂಚಣಿ ಕಡತ ಪ್ರಾರಂಭಿಸಿ ಸೇವಾ ಪರಿಶೀಲನೆಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.',
            statusAfterMove: 'ದಾಖಲಾತಿ ಹಂತದಲ್ಲಿದೆ (Drafting)'
          }
        ],
        remarks: formData.remarks,
        createdAt: now,
        lastUpdated: now
      };

      setPensionCases(prev => [newCase, ...prev]);
      setSelectedCase(newCase);
      showToast(`ಹೊಸ ಪಿಂಚಣಿ ಪ್ರಕರಣ ${newCase.caseNumber} ಮತ್ತು ಕಡತ ಸಂ: ${newCase.fileNumber} ಸೃಜಿಸಲಾಗಿದೆ!`);
    }

    setEditingCaseId(null);
    setActiveSubTab('cases');
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
      retirementType: c.retirementType,
      payScale: c.payScale,
      lastBasicPay: c.lastBasicPay,
      daPercentage: c.daPercentage,
      averageEmoluments: c.averageEmoluments || c.lastBasicPay,
      earnedLeaveDays: c.earnedLeaveDays,
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
      form7: 'ಪ್ರಪತ್ರ-೭ ಪಿಂಚಣಿ ಮತ್ತು ಉಪದಾನ ಮಂಜೂರಾತಿ ಪ್ರಸ್ತಾವನೆ',
      form1_2: 'ನಮೂನೆ-೧ ಮತ್ತು ೨ ಪಿಂಚಣಿ ಅರ್ಜಿ ಹಾಗೂ ಕುಟುಂಬ ನಾಮನಿರ್ದೇಶನ',
      form6: 'ನಮೂನೆ-೬ ಸೇವಾ ಪರಿಶೀಲನೆ ಹಾಗೂ ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ',
      sanction_order: 'ಪಿಂಚಣಿ ಮತ್ತು ನಿವೃತ್ತಿ ಉಪದಾನ ಮಂಜೂರಾತಿ ಜ್ಞಾಪನಾ ಆದೇಶ',
      provisional_order: 'ತಾತ್ಕಾಲಿಕ ಪಿಂಚಣಿ ಮತ್ತು ಉಪದಾನ ಮಂಜೂರಾತಿ ಆದೇಶ (KCSR 341)',
      commutation_order: 'ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ (CVP) ಮಂಜೂರಾತಿ ಆದೇಶ',
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
                ನಿವೃತ್ತಿ ವೇತನ ಲೆಕ್ಕಾಚಾರ, ನಮೂನೆ-೭, ಆದೇಶಗಳು, ಭೌತಿಕ ಕಡತ ನಿರ್ವಹಣೆ ಮತ್ತು QR ಕೋಡ್ ಪರಿಶೀಲನೆ
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
            <span>೧. ಪಿಂಚಣಿ ಪ್ರಕರಣಗಳು & ಕಡತಗಳು ({pensionCases.length})</span>
          </button>

          <button
            onClick={() => {
              if (!editingCaseId) {
                // reset form
                setFormData({
                  fileNumber: '58',
                  kgidNumber: '',
                  employeeName: '',
                  parentOrSpouseName: '',
                  designation: 'ಮುಖ್ಯ ಶಿಕ್ಷಕರು (Headmaster)',
                  cadreGroup: 'ಗ್ರೂಪ್-ಬಿ',
                  officeOrSchool: 'ಸ.ಹಿ.ಪ್ರಾ.ಶಾಲೆ, ಭದ್ರಾವತಿ',
                  gender: 'Male',
                  dob: '1966-05-15',
                  doa: '1995-06-01',
                  dor: '2026-05-31',
                  retirementType: 'ವಯೋನಿವೃತ್ತಿ (Superannuation - 60 Years)',
                  payScale: '43100-1100-46400-1250-53900-1450-62600-1650-70850-1850-80400',
                  lastBasicPay: 65900,
                  daPercentage: 42.5,
                  averageEmoluments: 65900,
                  earnedLeaveDays: 300,
                  nonQualifyingDays: 0,
                  commutationOpted: true,
                  commutationPercentage: 40,
                  ageNextBirthday: 61,
                  nomineeName: '',
                  nomineeRelation: 'ಪತ್ನಿ (Wife)',
                  nomineeDob: '1970-01-01',
                  bankName: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
                  bankBranch: 'ಭದ್ರಾವತಿ ಶಾಖೆ',
                  bankAccountNo: '',
                  ifscCode: 'SBIN0000812',
                  treasuryName: 'ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ',
                  remarks: ''
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
            <span>೨. ದತ್ತಾಂಶ ನಮೂದು & ಲೈವ್ ಲೆಕ್ಕಾಚಾರ</span>
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
            <span>೩. ಎಲ್ಲಾ ನಮೂನೆ ಪತ್ರಗಳು & ಆದೇಶಗಳು</span>
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
            <span>೪. ಭೌತಿಕ ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ</span>
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
            <span>೫. ಕಡತ ಅಂಟಿಸುವ ಲೇಬಲ್ & QR ಕೋಡ್</span>
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

            {/* Quick Employee Selector dropdown from Database */}
            <div className="mb-5 p-3 bg-amber-50 rounded-lg border border-amber-300">
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                ⚡ ನೌಕರರ ಡೇಟಾಬೇಸ್‌ನಿಂದ ತ್ವರಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಿ (Quick Auto-Fill from Staff Directory):
              </label>
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
                  ೧. ನೌಕರರ ಸೇವಾ ವಿವರಗಳು (Employee & Service Details)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ಕಡತ ಸಂಖ್ಯೆ (File No)*</label>
                    <input
                      type="text"
                      required
                      value={formData.fileNumber}
                      onChange={e => setFormData({ ...formData, fileNumber: e.target.value })}
                      placeholder="ಉದಾ: 58"
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
                      placeholder="ಉದಾ: 1515985"
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
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code"
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
                      min={0}
                      value={formData.earnedLeaveDays}
                      onChange={e => setFormData({ ...formData, earnedLeaveDays: Math.min(300, Math.max(0, Number(e.target.value) || 0)) })}
                      className="w-full p-2 border border-stone-300 rounded font-mono-code font-bold"
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
      {/* SUB-TAB 3: ALL FORMAT LETTERS & SANCTION ORDERS STUDIO                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'letters' && selectedCase && (
        <div className="space-y-4">
          {/* Top Controls: Format Switcher & Actions */}
          <div className="bg-white p-3 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-stone-700 mr-1">ನಮೂನೆ / ಪತ್ರ ಆಯ್ಕೆಮಾಡಿ:</span>

              <button
                onClick={() => setSelectedFormat('form7')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'form7' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಪ್ರಪತ್ರ-೭ (Form 7)
              </button>

              <button
                onClick={() => setSelectedFormat('sanction_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'sanction_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಪಿಂಚಣಿ ಮಂಜೂರಾತಿ ಆದೇಶ
              </button>

              <button
                onClick={() => setSelectedFormat('provisional_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'provisional_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ತಾತ್ಕಾಲಿಕ ಪಿಂಚಣಿ (KCSR 341)
              </button>

              <button
                onClick={() => setSelectedFormat('commutation_order')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'commutation_order' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಪರಿವರ್ತನೆ ಆದೇಶ (CVP)
              </button>

              <button
                onClick={() => setSelectedFormat('form1_2')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'form1_2' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ನಮೂನೆ-೧ ಮತ್ತು ೨ (ಅರ್ಜಿ)
              </button>

              <button
                onClick={() => setSelectedFormat('form6')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'form6' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ನಮೂನೆ-೬ (ಸೇವಾ ಪರಿಶೀಲನೆ)
              </button>

              <button
                onClick={() => setSelectedFormat('ag_forwarding')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-stone-800 cursor-pointer ${
                  selectedFormat === 'ag_forwarding' ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_#000]' : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                ಮಹಾಲೆಕ್ಕಪಾಲರಿಗೆ ರವಾನೆ ಪತ್ರ
              </button>

              <button
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
                onClick={handlePrintDocument}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                title="A4 ಗಾತ್ರದಲ್ಲಿ ಮುದ್ರಿಸಿ ಅಥವಾ PDF ಉಳಿಸಿ"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>ಮುದ್ರಿಸಿ (Print A4)</span>
              </button>

              <button
                onClick={handleSaveActiveLetterToRegistry}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                title="ಅಧಿಕೃತ ಜಾವಕ ರಿಜಿಸ್ಟ್ರಿಗೆ ಸೇರಿಸಿ"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ರಿಜಿಸ್ಟ್ರಿಗೆ ಉಳಿಸಿ</span>
              </button>

              <button
                onClick={handleCopyHtml}
                className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold p-2 rounded-lg transition-all border-2 border-stone-800 shadow-[2px_2px_0px_#000] cursor-pointer"
                title="HTML ಪಠ್ಯ ನಕಲಿಸಿ"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Preview Card with A4 Paper Container and Live QR Code */}
          <div className="bg-stone-200/80 p-4 sm:p-8 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_#2b2b2b] overflow-x-auto">
            <div className="max-w-[820px] mx-auto bg-white shadow-2xl rounded-sm p-4 sm:p-8 border border-stone-400 relative">
              {/* Dynamic QR Code Watermark / Tracking Header in Top Right Corner */}
              {qrCodeDataUrl && (
                <div className="absolute top-6 right-6 flex flex-col items-center bg-white/95 p-1.5 border border-stone-400 rounded shadow-sm text-center">
                  <img src={qrCodeDataUrl} alt="Document QR Verification" className="w-20 h-20" />
                  <span className="text-[8px] font-mono-code font-bold text-stone-700 mt-0.5">DAK QR VERIFY</span>
                  <span className="text-[7px] text-stone-500 font-mono-code">{selectedCase.kgidNumber}</span>
                </div>
              )}

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
      {/* SUB-TAB 5: PHYSICAL ADHESIVE LABELS & QR CODE GENERATOR                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'labels' && selectedCase && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2b2b2b] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-stone-900 font-kannada">
                ಭೌತಿಕ ಕಡತ ಅಂಟಿಸುವ ಲೇಬಲ್‌ಗಳು (Printable Adhesive Labels for Physical Files)
              </h3>
              <p className="text-xs text-stone-500 font-kannada">
                ಭೌತಿಕ ಕಡತಗಳಿಗೆ ಅಂಟಿಸಲು QR ಕೋಡ್ ಸಹಿತ ಲೇಬಲ್ - e-Office ಹಾಗೂ ಭೌತಿಕ ದತ್ತಾಂಶ ಮ್ಯಾಪಿಂಗ್
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
            {/* Label 1: Main Front Cover Label */}
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

                {qrCodeDataUrl && (
                  <div className="shrink-0 text-center border-2 border-stone-800 p-2 rounded bg-stone-50">
                    <img src={qrCodeDataUrl} alt="File QR" className="w-24 h-24" />
                    <span className="text-[9px] font-mono-code font-bold block mt-1">SCAN FOR DAK</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-300 text-[10px] text-stone-600 flex justify-between">
                <span>ರಕ್ಷಣಾ ವರ್ಗ: ಶಾಶ್ವತ ಕಡತ (Class A)</span>
                <span>ದಾಖಲಿಸಿದ ದಿನಾಂಕ: {selectedCase.createdAt}</span>
              </div>
            </div>

            {/* Label 2: File Spine / Side Strip Label */}
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
                {qrCodeDataUrl && (
                  <img src={qrCodeDataUrl} alt="Spine QR" className="w-16 h-16 border border-stone-400 bg-white p-1" />
                )}
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
