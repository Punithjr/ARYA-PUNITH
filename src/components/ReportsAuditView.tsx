import React, { useState, useMemo } from 'react';
import { DakRegisterSummary, EducationLetter, MasterDocketFile, Employee } from '../types';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Inbox, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign,
  Building, 
  Tag, 
  ShieldCheck,
  Users,
  FolderGit2,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ReportsAuditViewProps {
  summary: DakRegisterSummary | null;
  letters: EducationLetter[];
  files?: MasterDocketFile[];
  employees?: Employee[];
  onRefresh: () => void;
  onNavigateToEmployees?: () => void;
  onNavigateToFiles?: () => void;
  onSelectLetter?: (letter: EducationLetter) => void;
}

export const ReportsAuditView: React.FC<ReportsAuditViewProps> = ({
  summary,
  letters,
  files = [],
  employees = [],
  onRefresh,
  onNavigateToEmployees,
  onNavigateToFiles,
  onSelectLetter,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [fileSectionFilter, setFileSectionFilter] = useState('all');
  const [expandedFileNumber, setExpandedFileNumber] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Ref No', 'Date', 'Direction', 'Subject', 'Category', 'Section', 'Sender', 'Recipient', 'Priority', 'Status', 'Due Date'];
    const rows = letters.map(l => [
      `"${l.referenceNumber}"`,
      `"${l.dateReceivedOrIssued}"`,
      `"${l.direction.toUpperCase()}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.section}"`,
      `"${l.senderName}"`,
      `"${l.recipientName}"`,
      `"${l.priority}"`,
      `"${l.status}"`,
      `"${l.dueDate}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `education_department_dak_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute file-wise comprehensive totals
  const computedFileTotals = useMemo(() => {
    if (files.length > 0) {
      return files.map(file => {
        const matched = letters.filter(l => l.fileNumber === file.fileNumber || (file.linkedLetterIds && file.linkedLetterIds.includes(l.id)));
        const amount = matched.reduce((s, l) => s + (l.financialAmount || 0), 0);
        return {
          fileNumber: file.fileNumber,
          subject: file.subject,
          section: file.section,
          currentCustodian: file.currentCustodian,
          status: file.status,
          priority: file.priority,
          lettersCount: matched.length,
          financialAmount: amount,
          letters: matched,
        };
      });
    }

    if (summary?.fileWiseTotals) {
      return summary.fileWiseTotals.map(f => ({
        ...f,
        letters: letters.filter(l => l.fileNumber === f.fileNumber),
      }));
    }

    // Fallback if no files passed: deduce files from letters
    const map = new Map<string, EducationLetter[]>();
    letters.forEach(l => {
      const fn = l.fileNumber || 'Unassigned';
      if (!map.has(fn)) map.set(fn, []);
      map.get(fn)!.push(l);
    });

    return Array.from(map.entries()).map(([fileNumber, fLetters]) => {
      const amount = fLetters.reduce((s, l) => s + (l.financialAmount || 0), 0);
      return {
        fileNumber,
        subject: fLetters[0]?.subject || 'Official Docket',
        section: fLetters[0]?.section || 'Administration & Services',
        currentCustodian: fLetters[0]?.assignedOfficer || 'Section Officer',
        status: 'Active / Open',
        priority: fLetters[0]?.priority || 'Routine',
        lettersCount: fLetters.length,
        financialAmount: amount,
        letters: fLetters,
      };
    });
  }, [files, letters, summary]);

  const filteredFileTotals = useMemo(() => {
    return computedFileTotals.filter(item => {
      if (fileSectionFilter !== 'all' && item.section !== fileSectionFilter) return false;
      if (fileSearchQuery.trim()) {
        const q = fileSearchQuery.toLowerCase();
        return (
          item.fileNumber.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.currentCustodian.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [computedFileTotals, fileSectionFilter, fileSearchQuery]);

  const handleExportFileWiseCSV = () => {
    const headers = ['File Number', 'Subject', 'Section', 'Custodian Officer', 'Status', 'Priority', 'Attached Letters Count', 'Financial Sanctions'];
    const rows = computedFileTotals.map(f => [
      `"${f.fileNumber}"`,
      `"${f.subject.replace(/"/g, '""')}"`,
      `"${f.section}"`,
      `"${f.currentCustodian}"`,
      `"${f.status}"`,
      `"${f.priority}"`,
      f.lettersCount,
      `"$${f.financialAmount.toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `education_file_wise_total_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSanctioned = summary?.totalGrantsSanctioned || letters.reduce((s, l) => s + (l.financialAmount || 0), 0);
  const disposalRate = summary?.disposalRate ?? (letters.length > 0 ? Math.round((letters.filter(l => l.status === 'Closed & Archived' || l.status === 'Dispatched').length / letters.length) * 100) : 0);

  // Employee Statistics
  const totalEmployeesCount = summary?.totalEmployees ?? employees.length;
  const activeEmployeesCount = summary?.activeEmployees ?? employees.filter(e => e.status === 'Active').length;
  const onLeaveEmployeesCount = totalEmployeesCount - activeEmployeesCount;

  // File Statistics
  const totalFilesCount = summary?.totalFiles ?? files.length;
  const totalLettersInFiles = computedFileTotals.reduce((s, f) => s + f.lettersCount, 0);

  return (
    <div id="reports-audit-dak-view" className="space-y-6">
      {/* Action Header */}
      <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-stone-900" />
            <h2 className="text-base font-bold text-stone-900">
              Departmental Dashboard & Audit Register
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • ಒಟ್ಟು ನೌಕರರು (Employee Total), ಫೈಲ್‌ವಾರು ವಿವರ (File-Wise Total), Dak register & disposal audit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsRefreshing(true);
              onRefresh();
              setTimeout(() => setIsRefreshing(false), 800);
            }}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 border border-stone-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>

          <button
            onClick={handleExportFileWiseCSV}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5 border border-amber-200"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>ಫೈಲ್‌ವಾರು CSV (File Total)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 border border-stone-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Dak CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div id="printable-audit-report" className="space-y-6">
        {/* Official Header for Print */}
        <div className="bg-white rounded-xl p-6 border border-stone-200/90 shadow-xs text-center border-b-2 border-stone-900 space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">
            Government of Public Instruction • Department of Education
          </h3>
          <h4 className="text-base font-bold text-stone-900">
            Official Executive Dashboard, Inward/Outward Dak & File Disposal Ledger
          </h4>
          <p className="text-xs text-stone-500">
            Reporting Period: FY2026-27 • Establishment Roster, Sectional Clearance & Docket Dispositions
          </p>
        </div>

        {/* Executive KPI Cards - 6 Cards Grid (including Emp Total & File Total) */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Dak */}
          <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              ಒಟ್ಟು ಪತ್ರಗಳು / Total Dak
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {summary?.totalLetters ?? letters.length}
            </div>
            <span className="text-[11px] text-stone-500 mt-0.5 block truncate">
              {summary?.totalInward ?? letters.filter(l => l.direction === 'inward').length} In / {summary?.totalOutward ?? letters.filter(l => l.direction === 'outward').length} Out
            </span>
          </div>

          {/* Card 2: Emp Total */}
          <div 
            className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-xs group cursor-pointer hover:border-amber-400 transition-colors"
            onClick={onNavigateToEmployees}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-600" />
                emp ಒಟ್ಟು / Staff
              </span>
              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {totalEmployeesCount}
            </div>
            <span className="text-[11px] text-stone-600 mt-0.5 block truncate">
              <span className="text-emerald-700 font-semibold">{activeEmployeesCount} Active</span> • {onLeaveEmployeesCount} Leave
            </span>
          </div>

          {/* Card 3: File Total */}
          <div 
            className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-xs group cursor-pointer hover:border-blue-400 transition-colors"
            onClick={onNavigateToFiles}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                <FolderGit2 className="w-3 h-3 text-blue-600" />
                ಒಟ್ಟು ಫೈಲುಗಳು / Files
              </span>
              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-blue-950 mt-1">
              {totalFilesCount}
            </div>
            <span className="text-[11px] text-stone-600 mt-0.5 block truncate">
              {totalLettersInFiles} Letters linked
            </span>
          </div>

          {/* Card 4: Disposal Efficiency */}
          <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              ವಿಲೇವಾರಿ / Disposal
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {disposalRate}%
            </div>
            <span className="text-[11px] text-stone-500 mt-0.5 block truncate">
              {summary?.closedCount ?? letters.filter(l => l.status === 'Closed & Archived' || l.status === 'Dispatched').length} Cleared
            </span>
          </div>

          {/* Card 5: Pending & Overdue */}
          <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              ಬಾಕಿ / Pending
            </span>
            <div className={`text-2xl font-bold mt-1 ${(summary?.overdueCount ?? 0) > 0 ? 'text-rose-700' : 'text-stone-900'}`}>
              {summary?.pendingActionCount ?? 0}
            </div>
            <span className="text-[11px] text-rose-600 mt-0.5 block truncate">
              {summary?.overdueCount ?? 0} Overdue
            </span>
          </div>

          {/* Card 6: Grants & Sanctions */}
          <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              ಅನುದಾನ / Grants
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              ${(totalSanctioned / 1000000).toFixed(2)}M
            </div>
            <span className="text-[11px] text-stone-500 mt-0.5 block truncate">
              Sanction Orders
            </span>
          </div>
        </div>

        {/* AI Strategic Assessment */}
        {summary?.aiExecutiveOverview && (
          <div className="bg-white rounded-xl p-6 border border-stone-200/90 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-100 text-amber-900">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Automated Governance Appraisal & Disposal Analysis
              </h3>
            </div>
            <div className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans bg-stone-50 p-4 rounded-lg border border-stone-200 whitespace-pre-wrap">
              {summary.aiExecutiveOverview}
            </div>
          </div>
        )}

        {/* HIGHLIGHTED SECTION: FILE-WISE TOTAL & DOCKET CORRESPONDENCE MATRIX */}
        <div id="file-wise-total-section" className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  ಫೈಲ್‌ವಾರು ಒಟ್ಟು ವಿವರ • File-Wise Total & Docket Ledger
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Detailed file docket allocation, showing exact letter counts and financial values per master file.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={fileSearchQuery}
                  onChange={e => setFileSearchQuery(e.target.value)}
                  placeholder="ಫೈಲ್ ಹುಡುಕಿ (Search file)..."
                  className="pl-8 pr-3 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden"
                />
              </div>

              <select
                value={fileSectionFilter}
                onChange={e => setFileSectionFilter(e.target.value)}
                className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden"
              >
                <option value="all">ಎಲ್ಲಾ ಶಾಖೆಗಳು (All Sections)</option>
                <option value="Academic Wing">Academic Wing</option>
                <option value="Administration & Services">Administration</option>
                <option value="Accounts & Grants">Accounts & Grants</option>
                <option value="Examination Board">Examination Board</option>
                <option value="Inspection & Quality">Inspection & Quality</option>
                <option value="Legal & Grievances">Legal & Grievances</option>
              </select>

              {onNavigateToFiles && (
                <button
                  onClick={onNavigateToFiles}
                  className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Layers className="w-3 h-3 text-amber-400" />
                  <span>FTS ಫೈಲ್ ವ್ಯವಸ್ಥೆ</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Ribbon for Files */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">ಒಟ್ಟು ಫೈಲುಗಳು (Total Files)</span>
              <p className="font-bold text-stone-900 text-sm">{computedFileTotals.length}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">ಫೈಲ್‌ನಲ್ಲಿರುವ ಪತ್ರಗಳು (Attached Letters)</span>
              <p className="font-bold text-blue-700 text-sm">{totalLettersInFiles} Letters</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">ಸರಾಸರಿ ಪತ್ರ/ಫೈಲ್ (Avg Letters/File)</span>
              <p className="font-bold text-stone-800 text-sm">
                {computedFileTotals.length > 0 ? (totalLettersInFiles / computedFileTotals.length).toFixed(1) : 0}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">ಮಂಜೂರಾದ ಒಟ್ಟು ಮೊತ್ತ (Total Sanctions)</span>
              <p className="font-bold text-emerald-800 text-sm">
                ${computedFileTotals.reduce((s, f) => s + f.financialAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* File-Wise Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-600 bg-stone-100/80 font-semibold">
                  <th className="py-2.5 px-3">ಫೈಲ್ ಸಂಖ್ಯೆ (File Number)</th>
                  <th className="py-2.5 px-3">ಕಡತ ವಿಷಯ (Subject)</th>
                  <th className="py-2.5 px-3">ಶಾಖೆ (Section)</th>
                  <th className="py-2.5 px-3">ಹಾಲಿ ಅಧಿಕಾರಿ (Custodian)</th>
                  <th className="py-2.5 px-3 text-center">ಸ್ಥಿತಿ (Status)</th>
                  <th className="py-2.5 px-3 text-center">ಒಟ್ಟು ಪತ್ರಗಳು (Letters)</th>
                  <th className="py-2.5 px-3 text-right">ಅನುದಾನ (Sanction)</th>
                  <th className="py-2.5 px-3 text-center no-print">ವಿವರ (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70">
                {filteredFileTotals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-xs text-stone-500">
                      ಯಾವುದೇ ಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ (No matching master files found).
                    </td>
                  </tr>
                ) : (
                  filteredFileTotals.map((item) => {
                    const isExpanded = expandedFileNumber === item.fileNumber;
                    return (
                      <React.Fragment key={item.fileNumber}>
                        <tr className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-xs font-bold text-blue-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <FolderGit2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{item.fileNumber}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-stone-900 max-w-xs">
                            <p className="truncate" title={item.subject}>{item.subject}</p>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded-sm bg-stone-100 text-stone-700 text-[11px]">
                              {item.section}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap max-w-[140px] truncate">
                            {item.currentCustodian}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              item.status === 'Disposed / Closed' 
                                ? 'bg-stone-100 text-stone-600'
                                : item.status === 'In Movement'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-md text-xs bg-amber-100 text-amber-900 border border-amber-300/80">
                              {item.lettersCount} {item.lettersCount === 1 ? 'Letter' : 'Letters'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-stone-800 whitespace-nowrap">
                            {item.financialAmount > 0 ? `$${item.financialAmount.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap no-print">
                            <button
                              onClick={() => setExpandedFileNumber(isExpanded ? null : item.fileNumber)}
                              className="px-2 py-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide' : 'View Letters'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable nested letters table */}
                        {isExpanded && (
                          <tr className="bg-stone-50/90">
                            <td colSpan={8} className="p-3 pl-8">
                              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                                    Correspondence Attached to {item.fileNumber} ({item.letters.length} Records)
                                  </span>
                                  {onNavigateToFiles && (
                                    <button
                                      onClick={onNavigateToFiles}
                                      className="text-[11px] font-medium text-blue-700 hover:underline inline-flex items-center gap-1"
                                    >
                                      <span>Open in Docket Tracking</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {item.letters.length === 0 ? (
                                  <p className="text-xs text-stone-500 italic py-1">No individual correspondence documents linked to this docket.</p>
                                ) : (
                                  <div className="divide-y divide-stone-100 text-xs">
                                    {item.letters.map(letter => (
                                      <div key={letter.id} className="py-1.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className={`text-[10px] font-bold px-1 py-0.5 rounded-xs ${letter.direction === 'inward' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                            {letter.direction.toUpperCase()}
                                          </span>
                                          <span className="font-mono font-semibold text-stone-800 whitespace-nowrap">{letter.referenceNumber}</span>
                                          <span className="text-stone-700 truncate">{letter.subject}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[10px] text-stone-500">{letter.dateReceivedOrIssued}</span>
                                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded-sm">
                                            {letter.status}
                                          </span>
                                          {onSelectLetter && (
                                            <button
                                              onClick={() => onSelectLetter(letter)}
                                              className="text-[10px] font-semibold text-stone-900 bg-stone-200 hover:bg-stone-300 px-1.5 py-0.5 rounded-sm transition-colors"
                                            >
                                              View
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sectional & Category Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sectional Breakdown */}
          <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-stone-400" /> Sectional Caseload & Pending Action
            </h3>

            <div className="space-y-2.5">
              {summary?.sectionBreakdown && (Object.entries(summary.sectionBreakdown) as [string, { total: number; pending: number }][]).map(([sec, data]) => {
                const pct = summary.totalLetters > 0 ? (data.total / summary.totalLetters) * 100 : 0;
                return (
                  <div key={sec} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800">{sec}</span>
                      <span className="text-stone-600">
                        {data.total} total ({data.pending} pending)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-800 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-400" /> Correspondence Volume by Subject Category
            </h3>

            <div className="space-y-2.5">
              {summary?.categoryBreakdown && (Object.entries(summary.categoryBreakdown) as [string, number][]).map(([cat, count]) => {
                const pct = summary.totalLetters > 0 ? (count / summary.totalLetters) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800 truncate pr-2">{cat}</span>
                      <span className="font-semibold text-stone-900">{count} files</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* EMPLOYEE ESTABLISHMENT & CADRE CADENCE OVERVIEW */}
        {employees.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  ಸಿಬ್ಬಂದಿ ಮತ್ತು ಅಧಿಕಾರಿಗಳ ವರ್ಗೀಕರಣ • Staff Cadre & Establishment Strength ({employees.length} Total)
                </h3>
              </div>
              {onNavigateToEmployees && (
                <button
                  onClick={onNavigateToEmployees}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 no-print"
                >
                  <span>ಅಧಿಕಾರಿಗಳ ಪೂರ್ಣ ಪಟ್ಟಿ (View All Staff)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[10px] font-bold uppercase text-stone-500">ಒಟ್ಟು ಸಿಬ್ಬಂದಿ (Total Cadre)</span>
                <p className="text-xl font-bold text-stone-900 mt-0.5">{employees.length}</p>
                <span className="text-[11px] text-stone-500">Gazetted & Non-Gazetted</span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800">ಸೇವೆಯಲ್ಲಿರುವವರು (Active on Duty)</span>
                <p className="text-xl font-bold text-emerald-900 mt-0.5">
                  {employees.filter(e => e.status === 'Active').length}
                </p>
                <span className="text-[11px] text-emerald-700">Present in Directorate</span>
              </div>
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-800">ಕಾಯಂ ಹುದ್ದೆಗಳು (Permanent)</span>
                <p className="text-xl font-bold text-blue-900 mt-0.5">
                  {employees.filter(e => e.employmentType === 'Permanent').length}
                </p>
                <span className="text-[11px] text-blue-700">Substantive Cadre</span>
              </div>
              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800">ರಜೆ / ನಿಯೋಜನೆ (Leave / Deputation)</span>
                <p className="text-xl font-bold text-amber-900 mt-0.5">
                  {employees.filter(e => e.status !== 'Active').length}
                </p>
                <span className="text-[11px] text-amber-700">Temporary absence</span>
              </div>
            </div>
          </div>
        )}

        {/* Master Chronological Dak Register Table */}
        <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Chronological Correspondence Register Ledger ({letters.length} entries)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                  <th className="py-2 px-3 font-semibold">Ref No & Date</th>
                  <th className="py-2 px-3 font-semibold">Flow</th>
                  <th className="py-2 px-3 font-semibold">Subject</th>
                  <th className="py-2 px-3 font-semibold">Section</th>
                  <th className="py-2 px-3 font-semibold">Sender / Recipient</th>
                  <th className="py-2 px-3 font-semibold">Priority</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold text-right">Target Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {letters.map(l => (
                  <tr key={l.id} className="hover:bg-stone-50">
                    <td className="py-2 px-3 font-mono text-[11px] font-bold text-stone-900 whitespace-nowrap">
                      {l.referenceNumber}
                      <span className="block text-[10px] font-normal text-stone-400">{l.dateReceivedOrIssued}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${l.direction === 'inward' ? 'bg-blue-50 text-blue-800' : 'bg-emerald-50 text-emerald-800'}`}>
                        {l.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-stone-900 max-w-xs truncate">
                      {l.subject}
                    </td>
                    <td className="py-2 px-3 text-stone-600 whitespace-nowrap">{l.section}</td>
                    <td className="py-2 px-3 text-stone-600 truncate max-w-[160px]">
                      {l.direction === 'inward' ? l.senderName : l.recipientName}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold">{l.priority}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-stone-100 text-stone-800">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                      {l.dueDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attestation & Signature Sign-off */}
        <div className="bg-white rounded-xl p-6 border border-stone-200/90 shadow-xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Statutory Dispatch Officer Attestation
          </h4>
          <p className="text-xs text-stone-600 leading-relaxed italic">
            Certified that the above correspondence, inward dak entries, outward government orders, master docket files, and establishment strengths have been audited in conformity with the Departmental Manual of Office Procedure.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-stone-100">
            <div>
              <div className="border-b border-stone-400 h-8"></div>
              <span className="text-[11px] text-stone-500 mt-1 block">Central Registry Officer / Section Head Signature</span>
            </div>
            <div>
              <div className="border-b border-stone-400 h-8 flex items-end pb-1 font-mono text-xs text-stone-700">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">Date Signed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
