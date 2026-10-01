import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AdminAuthUser, RtiCaseRecord, PensionCaseRecord } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const cfg = firebaseConfig as any;
export const db = cfg.firestoreDatabaseId 
  ? getFirestore(app, cfg.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const MAX_OFFICE_USERS = 5;

// The 5 Authorized Government Department User Profiles
export const INITIAL_5_OFFICE_USERS: AdminAuthUser[] = [
  {
    id: 'user-beo-01',
    username: 'beo_admin',
    email: 'beo.bhadravathi@karnataka.gov.in',
    role: 'Administrator',
    displayName: 'ಶ್ರೀ ಬಿ.ಎನ್. ರಮೇಶ್, KES',
    designation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಪ್ರಥಮ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರ (BEO & FAA)',
    loginTime: new Date().toISOString(),
    authProvider: 'system'
  },
  {
    id: 'user-aao-02',
    username: 'aao_finance',
    email: 'aao.edn.bhd@karnataka.gov.in',
    role: 'Officer',
    displayName: 'ಶ್ರೀಮತಿ ಎಸ್. ಗೀತಾ',
    designation: 'ಸಹಾಯಕ ಆಡಳಿತಾಧಿಕಾರಿಗಳು (AAO - ಲೆಕ್ಕ & ಮಂಜೂರಾತಿ)',
    loginTime: new Date().toISOString(),
    authProvider: 'system'
  },
  {
    id: 'user-os-03',
    username: 'os_superintendent',
    email: 'os.bhadravathi@karnataka.gov.in',
    role: 'Superintendent',
    displayName: 'ಶ್ರೀ ಎಂ. ಶಿವಕುಮಾರ್',
    designation: 'ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (Office Superintendent)',
    loginTime: new Date().toISOString(),
    authProvider: 'system'
  },
  {
    id: 'user-si-04',
    username: 'subject_inspector',
    email: 'si.edn.bhd@karnataka.gov.in',
    role: 'Officer',
    displayName: 'ಶ್ರೀ ಕೆ.ಎಸ್. ಮಂಜುನಾಥ್',
    designation: 'ವಿಷಯ ಪರಿವೀಕ್ಷಕರು (Subject Inspector - ಶಾಲೆಗಳ ಪರಿವೀಕ್ಷಣೆ)',
    loginTime: new Date().toISOString(),
    authProvider: 'system'
  },
  {
    id: 'user-fda-05',
    username: 'punithjr',
    email: 'punithjr2@gmail.com',
    role: 'FDA / Nodal',
    displayName: 'ಶ್ರೀ ಪುನೀತ್ ಜೆ.ಆರ್.',
    designation: 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು - ಮಾಹಿತಿ ಹಕ್ಕು & ಪಿಂಚಣಿ ನೋಡಲ್ ಅಧಿಕಾರಿ (PIO)',
    loginTime: new Date().toISOString(),
    authProvider: 'google'
  }
];

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection is operating in offline mode or awaiting Cloud Firestore API activation.');
    } else {
      console.warn('Firebase status:', error);
    }
  }
}

// Automatically verify connection on initialization
testConnection();

// ==================== USER MANAGEMENT & FIREBASE AUTH ====================

/**
 * Fetch all registered users from Firestore. If empty, seeds the 5 authorized office users.
 */
