import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  FileSpreadsheet,
  FolderGit2,
  FileText,
  Award,
  School,
  FileCheck2,
  BarChart3,
  Plus,
  Printer,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  Copy,
  Tag,
  TrendingUp,
  Archive,
  Scale,
  Settings
} from 'lucide-react';
import {
  Employee,
  MasterDocketFile,
  EducationLetter,
  OfficeSection,
  AppNavTab
} from '../types';
import { OfficeStaffTable } from './OfficeStaffTable';
import { AidedSchoolsTable } from './AidedSchoolsTable';
import { AIDED_SCHOOLS_BHADRAVATHI } from '../data/csvEmployeesData';

export const DEFAULT_OFFICE_SECTIONS: OfficeSection[] = [
  {
    id: 'sec-a2',
    code: 'ಆ2',
    name: 'ಸ.ಪ್ರಾ.ಶಿ',
    description: 'ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ ಶಾಖೆ (ಆ2 - ಸ.ಪ್ರಾ.ಶಿ) - ಆಡಳಿತ, ವೇತನ, ಗಳಿಕೆ ರಜೆ, ಬಡ್ತಿ & ಕಡತಗಳ ನಿರ್ವಹಣೆ',
    isDefault: true
  },
];

interface HomeDashboardProps {
  employees?: Employee[];
  files?: MasterDocketFile[];
  letters?: EducationLetter[];
  sections?: OfficeSection[];
  activeSection?: OfficeSection | null;
  onSelectSection?: (section: OfficeSection) => void;
  onAddSection?: (section: { code: string; name: string; description?: string }) => Promise<void>;
  onNavigate?: (tab: AppNavTab, extra?: any) => void;
  onCreateFile?: (fileData: any) => Promise<void>;
  onOpenPrapathra28WithMonth?: (month: 'January' | 'July') => void;
  showToast: (msg: string) => void;
  currentUser?: any;
  onRefreshEmployees?: () => void;
  onRefreshFiles?: () => void;
  onRefreshLetters?: () => void;
  onOpenEmployeeInfo?: () => void;
  onOpenPrapathra28?: (month: 'January' | 'July') => void;
  onOpenGeneralLetterStudio?: () => void;
  onOpenMemorandumStudio?: () => void;
  onOpenSchools?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  employees = [],
  files = [],
  letters = [],
  sections = DEFAULT_OFFICE_SECTIONS,
  activeSection: propActiveSection,
  onSelectSection,
  onAddSection,
  onNavigate,
  onCreateFile,
  onOpenPrapathra28WithMonth,
  showToast,
  currentUser,
  onRefreshEmployees,
  onRefreshFiles,
  onRefreshLetters,
  onOpenEmployeeInfo,
  onOpenPrapathra28,
  onOpenGeneralLetterStudio,
  onOpenMemorandumStudio,
  onOpenSchools,
}) => {
  // Navigation Router Helper
  const navigateTo = (tab: AppNavTab, extra?: any) => {
    if (onNavigate) {
      onNavigate(tab, extra);
    } else {
      if (tab === 'employees' && onOpenEmployeeInfo) onOpenEmployeeInfo();
      else if (tab === 'prapathra28' && onOpenPrapathra28) onOpenPrapathra28('January');
      else if (tab === 'generalLetter' && onOpenGeneralLetterStudio) onOpenGeneralLetterStudio();
      else if (tab === 'memorandum' && onOpenMemorandumStudio) onOpenMemorandumStudio();
      else if (tab === 'schools' && onOpenSchools) onOpenSchools();
    }
  };

  const openPrapathraMonth = (month: 'January' | 'July') => {
    if (onOpenPrapathra28WithMonth) {
      onOpenPrapathra28WithMonth(month);
    } else if (onOpenPrapathra28) {
      onOpenPrapathra28(month);
    } else {
      navigateTo('prapathra28');
    }
  };

  const safeSections = sections && sections.length > 0 ? sections : DEFAULT_OFFICE_SECTIONS;
  const [internalActiveSection, setInternalActiveSection] = useState<OfficeSection>(
    propActiveSection || safeSections[0]
  );
  const activeSection = propActiveSection || internalActiveSection;

  const handleSelectSection = (sec: OfficeSection) => {
    setInternalActiveSection(sec);
    if (onSelectSection) onSelectSection(sec);
  };

  // Modal states
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState<MasterDocketFile | null>(null);
  const [letterForReprint, setLetterForReprint] = useState<EducationLetter | null>(null);

  // New File Form state
  const [newFileNo, setNewFileNo] = useState('');
  const [newFileSubject, setNewFileSubject] = useState('');
  const [newFileSectionCode, setNewFileSectionCode] = useState(activeSection?.code || 'ಆ1');
  const [newFileCustodian, setNewFileCustodian] = useState('ಕಛೇರಿ ಅಧೀಕ್ಷಕರು / ಸಿಬ್ಬಂದಿ ಶಾಖೆ');
  const [newFileNotes, setNewFileNotes] = useState('');
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);

  // New Section Form state
  const [newSecCode, setNewSecCode] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [newSecDesc, setNewSecDesc] = useState('');
  const [isSubmittingSection, setIsSubmittingSection] = useState(false);

  // Files search / filter
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [selectedFilterSection, setSelectedFilterSection] = useState<string>('all');

  // Counts for increments
  const januaryIncrementsCount = useMemo(() => {
    return (employees || []).filter(e => e.incrementMonth === 'January' || !e.incrementMonth).length;
  }, [employees]);

  const julyIncrementsCount = useMemo(() => {
    return (employees || []).filter(e => e.incrementMonth === 'July').length;
  }, [employees]);

  // Employee list states for 7 Core Modules
  const [empModuleSearch, setEmpModuleSearch] = useState('');
  const [empModuleFilter, setEmpModuleFilter] = useState<'all' | 'female' | 'jan' | 'july'>('all');
  const [empModuleLimit, setEmpModuleLimit] = useState(8);

  // All Menus Search & Category Filter for Dashboard
  const [allMenuSearch, setAllMenuSearch] = useState('');
  const [menuFilterCategory, setMenuFilterCategory] = useState<'all' | 'files' | 'letters' | 'salary' | 'schools' | 'admin'>('all');

  const allDashboardMenus = useMemo(() => [
    { id: 'fileDashboard', title: '೧. ಕಡತಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', desc: 'ಕಡತಗಳ ಚಲನವಲನ ಟೈಮ್‌ಲೈನ್, KSMOP ವರ್ಗೀಕರಣ', icon: FolderGit2, tab: 'fileDashboard' as AppNavTab, category: 'files', badge: 'KSMOP' },
    { id: 'generalLetter', title: '೨. ಸಾಮಾನ್ಯ ಕಡತ / ಪತ್ರ', desc: 'ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ & ಇತರೆ ಅಧಿಕೃತ ಪತ್ರ ಸ್ಟುಡಿಯೋ', icon: FileText, tab: 'generalLetter' as AppNavTab, category: 'letters', badge: 'ನಿಯಮಾನುಸಾರ' },
    { id: 'memorandum', title: '೩. ಜ್ಞಾಪನಾ ಆದೇಶ', desc: '10/15/20/25/30 ವರ್ಷ ಬಡ್ತಿ & ರಜೆ ಮಂಜೂರಾತಿ', icon: Award, tab: 'memorandum' as AppNavTab, category: 'letters', badge: 'ಸೇವಾ ಬಡ್ತಿ' },
    { id: 'prapathra28', title: '೪. ಪ್ರಪತ್ರ-೨೮ [ವೇತನ ಬಡ್ತಿ]', desc: 'ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಜನವರಿ & ಜುಲೈ ಪಟ್ಟಿ', icon: FileSpreadsheet, tab: 'prapathra28' as AppNavTab, category: 'salary', badge: 'ಜನವರಿ / ಜುಲೈ' },
    { id: 'employees', title: '೫. ನೌಕರರ ಮಾಹಿತಿ & ಸೇವೆ', desc: 'ಸೇವಾ ವಿವರ, DDO ಮತ್ತು ರಜೆ ಶಿಲ್ಕು ದಾಖಲೆಗಳು', icon: Users, tab: 'employees' as AppNavTab, category: 'salary', badge: 'DDO & ಶಿಲ್ಕು' },
    { id: 'leaveCalendar', title: '೬. ರಜೆ ಕ್ಯಾಲೆಂಡರ್ (180 ದಿನಗಳು)', desc: 'ಮಹಿಳಾ ಶಿಶುಪಾಲನ ರಜೆ & ಹೆರಿಗೆ ರಜೆ ನಿರ್ವಹಣೆ', icon: Calendar, tab: 'leaveCalendar' as AppNavTab, category: 'salary', badge: '180 ದಿನಗಳು' },
    { id: 'pension', title: '೭. ಪಿಂಚಣಿ & ನಿವೃತ್ತಿ ನಿರ್ವಹಣೆ', desc: 'ಪಿಂಚಣಿ ಲೆಕ್ಕಾಚಾರ, ನಮೂನೆ-೭, ಆದೇಶಗಳು', icon: Scale, tab: 'pension' as AppNavTab, category: 'salary', badge: 'KCSR ನಿವೃತ್ತಿ' },
    { id: 'orderFiles', title: '೮. ಆದೇಶಗಳ ಕಡತ', desc: 'ಹೊರಡಿಸಲಾದ ಅಧಿಕೃತ ಜ್ಞಾಪನಾ ಕಡತಗಳ ಭಂಡಾರ', icon: FileCheck2, tab: 'orderFiles' as AppNavTab, category: 'files', badge: 'ದಾಖಲೆಗಳು' },
    { id: 'salaryChanges', title: '೯. ಕೆಸಿಎಸ್‌ಆರ್ ವೇತನ ಕೋಷ್ಟಕ', desc: 'ವೇತನ ಮ್ಯಾಟ್ರಿಕ್ಸ್ ಹಾಗೂ ವೇತನ ಬದಲಾವಣೆ ಇತಿಹಾಸ', icon: TrendingUp, tab: 'salaryChanges' as AppNavTab, category: 'salary', badge: 'Pay Matrix' },
    { id: 'registry', title: '೧೦. ಆವಕ-ಜಾವಕ ಇ-ದಪ್ತರ್', desc: 'ಇನ್ವರ್ಡ್ ಮತ್ತು ಔಟ್ವರ್ಡ್ ಅಂಚೆ ನಿರ್ವಹಣೆ', icon: Tag, tab: 'registry' as AppNavTab, category: 'files', badge: 'e-Dak' },
    { id: 'files', title: '೧೧. ಕಡತಾಗಾರ & ಇ-ದಾಖಲೆಗಳು', desc: 'ಆ2 ಶಾಖೆಯ ಮಾಸ್ಟರ್ ಕಡತಗಳು & ನೋಂದಣಿ', icon: Archive, tab: 'files' as AppNavTab, category: 'files', badge: 'ಆ2 ಶಾಖೆ' },
    { id: 'schools', title: '೧೨. ಅನುದಾನಿತ ಶಾಲೆಗಳ ಪಟ್ಟಿ', desc: 'ಭದ್ರಾವತಿ ವ್ಯಾಪ್ತಿಯ ಅನುದಾನಿತ ಶಾಲೆಗಳ ಡೈರೆಕ್ಟರಿ', icon: School, tab: 'schools' as AppNavTab, category: 'schools', badge: 'ಭದ್ರಾವತಿ' },
    { id: 'drafter', title: '೧೩. ಅಧಿಕೃತ ಆದೇಶಗಳು / ಕರಡು', desc: 'ಅಧಿಕೃತ ಕಚೇರಿ ಆದೇಶಗಳು, ಕರಡು & ಇಲಾಖಾ ಪತ್ರಗಳು', icon: FileText, tab: 'drafter' as AppNavTab, category: 'letters', badge: 'ಕರಡು ಪ್ರತಿ' },
    { id: 'circularStudio', title: '೧೪. ಸುತ್ತೋಲೆಗಳು & ಇಲಾಖಾ ಆದೇಶಗಳು', desc: 'ಶೈಕ್ಷಣಿಕ ಸುತ್ತೋಲೆಗಳು, ಸರ್ಕಾರದ ಅಧಿಕೃತ ಆದೇಶಗಳು', icon: Sparkles, tab: 'circularStudio' as AppNavTab, category: 'letters', badge: 'Circulars' },
    { id: 'rti', title: '೧೫. ಆರ್‌ಟಿಐ ಕಡತಗಳು & ಅರ್ಜಿಗಳು', desc: 'ಮಾಹಿತಿ ಹಕ್ಕು ಉತ್ತರ ಪತ್ರಗಳು, ಕಲಂ ೬(೩) & ಮೇಲ್ಮನವಿ', icon: ShieldCheck, tab: 'rti' as AppNavTab, category: 'schools', badge: 'ಮಾಹಿತಿ ಹಕ್ಕು' },
    { id: 'reports', title: '೧೬. ಕಛೇರಿ ದೈನಂದಿನ ವರದಿ', desc: 'ದೈನಂದಿನ ಆಡಳಿತಾತ್ಮಕ ಕಡತ ವಿಲೇವಾರಿ ಸಾರಾಂಶ', icon: BarChart3, tab: 'reports' as AppNavTab, category: 'admin', badge: 'ವರದಿ' },
    { id: 'search', title: '೧೭. ಏಕೀಕೃತ ಶೋಧನೆ', desc: 'ಕಡತಗಳು, ನೌಕರರು, ಆದೇಶಗಳು & ಸುತ್ತೋಲೆಗಳು', icon: Search, tab: 'search' as AppNavTab, category: 'admin', badge: 'Search' },
    { id: 'settings', title: '೧೮. ಅಡ್ಮಿನ್ & ಕಛೇರಿ ಸೆಟ್ಟಿಂಗ್ಸ್', desc: 'ಕಛೇರಿ ಮಾಹಿತಿ, DDO ಸಹಿ ಕಾನ್ಫಿಗರೇಶನ್ & ನಿಯಮಗಳು', icon: Settings, tab: 'settings' as AppNavTab, category: 'admin', badge: 'DDO Setup' },
    { id: 'masterAudit', title: '೧೯. ಕಡತಗಳ ಮಾಸ್ಟರ್ ಆಡಿಟ್', desc: 'ಸಿಸ್ಟಮ್ ಆಡಿಟ್ ಲಾಗ್ಸ್, ಪರಿಶೀಲನೆ & ಬ್ಯಾಕಪ್', icon: Clock, tab: 'masterAudit' as AppNavTab, category: 'admin', badge: 'Audit' },
    { id: 'officialLetter', title: '೨೦. ಅಧಿಕೃತ ಪತ್ರ ಸ್ಟುಡಿಯೋ', desc: 'OCR ಆಧಾರಿತ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪತ್ರ ಹಾಗೂ ಆದೇಶಗಳು', icon: FileText, tab: 'officialLetter' as AppNavTab, category: 'letters', badge: 'Official Letter' },
  ], []);

  const filteredAllMenus = useMemo(() => {
    return allDashboardMenus.filter(m => {
      if (menuFilterCategory !== 'all' && m.category !== menuFilterCategory) return false;
      if (!allMenuSearch.trim()) return true;
      const q = allMenuSearch.toLowerCase();
      return m.title.toLowerCase().includes(q) || (m.desc && m.desc.toLowerCase().includes(q));
    });
  }, [allDashboardMenus, menuFilterCategory, allMenuSearch]);

  const femaleEmployeesCount = useMemo(() => {
    return (employees || []).filter(e => {
      const g = (e.gender || '').toLowerCase();
      return g.includes('female') || g.includes('ಮಹಿಳೆ') || e.fullName.includes('ಶ್ರೀಮತಿ') || e.childCareLeaveQuota !== undefined;
    }).length;
  }, [employees]);

  const filteredModuleEmployees = useMemo(() => {
    return (employees || []).filter(emp => {
      if (empModuleFilter === 'female') {
        const g = (emp.gender || '').toLowerCase();
        const isF = g.includes('female') || g.includes('ಮಹಿಳೆ') || emp.fullName.includes('ಶ್ರೀಮತಿ') || emp.childCareLeaveQuota !== undefined;
        if (!isF) return false;
      } else if (empModuleFilter === 'jan') {
        if (emp.incrementMonth !== 'January' && emp.incrementMonth) return false;
      } else if (empModuleFilter === 'july') {
        if (emp.incrementMonth !== 'July') return false;
      }

      if (!empModuleSearch.trim()) return true;
      const q = empModuleSearch.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        (emp.kgidNumber && emp.kgidNumber.includes(q)) ||
        (emp.designation && emp.designation.toLowerCase().includes(q)) ||
        (emp.placeOfWork && emp.placeOfWork.toLowerCase().includes(q)) ||
        (emp.officeLocation && emp.officeLocation.toLowerCase().includes(q))
      );
    });
  }, [employees, empModuleFilter, empModuleSearch]);

  // Enriched files with linked letters
  const enrichedFiles = useMemo(() => {
    return (files || []).map(f => {
      const linked = (letters || []).filter(l => l.fileNumber === f.fileNumber || f.linkedLetterIds?.includes(l.id));
      return {
        ...f,
        computedLetters: linked,
        computedCount: linked.length || f.lettersCount || f.linkedLetterIds?.length || 0
      };
    });
  }, [files, letters]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return enrichedFiles.filter(f => {
      if (selectedFilterSection !== 'all') {
        const matchesCode = f.sectionCode === selectedFilterSection || f.fileNumber.includes(selectedFilterSection);
        if (!matchesCode) return false;
      }
      if (!fileSearchTerm.trim()) return true;
      const term = fileSearchTerm.toLowerCase();
      return (
        f.fileNumber.toLowerCase().includes(term) ||
        f.subject.toLowerCase().includes(term) ||
        (f.sectionName && f.sectionName.toLowerCase().includes(term)) ||
        (f.sectionCode && f.sectionCode.toLowerCase().includes(term))
      );
    });
  }, [enrichedFiles, fileSearchTerm, selectedFilterSection]);

  // Handle File Creation
  const handleCreateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileSubject.trim()) {
      showToast('ದಯವಿಟ್ಟು ಫೈಲ್ ಹೆಸರು / ವಿಷಯ ನಮೂದಿಸಿ.');
      return;
    }

    const secObj = safeSections.find(s => s.code === newFileSectionCode) || activeSection || safeSections[0];
    const generatedNo = newFileNo.trim() || String(Math.floor(40 + Math.random() * 60));

    setIsSubmittingFile(true);
    try {
      if (onCreateFile) {
        await onCreateFile({
          fileNumber: generatedNo,
          subject: newFileSubject.trim(),
          section: 'Administration & Services',
          sectionCode: secObj?.code || 'ಆ1',
          sectionName: secObj?.name || 'ಸ.ಪ್ರಾ.ಶಿ',
          fileCategory: 'ವೇತನ & ಭತ್ಯೆ ಕಡತ (Salary & Increments)',
          currentCustodian: newFileCustodian.trim(),
          notes: newFileNotes.trim(),
          priority: 'Urgent',
        });
      }
      showToast(`ಕಡತ ಸಂಖ್ಯೆ: ${generatedNo} ಯಶಸ್ವಿಯಾಗಿ ಸೃಜಿಸಲಾಗಿದೆ!`);
      setShowCreateFileModal(false);
      setNewFileNo('');
      setNewFileSubject('');
      setNewFileNotes('');
    } catch (err) {
      showToast('ಕಡತ ಸೃಜಿಸುವಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.');
    } finally {
      setIsSubmittingFile(false);
    }
  };

  // Handle Section Creation
  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecCode.trim() || !newSecName.trim()) {
      showToast('ದಯವಿಟ್ಟು ವಿಭಾಗದ ಸಂಖ್ಯೆ (ಉದಾ: ಆ1) ಮತ್ತು ಹೆಸರು (ಉದಾ: ಸ.ಪ್ರಾ.ಶಿ) ನಮೂದಿಸಿ.');
      return;
    }

    setIsSubmittingSection(true);
    try {
      if (onAddSection) {
        await onAddSection({
          code: newSecCode.trim(),
          name: newSecName.trim(),
          description: newSecDesc.trim() || undefined,
        });
      }
      showToast(`ವಿಭಾಗ ${newSecCode.trim()} (${newSecName.trim()}) ಸೇರಿಸಲಾಗಿದೆ!`);
      setShowAddSectionModal(false);
      setNewSecCode('');
      setNewSecName('');
      setNewSecDesc('');
    } catch (err) {
      showToast('ವಿಭಾಗ ಸೇರಿಸುವಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.');
    } finally {
      setIsSubmittingSection(false);
    }
  };

  // Handle Trigger Print
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO TITLE & PORTAL TAG (Variation 6) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-b-2 border-[#2b2b2b] pb-6">
        <div>
          <span className="label-ink">BEO PORTAL • BHADRAVATHI</span>
          <h1 className="font-gaegu text-6xl sm:text-8xl font-bold text-[#2b2b2b] tracking-tight leading-[0.88] mt-2 -rotate-1">
            ಪತ್ರ ನಿರ್ವಹಣೆ
          </h1>
          <p className="text-sm font-bold text-[#2b2b2b] mt-2 font-kannada">
            ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ • ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-accent">SYSTEM: ACTIVE</span>
          <span className="label-emerald">KCSR 2026 READY</span>
          <span className="label-ink font-mono-code">{files.length} DOCKET FILES</span>
        </div>
      </div>

      {/* 2. MAIN HERO CANVAS GRID (Content Card + Stat Hero & Sticky Notice) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Hero Content Card (spans 2 cols on desktop) */}
        <div className="lg:col-span-2 content-card justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-ink">OFFICE DIRECTORY</span>
              <span className="label-accent">ಸಕ್ರಿಯ ವಿಭಾಗ: ಆ2 (ಸ.ಪ್ರಾ.ಶಿ)</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#2b2b2b] font-kannada leading-tight">
                ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ ಭದ್ರಾವತಿ
              </h2>
              <p className="text-xs font-mono-code text-stone-600 mt-1">
                B.H. ROAD, OLD TOWN, BHADRAVATHI, SHIVAMOGGA - 577301 • TEL: 08282-268241
              </p>
            </div>

            <p className="text-sm font-medium text-[#2b2b2b] font-kannada leading-relaxed">
              ತಾಲ್ಲೂಕಿನ ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ (ಆ2 - ಸ.ಪ್ರಾ.ಶಿ) ಹಾಗೂ ಅನುದಾನಿತ ಶಾಲೆಗಳ ಆಡಳಿತ, ನೌಕರರ ಜ್ಞಾಪನಾ ಆದೇಶ, ಪ್ರಪತ್ರ-೨೮ ವೇತನ ಬಡ್ತಿ, ರಜೆ ಮಂಜೂರಾತಿ, ಮಾಹಿತಿ ಹಕ್ಕು (RTI) ಹಾಗೂ ಕಡತಗಳ ಡಿಜಿಟಲ್ ನಿರ್ವಹಣಾ ತಂತ್ರಾಂಶ.
            </p>

            {/* Office Section Configuration - Strictly ಆ2 only */}
            <div className="pt-3 border-t-2 border-[#2b2b2b]/15">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2b2b2b] flex items-center gap-1.5 font-kannada">
                  <Layers className="w-4 h-4 text-[#f59e0b]" /> ಕಛೇರಿಯ ಸಕ್ರಿಯ ವಿಭಾಗ:
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-400 font-kannada">
                  ✓ ಕೇವಲ "ಆ2" ವಿಭಾಗ ಮಾತ್ರ ಅನುಮೋದಿತವಾಗಿದೆ
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  id="btn-sec-chip-a2"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border-2 border-[#2b2b2b] bg-[#2b2b2b] text-[#f59e0b] shadow-[2px_2px_0px_#f59e0b]"
                >
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-mono-code font-bold bg-[#f59e0b] text-[#2b2b2b]">
                    ಆ2
                  </span>
                  <span className="font-kannada">ಸ.ಪ್ರಾ.ಶಿ (ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ ಶಾಖೆ)</span>
                  <CheckCircle2 className="w-4 h-4 text-[#f59e0b] shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Pill button and e-Office Actions */}
          <div className="pt-5 flex flex-wrap items-center gap-3">
            <button
              id="hero-btn-explore-employees"
              onClick={() => navigateTo('employees')}
              className="cta-pill cursor-pointer hover:shadow-[6px_6px_0px_#f59e0b] transition-all"
            >
              ತಂತ್ರಾಂಶ ಪ್ರವೇಶಿಸಿ / ನೌಕರರ ಪಟ್ಟಿ ತೆರೆಯಿರಿ →
            </button>

            <button
              id="hero-btn-circular-studio"
              onClick={() => navigateTo('circularStudio')}
              className="px-4 py-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#f59e0b] hover:shadow-[6px_6px_0px_#f59e0b] transition-all flex items-center gap-2 cursor-pointer font-kannada"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>ಶಾಸನಬದ್ಧ ಸುತ್ತೋಲೆ ರಚಿಸಿ (Statutory Circulars) →</span>
            </button>

            <button
              id="hero-btn-master-audit"
              onClick={() => navigateTo('masterAudit')}
              className="px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:shadow-[6px_6px_0px_#2b2b2b] transition-all flex items-center gap-2 cursor-pointer font-kannada"
            >
              <ShieldCheck className="w-4 h-4 text-amber-800" />
              <span>e-Office ಕಡತ ಆಡಿಟ್ (Master Docket Auditing) →</span>
            </button>

            <button
              id="hero-btn-office-staff-table"
              onClick={() => {
                const el = document.getElementById('home-office-config-staff-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-3 bg-[#fffbf2] hover:bg-amber-100 text-[#2b2b2b] rounded-xl text-xs font-bold border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#f59e0b] hover:shadow-[6px_6px_0px_#f59e0b] transition-all flex items-center gap-2 cursor-pointer font-kannada"
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span>ಕಛೇರಿ ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿ (Staff Directory & Table) →</span>
            </button>

            <button
              id="hero-btn-all-menus"
              onClick={() => {
                const el = document.getElementById('home-all-menus-directory-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-3 bg-[#2b2b2b] hover:bg-stone-800 text-[#f59e0b] rounded-xl text-xs font-black border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#f59e0b] hover:shadow-[6px_6px_0px_#f59e0b] transition-all flex items-center gap-2 cursor-pointer font-kannada"
            >
              <Layers className="w-4 h-4 text-[#f59e0b]" />
              <span>ಎಲ್ಲಾ ಮೆನುಗಳ ಡೈರೆಕ್ಟರಿ (All System Menus) →</span>
            </button>
          </div>
        </div>

        {/* Right Side: Stat Hero & Sticky Notice */}
        <div className="flex flex-col gap-6 justify-between">
          {/* Stat Hero Box */}
          <div className="card-brutal p-6 bg-white flex flex-col justify-between flex-1 shadow-[8px_8px_0px_#10b981]">
            <span className="label-emerald">TOTAL RECORDS</span>
            <div className="stat-hero my-2">
              {employees.length + files.length}+
            </div>
            <p className="font-kannada text-xs font-bold text-[#2b2b2b]">
              {employees.length} ನೌಕರರು ಹಾಗೂ {files.length} ಕಡತಗಳು ನೈಜ ಸಮಯದಲ್ಲಿ ಲಭ್ಯವಿವೆ.
            </p>
          </div>

          {/* Sticky Notice */}
          <div className="notice-sticky">
            <span className="label-accent">NOTICE</span>
            <p className="font-kannada font-bold text-sm text-[#2b2b2b] mt-2 leading-snug">
              ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಪ್ರಪತ್ರ-೨೮ ಬಿಡುಗಡೆಗೊಂಡಿದೆ. ಜನವರಿ ({januaryIncrementsCount}) ಮತ್ತು ಜುಲೈ ({julyIncrementsCount}) ವೇತನ ಬಡ್ತಿ ಪಟ್ಟಿ ಕೂಡಲೇ ಪರಿಶೀಲಿಸಿ.
            </p>
            <button
              id="btn-notice-open-increment"
              onClick={() => navigateTo('prapathra28')}
              className="mt-3 text-xs font-black underline text-[#2b2b2b] hover:text-[#f59e0b] cursor-pointer flex items-center gap-1 font-kannada"
            >
              <span>ಪ್ರಪತ್ರ-೨೮ ವೇತನ ಬಡ್ತಿ ತೆರೆಯಿರಿ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2.5 ALL SYSTEM MENUS & QUICK NAVIGATION DIRECTORY (ಸಮಗ್ರ ಮೆನುಗಳು & ತ್ವರಿತ ನ್ಯಾವಿಗೇಷನ್ ಡೈರೆಕ್ಟರಿ) */}
      <div id="home-all-menus-directory-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#2b2b2b] pb-2">
          <div className="flex items-center gap-2">
            <span className="label-ink font-bold">ALL MENUS ({allDashboardMenus.length})</span>
            <h2 className="font-gaegu text-3xl sm:text-4xl font-black text-[#2b2b2b] tracking-tight">
              ಸಮಗ್ರ ಮೆನುಗಳು & ತ್ವರಿತ ನ್ಯಾವಿಗೇಷನ್ ಡೈರೆಕ್ಟರಿ
            </h2>
          </div>
          <span className="text-xs font-bold text-[#2b2b2b] bg-amber-100 px-3 py-1 rounded-full border-2 border-[#2b2b2b] font-kannada">
            ಒಟ್ಟು {allDashboardMenus.length} ಸಿಸ್ಟಮ್ ಮಾಡ್ಯೂಲ್‌ಗಳು ಲಭ್ಯ
          </span>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMenuFilterCategory('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg border-2 transition-all font-kannada cursor-pointer ${
                menuFilterCategory === 'all'
                  ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-[#2b2b2b]'
              }`}
            >
              ಎಲ್ಲಾ ಮೆನುಗಳು ({allDashboardMenus.length})
            </button>
            <button
              type="button"
              onClick={() => setMenuFilterCategory('files')}
              className={`px-3 py-1 text-xs font-bold rounded-lg border-2 transition-all font-kannada cursor-pointer ${
                menuFilterCategory === 'files'
                  ? 'bg-[#f59e0b] text-[#2b2b2b] border-[#2b2b2b]'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-[#2b2b2b]'
              }`}
            >
              📁 ಕಡತಗಳು ({allDashboardMenus.filter(m => m.category === 'files').length})
            </button>
            <button
              type="button"
              onClick={() => setMenuFilterCategory('letters')}
              className={`px-3 py-1 text-xs font-bold rounded-lg border-2 transition-all font-kannada cursor-pointer ${
                menuFilterCategory === 'letters'
                  ? 'bg-[#f97316] text-white border-[#2b2b2b]'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-[#2b2b2b]'
              }`}
            >
              ✉️ ಪತ್ರ & ಆದೇಶಗಳು ({allDashboardMenus.filter(m => m.category === 'letters').length})
            </button>
            <button
              type="button"
              onClick={() => setMenuFilterCategory('salary')}
              className={`px-3 py-1 text-xs font-bold rounded-lg border-2 transition-all font-kannada cursor-pointer ${
                menuFilterCategory === 'salary'
                  ? 'bg-[#10b981] text-white border-[#2b2b2b]'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-[#2b2b2b]'
              }`}
            >
              💰 ವೇತನ & ನೌಕರರು ({allDashboardMenus.filter(m => m.category === 'salary').length})
            </button>
            <button
              type="button"
              onClick={() => setMenuFilterCategory('schools')}
              className={`px-3 py-1 text-xs font-bold rounded-lg border-2 transition-all font-kannada cursor-pointer ${
                menuFilterCategory === 'schools'
                  ? 'bg-[#0284c7] text-white border-[#2b2b2b]'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-[#2b2b2b]'
              }`}
            >
              🏫 ಶಾಲೆಗಳು & RTI ({allDashboardMenus.filter(m => m.category === 'schools').length})
            </button>
            <button
              type="button"
              onClick={() => setMenuFilterCategory('admin')}
              className={`px-3 py-1 text-xs font-bold rounded-lg border-2 transition-all font-kannada cursor-pointer ${
                menuFilterCategory === 'admin'
                  ? 'bg-[#44403c] text-white border-[#2b2b2b]'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-[#2b2b2b]'
              }`}
            >
              ⚙️ ಆಡಳಿತ & ವರದಿ ({allDashboardMenus.filter(m => m.category === 'admin').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={allMenuSearch}
              onChange={(e) => setAllMenuSearch(e.target.value)}
              placeholder="ಮೆನು ಹುಡುಕಿ (Search Menu)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border-2 border-[#2b2b2b] rounded-lg bg-white placeholder-stone-400 font-kannada"
            />
          </div>
        </div>

        {/* All Menus Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredAllMenus.map((menu) => {
            const IconComp = menu.icon;
            return (
              <div
                key={menu.id}
                className="bg-white p-3.5 rounded-xl border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:shadow-[5px_5px_0px_#f59e0b] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-stone-100 text-[#2b2b2b] border border-[#2b2b2b]">
                      <IconComp className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-[#2b2b2b] font-mono-code border border-[#2b2b2b]">
                      {menu.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#2b2b2b] font-kannada leading-snug">
                    {menu.title}
                  </h4>
                  <p className="text-[11px] text-stone-600 font-kannada mt-1 leading-relaxed">
                    {menu.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => navigateTo(menu.tab)}
                    className="w-full py-1.5 px-2.5 bg-stone-100 hover:bg-[#2b2b2b] text-[#2b2b2b] hover:text-[#f59e0b] text-xs font-bold rounded-lg flex items-center justify-between transition-colors border border-[#2b2b2b] cursor-pointer font-kannada"
                  >
                    <span>ಮೆನು ತೆರೆಯಿರಿ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PRIMARY 18 ACTION MODULES ON HOME PAGE (ಮುಖಪುಟದ ೧೮ ನಿರ್ವಹಣಾ ಮಾಡ್ಯೂಲ್‌ಗಳು) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#2b2b2b] pb-2">
          <div className="flex items-center gap-2">
            <span className="label-ink font-bold">18 CORE MODULES</span>
            <h2 className="font-gaegu text-3xl sm:text-4xl font-black text-[#2b2b2b] tracking-tight">
              ಮುಖಪುಟದ ೧೮ ನಿರ್ವಹಣಾ ಮಾಡ್ಯೂಲ್‌ಗಳು
            </h2>
          </div>
          <span className="text-xs font-bold text-[#2b2b2b] bg-amber-100 px-3 py-1 rounded-full border-2 border-[#2b2b2b] font-kannada">
            ಸಕ್ರಿಯ ಶಾಖೆ: ಆ2 (ಸ.ಪ್ರಾ.ಶಿ) • ಅಧಿಕೃತ ತಂತ್ರಾಂಶ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {/* Module 1: ಕಡತಗಳ ಡ್ಯಾಶ್ ಬೋರ್ಡ್ (File Dashboard) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#f59e0b] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-amber-100 text-amber-900 border-2 border-[#2b2b2b]">
                  <FolderGit2 className="w-5 h-5 text-[#2b2b2b]" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f59e0b] text-[#2b2b2b] font-mono-code border border-[#2b2b2b]">
                  ೧. ಕಡತಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-amber-800 mt-2">
                ೧. ಕಡತಗಳ ಡ್ಯಾಶ್ ಬೋರ್ಡ್
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಕಡತಗಳ ಚಲನವಲನ ಟೈಮ್‌ಲೈನ್, KSMOP ವರ್ಗೀಕರಣ, ಕಡತ ಶೋಧನೆ ಹಾಗೂ ಪರಿಶೀಲನೆ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-1-file-dashboard"
                onClick={() => navigateTo('fileDashboard')}
                className="w-full py-2 px-3 bg-[#f59e0b] hover:bg-amber-400 text-[#2b2b2b] text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] font-kannada"
              >
                <span>ಕಡತಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 2: ಸಾಮಾನ್ಯ ಕಡತ / ಸಾಮಾನ್ಯ ಪತ್ರ (General File Studio) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#f97316] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-orange-100 text-orange-950 border-2 border-[#2b2b2b]">
                  <FileText className="w-5 h-5 text-orange-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f97316] text-white font-mono-code border border-[#2b2b2b]">
                  ೨. ಸಾಮಾನ್ಯ ಕಡತ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-orange-800 mt-2">
                ೨. ಸಾಮಾನ್ಯ ಕಡತ (ಪತ್ರ ತಯಾರಿಸಿ)
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ನೌಕರರ ಹಾಗೂ ಇಲಾಖಾ ಸಾಮಾನ್ಯ ಪತ್ರ, ನಡಾವಳಿಗಳನ್ನು ಸರಳವಾಗಿ ಸಿದ್ಧಪಡಿಸಿ ಕಡತಕ್ಕೆ ಲಗತ್ತಿಸಿ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-2-general-letter"
                onClick={() => navigateTo('generalLetter')}
                className="w-full py-2 px-3 bg-[#f97316] hover:bg-orange-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] font-kannada"
              >
                <span>ಸಾಮಾನ್ಯ ಪತ್ರ ತಯಾರಿಸಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 3: ಜ್ಞಾಪನಾದೇಶ (Memorandum Order Studio) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#10b981] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-emerald-100 text-emerald-950 border-2 border-[#2b2b2b]">
                  <Award className="w-5 h-5 text-emerald-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10b981] text-white font-mono-code border border-[#2b2b2b]">
                  ೩. ಜ್ಞಾಪನಾದೇಶ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-emerald-700 mt-2">
                ೩. ಜ್ಞಾಪನಾದೇಶ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಗಳಿಕೆ ರಜೆ, ಶಿಶುಪಾಲನ ರಜೆ, ಸೇವಾ ಸಕ್ರಮ ಹಾಗೂ ವರ್ಗಾವಣೆ ಅಧಿಕೃತ ಜ್ಞಾಪನಾ ಕಛೇರಿ ಆದೇಶಗಳು.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-3-memorandum"
                onClick={() => navigateTo('memorandum')}
                className="w-full py-2 px-3 bg-[#2b2b2b] hover:bg-stone-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಜ್ಞಾಪನಾ ಆದೇಶ ಸೃಜಿಸಿ</span>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Module 4: ಪತ್ರ 28 (ಪ್ರಪತ್ರ-೨೮ - ವೇತನ ಬಡ್ತಿ) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#f59e0b] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-amber-100 text-amber-950 border-2 border-[#2b2b2b]">
                  <FileSpreadsheet className="w-5 h-5 text-amber-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2b2b2b] text-[#fffbf2] font-mono-code border border-[#2b2b2b]">
                  ೪. ಪತ್ರ ೨೮
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-amber-800 mt-2">
                ೪. ಪತ್ರ ೨೮ (ಪ್ರಪತ್ರ-೨೮)
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಜನವರಿ ಹಾಗೂ ಜುಲೈ ಮಾಹೆಯ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಪ್ರಪತ್ರ-೨೮ ಪಟ್ಟಿ, ನಡಾವಳಿ & ಆದೇಶ.
              </p>
              <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                <button
                  onClick={() => openPrapathraMonth('January')}
                  className="py-1 px-2 bg-white hover:bg-amber-100 border-2 border-[#2b2b2b] text-[#2b2b2b] rounded text-[11px] font-bold flex items-center justify-between cursor-pointer font-kannada"
                >
                  <span>📅 ಜನವರಿ</span>
                  <span className="bg-[#f59e0b] text-[#2b2b2b] px-1 rounded text-[10px] font-mono-code font-bold">
                    {januaryIncrementsCount}
                  </span>
                </button>
                <button
                  onClick={() => openPrapathraMonth('July')}
                  className="py-1 px-2 bg-white hover:bg-amber-100 border-2 border-[#2b2b2b] text-[#2b2b2b] rounded text-[11px] font-bold flex items-center justify-between cursor-pointer font-kannada"
                >
                  <span>📅 ಜುಲೈ</span>
                  <span className="bg-[#f59e0b] text-[#2b2b2b] px-1 rounded text-[10px] font-mono-code font-bold">
                    {julyIncrementsCount}
                  </span>
                </button>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-4-prapathra28"
                onClick={() => navigateTo('prapathra28')}
                className="w-full py-2 px-3 bg-[#f59e0b] hover:bg-amber-400 text-[#2b2b2b] text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] font-kannada"
              >
                <span>ಪ್ರಪತ್ರ-೨೮ ತೆರೆಯಿರಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 5: ನೌಕರರ ಮಾಹಿತಿ (Employee Information) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#0284c7] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-sky-100 text-sky-950 border-2 border-[#2b2b2b]">
                  <Users className="w-5 h-5 text-sky-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2b2b2b] text-[#fffbf2] font-mono-code border border-[#2b2b2b]">
                  ೫. ನೌಕರರ ಮಾಹಿತಿ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-sky-700 mt-2">
                ೫. ನೌಕರರ ಮಾಹಿತಿ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಕಛೇರಿ ಹಾಗೂ ಶಾಲಾ ಸಿಬ್ಬಂದಿಯ KGID, ಹುದ್ದೆ, ವೇತನ ಶ್ರೇಣಿ, ಶಾಲೆ ಹಾಗೂ ಸೇವಾ ವಿವರಗಳ ತಂತ್ರಾಂಶ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-5-employees"
                onClick={() => navigateTo('employees')}
                className="w-full py-2 px-3 bg-[#2b2b2b] hover:bg-stone-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ನೌಕರರ ಮಾಹಿತಿ ವೀಕ್ಷಿಸಿ</span>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>
            </div>
          </div>

          {/* Module 6: ರಜ ಕ್ಯಾಲೆಂಡರ್ (Leave Calendar) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#e11d48] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-rose-100 text-rose-950 border-2 border-[#2b2b2b]">
                  <Calendar className="w-5 h-5 text-rose-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e11d48] text-white font-mono-code border border-[#2b2b2b]">
                  ೬. ರಜ ಕ್ಯಾಲೆಂಡರ್
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-rose-700 mt-2">
                ೬. ರಜ ಕ್ಯಾಲೆಂಡರ್
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಗಳಿಕೆ ರಜೆ (EL), ಅರೆ ವೇತನ ರಜೆ (HPL) ಹಾಗೂ ಮಹಿಳಾ ನೌಕರರ 180 ದಿನಗಳ ರಜೆ ಕೋಟಾ ನಿರ್ವಹಣೆ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-6-leave-calendar"
                onClick={() => navigateTo('leaveCalendar')}
                className="w-full py-2 px-3 bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ರಜ ಕ್ಯಾಲೆಂಡರ್ ತೆರೆಯಿರಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 7: ಪಿಂಚಣಿ (Pension Studio) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#d97706] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-amber-200 text-amber-950 border-2 border-[#2b2b2b]">
                  <Award className="w-5 h-5 text-amber-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d97706] text-white font-mono-code border border-[#2b2b2b]">
                  ೭. ಪಿಂಚಣಿ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-amber-800 mt-2">
                ೭. ಪಿಂಚಣಿ & ನಿವೃತ್ತಿ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                KCSR ನಿವೃತ್ತಿ ವೇತನ ಲೆಕ್ಕಾಚಾರ, ನಮೂನೆ-೭, DCRG, ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ & ಆದೇಶಗಳು.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-7-pension"
                onClick={() => navigateTo('pension')}
                className="w-full py-2 px-3 bg-[#d97706] hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಪಿಂಚಣಿ ತಂತ್ರಾಂಶ ತೆರೆಯಿರಿ</span>
                <ChevronRight className="w-4 h-4 text-amber-200" />
              </button>
            </div>
          </div>

          {/* Module 8: ಆದೇಶ ಕಡತ (Order Files) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#9333ea] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-purple-100 text-purple-950 border-2 border-[#2b2b2b]">
                  <Archive className="w-5 h-5 text-purple-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#9333ea] text-white font-mono-code border border-[#2b2b2b]">
                  ೮. ಆದೇಶ ಕಡತ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-purple-700 mt-2">
                ೮. ಆದೇಶ ಕಡತ (ದಾಖಲೆಗಳು)
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಹೊರಡಿಸಲಾದ ಎಲ್ಲಾ ಅಧಿಕೃತ ಜ್ಞಾಪನಾ ಆದೇಶಗಳ ಕಡತಗಳು (Dockets), KSMOP ವರ್ಗೀಕರಣ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-8-order-files"
                onClick={() => navigateTo('orderFiles')}
                className="w-full py-2 px-3 bg-[#9333ea] hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಆದೇಶಗಳ ಕಡತ ತೆರೆಯಿರಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 9: ವೇತನ ಬದಲಾವಣೆ (Salary Changes) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#0d9488] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-teal-100 text-teal-950 border-2 border-[#2b2b2b]">
                  <TrendingUp className="w-5 h-5 text-teal-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0d9488] text-white font-mono-code border border-[#2b2b2b]">
                  ೯. ವೇತನ ಬದಲಾವಣೆ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-teal-700 mt-2">
                ೯. ವೇತನ ಬದಲಾವಣೆ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                KCSR ನಿಯಮ 52/53 ವೇತನ ಬದಲಾವಣೆ, 10/15/20/25/30 ವರ್ಷಗಳ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-9-salary-changes"
                onClick={() => navigateTo('salaryChanges')}
                className="w-full py-2 px-3 bg-[#0d9488] hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ವೇತನ ಬದಲಾವಣೆ ನಿರ್ವಹಣೆ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 10: ವರದಿಗಳು (Reports) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#2563eb] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-blue-100 text-blue-950 border-2 border-[#2b2b2b]">
                  <BarChart3 className="w-5 h-5 text-blue-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2563eb] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೦. ವರದಿಗಳು
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-blue-700 mt-2">
                ೧೦. ವರದಿಗಳು
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ವೇತನ ಬಡ್ತಿ, ರಜೆ, ಜ್ಞಾಪನೆ ಹಾಗೂ ನೌಕರರ ಸೇವಾ ಅಂಕಿ-ಅಂಶಗಳ ಸಮಗ್ರ ವರದಿಗಳು & ಮುದ್ರಣ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-10-reports"
                onClick={() => navigateTo('reports')}
                className="w-full py-2 px-3 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ವರದಿಗಳು ವೀಕ್ಷಿಸಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 11: ಹುಡುಕಾಟ (Unified Search) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#4f46e5] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-indigo-100 text-indigo-950 border-2 border-[#2b2b2b]">
                  <Search className="w-5 h-5 text-indigo-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#4f46e5] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೧. ಹುಡುಕಾಟ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-indigo-700 mt-2">
                ೧೧. ಹುಡುಕಾಟ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                KGID, ಹೆಸರು, ಕಡತ ಸಂಖ್ಯೆ, ಆದೇಶ ಸಂಖ್ಯೆ ಅಥವಾ ಶಾಲೆಯ ಮೂಲಕ ತ್ವರಿತ ಶೋಧನೆ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-11-search"
                onClick={() => navigateTo('search')}
                className="w-full py-2 px-3 bg-[#4f46e5] hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಏಕೀಕೃತ ಹುಡುಕಾಟ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 12: ಸೆಟ್ಟಿಂಗ್ಸ್ (Settings & DDO Management) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#44403c] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-stone-200 text-stone-900 border-2 border-[#2b2b2b]">
                  <Settings className="w-5 h-5 text-stone-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#44403c] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೨. ಸೆಟ್ಟಿಂಗ್ಸ್
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-stone-800 mt-2">
                ೧೨. ಸೆಟ್ಟಿಂಗ್ಸ್
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಕಛೇರಿಯ ಡಿಡಿಓ (ಆಹರಣ & ವಿತರಣಾಧಿಕಾರಿ) ಮಾಹಿತಿ, ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರ ಹಾಗೂ ನಿಯಮಗಳ ಸಂರಚನೆ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-12-settings"
                onClick={() => navigateTo('settings')}
                className="w-full py-2 px-3 bg-[#44403c] hover:bg-stone-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಡಿಡಿಓ & ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆಯಿರಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 13: ಶಾಲೆಗಳು (Schools Management) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#059669] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-emerald-100 text-emerald-950 border-2 border-[#2b2b2b]">
                  <School className="w-5 h-5 text-emerald-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#059669] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೩. ಶಾಲೆಗಳು
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-emerald-800 mt-2">
                ೧೩. ಶಾಲೆಗಳು & ಅನುದಾನ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಸರ್ಕಾರಿ & ಅನುದಾನಿತ ಶಾಲೆಗಳ ಡೈರೆಕ್ಟರಿ, UDISE ವಿವರ, ಮಾನ್ಯತೆ ನವೀಕರಣ & ಅನುದಾನ ಪತ್ರಗಳು.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-13-schools"
                onClick={() => navigateTo('schools')}
                className="w-full py-2 px-3 bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಶಾಲೆಗಳ ನಿರ್ವಹಣೆ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 14: ಶಾಸನಬದ್ಧ ಸುತ್ತಲೆ (Statutory Circulars) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#4338ca] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-indigo-100 text-indigo-950 border-2 border-[#2b2b2b]">
                  <Sparkles className="w-5 h-5 text-indigo-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#4338ca] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೪. ಶಾಸನಬದ್ಧ ಸುತ್ತಲೆ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-indigo-800 mt-2">
                ೧೪. ಶಾಸನಬದ್ಧ ಸುತ್ತಲೆ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಸ್ವಯಂಚಾಲಿತ ಶಾಸನಬದ್ಧ ಸುತ್ತೋಲೆಗಳ ರಚನೆ (KCSR, RTE, KSMOP ನಿಯಮಾನುಸಾರ).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-14-circulars"
                onClick={() => navigateTo('circularStudio')}
                className="w-full py-2 px-3 bg-[#4338ca] hover:bg-indigo-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಸುತ್ತೋಲೆ ರಚಿಸಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 15: ಕಡತ ಆಡಿತ್ (Master Docket Audit) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#9a3412] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-amber-200 text-amber-950 border-2 border-[#2b2b2b]">
                  <ShieldCheck className="w-5 h-5 text-amber-900" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#9a3412] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೫. ಕಡತ ಆಡಿತ್
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-amber-900 mt-2">
                ೧೫. ಕಡತ ಆಡಿತ್
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                e-Office ಮಾದರಿಯ ಕಡತಗಳ ಪೂರ್ಣ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಹಾಗೂ KSMOP ವಿಂಗಡಣೆ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-15-master-audit"
                onClick={() => navigateTo('masterAudit')}
                className="w-full py-2 px-3 bg-[#9a3412] hover:bg-amber-950 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಕಡತ ಆಡಿಟ್ ನಡೆಸಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 16: ಮಾಹಿತಿ ಹಕ್ಕು (RTI Register) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#ca8a04] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-yellow-100 text-yellow-950 border-2 border-[#2b2b2b]">
                  <FileCheck2 className="w-5 h-5 text-yellow-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ca8a04] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೬. ಮಾಹಿತಿ ಹಕ್ಕು
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-yellow-800 mt-2">
                ೧೬. ಮಾಹಿತಿ ಹಕ್ಕು (RTI)
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ ೨೦೦೫: ಅರ್ಜಿಗಳ ನಮೂದು, ೩೦-ದಿನಗಳ SLA ಗಡುವು & ಕಡತ ರಿಜಿಸ್ಟರ್.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-16-rti"
                onClick={() => navigateTo('rti', { subTab: 'register' })}
                className="w-full py-2 px-3 bg-[#ca8a04] hover:bg-yellow-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಮಾಹಿತಿ ಹಕ್ಕು ರಿಜಿಸ್ಟರ್</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 17: ಪತ್ರಗಳು (Official Letters / Registry) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#0284c7] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-sky-100 text-sky-950 border-2 border-[#2b2b2b]">
                  <FileText className="w-5 h-5 text-sky-700" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0284c7] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೭. ಪತ್ರಗಳು
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-sky-800 mt-2">
                ೧೭. ಪತ್ರಗಳು (ಆವಕ & ಜಾವಕ)
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಕಛೇರಿಯ ಆವಕ (Inward) & ಜಾವಕ (Outward) ಪತ್ರಗಳ ಸಮಗ್ರ ನೋಂದಣಿ ಹಾಗೂ ರವಾನೆ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-17-registry"
                onClick={() => navigateTo('registry')}
                className="w-full py-2 px-3 bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>ಪತ್ರಗಳ ರಿಜಿಸ್ಟರ್ ತೆರೆಯಿರಿ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 18: ಆರ್‌ಟಿಐ ಪಾತ್ರ ವ್ಯವಹಾರ (RTI Correspondence Studio) */}
          <div className="mini-card bg-white flex flex-col justify-between group shadow-[5px_5px_0px_#2b2b2b] hover:shadow-[7px_7px_0px_#b45309] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all border-2 border-[#2b2b2b]">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-lg bg-amber-100 text-amber-950 border-2 border-[#2b2b2b]">
                  <Scale className="w-5 h-5 text-amber-800" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#b45309] text-white font-mono-code border border-[#2b2b2b]">
                  ೧೮. RTI ಪತ್ರ ವ್ಯವಹಾರ
                </span>
              </div>
              <h3 className="font-gaegu text-3xl font-bold text-amber-900 mt-2">
                ೧೮. ಆರ್‌ಟಿಐ ಪಾತ್ರ ವ್ಯವಹಾರ
              </h3>
              <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada leading-relaxed">
                ಮಾಹಿತಿ ಹಕ್ಕು ಉತ್ತರ ಪತ್ರಗಳು, ಕಲಂ ೬(೩) ವರ್ಗಾವಣೆ, ಶುಲ್ಕ ಬೇಡಿಕೆ & ಮೇಲ್ಮನವಿ ಪತ್ರ ಸ್ಟುಡಿಯೋ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15">
              <button
                id="home-module-18-rti-correspondence"
                onClick={() => navigateTo('rti', { subTab: 'letters' })}
                className="w-full py-2 px-3 bg-[#b45309] hover:bg-amber-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#2b2b2b] font-kannada"
              >
                <span>RTI ಪತ್ರ ವ್ಯವಹಾರ ಸ್ಟುಡಿಯೋ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ಮುಖಪುಟದ ೭ ಮುಖ್ಯ ನಿರ್ವಹಣಾ ಮಾಡ್ಯೂಲ್‌ಗಳಲ್ಲಿ ನೌಕರರ ಪಟ್ಟಿ & ತ್ವರಿತ ಚಟುವಟಿಕೆಗಳು */}
        <div id="home-modules-employee-roster" className="mt-8 pt-6 border-t-3 border-[#2b2b2b] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-sky-100 border border-[#2b2b2b]">
                  <Users className="w-4 h-4 text-sky-700" />
                </span>
                <h3 className="font-gaegu text-2xl sm:text-3xl font-bold text-[#2b2b2b]">
                  ೭ ಮಾಡ್ಯೂಲ್‌ಗಳ ನೌಕರರ ಪಟ್ಟಿ & ತ್ವರಿತ ಕಡತ/ಪತ್ರ ಚಟುವಟಿಕೆಗಳು
                </h3>
              </div>
              <p className="text-xs text-stone-600 font-kannada mt-1">
                ಮಹಿಳಾ ನೌಕರರ ಶಿಶುಪಾಲನ ರಜೆ (180 ದಿನಗಳು), ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಮತ್ತು ಕಚೇರಿ ಪತ್ರ/ಆದೇಶಕ್ಕಾಗಿ ನೌಕರರನ್ನು ನೇರವಾಗಿ ಆಯ್ಕೆ ಮಾಡಿ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-nav-leave-calendar-quick"
                onClick={() => navigateTo('leaveCalendar')}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-950 text-xs font-bold rounded-lg border-2 border-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer font-kannada"
                title="ಮಹಿಳಾ ನೌಕರರ ಶಿಶುಪಾಲನ ರಜೆ 180 ದಿನಗಳ ಕ್ಯಾಲೆಂಡರ್ ನಿರ್ವಹಣೆ"
              >
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>📅 ರಜೆ ಕ್ಯಾಲೆಂಡರ್ (180 ದಿನಗಳು)</span>
              </button>

              <button
                id="btn-nav-all-employees"
                onClick={() => navigateTo('employees')}
                className="px-3 py-1.5 bg-[#2b2b2b] hover:bg-stone-800 text-white text-xs font-bold rounded-lg border-2 border-[#2b2b2b] flex items-center gap-1.5 transition-colors cursor-pointer font-kannada"
              >
                <span>ಎಲ್ಲಾ ನೌಕರರ ಪೂರ್ಣ ಮಾಹಿತಿ</span>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-lg border-2 border-[#2b2b2b]">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEmpModuleFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-md border-2 transition-all font-kannada cursor-pointer ${
                  empModuleFilter === 'all'
                    ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-[#2b2b2b]'
                }`}
              >
                ಎಲ್ಲಾ ನೌಕರರು ({employees?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setEmpModuleFilter('female')}
                className={`px-3 py-1 text-xs font-bold rounded-md border-2 transition-all font-kannada cursor-pointer flex items-center gap-1 ${
                  empModuleFilter === 'female'
                    ? 'bg-rose-600 text-white border-rose-800 shadow-sm'
                    : 'bg-rose-50 text-rose-900 border-rose-200 hover:border-rose-400'
                }`}
              >
                <span>👩‍👧 ಮಹಿಳಾ ನೌಕರರು (ಶಿಶುಪಾಲನ ರಜೆ: 180 ದಿನಗಳು)</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-white/80 text-rose-900 rounded-full font-mono-code font-bold">
                  {femaleEmployeesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmpModuleFilter('jan')}
                className={`px-3 py-1 text-xs font-bold rounded-md border-2 transition-all font-kannada cursor-pointer ${
                  empModuleFilter === 'jan'
                    ? 'bg-sky-700 text-white border-sky-900'
                    : 'bg-sky-50 text-sky-900 border-sky-200 hover:border-sky-400'
                }`}
              >
                ಜನವರಿ ಬಡ್ತಿ ({januaryIncrementsCount})
              </button>

              <button
                type="button"
                onClick={() => setEmpModuleFilter('july')}
                className={`px-3 py-1 text-xs font-bold rounded-md border-2 transition-all font-kannada cursor-pointer ${
                  empModuleFilter === 'july'
                    ? 'bg-amber-600 text-white border-amber-800'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400'
                }`}
              >
                ಜುಲೈ ಬಡ್ತಿ ({julyIncrementsCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={empModuleSearch}
                onChange={(e) => setEmpModuleSearch(e.target.value)}
                placeholder="ನೌಕರರ ಹೆಸರು, KGID, ಶಾಲೆ..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border-2 border-stone-300 rounded-md focus:border-[#2b2b2b] outline-none font-kannada"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border-2 border-[#2b2b2b] rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b-2 border-[#2b2b2b] text-[#2b2b2b] font-kannada">
                    <th className="py-2.5 px-3 font-bold w-12 text-center">ಕ್ರ.ಸಂ</th>
                    <th className="py-2.5 px-3 font-bold">ನೌಕರರ ಹೆಸರು & ಹುದ್ದೆ</th>
                    <th className="py-2.5 px-3 font-bold font-mono-code">ಕೆ.ಜಿ.ಐ.ಡಿ</th>
                    <th className="py-2.5 px-3 font-bold">ಶಾಲೆ / ಕರ್ತವ್ಯ ಸ್ಥಳ</th>
                    <th className="py-2.5 px-3 font-bold">ವೇತನ ಶ್ರೇಣಿ / ಮೂಲ</th>
                    <th className="py-2.5 px-3 font-bold">ರಜೆ ಶಿಲ್ಕು / ಶಿಶುಪಾಲನ ರಜೆ</th>
                    <th className="py-2.5 px-3 font-bold text-center">ತ್ವರಿತ ಕ್ರಮಗಳು</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-kannada">
                  {filteredModuleEmployees.slice(0, empModuleLimit).map((emp, idx) => {
                    const isFemale = (emp.gender || '').toLowerCase().includes('female') || 
                                     (emp.gender || '').toLowerCase().includes('ಮಹಿಳೆ') || 
                                     emp.fullName.includes('ಶ್ರೀಮತಿ') || 
                                     emp.childCareLeaveQuota !== undefined;
                    const cclQuota = emp.childCareLeaveQuota ?? 180;
                    const cclAvailed = emp.childCareLeaveAvailed ?? 0;
                    const cclBalance = cclQuota - cclAvailed;

                    return (
                      <tr key={emp.id || emp.kgidNumber || idx} className="hover:bg-amber-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono-code font-bold text-stone-600">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{emp.fullName}</span>
                            {isFemale && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 border border-rose-300 rounded font-bold">
                                ಮಹಿಳೆ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-600">
                            {emp.designation || 'ಶಿಕ್ಷಕರು'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono-code font-bold text-sky-900">
                          {emp.kgidNumber || emp.employeeCode || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700 max-w-[200px] truncate" title={emp.placeOfWork || emp.officeLocation}>
                          {emp.placeOfWork || emp.officeLocation || 'ಸರ್ಕಾರಿ ಶಾಲೆ, ಭದ್ರಾವತಿ'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono-code font-bold text-stone-800">
                            ₹{(emp.basicPay || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono-code truncate max-w-[140px]" title={emp.payScale}>
                            {emp.payScale || '37900-70850'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isFemale ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                ಶಿಶುಪಾಲನೆ: {cclBalance}/{cclQuota} ದಿನಗಳು
                              </span>
                              <div className="text-[10px] text-stone-500">
                                ಗಳಿಕೆ ರಜೆ: {emp.earnedLeaveBalance ?? 30} ದಿನಗಳು
                              </div>
                            </div>
                          ) : (
                            <div className="text-stone-700">
                              <span className="text-[11px] font-bold">ಗಳಿಕೆ ರಜೆ: {emp.earnedLeaveBalance ?? 30}</span>
                              <div className="text-[10px] text-stone-500">ಅರ್ಧ ವೇತನ: {emp.halfPayLeaveBalance ?? 20} ದಿನ</div>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-draft-letter-emp-${emp.kgidNumber || idx}`}
                              onClick={() => {
                                navigateTo('generalLetter', { prefillStaff: emp, prefillEmployee: emp });
                              }}
                              className="px-2.5 py-1 bg-sky-900 hover:bg-sky-800 text-white rounded font-bold text-[11px] transition-colors border border-[#2b2b2b] flex items-center gap-1 cursor-pointer"
                              title="ಈ ನೌಕರರಿಗೆ ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ ತಯಾರಿಸಿ"
                            >
                              <FileText className="w-3 h-3" />
                              <span>ಪತ್ರ ತಯಾರಿಸಿ</span>
                            </button>

                            {isFemale && (
                              <button
                                id={`btn-calendar-emp-${emp.kgidNumber || idx}`}
                                onClick={() => navigateTo('leaveCalendar')}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded font-bold text-[11px] transition-colors border border-rose-300 flex items-center gap-1 cursor-pointer"
                                title="ಶಿಶುಪಾಲನ ರಜೆ ಕ್ಯಾಲೆಂಡರ್ ವೀಕ್ಷಿಸಿ"
                              >
                                <Calendar className="w-3 h-3 text-rose-600" />
                                <span>ರಜೆ</span>
                              </button>
                            )}

                            <button
                              id={`btn-order-emp-${emp.kgidNumber || idx}`}
                              onClick={() => {
                                navigateTo('memorandum', { prefillStaff: emp, prefillEmployee: emp });
                              }}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold text-[11px] transition-colors border border-stone-300 flex items-center gap-0.5 cursor-pointer"
                              title="ಜ್ಞಾಪನಾ ಆದೇಶ ಹೊರಡಿಸಿ"
                            >
                              <span>ಆದೇಶ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredModuleEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-500">
                        ಯಾವುದೇ ನೌಕರರ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredModuleEmployees.length > empModuleLimit && (
              <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs text-stone-600 font-kannada">
                  {empModuleLimit} / {filteredModuleEmployees.length} ನೌಕರರನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEmpModuleLimit(prev => prev + 10)}
                    className="px-3 py-1 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded border border-stone-300 font-kannada cursor-pointer"
                  >
                    ಮತ್ತಷ್ಟು ತೋರಿಸಿ (+10)
                  </button>
                  <button
                    onClick={() => setEmpModuleLimit(filteredModuleEmployees.length)}
                    className="px-3 py-1 bg-[#2b2b2b] hover:bg-stone-800 text-white text-xs font-bold rounded border border-[#2b2b2b] font-kannada cursor-pointer"
                  >
                    ಎಲ್ಲಾ ({filteredModuleEmployees.length}) ತೋರಿಸಿ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. ಮುಖಪುಟದಲ್ಲಿ ಅನುದಾನಿತ ಶಾಲೆಗಳ ಅಧಿಕೃತ ಪಟ್ಟಿ (Aided Schools of Bhadravathi) */}
      <div id="home-aided-schools-section" className="bg-white border-3 border-[#2b2b2b] shadow-[10px_10px_0px_#2b2b2b] rounded-xl p-5 sm:p-7 space-y-4">
        <AidedSchoolsTable
          schools={AIDED_SCHOOLS_BHADRAVATHI}
          onDraftLetterToSchool={(sch) => {
            navigateTo('generalLetter', { prefillSchool: sch });
          }}
          showToast={showToast}
        />
      </div>

      {/* 5. ಮುಖಪುಟದಲ್ಲಿ ಕಛೇರಿ ಸಿಬ್ಬಂದಿ ವಿವರ (Office Staff - Strictly CSV Roster) */}
      <div id="home-office-config-staff-section" className="bg-white border-3 border-[#2b2b2b] shadow-[10px_10px_0px_#2b2b2b] rounded-xl p-5 sm:p-7 space-y-4">
        <OfficeStaffTable
          employees={employees}
          limitCount={5}
          onViewAllEmployees={() => navigateTo('employees')}
          onDraftLetterForStaff={(staff) => {
            navigateTo('generalLetter', { prefillStaff: staff });
          }}
        />
      </div>

      {/* 4. HOME PAGE FILES REGISTRY: ಮುಖಪುಟದಲ್ಲಿ 'ಫೈಲ್' ಪಟ್ಟಿ ಹಾಗೂ ಪತ್ರಗಳ ವಿವರ */}
      <div id="home-files-registry-section" className="bg-white border-3 border-[#2b2b2b] shadow-[10px_10px_0px_#2b2b2b] rounded-xl overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-6 border-b-3 border-[#2b2b2b] bg-[#fffbf2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="label-ink">DOCKET ARCHIVE</span>
              <h2 className="font-gaegu text-3xl font-bold text-[#2b2b2b] tracking-tight">
                ಕಡತಗಳ ನಿರ್ವಹಣೆ (Files & Letters Registry)
              </h2>
              <span className="text-xs font-mono-code font-bold px-2 py-0.5 rounded bg-[#2b2b2b] text-[#fffbf2]">
                {filteredFiles.length} ಕಡತಗಳು
              </span>
            </div>
            <p className="text-xs text-[#2b2b2b]/80 mt-1 font-kannada">
              ಫೈಲ್ ಸಂಖ್ಯೆ (ಉದಾ: ೪೫), ಹೆಸರು, ತಯಾರಿಸಿದ ದಿನಾಂಕ, ವಿಭಾಗ ಹಾಗೂ ಆ ಕಡತದಲ್ಲಿ ಸೃಜಿಸಲಾದ ಪತ್ರಗಳ ಪಟ್ಟಿ (ಉದಾ: 45-1, 45-2) ಮತ್ತು ಮರುಮುದ್ರಣ (Reprint).
            </p>
          </div>

          {/* Action: Create New File & Master Audit */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="home-btn-audit-files-top"
              onClick={() => navigateTo('masterAudit')}
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-xs font-bold border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:shadow-[4px_4px_0px_#2b2b2b] transition-all flex items-center gap-1.5 cursor-pointer font-kannada"
              title="e-Office ಕಡತ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಹಾಗೂ ಪರಿಶೀಲನೆ"
            >
              <ShieldCheck className="w-4 h-4 text-amber-900" />
              <span>e-Office ಕಡತ ಆಡಿಟ್ (Auditing)</span>
            </button>

            <button
              id="home-btn-create-file-top"
              onClick={() => setShowCreateFileModal(true)}
              className="px-4 py-2 bg-[#10b981] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:shadow-[4px_4px_0px_#2b2b2b] transition-all flex items-center gap-1.5 cursor-pointer font-kannada"
            >
              <Plus className="w-4 h-4" />
              <span>+ ಹೊಸ ಫೈಲ್ ಸೃಜಿಸಿ (Create File)</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="p-3 sm:p-4 bg-white border-b-2 border-[#2b2b2b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#2b2b2b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ಫೈಲ್ ಸಂಖ್ಯೆ (ಉದಾ: 45) ಅಥವಾ ವಿಷಯ ಹುಡುಕಿ..."
              value={fileSearchTerm}
              onChange={(e) => setFileSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-[#2b2b2b] bg-[#fffbf2] text-[#2b2b2b] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f59e0b] shadow-[2px_2px_0px_#2b2b2b]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#2b2b2b] text-xs font-bold whitespace-nowrap font-kannada">ವಿಭಾಗ ಫಿಲ್ಟರ್:</span>
            <select
              value={selectedFilterSection}
              onChange={(e) => setSelectedFilterSection(e.target.value)}
              className="px-3 py-2 rounded-lg border-2 border-[#2b2b2b] bg-[#fffbf2] text-[#2b2b2b] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#f59e0b] shadow-[2px_2px_0px_#2b2b2b]"
            >
              <option value="all">ಎಲ್ಲಾ ವಿಭಾಗಗಳು</option>
              {safeSections.map(s => (
                <option key={s.id} value={s.code}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Files Grid / List */}
        <div className="p-4 sm:p-6 bg-[#fffbf2]">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border-2 border-dashed border-[#2b2b2b]">
              <FolderGit2 className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#2b2b2b] font-kannada">ಯಾವುದೇ ಕಡತ ಕಂಡುಬಂದಿಲ್ಲ</p>
              <p className="text-xs text-stone-600 mt-1 font-kannada">ಹೊಸ ಕಡತವನ್ನು ಸೃಜಿಸಲು ಮೇಲಿನ "+ ಹೊಸ ಫೈಲ್ ಸೃಜಿಸಿ" ಬಟನ್ ಒತ್ತಿರಿ.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFiles.map(file => {
                const count = file.computedCount;
                return (
                  <div
                    key={file.id}
                    id={`file-card-${file.fileNumber}`}
                    className="bg-white rounded-xl border-2 border-[#2b2b2b] p-4 shadow-[4px_4px_0px_#2b2b2b] hover:shadow-[6px_6px_0px_#2b2b2b] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: File Number badge + Section */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-[#2b2b2b] text-[#f59e0b] text-xs font-black font-mono-code border border-[#2b2b2b]">
                            ಕಡತ ಸಂ: {file.fileNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-[#2b2b2b] border border-[#2b2b2b]">
                            {file.sectionCode || 'ಆ1'} ({file.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ'})
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-600 flex items-center gap-1 font-mono-code font-bold">
                          <Calendar className="w-3 h-3 text-[#2b2b2b]" />
                          <span>{file.initiatedDate}</span>
                        </span>
                      </div>

                      {/* File Subject */}
                      <h4 className="text-sm font-bold text-[#2b2b2b] mt-2.5 leading-snug line-clamp-2 font-kannada" title={file.subject}>
                        {file.subject}
                      </h4>

                      {/* Letters Summary in this file */}
                      <div className="mt-3 p-2.5 rounded-lg bg-[#fffbf2] border-2 border-[#2b2b2b] text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#2b2b2b] font-bold flex items-center gap-1 font-kannada">
                            <FileText className="w-3.5 h-3.5 text-sky-700" />
                            <span>ತಯಾರಿಸಲಾದ ಪತ್ರಗಳು:</span>
                          </span>
                          <span className="font-mono-code font-bold text-[#2b2b2b] px-2 py-0.5 bg-[#f59e0b] border border-[#2b2b2b] rounded">
                            {count} ಪತ್ರ
                          </span>
                        </div>
                        {file.computedLetters.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {file.computedLetters.slice(0, 3).map((l, idx) => (
                              <span
                                key={l.id}
                                className="px-1.5 py-0.5 bg-white text-[#2b2b2b] border border-[#2b2b2b] rounded text-[10px] font-mono-code font-bold"
                              >
                                {l.fileLetterNumber || `${file.fileNumber}-${idx + 1}`}
                              </span>
                            ))}
                            {file.computedLetters.length > 3 && (
                              <span className="text-[10px] text-stone-600 font-bold font-kannada">
                                +{file.computedLetters.length - 3} ಇತರೆ
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t-2 border-[#2b2b2b]/15 flex items-center justify-between gap-2">
                      <button
                        id={`btn-view-letters-${file.fileNumber}`}
                        onClick={() => setSelectedFileForModal(file)}
                        className="flex-1 py-1.5 px-3 bg-[#2b2b2b] hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors border-2 border-[#2b2b2b] font-kannada"
                      >
                        <span>ಪತ್ರಗಳ ವಿವರ</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button
                        id={`btn-draft-letter-in-file-${file.fileNumber}`}
                        onClick={() => {
                          navigateTo('generalLetter', {
                            prefillFileNumber: file.fileNumber,
                            prefillSectionCode: file.sectionCode || 'ಆ1',
                            prefillSectionName: file.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ',
                            prefillSubject: file.subject
                          });
                        }}
                        className="p-1.5 bg-[#10b981] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b]"
                        title="ಈ ಕಡತದಲ್ಲಿ ಹೊಸ ಪತ್ರ ತಯಾರಿಸಿ"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Variation 6 Brutalist Footer */}
      <footer className="mt-12 pt-6 border-t-2 border-[#2b2b2b] flex flex-col sm:flex-row items-center justify-between text-xs font-mono-code text-[#2b2b2b] gap-3">
        <div className="font-bold">OFFICE OF THE BEO : BHADRAVATHI</div>
        <div className="px-2 py-0.5 bg-[#2b2b2b] text-[#fffbf2] rounded">[V1.0.42] ADMINISTRATIVE SYSTEM</div>
        <div className="font-bold">ESTABLISHED MMXXIV • KARNATAKA GOVT</div>
      </footer>

      {/* ===================== MODAL 1: CREATE NEW FILE ===================== */}
      {showCreateFileModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-sky-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">ಹೊಸ ಕಡತ ಸೃಜಿಸಿ (Create Master Docket File)</h3>
              </div>
              <button
                onClick={() => setShowCreateFileModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ಫೈಲ್ ಸಂಖ್ಯೆ (File Number) <span className="text-stone-400 font-normal">(ಉದಾಹರಣೆಗೆ ೪೫ ಅಥವಾ ಖಾಲಿ ಬಿಡಿ)</span>
                </label>
                <input
                  type="text"
                  placeholder="ಉದಾ: 45 ಅಥವಾ FILE-2026/045"
                  value={newFileNo}
                  onChange={(e) => setNewFileNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ವಿಭಾಗ ಆಯ್ಕೆ (Select Office Section) <span className="text-red-500">*</span>
                </label>
                <select
                  value={newFileSectionCode}
                  onChange={(e) => setNewFileSectionCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {safeSections.map(s => (
                    <option key={s.id} value={s.code}>
                      {s.code} - {s.name} ({s.description})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  ಈ ಕಡತದಲ್ಲಿ ಸೃಜಿಸಲಾಗುವ ಪ್ರತಿಯೊಂದು ಪತ್ರದಲ್ಲೂ ಈ ವಿಭಾಗ ಸಂಖ್ಯೆ ಹಾಗೂ ಹೆಸರು ಬರುತ್ತದೆ (ಉದಾ: ಆ1(ಸ.ಪ್ರಾ.ಶಿ)).
                </p>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ಫೈಲ್ ಹೆಸರು / ವಿಷಯ (File Name / Subject) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="ಉದಾ: ಭದ್ರಾವತಿ ವಲಯದ ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕರ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಪ್ರಪತ್ರ-೨೮ ಕಡತ ೨೦೨೬-೨೭"
                  value={newFileSubject}
                  onChange={(e) => setNewFileSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ಕಸ್ಟೋಡಿಯನ್ / ಜವಾಬ್ದಾರಿಯುತ ಸಿಬ್ಬಂದಿ (Custodian)
                </label>
                <input
                  type="text"
                  value={newFileCustodian}
                  onChange={(e) => setNewFileCustodian(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ಟಿಪ್ಪಣಿ / ಷರಾ (Notes / Remarks)
                </label>
                <input
                  type="text"
                  placeholder="ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ..."
                  value={newFileNotes}
                  onChange={(e) => setNewFileNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFileModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold cursor-pointer"
                >
                  ರದ್ದುಮಾಡಿ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFile}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingFile ? 'ಸೃಜಿಸಲಾಗುತ್ತಿದೆ...' : 'ಕಡತ ಸೃಜಿಸಿ (Save File)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: ADD NEW SECTION ===================== */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-sky-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">ಹೊಸ ವಿಭಾಗ ಸೇರಿಸಿ (Add Office Section)</h3>
              </div>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSectionSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ವಿಭಾಗದ ಸಂಕೇತ / ಸಂಖ್ಯೆ (Section Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ಉದಾಹರಣೆಗೆ: ಆ1, ಆ2, ಆ3, ಸಿಬ್ಬಂದಿ-೧"
                  value={newSecCode}
                  onChange={(e) => setNewSecCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ವಿಭಾಗದ ಹೆಸರು (Section Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ಉದಾಹರಣೆಗೆ: ಸ.ಪ್ರಾ.ಶಿ, ಪ್ರೌ.ಶಿ, ಅನುದಾನ, ಆಡಳಿತ"
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ವಿವರಣೆ (Description / Scope)
                </label>
                <input
                  type="text"
                  placeholder="ಉದಾ: ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಗಳ ಶಾಖೆ"
                  value={newSecDesc}
                  onChange={(e) => setNewSecDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                💡 ಈ ಸಂಕೇತ ಮತ್ತು ಹೆಸರು ಪ್ರತಿ ಪತ್ರದ ಅಧಿಕೃತ ಸಂಖ್ಯೆಯಲ್ಲಿ (ಉದಾ: <code>ಇಡಿ/ಬಿಇಒ/ಭದ್ರಾ/{newSecCode || 'ಆ1'}({newSecName || 'ಸ.ಪ್ರಾ.ಶಿ'})/...</code>) ಬಳಸಲ್ಪಡುತ್ತದೆ.
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold cursor-pointer"
                >
                  ರದ್ದುಮಾಡಿ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSection}
                  className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-300 rounded-lg font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingSection ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ವಿಭಾಗ ಸೇರಿಸಿ (Save Section)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: VIEW LETTERS UNDER FILE & REPRINT ===================== */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-sky-950 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-stone-950 text-xs font-black font-mono">
                    ಕಡತ ಸಂಖ್ಯೆ: {selectedFileForModal.fileNumber}
                  </span>
                  <span className="text-xs text-sky-200">
                    ವಿಭಾಗ: {selectedFileForModal.sectionCode || 'ಆ1'} ({selectedFileForModal.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ'})
                  </span>
                </div>
                <h3 className="text-base font-bold text-white line-clamp-1">
                  {selectedFileForModal.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFileForModal(null)}
                className="text-stone-300 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: File summary & Letters list */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* File Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-700">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">ತಯಾರಿಸಿದ ದಿನಾಂಕ</span>
                  <span className="font-semibold text-stone-900">{selectedFileForModal.initiatedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">ಕಸ್ಟೋಡಿಯನ್</span>
                  <span className="font-semibold text-stone-900">{selectedFileForModal.currentCustodian}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">ಸ್ಥಿತಿ (Status)</span>
                  <span className="font-semibold text-emerald-700">{selectedFileForModal.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">ಒಟ್ಟು ಪತ್ರಗಳು</span>
                  <span className="font-extrabold text-sky-950 font-mono">
                    {(selectedFileForModal as any).computedCount || selectedFileForModal.linkedLetterIds?.length || 0}
                  </span>
                </div>
              </div>

              {/* Letters Table / Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-700" />
                    <span>ಈ ಕಡತದಲ್ಲಿ ಸೃಜಿಸಲಾದ ಪತ್ರಗಳ ಪಟ್ಟಿ (Letters in this File)</span>
                  </h4>
                  <button
                    id="btn-draft-inside-file-modal"
                    onClick={() => {
                      const f = selectedFileForModal;
                      setSelectedFileForModal(null);
                      onNavigate('generalLetter', {
                        prefillFileNumber: f.fileNumber,
                        prefillSectionCode: f.sectionCode || 'ಆ1',
                        prefillSectionName: f.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ',
                        prefillSubject: f.subject
                      });
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ಹೊಸ ಪತ್ರ ತಯಾರಿಸಿ</span>
                  </button>
                </div>

                {(() => {
                  const linkedLetters = (selectedFileForModal as any).computedLetters ||
                    letters.filter(l => l.fileNumber === selectedFileForModal.fileNumber || selectedFileForModal.linkedLetterIds?.includes(l.id));

                  if (linkedLetters.length === 0) {
                    return (
                      <div className="p-6 text-center bg-stone-50 rounded-xl border border-stone-200">
                        <FileText className="w-8 h-8 text-stone-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-stone-700">ಈ ಕಡತದಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಪತ್ರಗಳು ಸೃಜನೆಯಾಗಿಲ್ಲ.</p>
                        <p className="text-[11px] text-stone-500 mt-1">ಮೇಲಿನ "+ ಹೊಸ ಪತ್ರ ತಯಾರಿಸಿ" ಬಟನ್ ಒತ್ತಿ ಪತ್ರ ಸೃಜಿಸಿ.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      {linkedLetters.map((letItem: EducationLetter, idx: number) => {
                        const shortNo = letItem.fileLetterNumber || `${selectedFileForModal.fileNumber}-${idx + 1}`;
                        return (
                          <div
                            key={letItem.id}
                            className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-sky-300 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-sky-950 text-amber-300 font-mono font-bold text-[11px]">
                                  ಪತ್ರ ಸಂ: {shortNo}
                                </span>
                                <span className="text-[11px] font-mono text-stone-600 font-semibold">
                                  {letItem.referenceNumber}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  • ದಿನಾಂಕ: {letItem.dateReceivedOrIssued}
                                </span>
                              </div>
                              <p className="font-bold text-stone-900 text-xs line-clamp-1">
                                ವಿಷಯ: {letItem.subject}
                              </p>
                              {letItem.recipientName && (
                                <p className="text-[11px] text-stone-500 line-clamp-1">
                                  ಸ್ವೀಕೃತಿದಾರರು: {letItem.recipientName}
                                </p>
                              )}
                            </div>

                            {/* REPRINT ACTION BUTTON */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                id={`btn-reprint-letter-${letItem.id}`}
                                onClick={() => setLetterForReprint(letItem)}
                                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                                title="ಅಧಿಕೃತ ಸರಕಾರಿ ಪತ್ರದ ಮಾದರಿಯಲ್ಲಿ ರಿಪ್ರಿಂಟ್ (Reprint) ಮುದ್ರಿಸಿ"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>ರಿಪ್ರಿಂಟ್ (Reprint)</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedFileForModal(null)}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                ಮುಚ್ಚಿ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: LETTER REPRINT VIEWER & PRINTER ===================== */}
      {letterForReprint && (
        <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Action Bar (Not Printed) */}
            <div className="p-3.5 bg-sky-950 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">
                  ಪತ್ರ ಮರುಮುದ್ರಣ (Letter Reprint Preview) • {letterForReprint.fileLetterNumber || letterForReprint.referenceNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-print-letter-now"
                  onClick={handleTriggerPrint}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ ಪ್ರಿಂಟ್ ತೆಗೆಯಿರಿ (Print Now)</span>
                </button>
                <button
                  onClick={() => setLetterForReprint(null)}
                  className="p-1 text-stone-300 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Kannada Letter Print Layout */}
            <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white font-serif leading-relaxed text-stone-900 selection:bg-amber-200 print:p-0 print:overflow-visible">
              {/* Official Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-stone-800">
                <p className="text-sm font-bold tracking-wider text-stone-900">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</p>
                <p className="text-base font-extrabold text-stone-950">ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</p>
                <h2 className="text-lg font-black text-stone-950">ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ</h2>
                <p className="text-xs text-stone-600">ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301 • ದೂರವಾಣಿ: 08282-268241</p>
              </div>

              {/* Number and Date */}
              <div className="flex items-center justify-between text-xs font-bold mt-4 pt-2">
                <div>
                  ಸಂಖ್ಯೆ: <span className="font-mono">{letterForReprint.referenceNumber}</span>
                </div>
                <div>
                  ದಿನಾಂಕ: {letterForReprint.dateReceivedOrIssued}
                </div>
              </div>

              {/* Recipient */}
              <div className="mt-6 text-xs leading-relaxed space-y-0.5">
                <p className="font-bold">ಇವರಿಗೆ,</p>
                <p className="font-semibold">{letterForReprint.recipientName || 'ಸಂಬಂಧಪಟ್ಟ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು / ಅಧಿಕಾರಿಗಳು'}</p>
                <p>{letterForReprint.recipientDepartment || 'ಸರ್ಕಾರಿ ಶಾಲೆ / ಕಚೇರಿ'}</p>
                <p>ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯ.</p>
              </div>

              {/* Subject & Reference */}
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-bold whitespace-nowrap">ವಿಷಯ:</span>
                  <span className="font-extrabold leading-snug">{letterForReprint.subject}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold whitespace-nowrap">ಉಲ್ಲೇಖ:</span>
                  <span>ಈ ಕಚೇರಿಯ ಕಡತ ಸಂಖ್ಯೆ: {letterForReprint.fileNumber} ದಿನಾಂಕ: {letterForReprint.dateReceivedOrIssued} ರ ನಡವಳಿಗಳು.</span>
                </div>
              </div>

              {/* Salutation & Body */}
              <div className="mt-6 text-xs leading-relaxed space-y-3 text-justify">
                <p className="font-bold">ಮಾನ್ಯರೇ,</p>
                {letterForReprint.bodyText ? (
                  <div className="whitespace-pre-line leading-relaxed">
                    {letterForReprint.bodyText}
                  </div>
                ) : (
                  <p>
                    ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬರುವ ಸಂಬಂಧಪಟ್ಟ ಸಂಸ್ಥೆಗಳು ಹಾಗೂ ಸಿಬ್ಬಂದಿಯವರು ಕಚೇರಿ ನಿಯಮಾವಳಿಗಳಂತೆ ಕ್ರಮವಹಿಸಬೇಕಾಗಿ ಈ ಮೂಲಕ ತಿಳಿಸಿದೆ.
                  </p>
                )}
              </div>

              {/* Signature Block */}
              <div className="mt-12 flex justify-end text-xs">
                <div className="text-center space-y-1">
                  <div className="h-10"></div>
                  <p className="font-bold text-stone-950">ತಮ್ಮ ನಂಬಿಕಸ್ಥ,</p>
                  <p className="font-extrabold text-stone-950 mt-4">(ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು)</p>
                  <p className="text-stone-700">ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ</p>
                  <p className="text-[10px] text-stone-500 font-mono">ವಿಭಾಗ: {letterForReprint.sectionCode || 'ಆ1'} ({letterForReprint.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ'})</p>
                </div>
              </div>

              {/* Endorsements / Copies */}
              <div className="mt-8 pt-4 border-t border-stone-300 text-[11px] leading-relaxed text-stone-700">
                <p className="font-bold">ಪ್ರತಿ ರವಾನೆ:</p>
                <ol className="list-decimal list-inside space-y-0.5 mt-1 text-stone-600">
                  <li>ಉಪನಿರ್ದೇಶಕರು (ಆಡಳಿತ), ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ ರವರ ಅವಗಾಹನೆಗಾಗಿ.</li>
                  <li>ಸಂಬಂಧಪಟ್ಟ ಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು / ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಸೂಕ್ತ ಕ್ರಮಕ್ಕಾಗಿ.</li>
                  <li>ಕಡತ ಸಂಖ್ಯೆ: <span className="font-mono font-bold text-stone-900">{letterForReprint.fileNumber}</span> (ಪತ್ರ ಸಂ: {letterForReprint.fileLetterNumber || '1'}).</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
