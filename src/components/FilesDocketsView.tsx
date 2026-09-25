import React, { useState } from 'react';
import { MasterDocketFile, DepartmentSection, LetterPriority, EducationLetter, DocumentAttachment } from '../types';
import { 
  FolderGit2, 
  Plus, 
  Send, 
  Clock, 
  User, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Search,
  Filter,
  Layers,
  X,
  Award,
  FileCheck2,
  Image as ImageIcon,
  ExternalLink,
  Paperclip,
  Sparkles,
  UploadCloud,
  Calendar,
  AlertTriangle,
  FileStack
} from 'lucide-react';
import { MergeAttachmentsModal } from './MergeAttachmentsModal';

interface FilesDocketsViewProps {
  files: MasterDocketFile[];
  letters: EducationLetter[];
  onCreateFile: (fileData: Partial<MasterDocketFile>) => Promise<void>;
  onMoveFile: (fileId: string, fromOfficer: string, toOfficer: string, remarks: string, newStatus?: string) => Promise<void>;
  onUpdateFileCategory?: (fileId: string, category: string) => Promise<void>;
  onSelectLetter: (letter: EducationLetter) => void;
  onOpenServiceSanctions?: () => void;
  onOpenNewRtiFile?: () => void;
  onOpenRtiReply?: (file: MasterDocketFile) => void;
  onViewAttachment?: (attachment: DocumentAttachment) => void;
  onUploadAttachmentToFile?: (fileId: string, attachment: DocumentAttachment) => Promise<void>;
}

export interface FileCategoryMeta {
  id: string;
  code: string;
  labelKn: string;
  labelEn: string;
  badgeClass: string;
  iconBg: string;
  description: string;
}

export const FILE_CATEGORIES: FileCategoryMeta[] = [
  {
    id: 'ಆಡಳಿತ & ಸಿಬ್ಬಂದಿ ಕಡತ (Administration & Personnel)',
    code: 'admin',
    labelKn: 'ಆಡಳಿತ & ಸಿಬ್ಬಂದಿ',
    labelEn: 'Administration & Personnel',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    iconBg: 'bg-blue-600',
    description: 'ನೇಮಕಾತಿ, ಸೇವಾ ನಿಯಮಗಳು, ದೃಢೀಕರಣ ಮತ್ತು ವರ್ಗಾವಣೆ ಕಡತಗಳು'
  },
  {
    id: 'ವೇತನ & ಭತ್ಯೆ ಕಡತ (Salary & Increments)',
    code: 'salary',
    labelKn: 'ವೇತನ & ಬಡ್ತಿ',
    labelEn: 'Salary & Increments',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    iconBg: 'bg-emerald-600',
    description: 'ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ (ಪ್ರಪತ್ರ-೨೮), ವೇತನ ನಿಗದಿ, ಏರಿಯರ್ಸ್ ಹಾಗೂ ಭತ್ಯೆಗಳು'
  },
  {
    id: 'ಶೈಕ್ಷಣಿಕ & ಪರೀಕ್ಷಾ ಕಡತ (Academic & Exams)',
    code: 'academic',
    labelKn: 'ಶೈಕ್ಷಣಿಕ & ಪರೀಕ್ಷೆ',
    labelEn: 'Academic & Exams',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    iconBg: 'bg-purple-600',
    description: 'ಪಠ್ಯಕ್ರಮ, ಎಸ್‌ಎಸ್‌ಎಲ್‌ಸಿ ಪರೀಕ್ಷೆ, ತರಬೇತಿ ಹಾಗೂ ಶೈಕ್ಷಣಿಕ ಕಾರ್ಯಕ್ರಮಗಳು'
  },
  {
    id: 'ಲೆಕ್ಕಪತ್ರ & ಅನುದಾನ ಕಡತ (Accounts & Grants)',
    code: 'accounts',
    labelKn: 'ಲೆಕ್ಕಪತ್ರ & ಅನುದಾನ',
    labelEn: 'Accounts & Grants',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    iconBg: 'bg-amber-600',
    description: 'ಶಾಲಾ ಅನುದಾನ, ಬಜೆಟ್ ವೆಚ್ಚ, ಖಜಾನೆ ಬಿಲ್‌ಗಳು ಹಾಗೂ ಲೆಕ್ಕಪರಿಶೋಧನೆ'
  },
  {
    id: 'ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ (RTI & Legal)',
    code: 'rti',
    labelKn: 'ಮಾಹಿತಿ ಹಕ್ಕು (RTI)',
    labelEn: 'RTI & Legal',
    badgeClass: 'bg-amber-200 text-stone-950 border-amber-400 font-bold',
    iconBg: 'bg-amber-500',
    description: 'ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 ರ ಅರ್ಜಿಗಳು, ಕಾಲಮಿತಿ ಉತ್ತರ ಹಾಗೂ ನ್ಯಾಯಾಲಯ ಪ್ರಕರಣಗಳು'
  },
  {
    id: 'ಶಾಲಾ ತಪಾಸಣೆ & ಗುಣಮಟ್ಟ ಕಡತ (Inspection & Quality)',
    code: 'inspection',
    labelKn: 'ಶಾಲಾ ತಪಾಸಣೆ',
    labelEn: 'Inspection & Quality',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    iconBg: 'bg-teal-600',
    description: 'ಶಾಲಾ ಮಾನ್ಯತೆ, ಕಟ್ಟಡ ಸುರಕ್ಷತೆ, ಗುಣಮಟ್ಟ ಪರಿವೀಕ್ಷಣೆ ಹಾಗೂ ಶಿಸ್ತು ತಪಾಸಣೆ'
  },
  {
    id: 'ಇತರೆ ಸಾಮಾನ್ಯ ಕಡತ (General File)',
    code: 'general',
    labelKn: 'ಇತರೆ ಸಾಮಾನ್ಯ',
    labelEn: 'General Files',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    iconBg: 'bg-stone-500',
    description: 'ಸರ್ಕಾರಿ ಆದೇಶಗಳು, ಸುತ್ತೋಲೆಗಳು ಹಾಗೂ ದಿನನಿತ್ಯದ ಕಛೇರಿ ಪತ್ರವ್ಯವಹಾರಗಳು'
  }
];

