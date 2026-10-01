import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Check, 
  X, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Award, 
  AlertCircle,
  LogIn
} from 'lucide-react';
import { AdminAuthUser } from '../types';
import { 
  MAX_OFFICE_USERS, 
  getRegisteredOfficeUsers, 
  registerOfficeUserWithLimit, 
  deleteOfficeUser,
  signInWithGoogleAuth 
} from '../lib/firebase';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminAuthUser | null;
  onSelectUser: (user: AdminAuthUser) => void;
  showToast: (msg: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  showToast
}) => {
  const [users, setUsers] = useState<AdminAuthUser[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State for New User Registration
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    designation: 'ಸಹಾಯಕರು / ಕಛೇರಿ ನೌಕರರು',
    role: 'Officer' as AdminAuthUser['role']
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await getRegisteredOfficeUsers();
      setUsers(list);
    } catch (err) {
      console.warn('Load users error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setIsRegistering(false);
    }
  }, [isOpen]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName || !formData.username) {
      showToast('ದಯವಿಟ್ಟು ಹೆಸರು ಮತ್ತು ಬಳಕೆದಾರರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.');
      return;
    }

    setIsLoading(true);
    const result = await registerOfficeUserWithLimit({
      displayName: formData.displayName,
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password || undefined,
      designation: formData.designation,
      role: formData.role,
      authProvider: formData.password ? 'password' : 'system'
    });

    setIsLoading(false);
    if (result.success && result.user) {
      showToast(result.message);
      setIsRegistering(false);
      setFormData({
        displayName: '',
        username: '',
        email: '',
        password: '',
        designation: 'ಸಹಾಯಕರು / ಕಛೇರಿ ನೌಕರರು',
        role: 'Officer'
      });
      await loadUsers();
    } else {
      showToast(result.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const res = await signInWithGoogleAuth();
    setIsLoading(false);
    if (res.success && res.user) {
      showToast(res.message);
      onSelectUser(res.user);
      await loadUsers();
      onClose();
    } else {
      showToast(res.message);
    }
  };

  const handleDeleteUser = async (user: AdminAuthUser) => {
    if (users.length <= 1) {
      showToast('ಕನಿಷ್ಠ ಒಬ್ಬ ಬಳಕೆದಾರರು ಕಡ್ಡಾಯವಾಗಿ ಇರಬೇಕು.');
      return;
    }
    if (window.confirm(`ಖಂಡಿತವಾಗಿ "${user.displayName}" ಬಳಕೆದಾರರನ್ನು ತೆಗೆದುಹಾಕಬೇಕೆ?`)) {
      const ok = await deleteOfficeUser(user.id || user.username);
      if (ok) {
        showToast('ಬಳಕೆದಾರರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.');
        await loadUsers();
      }
    }
  };

  if (!isOpen) return null;

  const isLimitReached = users.length >= MAX_OFFICE_USERS;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border-2 border-stone-800 shadow-[8px_8px_0px_#2b2b2b] max-w-2xl w-full overflow-hidden text-xs font-kannada flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-4 flex items-center justify-between border-b-2 border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  ಅಧಿಕೃತ ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ (Authorized User Management)
                </h3>
                <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded font-mono-code font-bold">
                  {users.length} / {MAX_OFFICE_USERS} ಬಳಕೆದಾರರು
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5">
                ಶಾಸನಬದ್ಧ ನಿಯಮ: ಗರಿಷ್ಠ ೫ ಅಧಿಕೃತ ಕಛೇರಿ ಬಳಕೆದಾರರಿಗೆ ಮಾತ್ರ ನೋಂದಣಿ ಅನುಮತಿ (Strict 5 Users Limit)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Notice Banner */}
          <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-950">
              <strong>ಸರ್ಕಾರಿ ಕಛೇರಿ ನಿಯಮ:</strong> ಭದ್ರಾವತಿ ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯದ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಗರಿಷ್ಠ ೫ ಅಧಿಕೃತ ಅಧಿಕಾರಿಗಳು/ನೌಕರರ ಖಾತೆಗಳನ್ನು ಮಾತ್ರ ನಿರ್ವಹಿಸಲು ಅವಕಾಶವಿದೆ. Firebase Auth & Cloud Firestore ಮೂಲಕ ಸುರಕ್ಷಿತವಾಗಿ ಡೇಟಾ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.
            </div>
          </div>

          {/* Action Tabs: View Users vs Register */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all border ${
                  !isRegistering
                    ? 'bg-stone-900 text-amber-300 border-stone-800 shadow-sm'
                    : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                }`}
              >
                ನೋಂದಾಯಿತ ೫ ಬಳಕೆದಾರರು ({users.length}/{MAX_OFFICE_USERS})
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isLimitReached) {
                    showToast(`ಗರಿಷ್ಠ ${MAX_OFFICE_USERS} ಬಳಕೆದಾರರ ಮಿತಿ ತಲುಪಿದೆ. ಹೊಸ ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಲು ಮೊದಲು ಇರುವ ಖಾತೆಯನ್ನು ತೆಗೆದುಹಾಕಿ.`);
                    return;
                  }
                  setIsRegistering(true);
                }}
                disabled={isLimitReached}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all border flex items-center gap-1.5 ${
                  isLimitReached
                    ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                    : isRegistering
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ ಹೊಸ ಬಳಕೆದಾರರ ನೋಂದಣಿ</span>
              </button>
            </div>

            {/* Google Sign-in Fast Option */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-800 rounded-lg font-bold flex items-center gap-2 shadow-xs cursor-pointer text-[11px]"
              title="Google Sign-In with Firebase Auth"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google ಸೈನ್-ಇನ್</span>
            </button>
          </div>

          {/* VIEW USERS LIST */}
          {!isRegistering ? (
            <div className="space-y-2.5">
              {users.map((u, idx) => {
                const isCurrent = currentUser?.username === u.username || currentUser?.email === u.email;

                return (
                  <div
                    key={u.id || u.username || idx}
                    className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-amber-50/80 border-amber-500 shadow-sm'
                        : 'bg-stone-50 border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-xs font-mono-code border border-stone-700">
                        {idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-xs">{u.displayName}</span>
                          <span className="text-[10px] bg-stone-200 text-stone-800 font-bold px-1.5 py-0.2 rounded font-mono-code">
                            {u.role}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                              ಪ್ರಸ್ತುತ ಲಾಗಿನ್ (Active)
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-stone-600 mt-0.5">{u.designation}</div>
                        <div className="text-[10px] text-stone-500 font-mono-code flex items-center gap-2 mt-0.5">
                          <span>ಬಳಕೆದಾರ: <strong>{u.username}</strong></span>
                          {u.email && <span>• {u.email}</span>}
                          {u.authProvider && <span>• Auth: {u.authProvider}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectUser(u);
                            showToast(`ಲಾಗಿನ್ ಬದಲಾಯಿಸಲಾಗಿದೆ: ${u.displayName}`);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5 text-amber-400" />
                          <span>ಈ ಖಾತೆಗೆ ಬದಲಿಸಿ</span>
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 mr-2">
                          <Check className="w-4 h-4" />
                          <span>ಸಕ್ರಿಯ</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ತೆಗೆದುಹಾಕಿ (Remove User)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* REGISTER NEW USER FORM (Strictly Max 5) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 bg-stone-50 p-4 rounded-xl border-2 border-stone-300">
              <div className="font-bold text-xs text-stone-900 pb-2 border-b border-stone-200">
                ನೂತನ ಬಳಕೆದಾರರ ವಿವರಗಳು (New User Registration - ಕೋಟಾ: {users.length}/{MAX_OFFICE_USERS})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">ಪೂರ್ಣ ಹೆಸರು (Full Name)*</label>
                  <input
                    type="text"
                    required
                    placeholder="ಶ್ರೀ / ಶ್ರೀಮತಿ..."
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">ಬಳಕೆದಾರರ ಹೆಸರು (Username)*</label>
                  <input
                    type="text"
                    required
                    placeholder="ಉದಾ: punith_fda"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded font-mono-code bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">ಇಮೇಲ್ ವಿಳಾಸ (Email)</label>
                  <input
                    type="email"
                    placeholder="user@karnataka.gov.in"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded font-mono-code bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">ಗುಪ್ತಪದ (Password)</label>
                  <input
                    type="password"
                    placeholder="ಕನಿಷ್ಠ ೬ ಅಕ್ಷರಗಳು"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">ಹುದ್ದೆ (Designation)*</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">ಪಾತ್ರ / ಅಧಿಕಾರ (Role)</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full p-2 border border-stone-300 rounded bg-white font-bold"
                  >
                    <option value="Administrator">Administrator (ಮುಖ್ಯಸ್ಥರು / BEO)</option>
                    <option value="Officer">Officer (ಅಧಿಕಾರಿಗಳು / AAO / SI)</option>
                    <option value="Superintendent">Superintendent (ಕಛೇರಿ ಅಧೀಕ್ಷಕರು)</option>
                    <option value="FDA / Nodal">FDA / Nodal (RTI & ಪಿಂಚಣಿ ನೋಡಲ್)</option>
                    <option value="Data Entry Operator">Data Entry Operator</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded text-stone-700 font-bold hover:bg-stone-100 cursor-pointer"
                >
                  ರದ್ದುಮಾಡಿ
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold transition-all border border-emerald-800 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ಬಳಕೆದಾರರನ್ನು ನೋಂದಾಯಿಸಿ</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-3 border-t-2 border-stone-800 flex items-center justify-between text-[11px] text-stone-600">
          <span>ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 cursor-pointer"
          >
            ಮುಚ್ಚಿ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
