import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap, 
  FileText, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Employee, DepartmentSection, EmploymentType, EmployeeStatus, EmployeeRole } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Employee>, isEdit: boolean) => Promise<void>;
  initialEmployee?: Employee | null;
}

const SECTIONS: DepartmentSection[] = [
  'Academic Wing',
  'Administration & Services',
  'Accounts & Grants',
  'Examination Board',
  'Inspection & Quality',
  'Legal & Grievances',
];

const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Permanent',
  'Contractual',
  'Deputation',
  'Probation',
];

const STATUSES: EmployeeStatus[] = [
  'Active',
  'On Leave',
  'Transferred',
  'Deputation',
  'Retired',
];

const ROLES: EmployeeRole[] = [
  'Director / HOD',
  'District Officer',
  'Section Officer',
  'Superintendent',
  'Clerk / Assistant',
  'Inspector / Evaluator',
  'Faculty / Principal',
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEmployee,
}) => {
  const isEdit = Boolean(initialEmployee);

  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [section, setSection] = useState<DepartmentSection>('Academic Wing');
  const [officeLocation, setOfficeLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Permanent');
  const [status, setStatus] = useState<EmployeeStatus>('Active');
  const [role, setRole] = useState<EmployeeRole>('Section Officer');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [qualifications, setQualifications] = useState('');
  const [notes, setNotes] = useState('');

  // Karnataka Service & Pay Fields
  const [kgidNumber, setKgidNumber] = useState('');
  const [basicPay, setBasicPay] = useState<number | ''>(37900);
  const [payScale, setPayScale] = useState('37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850');
  const [incrementMonth, setIncrementMonth] = useState<'January' | 'July'>('January');
  const [placeOfWork, setPlaceOfWork] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [childCareLeaveQuota, setChildCareLeaveQuota] = useState<number>(180);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmployee) {
      setEmployeeCode(initialEmployee.employeeCode);
      setFullName(initialEmployee.fullName);
      setDesignation(initialEmployee.designation);
      setSection(initialEmployee.section);
      setOfficeLocation(initialEmployee.officeLocation);
      setEmail(initialEmployee.email);
      setPhone(initialEmployee.phone);
      setEmploymentType(initialEmployee.employmentType);
      setStatus(initialEmployee.status);
      setRole(initialEmployee.role);
      setJoiningDate(initialEmployee.joiningDate || new Date().toISOString().split('T')[0]);
      setQualifications(initialEmployee.qualifications || '');
      setNotes(initialEmployee.notes || '');

      setKgidNumber(initialEmployee.kgidNumber || '');
      setBasicPay(initialEmployee.basicPay !== undefined ? initialEmployee.basicPay : 37900);
      setPayScale(initialEmployee.payScale || '37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850');
      setIncrementMonth(initialEmployee.incrementMonth === 'July' ? 'July' : 'January');
      setPlaceOfWork(initialEmployee.placeOfWork || initialEmployee.officeLocation || '');
      setGender((initialEmployee.gender as any) || 'Female');
      setChildCareLeaveQuota(initialEmployee.childCareLeaveQuota !== undefined ? initialEmployee.childCareLeaveQuota : 180);
    } else {
      // New employee default
      const randomCode = `EDN-EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      setEmployeeCode(randomCode);
      setFullName('');
      setDesignation('');
      setSection('Academic Wing');
      setOfficeLocation('BEO Office, Bhadravathi');
      setEmail('');
      setPhone('');
      setEmploymentType('Permanent');
      setStatus('Active');
      setRole('Faculty / Principal');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setQualifications('B.Ed. / D.Ed.');
      setNotes('');

      setKgidNumber('');
      setBasicPay(37900);
      setPayScale('37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850');
      setIncrementMonth('January');
      setPlaceOfWork('');
      setGender('Female');
      setChildCareLeaveQuota(180);
    }
    setError(null);
  }, [initialEmployee, isOpen]);

  if (!isOpen) return null;

  const handleGenerateCode = () => {
    const randomCode = `EDN-EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    setEmployeeCode(randomCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide the employee full name.');
      return;
    }
    if (!designation.trim()) {
      setError('Please provide the official designation / post.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(
        {
          employeeCode: employeeCode.trim(),
          fullName: fullName.trim(),
          designation: designation.trim(),
          section,
          officeLocation: officeLocation.trim(),
          email: email.trim(),
          phone: phone.trim(),
          employmentType,
          status,
          role,
          joiningDate,
          qualifications: qualifications.trim(),
          notes: notes.trim(),
          kgidNumber: kgidNumber.trim(),
          basicPay: basicPay !== '' ? Number(basicPay) : undefined,
          payScale: payScale.trim(),
          incrementMonth,
          placeOfWork: placeOfWork.trim() || officeLocation.trim(),
          gender,
          childCareLeaveQuota: Number(childCareLeaveQuota) || 180,
        },
        isEdit
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save employee data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="employee-form-modal"
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                {isEdit ? 'Update Employee Record' : 'Add New Department Official'}
              </h2>
              <p className="text-[11px] text-stone-400">
                {isEdit 
                  ? `Modifying establishment credentials for ${initialEmployee?.fullName}` 
                  : 'Register a civil service officer, teacher, or administrative staff'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Employee Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700">
                  Employee ID / Code *
                </label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-[10px] text-amber-700 hover:text-amber-800 font-medium flex items-center gap-0.5"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Auto-Code
                  </button>
                )}
              </div>
              <input
                id="input-emp-code"
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="e.g. EDN-EMP-1045"
                className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cadre Status *
              </label>
              <select
                id="select-emp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Full Name & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name (with Honorific) *
              </label>
              <input
                id="input-emp-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Alistair Vance / Sarah Jenkins"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Official Designation / Title *
              </label>
              <input
                id="input-emp-designation"
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Director of School Education / Section Officer"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 3: Section & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Departmental Wing / Section *
              </label>
              <select
                id="select-emp-section"
                value={section}
                onChange={(e) => setSection(e.target.value as DepartmentSection)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Establishment Role Category *
              </label>
              <select
                id="select-emp-role"
                value={role}
                onChange={(e) => setRole(e.target.value as EmployeeRole)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Office Posting Location & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Office / School Posting Location (ಸ್ಥಳ)
              </label>
              <input
                id="input-emp-location"
                type="text"
                value={officeLocation}
                onChange={(e) => {
                  setOfficeLocation(e.target.value);
                  if (!placeOfWork) setPlaceOfWork(e.target.value);
                }}
                placeholder="ಉದಾ: ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ ಹೊಸಮನೆ, ಭದ್ರಾವತಿ"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Employment Engagement Type
              </label>
              <select
                id="select-emp-type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4b: Karnataka Pay Commission & Increment Details */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
            <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span>ವೇತನ ಶ್ರೇಣಿ ಮತ್ತು ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ವಿವರ (Pay & Increment Details)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ (KGID No.)
                </label>
                <input
                  id="input-emp-kgid"
                  type="text"
                  value={kgidNumber}
                  onChange={(e) => setKgidNumber(e.target.value)}
                  placeholder="ಉದಾ: 108294"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  ಪ್ರಸ್ತುತ ಮೂಲ ವೇತನ (Basic Pay ₹)
                </label>
                <input
                  id="input-emp-basic-pay"
                  type="number"
                  value={basicPay}
                  onChange={(e) => setBasicPay(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="37900"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  ವಾರ್ಷಿಕ ವೇತನ ಬಡ್ತಿ ಮಾಹೆ (Increment Month) *
                </label>
                <select
                  id="select-emp-increment-month"
                  value={incrementMonth}
                  onChange={(e) => setIncrementMonth(e.target.value as 'January' | 'July')}
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-bold text-amber-950"
                >
                  <option value="January">ಜನವರಿ (January 1st)</option>
                  <option value="July">ಜುಲೈ (July 1st)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                ಕರ್ನಾಟಕ ರಾಜ್ಯ ವೇತನ ಶ್ರೇಣಿ (Pay Scale)
              </label>
              <input
                id="input-emp-pay-scale"
                type="text"
                value={payScale}
                onChange={(e) => setPayScale(e.target.value)}
                placeholder="37900-950-39800-1100-46400-1250-53900-1450-62600-1650-70850"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono text-[11px]"
              />
            </div>

            {/* Child Care Leave (ಶಿಶುಪಾಲನ ರಜೆ) & Gender Controls */}
            <div className="pt-2 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  ಲಿಂಗ (Gender) *
                </label>
                <select
                  id="select-emp-gender"
                  value={gender}
                  onChange={(e) => {
                    const g = e.target.value as 'Female' | 'Male' | 'Other';
                    setGender(g);
                    if (g === 'Female' && (!childCareLeaveQuota || childCareLeaveQuota === 0)) {
                      setChildCareLeaveQuota(180);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-medium"
                >
                  <option value="Female">ಮಹಿಳಾ (Female)</option>
                  <option value="Male">ಪುರುಷ (Male)</option>
                  <option value="Other">ಇತರೆ (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>ಶಿಶುಪಾಲನ ರಜೆ ಒಟ್ಟು ಕೋಟಾ (ದಿನಗಳು) *</span>
                  <span className="text-[10px] text-pink-700 font-normal">ಡೀಫಾಲ್ಟ್: 180 ದಿನಗಳು</span>
                </label>
                <input
                  id="input-emp-childcare-quota"
                  type="number"
                  min={0}
                  max={730}
                  value={childCareLeaveQuota}
                  onChange={(e) => setChildCareLeaveQuota(Number(e.target.value))}
                  placeholder="180"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/40 font-mono font-bold text-pink-900"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  ಎಲ್ಲಾ ಮಹಿಳಾ ನೌಕರರಿಗೆ ಒಟ್ಟು 180 ದಿನಗಳ ರಜೆ ಇರುತ್ತದೆ. ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ಬದಲಾಯಿಸಬಹುದು.
                </p>
              </div>
            </div>
          </div>

          {/* Row 5: Email, Phone & Date of Joining */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Official Email
              </label>
              <input
                id="input-emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@gov.education.org"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phone Number
              </label>
              <input
                id="input-emp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Date of Joining
              </label>
              <input
                id="input-emp-joining"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 6: Qualifications */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Educational & Professional Qualifications
            </label>
            <input
              id="input-emp-qualifications"
              type="text"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="e.g. Ph.D. Educational Administration, M.Ed., LL.M."
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Row 7: Administrative Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Service Notes & Dossier Remarks
            </label>
            <textarea
              id="textarea-emp-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Authorized assignments, special delegations, or remarks..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-employee"
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEdit ? 'Update Employee Record' : 'Save Employee Data'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
