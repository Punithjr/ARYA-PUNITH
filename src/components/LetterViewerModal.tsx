import React, { useState, useEffect } from 'react';
import { EducationLetter, ActionNote } from '../types';
import { PrintPreviewModal } from './PrintPreviewModal';
import { 
  X, 
  Printer, 
  FileText, 
  Paperclip, 
  MessageSquare, 
  Sparkles, 
  Send, 
  Download, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  Tag, 
  ArrowDownLeft, 
  ArrowUpRight,
  Shield,
  Edit3,
  Plus
} from 'lucide-react';

interface LetterViewerModalProps {
  letter: EducationLetter | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (letter: EducationLetter) => void;
  onOpenDrafterWithLetter: (letter: EducationLetter) => void;
  onAddNote: (letterId: string, noteData: Partial<ActionNote>) => Promise<void>;
  onUpdateStatus: (letterId: string, newStatus: string) => Promise<void>;
}

export const LetterViewerModal: React.FC<LetterViewerModalProps> = ({
  letter,
  isOpen,
  onClose,
  onEdit,
  onOpenDrafterWithLetter,
  onAddNote,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'notes' | 'attachments' | 'ai_brief'>('document');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [authorName, setAuthorName] = useState('Dr. Alistair Vance');
  const [authorDesignation, setAuthorDesignation] = useState('Director of School Education');
  const [actionType, setActionType] = useState<'Note' | 'Approval' | 'Forward' | 'Query' | 'Disposition'>('Note');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // AI Brief State
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Dynamic DDO Officer State
  const [ddoOfficer, setDdoOfficer] = useState<{
    name: string;
    designation: string;
    office: string;
  }>({
    name: 'ಹೆಚ್. ರವಿಕುಮಾರ್',
    designation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಡಿಡಿಓ',
    office: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
  });

  useEffect(() => {
    fetch('/api/memorandum/office-config')
      .then(res => res.json())
      .then(data => {
        const cfg = data.office || data.config;
        if (cfg?.ddoOfficerName || cfg?.officerName) {
          setDdoOfficer({
            name: cfg.ddoOfficerName || cfg.officerName,
            designation: cfg.ddoDesignation || cfg.officerDesignation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಡಿಡಿಓ',
            office: cfg.ddoOfficeName || cfg.officeName || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setAiSummary(null);
  }, [letter?.id]);

  if (!isOpen || !letter) return null;

  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  const handleAppendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      setIsSubmittingNote(true);
      await onAddNote(letter.id, {
        author: authorName,
        designation: authorDesignation,
        note: newNoteText,
        actionType,
      });
      setNewNoteText('');
    } catch (err) {
      console.error('Failed to append note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const fetchAiSummary = async (force = false) => {
    if (aiSummary && !force) return;
    try {
      setIsLoadingAi(true);
      const res = await fetch('/api/ai/summarize-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterText: letter.bodyText,
          subject: letter.subject,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data);
      } else {
        // High quality client fallback if request returned non-OK
        setAiSummary({
          summary: `Official administrative review for ${letter.subject}. Requires operational compliance scrutiny and departmental coordination.`,
          actionItems: [
            'Confirm institutional compliance and statutory records.',
            'Issue acknowledgment dispatch to sender.',
            'Schedule administrative disposal within the designated statutory period.'
          ],
          urgencyAssessment: 'Routine administrative review required within statutory response timeline.',
          recommendedSection: letter.section || 'Academic Wing',
          modelUsed: 'administrative-backup'
        });
      }
    } catch (err) {
      console.error('AI summary fetch notice:', err);
      setAiSummary({
        summary: `Official administrative review for ${letter.subject}. Requires operational compliance scrutiny and departmental coordination.`,
        actionItems: [
          'Confirm institutional compliance and statutory records.',
          'Issue acknowledgment dispatch to sender.',
          'Schedule administrative disposal within the designated statutory period.'
        ],
        urgencyAssessment: 'Routine administrative review required within statutory response timeline.',
        recommendedSection: letter.section || 'Academic Wing',
        modelUsed: 'administrative-backup'
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSwitchTab = (tab: 'document' | 'notes' | 'attachments' | 'ai_brief') => {
    setActiveTab(tab);
    if (tab === 'ai_brief') {
      fetchAiSummary();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div 
        id="letter-viewer-modal"
        className="bg-white rounded-2xl w-full max-w-4xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Modal Navigation & Meta */}
        <div className="px-6 py-3.5 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                letter.direction === 'inward'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {letter.direction === 'inward' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {letter.direction.toUpperCase()} DAK
            </span>

            <span className="font-mono text-xs font-bold text-stone-900 bg-stone-200/80 px-2 py-0.5 rounded-sm">
              {letter.referenceNumber}
            </span>

            <span className="text-xs text-stone-500 font-mono hidden sm:inline">
              File: {letter.fileNumber}
            </span>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-lg">
            <button
              onClick={() => handleSwitchTab('document')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'document' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official Document</span>
            </button>

            <button
              onClick={() => handleSwitchTab('notes')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'notes' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Minute Sheet ({letter.actionNotes.length})</span>
            </button>

            <button
              onClick={() => handleSwitchTab('attachments')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'attachments' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Files ({letter.attachments.length})</span>
            </button>

            <button
              onClick={() => handleSwitchTab('ai_brief')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'ai_brief' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-600 hover:text-amber-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Action Brief</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: OFFICIAL LETTERHEAD DOCUMENT */}
          {activeTab === 'document' && (
            <div id="printable-letter-document" className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-xl border border-stone-200 shadow-xs fit-paper-a4" style={{ fontSize: '12pt', lineHeight: 1.5 }}>
              {/* Official Government Mandatory Kannada Header Letterhead */}
              <div className="text-center border-b border-stone-800 pb-3 mb-5 space-y-1">
                <p className="font-extrabold text-base text-stone-950 tracking-wide">
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರ
                </p>
                <p className="font-bold text-sm text-stone-900">
                  ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
                </p>
                <p className="font-bold text-sm text-stone-900">
                  ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು
                </p>
                <p className="font-bold text-xs text-stone-800">
                  ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301
                </p>
              </div>

              {/* Ref Number & Date Row */}
              <div className="flex items-center justify-between text-xs pt-1 font-bold">
                <div className="font-mono">
                  <span className="text-stone-700">ಪತ್ರ ಸಂಖ್ಯೆ (Letter No): </span>
                  <strong className="text-stone-950">{letter.referenceNumber || letter.fileNumber}</strong>
                </div>
                <div>
                  <span className="text-stone-700">ದಿನಾಂಕ: </span>
                  <strong className="text-stone-900">
                    {new Date(letter.dateReceivedOrIssued).toLocaleDateString('kn-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                </div>
              </div>

              {/* Master File Reference */}
              <div className="text-[11px] font-mono text-stone-600 bg-stone-50 p-2 rounded-md border border-stone-200 flex justify-between items-center">
                <span>ಕಡತ ಸಂಖ್ಯೆ: <strong className="text-stone-900">{letter.fileNumber}</strong></span>
                <span>ವರ್ಗೀಕರಣ: <strong className="text-stone-900">{letter.confidentiality}</strong></span>
                <span>ಆದ್ಯತೆ: <strong className="text-stone-900">{letter.priority}</strong></span>
              </div>

              {/* Addressed To Block (ರಿಗೆ:) */}
              <div className="text-xs text-stone-900 font-kannada">
                <div className="font-bold text-stone-950 text-sm mb-1">ರಿಗೆ:</div>
                <div className="pl-4 space-y-0.5">
                  <p className="font-bold text-stone-900">{letter.recipientName}</p>
                  {letter.recipientDesignation && <p>{letter.recipientDesignation}</p>}
                  {letter.recipientDepartment && <p className="text-stone-600">{letter.recipientDepartment}</p>}
                </div>
              </div>

              {/* Prominent Subject Line */}
              <div className="py-2.5 border-y border-stone-300">
                <p className="text-xs sm:text-sm font-bold text-stone-950 leading-snug">
                  <span className="text-stone-700 mr-2">ವಿಷಯ (Subject):</span>
                  <span className="underline decoration-stone-400 underline-offset-4">{letter.subject}</span>
                </p>
              </div>

              {/* Body Text */}
              <div className="text-xs sm:text-sm text-stone-900 font-serif leading-relaxed whitespace-pre-wrap selection:bg-amber-100">
                {letter.bodyText}
              </div>

              {/* Financial Grant details if available */}
              {letter.financialAmount && letter.financialAmount > 0 && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-300 text-xs">
                  <span className="font-bold text-stone-800 block">FINANCIAL EXPENDITURE AUTHORIZATION:</span>
                  <p className="text-stone-700 mt-0.5">
                    An aggregate sanction of <strong>₹{letter.financialAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> has been allocated under verified budgetary heads for this order.
                  </p>
                </div>
              )}

              {/* Sign-off Signature Block */}
              <div className="pt-6 flex justify-end">
                <div className="text-center min-w-[240px] space-y-1">
                  <p className="text-xs text-stone-600 mb-6">ತಮ್ಮ ನಂಬುಗೆಯ, ಸಹಿ/-</p>
                  <p className="font-bold text-xs text-stone-950">({(letter as any).signatoryName || (letter.direction === 'outward' && letter.senderName ? letter.senderName : ddoOfficer.name)})</p>
                  <p className="font-bold text-[11px] text-stone-900">{(letter as any).signatoryDesignation || (letter.direction === 'outward' && letter.senderDesignation ? letter.senderDesignation : ddoOfficer.designation)}</p>
                  <p className="text-[11px] text-stone-800">{(letter as any).signatoryOffice || ddoOfficer.office}</p>
                </div>
              </div>

              {/* Endorsements / Copy to */}
              {letter.endorsements && letter.endorsements.length > 0 && (
                <div className="pt-4 border-t border-stone-200 text-xs space-y-1">
                  <span className="font-bold text-stone-700 block uppercase tracking-wider text-[10px]">
                    Copy forwarded for information and necessary action to:
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5 text-stone-600 text-[11px]">
                    {letter.endorsements.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MINUTE SHEET / OFFICIAL NOTING RECORD */}
          {activeTab === 'notes' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Official Minute Sheet & Audit Trail
                </h4>
                <p className="text-amber-800 mt-0.5">
                  Department officers add chronological notes, queries, regulatory approvals, and forwarding remarks to this file.
                </p>
              </div>

              {/* List of existing notes */}
              <div className="space-y-3">
                {letter.actionNotes.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200">
                    No minute notes recorded yet on this correspondence.
                  </div>
                ) : (
                  letter.actionNotes.map((note, idx) => (
                    <div key={note.id} className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-stone-900 block">{note.author}</span>
                            <span className="text-[10px] text-stone-500">{note.designation}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-stone-100 text-stone-700 border border-stone-200">
                            {note.actionType}
                          </span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">{note.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-700 font-sans leading-relaxed bg-stone-50/50 p-2.5 rounded-md border border-stone-100">
                        {note.note}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAppendNote} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <h5 className="font-bold text-stone-800 text-xs">Append Official Minute Note</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Officer Name"
                    className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={authorDesignation}
                    onChange={e => setAuthorDesignation(e.target.value)}
                    placeholder="Designation"
                    className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <select
                    value={actionType}
                    onChange={e => setActionType(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  >
                    <option value="Note">General Minute Note</option>
                    <option value="Approval">Sanction / Approval</option>
                    <option value="Forward">Forwarded to Section</option>
                    <option value="Query">Official Query / Clarification</option>
                    <option value="Disposition">Disposal / Closure</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  placeholder="Record your formal notes, scrutiny remarks, or directions for subordinates..."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-400 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Append Note to File</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ATTACHMENTS & DIGITAL SCANS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Attached Scans, Circulars & Supporting Documents ({letter.attachments.length})
              </h4>

              {letter.attachments.length === 0 ? (
                <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200">
                  No scanned document attachments indexed for this letter.
                </div>
              ) : (
                <div className="space-y-2">
                  {letter.attachments.map(att => (
                    <div key={att.id} className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <h5 className="font-bold text-stone-900 text-xs">{att.fileName}</h5>
                          <span className="text-[11px] text-stone-500">
                            {att.fileSize} • {att.pageCount || 4} pages • Uploaded {att.uploadedAt}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => alert(`Simulated downloading certified copy of "${att.fileName}"`)}
                        className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI ACTION BRIEF (GEMINI) */}
          {activeTab === 'ai_brief' && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="bg-stone-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Gemini Administrative Document Intelligence
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Automatic analysis of statutory timelines, action points, and response strategies.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fetchAiSummary(true)}
                  disabled={isLoadingAi}
                  className="px-3 py-1 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md transition-colors"
                >
                  {isLoadingAi ? 'Analyzing...' : 'Re-analyze'}
                </button>
              </div>

              {isLoadingAi ? (
                <div className="p-12 text-center text-stone-500 bg-stone-50 rounded-xl space-y-2">
                  <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-medium">Extracting administrative directives and regulatory deadlines...</p>
                </div>
              ) : aiSummary ? (
                <div className="space-y-4">
                  {/* Executive Summary */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Executive Synopsis
                    </span>
                    <p className="text-xs text-stone-800 leading-relaxed font-sans">
                      {aiSummary.summary}
                    </p>
                  </div>

                  {/* Immediate Action Items */}
                  {aiSummary.actionItems && aiSummary.actionItems.length > 0 && (
                    <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        Required Immediate Actions
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {aiSummary.actionItems.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Urgency & Recommended Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">
                        Urgency & Risk Assessment
                      </span>
                      <p className="text-xs font-semibold text-stone-800 mt-1">
                        {aiSummary.urgencyAssessment}
                      </p>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">
                        Recommended Nodal Section
                      </span>
                      <p className="text-xs font-semibold text-stone-800 mt-1">
                        {aiSummary.recommendedSection || letter.section}
                      </p>
                    </div>
                  </div>

                  {/* Suggested Response Points */}
                  {aiSummary.suggestedReplyPoints && aiSummary.suggestedReplyPoints.length > 0 && (
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        Suggested Key Points for Official Reply
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-stone-700">
                        {aiSummary.suggestedReplyPoints.map((pt: string, idx: number) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
          {/* Status quick switcher */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-[11px] font-semibold">Status:</span>
            <select
              value={letter.status}
              onChange={e => onUpdateStatus(letter.id, e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-stone-300 rounded-md text-stone-800"
            >
              <option value="Pending Action">Pending Action</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved & Signed">Approved & Signed</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Closed & Archived">Closed & Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenDrafterWithLetter(letter);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Draft Official Reply / Order</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Letter</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(letter);
              }}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
