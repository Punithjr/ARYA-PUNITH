import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EducationLetter, MasterDocketFile, DakRegisterSummary, ActionNote, Employee, AdminAuthUser, DocumentAttachment, SchoolInstitution, OfficeSection, DepartmentSection } from './types';
import { DeptHeader, AppNavTab } from './components/DeptHeader';
import { LettersRegistry } from './components/LettersRegistry';
import { FilesDocketsView } from './components/FilesDocketsView';
import { OfficialLetterStudio } from './components/OfficialLetterStudio';
import { GeneralLetterStudio } from './components/GeneralLetterStudio';
import { ReportsAuditView } from './components/ReportsAuditView';
import { LetterEntryModal } from './components/LetterEntryModal';
import { LetterViewerModal } from './components/LetterViewerModal';
import { EmployeeRosterView } from './components/EmployeeRosterView';
import { EmployeeModal } from './components/EmployeeModal';
import { EmployeeUploadModal } from './components/EmployeeUploadModal';
import { AdminLogin } from './components/AdminLogin';
import { RtiFileModal } from './components/RtiFileModal';
import { RtiReplyStudio } from './components/RtiReplyStudio';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { MemorandumOrderStudio } from './components/MemorandumOrderStudio';
import { OrderFilesView } from './components/OrderFilesView';
import { SalaryChangesView } from './components/SalaryChangesView';
import { MemorandumReportsView } from './components/MemorandumReportsView';
import { UnifiedSearchView } from './components/UnifiedSearchView';
import { AdminSettingsPanel } from './components/AdminSettingsPanel';
import { SchoolManagementView } from './components/SchoolManagementView';
import { HomeDashboard, DEFAULT_OFFICE_SECTIONS } from './components/HomeDashboard';
import { Prapathra28Studio } from './components/Prapathra28Studio';
import { StatutoryCircularStudio } from './components/StatutoryCircularStudio';
import { PdfScannerView } from './components/PdfScannerView';
import { JpgConverterView } from './components/JpgConverterView';
import { ImageCompressorView } from './components/ImageCompressorView';
import { PdfCompressorView } from './components/PdfCompressorView';
import { PdfMergerView } from './components/PdfMergerView';
import { MasterDocketAuditModal } from './components/MasterDocketAuditModal';
import { FileDashboard } from './components/FileDashboard';
import { LeaveCalendarView } from './components/LeaveCalendarView';
import { PensionStudioView } from './components/PensionStudioView';
import { HrmsView } from './components/HrmsView';
import { UserManagementModal } from './components/UserManagementModal';
import { KcsrRtiChatbot } from './components/KcsrRtiChatbot';
import { RtiManagementView } from './components/RtiManagementView';
import { SEED_OFFICE_STAFF } from './components/OfficeStaffTable';
import { 
  getRegisteredOfficeUsers, 
  MAX_OFFICE_USERS, 
  fetchEmployeesFromFirestore, 
  saveSingleEmployeeToFirestore, 
  deleteEmployeeFromFirestore 
} from './lib/firebase';
import { Check, AlertCircle, Sparkles, Users, ArrowLeft, Camera } from 'lucide-react';

const MODULE_TITLES_KANNADA: Record<string, string> = {
  hrms: '೨೩. ಮಾನವ ಸಂಪನ್ಮೂಲ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ (HRMS 2.0 / Human Resource Management System)',
  fileDashboard: '೧. ಕಡತಗಳ ಡ್ಯಾಶ್ ಬೋರ್ಡ್ (Files Dashboard & Movement)',
  generalLetter: '೨. ಸಾಮಾನ್ಯ ಕಡತ / ಸಾಮಾನ್ಯ ಪತ್ರ ತಯಾರಿಸಿ (General Letter Studio)',
  drafter: '೨. ಸಾಮಾನ್ಯ ಕಡತ / ಸಾಮಾನ್ಯ ಪತ್ರ ತಯಾರಿಸಿ (General Letter Studio)',
  memorandum: '೩. ಜ್ಞಾಪನಾದೇಶ (Memorandum & Sanctions Studio)',
  prapathra28: '೪. ಪತ್ರ ೨೮ (ಪ್ರಪತ್ರ-೨೮ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ)',
  employees: '೫. ನೌಕರರ ಮಾಹಿತಿ (Employee Roster & Service Info)',
  leaveCalendar: '೬. ರಜ ಕ್ಯಾಲೆಂಡರ್ (Leave Calendar & Child Care Leave)',
  pension: '೭. ಪಿಂಚಣಿ & ನಿವೃತ್ತಿ ವೇತನ (Pension Studio)',
  orderFiles: '೮. ಆದೇಶ ಕಡತ (Official Order Dockets & Files)',
  salaryChanges: '೯. ವೇತನ ಬದಲಾವಣೆ (Salary Increment / Stage Changes)',
  reports: '೧೦. ವರದಿಗಳು (Reports & Statistics)',
  search: '೧೧. ಹುಡುಕಾಟ (Unified Search & Tracking)',
  settings: '೧೨. ಸೆಟ್ಟಿಂಗ್ಸ್ & ಡಿಡಿಓ ವಿವರ (Settings & DDO Setup)',
  schools: '೧೩. ಶಾಲೆಗಳು & ಅನುದಾನ (Schools Management)',
  circularStudio: '೧೪. ಶಾಸನಬದ್ಧ ಸುತ್ತಲೆ (Statutory Circular Studio)',
  masterAudit: '೧೫. ಕಡತ ಆಡಿತ್ (Docket Audit & Scrutiny)',
  rti: '೧೬. ಮಾಹಿತಿ ಹಕ್ಕು ರಿಜಿಸ್ಟರ್ & ೧೮. RTI ಪತ್ರ ವ್ಯವಹಾರ (RTI Management)',
  registry: '೧೭. ಪತ್ರಗಳು (ಆವಕ & ಜಾವಕ e-Dak Registry)',
  files: '೮. ಕಡತಗಳ ನಿರ್ವಹಣೆ (Master Docket Files)',
  pdfScanner: '೧೨. PDF ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್ (Office PDF Document Scanner & Compressor)',
  jpgConverter: '೧೯. ಜೆಪಿ ಕನ್ವರ್ಟ್ (JPEG to JPG Converter & Compressor)',
  imageCompressor: '೨೦. ಜೆಪಿಜಿ ಕಂಪ್ರೆಸ್ (JPG Image Compressor to 20KB/50KB/100KB)',
  pdfCompressor: '೨೧. PDF ಕಂಪ್ರೆಸರ್ (PDF Compressor & Size Reducer)',
  pdfMerger: '೨೨. PDF ವಿಲೀನ (PDF Merger & Document Consolidation)',
};

export default function App() {
  // Authentication State: 5 registered authorized users & Google/password auth
  const [currentUser, setCurrentUser] = useState<AdminAuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('edu_efms_auth_user') || sessionStorage.getItem('edu_efms_auth_user');
      const token = localStorage.getItem('edu_efms_auth_token') || sessionStorage.getItem('edu_efms_auth_token');
      if (saved && (token === 'admin-auth-session-zero0' || token?.startsWith('edu-auth-session-') || token?.startsWith('google-auth-session-'))) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved auth session:', e);
    }
    return null;
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [userSlotsCount, setUserSlotsCount] = useState<number>(5);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<AdminAuthUser[]>([]);

  const [letters, setLetters] = useState<EducationLetter[]>([]);
  const [files, setFiles] = useState<MasterDocketFile[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dakSummary, setDakSummary] = useState<DakRegisterSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Office Sections State - Strictly restricted to 'ಆ2' (ಸ.ಪ್ರಾ.ಶಿ) only
  const [sections, setSections] = useState<OfficeSection[]>(() => {
    try {
      localStorage.removeItem('edu_office_sections');
    } catch (e) {
      // ignore
    }
    return DEFAULT_OFFICE_SECTIONS;
  });
  const [activeSection, setActiveSection] = useState<OfficeSection | null>(() => DEFAULT_OFFICE_SECTIONS[0]);

  const handleAddSection = async (_secData: { code: string; name: string; description?: string }) => {
    showToast('ಸರ್ಕಾರಿ ಆದೇಶದಂತೆ ಕಛೇರಿಯ ವಿಭಾಗವನ್ನು ಕೇವಲ "ಆ2" (ಸ.ಪ್ರಾ.ಶಿ) ಗೆ ಮಾತ್ರ ಸೀಮಿತಗೊಳಿಸಲಾಗಿದೆ.');
  };

  // Navigation: Primary Karnataka Govt Memorandum Dashboard
  const [activeTab, setActiveTab] = useState<AppNavTab>('home');
  const [prapathraInitialMonth, setPrapathraInitialMonth] = useState<'January' | 'July'>('January');
  const [filesInitialFilter, setFilesInitialFilter] = useState<{ status?: string; priority?: 'all' | 'urgent' | 'normal' | 'dueSoon' | 'pending'; fileId?: string } | undefined>(undefined);
  const [jpgConverterInitialMode, setJpgConverterInitialMode] = useState<'imageToJpg' | 'pdfToJpg' | 'jpgToPdf'>('imageToJpg');

  // Modals & Active Viewers
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<EducationLetter | null>(null);
  const [viewingLetter, setViewingLetter] = useState<EducationLetter | null>(null);
  const [drafterPrefillLetter, setDrafterPrefillLetter] = useState<EducationLetter | null>(null);

  // RTI Modals & State
  const [isRtiModalOpen, setIsRtiModalOpen] = useState(false);
  const [selectedRtiFileForReply, setSelectedRtiFileForReply] = useState<MasterDocketFile | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<DocumentAttachment | null>(null);

  // Employee Modals & Selection for Studio Letters/Orders
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEmployeeUploadOpen, setIsEmployeeUploadOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeForStudio, setSelectedEmployeeForStudio] = useState<Employee | null>(null);
  const [isMasterAuditOpen, setIsMasterAuditOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Fetch all letters
  const fetchLetters = useCallback(async () => {
    try {
      const res = await fetch('/api/letters');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setLetters(data.letters || []);
      }
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    }
  }, []);

  // Fetch all master file dockets
  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  }, []);

  // Fetch dak register summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/reports/dak-summary');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setDakSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch dak summary:', err);
    }
  }, []);

