import React, { useState, useMemo } from 'react';
import { 
  MasterDocketFile, 
  EducationLetter, 
  FileMovementRecord, 
  LetterPriority 
} from '../types';
import { 
  FolderGit2, 
  Search, 
  Send, 
  Clock, 
  User, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  TrendingUp,
  Award,
  AlertTriangle,
  Printer,
  Calendar,
  Layers,
  FileCheck2,
  Building,
  RefreshCw,
  Sparkles,
  UserCheck,
  Briefcase
} from 'lucide-react';

interface FileDashboardProps {
  files: MasterDocketFile[];
  letters: EducationLetter[];
  onMoveFile: (fileId: string, fromOfficer: string, toOfficer: string, remarks: string, newStatus?: string) => Promise<void>;
  onCreateFile?: (fileData: Partial<MasterDocketFile>) => Promise<void>;
  onDraftLetterForFile?: (file: MasterDocketFile) => void;
  onViewLetter?: (letter: EducationLetter) => void;
  onShowToast?: (msg: string) => void;
}

export type CategoryFilterKey = 
  | 'all'
  | 'pension'
  | 'promotion'
  | 'disciplinary'
  | 'salary'
  | 'leave'
  | 'accounts'
  | 'rti'
  | 'academic'
  | 'general';

interface CategoryTab {
  key: CategoryFilterKey;
  labelKn: string;
  labelEn: string;
  icon: React.ElementType;
  badgeClass: string;
  accentColor: string;
  matcher: (file: MasterDocketFile) => boolean;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    key: 'all',
    labelKn: 'ಎಲ್ಲಾ ಕಡತಗಳು',
    labelEn: 'All Dockets',
    icon: Layers,
    badgeClass: 'bg-stone-800 text-white',
    accentColor: '#2b2b2b',
    matcher: () => true,
  },
  {
    key: 'pension',
    labelKn: 'ಪಿಂಚಣಿ & ನಿವೃತ್ತಿ',
    labelEn: 'Pension & Retirement',
    icon: Award,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    accentColor: '#d97706',
    matcher: (f) => {
      const cat = (f.fileCategory || '').toLowerCase();
      const sub = (f.subject || '').toLowerCase();
      const num = (f.fileNumber || '').toLowerCase();
      return cat.includes('pension') || cat.includes('ಪಿಂಚಣಿ') || sub.includes('ನಿವೃತ್ತಿ') || sub.includes('pension') || sub.includes('ಪಿಂಚಣಿ') || num.includes('pen') || num === '57';
    },
  },
  {
    key: 'promotion',
    labelKn: 'ವೇತನ ಬಡ್ತಿ & ಪರಿಷ್ಕರಣೆ',
    labelEn: 'Promotion & Pay Revision',
    icon: TrendingUp,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentColor: '#059669',
    matcher: (f) => {
      const cat = (f.fileCategory || '').toLowerCase();
      const sub = (f.subject || '').toLowerCase();
      const num = (f.fileNumber || '').toLowerCase();
      return cat.includes('promotion') || cat.includes('ಬಡ್ತಿ') || sub.includes('ಬಡ್ತಿ') || sub.includes('ಹಿರಿಯ ಶ್ರೇಣಿ') || sub.includes('ಆಯ್ಕೆ ಶ್ರೇಣಿ') || num.includes('prom');
    },
  },
  {
    key: 'disciplinary',
    labelKn: 'ಇಲಾಖಾ ವಿಚಾರಣೆ & ಶಿಸ್ತು ಕ್ರಮ',
    labelEn: 'Disciplinary & Inquiries',
    icon: ShieldAlert,
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    accentColor: '#e11d48',
    matcher: (f) => {
      const cat = (f.fileCategory || '').toLowerCase();
      const sub = (f.subject || '').toLowerCase();
      const num = (f.fileNumber || '').toLowerCase();
      return cat.includes('disciplinary') || cat.includes('ಶಿಸ್ತು') || cat.includes('ವಿಚಾರಣೆ') || sub.includes('ಶಿಸ್ತು') || sub.includes('ವಿಚಾರಣೆ') || sub.includes('ಸಿ.ಸಿ.ಎ') || sub.includes('cca') || num.includes('disc');
    },
  },
  {
    key: 'salary',
    labelKn: 'ವೇತನ & ಭತ್ಯೆಗಳು',
    labelEn: 'Salary & Increments',
    icon: FileCheck2,
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    accentColor: '#0d9488',
    matcher: (f) => {
      const cat = (f.fileCategory || '').toLowerCase();
      const sub = (f.subject || '').toLowerCase();
      return cat.includes('salary') || cat.includes('ವೇತನ') || sub.includes('ಪ್ರಪತ್ರ-೨೮') || sub.includes('ವೇತನ ಬಡ್ತಿ');
    },
  },
  {
    key: 'leave',
    labelKn: 'ರಜೆ & ಸೇವಾ ವಿಷಯಗಳು',
    labelEn: 'Leave & Service Records',
    icon: UserCheck,
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    accentColor: '#4f46e5',
    matcher: (f) => {
      const cat = (f.fileCategory || '').toLowerCase();
      const sub = (f.subject || '').toLowerCase();
      return cat.includes('leave') || cat.includes('service') || sub.includes('ರಜೆ') || sub.includes('ಶಿಶುಪಾಲನ') || sub.includes('ಸೇವಾ');
    },
  },
  {
    key: 'accounts',
    labelKn: 'ಲೆಕ್ಕಪತ್ರ & ಶಾಲಾ ಅನುದಾನ',
    labelEn: 'Accounts & Grants',
    icon: Building,
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    accentColor: '#2563eb',
    matcher: (f) => {
      const cat = (f.fileCategory || '').toLowerCase();
      const sub = (f.subject || '').toLowerCase();
      return cat.includes('accounts') || cat.includes('grants') || cat.includes('ಅನುದಾನ') || sub.includes('ಅನುದಾನ') || sub.includes('ಬಜೆಟ್');
    },
  },
  {
    key: 'rti',
    labelKn: 'ಮಾಹಿತಿ ಹಕ್ಕು (RTI)',
    labelEn: 'RTI & Legal',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-200 text-stone-900 border-amber-400 font-bold',
    accentColor: '#f59e0b',
    matcher: (f) => {
      const cat = (f.fileCategory || '').toLowerCase();
      const sub = (f.subject || '').toLowerCase();
      return f.isRtiFile || cat.includes('rti') || sub.includes('ಮಾಹಿತಿ ಹಕ್ಕು') || sub.includes('ಕಲಂ');
    },
  },
];