export const getFileCategoryMeta = (file: MasterDocketFile): FileCategoryMeta => {
  if (file.isRtiFile || file.section === 'Legal & Grievances') {
    return FILE_CATEGORIES.find(c => c.code === 'rti')!;
  }
  if (file.fileCategory) {
    const match = FILE_CATEGORIES.find(c => c.id === file.fileCategory || c.labelKn === file.fileCategory || c.code === file.fileCategory);
    if (match) return match;
  }
  if (file.section === 'Academic Wing' || file.subject?.includes('STEM') || file.subject?.includes('ಪರೀಕ್ಷೆ')) {
    return FILE_CATEGORIES.find(c => c.code === 'academic')!;
  }
  if (file.section === 'Accounts & Grants' || file.subject?.includes('ಅನುದಾನ') || file.subject?.includes('ಲೆಕ್ಕ')) {
    return FILE_CATEGORIES.find(c => c.code === 'accounts')!;
  }
  if (file.section === 'Inspection & Quality' || file.subject?.includes('ತಪಾಸಣೆ')) {
    return FILE_CATEGORIES.find(c => c.code === 'inspection')!;
  }
  if (file.subject?.includes('ವೇತನ') || file.subject?.includes('ಬಡ್ತಿ')) {
    return FILE_CATEGORIES.find(c => c.code === 'salary')!;
  }
  if (file.section === 'Administration & Services') {
    return FILE_CATEGORIES.find(c => c.code === 'admin')!;
  }
  return FILE_CATEGORIES.find(c => c.code === 'general')!;
};