export async function getRegisteredOfficeUsers(): Promise<AdminAuthUser[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (!snap.empty) {
      const users: AdminAuthUser[] = [];
      snap.forEach(docSnap => {
        users.push(docSnap.data() as AdminAuthUser);
      });
      return users.slice(0, MAX_OFFICE_USERS);
    }

    // Seed the initial 5 users if collection is empty
    for (const u of INITIAL_5_OFFICE_USERS) {
      await setDoc(doc(db, 'users', u.id || u.username), u);
    }
    return INITIAL_5_OFFICE_USERS;
  } catch (err) {
    console.warn('Firestore getRegisteredOfficeUsers fallback:', err);
    // Return cached from localStorage or default 5
    const local = localStorage.getItem('edu_registered_5_users');
    if (local) {
      try {
        return JSON.parse(local).slice(0, MAX_OFFICE_USERS);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_5_OFFICE_USERS;
  }
}

/**
 * Registers a new office user (Strictly enforced: Maximum 5 users only).
 */
export async function registerOfficeUserWithLimit(params: {
  email: string;
  password?: string;
  username: string;
  displayName: string;
  designation: string;
  role: AdminAuthUser['role'];
  authProvider: 'google' | 'password' | 'system';
}): Promise<{ success: boolean; user?: AdminAuthUser; message: string }> {
  try {
    const currentUsers = await getRegisteredOfficeUsers();
    if (currentUsers.length >= MAX_OFFICE_USERS) {
      return {
        success: false,
        message: `ಗರಿಷ್ಠ ೫ ಬಳಕೆದಾರರ ಮಿತಿ ಮೀರಿದೆ! (Maximum limit of ${MAX_OFFICE_USERS} users reached. Cannot register more users).`
      };
    }

    // Check for duplicate username or email
    const exists = currentUsers.some(
      u => u.username.toLowerCase() === params.username.toLowerCase() || 
           (params.email && u.email?.toLowerCase() === params.email.toLowerCase())
    );
    if (exists) {
      return {
        success: false,
        message: 'ಈ ಬಳಕೆದಾರರ ಹೆಸರು ಅಥವಾ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದೆ (User already exists).'
      };
    }

    let firebaseUid = `user-${Date.now()}`;

    // If password provided and email provided, create in Firebase Auth
    if (params.password && params.email && params.authProvider === 'password') {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, params.email, params.password);
        firebaseUid = userCred.user.uid;
      } catch (authErr: any) {
        console.warn('Firebase Auth registration note:', authErr?.message);
        // If email already in use in auth, reuse uid
        if (authErr?.code !== 'auth/email-already-in-use') {
          // If network or config allows, proceed
        }
      }
    }

    const newUser: AdminAuthUser = {
      id: firebaseUid,
      username: params.username,
      email: params.email,
      role: params.role,
      displayName: params.displayName,
      designation: params.designation,
      loginTime: new Date().toISOString(),
      authProvider: params.authProvider
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', firebaseUid), newUser);
    } catch (dbErr) {
      console.warn('Firestore write user failed, saving to localStorage:', dbErr);
    }

    // Update local cache
    const updatedList = [...currentUsers, newUser].slice(0, MAX_OFFICE_USERS);
    localStorage.setItem('edu_registered_5_users', JSON.stringify(updatedList));

    return {
      success: true,
      user: newUser,
      message: `ಬಳಕೆದಾರರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ (${updatedList.length}/${MAX_OFFICE_USERS} ಬಳಕೆದಾರರು).`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'ಬಳಕೆದಾರರ ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ (User registration failed).'
    };
  }
}

/**
 * Sign in with Google Popup and match or register into the 5 authorized user slots.
 */
export async function signInWithGoogleAuth(): Promise<{ success: boolean; user?: AdminAuthUser; message: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    
    // Check if user is already registered in the 5 slots
    const currentUsers = await getRegisteredOfficeUsers();
    let matchingUser = currentUsers.find(
      u => u.email?.toLowerCase() === fbUser.email?.toLowerCase()
    );

    if (matchingUser) {
      const updated: AdminAuthUser = {
        ...matchingUser,
        photoURL: fbUser.photoURL || undefined,
        loginTime: new Date().toISOString(),
        authProvider: 'google'
      };
      await setDoc(doc(db, 'users', matchingUser.id || fbUser.uid), updated, { merge: true });
      return { success: true, user: updated, message: 'Google ಸೈನ್-ಇನ್ ಯಶಸ್ವಿಯಾಗಿದೆ.' };
    }

    // If not existing, check if we have space under the 5 limit
    if (currentUsers.length >= MAX_OFFICE_USERS) {
      // If the email is punithjr2@gmail.com, map to slot 5 (FDA Nodal)
      if (fbUser.email?.toLowerCase() === 'punithjr2@gmail.com') {
        const slot5 = currentUsers[4] || INITIAL_5_OFFICE_USERS[4];
        const updated: AdminAuthUser = {
          ...slot5,
          email: fbUser.email,
          displayName: fbUser.displayName || slot5.displayName,
          photoURL: fbUser.photoURL || undefined,
          loginTime: new Date().toISOString(),
          authProvider: 'google'
        };
        await setDoc(doc(db, 'users', slot5.id || fbUser.uid), updated, { merge: true });
        return { success: true, user: updated, message: 'Google ಸೈನ್-ಇನ್ ಯಶಸ್ವಿಯಾಗಿದೆ (FDA / ನೋಡಲ್ ಅಧಿಕಾರಿ).' };
      }

      return {
        success: false,
        message: `ಗರಿಷ್ಠ ೫ ಬಳಕೆದಾರರ ಮಿತಿ ಮೀರಿದೆ (${currentUsers.length}/${MAX_OFFICE_USERS}). ದಯವಿಟ್ಟು ನೋಂದಾಯಿತ ಖಾತೆಯೊಂದಿಗೆ ಲಾಗಿನ್ ಆಗಿ.`
      };
    }

    // Register as new user
    const newUser: AdminAuthUser = {
      id: fbUser.uid,
      username: fbUser.email?.split('@')[0] || `user_${Date.now()}`,
      email: fbUser.email || '',
      role: 'Officer',
      displayName: fbUser.displayName || 'ಅಧಿಕೃತ ನೌಕರರು',
      designation: 'ಸರ್ಕಾರಿ ಕಛೇರಿ ನೌಕರರು (Office Executive)',
      loginTime: new Date().toISOString(),
      photoURL: fbUser.photoURL || undefined,
      authProvider: 'google'
    };

    await setDoc(doc(db, 'users', fbUser.uid), newUser);
    return { success: true, user: newUser, message: 'Google ಮೂಲಕ ನೋಂದಣಿ & ಸೈನ್-ಇನ್ ಯಶಸ್ವಿಯಾಗಿದೆ.' };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Google ಸೈನ್-ಇನ್ ವಿಫಲವಾಗಿದೆ.'
    };
  }
}

