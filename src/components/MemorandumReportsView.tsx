import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Clock, 
  ArrowRight, 
  IndianRupee, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  FileSpreadsheet, 
  Award, 
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { MemorandumDashboardSummary, Employee, AdminAuthUser } from '../types';

interface MemorandumReportsViewProps {
  currentUser: AdminAuthUser | null;
  onGenerateOrderForEmployee?: (emp: Employee, suggestedType: string) => void;
}

export const MemorandumReportsView: React.FC<MemorandumReportsViewProps> = ({
  currentUser,
  onGenerateOrderForEmployee,
}) => {
  const [summary, setSummary] = useState<MemorandumDashboardSummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeReportTab, setActiveReportTab] = useState<'dueList' | 'byType' | 'audit'>('dueList');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, empRes] = await Promise.all([
        fetch('/api/memorandum/dashboard-summary'),
        fetch('/api/memorandum/employees'),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Employees Due for Increment based on joining date
  const computeDueEmployees = () => {
    const now = new Date();
    const results: Array<{
      employee: Employee;
      yearsCompleted: number;
      eligibleMilestone: string;
      milestoneDate: string;
    }> = [];

    employees.forEach(emp => {
      if (!emp.joiningDate) return;
      const join = new Date(emp.joiningDate);
      if (isNaN(join.getTime())) return;

      const diffMs = now.getTime() - join.getTime();
      const totalYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      const floorYears = Math.floor(totalYears);

      // Milestones: 10, 15, 20, 25, 30
      let milestone = '';
      let targetYears = 0;
      if (floorYears >= 30) {
        milestone = '30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ';
        targetYears = 30;
      } else if (floorYears >= 25) {
        milestone = '25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ';
        targetYears = 25;
      } else if (floorYears >= 20) {
        milestone = '20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ';
        targetYears = 20;
      } else if (floorYears >= 15) {
        milestone = '15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ';
        targetYears = 15;
      } else if (floorYears >= 10) {
        milestone = '10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ';
        targetYears = 10;
      }

      if (milestone) {
        const estDate = new Date(join.getFullYear() + targetYears, join.getMonth(), join.getDate());
        results.push({
          employee: emp,
          yearsCompleted: Math.round(totalYears * 10) / 10,
          eligibleMilestone: milestone,
          milestoneDate: estDate.toISOString().split('T')[0],
        });
      }
    });

    return results;
  };

  const dueList = computeDueEmployees();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-sky-950 text-amber-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                  ಆಡಳಿತ ಪರಿಶೀಲನೆ • ವರದಿಗಳ ಶಾಖೆ
                </span>
                <span className="text-xs text-stone-500">Karnataka Govt Analytics & Audit</span>
              </div>
              <h1 className="text-xl font-bold text-stone-900 mt-1 font-sans">
                ಜ್ಞಾಪನಾ ಆದೇಶ ಹಾಗೂ ವೇತನ ವರದಿಗಳು (Reports & Analytics)
              </h1>
              <p className="text-xs text-stone-600 mt-0.5">
                ವೇತನ ಬಡ್ತಿಗೆ ಅರ್ಹರಿರುವ ನೌಕರರ ನಿರೀಕ್ಷಿತ ಪಟ್ಟಿ, ಆದೇಶ ಪ್ರಕಾರವಾರು ಅಂಕಿಅಂಶ ಹಾಗೂ ಆಡಳಿತ ಲೆಕ್ಕ ಪರಿಶೋಧನಾ ವರದಿ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              className="p-2 border border-stone-300 hover:bg-stone-100 rounded text-stone-600 transition-colors cursor-pointer"
              title="ಮರುಲೋಡ್ ಮಾಡಿ"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ವರದಿ ಮುದ್ರಿಸಿ (Print Report)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            ಒಟ್ಟು ಹೊರಡಿಸಿದ ಆದೇಶಗಳು
          </span>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
            {summary?.totalOrders ?? 0}
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block">ದಾಖಲಾದ ಅಧಿಕೃತ ಜ್ಞಾಪನಾ ಆದೇಶಗಳು</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 block">
            ನೋಂದಾಯಿತ ನೌಕರರು
          </span>
          <div className="text-2xl font-bold text-sky-950 mt-1 font-mono">
            {summary?.totalEmployees ?? employees.length}
          </div>
          <span className="text-[11px] text-sky-800 mt-0.5 block">ಕಛೇರಿ ವ್ಯಾಪ್ತಿಯ ಬೋಧಕ/ಬೋಧಕೇತರ ಸಿಬ್ಬಂದಿ</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            ಬಡ್ತಿಗೆ ಅರ್ಹರಿರುವ ನೌಕರರು
          </span>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {dueList.length}
          </div>
          <span className="text-[11px] text-amber-900 mt-0.5 block">10/15/20/25/30 ವರ್ಷ ಪೂರೈಸಿದವರು</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            ತಿಂಗಳ ವೇತನ ಪರಿಷ್ಕರಣೆ ಒಟ್ಟು ಮೊತ್ತ
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            ₹{(summary?.financialImpactMonthly ?? 0).toLocaleString('en-IN')}/-
          </div>
          <span className="text-[11px] text-emerald-900 mt-0.5 block">ಬಡ್ತಿಗಳಿಂದ ಒಟ್ಟು ಮಾಸಿಕ ಹೆಚ್ಚಳ</span>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-stone-200 bg-white px-4 pt-2 rounded-t-lg">
        <button
          type="button"
          onClick={() => setActiveReportTab('dueList')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === 'dueList'
              ? 'border-sky-950 text-sky-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>ಬಡ್ತಿ ಅರ್ಹತಾ ನಿರೀಕ್ಷಿತ ಪಟ್ಟಿ ({dueList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('byType')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === 'byType'
              ? 'border-sky-950 text-sky-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>ಆದೇಶ ಪ್ರಕಾರವಾರು ಸಾರಾಂಶ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeReportTab === 'audit'
              ? 'border-sky-950 text-sky-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ಲೆಕ್ಕ ಪರಿಶೋಧನಾ ದಾಖಲೆ (Audit Trail)</span>
        </button>
      </div>

      {/* TAB 1: DUE LIST */}
      {activeReportTab === 'dueList' && (
        <div className="bg-white border border-stone-200 rounded-b-lg overflow-hidden shadow-2xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <span className="font-semibold text-stone-800">
              ಸೇವಾ ಅವಧಿ ಪೂರೈಸಿದ ನೌಕರರಿಗೆ ಜ್ಞಾಪನಾ ಆದೇಶ ಸೃಜಿಸಲು ಕೆಳಗಿನ ಪಟ್ಟಿಯಿಂದ ನೇರವಾಗಿ ಆಯ್ಕೆ ಮಾಡಬಹುದು:
            </span>
            <span className="text-[11px] text-stone-500">ಒಟ್ಟು {dueList.length} ನೌಕರರು ಅರ್ಹರು</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">ನೌಕರರ ಹೆಸರು & ಕೆಜಿಐಡಿ</th>
                  <th className="py-3 px-4">ಹುದ್ದೆ & ಶಾಲೆ</th>
                  <th className="py-3 px-4">ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ</th>
                  <th className="py-3 px-4">ಪೂರ್ಣಗೊಂಡ ಸೇವೆ</th>
                  <th className="py-3 px-4">ಅರ್ಹ ಬಡ್ತಿ ಪ್ರಕಾರ</th>
                  <th className="py-3 px-4">ಪ್ರಸ್ತುತ ಮೂಲ ವೇತನ</th>
                  <th className="py-3 px-4 text-right">ಕ್ರಮ (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800">
                {dueList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      ಯಾವುದೇ ನೌಕರರು ಸದ್ಯಕ್ಕೆ ಹೊಸ ಬಡ್ತಿಗೆ ಬಾಕಿ ಇಲ್ಲ.
                    </td>
                  </tr>
                ) : (
                  dueList.map(({ employee, yearsCompleted, eligibleMilestone, milestoneDate }) => (
                    <tr key={employee.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900 block">{employee.fullName}</span>
                        <span className="text-[11px] font-mono text-sky-950 font-semibold">KGID: {employee.kgidNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800 block">{employee.designation}</span>
                        <span className="text-[11px] text-stone-500 truncate block max-w-xs">{employee.officeLocation}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {employee.joiningDate}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-bold">
                          {yearsCompleted} ವರ್ಷಗಳು
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded text-[11px] font-semibold">
                          {eligibleMilestone}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        ₹{(employee.basicPay || 37900).toLocaleString('en-IN')}/-
                      </td>
                      <td className="py-3 px-4 text-right">
                        {onGenerateOrderForEmployee && (
                          <button
                            type="button"
                            onClick={() => onGenerateOrderForEmployee(employee, eligibleMilestone)}
                            className="px-3 py-1.5 bg-sky-950 hover:bg-sky-900 text-white rounded text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>ಆದೇಶ ಸೃಜಿಸಿ</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BY TYPE SUMMARY */}
      {activeReportTab === 'byType' && (
        <div className="bg-white border border-stone-200 rounded-b-lg p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-stone-900 font-sans uppercase tracking-wide">
            ಆದೇಶ ಪ್ರಕಾರವಾರು ಅಂಕಿಅಂಶಗಳ ವಿಶ್ಲೇಷಣೆ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: '10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ', count: summary?.ordersByType['10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ'] || 0, color: 'border-blue-300 bg-blue-50/50 text-blue-950' },
              { type: '15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ', count: summary?.ordersByType['15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ'] || 0, color: 'border-indigo-300 bg-indigo-50/50 text-indigo-950' },
              { type: '20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ', count: summary?.ordersByType['20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ'] || 0, color: 'border-amber-300 bg-amber-50/50 text-amber-950' },
              { type: '25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ', count: summary?.ordersByType['25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ'] || 0, color: 'border-orange-300 bg-orange-50/50 text-orange-950' },
              { type: '30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ', count: summary?.ordersByType['30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ'] || 0, color: 'border-purple-300 bg-purple-50/50 text-purple-950' },
              { type: 'ಗಳಿಕೆ ರಜೆ', count: summary?.ordersByType['ಗಳಿಕೆ ರಜೆ'] || 0, color: 'border-emerald-300 bg-emerald-50/50 text-emerald-950' },
              { type: 'ಶಿಶುಪಾಲನ ರಜೆ', count: summary?.ordersByType['ಶಿಶುಪಾಲನ ರಜೆ'] || 0, color: 'border-pink-300 bg-pink-50/50 text-pink-950' },
            ].map((item) => (
              <div key={item.type} className={`p-4 rounded-lg border-2 ${item.color}`}>
                <span className="text-xs font-bold block">{item.type}</span>
                <div className="text-2xl font-bold font-mono mt-1">
                  {item.count} <span className="text-xs font-normal text-stone-500">ಆದೇಶಗಳು</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeReportTab === 'audit' && (
        <div className="bg-white border border-stone-200 rounded-b-lg overflow-hidden shadow-2xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <span className="font-semibold text-stone-800">
              ಜ್ಞಾಪನಾ ಆದೇಶ ವ್ಯವಸ್ಥೆಯ ಅಧಿಕೃತ ಲಾಗ್‌ಗಳು ಮತ್ತು ಬಳಕೆದಾರರ ಚಟುವಟಿಕೆಗಳು:
            </span>
            <span className="text-[11px] text-stone-500">ಕಳೆದ 50 ಚಟುವಟಿಕೆಗಳು</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">ಸಮಯ & ದಿನಾಂಕ</th>
                  <th className="py-3 px-4">ಚಟುವಟಿಕೆ (Action)</th>
                  <th className="py-3 px-4">ವಿವರಗಳು (Details)</th>
                  <th className="py-3 px-4">ನೌಕರರು / ಕಡತ</th>
                  <th className="py-3 px-4">ನಿರ್ವಹಿಸಿದವರು</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800">
                {(!summary?.recentAuditLogs || summary.recentAuditLogs.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-500">
                      ಯಾವುದೇ ಆಡಿಟ್ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.
                    </td>
                  </tr>
                ) : (
                  summary.recentAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-600 text-[11px]">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-800 border border-stone-300 rounded font-semibold text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {log.kgidNumber ? `KGID: ${log.kgidNumber}` : (log.orderNumber || '—')}
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        <strong>{log.performedBy}</strong> <span className="text-[11px] text-stone-500">({log.role})</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
