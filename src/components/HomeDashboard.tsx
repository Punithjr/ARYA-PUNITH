import React from 'react';
import { 
  Building2, 
  FolderGit2, 
  FileText, 
  Users, 
  UserCheck, 
  Award, 
  Calendar, 
  Calculator, 
  Clock, 
  Send, 
  Inbox, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Search, 
  FileSpreadsheet, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  ShieldAlert, 
  Flame, 
  Camera,
  Minimize2,
  RefreshCw,
  Sliders,
  FileImage,
  School,
  ShieldCheck,
  Archive,
  TrendingUp,
  LayoutGrid,
  FileCheck2,
  Upload,
  X,
  Zap
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { 
  OfficeSection, 
  Employee, 
  MasterDocketFile, 
  EducationLetter, 
  AdminAuthUser, 
  AppNavTab 
} from '../types';

export const DEFAULT_OFFICE_SECTIONS: OfficeSection[] = [
  {
    id: 'sec-a2',
    code: 'ಆ2',
    name: 'ಸ.ಪ್ರಾ.ಶಿ (ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ)',
    description: 'ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ ವಿಭಾಗ - ಶಿಕ್ಷಕರ ವೇತನ, ಸೇವಾ ವಿಷಯಗಳು, ರಜೆ ಹಾಗೂ ನಿವೃತ್ತಿ ವೇತನ ನಿರ್ವಹಣೆ',
    isDefault: true
  },
  {
    id: 'sec-a1',
    code: 'ಆ1',
    name: 'ಪ್ರೌಢ ಶಿಕ್ಷಣ (High School)',
    description: 'ಪ್ರೌಢ ಶಿಕ್ಷಣ ವಿಭಾಗ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಆಡಳಿತ',
    isDefault: false
  },
  {
    id: 'sec-a3',
    code: 'ಆ3',
    name: 'ಅನುದಾನಿತ ಶಾಲೆಗಳು & ಲೆಕ್ಕಪತ್ರ',
    description: 'ಖಾಸಗಿ ಅನುದಾನಿತ ಶಾಲೆಗಳ ವೇತನ ಅನುದಾನ ಹಾಗೂ ಲೆಕ್ಕ ಪರಿಶೋಧನೆ',
    isDefault: false
  }
];

export interface HomeDashboardProps {
  currentUser?: AdminAuthUser | null;
  employees: Employee[];
  files: MasterDocketFile[];
  letters: EducationLetter[];
  sections: OfficeSection[];
  activeSection: OfficeSection | null;
  onSelectSection: (section: OfficeSection) => void;
  onAddSection: (sec: { code: string; name: string; description?: string }) => Promise<void>;
  onNavigate: (tab: AppNavTab, extra?: any) => void;
  onCreateFile?: (fileData: Partial<MasterDocketFile>) => Promise<void>;
  onOpenPrapathra28WithMonth?: (month: 'January' | 'July') => void;
  onRefreshEmployees?: () => Promise<void>;
  onRefreshFiles?: () => Promise<void>;
  onRefreshLetters?: () => Promise<void>;
  onOpenEmployeeInfo?: () => void;
  onOpenPrapathra28?: (month: 'January' | 'July') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentUser,
  employees,
  files,
  letters,
  sections,
  activeSection,
  onSelectSection,
  onAddSection,
  onNavigate,
  onCreateFile,
  onOpenPrapathra28WithMonth,
  onOpenEmployeeInfo,
  onOpenPrapathra28,
}) => {
  const today = new Date();
  
  // Menu Category Filter & Quick Dropzone State
  const [activeMenuTab, setActiveMenuTab] = React.useState<'all' | 'tools' | 'dockets' | 'services'>('all');
  const [quickFile, setQuickFile] = React.useState<File | null>(null);
  const [isQuickDragging, setIsQuickDragging] = React.useState<boolean>(false);
  const quickInputRef = React.useRef<HTMLInputElement>(null);

  // Overdue and urgent dockets
  const overdueFiles = files.filter(f => {
    if (!f.dueDate) return false;
    const due = new Date(f.dueDate).getTime();
    return !isNaN(due) && due < today.getTime() && f.status !== 'Disposed / Closed';
  });

  const dueSoonFiles = files.filter(f => {
    if (!f.dueDate) return false;
    const due = new Date(f.dueDate).getTime();
    if (isNaN(due) || due < today.getTime()) return false;
    const diffHours = (due - today.getTime()) / (1000 * 3600);
    return diffHours <= 48 && f.status !== 'Disposed / Closed';
  });

  const pendingLetters = letters.filter(l => l.status === 'Pending Action' || l.status === 'Under Review');

  return (
    <div className="space-y-6">
      {/* Official Government Office Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-2xl p-6 shadow-md border-2 border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
              </span>
              <span className="bg-stone-800/80 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md text-[11px] font-bold">
                ವಿಭಾಗ: {activeSection?.code || 'ಆ2'} ({activeSection?.name || 'ಸ.ಪ್ರಾ.ಶಿ'})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight font-kannada">
              ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-kannada max-w-2xl leading-relaxed">
              ಡಿಜಿಟಲ್ ಕಡತಗಳ ನಿರ್ವಹಣೆ, ಇ-ಆವಕ ಜಾವಕ ಪತ್ರ ವ್ಯವಹಾರ, ಪ್ರಪತ್ರ-೨೮ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ, ಸೇವಾ ವಹಿ ಹಾಗೂ ನಿವೃತ್ತಿ ವೇತನ ನಿರ್ವಹಣಾ ತಂತ್ರಾಂಶ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('fileDashboard')}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer font-kannada"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-stone-950" />
              <span>ಕಡತಗಳು</span>
            </button>
            <button
              onClick={() => onNavigate('hrms')}
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-kannada border border-emerald-600 shadow-sm"
              title="ಮಾನವ ಸಂಪನ್ಮೂಲ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ (HRMS 2.0 - Khajane-2, Service Book & LPC)"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>HRMS 2.0</span>
            </button>
            <button
              onClick={() => onNavigate('pension')}
              className="bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-kannada"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>ಪಿಂಚಣಿ</span>
            </button>
            <button
              onClick={() => onNavigate('pdfScanner')}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-kannada border border-emerald-600 shadow-sm"
              title="ಕಾಗದ ಕಡತ / ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್ (PDF Scanner)"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-200" />
              <span>PDF ಸ್ಕ್ಯಾನರ್</span>
            </button>
            <button
              onClick={() => onNavigate('pdfCompressor')}
              className="bg-purple-900/90 hover:bg-purple-800 text-purple-100 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-kannada border border-purple-700 shadow-sm"
              title="PDF ಗಾತ್ರ ಕಡಿತ (<200KB / <500KB) (PDF Compressor)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-purple-300" />
              <span>PDF ಕಂಪ್ರೆಸ್</span>
            </button>
            <button
              onClick={() => onNavigate('pdfMerger')}
              className="bg-teal-900/90 hover:bg-teal-800 text-teal-100 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-kannada border border-teal-700 shadow-sm"
              title="ಹಲವು PDF ಹಾಗೂ ಚಿತ್ರಗಳನ್ನು ಒಂದೇ ಕಡತಕ್ಕೆ ವಿಲೀನಗೊಳಿಸಿ (PDF Merger)"
            >
              <Layers className="w-3.5 h-3.5 text-teal-300" />
              <span>PDF ವಿಲೀನ</span>
            </button>
            <button
              onClick={() => onNavigate('jpgConverter')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-kannada border border-amber-400/40 shadow-sm"
              title="JPEG / PNG ನಿಂದ JPG ಗೆ ಪರಿವರ್ತಿಸಿ (JPG Converter)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
              <span>ಜೆಪಿ ಕನ್ವರ್ಟ್</span>
            </button>
            <button
              onClick={() => onNavigate('imageCompressor')}
              className="bg-rose-900/70 hover:bg-rose-800 text-rose-100 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-kannada border border-rose-700 shadow-sm"
              title="ಚಿತ್ರಗಳನ್ನು 20KB, 50KB, 100KB ಗೆ ಕಂಪ್ರೆಸ್ ಮಾಡಿ (JPG Compressor)"
            >
              <Sliders className="w-3.5 h-3.5 text-rose-300" />
              <span>ಜೆಪಿಸಿ ಕಂಪ್ರೆಸ್</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Action Banner if Overdue items exist */}
      {overdueFiles.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <span>ಗಡುವು ಮೀರಿದ ತುರ್ತು ಕಡತಗಳು ({overdueFiles.length} Overdue Dockets)</span>
                <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-black">
                  Priority Action
                </span>
              </div>
              <p className="text-xs text-rose-800 font-kannada mt-0.5">
                ನಿಗದಿತ ಅವಧಿ ಮುಗಿದಿರುವ {overdueFiles.length} ಕಡತಗಳನ್ನು ಕೂಡಲೇ ಪರಿಶೀಲಿಸಿ ಮುಂದಿನ ಹಂತಕ್ಕೆ ರವಾನಿಸಿ.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('files', { status: 'pending_all', priority: 'urgent' })}
            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>ಕಡತಗಳನ್ನು ವೀಕ್ಷಿಸಿ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dockets */}
        <div 
          onClick={() => onNavigate('files')}
          className="bg-white p-4 rounded-xl border border-stone-200/90 hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700 font-kannada">ಒಟ್ಟು ಕಡತಗಳು (Dockets)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 text-amber-700 flex items-center justify-center transition-colors">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900 font-mono">{files.length}</span>
            <span className="text-[11px] text-stone-500 font-medium">ದಾಖಲಿತ ಕಡತಗಳು</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('files', { status: 'pending_all', priority: 'urgent' });
              }}
              className="text-rose-600 font-bold hover:underline cursor-pointer"
            >
              {overdueFiles.length} ಗಡುವು ಮೀರಿದೆ (View Pending)
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 2: Letters */}
        <div 
          onClick={() => onNavigate('registry')}
          className="bg-white p-4 rounded-xl border border-stone-200/90 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700 font-kannada">ಇ-ದಾಖ್ ಪತ್ರಗಳು (Letters)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900 font-mono">{letters.length}</span>
            <span className="text-[11px] text-stone-500 font-medium">ಆವಕ/ಜಾವಕ</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 font-bold">{pendingLetters.length} ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 3: Employees */}
        <div 
          onClick={() => onNavigate('employees')}
          className="bg-white p-4 rounded-xl border border-stone-200/90 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700 font-kannada">ನೌಕರರ ರೋಸ್ಟರ್ (Staff)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900 font-mono">{employees.length}</span>
            <span className="text-[11px] text-stone-500 font-medium">ಶಿಕ್ಷಕರು & ಸಿಬ್ಬಂದಿ</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold font-kannada">ಸೇವಾ ವಿವರ ದಾಖಲಾಗಿದೆ</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 4: Pension */}
        <div 
          onClick={() => onNavigate('pension')}
          className="bg-white p-4 rounded-xl border border-stone-200/90 hover:border-purple-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700 font-kannada">ನಿವೃತ್ತಿ & ಪಿಂಚಣಿ (Pension)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 group-hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-stone-900 font-kannada">ಕ್ಯಾಲ್ಕುಲೇಟರ್</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-semibold font-kannada">7ನೇ ವೇತನ ಆಯೋಗ ಲೆಕ್ಕ</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* 1. ಮುಖ್ಯ ಮೆನು & ಡಿಜಿಟಲ್ PDF/ಜೆಪಿ ಪರಿಕರಗಳ ಸೂಟ್ (Main Navigation Menu & Prominent PDF/JPG Suite) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-stone-850 shadow-md space-y-6">
        {/* Header & Category Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 font-kannada">
                  ಮುಖ್ಯ ಮೆನು: ಪ್ರಮುಖ PDF, ಜೆಪಿ ಕನ್ವರ್ಟ್ & ಜೆಪಿಸಿ ಕಂಪ್ರೆಸ್ ಸೂಟ್
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 border border-amber-500 font-mono font-black uppercase">
                  ⭐ ಪ್ರಮುಖ ಹಬ್
                </span>
              </div>
              <p className="text-xs text-stone-600 font-kannada">
                ಕಛೇರಿಯ ಎಲ್ಲಾ ಕಡತ, ಪತ್ರ, ನೌಕರ, ಶಾಲಾ ಆಡಳಿತ ಹಾಗೂ ಪ್ರಮುಖ PDF ಮತ್ತು ಜೆಪಿ ಪರಿಕರಗಳಿಗೆ ನೇರ ಪ್ರವೇಶ
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveMenuTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer font-kannada ${
                activeMenuTab === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              ಎಲ್ಲಾ ಮೆನು ({12 + 5})
            </button>
            <button
              type="button"
              onClick={() => setActiveMenuTab('tools')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer font-kannada ${
                activeMenuTab === 'tools'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>⭐ ಪ್ರಮುಖ PDF & ಜೆಪಿ ಪರಿಕರಗಳು</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMenuTab('dockets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer font-kannada ${
                activeMenuTab === 'dockets'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              ಕಡತ & ಪತ್ರಗಳು
            </button>
            <button
              type="button"
              onClick={() => setActiveMenuTab('services')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer font-kannada ${
                activeMenuTab === 'services'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              ನೌಕರರು & ಸೇವೆಗಳು
            </button>
          </div>
        </div>

        {/* 2. ಪ್ರಮುಖ PDF, ಜೆಪಿ ಕನ್ವರ್ಟ್ & ಜೆಪಿಸಿ ಕಂಪ್ರೆಸ್ ಸೂಟ್ */}
        {(activeMenuTab === 'all' || activeMenuTab === 'tools') && (
          <div className="space-y-4 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-white p-5 rounded-2xl border-2 border-stone-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider font-mono">
                  ⭐ ಕಛೇರಿಯ ಪ್ರಮುಖ ಡಿಜಿಟಲ್ ಪರಿಕರಗಳು
                </span>
                <span className="text-xs text-stone-400 font-kannada">100% ಖಾಸಗಿ • ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಕ್ಷಣಾರ್ಧದಲ್ಲಿ</span>
              </div>
              <span className="text-[11px] text-amber-300 font-mono font-bold">
                e-OFFICE & PORTALS READY
              </span>
            </div>

            {/* 5 Core Document Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
              {/* Tool 1: PDF Scanner */}
              <div
                onClick={() => onNavigate('pdfScanner')}
                className="bg-stone-850 hover:bg-stone-800 p-4 rounded-xl border border-emerald-500/40 hover:border-emerald-400 shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
                      HD CAMERA
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-white font-kannada group-hover:text-emerald-300 transition-colors">
                    ೧. PDF ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್
                  </h4>
                  <p className="text-[11px] text-stone-300 font-kannada leading-relaxed">
                    ಕ್ಯಾಮರಾದಿಂದ ಕಾಗದ ಪತ್ರ ಸ್ಕ್ಯಾನ್, ಆಟೋ ಕ್ರಾಪ್, ಝೆರಾಕ್ಸ್ ಫಿಲ್ಟರ್ & ಬಹುಪುಟ PDF.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-700/80 flex items-center justify-between text-xs text-emerald-400 font-bold font-kannada">
                  <span>📷 ಸ್ಕ್ಯಾನ್ ಮಾಡಿ</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tool 2: PDF Compressor */}
              <div
                onClick={() => onNavigate('pdfCompressor')}
                className="bg-stone-850 hover:bg-stone-800 p-4 rounded-xl border border-purple-500/40 hover:border-purple-400 shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Minimize2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/60 font-mono">
                      &lt;200KB / &lt;500KB
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-white font-kannada group-hover:text-purple-300 transition-colors">
                    ೨. PDF ಕಂಪ್ರೆಸರ್
                  </h4>
                  <p className="text-[11px] text-stone-300 font-kannada leading-relaxed">
                    ದೊಡ್ಡ PDF ಕಡತಗಳನ್ನು 200KB ಅಥವಾ 500KB ಒಳಗೆ ಕುಗ್ಗಿಸಿ ಪೋರ್ಟಲ್‌ಗೆ ಸಿದ್ಧಪಡಿಸಿ.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-700/80 flex items-center justify-between text-xs text-purple-400 font-bold font-kannada">
                  <span>📉 ಕಂಪ್ರೆಸ್ ಮಾಡಿ</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tool 3: PDF Merger */}
              <div
                onClick={() => onNavigate('pdfMerger')}
                className="bg-stone-850 hover:bg-stone-800 p-4 rounded-xl border border-teal-500/40 hover:border-teal-400 shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4 text-teal-400" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-700/60 font-mono">
                      CONSOLIDATE
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-white font-kannada group-hover:text-teal-300 transition-colors">
                    ೩. PDF ವಿಲೀನ (Merger)
                  </h4>
                  <p className="text-[11px] text-stone-300 font-kannada leading-relaxed">
                    ಹಲವು PDF ಹಾಗೂ ಚಿತ್ರಗಳನ್ನು ಒಂದೇ ಅಧಿಕೃತ ಕಡತ ದಾಖಲೆಯಾಗಿ ಒಟ್ಟುಗೂಡಿಸಿ.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-700/80 flex items-center justify-between text-xs text-teal-400 font-bold font-kannada">
                  <span>📑 ವಿಲೀನಗೊಳಿಸಿ</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tool 4: PDF & JP Convert */}
              <div
                onClick={() => onNavigate('jpgConverter')}
                className="bg-stone-850 hover:bg-stone-800 p-4 rounded-xl border border-amber-500/40 hover:border-amber-400 shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <RefreshCw className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono">
                      PDF ➔ JPG ➔ PDF
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-white font-kannada group-hover:text-amber-300 transition-colors">
                    ೪. PDF & ಜೆಪಿ ಕನ್ವರ್ಟ್
                  </h4>
                  <p className="text-[11px] text-stone-300 font-kannada leading-relaxed">
                    PDF ನಿಂದ JPG ಪುಟಗಳ ಬೇರ್ಪಡಿಕೆ, JPG ಇಂದ PDF ಸೃಜನೆ ಮತ್ತು JPEG ➔ JPG ಫಾರ್ಮ್ಯಾಟ್.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-700/80 flex items-center justify-between text-xs text-amber-400 font-bold font-kannada">
                  <span>🔄 ಕನ್ವರ್ಟ್ ಮಾಡಿ</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tool 5: JPC Compress */}
              <div
                onClick={() => onNavigate('imageCompressor')}
                className="bg-stone-850 hover:bg-stone-800 p-4 rounded-xl border border-rose-500/40 hover:border-rose-400 shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Sliders className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700/60 font-mono">
                      20KB • 50KB • 100KB
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-white font-kannada group-hover:text-rose-300 transition-colors">
                    ೫. ಜೆಪಿಸಿ ಕಂಪ್ರೆಸ್
                  </h4>
                  <p className="text-[11px] text-stone-300 font-kannada leading-relaxed">
                    ಭಾವಚಿತ್ರ, ಸಹಿ ಹಾಗೂ ದಾಖಲೆಗಳನ್ನು ನಿಖರ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್ ಸೈಜ್‌ಗೆ ಕಂಪ್ರೆಸ್ ಮಾಡಿ.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-700/80 flex items-center justify-between text-xs text-rose-400 font-bold font-kannada">
                  <span>⚡ ಜೆಪಿಸಿ ಕಂಪ್ರೆಸ್</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Quick Interactive Dashboard Dropzone Widget */}
            <div className="pt-2 border-t border-stone-800">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsQuickDragging(true); }}
                onDragLeave={() => setIsQuickDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsQuickDragging(false);
                  if (e.dataTransfer.files?.[0]) setQuickFile(e.dataTransfer.files[0]);
                }}
                onClick={() => quickInputRef.current?.click()}
                className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
                  isQuickDragging
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-stone-700 bg-stone-900/60 hover:border-amber-500/80 hover:bg-stone-850'
                }`}
              >
                <input
                  ref={quickInputRef}
                  type="file"
                  accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setQuickFile(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-kannada">
                      {quickFile ? (
                        <span className="text-amber-300">
                          ಆಯ್ಕೆಯಾದ ಕಡತ: {quickFile.name} ({formatBytes(quickFile.size)})
                        </span>
                      ) : (
                        'ತ್ವರಿತ ಪರಿವರ್ತಕ: ಯಾವುದೇ PDF ಅಥವಾ JPG/PNG ಚಿತ್ರವನ್ನು ಇಲ್ಲಿ ಎಳೆಯಿರಿ'
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 font-kannada">
                      ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಫೈಲ್ ಹಾಕಿ ಕೂಡಲೇ ಕಂಪ್ರೆಸ್ / ಕನ್ವರ್ಟ್ ಮಾಡಿ (100% ಬ್ರೌಸರ್‌ನಲ್ಲೇ)
                    </div>
                  </div>
                </div>

                {quickFile ? (
                  <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {quickFile.type === 'application/pdf' || quickFile.name.toLowerCase().endsWith('.pdf') ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onNavigate('jpgConverter', { mode: 'pdfToJpg' })}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer font-kannada flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>PDF ➔ JPG</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('pdfCompressor')}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer font-kannada flex items-center gap-1"
                        >
                          <Minimize2 className="w-3 h-3" />
                          <span>&lt;200KB ಕಂಪ್ರೆಸ್</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('pdfMerger')}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs cursor-pointer font-kannada flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3" />
                          <span>PDF ವಿಲೀನ</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onNavigate('imageCompressor')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer font-kannada flex items-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>೨೦KB/೫೦KB ಕಂಪ್ರೆಸ್</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('jpgConverter', { mode: 'imageToJpg' })}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer font-kannada flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>JPG ಕನ್ವರ್ಟ್</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('jpgConverter', { mode: 'jpgToPdf' })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer font-kannada flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF ಗೆ ಪರಿವರ್ತಿಸಿ</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setQuickFile(null)}
                      className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-amber-400 text-stone-950 font-bold text-xs rounded-lg shrink-0 font-kannada">
                      ಕಡತ ಆಯ್ಕೆಮಾಡಿ
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. ಮುಖ್ಯ ಮೆನು (12 Core Modules Grid) */}
        {(activeMenuTab === 'all' || activeMenuTab === 'dockets' || activeMenuTab === 'services') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 font-kannada uppercase tracking-wider">
                ಕಛೇರಿ ಆಡಳಿತ ಮುಖ್ಯ ಮೆನು (12 Core Modules)
              </span>
              <span className="text-[10px] font-mono text-stone-500 font-bold">12 MODULES</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {/* Tile 1: Files */}
              {(activeMenuTab === 'all' || activeMenuTab === 'dockets') && (
                <button
                  type="button"
                  onClick={() => onNavigate('files')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-amber-50 hover:border-amber-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-amber-900">೧. ಕಡತಗಳ ನಿರ್ವಹಣೆ</div>
                    <div className="text-[10px] text-stone-500">FTS Dockets ({files.length})</div>
                  </div>
                </button>
              )}

              {/* Tile 2: Letters */}
              {(activeMenuTab === 'all' || activeMenuTab === 'dockets') && (
                <button
                  type="button"
                  onClick={() => onNavigate('registry')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-blue-50 hover:border-blue-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-blue-900">೨. ಪತ್ರ ವ್ಯವಹಾರ</div>
                    <div className="text-[10px] text-stone-500">e-Dak Registry ({letters.length})</div>
                  </div>
                </button>
              )}

              {/* Tile 3: Increment */}
              {(activeMenuTab === 'all' || activeMenuTab === 'services') && (
                <button
                  type="button"
                  onClick={() => onNavigate('prapathra28')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-emerald-900">೩. ಪ್ರಪತ್ರ-೨೮ ಬಡ್ತಿ</div>
                    <div className="text-[10px] text-stone-500">Jan & Jul Increments</div>
                  </div>
                </button>
              )}

              {/* Tile: HRMS 2.0 */}
              {(activeMenuTab === 'all' || activeMenuTab === 'services') && (
                <button
                  type="button"
                  onClick={() => onNavigate('hrms')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-emerald-900">೪. HRMS ೨.೦</div>
                    <div className="text-[10px] text-stone-500">Service Book & LPC</div>
                  </div>
                </button>
              )}

              {/* Tile 4: Employees */}
              {(activeMenuTab === 'all' || activeMenuTab === 'services') && (
                <button
                  type="button"
                  onClick={() => onNavigate('employees')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-emerald-900">೪. ನೌಕರರ ಮಾಹಿತಿ</div>
                    <div className="text-[10px] text-stone-500">Staff Roster ({employees.length})</div>
                  </div>
                </button>
              )}

              {/* Tile 5: Pension */}
              {(activeMenuTab === 'all' || activeMenuTab === 'services') && (
                <button
                  type="button"
                  onClick={() => onNavigate('pension')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-purple-50 hover:border-purple-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-purple-900">೫. ಪಿಂಚಣಿ ಸ್ಟುಡಿಯೋ</div>
                    <div className="text-[10px] text-stone-500">Pension & Form-7</div>
                  </div>
                </button>
              )}

              {/* Tile 6: Schools */}
              {(activeMenuTab === 'all' || activeMenuTab === 'services') && (
                <button
                  type="button"
                  onClick={() => onNavigate('schools')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-teal-50 hover:border-teal-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <School className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-teal-900">೬. ಶಾಲೆಗಳು & ಅನುದಾನ</div>
                    <div className="text-[10px] text-stone-500">Aided Schools</div>
                  </div>
                </button>
              )}

              {/* Tile 7: Leave Calendar */}
              {(activeMenuTab === 'all' || activeMenuTab === 'services') && (
                <button
                  type="button"
                  onClick={() => onNavigate('leaveCalendar')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-rose-50 hover:border-rose-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-rose-900">೭. ರಜೆ ಕ್ಯಾಲೆಂಡರ್</div>
                    <div className="text-[10px] text-stone-500">Child Care Leave (180d)</div>
                  </div>
                </button>
              )}

              {/* Tile 8: Memorandum Orders */}
              {(activeMenuTab === 'all' || activeMenuTab === 'dockets') && (
                <button
                  type="button"
                  onClick={() => onNavigate('memorandum')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-200 hover:border-stone-400 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center group-hover:bg-stone-800 group-hover:text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-stone-950">೮. ಜ್ಞಾಪನಾದೇಶ & ಆದೇಶ</div>
                    <div className="text-[10px] text-stone-500">Official Orders</div>
                  </div>
                </button>
              )}

              {/* Tile 9: RTI */}
              {(activeMenuTab === 'all' || activeMenuTab === 'dockets') && (
                <button
                  type="button"
                  onClick={() => onNavigate('rti')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-amber-50 hover:border-amber-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-amber-900">೯. ಮಾಹಿತಿ ಹಕ್ಕು (RTI)</div>
                    <div className="text-[10px] text-stone-500">30 Days SLA Register</div>
                  </div>
                </button>
              )}

              {/* Tile 10: General Letter */}
              {(activeMenuTab === 'all' || activeMenuTab === 'dockets') && (
                <button
                  type="button"
                  onClick={() => onNavigate('generalLetter')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-sky-50 hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-sky-900">೧೦. ಪತ್ರ ರಚನೆ</div>
                    <div className="text-[10px] text-stone-500">Letter Drafter</div>
                  </div>
                </button>
              )}

              {/* Tile 11: Circulars */}
              {(activeMenuTab === 'all' || activeMenuTab === 'services') && (
                <button
                  type="button"
                  onClick={() => onNavigate('circularStudio')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-indigo-900">೧೧. ಸುತ್ತೋಲೆ ಸ್ಟುಡಿಯೋ</div>
                    <div className="text-[10px] text-stone-500">Statutory Circulars</div>
                  </div>
                </button>
              )}

              {/* Tile 12: Master Audit */}
              {(activeMenuTab === 'all' || activeMenuTab === 'dockets') && (
                <button
                  type="button"
                  onClick={() => onNavigate('masterAudit')}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-amber-50 hover:border-amber-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-stone-900 font-kannada group-hover:text-amber-900">೧೨. ಕಡತ ಆಡಿಟ್</div>
                    <div className="text-[10px] text-stone-500">Audit & Scrutiny</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Module Launchers Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>ಪ್ರಮುಖ ಕಛೇರಿ ಮಾಡ್ಯೂಲ್‌ಗಳು (Core Administrative Modules)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Files Tracking */}
          <div 
            onClick={() => onNavigate('files')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                  MODULE 1
                </span>
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-kannada">
                ೧. ಕಡತಗಳ ನಿರ್ವಹಣೆ & ಚಲನವಲನ (Master Docket Files & Tracking)
              </h4>
              <p className="text-xs text-stone-600 font-kannada leading-relaxed">
                ಕಡತಗಳ ನೋಂದಣಿ, ಅಧಿಕಾರಿಗಳ ನಡುವೆ ಚಲನವಲನ (File Routing), QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್, SLA ಸಮಯಾವಧಿ ಮತ್ತು ಆದೇಶ ಪತ್ರಗಳ ಲಗತ್ತು.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-amber-700 font-bold">
              <span>ತೆರೆಯಿರಿ (Open Dockets)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 2: Pension Studio */}
          <div 
            onClick={() => onNavigate('pension')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                  MODULE 2
                </span>
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-kannada">
                ೨. ಪಿಂಚಣಿ ಸ್ಟುಡಿಯೋ & ಕ್ಯಾಲ್ಕುಲೇಟರ್ (Pension Studio)
              </h4>
              <p className="text-xs text-stone-600 font-kannada leading-relaxed">
                ಸೇವಾ ವರ್ಷಗಳು ಮತ್ತು ಕೊನೆಯ ಮೂಲ ವೇತನ ಆಧಾರದ ಮೇಲೆ ಗ್ರಾಚ್ಯುಟಿ, ಕಮ್ಯುಟೇಶನ್, ರಜೆ ನಗದೀಕರಣ ಮತ್ತು 10 ವರ್ಷಗಳ ಬೆಳವಣಿಗೆಯ ಚಾರ್ಟ್.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-purple-700 font-bold">
              <span>ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ (Calculate Pension)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 3: Prapathra-28 Increment */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                  MODULE 3
                </span>
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-kannada">
                ೩. ಪ್ರಪತ್ರ-೨೮ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ (Annual Increment)
              </h4>
              <p className="text-xs text-stone-600 font-kannada leading-relaxed">
                ಜನವರಿ ಮತ್ತು ಜುಲೈ ಕಂತಿನ ಶಿಕ್ಷಕರು ಹಾಗೂ ಸಿಬ್ಬಂದಿಯ ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಮಂಜೂರಾತಿ ಪ್ರಪತ್ರ ತಯಾರಿಕೆ ಮತ್ತು ಆದೇಶ ಪ್ರತಿ.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenPrapathra28WithMonth?.('January')}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg transition-colors border border-emerald-200 text-center cursor-pointer"
              >
                ಜನವರಿ ಕಂತು
              </button>
              <button
                type="button"
                onClick={() => onOpenPrapathra28WithMonth?.('July')}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg transition-colors border border-emerald-200 text-center cursor-pointer"
              >
                ಜುಲೈ ಕಂತು
              </button>
            </div>
          </div>

          {/* Module 4: Staff & Employees */}
          <div 
            onClick={() => onNavigate('employees')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                  MODULE 4
                </span>
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-kannada">
                ೪. ನೌಕರರ ಮಾಹಿತಿ & ಸೇವಾ ವಹಿ (Employee Service Roster)
              </h4>
              <p className="text-xs text-stone-600 font-kannada leading-relaxed">
                ಶಿಕ್ಷಕರ ಸೇವಾ ವಿವರ, KGID, HRMS ಕೋಡ್, ನೇಮಕಾತಿ ದಿನಾಂಕ, ಸೇವಾ ಅವಧಿಯ ಬ್ಯಾಡ್ಜ್ ಮತ್ತು ದಾಖಲಾತಿಗಳು.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-blue-700 font-bold">
              <span>ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 5: RTI Management */}
          <div 
            onClick={() => onNavigate('rti')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                  MODULE 5
                </span>
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-kannada">
                ೫. ಮಾಹಿತಿ ಹಕ್ಕು ರಿಜಿಸ್ಟರ್ (RTI Act 2005)
              </h4>
              <p className="text-xs text-stone-600 font-kannada leading-relaxed">
                ಅರ್ಜಿಗಳ ನೋಂದಣಿ, ೩೦ ದಿನಗಳ ಕಾಲಮಿತಿ ಟ್ರ್ಯಾಕಿಂಗ್, ಉತ್ತರ ಪತ್ರ ರಚನೆ ಮತ್ತು ಮೇಲ್ಮನವಿ ನಿರ್ವಹಣೆ.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-bold">
              <span>RTI ರಿಜಿಸ್ಟರ್</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 6: Official Orders & Sanctions */}
          <div 
            onClick={() => onNavigate('memorandum')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono">
                  MODULE 6
                </span>
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-kannada">
                ೬. ಜ್ಞಾಪನಾದೇಶ & ಮಂಜೂರಾತಿ (Orders & Sanctions Studio)
              </h4>
              <p className="text-xs text-stone-600 font-kannada leading-relaxed">
                ಸರ್ಕಾರಿ ಜ್ಞಾಪನಗಳು, ಅಧಿಕೃತ ಆದೇಶ ಪ್ರತಿಗಳು, ಶಾಲಾ ಅನುದಾನ ಮಂಜೂರಾತಿ ಹಾಗೂ ಶಾಸನಬದ್ಧ ಸುತ್ತೋಲೆಗಳು.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-800 font-bold">
              <span>ಆದೇಶ ಸ್ಟುಡಿಯೋ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 7: PDF Document Scanner & Compressor */}
          <div 
            onClick={() => onNavigate('pdfScanner')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                  MODULE 7
                </span>
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-kannada">
                ೭. PDF ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್ (PDF Document Scanner)
              </h4>
              <p className="text-xs text-stone-600 font-kannada leading-relaxed">
                ಕ್ಯಾಮೆರಾದಿಂದ ಭೌತಿಕ ಅರ್ಜಿ ಮತ್ತು ಕಾಗದ ಪತ್ರಗಳನ್ನು ಸೆರೆಹಿಡಿಯಿರಿ, ಮೂಲೆ ಸರಿಪಡಿಸಿ (Perspective Crop), ಝೆರಾಕ್ಸ್ ಫಿಲ್ಟರ್ ಹಾಕಿ ಮತ್ತು ಕಂಪ್ರೆಸ್ಡ್ PDF ಸೃಜಿಸಿ ಕಡತಕ್ಕೆ ಲಗತ್ತಿಸಿ.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-emerald-800 font-bold">
              <span>ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್ ತೆರೆಯಿರಿ (Open Scanner)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