/**
 * Remove an office user from Firestore so a new user can be registered (keeping <= 5).
 */
export async function deleteOfficeUser(userId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'users', userId));
    const current = await getRegisteredOfficeUsers();
    const updated = current.filter(u => u.id !== userId);
    localStorage.setItem('edu_registered_5_users', JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('deleteOfficeUser error:', err);
    return false;
  }
}

// ==================== FIRESTORE RTI CASES PERSISTENCE ====================

export async function fetchRtiCasesFromFirestore(): Promise<RtiCaseRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'rtiCases'));
    if (!snap.empty) {
      const records: RtiCaseRecord[] = [];
      snap.forEach(docSnap => records.push(docSnap.data() as RtiCaseRecord));
      return records;
    }
  } catch (err) {
    console.warn('fetchRtiCasesFromFirestore error:', err);
  }
  return [];
}

export async function saveRtiCaseToFirestore(record: RtiCaseRecord): Promise<void> {
  try {
    await setDoc(doc(db, 'rtiCases', record.id), record, { merge: true });
  } catch (err) {
    console.warn('saveRtiCaseToFirestore error:', err);
  }
}

export async function deleteRtiCaseFromFirestore(caseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'rtiCases', caseId));
  } catch (err) {
    console.warn('deleteRtiCaseFromFirestore error:', err);
  }
}

// ==================== FIRESTORE PENSION CASES PERSISTENCE ====================

export async function fetchPensionCasesFromFirestore(): Promise<PensionCaseRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'pensionCases'));
    if (!snap.empty) {
      const records: PensionCaseRecord[] = [];
      snap.forEach(docSnap => records.push(docSnap.data() as PensionCaseRecord));
      return records;
    }
  } catch (err) {
    console.warn('fetchPensionCasesFromFirestore error:', err);
  }
  return [];
}

export async function savePensionCaseToFirestore(record: PensionCaseRecord): Promise<void> {
  try {
    await setDoc(doc(db, 'pensionCases', record.id), record, { merge: true });
  } catch (err) {
    console.warn('savePensionCaseToFirestore error:', err);
  }
}

// ==================== FIRESTORE EMPLOYEES ROSTER PERSISTENCE ====================

export async function fetchEmployeesFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'employees'));
    if (!snap.empty) {
      const records: any[] = [];
      snap.forEach(docSnap => records.push(docSnap.data()));
      return records;
    }
  } catch (err) {
    console.warn('fetchEmployeesFromFirestore note:', err);
  }
  return [];
}

export async function saveSingleEmployeeToFirestore(employee: any): Promise<void> {
  try {
    const docId = employee.id || employee.employeeCode || `emp-${Date.now()}`;
    await setDoc(doc(db, 'employees', docId), employee, { merge: true });
  } catch (err) {
    console.warn('saveSingleEmployeeToFirestore note:', err);
  }
}

export async function saveBatchEmployeesToFirestore(employeesList: any[]): Promise<void> {
  if (!Array.isArray(employeesList) || employeesList.length === 0) return;
  try {
    for (const emp of employeesList) {
      const docId = emp.id || emp.employeeCode || `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'employees', docId), emp, { merge: true });
    }
  } catch (err) {
    console.warn('saveBatchEmployeesToFirestore note:', err);
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (err) {
    console.warn('deleteEmployeeFromFirestore note:', err);
  }
}

export { app };
