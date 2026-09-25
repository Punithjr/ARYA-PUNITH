import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Building2, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  IndianRupee, 
  BookOpen, 
  Calendar, 
  Lock,
  Edit2
} from 'lucide-react';
import { PayRule, OfficeConfig, AdminAuthUser, Employee } from '../types';
import { OfficeStaffTable } from './OfficeStaffTable';

interface AdminSettingsPanelProps {
  currentUser: AdminAuthUser | null;
  onRefreshData?: () => void;
}

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const [payRules, setPayRules] = useState<PayRule[]>([]);
  const [officeConfig, setOfficeConfig] = useState<OfficeConfig | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Active settings tab: 'rules' | 'office' | 'backup'
  const [activeTab, setActiveTab] = useState<'rules' | 'office' | 'backup'>('rules');

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [rulesRes, officeRes, empRes] = await Promise.all([
        fetch('/api/memorandum/pay-rules'),
        fetch('/api/memorandum/office-config'),
        fetch('/api/employees'),
      ]);

      if (rulesRes.ok) {
        const d = await rulesRes.json();
        setPayRules(d.payRules || []);
      }
      if (officeRes.ok) {
        const d = await officeRes.json();
        setOfficeConfig(d.config || null);
      }
      if (empRes.ok) {
        const d = await empRes.json();
        setEmployees(d.employees || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Update Pay Rule Handler
  const handleUpdateRule = async (rule: PayRule) => {
    if (currentUser?.role !== 'Admin') {
      showMsg('ವೇತನ ನಿಯಮಗಳನ್ನು ಬದಲಾಯಿಸಲು ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ ಅಧಿಕಾರವಿದೆ.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/memorandum/pay-rules/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.displayName,
        },
        body: JSON.stringify(rule),
      });

      if (res.ok) {
        showMsg(`"${rule.orderTypeName}" ನಿಯಮವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.`);
        loadSettings();
      } else {
        const d = await res.json();
        showMsg(d.error || 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    } catch (err: any) {
      showMsg('ದೋಷ: ' + err.message, 'error');
    }
  };

  // Update Office Config Handler
  const handleSaveOfficeConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      showMsg('ಕಛೇರಿ ಸೆಟ್ಟಿಂಗ್ಸ್ ಬದಲಾಯಿಸಲು ಅಡ್ಮಿನ್ ಅಧಿಕಾರ ಅಗತ್ಯ.', 'error');
      return;
    }

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const updated: OfficeConfig = {
      officeNameKannada: formData.get('officeNameKannada') as string,
      officeNameEnglish: formData.get('officeNameEnglish') as string,
      officerDesignationKannada: formData.get('officerDesignationKannada') as string,
      officerName: formData.get('officerName') as string,
      departmentKannada: formData.get('departmentKannada') as string,
      officeAddress: formData.get('officeAddress') as string,
      district: formData.get('district') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactPhone: formData.get('contactPhone') as string,
      orderPrefix: formData.get('orderPrefix') as string,
      kcsrEdition: formData.get('kcsrEdition') as string,
    };

    try {
      const res = await fetch('/api/memorandum/office-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.displayName,
        },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setOfficeConfig(updated);
        showMsg('ಕಛೇರಿ ಹಾಗೂ ಅಧಿಕಾರಿಗಳ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.');
      } else {
        const d = await res.json();
        showMsg(d.error || 'ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ', 'error');
      }
    } catch (err: any) {
      showMsg('ದೋಷ: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Backup Download Handler
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/memorandum/backup');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Karnataka_Govt_Memorandum_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMsg('ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ.');
      }
    } catch (err: any) {
      showMsg('ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: ' + err.message, 'error');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (currentUser?.role !== 'Admin') {
      showMsg('ರಿಸೆಟ್ ಮಾಡಲು ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ ಮಾತ್ರ ಅಧಿಕಾರವಿದೆ.', 'error');
      return;
    }

    if (!confirm('ಎಚ್ಚರಿಕೆ: ಎಲ್ಲಾ ಡೇಟಾಬೇಸ್ ವಿವರಗಳು ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಮೂಲ ಮಾದರಿಗೆ ಮರುಹೊಂದಾಣಿಕೆಯಾಗಲಿದೆ. ಮುಂದುವರಿಯಬೇಕೆ?')) {
      return;
    }

    try {
      const res = await fetch('/api/memorandum/reset-defaults', {
        method: 'POST',
        headers: {
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.displayName,
        },
      });

      if (res.ok) {
        showMsg('ಡೇಟಾಬೇಸ್ ಯಶಸ್ವಿಯಾಗಿ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.');
        loadSettings();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      showMsg('ರಿಸೆಟ್ ವಿಫಲವಾಗಿದೆ: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                  ಆಡಳಿತ ನಿಯಂತ್ರಣ • Admin Panel
                </span>
                <span className="text-xs text-stone-500">KCSR Pay Rules & Office Configuration</span>
              </div>
              <h1 className="text-xl font-bold text-stone-900 mt-1 font-sans">
                ಸೆಟ್ಟಿಂಗ್ಸ್ & ವೇತನ ನಿಯಮಗಳು (Settings & Configurable Pay Rules)
              </h1>
              <p className="text-xs text-stone-600 mt-0.5">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ವೇತನ ಬಡ್ತಿ ನಿಯಮಗಳು (10/15/20/25/30 ವರ್ಷ), ರಜೆ ನಿಯಮಗಳು ಹಾಗೂ ಕಛೇರಿ ಲೆಟರ್‌ಹೆಡ್ ಸೆಟ್ಟಿಂಗ್ಸ್.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-stone-600" />
              <span>ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್</span>
            </button>
            {currentUser?.role === 'Admin' && (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ಮೂಲ ಮಾದರಿ ಡೇಟಾಗೆ ಮರುಹೊಂದಿಸಿ"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ಮೂಲ ಮಾದರಿ ರಿಸೆಟ್</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-white px-4 pt-2 rounded-t-lg">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rules'
              ? 'border-sky-950 text-sky-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>ವೇತನ ಬಡ್ತಿ ನಿಯಮಗಳು (Pay Rules Engine)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('office')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'office'
              ? 'border-sky-950 text-sky-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>ಕಛೇರಿ & ಅಧಿಕಾರಿ ವಿವರಗಳು (Office Config)</span>
        </button>
      </div>

      {/* TAB 1: PAY RULES */}
      {activeTab === 'rules' && (
        <div className="bg-white border border-stone-200 rounded-b-lg p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900 font-sans">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರ ನೌಕರರ ವೇತನ ಬಡ್ತಿ ನಿಯಮಗಳ ಸಂರಚನೆ (Configurable Pay & Increment Rules)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಇಲ್ಲಿ ಅರ್ಹತಾ ವರ್ಷಗಳು, ಬಡ್ತಿ ಹಂತದ ಮೌಲ್ಯ, ಜಾರಿಗೆ ತರುವ ನಿಯಮಗಳು ಹಾಗೂ ಸರಕಾರಿ ಆದೇಶದ ಉಲ್ಲೇಖಗಳನ್ನು ಬದಲಾಯಿಸಬಹುದು.
              </p>
            </div>
            <span className="text-xs text-stone-500 font-mono">ಒಟ್ಟು ನಿಯಮಗಳು: {payRules.length}</span>
          </div>

          <div className="space-y-4">
            {payRules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-lg border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-950 text-white rounded text-xs font-bold font-mono">
                      {rule.ruleCode}
                    </span>
                    <h4 className="font-bold text-sm text-stone-900 font-sans">
                      {rule.orderTypeName}
                    </h4>
                  </div>
                  <span className="text-xs text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded">
                    ಸರಕಾರಿ ಆದೇಶ: <strong className="font-mono text-stone-800">{rule.applicableGovtOrder}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">ಅರ್ಹತಾ ಸೇವಾ ಅವಧಿ (ವರ್ಷಗಳು)</label>
                    <input
                      type="number"
                      defaultValue={rule.qualifyingYears}
                      onChange={(e) => {
                        rule.qualifyingYears = Number(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">ಬಡ್ತಿಯ ವಿಧಾನ (Increment Type)</label>
                    <select
                      defaultValue={rule.incrementType}
                      onChange={(e) => {
                        rule.incrementType = e.target.value as any;
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white"
                    >
                      <option value="matrix_stage">ಕರ್ನಾಟಕ ವೇತನ ಮ್ಯಾಟ್ರಿಕ್ಸ್ ಹಂತ (Matrix Stage)</option>
                      <option value="fixed_amount">ನಿಗದಿತ ಮೊತ್ತ (Fixed Amount)</option>
                      <option value="percentage">ಶೇಕಡಾವಾರು (Percentage)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">ಬಡ್ತಿ ಮೌಲ್ಯ / ಹಂತಗಳ ಸಂಖ್ಯೆ</label>
                    <input
                      type="number"
                      defaultValue={rule.incrementValue}
                      onChange={(e) => {
                        rule.incrementValue = Number(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">ಜಾರಿಗೆ ಬರುವ ದಿನಾಂಕ ನಿಯಮ</label>
                    <select
                      defaultValue={rule.effectiveDateRule}
                      onChange={(e) => {
                        rule.effectiveDateRule = e.target.value as any;
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white"
                    >
                      <option value="milestone_date">ಅರ್ಹತೆ ಪೂರ್ಣಗೊಂಡ ದಿನಾಂಕದಿಂದ</option>
                      <option value="first_of_next_month">ಮುಂದಿನ ತಿಂಗಳ 1 ನೇ ತಾರೀಖಿನಿಂದ</option>
                      <option value="order_date">ಆದೇಶದ ದಿನಾಂಕದಿಂದ</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-500 text-[11px] mb-1">ಕೆಸಿಎಸ್‌ಆರ್ ನಿಯಮದ ಉಲ್ಲೇಖ (KCSR Reference)</label>
                    <input
                      type="text"
                      defaultValue={rule.kcsrReference}
                      onChange={(e) => {
                        rule.kcsrReference = e.target.value;
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdateRule(rule)}
                      className="px-4 py-1.5 bg-sky-950 hover:bg-sky-900 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>ನಿಯಮವನ್ನು ಉಳಿಸಿ</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OFFICE CONFIG */}
      {activeTab === 'office' && officeConfig && (
        <div className="space-y-6">
          <form onSubmit={handleSaveOfficeConfig} className="bg-white border border-stone-200 rounded-b-lg p-6 shadow-2xs space-y-4 text-xs">
          <div className="border-b border-stone-200 pb-3">
            <h3 className="font-bold text-sm text-stone-900 font-sans">
              ಕಛೇರಿ ಹಾಗೂ ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರದ ವಿವರಗಳು (Office & Authority Setup)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              ಈ ವಿವರಗಳು ಸೃಜಿಸಲಾಗುವ ಎಲ್ಲಾ ಅಧಿಕೃತ ಜ್ಞಾಪನಾ ಆದೇಶಗಳ ಹೆಡರ್, ಸೀಲ್ ಹಾಗೂ ಸಹಿ ಬ್ಲಾಕ್‌ನಲ್ಲಿ ಪ್ರದರ್ಶಿತವಾಗಲಿವೆ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">ಕಛೇರಿಯ ಹೆಸರು (ಕನ್ನಡದಲ್ಲಿ) *</label>
              <input
                type="text"
                name="officeNameKannada"
                defaultValue={officeConfig.officeNameKannada}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Office Name (English)</label>
              <input
                type="text"
                name="officeNameEnglish"
                defaultValue={officeConfig.officeNameEnglish}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ಇಲಾಖೆಯ ಹೆಸರು (Department)</label>
              <input
                type="text"
                name="departmentKannada"
                defaultValue={officeConfig.departmentKannada}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ಸಕ್ಷಮ ಅಧಿಕಾರಿಯ ಹುದ್ದೆ *</label>
              <input
                type="text"
                name="officerDesignationKannada"
                defaultValue={officeConfig.officerDesignationKannada}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ಅಧಿಕಾರಿಯ ಹೆಸರು (Officer Name)</label>
              <input
                type="text"
                name="officerName"
                defaultValue={officeConfig.officerName}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ಜಿಲ್ಲೆ (District)</label>
              <input
                type="text"
                name="district"
                defaultValue={officeConfig.district}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ಆದೇಶ ಸಂಖ್ಯೆಯ ಪೂರ್ವಪ್ರತ್ಯಯ (Prefix)</label>
              <input
                type="text"
                name="orderPrefix"
                defaultValue={officeConfig.orderPrefix}
                className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ಸಂಪರ್ಕ ಇಮೇಲ್ (Official Email)</label>
              <input
                type="email"
                name="contactEmail"
                defaultValue={officeConfig.contactEmail}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">ಸಂಪರ್ಕ ದೂರವಾಣಿ (Phone)</label>
              <input
                type="text"
                name="contactPhone"
                defaultValue={officeConfig.contactPhone}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block font-bold text-stone-700 mb-1">ಕಛೇರಿಯ ಪೂರ್ಣ ವಿಳಾಸ (Office Address)</label>
              <input
                type="text"
                name="officeAddress"
                defaultValue={officeConfig.officeAddress}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-200">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಕಛೇರಿ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ'}</span>
            </button>
          </div>
        </form>

        {/* DETAILED PRINTABLE OFFICE STAFF ROSTER TABLE */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900 font-sans">
                ಕಛೇರಿ ಸಿಬ್ಬಂದಿ ವಿವರಗಳ ಪಟ್ಟಿ (Office Staff Roster & Printable Table)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರ: <strong className="text-stone-900">ಶ್ರೀ ಬಿ.ಕೆ. ನಾರಯಣಪ್ಪ (BEO)</strong> ಹಾಗೂ ಕಛೇರಿಯ ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ ವಿವರ, ಪದನಾಮ, ಶಾಖೆ ಮತ್ತು ದೂರವಾಣಿ ಸಂಖ್ಯೆಗಳು.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/employees/seed', { method: 'POST' });
                  if (res.ok) {
                    showMsg('ಸಿಬ್ಬಂದಿ ಡೇಟಾವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮರುಹೊಂದಿಸಲಾಗಿದೆ (Data Reseeded).');
                    loadSettings();
                    if (onRefreshData) onRefreshData();
                  }
                } catch (e: any) {
                  showMsg('ಮರುಹೊಂದಿಸುವಾಗ ದೋಷ: ' + e.message, 'error');
                }
              }}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded border border-stone-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ಡೇಟಾ ಮರುಹೊಂದಿಸಿ (Reseed Staff)</span>
            </button>
          </div>

          <OfficeStaffTable employees={employees} showTitleHeader={false} />
        </div>
      </div>
      )}
    </div>
  );
};