const OFFICER_LIST = [
  'ವಿಷಯ ನಿರ್ವಾಹಕರು (Case Worker - ಸೇವಾ ಶಾಖೆ)',
  'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಸಿಬ್ಬಂದಿ ಶಾಖೆ)',
  'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಲೆಕ್ಕ & ಅನುದಾನ ಶಾಖೆ)',
  'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (Office Superintendent - OS)',
  'ಸಹಾಯಕ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು (Asst Accounts Officer - AAO)',
  'ವಿಷಯ ಪರಿವೀಕ್ಷಕರು (Subject Inspector / Education Coordinator)',
  'ಕ್ಷೇತ್ರ ಸಮನ್ವಯಾಧಿಕಾರಿಗಳು (BCO / BRC Bhadravathi)',
  'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು (Block Education Officer - BEO)',
  'ಉಪನಿರ್ದೇಶಕರು - ಡಿಡಿಪಿಐ ಕಛೇರಿ (DDPI Shivamogga)',
  'ಮಹಾಲೇಖಪಾಲರ ಕಛೇರಿ (Accountant General - AG Karnataka)',
];

export const FileDashboard: React.FC<FileDashboardProps> = ({
  files,
  letters,
  onMoveFile,
  onCreateFile,
  onDraftLetterForFile,
  onViewLetter,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Selected Docket for Timeline inspection
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    // Default to pension docket or first file
    const pen = files.find(f => f.fileNumber === '57' || f.fileCategory?.includes('Pension') || f.subject?.includes('ಪಿಂಚಣಿ'));
    return pen ? pen.id : (files[0]?.id || '');
  });

  // Forward Modal state
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardFromOfficer, setForwardFromOfficer] = useState('');
  const [forwardToOfficer, setForwardToOfficer] = useState(OFFICER_LIST[3]);
  const [forwardRemarks, setForwardRemarks] = useState('');
  const [forwardStatus, setForwardStatus] = useState<string>('Under Scrutiny');
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);

  // Filtered files
  const filteredFiles = useMemo(() => {
    const currentCatTab = CATEGORY_TABS.find(t => t.key === selectedCategory) || CATEGORY_TABS[0];
    
    return files.filter(file => {
      // 1. Category match
      if (!currentCatTab.matcher(file)) return false;

      // 2. Status match
      if (statusFilter !== 'all' && file.status !== statusFilter) return false;

      // 3. Priority match
      if (priorityFilter !== 'all' && file.priority !== priorityFilter) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (file.fileNumber || '').toLowerCase();
        const sub = (file.subject || '').toLowerCase();
        const cust = (file.currentCustodian || '').toLowerCase();
        const cat = (file.fileCategory || '').toLowerCase();
        const notes = (file.notes || '').toLowerCase();
        return num.includes(q) || sub.includes(q) || cust.includes(q) || cat.includes(q) || notes.includes(q);
      }

      return true;
    });
  }, [files, selectedCategory, statusFilter, priorityFilter, searchQuery]);

  // Selected file object
  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId) || filteredFiles[0] || files[0] || null;
  }, [files, selectedFileId, filteredFiles]);

  // Letters linked to selected docket
  const linkedLetters = useMemo(() => {
    if (!selectedFile) return [];
    return letters.filter(l => 
      (selectedFile.linkedLetterIds && selectedFile.linkedLetterIds.includes(l.id)) ||
      l.fileNumber === selectedFile.fileNumber ||
      (selectedFile.fileNumber === '57' && (l.fileNumber === '57' || l.letterNumber?.includes('219-01'))) ||
      (selectedFile.fileNumber === '45' && (l.fileNumber === '45' || l.letterNumber?.includes('45-')))
    );
  }, [selectedFile, letters]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilterKey, number> = {
      all: files.length,
      pension: 0,
      promotion: 0,
      disciplinary: 0,
      salary: 0,
      leave: 0,
      accounts: 0,
      rti: 0,
      academic: 0,
      general: 0,
    };

    files.forEach(f => {
      CATEGORY_TABS.forEach(t => {
        if (t.key !== 'all' && t.matcher(f)) {
          counts[t.key] = (counts[t.key] || 0) + 1;
        }
      });
    });

    return counts;
  }, [files]);

  // Open Forward File modal
  const handleOpenForwardModal = (file: MasterDocketFile) => {
    setForwardFromOfficer(file.currentCustodian || 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)');
    setForwardToOfficer(OFFICER_LIST[7]); // BEO
    setForwardRemarks('');
    setForwardStatus(file.status === 'Active / Open' ? 'Under Scrutiny' : 'Pending Higher Approval');
    setIsForwardModalOpen(true);
  };

  // Submit file movement
  const handleForwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!forwardRemarks.trim()) {
      alert('ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಷರಾ (Noting/Remarks) ನಮೂದಿಸಿ.');
      return;
    }

    try {
      setIsSubmittingMove(true);
      await onMoveFile(
        selectedFile.id,
        forwardFromOfficer.trim(),
        forwardToOfficer.trim(),
        forwardRemarks.trim(),
        forwardStatus
      );

      if (onShowToast) {
        onShowToast(`ಕಡತ ಸಂಖ್ಯೆ "${selectedFile.fileNumber}" ಯಶಸ್ವಿಯಾಗಿ ರವಾನಿಸಲಾಗಿದೆ → ${forwardToOfficer}`);
      }
      setIsForwardModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'ಕಡತ ರವಾನಿಸಲು ವಿಫಲವಾಗಿದೆ.');
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const getPriorityBadge = (priority: LetterPriority) => {
    switch (priority) {
      case 'Immediate':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-100 text-rose-800 border border-rose-300">ತುರ್ತು (Immediate)</span>;
      case 'Urgent':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800 border border-amber-300">ಅಗತ್ಯ (Urgent)</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded bg-stone-100 text-stone-700 border border-stone-300">ಸಾಮಾನ್ಯ (Routine)</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active / Open':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>ಸಕ್ರಿಯ (Open)</span>;
      case 'Under Scrutiny':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ (Scrutiny)</span>;
      case 'Pending Higher Approval':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>ಅನುಮೋದನೆ ಬಾಕಿ (Pending BEO)</span>;
      case 'Disposed / Closed':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-stone-100 text-stone-600 border border-stone-300 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-400"></span>ವಿಲೇವಾರಿ (Closed)</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-xl p-5 border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-[#2b2b2b] text-[#f59e0b] flex items-center justify-center font-bold shadow-[2px_2px_0px_#f59e0b]">
              <FolderGit2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2b2b2b] font-kannada flex items-center gap-2">
                ಕಡತಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ & ಚಲನವಲನ (File Dashboard & Movement Tracking)
              </h2>
              <p className="text-xs text-stone-600 font-kannada">
                ಪಿಂಚಣಿ, ಬಡ್ತಿ, ಶಿಸ್ತು ಕ್ರಮ, ವೇತನ ಹಾಗೂ ಅನುದಾನ ಕಡತಗಳ ವರ್ಗೀಕರಣ ಮತ್ತು ಅಧಿಕೃತ ಚಲನವಲನ (File Movement Timeline)
              </p>
            </div>
          </div>
        </div>

        {/* Quick Rule Tag: First make file, then letter */}
        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3 text-xs text-amber-950 font-kannada flex items-start gap-2 shadow-[2px_2px_0px_rgba(245,158,11,0.4)] shrink-0 max-w-md">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900 block">ಸರ್ಕಾರಿ ಕಾರ್ಯವಿಧಾನದ ಕಡ್ಡಾಯ ನಿಯಮ:</span>
            <span>"ಮೊದಲು ಯಾವುದೇ ಪತ್ರ ತಯಾರಿಸುವ ಮೊದಲು ಕಡತ ತಯಾರಿಸಬೇಕು ನಂತರ ಪತ್ರ ತಯಾರಿಸಬೇಕು."</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills / Tabs */}
      <div className="bg-white rounded-xl p-3 border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b]">
        <div className="text-xs font-bold text-stone-700 mb-2 font-kannada flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-600" />
            ಕಡತಗಳ ವರ್ಗೀಕರಣದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ (Filter by Docket Category):
          </span>
          <span className="text-[11px] font-normal text-stone-500">
            ಒಟ್ಟು ಕಡತಗಳು: <strong>{files.length}</strong> | ಪ್ರದರ್ಶಿತ: <strong>{filteredFiles.length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.key;
            const count = categoryCounts[tab.key] || 0;

            return (
              <button
                key={tab.key}
                id={`cat-filter-${tab.key}`}
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border-2 ${
                  isSelected
                    ? 'bg-[#2b2b2b] text-white border-[#2b2b2b] shadow-[3px_3px_0px_#f59e0b] -translate-y-0.5'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-300 shadow-[1px_1px_0px_#2b2b2b]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#f59e0b]' : 'text-stone-500'}`} />
                <span className="font-kannada">{tab.labelKn}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-[#f59e0b] text-[#2b2b2b]' : 'bg-stone-200 text-stone-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Pane Layout: Left List of Dockets, Right Timeline & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Dockets List & Search (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Sub-filters */}
          <div className="bg-white rounded-xl p-4 border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="search-dockets-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ಕಡತ ಸಂಖ್ಯೆ (ಉದಾ: 57, 45), ವಿಷಯ, ಅಧಿಕಾರಿ..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 rounded-lg border-2 border-stone-300 focus:outline-none focus:border-[#2b2b2b] font-kannada"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Status & Priority Filter */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1 font-kannada">ಸ್ಥಿತಿ (Status):</label>
                <select
                  id="select-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-stone-50 rounded border border-stone-300 focus:outline-none focus:border-[#2b2b2b] font-kannada"
                >
                  <option value="all">ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು (All)</option>
                  <option value="Active / Open">ಸಕ್ರಿಯ (Open)</option>
                  <option value="Under Scrutiny">ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ (Scrutiny)</option>
                  <option value="Pending Higher Approval">ಅನುಮೋದನೆ ಬಾಕಿ (Pending BEO)</option>
                  <option value="Disposed / Closed">ವಿಲೇವಾರಿ (Closed)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1 font-kannada">ಆದ್ಯತೆ (Priority):</label>
                <select
                  id="select-priority-filter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-stone-50 rounded border border-stone-300 focus:outline-none focus:border-[#2b2b2b] font-kannada"
                >
                  <option value="all">ಎಲ್ಲಾ ಆದ್ಯತೆ (All)</option>
                  <option value="Immediate">ತುರ್ತು (Immediate)</option>
                  <option value="Urgent">ಅಗತ್ಯ (Urgent)</option>
                  <option value="Routine">ಸಾಮಾನ್ಯ (Routine)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dockets List */}
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredFiles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border-2 border-dashed border-stone-300 text-center space-y-2">
                <FolderGit2 className="w-8 h-8 mx-auto text-stone-400" />
                <p className="text-sm font-bold text-stone-700 font-kannada">ಯಾವುದೇ ಕಡತಗಳು ಕಂಡುಬಂದಿಲ್ಲ</p>
                <p className="text-xs text-stone-500">ಫಿಲ್ಟರ್ ಅಥವಾ ಹುಡುಕಾಟದ ಪದಗಳನ್ನು ಬದಲಾಯಿಸಿ ಪ್ರಯತ್ನಿಸಿ.</p>
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                const movementCount = file.movementHistory?.length || 0;

                return (
                  <div
                    key={file.id}
                    id={`docket-card-${file.id}`}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2b2b2b] shadow-[4px_4px_0px_#f59e0b] bg-amber-50/40 -translate-y-0.5'
                        : 'border-stone-200 hover:border-stone-400 shadow-sm hover:shadow'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-[#2b2b2b] text-[#f59e0b] px-2 py-0.5 rounded border border-[#2b2b2b]">
                          ಕಡತ ಸಂ: {file.fileNumber}
                        </span>
                        {file.sectionCode && (
                          <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-300 font-mono font-bold">
                            {file.sectionCode} / {file.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ'}
                          </span>
                        )}
                        {getPriorityBadge(file.priority)}
                      </div>

                      {getStatusBadge(file.status)}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[#2b2b2b] line-clamp-2 mb-2 font-kannada leading-snug">
                      {file.subject}
                    </h4>

                    {file.fileCategory && (
                      <div className="mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-300 font-medium inline-block font-kannada">
                          📁 {file.fileCategory}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600 font-kannada">
                      <div className="flex items-center gap-1 truncate max-w-[220px]">
                        <User className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{file.currentCustodian || 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು'}</span>
                      </div>

                      <div className="flex items-center gap-1 text-emerald-800 font-bold shrink-0">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{movementCount} ಚಲನವಲನ</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Visual File Movement Timeline & Full Docket View (7 Columns) */}
        <div className="lg:col-span-7">
          {selectedFile ? (
            <div className="bg-white rounded-xl border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] overflow-hidden">
              {/* Header of Selected Docket */}
              <div className="bg-[#2b2b2b] text-white p-5 border-b-2 border-[#2b2b2b]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded bg-[#f59e0b] text-[#2b2b2b] font-mono font-bold text-xs">
                      ಕಡತ ಸಂಖ್ಯೆ: {selectedFile.fileNumber}
                    </span>
                    <span className="text-xs bg-stone-800 text-stone-200 px-2 py-0.5 rounded font-mono">
                      ಪ್ರಾರಂಭ: {selectedFile.initiatedDate}
                    </span>
                    {getPriorityBadge(selectedFile.priority)}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedFile.status)}
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#fffbf2] font-kannada leading-snug mb-3">
                  {selectedFile.subject}
                </h3>

                {/* Custodian & Action Bar */}
                <div className="bg-black/40 rounded-lg p-3 border border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block font-kannada">ಪ್ರಸ್ತುತ ಕಡತ ಇರುವ ಅಧಿಕಾರಿ (Current Custodian):</span>
                      <strong className="text-amber-300 font-kannada text-xs">{selectedFile.currentCustodian}</strong>
                    </div>
                  </div>

                  {/* Primary Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="btn-forward-docket"
                      onClick={() => handleOpenForwardModal(selectedFile)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#10b981] cursor-pointer font-kannada"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ಫಾರ್ವರ್ಡ್ ಮಾಡಿ</span>
                    </button>

                    {onDraftLetterForFile && (
                      <button
                        id="btn-draft-letter-for-file"
                        onClick={() => onDraftLetterForFile(selectedFile)}
                        className="px-3 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-amber-500 text-[#2b2b2b] font-bold text-xs flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#2b2b2b] cursor-pointer font-kannada"
                        title="ಈ ಕಡತದ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿ ಹೊಸ ಪತ್ರ ಸೃಜಿಸಿ"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>ಪತ್ರ ರಚಿಸಿ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="p-5 space-y-6">
                <div className="flex items-center justify-between border-b pb-3 border-stone-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-stone-900 font-kannada">
                      ಕಡತದ ಅಧಿಕೃತ ಚಲನವಲನ ವಿವರಗಳು (Visual File Movement Timeline)
                    </h4>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    ಒಟ್ಟು {selectedFile.movementHistory?.length || 0} ಹಂತಗಳು
                  </span>
                </div>

                {/* Visual Timeline Cards */}
                {(!selectedFile.movementHistory || selectedFile.movementHistory.length === 0) ? (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-stone-400" />
                    <p className="text-xs font-bold text-stone-700 font-kannada">ಈ ಕಡತಕ್ಕೆ ಯಾವುದೇ ಚಲನವಲನ ದಾಖಲಾಗಿಲ್ಲ</p>
                    <button
                      onClick={() => handleOpenForwardModal(selectedFile)}
                      className="px-3 py-1.5 bg-[#2b2b2b] text-white text-xs rounded font-bold hover:bg-black font-kannada"
                    >
                      ಮೊದಲ ಚಲನವಲನ ದಾಖಲಿಸಿ
                    </button>
                  </div>
                ) : (
                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-300">
                    {selectedFile.movementHistory.map((mov, index) => {
                      const isLatest = index === selectedFile.movementHistory.length - 1;

                      return (
                        <div key={mov.id || index} className="relative group">
                          {/* Step Bullet Icon */}
                          <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm ${
                            isLatest
                              ? 'bg-emerald-600 text-white border-white ring-4 ring-emerald-100 animate-pulse'
                              : 'bg-white text-[#2b2b2b] border-[#2b2b2b]'
                          }`}>
                            {index + 1}
                          </div>

                          {/* Step Content Box */}
                          <div className={`rounded-xl p-4 border-2 transition-all ${
                            isLatest
                              ? 'bg-emerald-50/50 border-emerald-500 shadow-[3px_3px_0px_#10b981]'
                              : 'bg-stone-50 border-stone-200 shadow-sm'
                          }`}>
                            {/* Step Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                <span>{mov.sentDate}</span>
                              </div>

                              {mov.statusAfterMove && (
                                <div>{getStatusBadge(mov.statusAfterMove)}</div>
                              )}
                            </div>

                            {/* Officer Flow */}
                            <div className="bg-white rounded-lg p-3 border border-stone-200 mb-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-kannada">
                                <span className="text-stone-500 font-medium text-[11px] shrink-0">ಇವರಿಂದ (From):</span>
                                <strong className="text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                                  {mov.fromOfficer}
                                </strong>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-kannada">
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="text-stone-500 font-medium text-[11px] shrink-0">ಇವರಿಗೆ (To):</span>
                                <strong className="text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                                  {mov.toOfficer}
                                </strong>
                              </div>
                            </div>

                            {/* Remarks / Official Noting */}
                            {mov.remarks && (
                              <div className="bg-amber-50/70 border-l-4 border-amber-400 p-2.5 rounded-r text-xs text-stone-800 font-kannada space-y-1">
                                <span className="text-[10px] font-bold text-amber-900 uppercase block tracking-wider">
                                  ಅಧಿಕೃತ ಷರಾ (Official Noting / Remarks):
                                </span>
                                <p className="leading-relaxed">{mov.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Linked Letters Section */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-stone-800 font-kannada flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#f59e0b]" />
                      ಈ ಕಡತದ ಅಡಿಯಲ್ಲಿ ಸೃಜಿಸಲಾದ ಪತ್ರಗಳು ({linkedLetters.length})
                    </h5>
                    {onDraftLetterForFile && (
                      <button
                        onClick={() => onDraftLetterForFile(selectedFile)}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer font-kannada"
                      >
                        <Plus className="w-3 h-3" /> ಹೊಸ ಪತ್ರ ರಚಿಸಿ
                      </button>
                    )}
                  </div>

                  {linkedLetters.length === 0 ? (
                    <p className="text-xs text-stone-500 font-kannada italic bg-stone-50 p-3 rounded border border-stone-200">
                      ಈ ಕಡತಕ್ಕೆ ಯಾವುದೇ ಅಧಿಕೃತ ಪತ್ರಗಳು ಇನ್ನೂ ಜೋಡಣೆಯಾಗಿಲ್ಲ.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {linkedLetters.map((letItem) => (
                        <div
                          key={letItem.id}
                          className="bg-stone-50 rounded-lg p-2.5 border border-stone-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#2b2b2b] bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                                {letItem.letterNumber}
                              </span>
                              <span className="text-stone-500 text-[10px]">{letItem.date}</span>
                            </div>
                            <p className="font-bold text-stone-800 line-clamp-1 mt-1 font-kannada">{letItem.subject}</p>
                          </div>

                          {onViewLetter && (
                            <button
                              onClick={() => onViewLetter(letItem)}
                              className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-800 rounded border border-stone-300 text-[11px] font-bold cursor-pointer shrink-0 font-kannada"
                            >
                              ವೀಕ್ಷಿಸಿ
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Docket Notes & Attachments */}
                {selectedFile.notes && (
                  <div className="bg-stone-100 rounded-lg p-3 border border-stone-200 text-xs font-kannada text-stone-700">
                    <span className="font-bold block text-stone-900 mb-0.5">ಕಡತದ ಟಿಪ್ಪಣಿ:</span>
                    <p>{selectedFile.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border-2 border-dashed border-stone-300 text-center space-y-3">
              <FolderGit2 className="w-12 h-12 mx-auto text-stone-400" />
              <h3 className="text-base font-bold text-stone-700 font-kannada">ಕಡತವನ್ನು ಆಯ್ಕೆಮಾಡಿ</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                ಎಡಭಾಗದ ಪಟ್ಟಿಯಿಂದ ಕಡತವನ್ನು ಆಯ್ಕೆಮಾಡಿಕೊಂಡು ಅದರ ವಿವರವಾದ ಚಲನವಲನ ಟೈಮ್‌ಲೈನ್ ಹಾಗೂ ಸಂಬಂಧಿತ ಪತ್ರಗಳನ್ನು ವೀಕ್ಷಿಸಿ.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Forward File (ಕಡತ ರವಾನಿಸಿ) */}
      {isForwardModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border-2 border-[#2b2b2b] shadow-[6px_6px_0px_#2b2b2b] w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-[#2b2b2b] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#f59e0b]" />
                <h3 className="text-base font-bold font-kannada text-[#fffbf2]">
                  ಕಡತ ರವಾನಿಸಿ (Forward File Movement)
                </h3>
              </div>
              <button
                onClick={() => setIsForwardModalOpen(false)}
                className="text-stone-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleForwardSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-300 text-xs font-kannada">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900">ಕಡತ ಸಂಖ್ಯೆ:</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-400">{selectedFile.fileNumber}</span>
                </div>
                <p className="text-stone-700 mt-1 line-clamp-1">{selectedFile.subject}</p>
              </div>

              {/* From Officer */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 font-kannada">
                  ರವಾನಿಸುವವರು (From Officer):
                </label>
                <input
                  type="text"
                  value={forwardFromOfficer}
                  onChange={(e) => setForwardFromOfficer(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-[#2b2b2b] font-kannada"
                />
              </div>

              {/* To Officer */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 font-kannada">
                  ಸ್ವೀಕರಿಸುವ ಅಧಿಕಾರಿ (To Officer):
                </label>
                <select
                  value={forwardToOfficer}
                  onChange={(e) => setForwardToOfficer(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-[#2b2b2b] font-kannada"
                >
                  {OFFICER_LIST.map((officer) => (
                    <option key={officer} value={officer}>{officer}</option>
                  ))}
                </select>
              </div>

              {/* Status After Move */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 font-kannada">
                  ರವಾನೆಯ ನಂತರದ ಕಡತದ ಸ್ಥಿತಿ (Status After Move):
                </label>
                <select
                  value={forwardStatus}
                  onChange={(e) => setForwardStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-[#2b2b2b] font-kannada"
                >
                  <option value="Under Scrutiny">ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ (Under Scrutiny)</option>
                  <option value="Pending Higher Approval">ಮೇಲಧಿಕಾರಿಗಳ ಅನುಮೋದನೆ ಬಾಕಿ (Pending Higher Approval)</option>
                  <option value="Active / Open">ಸಕ್ರಿಯ (Active / Open)</option>
                  <option value="Disposed / Closed">ಅಂತಿಮ ವಿಲೇವಾರಿ (Disposed / Closed)</option>
                </select>
              </div>

              {/* Remarks / Official Noting */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 font-kannada">
                  ಅಧಿಕೃತ ಷರಾ / ಟಿಪ್ಪಣಿ (Noting / Remarks):
                </label>
                <textarea
                  value={forwardRemarks}
                  onChange={(e) => setForwardRemarks(e.target.value)}
                  required
                  rows={3}
                  placeholder="ಪ್ರಸ್ತಾವನೆಯನ್ನು ನಿಯಮಾನುಸಾರ ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಮುಂದಿನ ಅಗತ್ಯ ಆದೇಶಕ್ಕಾಗಿ ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರಕ್ಕೆ ಸಲ್ಲಿಸಲಾಗಿದೆ..."
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-[#2b2b2b] font-kannada resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsForwardModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer font-kannada"
                >
                  ರದ್ದುಮಾಡಿ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMove}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-[2px_2px_0px_#10b981] flex items-center gap-1.5 cursor-pointer font-kannada disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingMove ? 'ರವಾನಿಸಲಾಗುತ್ತಿದೆ...' : 'ಕಡತ ರವಾನಿಸಿ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