// Utility to strictly deduplicate employee lists by ID, KGID, and Employee Code
export function deduplicateEmployees(list: Employee[]): Employee[] {
  if (!Array.isArray(list)) return [];
  const byId = new Map<string, Employee>();
  const byKgid = new Map<string, string>(); // kgid -> id
  const byCode = new Map<string, string>(); // code -> id

  const result: Employee[] = [];

  for (const emp of list) {
    if (!emp) continue;
    const empId = emp.id || (emp.kgidNumber ? `emp-${emp.kgidNumber}` : `emp-${Math.random().toString(36).substring(2, 9)}`);
    const cleanKgid = emp.kgidNumber ? String(emp.kgidNumber).trim() : '';
    const cleanCode = emp.employeeCode ? String(emp.employeeCode).trim() : '';

    // Check if employee already exists by ID, KGID, or Code
    const existingId = (byId.has(empId) ? empId : null) || 
      (cleanKgid && byKgid.has(cleanKgid) ? byKgid.get(cleanKgid) : null) || 
      (cleanCode && byCode.has(cleanCode) ? byCode.get(cleanCode) : null);

    if (existingId && byId.has(existingId)) {
      // Merge updates into the existing record
      const existing = byId.get(existingId)!;
      const merged: Employee = { 
        ...existing, 
        ...emp, 
        id: existingId,
        kgidNumber: cleanKgid || existing.kgidNumber,
        employeeCode: cleanCode || existing.employeeCode
      };
      byId.set(existingId, merged);
      const idx = result.findIndex(r => r.id === existingId);
      if (idx !== -1) result[idx] = merged;
    } else {
      const normalizedEmp: Employee = { ...emp, id: empId };
      byId.set(empId, normalizedEmp);
      if (cleanKgid) byKgid.set(cleanKgid, empId);
      if (cleanCode) byCode.set(cleanCode, empId);
      result.push(normalizedEmp);
    }
  }

  return result;
}

  // Fetch departmental employees establishment with durable multi-layer persistence
  const fetchEmployees = useCallback(async () => {
    // 1. Instant hydration from localStorage cache
    try {
      const cached = localStorage.getItem('edu_persistent_employees');
      if (cached) {
        const parsed: Employee[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEmployees(deduplicateEmployees(parsed));
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      // 2. Fetch from backend API (which loads from disk)
      let serverList: Employee[] = [];
      const res = await fetch('/api/employees');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        serverList = data.employees || [];
      }

      // 3. Fetch from Firestore Cloud backup
      let firestoreList: Employee[] = [];
      try {
        firestoreList = await fetchEmployeesFromFirestore();
      } catch (fErr) {
        console.warn('Firestore fetch employees note:', fErr);
      }

      // 4. Merge all sources safely
      const combinedPool = [
        ...serverList,
        ...firestoreList,
        ...SEED_OFFICE_STAFF
      ];

      try {
        const cached = localStorage.getItem('edu_persistent_employees');
        if (cached) {
          const parsed: Employee[] = JSON.parse(cached);
          if (Array.isArray(parsed)) combinedPool.push(...parsed);
        }
      } catch (e) {}

      const finalList = deduplicateEmployees(combinedPool);
      setEmployees(finalList);

      // Save sanitized list to localStorage
      try {
        localStorage.setItem('edu_persistent_employees', JSON.stringify(finalList));
      } catch (e) {}

      // If local/firestore had new employees, sync to server
      if (finalList.length > serverList.length) {
        fetch('/api/employees/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientEmployees: finalList }),
        }).catch(err => console.warn('Sync to server note:', err));
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  }, []);

  // Initial load
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchLetters(), fetchFiles(), fetchSummary(), fetchEmployees()]);
    setIsLoading(false);
  }, [fetchLetters, fetchFiles, fetchSummary, fetchEmployees]);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  // Synchronize 5 user slots count on mount
  useEffect(() => {
    getRegisteredOfficeUsers().then(users => {
      if (users && users.length > 0) {
        setUserSlotsCount(users.length);
        setAllRegisteredUsers(users);
      }
    }).catch(err => console.warn('Could not fetch user slots count:', err));
  }, []);

  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'Admin' || currentUser?.username === 'admin' || currentUser?.username === 'beo_admin';

  // Visible Letters based on user scoping
  const visibleLetters = useMemo(() => {
    if (isAdmin) {
      if (selectedUserFilter === 'all') return letters;
      return letters.filter(l => l.createdBy === selectedUserFilter || l.assignedOfficer?.includes(selectedUserFilter));
    }
    // Regular user: only their own letters
    const myId = currentUser?.id;
    const myUser = currentUser?.username;
    const myName = currentUser?.displayName;
    return letters.filter(l => 
      l.createdBy === myId || 
      l.createdBy === myUser || 
      l.createdBy === myName ||
      l.assignedOfficer?.includes(myName || '') ||
      !l.createdBy
    );
  }, [letters, isAdmin, selectedUserFilter, currentUser]);

  // Visible Dockets based on user scoping
  const visibleFiles = useMemo(() => {
    if (isAdmin) {
      if (selectedUserFilter === 'all') return files;
      return files.filter(f => f.createdBy === selectedUserFilter || f.currentCustodian?.includes(selectedUserFilter));
    }
    // Regular user: only their own dockets
    const myId = currentUser?.id;
    const myUser = currentUser?.username;
    const myName = currentUser?.displayName;
    return files.filter(f => 
      f.createdBy === myId || 
      f.createdBy === myUser || 
      f.createdBy === myName ||
      f.currentCustodian?.includes(myName || '') ||
      !f.createdBy
    );
  }, [files, isAdmin, selectedUserFilter, currentUser]);

  // Visible Employees (strictly deduplicated to guarantee unique React keys)
  const visibleEmployees = useMemo(() => {
    return deduplicateEmployees(employees);
  }, [employees]);

  const handleLoginSuccess = (user: AdminAuthUser, _token: string) => {
    setCurrentUser(user);
    showToast(`ಸ್ವಾಗತ! (Welcome) ${user.displayName || user.username} (${user.role})`);
  };

  const handleLogout = () => {
    localStorage.removeItem('edu_efms_auth_user');
    localStorage.removeItem('edu_efms_auth_token');
    sessionStorage.removeItem('edu_efms_auth_user');
    sessionStorage.removeItem('edu_efms_auth_token');
    setCurrentUser(null);
    showToast('ಲಾಗಿನ್‌ನಿಂದ ಯಶಸ್ವಿಯಾಗಿ ನಿರ್ಗಮಿಸಲಾಗಿದೆ (Logged out successfully)');
  };

  // Create or Update Letter in Registry
  const handleSaveLetter = async (letterData: Partial<EducationLetter>) => {
    if (editingLetter) {
      // Update
      const res = await fetch(`/api/letters/${editingLetter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letterData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update letter');

      setLetters(prev => prev.map(l => l.id === editingLetter.id ? data.letter : l));
      if (viewingLetter && viewingLetter.id === editingLetter.id) {
        setViewingLetter(data.letter);
      }
      showToast(`Updated correspondence "${data.letter.referenceNumber}"`);
    } else {
      // Create new
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letterData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log letter');

      setLetters(prev => [data.letter, ...prev]);
      showToast(`Recorded "${data.letter.referenceNumber}" into e-Dak registry`);
    }
    setEditingLetter(null);
    fetchSummary();
  };

  // Delete Letter
  const handleDeleteLetter = async (id: string) => {
    try {
      const res = await fetch(`/api/letters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLetters(prev => prev.filter(l => l.id !== id));
        if (viewingLetter && viewingLetter.id === id) {
          setViewingLetter(null);
        }
        showToast('Correspondence record archived/removed');
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete letter');
    }
  };

  // Append Minute Note to Letter
  const handleAddNoteToLetter = async (letterId: string, noteData: Partial<ActionNote>) => {
    const res = await fetch(`/api/letters/${letterId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to append note');

    setLetters(prev => prev.map(l => l.id === letterId ? data.letter : l));
    if (viewingLetter && viewingLetter.id === letterId) {
      setViewingLetter(data.letter);
    }
    showToast('Official minute note appended to file');
  };

  // Update Letter Status
  const handleUpdateLetterStatus = async (letterId: string, newStatus: string) => {
    const res = await fetch(`/api/letters/${letterId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');

    setLetters(prev => prev.map(l => l.id === letterId ? data.letter : l));
    if (viewingLetter && viewingLetter.id === letterId) {
      setViewingLetter(data.letter);
    }
    showToast(`Status updated to "${newStatus}"`);
    fetchSummary();
  };

  // Create new Master File Docket
  const handleCreateDocketFile = async (fileData: Partial<MasterDocketFile>) => {
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to open docket');

    setFiles(prev => [data.file, ...prev]);
    showToast(`Opened new master docket "${data.file.fileNumber}"`);
  };

  // Route / Move Docket File to another officer
  const handleMoveDocketFile = async (
    fileId: string, 
    fromOfficer: string, 
    toOfficer: string, 
    remarks: string, 
    newStatus?: string
  ) => {
    const res = await fetch(`/api/files/${fileId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromOfficer, toOfficer, remarks, newStatus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to transfer docket');

    setFiles(prev => prev.map(f => f.id === fileId ? data.file : f));
    showToast(`Docket transferred to ${toOfficer}`);
  };

  // Bulk Status Update for multiple selected dockets
  const handleBulkUpdateDocketStatus = async (fileIds: string[], newStatus: string) => {
    try {
      const res = await fetch('/api/files/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update docket status in bulk');

      if (data.files && Array.isArray(data.files)) {
        setFiles(prev => prev.map(f => {
          const updated = data.files.find((u: MasterDocketFile) => u.id === f.id);
          return updated || f;
        }));
      }
      showToast(`${fileIds.length} ಕಡತಗಳ ಸ್ಥಿತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ '${newStatus}' ಗೆ ನವೀಕರಿಸಲಾಗಿದೆ`);
    } catch (err: any) {
      showToast(err.message || 'ಬೃಹತ್ ಸ್ಥಿತಿ ಬದಲಾವಣೆ ವಿಫಲವಾಗಿದೆ');
      throw err;
    }
  };

  // Section Transfer utility with audit trail (Movement History with timestamp & initiating officer)
  const handleSectionTransfer = async (
    fileId: string,
    toSection: DepartmentSection,
    transferNote: string,
    initiatingOfficer: string
  ) => {
    try {
      const res = await fetch(`/api/files/${fileId}/transfer-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toSection, transferNote, initiatingOfficer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to transfer section');

      setFiles(prev => prev.map(f => f.id === fileId ? data.file : f));
      showToast(`ಕಡತವನ್ನು ಯಶಸ್ವಿಯಾಗಿ "${toSection}" ವಿಭಾಗಕ್ಕೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ`);
    } catch (err: any) {
      showToast(err.message || 'ವಿಭಾಗ ವರ್ಗಾವಣೆ ವಿಫಲವಾಗಿದೆ');
      throw err;
    }
  };

  // Handle Save RTI File (Calls POST /api/files with RTI payload)
  const handleSaveRtiFile = async (fileData: Partial<MasterDocketFile>, createInwardDak?: boolean) => {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fileData,
          isRtiFile: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save RTI docket');

      setFiles(prev => [data.file, ...prev]);

      // If user also requested an Inward Dak letter in the registry
      if (createInwardDak && data.file) {
        try {
          const rtiInwardLetter: Partial<EducationLetter> = {
            direction: 'inward',
            referenceNumber: data.file.rtiDetails?.applicationNumber || `RTI/IN/${Date.now().toString().slice(-4)}`,
            senderName: data.file.rtiDetails?.applicantName || 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿದಾರರು',
            senderDepartment: data.file.rtiDetails?.applicantAddress || 'ಭದ್ರಾವತಿ',
            senderDesignation: 'ಸಾರ್ವಜನಿಕರು (Citizen / Applicant)',
            recipientName: data.file.rtiDetails?.pioOfficer || 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ ಹಾಗೂ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು',
            recipientDepartment: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ',
            recipientDesignation: 'Public Information Officer (PIO)',
            subject: `ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿ: ${data.file.rtiDetails?.applicantName || ''} - ${data.file.rtiDetails?.informationSought?.substring(0, 60) || ''}...`,
            category: 'Public Grievance & RTI',
            section: 'Legal & Grievances',
            priority: 'Urgent',
            status: 'Under Review',
            fileNumber: data.file.fileNumber,
            dateReceivedOrIssued: data.file.rtiDetails?.applicationDate || new Date().toISOString().split('T')[0],
            dueDate: data.file.rtiDetails?.statutoryDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            assignedOfficer: data.file.rtiDetails?.pioOfficer || 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ, ಭದ್ರಾವತಿ',
            bodyText: `ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 ರ ಕಲಂ 6(1) ರಡಿಯಲ್ಲಿ ಸ್ವೀಕೃತವಾದ ಅರ್ಜಿ.\nಕೋರಲಾದ ಮಾಹಿತಿ: ${data.file.rtiDetails?.informationSought || ''}\nಲಗತ್ತಿಸಲಾದ ದಾಖಲೆಗಳು: ${(data.file.attachments || []).length} ಪ್ರತಿಗಳು.`,
            confidentiality: 'Public / Open',
            tags: ['RTI', 'ಮಾಹಿತಿ ಹಕ್ಕು', 'BEO Bhadravathi'],
            attachments: data.file.attachments || [],
          };
          const letRes = await fetch('/api/letters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rtiInwardLetter),
          });
          if (letRes.ok) {
            const letData = await letRes.json();
            setLetters(prev => [letData.letter, ...prev]);
          }
        } catch (letErr) {
          console.error('Failed to create linked inward dak for RTI:', letErr);
        }
      }

      setIsRtiModalOpen(false);
      showToast(`ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ "${data.file.fileNumber}" ಯಶಸ್ವಿಯಾಗಿ ಸೃಜಿಸಲಾಗಿದೆ`);
      fetchSummary();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'RTI ಕಡತ ಸೃಜಿಸಲು ವಿಫಲವಾಗಿದೆ');
      throw err;
    }
  };

  // Upload Attachment (PDF / JPG) directly to an existing docket file
  const handleUploadAttachmentToFile = async (fileId: string, attachment: DocumentAttachment) => {
    try {
      const res = await fetch(`/api/files/${fileId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachment),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload attachment');

      setFiles(prev => prev.map(f => f.id === fileId ? data.file : f));
      showToast(`ದಾಖಲೆ "${attachment.fileName}" ಯಶಸ್ವಿಯಾಗಿ ಲಗತ್ತಿಸಲಾಗಿದೆ`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'ದಾಖಲೆ ಲಗತ್ತಿಸಲು ವಿಫಲವಾಗಿದೆ');
      throw err;
    }
  };

  // Update RTI Status on Docket (and optionally mark closed)
  const handleUpdateRtiStatus = async (fileId: string, rtiStatus: string, replyRef: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}/rti`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rtiStatus, replyLetterReference: replyRef }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update RTI status');

      setFiles(prev => prev.map(f => f.id === fileId ? data.file : f));
      showToast(`ಮಾಹಿತಿ ಹಕ್ಕು ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ: "${rtiStatus}"`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'RTI ಸ್ಥಿತಿ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ');
    }
  };

  const handleOpenRtiReplyStudio = (file: MasterDocketFile) => {
    setSelectedRtiFileForReply(file);
    setActiveTab('rti');
  };

  // Reset to departmental seed data
  const handleResetDemo = async () => {
    if (!window.confirm('Reset Education Department registry and master dockets to official sample data?')) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        await loadAllData();
        showToast('Registry restored with state education department seed files');
      }
    } catch (err) {
      console.error(err);
      showToast('Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Letter Studio prefilled with a letter to reply to
  const handleOpenDrafterWithLetter = (letter: EducationLetter) => {
    setDrafterPrefillLetter(letter);
    setActiveTab('drafter');
  };

  // Calculate quick metrics for badges
  const pendingCount = letters.filter(l => l.status === 'Pending Action' || l.status === 'Under Review').length;

  // Employee Management Handlers
  const handleSaveEmployee = async (employeeData: Partial<Employee>, isEdit: boolean) => {
    if (isEdit && editingEmployee) {
      // 1. Immediately update UI state in optimistic/instant fashion so UI reflects changes with no delay
      const optimisticUpdated: Employee = {
        ...editingEmployee,
        ...employeeData,
        lastUpdated: new Date().toISOString().split('T')[0],
      } as Employee;

      setEmployees(prev => prev.map(e => {
        if (
          e.id === editingEmployee.id || 
          (editingEmployee.kgidNumber && e.kgidNumber === editingEmployee.kgidNumber) ||
          (employeeData.kgidNumber && e.kgidNumber === employeeData.kgidNumber) ||
          (editingEmployee.employeeCode && e.employeeCode === editingEmployee.employeeCode)
        ) {
          return optimisticUpdated;
        }
        return e;
      }));

      // 2. Persist to backend
      try {
        const res = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        });
        const data = await res.json();
        if (res.ok && data.employee) {
          const finalEmp = data.employee;
          setEmployees(prev => prev.map(e => {
            if (
              e.id === editingEmployee.id || 
              (editingEmployee.kgidNumber && e.kgidNumber === editingEmployee.kgidNumber) ||
              (employeeData.kgidNumber && e.kgidNumber === employeeData.kgidNumber) ||
              (editingEmployee.employeeCode && e.employeeCode === editingEmployee.employeeCode)
            ) {
              return { ...e, ...finalEmp };
            }
            return e;
          }));
        }
      } catch (err) {
        console.warn('Backend update failed, retaining optimistic state:', err);
      }
      showToast(`ನೌಕರರ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ ("${optimisticUpdated.fullName}")`);
      saveSingleEmployeeToFirestore(optimisticUpdated);

      if (employeeData.isDdo) {
        fetch('/api/memorandum/office-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ddoOfficerName: optimisticUpdated.fullName,
            ddoDesignation: optimisticUpdated.designation,
            ddoKgidNumber: optimisticUpdated.kgidNumber || '',
            ddoMobile: optimisticUpdated.phone || '',
            ddoEmail: optimisticUpdated.email || '',
            ddoEmployeeId: optimisticUpdated.id,
          }),
        }).catch(err => console.warn('DDO config sync note:', err));
      }

      try {
        const cached = localStorage.getItem('edu_persistent_employees');
        const list: Employee[] = cached ? JSON.parse(cached) : [];
        const updatedList = list.map(e => e.id === optimisticUpdated.id ? optimisticUpdated : e);
        localStorage.setItem('edu_persistent_employees', JSON.stringify(updatedList));
      } catch (e) {}
    } else {
      const newEmpId = `emp-${Date.now()}`;
      const newEmpObj: Employee = {
        id: newEmpId,
        employeeCode: employeeData.employeeCode || `EDN-EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: employeeData.fullName || 'ಹೊಸ ನೌಕರರು',
        designation: employeeData.designation || 'ಸಹಾಯಕ ಶಿಕ್ಷಕರು',
        section: employeeData.section || 'Academic Wing',
        officeLocation: employeeData.officeLocation || 'ಭದ್ರಾವತಿ',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        employmentType: employeeData.employmentType || 'Permanent',
        status: employeeData.status || 'Active',
        role: employeeData.role || 'Clerk / Assistant',
        joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        ...employeeData,
      } as Employee;

      setEmployees(prev => [newEmpObj, ...prev]);

      saveSingleEmployeeToFirestore(newEmpObj);

      if (employeeData.isDdo) {
        fetch('/api/memorandum/office-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ddoOfficerName: newEmpObj.fullName,
            ddoDesignation: newEmpObj.designation,
            ddoKgidNumber: newEmpObj.kgidNumber || '',
            ddoMobile: newEmpObj.phone || '',
            ddoEmail: newEmpObj.email || '',
            ddoEmployeeId: newEmpId,
          }),
        }).catch(err => console.warn('DDO config sync note:', err));
      }
      try {
        const cached = localStorage.getItem('edu_persistent_employees');
        const list: Employee[] = cached ? JSON.parse(cached) : [];
        localStorage.setItem('edu_persistent_employees', JSON.stringify([newEmpObj, ...list]));
      } catch (e) {}

      try {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        });
        const data = await res.json();
        if (res.ok && data.employee) {
          setEmployees(prev => prev.map(e => e.id === newEmpId ? data.employee : e));
          saveSingleEmployeeToFirestore(data.employee);
        }
      } catch (err) {
        console.warn('Backend create failed, retaining local state:', err);
      }
      showToast(`ಹೊಸ ನೌಕರರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ ("${newEmpObj.fullName}")`);
    }
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete employee record');
      setEmployees(prev => prev.filter(e => e.id !== id));
      deleteEmployeeFromFirestore(id);
      try {
        const cached = localStorage.getItem('edu_persistent_employees');
        if (cached) {
          const list: Employee[] = JSON.parse(cached);
          localStorage.setItem('edu_persistent_employees', JSON.stringify(list.filter(e => e.id !== id)));
        }
      } catch (e) {}
      showToast('Official removed from establishment roster');
    } catch (err: any) {
      showToast(err?.message || 'Error deleting employee');
    }
  };

  const handleBatchDeleteEmployees = async (ids: string[]) => {
    try {
      const res = await fetch('/api/employees/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete selected employees');
      const idSet = new Set(ids);
      setEmployees(prev => prev.filter(e => !idSet.has(e.id)));
      ids.forEach(id => deleteEmployeeFromFirestore(id));
      try {
        const cached = localStorage.getItem('edu_persistent_employees');
        if (cached) {
          const list: Employee[] = JSON.parse(cached);
          localStorage.setItem('edu_persistent_employees', JSON.stringify(list.filter(e => !idSet.has(e.id))));
        }
      } catch (e) {}
      showToast(data.message || `${ids.length} ನೌಕರರ ದಾಖಲೆಗಳನ್ನು ತೆಗೆಯಲಾಗಿದೆ`);
    } catch (err: any) {
      showToast(err?.message || 'Error removing selected employees');
    }
  };

  const handleClearAllEmployees = async () => {
    try {
      const res = await fetch('/api/employees-all', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear employees');
      setEmployees([]);
      showToast('ಎಲ್ಲಾ ನೌಕರರ ದಾಖಲೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆಗೆಯಲಾಗಿದೆ (All employees cleared)');
    } catch (err: any) {
      showToast(err?.message || 'Error clearing employees');
    }
  };

  const handleUpdateFileCategory = async (fileId: string, fileCategory: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update file category');
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, fileCategory } : f));
      showToast(`ಕಡತದ ಕ್ಯಾಟಗರಿಯನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ: ${fileCategory.split(' ')[0]}`);
    } catch (err: any) {
      showToast(err?.message || 'Error updating category');
    }
  };

  const handleUploadEmployeesSuccess = (summary: { importedCount: number; updatedCount: number; skippedCount: number }) => {
    fetchEmployees();
    showToast(`Bulk upload complete: ${summary.importedCount} imported, ${summary.updatedCount} updated.`);
  };

  const handleSeedEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/employees/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchEmployees();
        showToast(`ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಡೇಟಾ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ (${data.count} ನೌಕರರು)`);
      } else {
        throw new Error(data.error || 'Failed to seed employees');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error seeding employee data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDraftLetterForSchool = (school: SchoolInstitution, letterTypeKey: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (letterTypeKey === 'tmpl-school-recognition-order') {
      setDrafterPrefillLetter({
        category: 'other',
        recipient: `ಮುಖ್ಯಸ್ಥರು / ಆಡಳಿತ ಮಂಡಳಿ, ${school.schoolName}, ${school.address || 'ಭದ್ರಾವತಿ'}`,
        subject: `${school.schoolName} (UDISE: ${school.udiseCode}) ರವರಿಗೆ ೨೦೨೬-೨೭ ನೇ ಸಾಲಿಗೆ ಮಾನ್ಯತೆ ನವೀಕರಣ ಕಛೇರಿ ಆದೇಶ ನೀಡುವುದು.`,
        reference: `೧. ಆಡಳಿತ ಮಂಡಳಿಯ ಮನವಿ ದಿನಾಂಕ: ${todayStr}.\n೨. ಈ ಕಚೇರಿಯ ನೋಡಲ್ ಅಧಿಕಾರಿಗಳ ಸ್ಥಳ ತಪಾಸಣಾ ವರದಿ ದಿನಾಂಕ: ${todayStr}.\n೩. ಕರ್ನಾಟಕ ಶಿಕ್ಷಣ ಕಾಯ್ದೆ ೧೯೮೩ ರ ನಿಯಮಾವಳಿಗಳು.`,
        mainContent: `ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ, ${school.institutionName} ಸಂಸ್ಥೆಯ ಆಡಳಿತಕ್ಕೊಳಪಟ್ಟ ${school.schoolName}, ${school.address} (UDISE: ${school.udiseCode}) ಈ ಶಾಲೆಯು ಮಾನ್ಯತೆ ನವೀಕರಣಕ್ಕೆ ಸಲ್ಲಿಸಿರುವ ಪ್ರಸ್ತಾವನೆ ಹಾಗೂ ಮೂಲ ದಾಖಲಾತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.\n\nಶಾಲೆಗೆ ಸಂಬಂಧಿಸಿದ ಕಟ್ಟಡ ಸುರಕ್ಷತಾ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಅಗ್ನಿಶಾಮಕ ಇಲಾಖೆಯ ಸುರಕ್ಷತಾ ನಿರಾಕ್ಷೇಪಣಾ ಪತ್ರ (NOC) ಕ್ರಮಬದ್ಧವಾಗಿರುವುದು ದೃಢಪಟ್ಟ ಹಿನ್ನೆಲೆಯಲ್ಲಿ, ಸದರಿ ಶಾಲೆಗೆ ೨೦೨೬-೨೭ ನೇ ಶೈಕ್ಷಣಿಕ ಸಾಲಿಗೆ ಷರತ್ತುಬದ್ಧ ಮಾನ್ಯತೆ ನವೀಕರಣವನ್ನು ಈ ಮೂಲಕ ಮಂಜೂರು ಮಾಡಿ ಆದೇಶಿಸಿದೆ.`,
        otherInstructions: `೧. ಇಲಾಖಾ ನಿಯಮಾವಳಿಗಳಿಗೆ ಬದ್ಧವಾಗಿ ಗುಣಮಟ್ಟದ ಶಿಕ್ಷಣ ನೀಡತಕ್ಕದ್ದು.\n೨. ಯಾವುದೇ ಸಂದರ್ಭದಲ್ಲಿ ಸುರಕ್ಷತಾ ನಿಯಮಗಳನ್ನು ಉಲ್ಲಂಘಿಸಬಾರದು.\n೩. ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲಾತಿ ಹಾಗೂ ಹಾಜರಾತಿಯನ್ನು ಸ್ಯಾಟ್ಸ್ (SATS) ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನಿಗದಿತ ಅವಧಿಯೊಳಗೆ ಅಪ್‌ಡೇಟ್ ಮಾಡತಕ್ಕದ್ದು.`,
        officeName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ಭದ್ರಾವತಿ',
        date: todayStr,
      } as any);
      setActiveTab('generalLetter');
      showToast(`${school.schoolName} ಶಾಲೆಯ ಮಾನ್ಯತೆ ನವೀಕರಣ ಕಛೇರಿ ಆದೇಶ ಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ.`);
    } else if (letterTypeKey === 'tmpl-grant-proposal') {
      setDrafterPrefillLetter({
        category: 'other',
        recipient: `ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ, ಶಿವಮೊಗ್ಗ`,
        subject: `ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕಿನ ${school.schoolName} (UDISE: ${school.udiseCode}) ಶಾಲೆಯನ್ನು ವೇತನಾನುದಾನಕ್ಕೆ ಒಳಪಡಿಸುವ ಕುರಿತು ಪರಿಶೀಲನಾ ವರದಿ ಮತ್ತು ಪ್ರಸ್ತಾವನೆ ಸಲ್ಲಿಕೆ.`,
        reference: `೧. ಸರ್ಕಾರದ ಅಧಿಸೂಚನೆ ಸಂಖ್ಯೆ: ಇಡಿ ೧೪೪ ಎಸ್ಇಡಬ್ಲ್ಯೂ ೧೯೯೪.\n೨. ಸಂಸ್ಥೆಯ ಅಧ್ಯಕ್ಷರು/ಕಾರ್ಯದರ್ಶಿ ${school.institutionName} ರವರ ಮನವಿ ಪತ್ರ.\n೩. ಈ ಕಚೇರಿಯ ಪರಿಶೀಲನಾ ನಡವಳಿಗಳು.`,
        mainContent: `ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ${school.schoolName}, ${school.address} (ಸೊಸೈಟಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ: ${school.societyRegNumber || 'ಲಭ್ಯವಿಲ್ಲ'}) ಈ ಶಾಲೆಯು ಹಲವು ವರ್ಷಗಳಿಂದ ನಿರಂತರವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದ್ದು, ಪ್ರಸ್ತುತ ${school.studentCount || 100} ವಿದ್ಯಾರ್ಥಿಗಳು ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ.\n\nಸದರಿ ಸಂಸ್ಥೆಯು ವೇತನಾನುದಾನಕ್ಕೆ ಸರ್ಕಾರ ವಿಧಿಸಿರುವ ಎಲ್ಲಾ ಶೈಕ್ಷಣಿಕ, ಭೌತಿಕ ಹಾಗೂ ಆಡಳಿತಾತ್ಮಕ ಷರತ್ತುಗಳನ್ನು ಪೂರೈಸಿರುವುದು ಸ್ಥಳ ತಪಾಸಣೆಯಿಂದ ದೃಢಪಟ್ಟಿರುತ್ತದೆ. ಆದ್ದರಿಂದ ಸದರಿ ಶಾಲೆಯನ್ನು ಮತ್ತು ಮಂಜೂರಾದ ಬೋಧಕ ಹುದ್ದೆಗಳನ್ನು ವೇತನಾನುದಾನಕ್ಕೆ ಪರಿಗಣಿಸಲು ಶಿಫಾರಸು ಮಾಡಿ ಮೂಲ ಕಡತವನ್ನು ಈ ಮೂಲಕ ಮುಂದಿನ ಸೂಕ್ತ ಕ್ರಮಕ್ಕಾಗಿ ಗೌರವಪೂರ್ವಕವಾಗಿ ಸಲ್ಲಿಸಿದೆ.`,
        otherInstructions: `ಲಗತ್ತುಗಳು: ೧. ಸಂಸ್ಥೆಯ ನೋಂದಣಿ ಪ್ರಮಾಣಪತ್ರ, ೨. ವಿದ್ಯಾರ್ಥಿಗಳ ಹಾಜರಾತಿ ವಿವರ, ೩. ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿ ಹಾಗೂ ನೇಮಕಾತಿ ಅನುಮೋದನೆ ದಾಖಲೆಗಳು.`,
        officeName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ಭದ್ರಾವತಿ',
        date: todayStr,
      } as any);
      setActiveTab('generalLetter');
      showToast(`${school.schoolName} ಶಾಲೆಯ ವೇತನಾನುದಾನ ಪ್ರಸ್ತಾವನೆ ಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ.`);
    } else {
      // Default: Nodal Letter (ನೋಡಲ್ ಪತ್ರ)
      setDrafterPrefillLetter({
        category: 'other',
        recipient: `ನೋಡಲ್ ಅಧಿಕಾರಿಗಳು / ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳು (BCO), ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯ`,
        subject: `${school.schoolName} (UDISE: ${school.udiseCode}) ಶಾಲೆಯ ಮಾನ್ಯತೆ ನವೀಕರಣ ಪ್ರಸ್ತಾವನೆಯ ಸ್ಥಳ ಪರಿಶೀಲನೆ ನಡೆಸಿ ವರದಿ ಸಲ್ಲಿಸುವ ಬಗ್ಗೆ ನೋಡಲ್ ಪತ್ರ.`,
        reference: `೧. ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು, ${school.schoolName}, ಭದ್ರಾವತಿ ರವರ ಮನವಿ ದಿನಾಂಕ: ${todayStr}.\n೨. ಈ ಕಚೇರಿಯ ಆದೇಶ ಸಂಖ್ಯೆ: ಬಿಇಒ/ಮಾನ್ಯತೆ/೨೦೨೬-೨೭.`,
        mainContent: `ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ವಲಯ ವ್ಯಾಪ್ತಿಯ ${school.schoolName}, ${school.address} (ಸಂಸ್ಥೆ: ${school.institutionName}) ಈ ಶಾಲೆಯು ೨೦೨೬-೨೭ ನೇ ಸಾಲಿಗೆ ಮಾನ್ಯತೆ ನವೀಕರಣ ಕೋರಿ ಪ್ರಸ್ತಾವನೆ ಸಲ್ಲಿಸಿರುತ್ತಾರೆ.\n\nಆದ್ದರಿಂದ ತಾವುಗಳು ಸದರಿ ಶಾಲೆಗೆ ಭೇಟಿ ನೀಡಿ ಶಾಲೆಯ ಮೂಲಭೂತ ಸೌಕರ್ಯಗಳು, ಕೊಠಡಿಗಳ ವ್ಯವಸ್ಥೆ, ವಿದ್ಯಾರ್ಥಿ ದಾಖಲಾತಿ ಸಂಖ್ಯೆ, ಸಿಬ್ಬಂದಿ ವಿವರ, ಅಗ್ನಿಶಾಮಕ ಹಾಗೂ ಕಟ್ಟಡ ಸುರಕ್ಷತಾ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಕೂಲಂಕಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ೭ ದಿನಗಳೊಳಗಾಗಿ ಸ್ಪಷ್ಟ ಅಭಿಪ್ರಾಯದೊಂದಿಗೆ ಸ್ಥಳ ತನಿಖಾ ವರದಿಯನ್ನು ಈ ಕಚೇರಿಗೆ ಸಲ್ಲಿಸಲು ಸೂಚಿಸಲಾಗಿದೆ.`,
        otherInstructions: `ವಿಳಂಬಕ್ಕೆ ಅವಕಾಶವಿಲ್ಲದೆ ನಿಗದಿತ ಅವಧಿಯೊಳಗೆ ಪರಿಶೀಲನಾ ವರದಿ ಸಲ್ಲಿಸತಕ್ಕದ್ದು.`,
        officeName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ಭದ್ರಾವತಿ',
        date: todayStr,
      } as any);
      setActiveTab('generalLetter');
      showToast(`${school.schoolName} ಶಾಲೆಯ ನೋಡಲ್ ಪರಿಶೀಲನಾ ಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ.`);
    }
  };

  // If not authenticated, show Admin Login Gate
  if (!currentUser) {
    return (
      <>
        {/* Toast Alert */}
        {toastMessage && (
          <div 
            id="app-toast-alert"
            className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl border border-stone-800 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <Check className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffbf2] text-[#2b2b2b] font-sans flex flex-col selection:bg-amber-200 relative overflow-x-hidden">
      {/* Decorative squiggle background element from Variation 6 */}
      <div className="squiggle top-12 -right-16 opacity-40 pointer-events-none hidden lg:block" />
      <div className="squiggle bottom-24 -left-16 opacity-30 pointer-events-none hidden lg:block" />

      {/* Toast Alert */}
      {toastMessage && (
        <div 
          id="app-toast-alert"
          className="fixed bottom-6 right-6 z-50 bg-[#2b2b2b] text-[#fffbf2] text-xs font-bold px-4 py-3 rounded-lg shadow-[4px_4px_0px_#f59e0b] border-2 border-[#2b2b2b] flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="w-4 h-4 text-[#f59e0b]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Department Header */}
      <DeptHeader
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'drafter') {
            setDrafterPrefillLetter(null);
          }
        }}
        summary={dakSummary}
        onNewLetter={() => {
          setEditingLetter(null);
          setIsEntryModalOpen(true);
        }}
        onNewFile={() => {
          setActiveTab('files');
        }}
        onOpenNewRtiFile={() => {
          setIsRtiModalOpen(true);
        }}
        onOpenMasterAudit={() => {
          setIsMasterAuditOpen(true);
        }}
        onResetDemo={handleResetDemo}
        employeesCount={employees.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserModalOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        userSlotsCount={userSlotsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-400 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-stone-600">
              Synchronizing Education Department e-Dak registry and master dockets...
            </p>
          </div>
        ) : (
          <>
            {/* ADMIN WORKSPACE FILTER: 5 USERS MONITORING BAR (೫ ಬಳಕೆದಾರರು ಬಳಸುವ ಪತ್ರಗಳನ್ನು ವೀಕ್ಷಣೆ ಮಾಡಿ) */}
            {isAdmin ? (
              <div className="bg-amber-100/90 border-2 border-[#2b2b2b] px-4 py-2.5 rounded-xl mb-4 shadow-[3px_3px_0px_#2b2b2b] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-kannada">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#2b2b2b] text-[#f59e0b] font-bold font-mono text-[10px]">
                    ADMIN CONTROL
                  </span>
                  <span className="font-bold text-[#2b2b2b]">
                    ೫ ಬಳಕೆದಾರರ ಪತ್ರಗಳು & ಕಡತಗಳ ವೀಕ್ಷಣೆ (All 5 Users Monitoring):
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSelectedUserFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border-2 border-[#2b2b2b] cursor-pointer transition-all ${
                      selectedUserFilter === 'all'
                        ? 'bg-[#2b2b2b] text-[#f59e0b] shadow-[1px_1px_0px_#2b2b2b]'
                        : 'bg-white text-stone-700 hover:bg-amber-50'
                    }`}
                  >
                    ಎಲ್ಲಾ ೫ ಬಳಕೆದಾರರು ({letters.length} ಪತ್ರಗಳು)
                  </button>
                  {allRegisteredUsers.map((u, idx) => {
                    const uKey = u.id || u.username;
                    const uLettersCount = letters.filter(l => l.createdBy === uKey || l.assignedOfficer?.includes(u.displayName)).length;
                    return (
                      <button
                        key={uKey}
                        onClick={() => setSelectedUserFilter(uKey)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border-2 border-[#2b2b2b] cursor-pointer transition-all ${
                          selectedUserFilter === uKey
                            ? 'bg-[#2b2b2b] text-[#f59e0b] shadow-[1px_1px_0px_#2b2b2b]'
                            : 'bg-white text-stone-700 hover:bg-amber-50'
                        }`}
                        title={`${u.displayName} (${u.role})`}
                      >
                        ಬಳಕೆದಾರ-{idx + 1}: {u.displayName.split(' ')[0]} ({uLettersCount})
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-sky-50 border-2 border-[#2b2b2b] px-4 py-2.5 rounded-xl mb-4 shadow-[3px_3px_0px_#2b2b2b] flex items-center justify-between text-xs font-kannada">
                <div className="flex items-center gap-2 font-bold text-sky-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
                  <span>ಬಳಕೆದಾರರ ಪ್ರತ್ಯೇಕ ವಲಯ ({currentUser?.displayName} Workspace):</span>
                  <span className="text-stone-600 font-normal hidden sm:inline">
                    ನೀವು ಬಳಸುವ ಪತ್ರಗಳು ಹಾಗೂ ಕಡತಗಳನ್ನು ಮಾತ್ರ ಇಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತಿದೆ.
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-sky-200 text-sky-950 font-mono font-bold text-[11px] border border-sky-400">
                  {currentUser?.role || 'User'}
                </span>
              </div>
            )}

            {/* 18 MODULES RETURN-TO-HOME BAR (ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ) */}
            {activeTab !== 'home' && (
              <div className="mb-5 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border-2 border-[#2b2b2b] p-3 sm:p-3.5 rounded-xl shadow-[4px_4px_0px_#2b2b2b] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    id="btn-global-back-to-home"
                    onClick={() => setActiveTab('home')}
                    className="px-4 py-2 bg-[#2b2b2b] hover:bg-stone-800 text-[#f59e0b] font-bold text-xs rounded-lg flex items-center gap-2 transition-all cursor-pointer border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#f59e0b] hover:-translate-x-0.5 hover:-translate-y-0.5 shrink-0 font-kannada"
                    title="ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#f59e0b]" />
                    <span>&larr; ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ (Home)</span>
                  </button>
                  <div className="text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                      ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ನಿರ್ವಹಣಾ ಮಾಡ್ಯೂಲ್:
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-[#2b2b2b] font-kannada">
                      {MODULE_TITLES_KANNADA[activeTab] || activeTab}
                    </h3>
                  </div>
                </div>

                <div className="text-[11px] text-stone-700 hidden md:block text-right font-kannada">
                  ಕೆಲಸ ನಿರ್ವಹಣೆ ಮುಗಿದ ನಂತರ ಮೇಲಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ನೇರವಾಗಿ ಮುಖಪುಟಕ್ಕೆ ತೆರಳಬಹುದು.
                </div>
              </div>
            )}

            {/* MODULE 0: ಮುಖಪುಟ (HOME DASHBOARD - OFFICE DETAILS, SECTIONS, FILES & INCREMENT) */}
            {activeTab === 'home' && (
              <HomeDashboard
                currentUser={currentUser}
                employees={visibleEmployees}
                files={visibleFiles}
                letters={visibleLetters}
                sections={sections}
                activeSection={activeSection}
                onSelectSection={(sec) => setActiveSection(sec)}
                onAddSection={handleAddSection}
                onNavigate={(tab: AppNavTab, extra?: any) => {
                  if (extra?.prefillFileNumber) {
                    setDrafterPrefillLetter({
                      fileNumber: extra.prefillFileNumber,
                      sectionCode: extra.prefillSectionCode,
                      sectionName: extra.prefillSectionName,
                      subject: extra.prefillSubject,
                    } as any);
                  }
                  if (extra?.prefillStaff) {
                    setSelectedEmployeeForStudio(extra.prefillStaff);
                  }
                  if (extra?.prefillEmployee) {
                    setSelectedEmployeeForStudio(extra.prefillEmployee);
                  }
                  if (extra?.status || extra?.priority || extra?.fileId) {
                    setFilesInitialFilter({
                      status: extra.status,
                      priority: extra.priority,
                      fileId: extra.fileId,
                    });
                  }
                  if (extra?.mode) {
                    setJpgConverterInitialMode(extra.mode);
                  } else if (tab === 'jpgConverter') {
                    setJpgConverterInitialMode('imageToJpg');
                  }
                  setActiveTab(tab);
                }}
                onCreateFile={handleCreateDocketFile}
                onOpenPrapathra28WithMonth={(month) => {
                  setPrapathraInitialMonth(month);
                  setActiveTab('prapathra28');
                }}
                onRefreshEmployees={fetchEmployees}
                onRefreshFiles={fetchFiles}
                onRefreshLetters={fetchLetters}
                onOpenEmployeeInfo={() => {
                  setActiveTab('employees');
                }}
                onOpenPrapathra28={(month) => {
                  setPrapathraInitialMonth(month);
                  setActiveTab('prapathra28');
                }}
                onOpenGeneralLetterStudio={() => {
                  setActiveTab('generalLetter');
                }}
                onOpenMemorandumStudio={() => {
                  setActiveTab('memorandum');
                }}
                onOpenSchools={() => {
                  setActiveTab('schools');
                }}
                showToast={showToast}
              />
            )}

            {/* MODULE: ರಜೆ ಕ್ಯಾಲೆಂಡರ್ & ಕೋಟಾ ನಿರ್ವಹಣೆ (LEAVE CALENDAR & MATERNITY/CHILD CARE MANAGEMENT) */}
            {activeTab === 'leaveCalendar' && (
              <LeaveCalendarView
                employees={employees}
                currentUser={currentUser}
                onUpdateEmployee={async (updated) => {
                  setEmployees(prev => prev.map(e => (e.id === updated.id || (e.kgidNumber && e.kgidNumber === updated.kgidNumber)) ? updated : e));
                  try {
                    await fetch(`/api/employees/${updated.id || updated.kgidNumber}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updated),
                    });
                  } catch (err) {
                    console.warn('Failed to update employee in backend:', err);
                  }
                }}
                onOpenOrderForEmployee={(kgid) => {
                  const emp = employees.find(e => e.kgidNumber === kgid || e.id === kgid);
                  if (emp) setSelectedEmployeeForStudio(emp);
                  setActiveTab('memorandum');
                }}
                onDraftLetterForEmployee={(emp) => {
                  setSelectedEmployeeForStudio(emp);
                  setActiveTab('generalLetter');
                }}
                showToast={showToast}
              />
            )}

            {/* MODULE: ಪಿಂಚಣಿ ನಿರ್ವಹಣೆ & ಲೆಕ್ಕಾಚಾರ (PENSION CALCULATION & FORMATS STUDIO) */}
            {activeTab === 'pension' && (
              <PensionStudioView
                currentUser={currentUser}
                employees={visibleEmployees}
                files={visibleFiles}
                onSaveLetterToRegistry={handleSaveLetter}
                onAttachToDocketFile={(fileNum, docName) => {
                  showToast(`ಕಡತ ಸಂ: ${fileNum} ಗೆ ದಾಖಲೆ "${docName}" ಲಗತ್ತಿಸಲಾಗಿದೆ.`);
                }}
                onRefreshData={() => {
                  fetchEmployees();
                  fetchFiles();
                  fetchLetters();
                }}
                showToast={showToast}
              />
            )}

            {/* MODULE: ಮಾನವ ಸಂಪನ್ಮೂಲ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ (HRMS 2.0 / HUMAN RESOURCE MANAGEMENT SYSTEM) */}
            {activeTab === 'hrms' && (
              <HrmsView
                currentUser={currentUser}
                employees={visibleEmployees}
                onOpenEmployeeProfile={(emp) => {
                  setEditingEmployee(emp);
                  setIsEmployeeModalOpen(true);
                }}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
                onShowToast={showToast}
              />
            )}

            {/* MODULE: ಕಡತಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (FILE DASHBOARD & MOVEMENT TIMELINE) */}
            {activeTab === 'fileDashboard' && (
              <FileDashboard
                files={visibleFiles}
                letters={visibleLetters}
                onMoveFile={handleMoveDocketFile}
                onCreateFile={handleCreateDocketFile}
                onDraftLetterForFile={(file) => {
                  setDrafterPrefillLetter({
                    fileNumber: file.fileNumber,
                    sectionCode: file.sectionCode || 'ಆ2',
                    sectionName: file.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ',
                    subject: file.subject,
                  } as any);
                  setActiveTab('generalLetter');
                }}
                onViewLetter={(letter) => setViewingLetter(letter)}
                onShowToast={showToast}
              />
            )}

            {/* MODULE: ಪ್ರಪತ್ರ ೨೮ (PRAPATHRA 28 STUDIO) */}
            {activeTab === 'prapathra28' && (
              <Prapathra28Studio
                employees={visibleEmployees}
                currentUser={currentUser}
                initialMonth={prapathraInitialMonth}
                onRefreshEmployees={fetchEmployees}
                onLetterCreated={() => {
                  fetchLetters();
                  fetchFiles();
                }}
                showToast={showToast}
              />
            )}

            {/* MODULE 1: ಜ್ಞಾಪನಾ ಆದೇಶ (MEMORANDUM ORDERS GENERATOR) */}
            {activeTab === 'memorandum' && (
              <MemorandumOrderStudio
                currentUser={currentUser}
                employees={visibleEmployees}
                selectedEmployee={selectedEmployeeForStudio}
                onAddEmployeeGlobally={(newEmp) => {
                  setEmployees(prev => {
                    const exists = prev.some(e => e.id === newEmp.id || (newEmp.kgidNumber && e.kgidNumber === newEmp.kgidNumber));
                    if (exists) {
                      return prev.map(e => (e.id === newEmp.id || (newEmp.kgidNumber && e.kgidNumber === newEmp.kgidNumber)) ? newEmp : e);
                    }
                    return [newEmp, ...prev];
                  });
                }}
                onOrderCreated={() => {
                  fetchEmployees();
                  fetchFiles();
                  fetchLetters();
                  showToast('ಜ್ಞಾಪನಾ ಆದೇಶ ಯಶಸ್ವಿಯಾಗಿ ಸೃಜಿಸಲಾಗಿದೆ!');
                }}
                onViewOrderFiles={() => setActiveTab('orderFiles')}
              />
            )}

            {/* MODULE 2: ನೌಕರರ ಮಾಹಿತಿ (EMPLOYEE DATA DIRECTORY) */}
            {activeTab === 'employees' && (
              <EmployeeRosterView
                employees={visibleEmployees}
                letters={visibleLetters}
                files={visibleFiles}
                onAddEmployee={() => {
                  setEditingEmployee(null);
                  setIsEmployeeModalOpen(true);
                }}
                onEditEmployee={(emp) => {
                  setEditingEmployee(emp);
                  setIsEmployeeModalOpen(true);
                }}
                onUploadEmployees={() => {
                  setIsEmployeeUploadOpen(true);
                }}
                onDeleteEmployee={handleDeleteEmployee}
                onBatchDeleteEmployees={handleBatchDeleteEmployees}
                onClearAllEmployees={handleClearAllEmployees}
                onSelectLetter={(letter) => setViewingLetter(letter)}
                onSeedEmployees={handleSeedEmployees}
                onOpenServiceSanctions={(emp) => {
                  if (emp) setSelectedEmployeeForStudio(emp);
                  setActiveTab('memorandum');
                }}
                onDraftLetterForEmployee={(emp) => {
                  setSelectedEmployeeForStudio(emp);
                  setActiveTab('generalLetter');
                }}
                onOpenPrapathra28={() => {
                  setPrapathraInitialMonth('January');
                  setActiveTab('prapathra28');
                }}
                onGoBackHome={() => setActiveTab('home')}
              />
            )}

            {/* MODULE 3: ಆದೇಶಗಳ ಕಡತ (ORDER FILES ARCHIVE) */}
            {activeTab === 'orderFiles' && (
              <OrderFilesView
                currentUser={currentUser}
                onOpenOrderGenerator={() => setActiveTab('memorandum')}
              />
            )}

            {/* MODULE 4: ವೇತನ ಬದಲಾವಣೆ (SALARY CHANGES & PROGRESSION) */}
            {activeTab === 'salaryChanges' && (
              <SalaryChangesView
                currentUser={currentUser}
                onOpenOrderForEmployee={(kgid) => {
                  if (kgid) {
                    const emp = employees.find(e => e.kgidNumber === kgid);
                    if (emp) setSelectedEmployeeForStudio(emp);
                  }
                  setActiveTab('memorandum');
                }}
              />
            )}

            {/* MODULE 5: ವರದಿಗಳು (REPORTS & DUE LIST) */}
            {activeTab === 'reports' && (
              <MemorandumReportsView
                currentUser={currentUser}
                files={visibleFiles}
                letters={visibleLetters}
                onGenerateOrderForEmployee={(emp) => {
                  setActiveTab('memorandum');
                }}
              />
            )}

            {/* MODULE 6: ಹುಡುಕಾಟ (UNIFIED SEARCH) */}
            {activeTab === 'search' && (
              <UnifiedSearchView
                onSelectEmployee={() => setActiveTab('employees')}
                onSelectOrderTypeForKgid={() => setActiveTab('memorandum')}
                onViewOrder={() => setActiveTab('orderFiles')}
              />
            )}

            {/* MODULE 7: ಸೆಟ್ಟಿಂಗ್ಸ್ (ADMIN & PAY RULES SETTINGS) */}
            {activeTab === 'settings' && (
              <AdminSettingsPanel
                currentUser={currentUser}
                onRefreshData={() => {
                  fetchEmployees();
                }}
              />
            )}

            {/* MODULE 8: ಶಾಲೆಗಳು & ಅನುದಾನ ನಿರ್ವಹಣೆ (SCHOOLS, INSTITUTIONS & GRANTS) */}
            {activeTab === 'schools' && (
              <SchoolManagementView
                currentUser={currentUser}
                onDraftLetterForSchool={handleDraftLetterForSchool}
                onShowToast={showToast}
              />
            )}

            {/* CORRESPONDENCE / DAK REGISTRY */}
            {activeTab === 'registry' && (
              <LettersRegistry
                letters={visibleLetters}
                files={visibleFiles}
                employees={visibleEmployees}
                onViewLetter={(letter) => setViewingLetter(letter)}
                onEditLetter={(letter) => {
                  setEditingLetter(letter);
                  setIsEntryModalOpen(true);
                }}
                onDeleteLetter={handleDeleteLetter}
                onNewLetter={() => {
                  setEditingLetter(null);
                  setIsEntryModalOpen(true);
                }}
                onOpenDrafter={() => {
                  setDrafterPrefillLetter(null);
                  setActiveTab('drafter');
                }}
                onSummarizeLetter={(letter) => {
                  setViewingLetter(letter);
                }}
                onNavigateToEmployees={() => setActiveTab('employees')}
                onNavigateToFiles={() => setActiveTab('files')}
              />
            )}

            {/* MASTER FILES & DOCKET TRACKING (FTS) */}
            {activeTab === 'files' && (
              <FilesDocketsView
                files={visibleFiles}
                letters={visibleLetters}
                onCreateFile={handleCreateDocketFile}
                onMoveFile={handleMoveDocketFile}
                onSectionTransfer={handleSectionTransfer}
                onUpdateFileCategory={handleUpdateFileCategory}
                onBulkUpdateStatus={handleBulkUpdateDocketStatus}
                onSelectLetter={(letter) => setViewingLetter(letter)}
                onOpenNewRtiFile={() => setIsRtiModalOpen(true)}
                onOpenRtiReply={handleOpenRtiReplyStudio}
                onViewAttachment={(att) => setViewingAttachment(att)}
                onUploadAttachmentToFile={handleUploadAttachmentToFile}
                onOpenPdfScanner={() => setActiveTab('pdfScanner')}
                initialFilter={filesInitialFilter}
              />
            )}

            {/* DEDICATED GENERAL LETTER STUDIO (ಸಾಮಾನ್ಯ ಪತ್ರ ತಯಾರಿಸಿ) */}
            {(activeTab === 'generalLetter' || activeTab === 'drafter') && (
              <GeneralLetterStudio
                currentUser={currentUser}
                onSaveToRegistry={handleSaveLetter}
                prefilledLetter={drafterPrefillLetter}
                employees={visibleEmployees}
                prefilledEmployee={selectedEmployeeForStudio}
              />
            )}

            {/* RTI MANAGEMENT & CORRESPONDENCE (ಮಾಹಿತಿ ಹಕ್ಕು ಪತ್ರ ವ್ಯಾವಹಾರಗಳು ಮತ್ತು ನಿರ್ವಹಣೆ) */}
            {activeTab === 'rti' && (
              <RtiManagementView
                currentUser={currentUser}
                files={visibleFiles}
                onSaveLetterToRegistry={handleSaveLetter}
                showToast={showToast}
                initialDocketFile={selectedRtiFileForReply}
                onUploadAttachmentToFile={handleUploadAttachmentToFile}
                onViewAttachment={(att) => setViewingAttachment(att)}
                onCreateFile={handleCreateDocketFile}
              />
            )}

            {/* MODULE 9: ಶಾಸನಬದ್ಧ ಸುತ್ತೋಲೆಗಳು (STATUTORY CIRCULAR STUDIO) */}
            {activeTab === 'circularStudio' && (
              <StatutoryCircularStudio
                currentUser={currentUser}
                files={visibleFiles}
                employees={visibleEmployees}
                onSaveLetter={handleSaveLetter}
                onBackToHome={() => setActiveTab('home')}
              />
            )}

            {/* MODULE 12: PDF ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್ (PDF DOCUMENT SCANNER & COMPRESSOR) */}
            {activeTab === 'pdfScanner' && (
              <PdfScannerView
                files={visibleFiles}
                onAttachToDocket={async (fileId, attachment) => {
                  await handleUploadAttachmentToFile(fileId, attachment);
                  showToast('ದಾಖಲೆಯನ್ನು ಕಡತಕ್ಕೆ ಯಶಸ್ವಿಯಾಗಿ ಲಗತ್ತಿಸಲಾಗಿದೆ!');
                }}
                onBackToHome={() => setActiveTab('home')}
                showToast={showToast}
              />
            )}

            {/* MODULE 19: ಜೆಪಿ ಕನ್ವರ್ಟ್ (PDF & JPG CONVERTER) */}
            {activeTab === 'jpgConverter' && (
              <JpgConverterView
                key={jpgConverterInitialMode}
                initialMode={jpgConverterInitialMode}
                onBackToHome={() => setActiveTab('home')}
              />
            )}

            {/* MODULE 20: ಜೆಪಿಜಿ ಕಂಪ್ರೆಸ್ (JPG IMAGE COMPRESSOR TO 20KB/50KB/100KB) */}
            {activeTab === 'imageCompressor' && (
              <ImageCompressorView
                onBackToHome={() => setActiveTab('home')}
              />
            )}

            {/* MODULE 21: PDF ಕಂಪ್ರೆಸರ್ (PDF COMPRESSOR & SIZE REDUCER) */}
            {activeTab === 'pdfCompressor' && (
              <PdfCompressorView
                onBackToHome={() => setActiveTab('home')}
              />
            )}

            {/* MODULE 22: PDF ವಿಲೀನ (PDF MERGER & CONSOLIDATION) */}
            {activeTab === 'pdfMerger' && (
              <PdfMergerView
                onBackToHome={() => setActiveTab('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/90 py-6 text-center text-xs text-stone-500 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">
              Education Department Letters & Files Management System
            </span>
            <span>•</span>
            <span>Directorate of School & Higher Education</span>
          </div>
          <div className="text-[11px] text-stone-400">
            e-Office Compliant • Master Docket Auditing • Automated Statutory Circular Generation
          </div>
        </div>
      </footer>

      {/* MODAL 1: Inward / Outward Letter Data Entry */}
      <LetterEntryModal
        isOpen={isEntryModalOpen}
        initialLetter={editingLetter}
        employees={employees}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingLetter(null);
        }}
        onSave={handleSaveLetter}
      />

      {/* MODAL 2: Full Official Letterhead Document & Minute Sheet Viewer */}
      <LetterViewerModal
        letter={viewingLetter}
        isOpen={Boolean(viewingLetter)}
        onClose={() => setViewingLetter(null)}
        onEdit={(letter) => {
          setViewingLetter(null);
          setEditingLetter(letter);
          setIsEntryModalOpen(true);
        }}
        onOpenDrafterWithLetter={handleOpenDrafterWithLetter}
        onAddNote={handleAddNoteToLetter}
        onUpdateStatus={handleUpdateLetterStatus}
      />

      {/* MODAL 3: Employee Add & Edit Record */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        initialEmployee={editingEmployee}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
      />

      {/* MODAL 4: Employee Batch Upload Modal */}
      <EmployeeUploadModal
        isOpen={isEmployeeUploadOpen}
        onClose={() => setIsEmployeeUploadOpen(false)}
        onUploadSuccess={handleUploadEmployeesSuccess}
      />

      {/* MODAL 5: RTI File Creation & PDF/JPG Document Uploader */}
      <RtiFileModal
        isOpen={isRtiModalOpen}
        onClose={() => setIsRtiModalOpen(false)}
        onSaveRtiFile={handleSaveRtiFile}
        onOpenReplyStudioWithRti={handleOpenRtiReplyStudio}
      />

      {/* MODAL 6: Full PDF / JPG Document Viewer */}
      <DocumentViewerModal
        isOpen={Boolean(viewingAttachment)}
        attachment={viewingAttachment}
        onClose={() => setViewingAttachment(null)}
      />

      {/* MODAL 7: e-Office Compliant Master Docket Auditing */}
      {(isMasterAuditOpen || activeTab === 'masterAudit') && (
        <MasterDocketAuditModal
          isOpen={true}
          onClose={() => {
            setIsMasterAuditOpen(false);
            if (activeTab === 'masterAudit') setActiveTab('home');
          }}
          files={files}
          letters={letters}
          onUpdateFileCategory={handleUpdateFileCategory}
          onRefreshFiles={fetchFiles}
          onOpenRtiReply={handleOpenRtiReplyStudio}
        />
      )}

      {/* MODAL 8: ಕಛೇರಿ ೫ ಅಧಿಕೃತ ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ & ನೋಂದಣಿ (5 Users Only Management) */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          getRegisteredOfficeUsers()
            .then(list => setUserSlotsCount(list.length))
            .catch(() => {});
        }}
        currentUser={currentUser}
        onSelectUser={(user) => {
          setCurrentUser(user);
          const token = `edu-auth-session-${user.username}-${Date.now()}`;
          localStorage.setItem('edu_efms_auth_user', JSON.stringify(user));
          localStorage.setItem('edu_efms_auth_token', token);
          showToast(`${user.displayName} ಖಾತೆಗೆ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ.`);
        }}
        showToast={showToast}
      />

      {/* MODAL 9: KCSR & RTI AI ಸಹಾಯಕ (GEMINI CHATBOT) */}
      <KcsrRtiChatbot
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        currentUser={currentUser}
      />

      {/* FLOATING ACTION BUTTONS: FAST PDF SCANNER & AI CHATBOT TRIGGER */}
      {!isAiChatOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 no-print">
          {/* Quick PDF Scanner Button (Fast Document Scanning) */}
          <button
            id="floating-quick-scanner-btn"
            onClick={() => setActiveTab('pdfScanner')}
            className="bg-gradient-to-r from-emerald-800 via-teal-900 to-[#143024] text-white px-3.5 py-3 rounded-2xl shadow-[4px_4px_0px_#10b981] border-2 border-[#10b981]/90 hover:shadow-[6px_6px_0px_#10b981] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-2 font-bold font-kannada cursor-pointer group"
            title="PDF ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್ (Fast HD Document Scanner) ತಕ್ಷಣ ತೆರೆಯಿರಿ"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-400 text-stone-950 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4 text-emerald-950" />
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="block text-xs text-emerald-300 font-bold font-kannada">PDF ಸ್ಕ್ಯಾನರ್</span>
              <span className="block text-[11px] text-white/90">ದಾಖಲೆ ಸೆರೆಹಿಡಿ</span>
            </div>
          </button>

          {/* AI Chatbot Button */}
          <button
            id="floating-ai-chatbot-btn"
            onClick={() => setIsAiChatOpen(true)}
            className="bg-gradient-to-r from-purple-800 via-indigo-900 to-[#2b2b2b] text-white px-4 py-3 rounded-2xl shadow-[4px_4px_0px_#f59e0b] border-2 border-[#2b2b2b] hover:shadow-[6px_6px_0px_#f59e0b] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 font-bold font-kannada cursor-pointer group"
            title="KCSR & RTI AI ಸಹಾಯಕ (Gemini 3.8 Flash) ಆರಂಭಿಸಿ"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-stone-900 flex items-center justify-center shrink-0 shadow-sm group-hover:rotate-12 transition-transform">
              <Sparkles className="w-4 h-4 fill-amber-900 text-stone-950" />
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="block text-xs text-amber-300 font-bold font-kannada">KCSR & RTI</span>
              <span className="block text-[11px] text-white/90">AI ಸಹಾಯಕ</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