export const FilesDocketsView: React.FC<FilesDocketsViewProps> = ({
  files,
  letters,
  onCreateFile,
  onMoveFile,
  onUpdateFileCategory,
  onSelectLetter,
  onOpenServiceSanctions,
  onOpenNewRtiFile,
  onOpenRtiReply,
  onViewAttachment,
  onUploadAttachmentToFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<MasterDocketFile | null>(files[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeCategoryCode, setActiveCategoryCode] = useState<string>('all');

  // Move modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [toOfficer, setToOfficer] = useState('');
  const [movementRemarks, setMovementRemarks] = useState('');
  const [newFileStatus, setNewFileStatus] = useState('Under Scrutiny');
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);

  // New file modal state
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newSection, setNewSection] = useState<DepartmentSection>('Academic Wing');
  const [newCategory, setNewCategory] = useState<string>(FILE_CATEGORIES[0].id);
  const [newCustodian, setNewCustodian] = useState('Director of School Education');
  const [newPriority, setNewPriority] = useState<LetterPriority>('Routine');
  const [newNotes, setNewNotes] = useState('');

  // Category changer loading state
  const [isChangingCategory, setIsChangingCategory] = useState(false);

  // Local uploading attachment state
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const filteredFiles = files.filter(f => {
    const meta = getFileCategoryMeta(f);
    if (activeCategoryCode !== 'all' && meta.code !== activeCategoryCode) {
      return false;
    }
    if (selectedSection !== 'all' && f.section !== selectedSection) return false;
    if (selectedStatus !== 'all' && f.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRti = f.rtiDetails?.applicantName?.toLowerCase().includes(q) ||
                       f.rtiDetails?.applicationNumber?.toLowerCase().includes(q) ||
                       f.rtiDetails?.informationSought?.toLowerCase().includes(q);
      return (
        f.fileNumber.toLowerCase().includes(q) ||
        f.subject.toLowerCase().includes(q) ||
        f.currentCustodian.toLowerCase().includes(q) ||
        f.section.toLowerCase().includes(q) ||
        meta.labelKn.toLowerCase().includes(q) ||
        meta.labelEn.toLowerCase().includes(q) ||
        matchRti
      );
    }
    return true;
  });

  // Keep activeFile synchronized with parent files updates
  const currentSelectedFile = selectedFile 
    ? (files.find(f => f.id === selectedFile.id) || selectedFile) 
    : null;
  const activeFile = (currentSelectedFile && filteredFiles.some(f => f.id === currentSelectedFile.id))
    ? currentSelectedFile 
    : (filteredFiles[0] || currentSelectedFile || null);

  // Consolidated unique list of attachments for the active docket file
  const activeFileDocs: DocumentAttachment[] = activeFile
    ? [
        ...(activeFile.rtiDetails?.uploadedDocs || []),
        ...(activeFile.attachments || []),
      ].filter((v, i, a) => a.findIndex(t => (t.id && t.id === v.id) || t.fileName === v.fileName) === i)
    : [];

  // Letters linked to this file
  const linkedLetters = letters.filter(l => 
    l.fileNumber === activeFile?.fileNumber || activeFile?.linkedLetterIds.includes(l.id)
  );

  const handleRouteFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFile || !toOfficer.trim()) return;
    try {
      setIsSubmittingMove(true);
      await onMoveFile(
        activeFile.id,
        activeFile.currentCustodian,
        toOfficer,
        movementRemarks,
        newFileStatus
      );
      setIsMoveModalOpen(false);
      setToOfficer('');
      setMovementRemarks('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const handleCreateNewFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      await onCreateFile({
        subject: newSubject,
        section: newSection,
        fileCategory: newCategory,
        currentCustodian: newCustodian,
        priority: newPriority,
        notes: newNotes,
      });
      setIsNewFileModalOpen(false);
      setNewSubject('');
      setNewNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryChange = async (newCat: string) => {
    if (!activeFile || !onUpdateFileCategory) return;
    setIsChangingCategory(true);
    try {
      await onUpdateFileCategory(activeFile.id, newCat);
      activeFile.fileCategory = newCat;
    } catch (err) {
      console.error('Failed to change file category:', err);
    } finally {
      setIsChangingCategory(false);
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0 || !activeFile) return;

    setIsUploadingAttachment(true);
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file: File = uploadedFiles[i];
        const reader = new FileReader();
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        
        await new Promise<void>((resolve) => {
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const newAtt: DocumentAttachment = {
              id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              fileName: file.name,
              fileSize: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              fileType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
              pageCount: isPdf ? 1 : undefined,
              uploadedAt: new Date().toISOString().split('T')[0],
              description: isPdf ? 'ಅಧಿಕೃತ ಕಡತ ದಾಖಲೆ ಪ್ರತಿ (PDF)' : 'ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ದಾಖಲೆ ಪ್ರತಿ (JPG)',
              dataUrl,
            };

            if (onUploadAttachmentToFile) {
              await onUploadAttachmentToFile(activeFile.id, newAtt);
            } else {
              // Local fallback
              if (!activeFile.attachments) activeFile.attachments = [];
              activeFile.attachments.push(newAtt);
              if (activeFile.rtiDetails) {
                if (!activeFile.rtiDetails.uploadedDocs) activeFile.rtiDetails.uploadedDocs = [];
                activeFile.rtiDetails.uploadedDocs.push(newAtt);
              }
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    } catch (err) {
      console.error('Error uploading file attachment:', err);
    } finally {
      setIsUploadingAttachment(false);
      e.target.value = '';
    }
  };

  return (
    <div id="files-dockets-tracking-view" className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-stone-900">
              Department Master File Tracking System (FTS)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Maintain digital file dockets, physical movement records, officer custody handovers, and case histories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenNewRtiFile && (
            <button
              id="btn-fts-new-rti-file"
              onClick={onOpenNewRtiFile}
              className="px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs border border-amber-500/60"
              title="ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ ಸೃಜಿಸಿ (PDF/JPG ಅಪ್‌ಲೋಡ್)"
            >
              <FileCheck2 className="w-4 h-4 text-amber-950" />
              <span>+ ಹೊಸ ಮಾಹಿತಿ ಹಕ್ಕು ಕಡತ (RTI File)</span>
            </button>
          )}

          {onOpenServiceSanctions && (
            <button
              id="btn-fts-service-sanction"
              onClick={onOpenServiceSanctions}
              className="px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs border border-amber-300"
            >
              <Award className="w-3.5 h-3.5 text-stone-950" />
              <span>ರಜೆ / ವೇತನ ಬಡ್ತಿ ಕಡತ</span>
            </button>
          )}

          <button
            onClick={() => setIsNewFileModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Open New Docket</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Files List, Right File Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Files List & Filters */}
        <div className="lg:col-span-5 space-y-3">
          {/* File Category Switcher: All & Standardized Categories */}
          <div className="bg-white rounded-xl p-2.5 border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>ಕಡತಗಳ ವರ್ಗೀಕರಣ (File Categories)</span>
              </span>
              <span className="text-[10px] text-stone-600">
                ಒಟ್ಟು ಕಡತಗಳು: {files.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <button
                type="button"
                onClick={() => setActiveCategoryCode('all')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeCategoryCode === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                ಎಲ್ಲಾ ({files.length})
              </button>
              {FILE_CATEGORIES.map(cat => {
                const count = files.filter(f => getFileCategoryMeta(f).code === cat.code).length;
                const isActive = activeCategoryCode === cat.code;
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => setActiveCategoryCode(cat.code)}
                    className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                      isActive
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : `${cat.badgeClass} hover:opacity-90`
                    }`}
                    title={cat.description}
                  >
                    <span>{cat.labelKn}</span>
                    <span className="ml-1.5 text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Docket #, Subject, Category, Custodian..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
              >
                <option value="all">All Sections (ಎಲ್ಲಾ ವಿಭಾಗ)</option>
                <option value="Academic Wing">Academic Wing (ಶೈಕ್ಷಣಿಕ)</option>
                <option value="Administration & Services">Administration (ಆಡಳಿತ)</option>
                <option value="Accounts & Grants">Accounts & Grants (ಲೆಕ್ಕಪತ್ರ)</option>
                <option value="Inspection & Quality">Inspection (ತಪಾಸಣೆ)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
              >
                <option value="all">All Statuses (ಎಲ್ಲಾ ಸ್ಥಿತಿ)</option>
                <option value="Active / Open">Active / Open</option>
                <option value="Under Scrutiny">Under Scrutiny</option>
                <option value="Pending Higher Approval">Pending Approval</option>
                <option value="Disposed / Closed">Disposed / Closed</option>
              </select>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-2">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                ಈ ಕ್ಯಾಟಗರಿಯಲ್ಲಿ ಯಾವುದೇ ಕಡತಗಳು ಕಂಡುಬಂದಿಲ್ಲ.
              </div>
            ) : (
              filteredFiles.map(file => {
                const isSelected = activeFile?.id === file.id;
                const meta = getFileCategoryMeta(file);
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-amber-400' : 'text-stone-900'}`}>
                            {file.fileNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isSelected ? 'bg-stone-800 text-amber-300 border-stone-700' : meta.badgeClass}`}>
                            {meta.labelKn}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs leading-snug line-clamp-2">
                          {file.subject}
                        </h4>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-stone-100/20">
                      <span className={isSelected ? 'text-stone-400' : 'text-stone-500'}>
                        {file.section}
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium ${isSelected ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'}`}>
                        {file.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: File Dossier & Movement Trail */}
        <div className="lg:col-span-7">
          {activeFile ? (
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden space-y-5 p-6">
              {/* File Header */}
              <div className="border-b border-stone-200 pb-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
                      {activeFile.fileNumber}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                      {activeFile.section}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsMoveModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Route / Move Docket</span>
                  </button>
                </div>

                <h3 className="text-base font-bold text-stone-900">
                  {activeFile.subject}
                </h3>

                {/* File Category Selector & Badge Card */}
                {(() => {
                  const meta = getFileCategoryMeta(activeFile);
                  return (
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${meta.iconBg}`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-stone-600">ಕಡತದ ಕ್ಯಾಟಗರಿ</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}>
                              {meta.labelKn}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 font-medium truncate max-w-sm sm:max-w-md">
                            {meta.id} • {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Dropdown to change category */}
                      {onUpdateFileCategory && (
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[11px] font-semibold text-stone-600">ಕ್ಯಾಟಗರಿ ಬದಲಿಸಿ:</label>
                          <select
                            value={activeFile.fileCategory || meta.id}
                            disabled={isChangingCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-stone-400 cursor-pointer"
                          >
                            {FILE_CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.labelKn} ({cat.labelEn})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-stone-600">
                  <div>
                    <span className="text-[10px] uppercase text-stone-600 block font-semibold">Current Custodian</span>
                    <strong className="text-stone-900">{activeFile.currentCustodian}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-stone-600 block font-semibold">File Status</span>
                    <strong className="text-emerald-700">{activeFile.status}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-stone-600 block font-semibold">Initiated Date</span>
                    <strong className="text-stone-900">{activeFile.initiatedDate}</strong>
                  </div>
                </div>

                {activeFile.notes && (
                  <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100 mt-2">
                    {activeFile.notes}
                  </p>
                )}
              </div>

              {/* RTI DOCKET SPECIFIC CASE DETAILS (If RTI File) */}
              {(activeFile.isRtiFile || activeFile.rtiDetails) && (
                <div className="bg-amber-50/70 rounded-xl border border-amber-300 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-amber-800" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                          ಮಾಹಿತಿ ಹಕ್ಕು ಅಧಿನಿಯಮ 2005 (RTI Act 2005 Case Dossier)
                        </h4>
                        <span className="text-[11px] font-mono font-semibold text-amber-800">
                          ಅರ್ಜಿ ಕ್ರ.ಸಂ: {activeFile.rtiDetails?.applicationNumber || 'RTI-APP-BEO'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-200/80 text-amber-900 border border-amber-400">
                        {activeFile.rtiDetails?.rtiStatus || 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ'}
                      </span>
                      {onOpenRtiReply && (
                        <button
                          type="button"
                          onClick={() => onOpenRtiReply(activeFile)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>ಮಾಹಿತಿಗೆ ಪತ್ರ ತಯಾರಿಸು (Draft Reply Letter)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber-800">ಅರ್ಜಿದಾರರ ವಿವರ (Applicant Details)</span>
                      <p className="font-semibold text-stone-900">{activeFile.rtiDetails?.applicantName || 'ಶ್ರೀಯುತ ಅರ್ಜಿದಾರರು'}</p>
                      <p className="text-stone-600 text-[11px]">{activeFile.rtiDetails?.applicantAddress || 'ಭದ್ರಾವತಿ'}</p>
                      {activeFile.rtiDetails?.applicantPhone && (
                        <p className="text-stone-500 text-[11px]">ದೂರವಾಣಿ: {activeFile.rtiDetails.applicantPhone}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber-800">ಕಾಲಮಿತಿ ಹಾಗೂ ಶುಲ್ಕ ವಿವರ (Due Date & Fee)</span>
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        <span>ಸ್ವೀಕೃತ ದಿನಾಂಕ: <strong>{activeFile.rtiDetails?.applicationDate || activeFile.initiatedDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>30 ದಿನಗಳ ಕಾಲಮಿತಿ ಗಡುವು: <strong>{activeFile.rtiDetails?.statutoryDueDate || '30 Days'}</strong></span>
                      </div>
                      <p className="text-stone-600 text-[11px] mt-0.5">
                        ಶುಲ್ಕ: {activeFile.rtiDetails?.feeDetails || '₹10/- ಕೋರ್ಟ್ ಫೀ ಸ್ಟಾಂಪ್'}
                      </p>
                    </div>
                  </div>

                  {activeFile.rtiDetails?.informationSought && (
                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-900 block mb-1">
                        ಅರ್ಜಿಯಲ್ಲಿ ಕೋರಲಾದ ಮಾಹಿತಿ (Information Sought by Applicant):
                      </span>
                      <p className="text-xs text-stone-800 whitespace-pre-line leading-relaxed font-sans">
                        {activeFile.rtiDetails.informationSought}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-amber-900 pt-1">
                    <span>ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ: <strong>{activeFile.rtiDetails?.pioOfficer || activeFile.currentCustodian}</strong></span>
                  </div>
                </div>
              )}

              {/* ATTACHMENTS SECTION: PDF / JPG SCANNED DOCUMENTS */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                    <span>ಕಡತದ ಲಗತ್ತುಗಳು / ದಾಖಲೆ ಪ್ರತಿಗಳು (Attached Documents - PDF / JPG)</span>
                    <span className="text-[10px] px-2 py-0.2 bg-stone-100 border border-stone-200 rounded-full font-mono">
                      {activeFileDocs.length}
                    </span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMergeModalOpen(true)}
                      disabled={activeFileDocs.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
                      title="ಕಡತದ ದಾಖಲೆಗಳನ್ನು ಒಂದೇ PDF ಗೆ ವಿಲೀನಗೊಳಿಸಿ (Merge into Consolidated PDF)"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-800" />
                      <span>ದಾಖಲೆಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಿ (Merge PDF)</span>
                    </button>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg cursor-pointer transition-colors shadow-2xs">
                      <UploadCloud className="w-3.5 h-3.5 text-stone-600" />
                      <span>{isUploadingAttachment ? 'ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'ದಾಖಲೆ ಲಗತ್ತಿಸು (PDF / JPG)'}</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleUploadAttachment}
                        disabled={isUploadingAttachment}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {(() => {
                  const docs = activeFileDocs;
                  if (docs.length === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-300 space-y-1">
                        <UploadCloud className="w-6 h-6 mx-auto text-stone-300" />
                        <p>ಯಾವುದೇ PDF ಅಥವಾ JPG ದಾಖಲೆ ಲಗತ್ತಿಸಿಲ್ಲ.</p>
                        <p className="text-[11px] text-stone-400">ಮೇಲಿನ "ದಾಖಲೆ ಲಗತ್ತಿಸು" ಬಟನ್ ಒತ್ತಿ ಸ್ಕ್ಯಾನ್ ಪ್ರತಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {docs.map((doc, idx) => {
                        const isPdf = doc.fileType === 'application/pdf' || doc.fileName.toLowerCase().endsWith('.pdf');
                        return (
                          <div
                            key={doc.id || idx}
                            className="p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 flex items-start justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                isPdf ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              }`}>
                                {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                              </div>

                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-stone-900 block truncate" title={doc.fileName}>
                                  {doc.fileName}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                                  <span>{doc.fileSize}</span>
                                  <span>•</span>
                                  <span>{doc.uploadedAt || activeFile.initiatedDate}</span>
                                </div>
                                {doc.description && (
                                  <p className="text-[10px] text-stone-600 truncate mt-0.5">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {onViewAttachment && (
                              <button
                                type="button"
                                onClick={() => onViewAttachment(doc)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-white hover:bg-stone-200 rounded-md border border-stone-300 flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                                title="ದಾಖಲೆಯನ್ನು ಪೂರ್ಣವಾಗಿ ವೀಕ್ಷಿಸಿ"
                              >
                                <ExternalLink className="w-3 h-3 text-stone-500" />
                                <span>ವೀಕ್ಷಿಸಿ</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Linked Correspondence List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-stone-500" /> Linked Letters & Circulars ({linkedLetters.length})
                  </h4>
                </div>

                {linkedLetters.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-lg border border-stone-200">
                    No letters directly tagged to this master docket.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedLetters.map(l => (
                      <div
                        key={l.id}
                        onClick={() => onSelectLetter(l)}
                        className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 text-xs flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <span className="font-mono text-[10px] text-stone-500 font-bold block">
                            {l.referenceNumber} • {l.dateReceivedOrIssued}
                          </span>
                          <span className="font-semibold text-stone-900 block truncate">
                            {l.subject}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-white border border-stone-200 text-stone-700 whitespace-nowrap">
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Movement History / Docket Audit Trail */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-500" /> Physical & Digital Movement Trail
                </h4>

                {activeFile.movementHistory.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-lg border border-stone-200">
                    File is currently at initial desk. No inter-departmental transfers logged.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-stone-200 ml-3 pl-4 space-y-4">
                    {activeFile.movementHistory.map((mov, idx) => (
                      <div key={mov.id} className="relative text-xs space-y-1">
                        <span className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-stone-900 border-2 border-white" />
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span className="font-semibold text-stone-800">
                            {mov.fromOfficer} → <strong className="text-amber-800">{mov.toOfficer}</strong>
                          </span>
                          <span>{mov.sentDate}</span>
                        </div>
                        <p className="text-stone-700 bg-stone-50 p-2 rounded-md border border-stone-200">
                          {mov.remarks}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
              Select a master docket file from the left to inspect.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Move / Route Docket */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md border border-stone-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Route Docket File: {activeFile?.fileNumber}
              </h3>
              <button onClick={() => setIsMoveModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRouteFileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Transferring From</label>
                <input
                  type="text"
                  disabled
                  value={activeFile?.currentCustodian}
                  className="w-full px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-stone-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Route To (Recipient Officer) *</label>
                <input
                  type="text"
                  value={toOfficer}
                  onChange={e => setToOfficer(e.target.value)}
                  placeholder="e.g. Joint Director (Planning) / Under Secretary"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Update Status</label>
                <select
                  value={newFileStatus}
                  onChange={e => setNewFileStatus(e.target.value)}
                  className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
                >
                  <option value="Under Scrutiny">Under Scrutiny</option>
                  <option value="Pending Higher Approval">Pending Higher Approval</option>
                  <option value="Active / Open">Active / Open</option>
                  <option value="Disposed / Closed">Disposed / Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Handover Remarks / Scrutiny Directions</label>
                <textarea
                  rows={3}
                  value={movementRemarks}
                  onChange={e => setMovementRemarks(e.target.value)}
                  placeholder="Remarks on why file is routed..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMove || !toOfficer.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New File Docket */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-stone-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Open New Master Docket File
              </h3>
              <button onClick={() => setIsNewFileModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewFileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">File Subject / Title *</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Special Infrastructure Grants for Model Secondary Schools"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">ಕಡತದ ವರ್ಗೀಕರಣ (File Category) *</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 font-medium"
                >
                  {FILE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.labelKn} — {cat.labelEn}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  {FILE_CATEGORIES.find(c => c.id === newCategory)?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Department Section</label>
                  <select
                    value={newSection}
                    onChange={e => setNewSection(e.target.value as DepartmentSection)}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
                  >
                    <option value="Academic Wing">Academic Wing</option>
                    <option value="Administration & Services">Administration</option>
                    <option value="Accounts & Grants">Accounts & Grants</option>
                    <option value="Inspection & Quality">Inspection</option>
                    <option value="Examination Board">Examination Board</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as LetterPriority)}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Initial Custodian Officer</label>
                <input
                  type="text"
                  value={newCustodian}
                  onChange={e => setNewCustodian(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Docket Synopsis / Background Notes</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Brief synopsis of this case file..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs"
                >
                  Create File Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Attachments Consolidated PDF Modal */}
      {isMergeModalOpen && activeFile && (
        <MergeAttachmentsModal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          activeFile={activeFile}
          onSaveMergedAttachment={async (newAtt) => {
            if (onUploadAttachmentToFile) {
              await onUploadAttachmentToFile(activeFile.id, newAtt);
            } else {
              if (!activeFile.attachments) activeFile.attachments = [];
              activeFile.attachments.push(newAtt);
            }
          }}
          onViewDocument={onViewAttachment}
        />
      )}
    </div>
  );
};
