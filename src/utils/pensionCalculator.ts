import { 
  PensionCaseRecord, 
  PensionCalculationResult, 
  PensionRetirementType, 
  PensionDocumentsChecklist,
  PensionLetterFormatType,
  OfficeConfig
} from '../types';

// KCSR Commutation Table: Commutation Factor based on Age Next Birthday (Karnataka Civil Services Rules)
export const KCSR_COMMUTATION_FACTORS: Record<number, number> = {
  50: 9.011,
  51: 8.948,
  52: 8.881,
  53: 8.816,
  54: 8.749,
  55: 8.678,
  56: 8.608,
  57: 8.531,
  58: 8.446,
  59: 8.371,
  60: 8.280,
  61: 8.194, // Standard for superannuation retirement at 60 (Age next birthday = 61)
  62: 8.093,
  63: 7.982,
  64: 7.862,
  65: 7.731,
  66: 7.591,
  67: 7.431,
  68: 7.262,
  69: 7.083,
  70: 6.897,
};

export const DEFAULT_COMMUTATION_FACTOR = 8.194; // For age 61
export const MIN_PENSION_KARNATAKA = 13500; // 7th Pay Commission Karnataka minimum pension
export const MAX_PENSION_KARNATAKA = 75300; // 50% of maximum pay ₹1,50,600
export const MAX_DCRG_CEILING = 2000000; // ₹20 Lakhs maximum gratuity cap
export const DEFAULT_DA_PERCENTAGE = 42.5; // Karnataka DA %
export const FIXED_MEDICAL_ALLOWANCE = 500; // ₹500/month

export interface PensionInputData {
  doa: string; // Date of Appointment (YYYY-MM-DD)
  dor: string; // Date of Retirement (YYYY-MM-DD)
  dob?: string;
  retirementAgeYears?: 60 | 65; // 60 for state govt/school, 65 for UGC/special cadres
  nonQualifyingDays?: number;
  lastBasicPay: number;
  daPercentage?: number;
  averageEmoluments?: number;
  earnedLeaveDays?: number;
  halfPayLeaveDays?: number;
  commutationOpted?: boolean;
  commutationPercentage?: number;
  ageNextBirthday?: number;
}

/**
 * Calculates official Karnataka Government retirement date and verifies 60 vs 65 years.
 * KCSR Rule 95 / standard Karnataka practice:
 * - If employee is born on the 1st day of a month, they retire on the afternoon of the last day of the PRECEDING month.
 * - If employee is born between the 2nd and last day of a month, they retire on the afternoon of the last day of THAT MONTH.
 * - Standard retirement age: 60 years (School Education / State Civil Services).
 * - UGC / University / Collegiate / Medical specialists: 65 years.
 */
export function calculateRetirementDate(dobStr: string, retirementAge: 60 | 65 = 60) {
  if (!dobStr) {
    return {
      dor: '',
      retirementAge,
      ageNextBirthday: retirementAge === 65 ? 66 : 61,
      ruleSummary: 'ದಯವಿಟ್ಟು ಜನ್ಮ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಿ',
      isFirstOfMonth: false
    };
  }

  const parts = dobStr.split('-');
  if (parts.length < 3) {
    return {
      dor: '',
      retirementAge,
      ageNextBirthday: retirementAge === 65 ? 66 : 61,
      ruleSummary: 'ಅಮಾನ್ಯ ದಿನಾಂಕ ರೂಪ',
      isFirstOfMonth: false
    };
  }

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed (0=Jan, 11=Dec)
  const birthDay = parseInt(parts[2], 10);

  const retYear = birthYear + retirementAge;
  let targetMonth = birthMonth;
  let targetYear = retYear;
  const isFirstOfMonth = birthDay === 1;

  if (isFirstOfMonth) {
    targetMonth = birthMonth - 1;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    }
  }

  // Get last calendar day of target month
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const mStr = String(targetMonth + 1).padStart(2, '0');
  const dStr = String(lastDay).padStart(2, '0');
  const dor = `${targetYear}-${mStr}-${dStr}`;

  const ageNextBirthday = retirementAge === 65 ? 66 : 61;
  const ruleSummary = isFirstOfMonth
    ? `೧ನೇ ತಾರೀಖು ಜನ್ಮದಿನವಾಗಿರುವುದರಿಂದ ಹಿಂದಿನ ಮಾಹೆಯ ಕೊನೆಯ ದಿನಾಂಕದಂದು ವಯೋನಿವೃತ್ತಿ (${retirementAge} ವರ್ಷಗಳು)`
    : `${targetMonth + 1}ನೇ ಮಾಹೆಯ ಅಂತ್ಯಕ್ಕೆ ವಯೋನಿವೃತ್ತಿ (${retirementAge} ವರ್ಷಗಳು)`;

  return {
    dor,
    retirementAge,
    ageNextBirthday,
    ruleSummary,
    isFirstOfMonth
  };
}

/**
 * Calculates service duration in years, months, and days between two dates.
 */
export function calculateServicePeriod(startDateStr: string, endDateStr: string, deductionDays: number = 0) {
  if (!startDateStr || !endDateStr) {
    return {
      grossYears: 0,
      grossMonths: 0,
      grossDays: 0,
      netYears: 0,
      netMonths: 0,
      netDays: 0,
      completedHalfYears: 0
    };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return {
      grossYears: 0,
      grossMonths: 0,
      grossDays: 0,
      netYears: 0,
      netMonths: 0,
      netDays: 0,
      completedHalfYears: 0
    };
  }

  // Calculate gross calendar difference
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate() + 1; // Inclusive of both dates

  if (d < 0) {
    m -= 1;
    // Days in previous month
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    d += prevMonthLastDay;
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }

  const grossYears = Math.max(0, y);
  const grossMonths = Math.max(0, m);
  const grossDays = Math.max(0, d);

  // Total gross days approximation
  const totalGrossDays = grossYears * 365 + grossMonths * 30 + grossDays;
  const netTotalDays = Math.max(0, totalGrossDays - deductionDays);

  const netYears = Math.floor(netTotalDays / 365);
  const remainingDaysAfterYears = netTotalDays % 365;
  const netMonths = Math.floor(remainingDaysAfterYears / 30);
  const netDays = remainingDaysAfterYears % 30;

  // KCSR Rule 287: Qualifying service is calculated in completed six-monthly periods.
  // A fraction of 3 months or more is rounded up to a completed six-month period.
  let halfYears = netYears * 2;
  if (netMonths >= 9) {
    halfYears += 2; // 9 months or more gives 2 half years (1 whole year)
  } else if (netMonths >= 3) {
    halfYears += 1; // 3 months to 8 months counts as 1 completed half year
  }

  // Maximum qualifying half years for full pension is 60 (30 years) under 7th Pay Commission
  const cappedHalfYears = Math.min(60, halfYears);

  return {
    grossYears,
    grossMonths,
    grossDays,
    netYears,
    netMonths,
    netDays,
    completedHalfYears: cappedHalfYears,
    rawHalfYears: halfYears
  };
}

/**
 * Computes all KCSR Pension & Terminal Benefits with 4 distinct separate calculations:
 * 1. Monthly Pension (Service Pension & Family Pension)
 * 2. Retirement Gratuity (DCRG)
 * 3. Commutation of Pension
 * 4. Earned Leave (EL) & HPL Encashment
 * Supports 60 or 65 years retirement age verification.
 */
export function computePensionDetails(input: PensionInputData): PensionCalculationResult {
  const {
    doa,
    dor,
    dob,
    retirementAgeYears = 60,
    nonQualifyingDays = 0,
    lastBasicPay,
    daPercentage = DEFAULT_DA_PERCENTAGE,
    earnedLeaveDays = 300,
    halfPayLeaveDays = 0,
    commutationOpted = true,
    commutationPercentage = 40, // Standard Karnataka max 40% (or 33.33%)
    ageNextBirthday
  } = input;

  const service = calculateServicePeriod(doa, dor, nonQualifyingDays);
  const basicPay = Number(lastBasicPay) || 0;
  const daRate = Number(daPercentage) || 0;
  const daAmount = Math.round((basicPay * daRate) / 100);
  const avgEmoluments = input.averageEmoluments ? Number(input.averageEmoluments) : basicPay;

  // Determine age next birthday based on retirement age if not explicitly provided
  const effectiveAgeNextBirthday = ageNextBirthday 
    ? Number(ageNextBirthday) 
    : (retirementAgeYears === 65 ? 66 : 61);

  // ---------------------------------------------------------------------------
  // 1. PENSION CALCULATION (೧. ಮಾಸಿಕ ಪಿಂಚಣಿ ಲೆಕ್ಕಾಚಾರ)
  // ---------------------------------------------------------------------------
  // Full Pension (50% of Basic Pay / Emoluments)
  const fullPension = Math.round(avgEmoluments / 2);

  // Proportionate Pension based on qualifying six-monthly periods (max 60)
  // Under KCSR, 10 years (20 half years) is minimum service required for service pension.
  const isEligibleForRegularPension = service.completedHalfYears >= 20;
  const isEligibleForFullPension = service.completedHalfYears >= 60;

  let basicServicePension = 0;
  if (isEligibleForRegularPension) {
    if (isEligibleForFullPension) {
      basicServicePension = fullPension;
    } else {
      basicServicePension = Math.round((fullPension * service.completedHalfYears) / 60);
    }
  } else {
    // Under 10 years: Service Gratuity rather than monthly pension
    basicServicePension = 0;
  }

  // Karnataka Minimum & Maximum Pension Bounds
  if (basicServicePension > 0) {
    basicServicePension = Math.max(MIN_PENSION_KARNATAKA, Math.min(MAX_PENSION_KARNATAKA, basicServicePension));
  }

  // Dearness Relief (DR): As per Karnataka Pension Rules, DR is paid on the FULL Basic Pension, not the reduced pension.
  const dearnessRelief = Math.round((basicServicePension * daRate) / 100);
  const medicalAllowance = 0; // ವೈದ್ಯಕೀಯ ಮೊತ್ತ ಇರುವುದಿಲ್ಲ (No Medical Allowance as requested)

  // Family Pension
  // Normal: 30% of Basic Pay (subject to minimum ₹13,500)
  const familyPensionNormal = Math.max(MIN_PENSION_KARNATAKA, Math.round(basicPay * 0.30));
  // Enhanced: 50% of Basic Pay (payable for 7 years from date of retirement or till age 67)
  const familyPensionEnhanced = Math.round(basicPay * 0.50);

  // ---------------------------------------------------------------------------
  // 2. RETIREMENT GRATUITY / DCRG (೨. ನಿವೃತ್ತಿ ಉಪದಾನ ಲೆಕ್ಕಾಚಾರ)
  // ---------------------------------------------------------------------------
  // Formula: 1/4th of Emoluments (Basic + DA) for each completed six-monthly period of qualifying service (capped at 66 half years)
  // Maximum limit: 16.5 times emoluments or ₹20 Lakhs, whichever is less.
  const monthlyEmolumentsForGratuity = basicPay + daAmount;
  const dcrgQualifyingHalfYears = Math.min(66, service.completedHalfYears);
  const dcrgRaw = Math.round((monthlyEmolumentsForGratuity / 4) * dcrgQualifyingHalfYears);
  const max16HalfTimes = Math.round(monthlyEmolumentsForGratuity * 16.5);
  const dcrgSanctioned = Math.min(dcrgRaw, max16HalfTimes, MAX_DCRG_CEILING);

  // ---------------------------------------------------------------------------
  // 3. COMMUTATION OF PENSION (೩. ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಲೆಕ್ಕಾಚಾರ)
  // ---------------------------------------------------------------------------
  let commutedPortion = 0;
  let commutationLumpSum = 0;
  const factor = KCSR_COMMUTATION_FACTORS[effectiveAgeNextBirthday] || 
    (retirementAgeYears === 65 ? 7.591 : DEFAULT_COMMUTATION_FACTOR);

  if (commutationOpted && basicServicePension > 0) {
    const commPct = Math.min(40, Math.max(0, Number(commutationPercentage) || 0));
    commutedPortion = Math.round((basicServicePension * commPct) / 100);
    commutationLumpSum = Math.round(commutedPortion * 12 * factor);
  }

  const reducedMonthlyPension = Math.max(0, basicServicePension - commutedPortion);
  const totalMonthlyReceivable = reducedMonthlyPension + dearnessRelief + medicalAllowance;

  // ---------------------------------------------------------------------------
  // 4. EARNED LEAVE (EL) & HPL ENCASHMENT (೪. ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಲೆಕ್ಕಾಚಾರ)
  // ---------------------------------------------------------------------------
  // Formula: ((Basic Pay + DA) / 30) * EL days (up to 300 days)
  // If EL < 300 days, HPL can be encashed to fill shortfall up to combined 300 days limit
  const elDays = Math.min(300, Math.max(0, Number(earnedLeaveDays) || 0));
  const elDailyRate = (basicPay + daAmount) / 30;
  const leaveEncashmentAmount = Math.round(elDailyRate * elDays);

  const rawHplDays = Math.max(0, Number(halfPayLeaveDays) || 0);
  const hplEligibleDays = Math.min(rawHplDays, Math.max(0, 300 - elDays));
  const halfPayEncashmentAmount = hplEligibleDays > 0 
    ? Math.round((elDailyRate * (hplEligibleDays / 2))) 
    : 0;

  const totalLeaveEncashmentSanctioned = leaveEncashmentAmount + halfPayEncashmentAmount;

  // ---------------------------------------------------------------------------
  // GRAND TOTAL TERMINAL LUMP SUM BENEFITS (ಒಟ್ಟು ಅಂತಿಮ ನಿವೃತ್ತಿ ಗಂಟುಮೊತ್ತ)
  // = Retirement Gratuity + Commutation Lump Sum + EL Encashment
  // ---------------------------------------------------------------------------
  const totalTerminalLumpSum = dcrgSanctioned + commutationLumpSum + totalLeaveEncashmentSanctioned;

  return {
    grossYears: service.grossYears,
    grossMonths: service.grossMonths,
    grossDays: service.grossDays,
    nonQualifyingDays: deductionDaysSafe(nonQualifyingDays),
    netQualifyingYears: service.netYears,
    netQualifyingMonths: service.netMonths,
    netQualifyingDays: service.netDays,
    qualifyingHalfYears: service.completedHalfYears,
    isEligibleForFullPension,
    isEligibleForRegularPension,
    retirementAgeYears,

    lastBasicPay: basicPay,
    daPercentage: daRate,
    daAmount,
    averageEmoluments: avgEmoluments,

    // 1. Pension
    fullPension,
    basicServicePension,
    commutedPortion,
    reducedMonthlyPension,
    dearnessRelief,
    medicalAllowance,
    totalMonthlyReceivable,

    // 3. Commutation
    commutationFactor: factor,
    commutationLumpSum,
    commutationRestorationYears: 15,

    // 2. Gratuity (DCRG)
    dcrgRaw,
    dcrgSanctioned,

    // Family Pension
    familyPensionNormal,
    familyPensionEnhanced,

    // 4. Leave Encashment
    earnedLeaveDays: elDays,
    leaveEncashmentAmount,
    halfPayLeaveDays: rawHplDays,
    halfPayEncashmentAmount,
    totalLeaveEncashmentSanctioned,

    // Grand Total Terminal Lump Sum
    totalTerminalLumpSum
  };
}

function deductionDaysSafe(val?: number): number {
  return typeof val === 'number' && !isNaN(val) ? Math.max(0, val) : 0;
}

// Format currency Indian Rupees (₹)
export function formatINR(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

// Convert numbers to Kannada words for Sanctions
export function numberToKannadaWords(num: number): string {
  if (!num || isNaN(num)) return 'ಶೂನ್ಯ ರೂಪಾಯಿಗಳು ಮಾತ್ರ';
  return `${Math.round(num).toLocaleString('en-IN')} (ರೂಪಾಯಿಗಳು ಮಾತ್ರ)`;
}

// Default Office Signatory Settings for BEO Bhadravathi
export const DEFAULT_PENSION_OFFICE_CONFIG: OfficeConfig = {
  governmentName: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
  departmentName: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ',
  officeName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
  officeAddress: 'ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಭದ್ರಾವತಿ - ೫೭೭೩೦೧, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ',
  officerName: 'ಟಿ. ಸೋಮಶೇಖರ್, ಕೆ.ಇ.ಎಸ್.',
  officerDesignation: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು',
  district: 'ಶಿವಮೊಗ್ಗ',
  pincode: '577301',
  email: 'beo.bhadravathi@karnataka.gov.in',
  phone: '08282-266144',
  orderPrefix: 'ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಪಿಂಚಣಿ',
};

// =========================================================================
// OFFICIAL KARNATAKA GOVERNMENT PENSION FORM & LETTER TEMPLATES (HTML ENGINE)
// =========================================================================

/**
 * 1. FORM 7 (ಪ್ರಪತ್ರ ೭ - Form for Assessing Pension and Gratuity)
 */
export function generateForm7Html(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  return `
  <div class="karnataka-govt-document form-7-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-3 border-b-2 border-stone-800">
      <div class="font-bold text-sm tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-base mt-0.5 text-stone-950">ನಮೂನೆ - ೭ / FORM 7</div>
      <div class="text-xs text-stone-700 italic font-sans font-semibold mt-0.5">
        (See Rules 327, 328, 335 & 340 of Karnataka Civil Services Rules)
      </div>
      <div class="text-xs font-bold text-stone-800 mt-1">
        ಪಿಂಚಣಿ ಮತ್ತು ನಿವೃತ್ತಿ ಉಪದಾನ ಮಂಜೂರಾತಿ ಪ್ರಸ್ತಾವನಾ ವಿವರ ಪಟ್ಟಿ (Form for Assessing Pension and Gratuity)
      </div>
      <div class="text-xs mt-0.5 font-medium">ಕಚೇರಿ: ${office.officeName}, ${office.district} ಜಿಲ್ಲೆ</div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs bg-stone-50 p-2 border border-stone-300 rounded font-mono-code">
      <div><strong>ಕಡತ ಸಂಖ್ಯೆ:</strong> ${record.fileNumber}</div>
      <div><strong>ಪ್ರಕರಣ ಸಂಖ್ಯೆ:</strong> ${record.caseNumber}</div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <!-- PART I: STATEMENT OF SERVICE -->
    <div class="mt-4">
      <div class="bg-stone-800 text-white px-2 py-1 font-bold text-xs">
        ಭಾಗ - ೧ : ನೌಕರರ ಸೇವಾ ವಿವರಗಳು (PART I - STATEMENT OF SERVICE)
      </div>
      <table class="w-full border-collapse border border-stone-400 mt-1 text-xs">
        <tbody>
          <tr>
            <td class="border border-stone-400 p-1.5 w-10 text-center font-bold">೧</td>
            <td class="border border-stone-400 p-1.5 w-1/2">ನಿವೃತ್ತ ನೌಕರರ ಪೂರ್ಣ ಹೆಸರು (ದೊಡ್ಡಕ್ಷರಗಳಲ್ಲಿ)</td>
            <td class="border border-stone-400 p-1.5 font-bold">${record.employeeName}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೨</td>
            <td class="border border-stone-400 p-1.5">ತಂದೆ / ಗಂಡನ ಹೆಸರು</td>
            <td class="border border-stone-400 p-1.5">${record.parentOrSpouseName || 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ'}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೩</td>
            <td class="border border-stone-400 p-1.5">ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ (KGID Number)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${record.kgidNumber}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೪</td>
            <td class="border border-stone-400 p-1.5">ಹುದ್ದೆ ಮತ್ತು ವರ್ಗ (Designation & Cadre)</td>
            <td class="border border-stone-400 p-1.5">${record.designation} (${record.cadreGroup})</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೫</td>
            <td class="border border-stone-400 p-1.5">ಕೊನೆಯದಾಗಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸಿದ ಶಾಲೆ / ಕಛೇರಿ</td>
            <td class="border border-stone-400 p-1.5">${record.officeOrSchool}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೬</td>
            <td class="border border-stone-400 p-1.5">ಜನ್ಮ ದಿನಾಂಕ (Date of Birth)</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">${record.dob}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೭</td>
            <td class="border border-stone-400 p-1.5">ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ (Date of Appointment)</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">${record.doa}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೮</td>
            <td class="border border-stone-400 p-1.5">ನಿವೃತ್ತಿ ಹೊಂದಿದ ದಿನಾಂಕ & ಪ್ರಕಾರ (Date of Retirement)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${record.dor} (${record.retirementType})</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೯</td>
            <td class="border border-stone-400 p-1.5">ಒಟ್ಟು ಸೇವಾ ಅವಧಿ (Gross Total Service)</td>
            <td class="border border-stone-400 p-1.5 font-bold">${calc.grossYears} ವರ್ಷ, ${calc.grossMonths} ತಿಂಗಳು, ${calc.grossDays} ದಿನಗಳು</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೦</td>
            <td class="border border-stone-400 p-1.5">ಅನರ್ಹತಾ ಸೇವೆ (Non-qualifying service / EOL)</td>
            <td class="border border-stone-400 p-1.5">${calc.nonQualifyingDays} ದಿನಗಳು</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೧</td>
            <td class="border border-stone-400 p-1.5 bg-amber-50">ನಿವ್ವಳ ಅರ್ಹತಾ ಸೇವೆ (Net Qualifying Service)</td>
            <td class="border border-stone-400 p-1.5 font-bold bg-amber-50 text-emerald-900">
              ${calc.netQualifyingYears} ವರ್ಷ, ${calc.netQualifyingMonths} ತಿಂಗಳು, ${calc.netQualifyingDays} ದಿನಗಳು (${calc.qualifyingHalfYears} ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು)
            </td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೨</td>
            <td class="border border-stone-400 p-1.5">ಕೊನೆಯ ವೇತನ ಶ್ರೇಣಿ (Pay Scale)</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">${record.payScale}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೩</td>
            <td class="border border-stone-400 p-1.5">ಕೊನೆಯ ಮೂಲ ವೇತನ (Last Basic Pay)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.lastBasicPay)}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೪</td>
            <td class="border border-stone-400 p-1.5">ತುಟ್ಟಿಭತ್ಯೆ ದರ & ಮೊತ್ತ (DA Rate @ ${calc.daPercentage}%)</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">${formatINR(calc.daAmount)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PART II: PENSION & GRATUITY SANCTION -->
    <div class="mt-4">
      <div class="bg-stone-800 text-white px-2 py-1 font-bold text-xs">
        ಭಾಗ - ೨ : ಪಿಂಚಣಿ ಮತ್ತು ಉಪದಾನದ ಲೆಕ್ಕಾಚಾರ & ಮಂಜೂರಾತಿ (PART II - ASSESSMENT OF PENSION & GRATUITY)
      </div>
      <table class="w-full border-collapse border border-stone-400 mt-1 text-xs">
        <tbody>
          <tr>
            <td class="border border-stone-400 p-1.5 w-10 text-center font-bold">೧೫</td>
            <td class="border border-stone-400 p-1.5 w-1/2">ಪೂರ್ಣ ಅರ್ಹತಾ ಪಿಂಚಣಿ (50% of Basic Pay)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.fullPension)}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೬</td>
            <td class="border border-stone-400 p-1.5 bg-emerald-50">ಮಂಜೂರಾದ ಮೂಲ ಮಾಸಿಕ ಪಿಂಚಣಿ (Basic Service Pension)</td>
            <td class="border border-stone-400 p-1.5 font-bold bg-emerald-50 text-emerald-950 font-mono-code text-sm">
              ${formatINR(calc.basicServicePension)} / ಪ್ರತಿ ಮಾಹೆ
            </td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೭</td>
            <td class="border border-stone-400 p-1.5">ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ (Commutation @ ${record.commutationPercentage}%)</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">
              ಪರಿವರ್ತಿತ ಭಾಗ: ${formatINR(calc.commutedPortion)} | ಒಟ್ಟು ಗಂಟು ಮೊತ್ತ: <strong>${formatINR(calc.commutationLumpSum)}</strong>
              <div class="text-[10px] text-stone-600 mt-0.5">(ಪರಿವರ್ತನಾ ಅಪವರ್ತನ: ${calc.commutationFactor} - ವಯಸ್ಸು: ${record.ageNextBirthday})</div>
            </td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೮</td>
            <td class="border border-stone-400 p-1.5">ಪರಿವರ್ತನೆಯ ನಂತರದ ನಿವ್ವಳ ಮಾಸಿಕ ಪಿಂಚಣಿ (Reduced Pension)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.reducedMonthlyPension)} / ತಿಂಗಳಿಗೆ</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧೯</td>
            <td class="border border-stone-400 p-1.5 bg-blue-50">ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG Sanctioned)</td>
            <td class="border border-stone-400 p-1.5 font-bold bg-blue-50 text-blue-950 font-mono-code text-sm">
              ${formatINR(calc.dcrgSanctioned)}
              <div class="text-[10px] text-stone-600 font-normal">(${numberToKannadaWords(calc.dcrgSanctioned)})</div>
            </td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೨೦</td>
            <td class="border border-stone-400 p-1.5">ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ (${calc.earnedLeaveDays} ದಿನಗಳ ಶಿಲ್ಕು)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.leaveEncashmentAmount)}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೨೧</td>
            <td class="border border-stone-400 p-1.5">ಕುಟುಂಬ ಪಿಂಚಣಿ (Family Pension Details)</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">
              ಸಾಮಾನ್ಯ ದರ (30%): <strong>${formatINR(calc.familyPensionNormal)}</strong> | ಹೆಚ್ಚುವರಿ ದರ (50%): <strong>${formatINR(calc.familyPensionEnhanced)}</strong>
              <div class="text-[10px] text-stone-600">ನಾಮನಿರ್ದೇಶಿತರು: ${record.nomineeName} (${record.nomineeRelation})</div>
            </td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೨೨</td>
            <td class="border border-stone-400 p-1.5">ಪಿಂಚಣಿ ಪಾವತಿ ಬ್ಯಾಂಕ್ ವಿವರಗಳು</td>
            <td class="border border-stone-400 p-1.5 text-xs">
              ಬ್ಯಾಂಕ್: <strong>${record.bankName}</strong>, ಶಾಖೆ: ${record.bankBranch}<br/>
              ಖಾತೆ ಸಂ: <span class="font-mono-code font-bold">${record.bankAccountNo}</span> | IFSC: <span class="font-mono-code">${record.ifscCode}</span><br/>
              ಖಜಾನೆ: ${record.treasuryName}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CERTIFICATION & SANCTION ORDER ENFACEMENT -->
    <div class="mt-4 p-3 border border-stone-400 bg-stone-50 text-xs">
      <div class="font-bold underline mb-1">ನೇಮಕಾತಿ ಪ್ರಾಧಿಕಾರದ ಮಂಜೂರಾತಿ ಆದೇಶ (SANCTION ORDER):</div>
      <p class="text-justify text-[11px] leading-relaxed">
        ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳ (KCSR) ಅನ್ವಯ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ${record.designation} ಇವರಿಗೆ ಮೇಲೆ ಲೆಕ್ಕಹಾಕಲಾದ
        ಮಾಸಿಕ ಮೂಲ ಪಿಂಚಣಿ <strong>${formatINR(calc.basicServicePension)}</strong>, ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಗಂಟು ಮೊತ್ತ <strong>${formatINR(calc.commutationLumpSum)}</strong>,
        ಮತ್ತು ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG) <strong>${formatINR(calc.dcrgSanctioned)}</strong> ಗಳನ್ನು ಮಂಜೂರು ಮಾಡಿ ಆದೇಶಿಸಲಾಗಿದೆ.
        ಸೇವಾ ಪುಸ್ತಕವನ್ನು ಕೂಲಂಕಷವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಸರ್ಕಾರಕ್ಕೆ ಯಾವುದೇ ಬಾಕಿ ಇರುವುದಿಲ್ಲವೆಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ.
      </p>

      <div class="mt-8 flex justify-between items-end">
        <div class="text-[10px] text-stone-600">
          ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}<br/>
          ಸ್ಥಳ: ಭದ್ರಾವತಿ
        </div>
        <div class="text-center">
          <div class="font-bold text-xs">${office.officerName}</div>
          <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
          <div class="text-[10px] text-stone-600">${office.officeName}</div>
          <div class="text-[9px] text-stone-500 font-mono-code">[ಅಧಿಕೃತ ಮೊಹರು & ಸಹಿ]</div>
        </div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 2. FORM 1 & 2 (ಪಿಂಚಣಿ ಅರ್ಜಿ ಮತ್ತು ಕುಟುಂಬ ವಿವರ / ನಾಮನಿರ್ದೇಶನ)
 */
export function generateForm1And2Html(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  return `
  <div class="karnataka-govt-document form-1-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ / GOVERNMENT OF KARNATAKA</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">ನಮೂನೆ - ೧ ಮತ್ತು ೨ (FORM 1 & FORM 2)</div>
      <div class="text-[11px] text-stone-700 font-sans font-semibold">
        [See Rules 327(1) & 330 of KCSR - Karnataka Civil Services Rules]
      </div>
      <div class="text-xs font-bold text-stone-800 mt-0.5">
        ಪಿಂಚಣಿ, ಉಪದಾನ ಮಂಜೂರಾತಿಗಾಗಿ ನೌಕರರ ಅರ್ಜಿ, ಮಾದರಿ ಸಹಿ ಹಾಗೂ ಕುಟುಂಬ ವಿವರಗಳ ನಾಮನಿರ್ದೇಶನ
      </div>
    </div>

    <div class="mt-4 text-xs">
      <div><strong>ಇವರಿಗೆ:</strong></div>
      <div class="ml-4 text-stone-800">
        ${office.officerDesignation},<br/>
        ${office.officeName}, ${office.district}
      </div>
    </div>

    <div class="mt-3 text-xs">
      <div><strong>ಇವರಿಂದ:</strong></div>
      <div class="ml-4 font-bold text-stone-900">
        ${record.employeeName}, ${record.designation},<br/>
        ${record.officeOrSchool}, KGID: ${record.kgidNumber}
      </div>
    </div>

    <div class="mt-3 p-2 bg-stone-100 border border-stone-300 font-bold text-xs text-center">
      ವಿಷಯ: ವಯೋನಿವೃತ್ತಿ / ನಿವೃತ್ತಿ ಪಿಂಚಣಿ, ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG) ಮತ್ತು ಪರಿವರ್ತನೆ ಮಂಜೂರಾತಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಬಗ್ಗೆ.
    </div>

    <p class="mt-3 text-justify text-[11px] leading-relaxed">
      ಮಾನ್ಯರೇ,<br/>
      ನಾನು ದಿನಾಂಕ <strong>${record.dor}</strong> ರಂದು ಸೇವೆಯಿಂದ ವಯೋನಿವೃತ್ತಿ / ನಿವೃತ್ತಿ ಹೊಂದುತ್ತಿದ್ದು, ನನಗೆ ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳಂತೆ
      ಅರ್ಹವಾದ ಪಿಂಚಣಿ, ಉಪದಾನ ಹಾಗೂ ಪಿಂಚಣಿ ಪರಿವರ್ತನೆಯನ್ನು ಮಂಜೂರು ಮಾಡಲು ಕೋರುತ್ತೇನೆ. ನನ್ನ ಸೇವಾ ವಿವರಗಳು ಹಾಗೂ ಕುಟುಂಬ ನಾಮನಿರ್ದೇಶನದ ವಿವರಗಳನ್ನು ಕೆಳಕಂಡಂತೆ ಸಲ್ಲಿಸುತ್ತಿದ್ದೇನೆ:
    </p>

    <div class="mt-3">
      <div class="font-bold text-xs text-stone-950 mb-1">೧. ನೌಕರರ ವೈಯಕ್ತಿಕ ವಿವರಗಳು:</div>
      <table class="w-full border-collapse border border-stone-400 text-xs">
        <tr>
          <td class="border border-stone-400 p-1.5 w-1/3 bg-stone-50">ಪೂರ್ಣ ಹೆಸರು</td>
          <td class="border border-stone-400 p-1.5 font-bold">${record.employeeName}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಹುದ್ದೆ & ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${record.designation} | KGID: ${record.kgidNumber}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಜನ್ಮ ದಿನಾಂಕ & ನೇಮಕಾತಿ ದಿನಾಂಕ</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${record.dob} | ನೇಮಕಾತಿ: ${record.doa}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ನಿವೃತ್ತಿ ದಿನಾಂಕ</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${record.dor}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಪಿಂಚಣಿ ಜಮೆ ಮಾಡುವ ಬ್ಯಾಂಕ್ ಖಾತೆ</td>
          <td class="border border-stone-400 p-1.5 font-mono-code font-bold">
            ${record.bankName}, ${record.bankBranch} | ಖಾತೆ: ${record.bankAccountNo} (IFSC: ${record.ifscCode})
          </td>
        </tr>
      </table>
    </div>

    <!-- FAMILY DETAILS TABLE -->
    <div class="mt-4">
      <div class="font-bold text-xs text-stone-950 mb-1">೨. ಕುಟುಂಬ ಸದಸ್ಯರ ವಿವರ & ನಾಮನಿರ್ದೇಶನ (Family Nomination Details):</div>
      <table class="w-full border-collapse border border-stone-400 text-xs text-center">
        <thead>
          <tr class="bg-stone-200">
            <th class="border border-stone-400 p-1.5 w-10">ಕ್ರ.ಸಂ</th>
            <th class="border border-stone-400 p-1.5">ಕುಟುಂಬ ಸದಸ್ಯರ ಹೆಸರು</th>
            <th class="border border-stone-400 p-1.5">ಸಂಬಂಧ</th>
            <th class="border border-stone-400 p-1.5">ಜನ್ಮ ದಿನಾಂಕ</th>
            <th class="border border-stone-400 p-1.5">ಹಂಚಿಕೆ ಶೇಕಡಾ %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-stone-400 p-1.5 font-bold">೧</td>
            <td class="border border-stone-400 p-1.5 font-bold text-left pl-3">${record.nomineeName}</td>
            <td class="border border-stone-400 p-1.5">${record.nomineeRelation}</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">${record.nomineeDob || 'ಲಭ್ಯವಿಲ್ಲ'}</td>
            <td class="border border-stone-400 p-1.5 font-bold">100%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SPECIMEN SIGNATURE & THUMB IMPRESSION BOX -->
    <div class="mt-4 border border-stone-400 p-2">
      <div class="font-bold text-xs mb-2">೩. ಮಾದರಿ ಸಹಿ ಹಾಗೂ ಹೆಬ್ಬೆರಳ ಗುರುತು (Specimen Signatures & Thumb Impression):</div>
      <div class="grid grid-cols-4 gap-2 text-center text-[10px]">
        <div class="h-16 border border-dashed border-stone-400 flex flex-col justify-end pb-1 bg-stone-50">
          <span>ಮಾದರಿ ಸಹಿ - ೧</span>
        </div>
        <div class="h-16 border border-dashed border-stone-400 flex flex-col justify-end pb-1 bg-stone-50">
          <span>ಮಾದರಿ ಸಹಿ - ೨</span>
        </div>
        <div class="h-16 border border-dashed border-stone-400 flex flex-col justify-end pb-1 bg-stone-50">
          <span>ಮಾದರಿ ಸಹಿ - ೩</span>
        </div>
        <div class="h-16 border border-dashed border-stone-400 flex flex-col justify-end pb-1 bg-stone-50">
          <span>ಎಡಗೈ ಹೆಬ್ಬೆರಳ ಗುರುತು</span>
        </div>
      </div>
    </div>

    <!-- DECLARATION -->
    <div class="mt-4 p-2 bg-stone-50 border border-stone-300 text-[10px] leading-relaxed">
      <strong>ಘೋಷಣೆ:</strong> ಮೇಲೆ ನಮೂದಿಸಿದ ವಿವರಗಳು ನನ್ನ ಸಂಪೂರ್ಣ ತಿಳುವಳಿಕೆಯಂತೆ ಸತ್ಯ ಮತ್ತು ಸರಿಯಾಗಿವೆ. ಸರ್ಕಾರಕ್ಕೆ ಯಾವುದೇ ಹಣ ಸಂದಾಯವಾಗಬೇಕಿದ್ದಲ್ಲಿ
      ನನ್ನ ಪಿಂಚಣಿ ಅಥವಾ ಉಪದಾನದಿಂದ ಕಟಾವಣೆ ಮಾಡಿಕೊಳ್ಳಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.
    </div>

    <div class="mt-6 flex justify-between items-end">
      <div class="text-xs">
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}<br/>
        ಸ್ಥಳ: ಭದ್ರಾವತಿ
      </div>
      <div class="text-center">
        <div class="h-8"></div>
        <div class="font-bold text-xs">(${record.employeeName})</div>
        <div class="text-[11px] text-stone-700">ಅರ್ಜಿದಾರರು / ನಿವೃತ್ತ ನೌಕರರು</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 3. FORM 6 (ಸೇವಾ ಪರಿಶೀಲನಾ ಹಾಗೂ ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ - Service Verification & Non-liability Certificate)
 */
export function generateForm6Html(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  return `
  <div class="karnataka-govt-document form-6-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">ನಮೂನೆ - ೬ / FORM 6</div>
      <div class="text-[11px] text-stone-700 font-sans font-semibold">
        [See Rule 328 of Karnataka Civil Services Rules (KCSR)]
      </div>
      <div class="text-xs font-bold text-stone-800 mt-0.5">
        ಸೇವಾ ಪರಿಶೀಲನಾ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ನಿರಪೇಕ್ಷಣಾ ಪ್ರಮಾಣ ಪತ್ರ (Service Verification & Non-Liability Certificate)
      </div>
      <div class="text-xs mt-0.5 font-medium">${office.officeName}</div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs bg-stone-50 p-2 border border-stone-300 rounded font-mono-code">
      <div><strong>ಸಂಖ್ಯೆ:</strong> ${office.orderPrefix}/${record.kgidNumber}/ನಮೂನೆ-೬/2026-27</div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="text-center my-3 p-1.5 bg-stone-200 border border-stone-400 font-bold text-xs">
      ಸೇವಾ ಪರಿಶೀಲನಾ ಪ್ರಮಾಣಪತ್ರ (SERVICE VERIFICATION CERTIFICATE)
    </div>

    <p class="text-justify text-xs leading-relaxed">
      ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ಹುದ್ದೆ: <strong>${record.designation}</strong>,
      ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ: <strong>${record.kgidNumber}</strong>, ಇವರು ದಿನಾಂಕ <strong>${record.doa}</strong> ರಿಂದ
      ದಿನಾಂಕ <strong>${record.dor}</strong> ರವರೆಗೆ ಸಲ್ಲಿಸಿದ ಸೇವಾ ಅವಧಿಯನ್ನು ಇವರ ಮೂಲ ಸೇವಾ ಪುಸ್ತಕ (Service Register - Volume I & II) ದಲ್ಲಿ
      ನಮೂದಾಗಿರುವ ವೇತನ ಬಟವಾಡೆ ಪಟ್ಟಿಗಳು, ಆಡಿಟ್ ಪರಿಶೀಲನೆ ಹಾಗೂ ಸೇವಾ ದೃಢೀಕರಣ ನಮೂದುಗಳೊಂದಿಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.
    </p>

    <div class="mt-3">
      <table class="w-full border-collapse border border-stone-400 text-xs">
        <tr class="bg-stone-100">
          <th class="border border-stone-400 p-1.5 w-1/3 text-left">ವಿವರಗಳು</th>
          <th class="border border-stone-400 p-1.5 text-left">ಅವಧಿ / ಮೊತ್ತ</th>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5">ಒಟ್ಟು ಸೇವೆ (Gross Service)</td>
          <td class="border border-stone-400 p-1.5 font-bold">${calc.grossYears} ವರ್ಷಗಳು, ${calc.grossMonths} ತಿಂಗಳುಗಳು, ${calc.grossDays} ದಿನಗಳು</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5">ಅನರ್ಹತಾ ಸೇವೆ (EOL / Dies-non / Suspension)</td>
          <td class="border border-stone-400 p-1.5">${calc.nonQualifyingDays} ದಿನಗಳು (ಯಾವುದೂ ಇಲ್ಲ)</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-amber-50">ಪಿಂಚಣಿಗೆ ಅರ್ಹವಾದ ನಿವ್ವಳ ಸೇವೆ (Qualifying Service)</td>
          <td class="border border-stone-400 p-1.5 font-bold bg-amber-50 text-emerald-900">
            ${calc.netQualifyingYears} ವರ್ಷಗಳು, ${calc.netQualifyingMonths} ತಿಂಗಳುಗಳು, ${calc.netQualifyingDays} ದಿನಗಳು (${calc.qualifyingHalfYears} ಅರ್ಧವಾರ್ಷಿಕಗಳು)
          </td>
        </tr>
      </table>
    </div>

    <div class="text-center my-4 p-1.5 bg-stone-200 border border-stone-400 font-bold text-xs">
      ಬಾಕಿ ರಹಿತ ಹಾಗೂ ಇಲಾಖಾ ವಿಚಾರಣೆ ರಹಿತ ಪ್ರಮಾಣ ಪತ್ರ (NON-LIABILITY & VIGILANCE CLEARANCE)
    </div>

    <div class="space-y-2 text-xs leading-relaxed">
      <div class="flex items-start gap-2">
        <span class="font-bold">೧.</span>
        <span>ಸದರಿ ನೌಕರರ ಮೇಲೆ ಯಾವುದೇ ಇಲಾಖಾ ವಿಚಾರಣೆ (Departmental Inquiry), ಲೋಕಾಯುಕ್ತ ತನಿಖೆ ಅಥವಾ ನ್ಯಾಯಾಲಯ ಪ್ರಕರಣಗಳು ಬಾಕಿ ಇರುವುದಿಲ್ಲವೆಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ.</span>
      </div>
      <div class="flex items-start gap-2">
        <span class="font-bold">೨.</span>
        <span>ಇವರಿಂದ ಇಲಾಖೆಗೆ ಅಥವಾ ಸರ್ಕಾರಕ್ಕೆ ಯಾವುದೇ ಅತಿ ಪಾವತಿ (Overpayment), ಸಾಲ, ಮುಂಗಡ ಅಥವಾ ಜಂಟಿ ಬಾಧ್ಯತೆಗಳು ಬಾಕಿ ಇರುವುದಿಲ್ಲ.</span>
      </div>
      <div class="flex items-start gap-2">
        <span class="font-bold">೩.</span>
        <span>ಶಾಲಾ ದಾಖಲಾತಿಗಳು, ಲೈಬ್ರರಿ ಪುಸ್ತಕಗಳು, ಪರೀಕ್ಷಾ ಸಾಮಗ್ರಿಗಳು ಹಾಗೂ ಕಚೇರಿ ಆಸ್ತಿಗಳನ್ನು ನಿಯಮಾನುಸಾರ ಹಸ್ತಾಂತರಿಸಲಾಗಿದೆ.</span>
      </div>
    </div>

    <div class="mt-10 flex justify-between items-end">
      <div class="text-xs">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
        <div class="text-[9px] text-stone-500 font-mono-code">[ಕಚೇರಿ ಮೊಹರು]</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 4. PENSION SANCTION MEMORANDUM / ORDER (ಜ್ಞಾಪನಾ ಆದೇಶ - BEO Sanction Memorandum)
 */
export function generateSanctionOrderHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  const orderNum = `ಸಂ: ${office.orderPrefix}/${record.kgidNumber}/ಪಿಂಚಣಿ-ಆದೇಶ/2026-27`;
  return `
  <div class="karnataka-govt-document sanction-order-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಾರ್ಯಾಲಯ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ</div>
      <div class="text-xs text-stone-700">ದೂರವಾಣಿ: ${office.phone} | ಇ-ಮೇಲ್: ${office.email}</div>
      <div class="font-bold text-sm text-stone-950 mt-2 underline decoration-2">
        ಪಿಂಚಣಿ ಮತ್ತು ನಿವೃತ್ತಿ ಉಪದಾನ ಮಂಜೂರಾತಿ ಜ್ಞಾಪನಾ ಆದೇಶ
      </div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>${orderNum}</strong></div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <!-- PREAMBLE -->
    <div class="mt-2 text-xs leading-relaxed">
      <div class="font-bold underline mb-1">ಪ್ರಸ್ತಾವನೆ:</div>
      <p class="text-justify text-[11px]">
        ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ${record.designation}, ${record.officeOrSchool}, ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ: <strong>${record.kgidNumber}</strong>
        ಇವರು ದಿನಾಂಕ <strong>${record.dor}</strong> ರಂದು ಸೇವೆಯಿಂದ ವಯೋನಿವೃತ್ತಿ ಹೊಂದುತ್ತಿದ್ದು, ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳಂತೆ (KCSR)
        ತಮಗೆ ಸಲ್ಲಬೇಕಾದ ನಿವೃತ್ತಿ ವೇತನ, ನಿವೃತ್ತಿ ಉಪದಾನ ಮತ್ತು ಪಿಂಚಣಿ ಪರಿವರ್ತನೆಯನ್ನು ಮಂಜೂರು ಮಾಡಲು ಪ್ರಸ್ತಾವನೆಯನ್ನು ಸಲ್ಲಿಸಿರುತ್ತಾರೆ.
      </p>
      <p class="text-justify text-[11px] mt-1">
        ನೌಕರರ ಸೇವಾ ಪುಸ್ತಕವನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಇವರು ದಿನಾಂಕ <strong>${record.doa}</strong> ರಿಂದ ದಿನಾಂಕ <strong>${record.dor}</strong> ರವರೆಗೆ
        ಒಟ್ಟು <strong>${calc.netQualifyingYears} ವರ್ಷ, ${calc.netQualifyingMonths} ತಿಂಗಳು, ${calc.netQualifyingDays} ದಿನಗಳ</strong>
        (${calc.qualifyingHalfYears} ಅರ್ಧವಾರ್ಷಿಕಗಳು) ಅರ್ಹತಾ ಸೇವೆಯನ್ನು ಸಲ್ಲಿಸಿರುತ್ತಾರೆ. ಇವರ ಕೊನೆಯ ಮೂಲ ವೇತನವು ರೂ. <strong>${formatINR(calc.lastBasicPay)}</strong> ಆಗಿರುತ್ತದೆ.
        ಸರ್ಕಾರದ ನಿಯಮಗಳನ್ವಯ ಇವರಿಗೆ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳನ್ನು ಮಂಜೂರು ಮಾಡಲು ಪ್ರಸ್ತಾವನೆಯನ್ನು ಅಂಗೀಕರಿಸಿ ಈ ಕೆಳಗಿನಂತೆ ಆದೇಶಿಸಲಾಗಿದೆ.
      </p>
    </div>

    <!-- OFFICIAL ORDER CLAUSE -->
    <div class="mt-4 p-3 bg-stone-50 border-2 border-stone-800">
      <div class="text-center font-bold text-xs underline mb-2">ಆ ದೇಶ (OFFICIAL ORDER)</div>
      <p class="text-justify text-xs leading-relaxed">
        ಪ್ರಸ್ತಾವನೆಯಲ್ಲಿ ವಿವರಿಸಿರುವ ಅಂಶಗಳ ಹಿನ್ನೆಲೆಯಲ್ಲಿ, ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳು (KCSR) ನಿಯಮ ೨೮೭, ೩೨೭, ೩೪೦ ಹಾಗೂ ಸರ್ಕಾರದ ಆದೇಶಗಳ ಪ್ರಕಾರ,
        ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ${record.designation}, ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂ: <strong>${record.kgidNumber}</strong> ಇವರಿಗೆ
        ದಿನಾಂಕ <strong>${record.dor}</strong> ರಿಂದ ಅನ್ವಯವಾಗುವಂತೆ ಈ ಕೆಳಕಂಡ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳನ್ನು ಷರತ್ತುಗಳಿಗೊಳಪಟ್ಟು ಮಂಜೂರು ಮಾಡಲಾಗಿದೆ:
      </p>

      <div class="mt-3">
        <table class="w-full border-collapse border border-stone-400 text-xs">
          <tr class="bg-stone-200 font-bold">
            <th class="border border-stone-400 p-1.5 w-10 text-center">ಕ್ರ.ಸಂ</th>
            <th class="border border-stone-400 p-1.5 text-left">ನಿವೃತ್ತಿ ಸೌಲಭ್ಯದ ವಿವರ</th>
            <th class="border border-stone-400 p-1.5 text-left">ಮಂಜೂರಾದ ಮೊತ್ತ / ವಿವರ</th>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೧</td>
            <td class="border border-stone-400 p-1.5">ಮೂಲ ಮಾಸಿಕ ಪಿಂಚಣಿ (Basic Monthly Pension)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code text-emerald-900">${formatINR(calc.basicServicePension)} / ಪ್ರತಿ ತಿಂಗಳಿಗೆ</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೨</td>
            <td class="border border-stone-400 p-1.5">ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಗಂಟು ಮೊತ್ತ (Commuted Value of Pension @ ${record.commutationPercentage}%)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.commutationLumpSum)} (ಗಂಟು ಮೊತ್ತ)</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೩</td>
            <td class="border border-stone-400 p-1.5">ಪರಿವರ್ತನೆಯ ನಂತರದ ಮಾಸಿಕ ಪಿಂಚಣಿ (Reduced Pension)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.reducedMonthlyPension)} / ತಿಂಗಳಿಗೆ</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೪</td>
            <td class="border border-stone-400 p-1.5">ನಿವೃತ್ತಿ ಉಪದಾನ (Death-cum-Retirement Gratuity - DCRG)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code text-blue-900">${formatINR(calc.dcrgSanctioned)}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೫</td>
            <td class="border border-stone-400 p-1.5">ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ (${calc.earnedLeaveDays} ದಿನಗಳು)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.leaveEncashmentAmount)}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 text-center font-bold">೬</td>
            <td class="border border-stone-400 p-1.5">ಕುಟುಂಬ ಪಿಂಚಣಿ (Family Pension)</td>
            <td class="border border-stone-400 p-1.5 text-xs">
              ಸಾಮಾನ್ಯ: <strong>${formatINR(calc.familyPensionNormal)}</strong> | ಹೆಚ್ಚುವರಿ: <strong>${formatINR(calc.familyPensionEnhanced)}</strong><br/>
              ನಾಮನಿರ್ದೇಶಿತರು: ${record.nomineeName} (${record.nomineeRelation})
            </td>
          </tr>
        </table>
      </div>

      <div class="mt-3 text-[10px] text-stone-700 space-y-1">
        <div><strong>ಷರತ್ತುಗಳು:</strong></div>
        <div>೧. ಸದರಿ ಮಂಜೂರಾತಿಯು ಮಹಾಲೆಕ್ಕಪಾಲರ ಕಚೇರಿ (A&E), ಬೆಂಗಳೂರು ರವರ ಅಂತಿಮ ಅನುಮೋದನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ.</div>
        <div>೨. ಭವಿಷ್ಯದಲ್ಲಿ ಲೆಕ್ಕ ತನಿಖೆಯಲ್ಲಿ ಯಾವುದೇ ಅತಿಪಾವತಿ ಕಂಡುಬಂದಲ್ಲಿ ನೌಕರರ ಪಿಂಚಣಿಯಿಂದ ಕಟಾವಣೆ ಮಾಡಿಕೊಳ್ಳಲಾಗುವುದು.</div>
        <div>೩. ಪಿಂಚಣಿ ಪರಿವರ್ತನೆಯ ಮೊತ್ತವನ್ನು ೧೫ ವರ್ಷಗಳ ನಂತರ (ದಿನಾಂಕ: 15 ವರ್ಷಗಳ ತರುವಾಯ) ಮೂಲ ಪಿಂಚಣಿಗೆ ಮರುಸ್ಥಾಪಿಸಲಾಗುವುದು.</div>
      </div>
    </div>

    <!-- SIGNATURE & ENDORSEMENTS -->
    <div class="mt-6 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಕಡತ ಸಂಖ್ಯೆ: ${record.fileNumber}<br/>
        ಸ್ಥಳ: ಭದ್ರಾವತಿ
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>

    <div class="mt-4 pt-2 border-t border-stone-300 text-[10px] text-stone-600">
      <div><strong>ಪ್ರತಿಯನ್ನು ಮಾಹಿತಿಗಾಗಿ ಮತ್ತು ಮುಂದಿನ ಕ್ರಮಕ್ಕಾಗಿ ರವಾನಿಸಲಾಗಿದೆ:</strong></div>
      <div>೧. ಪ್ರಧಾನ ಮಹಾಲೆಕ್ಕಪಾಲರು (A&E), ಕರ್ನಾಟಕ, ಬೆಂಗಳೂರು.</div>
      <div>೨. ಜಿಲ್ಲಾ ಖಜಾನಾಧಿಕಾರಿಗಳು / ಉಪ ಖಜಾನಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ.</div>
      <div>೩. ಶ್ರೀ/ಶ್ರೀಮತಿ ${record.employeeName}, ${record.designation}.</div>
      <div>೪. ಕಚೇರಿ ಕಡತಕ್ಕೆ / ಆ2 ಶಾಖಾ ಸಹಾಯಕರಿಗೆ.</div>
    </div>
  </div>
  `;
}

/**
 * 5. PROVISIONAL PENSION & DCRG SANCTION ORDER (KCSR RULE 341)
 */
export function generateProvisionalSanctionOrderHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  const provPension = calc.basicServicePension;
  const provDcrg = Math.round(calc.dcrgSanctioned * 0.80); // 80% Provisional DCRG under KCSR
  return `
  <div class="karnataka-govt-document prov-order-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-[11px] text-stone-700 font-sans font-semibold">
        (Rule 341 of Karnataka Civil Services Rules - KCSR)
      </div>
      <div class="font-bold text-sm text-stone-950 mt-1 underline">
        ತಾತ್ಕಾಲಿಕ ಪಿಂಚಣಿ ಮತ್ತು ತಾತ್ಕಾಲಿಕ ನಿವೃತ್ತಿ ಉಪದಾನ ಮಂಜೂರಾತಿ ಆದೇಶ
      </div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>ಸಂ: ${office.orderPrefix}/${record.kgidNumber}/ತಾತ್ಕಾಲಿಕ-ಪಿಂಚಣಿ/2026-27</strong></div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="text-xs leading-relaxed">
      <div class="font-bold underline mb-1">ಪ್ರಸ್ತಾವನೆ:</div>
      <p class="text-justify text-[11px]">
        ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ${record.designation}, ${record.officeOrSchool}, KGID: <strong>${record.kgidNumber}</strong>
        ಇವರು ದಿನಾಂಕ <strong>${record.dor}</strong> ರಂದು ವಯೋನಿವೃತ್ತಿ ಹೊಂದುತ್ತಿದ್ದು, ಇವರ ಅಂತಿಮ ಪಿಂಚಣಿ ಪ್ರಸ್ತಾವನೆಯು ಮಹಾಲೆಕ್ಕಪಾಲರ ಕಚೇರಿ (A&E) ಬೆಂಗಳೂರು ಇವರ
        ಅಧಿಕಾರ ಪತ್ರಕ್ಕಾಗಿ (PPO / GPO Authorization) ಕಳುಹಿಸಲ್ಪಟ್ಟಿರುತ್ತದೆ.
      </p>
      <p class="text-justify text-[11px] mt-1">
        ಅಂತಿಮ ಪಿಂಚಣಿ ಪಾವತಿ ಆದೇಶ (PPO) ಸ್ವೀಕೃತಿಯಾಗುವವರೆಗೆ ನಿವೃತ್ತ ನೌಕರರಿಗೆ ಆರ್ಥಿಕ ತೊಂದರೆಯಾಗದಂತೆ, ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳ ನಿಯಮ ೩೪೧ ರ ಅಡಿಯಲ್ಲಿ
        ಶೇಕಡಾ ೧೦೦ ರಷ್ಟು ತಾತ್ಕಾಲಿಕ ಪಿಂಚಣಿ (Provisional Pension) ಹಾಗೂ ಶೇಕಡಾ ೮೦ ರಷ್ಟು ತಾತ್ಕಾಲಿಕ ನಿವೃತ್ತಿ ಉಪದಾನವನ್ನು (Provisional DCRG) ಮಂಜೂರು ಮಾಡಲು ಉದ್ದೇಶಿಸಿ ಈ ಕೆಳಗಿನ ಆದೇಶ.
      </p>
    </div>

    <div class="mt-4 p-3 bg-stone-50 border-2 border-stone-800">
      <div class="text-center font-bold text-xs underline mb-2">ಆ ದೇಶ (ORDER)</div>
      <p class="text-justify text-xs leading-relaxed">
        ಪ್ರಸ್ತಾವನೆಯನ್ವಯ, ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ${record.designation} ಇವರಿಗೆ ದಿನಾಂಕ <strong>${record.dor}</strong> ರಿಂದ
        ಜಾರಿಗೆ ಬರುವಂತೆ ಗರಿಷ್ಠ ೬ ತಿಂಗಳ ಅವಧಿಗೆ ಅಥವಾ ಮಹಾಲೆಕ್ಕಪಾಲರಿಂದ ಅಂತಿಮ ಪಿಂಚಣಿ ಆದೇಶ ಬರುವವರೆಗೆ, ಇವೆರಡರಲ್ಲಿ ಯಾವುದು ಮೊದಲೋ ಅಲ್ಲಿಯವರೆಗೆ ಕೆಳಕಂಡಂತೆ
        ತಾತ್ಕಾಲಿಕ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳನ್ನು ಮಂಜೂರು ಮಾಡಲಾಗಿದೆ:
      </p>

      <table class="w-full border-collapse border border-stone-400 mt-2 text-xs">
        <tr class="bg-stone-200 font-bold">
          <th class="border border-stone-400 p-1.5 w-10 text-center">ಕ್ರ.ಸಂ</th>
          <th class="border border-stone-400 p-1.5 text-left">ತಾತ್ಕಾಲಿಕ ಸೌಲಭ್ಯದ ವಿವರ</th>
          <th class="border border-stone-400 p-1.5 text-left">ಮಂಜೂರಾದ ಮೊತ್ತ</th>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 text-center font-bold">೧</td>
          <td class="border border-stone-400 p-1.5">ತಾತ್ಕಾಲಿಕ ಮಾಸಿಕ ಪಿಂಚಣಿ (100% Provisional Pension + DA)</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code text-emerald-900">
            ${formatINR(provPension)} + ನಿಯಮಾನುಸಾರ ತುಟ್ಟಿಭತ್ಯೆ (DR)
          </td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 text-center font-bold">೨</td>
          <td class="border border-stone-400 p-1.5">ತಾತ್ಕಾಲಿಕ ನಿವೃತ್ತಿ ಉಪದಾನ (80% Provisional DCRG)</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code text-blue-900">
            ${formatINR(provDcrg)} (ಎಂಭತ್ತು ಶೇಕಡಾ ಮೊತ್ತ)
          </td>
        </tr>
      </table>

      <div class="mt-2 text-[10px] text-stone-600">
        * ಮಹಾಲೆಕ್ಕಪಾಲರಿಂದ ಅಂತಿಮ ಅಧಿಕಾರ ಪತ್ರ ಸ್ವೀಕೃತವಾದ ತಕ್ಷಣ ಈ ತಾತ್ಕಾಲಿಕ ಮೊತ್ತವನ್ನು ಅಂತಿಮ ಪಾವತಿಯಲ್ಲಿ ಸರಿಹೊಂದಿಸಲಾಗುವುದು.
      </div>
    </div>

    <div class="mt-8 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 6. COMMUTATION SANCTION ORDER (ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಮಂಜೂರಾತಿ ಆದೇಶ)
 */
export function generateCommutationOrderHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  return `
  <div class="karnataka-govt-document comm-order-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-[11px] text-stone-700 font-sans font-semibold">
        (Karnataka Civil Services Commutation of Pension Rules)
      </div>
      <div class="font-bold text-sm text-stone-950 mt-1 underline">
        ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ (CVP) ಮಂಜೂರಾತಿ ಅಧಿಕೃತ ಆದೇಶ
      </div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>ಸಂ: ${office.orderPrefix}/${record.kgidNumber}/ಪರಿವರ್ತನೆ-ಆದೇಶ/2026-27</strong></div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="text-xs leading-relaxed">
      <p class="text-justify text-[11px]">
        ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ (ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ) ನಿಯಮಾವಳಿಗಳ ಪ್ರಕಾರ, ನಿವೃತ್ತ ನೌಕರರಾದ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>,
        ${record.designation}, KGID: <strong>${record.kgidNumber}</strong> ಇವರು ಸಲ್ಲಿಸಿದ ಅರ್ಜಿಯ ಮೇರೆಗೆ, ಅವರ ಮಾಸಿಕ ಮೂಲ ಪಿಂಚಣಿಯಲ್ಲಿ
        ಶೇಕಡಾ <strong>${record.commutationPercentage}%</strong> ರಷ್ಟು ಭಾಗವನ್ನು ಪರಿವರ್ತಿಸಿ ಗಂಟು ಮೊತ್ತವನ್ನು ಪಾವತಿಸಲು ಮಂಜೂರಾತಿ ನೀಡಿ ಈ ಕೆಳಗಿನಂತೆ ಆದೇಶಿಸಿದೆ:
      </p>

      <div class="mt-3 p-3 bg-stone-50 border border-stone-400">
        <table class="w-full border-collapse border border-stone-400 text-xs">
          <tr>
            <td class="border border-stone-400 p-1.5 w-1/2 bg-stone-100">ಮಂಜೂರಾದ ಮಾಸಿಕ ಮೂಲ ಪಿಂಚಣಿ</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.basicServicePension)}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 bg-stone-100">ಪರಿವರ್ತನೆಗೆ ಒಪ್ಪಿದ ಶೇಕಡಾವಾರು ಭಾಗ</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${record.commutationPercentage}%</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 bg-stone-100">ಮಾಸಿಕ ಕಟಾವಣೆ ಮಾಡಬೇಕಾದ ಪರಿವರ್ತಿತ ಭಾಗ</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code text-rose-800">${formatINR(calc.commutedPortion)}</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 bg-stone-100">ಮುಂದಿನ ಜನ್ಮದಿನದ ವಯಸ್ಸು & ಪರಿವರ್ತನಾ ಅಪವರ್ತನ</td>
            <td class="border border-stone-400 p-1.5 font-mono-code">ವಯಸ್ಸು: ${record.ageNextBirthday} ವರ್ಷ | ಅಪವರ್ತನ: ${calc.commutationFactor}</td>
          </tr>
          <tr class="bg-amber-50">
            <td class="border border-stone-400 p-1.5 font-bold">ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಪರಿವರ್ತಿತ ಗಂಟು ಮೊತ್ತ (CVP)</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code text-sm text-emerald-950">
              ${formatINR(calc.commutationLumpSum)}
            </td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 bg-stone-100">ಪರಿವರ್ತನೆಯ ನಂತರ ಪಾವತಿಸಬೇಕಾದ ನಿವ್ವಳ ಮಾಸಿಕ ಪಿಂಚಣಿ</td>
            <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.reducedMonthlyPension)} / ತಿಂಗಳಿಗೆ (+DR)</td>
          </tr>
          <tr>
            <td class="border border-stone-400 p-1.5 bg-stone-100">ಪರಿವರ್ತಿತ ಮೊತ್ತ ಮರುಸ್ಥಾಪನೆ ದಿನಾಂಕ (Restoration Date)</td>
            <td class="border border-stone-400 p-1.5 font-bold text-stone-800">ಗಂಟು ಮೊತ್ತ ಪಡೆದ ದಿನಾಂಕದಿಂದ ೧೫ ವರ್ಷಗಳ ನಂತರ</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="mt-8 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 7. FORWARDING LETTER TO AG KARNATAKA (ಮಹಾಲೆಕ್ಕಪಾಲರಿಗೆ ಪ್ರಸ್ತಾವನಾ ರವಾನೆ ಪತ್ರ)
 */
export function generateAgForwardingLetterHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  return `
  <div class="karnataka-govt-document ag-forward-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-xs text-stone-700">${office.officeAddress} | Email: ${office.email}</div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>ಸಂ: ${office.orderPrefix}/${record.kgidNumber}/ಮಹಾಲೆಕ್ಕಪಾಲ-ರವಾನೆ/2026-27</strong></div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="mt-2 text-xs">
      <div><strong>ಗೆ,</strong></div>
      <div class="ml-4">
        ಪ್ರಧಾನ ಮಹಾಲೆಕ್ಕಪಾಲರು (A&E),<br/>
        ಕರ್ನಾಟಕ, ಪಾರ್ಕ್ ಹೌಸ್ ರಸ್ತೆ,<br/>
        ಬೆಂಗಳೂರು - ೫೬೦ ೦೦೧.
      </div>
    </div>

    <div class="mt-4 p-2 bg-stone-100 border border-stone-300 font-bold text-xs">
      ವಿಷಯ: ಶ್ರೀ/ಶ್ರೀಮತಿ ${record.employeeName}, ${record.designation}, KGID: ${record.kgidNumber} ರವರ ಪಿಂಚಣಿ, ನಿವೃತ್ತಿ ಉಪದಾನ ಹಾಗೂ ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಅಧಿಕಾರ ಪತ್ರ ಮಂಜೂರಾತಿಗಾಗಿ ಪ್ರಸ್ತಾವನೆ ಸಲ್ಲಿಸುವ ಬಗ್ಗೆ.
    </div>

    <div class="mt-2 text-xs">
      <div><strong>ಉಲ್ಲೇಖ:</strong></div>
      <div class="ml-4 text-[11px] text-stone-700">
        ೧. ನೌಕರರ ದಿನಾಂಕ ${record.dor} ರ ನಿವೃತ್ತಿ ಅರ್ಜಿ.<br/>
        ೨. ಈ ಕಚೇರಿಯ ಕಡತ ಸಂಖ್ಯೆ: ${record.fileNumber}.
      </div>
    </div>

    <p class="mt-3 text-justify text-xs leading-relaxed">
      ಮಾನ್ಯರೇ,<br/>
      ಮೇಲ್ಕಂಡ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕಿನ ${record.officeOrSchool} ದಲ್ಲಿ ${record.designation} ಆಗಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸುತ್ತಿರುವ
      ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, KGID: <strong>${record.kgidNumber}</strong> ಇವರು ದಿನಾಂಕ <strong>${record.dor}</strong> ರಂದು
      ವಯೋನಿವೃತ್ತಿ ಹೊಂದುತ್ತಿದ್ದಾರೆ. ಇವರ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳ ಮಂಜೂರಾತಿಗಾಗಿ ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ಶಾಸನಬದ್ಧ ದಾಖಲಾತಿಗಳನ್ನು ಈ ಪತ್ರದೊಂದಿಗೆ ಲಗತ್ತಿಸಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.
    </p>

    <div class="mt-3 p-2 bg-stone-50 border border-stone-300 text-xs">
      <div class="font-bold underline mb-1">ಲಗತ್ತಿಸಿರುವ ದಾಖಲಾತಿಗಳ ಪಟ್ಟಿ (Enclosures Checklist):</div>
      <ol class="list-decimal ml-5 space-y-1 text-[11px]">
        <li>ಮೂಲ ಸೇವಾ ಪುಸ್ತಕ (Service Book - 2 ಸಂಪುಟಗಳಲ್ಲಿ) ನವೀಕೃತ ಸೇವಾ ಪರಿಶೀಲನೆಯೊಂದಿಗೆ.</li>
        <li>ಕ್ರಮಬದ್ಧವಾಗಿ ಭರ್ತಿ ಮಾಡಿದ ಪ್ರಪತ್ರ-೭ (Form 7) - ೩ ಪ್ರತಿಗಳಲ್ಲಿ.</li>
        <li>ನಮೂನೆ-೧ ಮತ್ತು ನಮೂನೆ-೨ (ಪಿಂಚಣಿ ಅರ್ಜಿ & ನಾಮನಿರ್ದೇಶನ).</li>
        <li>ದೃಢೀಕರಿಸಿದ ಜಂಟಿ ಭಾವಚಿತ್ರಗಳು (Joint Photographs - ೪ ಪ್ರತಿಗಳು).</li>
        <li>ಮಾದರಿ ಸಹಿ ಹಾಗೂ ಎಡಗೈ ಹೆಬ್ಬೆರಳಿನ ಗುರುತು ಪತ್ರಿಕೆಗಳು.</li>
        <li>ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ (No Due Certificate) ಮತ್ತು ನಿರಪೇಕ್ಷಣಾ ಪ್ರಮಾಣ ಪತ್ರ.</li>
        <li>ಕೊನೆಯ ವೇತನ ಪ್ರಮಾಣಪತ್ರ (Last Pay Certificate - LPC).</li>
        <li>ಆಧಾರ್ ಕಾರ್ಡ್ ಹಾಗೂ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಪ್ರತಿ.</li>
      </ol>
    </div>

    <p class="mt-3 text-justify text-xs leading-relaxed">
      ಆದ್ದರಿಂದ, ಸದರಿ ನೌಕರರ ಹೆಸರಿಗೆ ಪಿಂಚಣಿ ಪಾವತಿ ಆದೇಶ (PPO), ನಿವೃತ್ತಿ ಉಪದಾನ ಪಾವತಿ ಆದೇಶ (GPO) ಹಾಗೂ ಪಿಂಚಣಿ ಪರಿವರ್ತನಾ ಅಧಿಕಾರ ಪತ್ರವನ್ನು (CVP Authorization)
      ಶೀಘ್ರವಾಗಿ ಹೊರಡಿಸಿ, ಸಂಬಂಧಪಟ್ಟ ಜಿಲ್ಲಾ/ಉಪ ಖಜಾನೆ ಹಾಗೂ ಈ ಕಚೇರಿಗೆ ರವಾನಿಸಬೇಕಾಗಿ ಕೋರುತ್ತೇನೆ.
    </p>

    <div class="mt-8 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 8. NO DUES CERTIFICATE (ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ - NDC & Vigilance Clearance)
 */
export function generateNoDuesCertificateHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  return `
  <div class="karnataka-govt-document ndc-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-xs text-stone-700">ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-2 underline">
        ಬಾಕಿ ರಹಿತ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ನಿರಪೇಕ್ಷಣಾ ಪ್ರಮಾಣ ಪತ್ರ (NO DUES CERTIFICATE)
      </div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>ಸಂ: ${office.orderPrefix}/${record.kgidNumber}/ಬಾಕಿ-ರಹಿತ/2026-27</strong></div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="p-3 bg-stone-50 border border-stone-400 text-xs leading-relaxed space-y-3">
      <p class="text-justify text-xs">
        ದಿನಾಂಕ <strong>${record.dor}</strong> ರಂದು ಸೇವೆಯಿಂದ ವಯೋನಿವೃತ್ತಿ ಹೊಂದುತ್ತಿರುವ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>,
        ${record.designation}, ${record.officeOrSchool}, ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ: <strong>${record.kgidNumber}</strong> ಇವರಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ
        ಕಚೇರಿಯ ಎಲ್ಲಾ ಲೆಕ್ಕಪತ್ರಗಳು, ಸಾಲದ ಲೆಡ್ಜರ್‌ಗಳು ಹಾಗೂ ದಾಸ್ತಾನು ರಿಜಿಸ್ಟರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಈ ಕೆಳಗಿನಂತೆ ಪ್ರಮಾಣೀಕರಿಸಲಾಗಿದೆ:
      </p>

      <table class="w-full border-collapse border border-stone-400 text-xs">
        <tr class="bg-stone-200 font-bold">
          <th class="border border-stone-400 p-1.5 w-10 text-center">ಕ್ರ.ಸಂ</th>
          <th class="border border-stone-400 p-1.5 text-left">ಬಾಕಿ ವಿವರ</th>
          <th class="border border-stone-400 p-1.5 text-left">ಸ್ಥಿತಿ / ದೃಢೀಕರಣ</th>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 text-center font-bold">೧</td>
          <td class="border border-stone-400 p-1.5">ವೇತನ ಮತ್ತು ಭತ್ಯೆಗಳ ಅತಿ ಪಾವತಿ (Overpayments)</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-800">ಯಾವುದೇ ಬಾಕಿ ಇರುವುದಿಲ್ಲ (NIL)</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 text-center font-bold">೨</td>
          <td class="border border-stone-400 p-1.5">ಸರ್ಕಾರಿ ಗೃಹ ನಿರ್ಮಾಣ / ವಾಹನ / ಕಂಪ್ಯೂಟರ್ ಮುಂಗಡ</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-800">ಸಂಪೂರ್ಣ ಮರುಪಾವತಿಯಾಗಿದೆ (NIL)</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 text-center font-bold">೩</td>
          <td class="border border-stone-400 p-1.5">ಶಾಲಾ ಗ್ರಂಥಾಲಯ, ಕ್ರೀಡಾ & ಪ್ರಯೋಗಾಲಯ ಸಾಮಗ್ರಿಗಳು</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-800">ಕ್ರಮಬದ್ಧವಾಗಿ ಹಸ್ತಾಂತರಿಸಲಾಗಿದೆ (NIL)</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 text-center font-bold">೪</td>
          <td class="border border-stone-400 p-1.5">ಸರ್ಕಾರಿ ಕ್ವಾರ್ಟರ್ಸ್ ಬಾಡಿಗೆ / ನೀರಿನ ತೆರಿಗೆ ಬಾಕಿ</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-800">ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲ (NIL)</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 text-center font-bold">೫</td>
          <td class="border border-stone-400 p-1.5">ಇಲಾಖಾ ವಿಚಾರಣೆ / ಶಿಸ್ತು ಕ್ರಮ ಪ್ರಕರಣಗಳು</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-800">ಯಾವುದೂ ಬಾಕಿ ಇರುವುದಿಲ್ಲ (NIL)</td>
        </tr>
      </table>

      <p class="text-justify text-xs pt-1">
        ಆದ್ದರಿಂದ ಸದರಿ ನೌಕರರಿಗೆ ಪಿಂಚಣಿ, ನಿವೃತ್ತಿ ಉಪದಾನ ಮತ್ತು ರಜೆ ನಗದೀಕರಣ ಸೌಲಭ್ಯಗಳನ್ನು ವಿತರಿಸಲು ಈ ಕಚೇರಿಯಿಂದ ಯಾವುದೇ ಆಕ್ಷೇಪಣೆ ಇರುವುದಿಲ್ಲವೆಂದು
        ಈ ಮೂಲಕ ಪ್ರಮಾಣಪತ್ರ ನೀಡಲಾಗಿದೆ.
      </p>
    </div>

    <div class="mt-8 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 9. PENSION CALCULATION STATEMENT (ಸಮಗ್ರ ಪಿಂಚಣಿ ಹಾಗೂ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರ ತಃಖ್ಯೆ - 4 Distinct Calculations)
 * Covers: 1. Pension, 2. Retirement Gratuity, 3. Commutation of Pension, 4. EL Encashment
 */
export function generatePensionCalculationSheetHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  const retAge = calc.retirementAgeYears || 60;
  return `
  <div class="karnataka-govt-document calc-sheet-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[820px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-xs text-stone-700">ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-1.5 underline">
        ಪಿಂಚಣಿ ಮತ್ತು ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳ ಪ್ರತ್ಯೇಕ ಲೆಕ್ಕಾಚಾರ ತಃಖ್ಯೆ (PENSION & RETIREMENT BENEFITS CALCULATION SHEET)
      </div>
      <div class="text-[11px] text-stone-600 mt-0.5">
        (ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳು KCSR & ೭ನೇ ವೇತನ ಆಯೋಗದ ನಿಯಮಾನುಸಾರ ತಯಾರಿಸಲಾಗಿದೆ)
      </div>
    </div>

    <!-- HEADER DETAILS -->
    <div class="flex justify-between items-center my-3 p-2 bg-stone-50 border border-stone-300 text-xs font-mono-code">
      <div><strong>ಕಡತ ಸಂ:</strong> ${record.fileNumber}</div>
      <div><strong>ಪ್ರಕರಣ ಸಂ:</strong> ${record.caseNumber}</div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <!-- EMPLOYEE & SERVICE PARTICULARS -->
    <div class="mb-3">
      <div class="bg-stone-800 text-white px-2 py-1 font-bold text-xs">
        ನೌಕರರ ಸೇವಾ ವಿವರಗಳು & ವಯೋನಿವೃತ್ತಿ ಪರಿಶೀಲನೆ (SERVICE PARTICULARS & RETIREMENT AGE VERIFICATION)
      </div>
      <table class="w-full border-collapse border border-stone-400 mt-1 text-xs">
        <tr>
          <td class="border border-stone-400 p-1.5 w-1/4 bg-stone-50">ನೌಕರರ ಹೆಸರು</td>
          <td class="border border-stone-400 p-1.5 font-bold">${record.employeeName}</td>
          <td class="border border-stone-400 p-1.5 w-1/4 bg-stone-50">ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${record.kgidNumber}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಹುದ್ದೆ & ಶಾಲೆ/ಕಚೇರಿ</td>
          <td class="border border-stone-400 p-1.5">${record.designation}, ${record.officeOrSchool}</td>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ವೇತನ ಶ್ರೇಣಿ</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${record.payScale}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಜನ್ಮ ದಿನಾಂಕ (DOB)</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${record.dob}</td>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ (DOA)</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${record.doa}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ನಿವೃತ್ತಿ ವಯಸ್ಸು ಪರಿಶೀಲನೆ</td>
          <td class="border border-stone-400 p-1.5 font-bold text-indigo-900">
            ${retAge} ವರ್ಷಗಳು ${retAge === 65 ? '(ಯುಜಿಸಿ / ವಿಶೇಷ ವೃಂದ)' : '(ಸಾಮಾನ್ಯ ಸರ್ಕಾರಿ ನೌಕರರು / ಶಾಲಾ ಶಿಕ್ಷಣ)'}
          </td>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ನಿವೃತ್ತಿ ದಿನಾಂಕ (DOR)</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code text-indigo-950">${record.dor}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಒಟ್ಟು ಸೇವೆ</td>
          <td class="border border-stone-400 p-1.5">${calc.grossYears} ವರ್ಷ, ${calc.grossMonths} ತಿಂಗಳು, ${calc.grossDays} ದಿನಗಳು</td>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಅನರ್ಹತಾ ಸೇವೆ (EOL/Dies-non)</td>
          <td class="border border-stone-400 p-1.5">${calc.nonQualifyingDays} ದಿನಗಳು</td>
        </tr>
        <tr class="bg-amber-50">
          <td class="border border-stone-400 p-1.5 font-bold">ನಿವ್ವಳ ಅರ್ಹತಾ ಸೇವೆ</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-900">
            ${calc.netQualifyingYears} ವರ್ಷ, ${calc.netQualifyingMonths} ತಿಂಗಳು, ${calc.netQualifyingDays} ದಿನಗಳು
          </td>
          <td class="border border-stone-400 p-1.5 font-bold">ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-900 font-mono-code">
            ${calc.qualifyingHalfYears} (ಗರಿಷ್ಠ ಮಿತಿ: ೬೦)
          </td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ಕೊನೆಯ ಮೂಲ ವೇತನ</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.lastBasicPay)}</td>
          <td class="border border-stone-400 p-1.5 bg-stone-50">ತುಟ್ಟಿಭತ್ಯೆ (DA @ ${calc.daPercentage}%)</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.daAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- 4 DISTINCT SEPARATE CALCULATIONS -->
    
    <!-- 1. PENSION CALCULATION -->
    <div class="mb-3 border border-stone-400">
      <div class="bg-emerald-800 text-white px-2 py-1 font-bold text-xs flex justify-between">
        <span>೧. ಮಾಸಿಕ ಪಿಂಚಣಿ ಲೆಕ್ಕಾಚಾರ (MONTHLY PENSION CALCULATION)</span>
        <span class="text-[11px] font-normal">KCSR Rule 287 / 7th Pay Commission</span>
      </div>
      <div class="p-2 space-y-1.5 text-xs">
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಅ) ಪೂರ್ಣ ಪಿಂಚಣಿ (೫೦% ಮೂಲ ವೇತನ):</span>
          <span class="font-mono-code font-bold">${formatINR(calc.fullPension)}</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಆ) ಅರ್ಹತಾ ಸೇವಾವಧಿಯ ಅನುಪಾತದನ್ವಯ ಮೂಲ ಪಿಂಚಣಿ:</span>
          <span class="font-mono-code font-bold">${formatINR(calc.basicServicePension)}</span>
        </div>
        <div class="text-[11px] text-stone-600 bg-stone-50 p-1 rounded font-mono-code">
          ಸೂತ್ರ: (${formatINR(calc.fullPension)} × ${calc.qualifyingHalfYears} ಅರ್ಧವಾರ್ಷಿಕಗಳು) ÷ ೬೦ = <strong>${formatINR(calc.basicServicePension)}</strong> / ತಿಂಗಳಿಗೆ
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಇ) ತುಟ್ಟಿಭತ್ಯೆ ಪರಿಹಾರ (Dearness Relief @ ${calc.daPercentage}% on Basic Pension):</span>
          <span class="font-mono-code">${formatINR(calc.dearnessRelief)}</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಈ) ವೈದ್ಯಕೀಯ ಭತ್ಯೆ (Fixed Medical Allowance):</span>
          <span class="font-mono-code">${formatINR(calc.medicalAllowance)}</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1 bg-emerald-50 p-1">
          <span class="font-bold text-emerald-950">(ಉ) ಪರಿವರ್ತನೆಯ ನಂತರದ ನಿವ್ವಳ ಮಾಸಿಕ ಪಿಂಚಣಿ (Reduced Pension + DR + FMA):</span>
          <span class="font-mono-code font-bold text-emerald-950 text-sm">${formatINR(calc.totalMonthlyReceivable)} / ತಿಂಗಳಿಗೆ</span>
        </div>
        <div class="flex justify-between text-[11px] text-stone-700 pt-0.5">
          <span>ಕುಟುಂಬ ಪಿಂಚಣಿ (Family Pension): ಸಾಮಾನ್ಯ ದರ: <strong>${formatINR(calc.familyPensionNormal)}</strong> | ಹೆಚ್ಚುವರಿ ದರ: <strong>${formatINR(calc.familyPensionEnhanced)}</strong></span>
        </div>
      </div>
    </div>

    <!-- 2. RETIREMENT GRATUITY (DCRG) CALCULATION -->
    <div class="mb-3 border border-stone-400">
      <div class="bg-blue-800 text-white px-2 py-1 font-bold text-xs flex justify-between">
        <span>೨. ನಿವೃತ್ತಿ ಉಪದಾನ ಲೆಕ್ಕಾಚಾರ (RETIREMENT GRATUITY / DCRG CALCULATION)</span>
        <span class="text-[11px] font-normal">KCSR Rule 292 / Cap: ₹20,00,000</span>
      </div>
      <div class="p-2 space-y-1.5 text-xs">
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಅ) ಉಪದಾನಕ್ಕೆ ಪರಿಗಣಿಸಲಾದ ಒಟ್ಟು ಮಾಸಿಕ ವೇತನ (ಮೂಲ ವೇತನ ₹${calc.lastBasicPay.toLocaleString('en-IN')} + DA ₹${calc.daAmount.toLocaleString('en-IN')}):</span>
          <span class="font-mono-code font-bold">${formatINR(calc.lastBasicPay + calc.daAmount)}</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಆ) ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು (Qualifying Half Years):</span>
          <span class="font-mono-code font-bold">${calc.qualifyingHalfYears} ಅವಧಿಗಳು</span>
        </div>
        <div class="text-[11px] text-stone-600 bg-stone-50 p-1 rounded font-mono-code">
          ಸೂತ್ರ: [(ಮೂಲ ವೇತನ + DA) ÷ ೪] × ${calc.qualifyingHalfYears} = [${formatINR(calc.lastBasicPay + calc.daAmount)} ÷ ೪] × ${calc.qualifyingHalfYears} = <strong>${formatINR(calc.dcrgRaw)}</strong>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಇ) ಗರಿಷ್ಠ ಪರಿಮಿತಿ ಮೌಲ್ಯಮಾಪನ (೧೬.೫ ತಿಂಗಳ ವೇತನ ಅಥವಾ ₹೨೦ ಲಕ್ಷಗಳು - ಇವೆರಡರಲ್ಲಿ ಯಾವುದು ಕಡಿಮೆಯೋ ಅದು):</span>
          <span class="font-mono-code">ಗರಿಷ್ಠ: ₹೨೦,೦೦,೦೦೦</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1 bg-blue-50 p-1">
          <span class="font-bold text-blue-950">(ಈ) ಅಂತಿಮವಾಗಿ ಮಂಜೂರಾದ ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG Sanctioned):</span>
          <span class="font-mono-code font-bold text-blue-950 text-sm">${formatINR(calc.dcrgSanctioned)}</span>
        </div>
        <div class="text-[11px] text-stone-600">ಅಕ್ಷರಗಳಲ್ಲಿ: <strong>${numberToKannadaWords(calc.dcrgSanctioned)}</strong></div>
      </div>
    </div>

    <!-- 3. COMMUTATION OF PENSION CALCULATION -->
    <div class="mb-3 border border-stone-400">
      <div class="bg-amber-800 text-white px-2 py-1 font-bold text-xs flex justify-between">
        <span>೩. ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಲೆಕ್ಕಾಚಾರ (COMMUTATION OF PENSION CALCULATION)</span>
        <span class="text-[11px] font-normal">KCSR Appendix I / Commutation Factor</span>
      </div>
      <div class="p-2 space-y-1.5 text-xs">
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಅ) ಮಂಜೂರಾದ ಮೂಲ ಮಾಸಿಕ ಪಿಂಚಣಿ:</span>
          <span class="font-mono-code font-bold">${formatINR(calc.basicServicePension)}</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಆ) ಪರಿವರ್ತನೆಗೆ ಇಚ್ಛಿಸಿದ ಶೇಕಡಾವಾರು ಪ್ರಮಾಣ:</span>
          <span class="font-mono-code font-bold">${record.commutationPercentage}% (ಗರಿಷ್ಠ ೪೦%)</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಇ) ಪ್ರತಿ ತಿಂಗಳು ಪರಿವರ್ತನೆ ಮಾಡಲಾದ ಮೊತ್ತ (Commuted Portion):</span>
          <span class="font-mono-code font-bold">${formatINR(calc.commutedPortion)} / ತಿಂಗಳಿಗೆ</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಈ) ಮುಂದಿನ ಜನ್ಮದಿನದ ವಯಸ್ಸು & ಪರಿವರ್ತನಾ ಅಪವರ್ತನ (Factor for Age ${record.ageNextBirthday}):</span>
          <span class="font-mono-code font-bold">${calc.commutationFactor}</span>
        </div>
        <div class="text-[11px] text-stone-600 bg-stone-50 p-1 rounded font-mono-code">
          ಸೂತ್ರ: ಪರಿವರ್ತಿತ ಭಾಗ × ೧೨ × ಅಪವರ್ತನ = ${formatINR(calc.commutedPortion)} × ೧೨ × ${calc.commutationFactor} = <strong>${formatINR(calc.commutationLumpSum)}</strong>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1 bg-amber-50 p-1">
          <span class="font-bold text-amber-950">(ಉ) ಅಂತಿಮವಾಗಿ ಪಾವತಿಸಬೇಕಾದ ಪಿಂಚಣಿ ಪರಿವರ್ತನಾ ಗಂಟುಮೊತ್ತ:</span>
          <span class="font-mono-code font-bold text-amber-950 text-sm">${formatINR(calc.commutationLumpSum)}</span>
        </div>
        <div class="flex justify-between text-[11px] text-stone-600 pt-0.5">
          <span>ಪರಿವರ್ತನೆಯ ನಂತರ ಉಳಿಯುವ ಮಾಸಿಕ ಮೂಲ ಪಿಂಚಣಿ: <strong>${formatINR(calc.reducedMonthlyPension)}</strong></span>
          <span>ಮರುಸ್ಥಾಪನೆ ಅವಧಿ (Restoration Period): <strong>೧೫ ವರ್ಷಗಳು</strong></span>
        </div>
      </div>
    </div>

    <!-- 4. EARNED LEAVE (EL) ENCASHMENT CALCULATION -->
    <div class="mb-3 border border-stone-400">
      <div class="bg-purple-800 text-white px-2 py-1 font-bold text-xs flex justify-between">
        <span>೪. ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಲೆಕ್ಕಾಚಾರ (EARNED LEAVE & HPL ENCASHMENT CALCULATION)</span>
        <span class="text-[11px] font-normal">KCSR (Leave) Rules / Max 300 Days</span>
      </div>
      <div class="p-2 space-y-1.5 text-xs">
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಅ) ರಜೆ ನಗದೀಕರಣಕ್ಕೆ ಪರಿಗಣಿಸಿದ ಮಾಸಿಕ ವೇತನ (ಮೂಲ ವೇತನ + ತುಟ್ಟಿಭತ್ಯೆ):</span>
          <span class="font-mono-code font-bold">${formatINR(calc.lastBasicPay + calc.daAmount)}</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಆ) ಒಂದು ದಿನದ ವೇತನ ದರ [(ಮೂಲ ವೇತನ + DA) ÷ ೩೦]:</span>
          <span class="font-mono-code font-bold">${formatINR((calc.lastBasicPay + calc.daAmount) / 30)}</span>
        </div>
        <div class="flex justify-between border-b border-stone-200 pb-1">
          <span>(ಇ) ನೌಕರರ ಖಾತೆಯಲ್ಲಿ ಶಿಲ್ಕಿರುವ ಅರ್ಹ ಗಳಿಕೆ ರಜೆ (EL Days - ಗರಿಷ್ಠ ೩೦೦ ದಿನಗಳು):</span>
          <span class="font-mono-code font-bold">${calc.earnedLeaveDays} ದಿನಗಳು</span>
        </div>
        <div class="text-[11px] text-stone-600 bg-stone-50 p-1 rounded font-mono-code">
          ಸೂತ್ರ: [(${formatINR(calc.lastBasicPay + calc.daAmount)}) ÷ ೩೦] × ${calc.earnedLeaveDays} ದಿನಗಳು = <strong>${formatINR(calc.leaveEncashmentAmount)}</strong>
        </div>
        ${calc.halfPayLeaveDays && calc.halfPayEncashmentAmount ? `
        <div class="flex justify-between border-b border-stone-200 pb-1 text-stone-700">
          <span>(ಈ) ಅರ್ಧ ವೇತನ ರಜೆ ನಗದೀಕರಣ (HPL Encashment: ${calc.halfPayLeaveDays} ದಿನಗಳು):</span>
          <span class="font-mono-code font-bold">${formatINR(calc.halfPayEncashmentAmount)}</span>
        </div>
        ` : ''}
        <div class="flex justify-between border-b border-stone-200 pb-1 bg-purple-50 p-1">
          <span class="font-bold text-purple-950">(ಉ) ಅಂತಿಮವಾಗಿ ಮಂಜೂರಾದ ಒಟ್ಟು ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಮೊತ್ತ:</span>
          <span class="font-mono-code font-bold text-purple-950 text-sm">${formatINR(calc.totalLeaveEncashmentSanctioned || calc.leaveEncashmentAmount)}</span>
        </div>
        <div class="text-[11px] text-stone-600">ಅಕ್ಷರಗಳಲ್ಲಿ: <strong>${numberToKannadaWords(calc.totalLeaveEncashmentSanctioned || calc.leaveEncashmentAmount)}</strong></div>
      </div>
    </div>

    <!-- GRAND TOTAL TERMINAL BENEFITS SUMMARY -->
    <div class="mb-4 border-2 border-stone-900 bg-stone-900 text-white p-3 rounded">
      <div class="text-xs font-bold uppercase tracking-wider mb-2 text-stone-200">
        ಒಟ್ಟು ಅಂತಿಮ ನಿವೃತ್ತಿ ಗಂಟುಮೊತ್ತ ಸೌಲಭ್ಯಗಳ ಸಾರಾಂಶ (TERMINAL BENEFITS GRAND TOTAL SUMMARY)
      </div>
      <div class="grid grid-cols-3 gap-2 text-xs text-stone-100">
        <div class="p-2 bg-stone-800 rounded">
          <div class="text-[10px] text-stone-300">೧. ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG):</div>
          <div class="font-mono-code font-bold text-sm text-blue-200">${formatINR(calc.dcrgSanctioned)}</div>
        </div>
        <div class="p-2 bg-stone-800 rounded">
          <div class="text-[10px] text-stone-300">೨. ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಗಂಟುಮೊತ್ತ:</div>
          <div class="font-mono-code font-bold text-sm text-amber-200">${formatINR(calc.commutationLumpSum)}</div>
        </div>
        <div class="p-2 bg-stone-800 rounded">
          <div class="text-[10px] text-stone-300">೩. ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ:</div>
          <div class="font-mono-code font-bold text-sm text-purple-200">${formatINR(calc.totalLeaveEncashmentSanctioned || calc.leaveEncashmentAmount)}</div>
        </div>
      </div>
      <div class="mt-3 pt-2 border-t border-stone-700 flex justify-between items-center">
        <div class="font-bold text-sm">ಒಟ್ಟು ಅಂತಿಮ ನಿವೃತ್ತಿ ನಗದು ಮೊತ್ತ (GRAND TERMINAL TOTAL):</div>
        <div class="font-mono-code font-bold text-lg text-emerald-300">${formatINR(calc.totalTerminalLumpSum)}</div>
      </div>
      <div class="text-[11px] text-stone-300 mt-1">
        (${numberToKannadaWords(calc.totalTerminalLumpSum)})
      </div>
    </div>

    <!-- CERTIFICATION & SIGNATURES -->
    <div class="mt-6 flex justify-between items-end border-t border-stone-300 pt-3">
      <div class="text-xs space-y-1">
        <div><strong>ಲೆಕ್ಕಹಾಕಿದವರು:</strong> ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA - ಪಿಂಚಣಿ)</div>
        <div><strong>ಪರಿಶೀಲಿಸಿದವರು:</strong> ಕಛೇರಿ ಅಧೀಕ್ಷಕರು (OS)</div>
        <div class="text-[11px] text-stone-600 mt-2">ಸ್ಥಳ: ಭದ್ರಾವತಿ | ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}</div>
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
        <div class="text-[9px] text-stone-500 font-mono-code mt-0.5">[ಮಂಜೂರಾತಿ ಪ್ರಾಧಿಕಾರದ ಸಹಿ & ಮೊಹರು]</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 10. RETIREMENT GRATUITY (DCRG) SANCTION ORDER (ನಿವೃತ್ತಿ ಉಪದಾನ ಮಂಜೂರಾತಿ ಆದೇಶ)
 */
export function generateGratuitySanctionOrderHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  return `
  <div class="karnataka-govt-document gratuity-order-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-xs text-stone-700">ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-2 underline">
        ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG) ಮಂಜೂರಾತಿ ಆದೇಶ (RETIREMENT GRATUITY SANCTION ORDER)
      </div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>ಆದೇಶ ಸಂ:</strong> ${office.orderPrefix}/${record.kgidNumber}/DCRG/2026-27</div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="p-2 bg-stone-100 border border-stone-300 font-bold text-xs text-center my-3">
      ವಿಷಯ: ಶ್ರೀ/ಶ್ರೀಮತಿ ${record.employeeName}, ${record.designation}, ಇವರಿಗೆ ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG) ಮಂಜೂರು ಮಾಡುವ ಬಗ್ಗೆ.<br/>
      ಉಲ್ಲೇಖ: ೧. ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳು (KCSR) ನಿಯಮ ೨೯೨.<br/>
      ೨. ನೌಕರರ ನಿವೃತ್ತಿ ಅರ್ಜಿ ದಿನಾಂಕ: ${record.dor}.
    </div>

    <div class="space-y-3 text-justify text-xs leading-relaxed">
      <div class="font-bold underline text-xs">ಪ್ರಸ್ತಾವನೆ:</div>
      <p>
        ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕಿನ ${record.officeOrSchool} ದಲ್ಲಿ ${record.designation} ಆಗಿ ಸೇವೆ ಸಲ್ಲಿಸುತ್ತಿರುವ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>,
        ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ: <strong>${record.kgidNumber}</strong> ಇವರು ದಿನಾಂಕ <strong>${record.doa}</strong> ರಂದು ಸೇವೆಗೆ ಪ್ರವೇಶಿಸಿ,
        ದಿನಾಂಕ <strong>${record.dor}</strong> ರಂದು ಸೇವೆಯಿಂದ ವಯೋನಿವೃತ್ತಿ (${calc.retirementAgeYears || 60} ವರ್ಷಗಳು) ಹೊಂದುತ್ತಿದ್ದಾರೆ.
        ನೌಕರರ ಮೂಲ ಸೇವಾ ಪುಸ್ತಕವನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಒಟ್ಟು ಅರ್ಹತಾ ಸೇವೆ <strong>${calc.netQualifyingYears} ವರ್ಷ, ${calc.netQualifyingMonths} ತಿಂಗಳು</strong>
        ಹಾಗೂ <strong>${calc.qualifyingHalfYears} ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು</strong> ಎಂದು ದೃಢಪಟ್ಟಿದೆ.
      </p>

      <div class="font-bold underline text-xs pt-1">ಆದೇಶ:</div>
      <p>
        ಪ್ರಸ್ತಾವನೆಯಲ್ಲಿ ವಿವರಿಸಿರುವ ಅಂಶಗಳ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಹಾಗೂ ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳ (KCSR) ಅನ್ವಯ,
        ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ${record.designation} ಇವರಿಗೆ ಶಾಸನಬದ್ಧವಾಗಿ ಅರ್ಹವಾದ
        ನಿವೃತ್ತಿ ಉಪದಾನ (DCRG) ಮೊತ್ತ <strong>${formatINR(calc.dcrgSanctioned)}</strong> (${numberToKannadaWords(calc.dcrgSanctioned)})
        ಗಳನ್ನು ಮಂಜೂರು ಮಾಡಿ ಆದೇಶಿಸಲಾಗಿದೆ.
      </p>

      <table class="w-full border-collapse border border-stone-400 text-xs my-2">
        <tr class="bg-stone-100 font-bold">
          <td class="border border-stone-400 p-1.5 w-1/2">ಕೊನೆಯ ತಿಂಗಳ ವೇತನ + DA</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${formatINR(calc.lastBasicPay + calc.daAmount)}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5">ಅರ್ಹತಾ ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${calc.qualifyingHalfYears}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5">ಲೆಕ್ಕಹಾಕಲಾದ ಉಪದಾನ ಸೂತ್ರ</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">[${formatINR(calc.lastBasicPay + calc.daAmount)} ÷ ೪] × ${calc.qualifyingHalfYears}</td>
        </tr>
        <tr class="bg-blue-50 font-bold text-blue-950">
          <td class="border border-stone-400 p-1.5">ಅಂತಿಮ ಮಂಜೂರಾದ ನಿವೃತ್ತಿ ಉಪದಾನ</td>
          <td class="border border-stone-400 p-1.5 font-mono-code text-sm">${formatINR(calc.dcrgSanctioned)}</td>
        </tr>
      </table>

      <p class="pt-1">
        ಸದರಿ ಮೊತ್ತವನ್ನು ಸಂಬಂಧಪಟ್ಟ ಉಪ ಖಜಾನೆ, ಭದ್ರಾವತಿ ಮುಖಾಂತರ ನೌಕರರ ಬ್ಯಾಂಕ್ ಖಾತೆ (ಖಾತೆ ಸಂ: ${record.bankAccountNo}, ${record.bankName}) ಗೆ
        ಜಮೆ ಮಾಡಲು ಕ್ರಮವಹಿಸತಕ್ಕದ್ದು.
      </p>
    </div>

    <div class="mt-8 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 11. EARNED LEAVE ENCASHMENT SANCTION ORDER (ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಮಂಜೂರಾತಿ ಆದೇಶ)
 */
export function generateLeaveEncashmentSanctionOrderHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  const sanctionedAmount = calc.totalLeaveEncashmentSanctioned || calc.leaveEncashmentAmount;
  return `
  <div class="karnataka-govt-document el-order-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-xs text-stone-700">ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-2 underline">
        ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ ಮಂಜೂರಾತಿ ಆದೇಶ (EARNED LEAVE ENCASHMENT SANCTION ORDER)
      </div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>ಆದೇಶ ಸಂ:</strong> ${office.orderPrefix}/${record.kgidNumber}/ಗಳಿಕೆ-ರಜೆ/2026-27</div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="p-2 bg-stone-100 border border-stone-300 font-bold text-xs text-center my-3">
      ವಿಷಯ: ಶ್ರೀ/ಶ್ರೀಮತಿ ${record.employeeName}, ${record.designation}, ಇವರ ನಿವೃತ್ತಿ ಹೊಂದುತ್ತಿರುವ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಉಳಿದಿರುವ ಗಳಿಕೆ ರಜೆಯನ್ನು ನಗದೀಕರಿಸಲು ಮಂಜೂರಾತಿ ನೀಡುವ ಬಗ್ಗೆ.<br/>
      ಉಲ್ಲೇಖ: ೧. ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ (ರಜೆ) ನಿಯಮಾವಳಿಗಳು.<br/>
      ೨. ಸರ್ಕಾರಿ ಆದೇಶ ಸಂಖ್ಯೆ: ಎಫ್‌ಡಿ ೦೫ ಎಸ್‌ಆರ್‌ಎಸ್ ೨೦೧೨, ದಿನಾಂಕ: ೧೪-೦೬-೨೦೧೨ (ಗರಿಷ್ಠ ೩೦೦ ದಿನಗಳ ಮಿತಿ).
    </div>

    <div class="space-y-3 text-justify text-xs leading-relaxed">
      <p>
        ದಿನಾಂಕ <strong>${record.dor}</strong> ರಂದು ಸೇವೆಯಿಂದ ನಿವೃತ್ತಿ ಹೊಂದುತ್ತಿರುವ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>,
        ${record.designation}, ${record.officeOrSchool}, ಇವರ ಸೇವಾ ಪುಸ್ತಕದಲ್ಲಿ ನಮೂದಿಸಲಾದ ರಜೆ ಲೆಕ್ಕಪತ್ರವನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿ,
        ಇವರ ಖಾತೆಯಲ್ಲಿ <strong>${calc.earnedLeaveDays} ದಿನಗಳ ಗಳಿಕೆ ರಜೆ (Earned Leave)</strong> ಶಿಲ್ಕಿರುವುದು ದೃಢಪಟ್ಟಿದೆ.
      </p>

      <div class="font-bold underline text-xs pt-1">ಆದೇಶ:</div>
      <p>
        ಸರ್ಕಾರದ ನಿಯಮಾವಳಿಗಳನ್ವಯ, ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ${record.designation} ಇವರಿಗೆ
        ಖಾತೆಯಲ್ಲಿ ಶಿಲ್ಕಿರುವ <strong>${calc.earnedLeaveDays} ದಿನಗಳ ಗಳಿಕೆ ರಜೆಯನ್ನು ನಗದೀಕರಿಸಿ</strong> ಒಟ್ಟು
        <strong>${formatINR(sanctionedAmount)}</strong> (${numberToKannadaWords(sanctionedAmount)})
        ಗಳನ್ನು ಮಂಜೂರು ಮಾಡಿ ಆದೇಶಿಸಲಾಗಿದೆ.
      </p>

      <table class="w-full border-collapse border border-stone-400 text-xs my-2">
        <tr class="bg-stone-100">
          <td class="border border-stone-400 p-1.5 w-1/2">ಕೊನೆಯ ತಿಂಗಳ ವೇತನ + DA</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${formatINR(calc.lastBasicPay + calc.daAmount)}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5">ಒಂದು ದಿನದ ವೇತನ ದರ [(Basic + DA) ÷ ೩೦]</td>
          <td class="border border-stone-400 p-1.5 font-mono-code">${formatINR((calc.lastBasicPay + calc.daAmount) / 30)}</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5">ಶಿಲ್ಕಿರುವ ಗಳಿಕೆ ರಜೆ ದಿನಗಳು</td>
          <td class="border border-stone-400 p-1.5 font-bold font-mono-code">${calc.earnedLeaveDays} ದಿನಗಳು (ಮಿತಿ: ೩೦೦)</td>
        </tr>
        <tr class="bg-purple-50 font-bold text-purple-950">
          <td class="border border-stone-400 p-1.5">ಒಟ್ಟು ಮಂಜೂರಾದ ರಜೆ ನಗದೀಕರಣ ಮೊತ್ತ</td>
          <td class="border border-stone-400 p-1.5 font-mono-code text-sm">${formatINR(sanctionedAmount)}</td>
        </tr>
      </table>
    </div>

    <div class="mt-8 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 12. SERVICE VERIFICATION CERTIFICATE (ಸೇವಾ ಪರಿಶೀಲನಾ ಪ್ರಮಾಣಪತ್ರ)
 */
export function generateServiceVerificationCertificateHtml(record: PensionCaseRecord, office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG): string {
  const calc = record.calculation;
  return `
  <div class="karnataka-govt-document svc-container p-6 bg-white text-stone-900 font-kannada text-xs leading-relaxed max-w-[800px] mx-auto border border-stone-300">
    <div class="text-center pb-2 border-b-2 border-stone-800">
      <div class="font-bold text-xs tracking-wide">ಕರ್ನಾಟಕ ಸರ್ಕಾರ - ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-0.5">${office.officeName}</div>
      <div class="text-xs text-stone-700">ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ</div>
      <div class="font-bold text-sm text-stone-950 mt-2 underline">
        ಸೇವಾ ಪರಿಶೀಲನಾ ಪ್ರಮಾಣಪತ್ರ (QUALIFYING SERVICE VERIFICATION CERTIFICATE)
      </div>
    </div>

    <div class="flex justify-between items-center my-3 text-xs font-mono-code">
      <div><strong>ಸಂ:</strong> ${office.orderPrefix}/${record.kgidNumber}/ಸೇವಾ-ಪರಿಶೀಲನೆ/2026-27</div>
      <div><strong>ದಿನಾಂಕ:</strong> ${record.dor || new Date().toISOString().split('T')[0]}</div>
    </div>

    <div class="space-y-3 text-justify text-xs leading-relaxed">
      <p>
        ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${record.employeeName}</strong>, ಹುದ್ದೆ: <strong>${record.designation}</strong>,
        ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ: <strong>${record.kgidNumber}</strong>, ಇವರ ಮೂಲ ಸೇವಾ ಪುಸ್ತಕವನ್ನು ಕೂಲಂಕಷವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು,
        ದಿನಾಂಕ <strong>${record.doa}</strong> ರಿಂದ ದಿನಾಂಕ <strong>${record.dor}</strong> ರವರೆಗೆ ಸಲ್ಲಿಸಲಾದ ಸೇವೆಯು
        ಕರ್ನಾಟಕ ನಾಗರಿಕ ಸೇವಾ ನಿಯಮಾವಳಿಗಳ (KCSR) ಅನ್ವಯ ಪಿಂಚಣಿಗೆ ಅರ್ಹವಾದ ಸೇವೆಯಾಗಿರುತ್ತದೆ ಎಂದು ಈ ಮೂಲಕ ದೃಢೀಕರಿಸಿ ಪ್ರಮಾಣೀಕರಿಸಲಾಗಿದೆ.
      </p>

      <table class="w-full border-collapse border border-stone-400 text-xs my-2">
        <tr>
          <td class="border border-stone-400 p-1.5 w-1/2 bg-stone-50">೧. ಒಟ್ಟು ಸೇವಾವಧಿ (Gross Service)</td>
          <td class="border border-stone-400 p-1.5 font-bold">${calc.grossYears} ವರ್ಷ, ${calc.grossMonths} ತಿಂಗಳು, ${calc.grossDays} ದಿನಗಳು</td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">೨. ಅನರ್ಹತಾ ಸೇವೆ (EOL / Dies-non)</td>
          <td class="border border-stone-400 p-1.5">${calc.nonQualifyingDays} ದಿನಗಳು</td>
        </tr>
        <tr class="bg-amber-50">
          <td class="border border-stone-400 p-1.5 font-bold">೩. ನಿವ್ವಳ ಅರ್ಹತಾ ಸೇವೆ (Net Qualifying Service)</td>
          <td class="border border-stone-400 p-1.5 font-bold text-emerald-900">
            ${calc.netQualifyingYears} ವರ್ಷ, ${calc.netQualifyingMonths} ತಿಂಗಳು, ${calc.netQualifyingDays} ದಿನಗಳು (${calc.qualifyingHalfYears} ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು)
          </td>
        </tr>
        <tr>
          <td class="border border-stone-400 p-1.5 bg-stone-50">೪. ವಯೋನಿವೃತ್ತಿ ಪರಿಶೀಲನೆ</td>
          <td class="border border-stone-400 p-1.5 font-bold">${calc.retirementAgeYears || 60} ವರ್ಷಗಳ ಪೂರ್ಣಾವಧಿ</td>
        </tr>
      </table>

      <p class="pt-1">
        ಸದರಿ ನೌಕರರ ಯಾವುದೇ ಸೇವಾ ಅವಧಿಯು ವಿವಾದಿತವಾಗಿರುವುದಿಲ್ಲ ಹಾಗೂ ವೇತನ ಬಡ್ತಿ ಮತ್ತು ರಜೆಗಳು ಕ್ರಮಬದ್ಧವಾಗಿರುತ್ತವೆ ಎಂದು ಪ್ರಮಾಣೀಕರಿಸಲಾಗಿದೆ.
      </p>
    </div>

    <div class="mt-8 flex justify-between items-end">
      <div class="text-xs text-stone-600">
        ಸ್ಥಳ: ಭದ್ರಾವತಿ<br/>
        ದಿನಾಂಕ: ${record.dor || new Date().toISOString().split('T')[0]}
      </div>
      <div class="text-center">
        <div class="font-bold text-xs">${office.officerName}</div>
        <div class="text-[11px] text-stone-700">${office.officerDesignation}</div>
        <div class="text-[10px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

/**
 * Universal dispatcher for any Pension Format Letter.
 */
export function renderPensionFormatHtml(
  formatType: PensionLetterFormatType,
  record: PensionCaseRecord,
  office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG
): string {
  switch (formatType) {
    case 'pension_calc_sheet':
      return generatePensionCalculationSheetHtml(record, office);
    case 'form7':
      return generateForm7Html(record, office);
    case 'form1_2':
      return generateForm1And2Html(record, office);
    case 'form6':
      return generateForm6Html(record, office);
    case 'sanction_order':
      return generateSanctionOrderHtml(record, office);
    case 'gratuity_order':
      return generateGratuitySanctionOrderHtml(record, office);
    case 'commutation_order':
      return generateCommutationOrderHtml(record, office);
    case 'el_encashment_order':
      return generateLeaveEncashmentSanctionOrderHtml(record, office);
    case 'service_verification_cert':
      return generateServiceVerificationCertificateHtml(record, office);
    case 'provisional_order':
      return generateProvisionalSanctionOrderHtml(record, office);
    case 'ag_forwarding':
      return generateAgForwardingLetterHtml(record, office);
    case 'no_dues_cert':
      return generateNoDuesCertificateHtml(record, office);
    default:
      return generatePensionCalculationSheetHtml(record, office);
  }
}

export interface QuickPensionEstimateInput {
  yearsOfService: number;
  lastBasicPay: number;
  daPercentage?: number;
  commutationOpted?: boolean;
  commutationPercentage?: number;
  earnedLeaveDays?: number;
  halfPayLeaveDays?: number;
  ageNextBirthday?: number;
}

export interface QuickPensionEstimateResult {
  yearsOfService: number;
  completedHalfYears: number;
  gratuityHalfYears: number;
  lastBasicPay: number;
  daPercentage: number;
  daAmount: number;
  monthlyEmoluments: number;

  // 1. Monthly Pension
  fullPension: number;
  basicServicePension: number;
  dearnessRelief: number;
  medicalAllowance: number;
  isEligibleForFullPension: boolean;
  isEligibleForRegularPension: boolean;

  // 2. Commutation
  commutationOpted: boolean;
  commutationPercentage: number;
  commutedPortion: number;
  commutationFactor: number;
  commutationLumpSum: number;
  reducedMonthlyPension: number;
  totalMonthlyReceivable: number;

  // 3. Gratuity (DCRG)
  dcrgRaw: number;
  dcrgSanctioned: number;
  isDcrgCapped: boolean;

  // 4. Leave Encashment
  earnedLeaveDays: number;
  leaveEncashmentAmount: number;
  halfPayLeaveDays: number;
  halfPayEncashmentAmount: number;
  totalLeaveEncashment: number;

  // Grand Total Terminal Benefits (Lump Sum)
  totalTerminalBenefits: number;

  // Family Pension
  familyPensionNormal: number;
  familyPensionEnhanced: number;
}

export function calculateQuickPensionEstimate(input: QuickPensionEstimateInput): QuickPensionEstimateResult {
  const years = Math.max(0, Number(input.yearsOfService) || 0);
  const pay = Math.max(0, Number(input.lastBasicPay) || 0);
  const daRate = input.daPercentage !== undefined ? Number(input.daPercentage) : DEFAULT_DA_PERCENTAGE;
  const commOpted = input.commutationOpted !== undefined ? input.commutationOpted : true;
  const commPct = Math.min(40, Math.max(0, input.commutationPercentage !== undefined ? Number(input.commutationPercentage) : 40));
  const elDays = Math.min(300, Math.max(0, input.earnedLeaveDays !== undefined ? Number(input.earnedLeaveDays) : 300));
  const hplDays = Math.max(0, input.halfPayLeaveDays !== undefined ? Number(input.halfPayLeaveDays) : 0);
  const ageNext = input.ageNextBirthday || 61;

  // Completed six-monthly periods for pension (capped at 60 for full pension = 30 yrs)
  const completedHalfYears = Math.min(60, Math.round(years * 2));
  // Completed six-monthly periods for gratuity (capped at 66 = 33 yrs)
  const gratuityHalfYears = Math.min(66, Math.round(years * 2));

  const daAmount = Math.round((pay * daRate) / 100);
  const monthlyEmoluments = pay + daAmount;

  // 1. Monthly Pension
  const fullPension = Math.round(pay / 2);
  const isEligibleForRegularPension = completedHalfYears >= 20; // 10 years minimum
  const isEligibleForFullPension = completedHalfYears >= 60; // 30 years full

  let basicServicePension = 0;
  if (isEligibleForRegularPension) {
    if (isEligibleForFullPension) {
      basicServicePension = fullPension;
    } else {
      basicServicePension = Math.round((fullPension * completedHalfYears) / 60);
    }
    basicServicePension = Math.max(MIN_PENSION_KARNATAKA, Math.min(MAX_PENSION_KARNATAKA, basicServicePension));
  }

  const dearnessRelief = Math.round((basicServicePension * daRate) / 100);
  const medicalAllowance = 0; // ವೈದ್ಯಕೀಯ ಮೊತ್ತ ಇರುವುದಿಲ್ಲ

  // 2. Commutation
  let commutedPortion = 0;
  let commutationLumpSum = 0;
  const commutationFactor = KCSR_COMMUTATION_FACTORS[ageNext] || DEFAULT_COMMUTATION_FACTOR;

  if (commOpted && basicServicePension > 0) {
    commutedPortion = Math.round((basicServicePension * commPct) / 100);
    commutationLumpSum = Math.round(commutedPortion * 12 * commutationFactor);
  }

  const reducedMonthlyPension = Math.max(0, basicServicePension - commutedPortion);
  const totalMonthlyReceivable = reducedMonthlyPension + dearnessRelief + medicalAllowance;

  // 3. Retirement Gratuity (DCRG)
  const dcrgRaw = Math.round((monthlyEmoluments / 4) * gratuityHalfYears);
  const max16HalfTimes = Math.round(monthlyEmoluments * 16.5);
  const dcrgSanctioned = Math.min(dcrgRaw, max16HalfTimes, MAX_DCRG_CEILING);
  const isDcrgCapped = dcrgRaw > MAX_DCRG_CEILING || dcrgRaw > max16HalfTimes;

  // 4. Leave Encashment
  const dailyRate = monthlyEmoluments / 30;
  const leaveEncashmentAmount = Math.round(dailyRate * elDays);
  const eligibleHplDays = Math.min(hplDays, Math.max(0, 300 - elDays));
  const halfPayEncashmentAmount = eligibleHplDays > 0 ? Math.round(dailyRate * (eligibleHplDays / 2)) : 0;
  const totalLeaveEncashment = leaveEncashmentAmount + halfPayEncashmentAmount;

  // Grand Total Terminal Benefits (Lump Sum)
  const totalTerminalBenefits = dcrgSanctioned + commutationLumpSum + totalLeaveEncashment;

  // Family Pension
  const familyPensionNormal = Math.max(MIN_PENSION_KARNATAKA, Math.round(pay * 0.30));
  const familyPensionEnhanced = Math.round(pay * 0.50);

  return {
    yearsOfService: years,
    completedHalfYears,
    gratuityHalfYears,
    lastBasicPay: pay,
    daPercentage: daRate,
    daAmount,
    monthlyEmoluments,
    fullPension,
    basicServicePension,
    dearnessRelief,
    medicalAllowance,
    isEligibleForFullPension,
    isEligibleForRegularPension,
    commutationOpted: commOpted,
    commutationPercentage: commPct,
    commutedPortion,
    commutationFactor,
    commutationLumpSum,
    reducedMonthlyPension,
    totalMonthlyReceivable,
    dcrgRaw,
    dcrgSanctioned,
    isDcrgCapped,
    earnedLeaveDays: elDays,
    leaveEncashmentAmount,
    halfPayLeaveDays: hplDays,
    halfPayEncashmentAmount,
    totalLeaveEncashment,
    totalTerminalBenefits,
    familyPensionNormal,
    familyPensionEnhanced
  };
}

export function generatePensionEstimateSlipHtml(
  est: QuickPensionEstimateResult,
  empInfo?: { name?: string; designation?: string; employeeCode?: string; kgidNumber?: string },
  office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG
): string {
  const currentDate = new Date().toLocaleDateString('kn-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalWords = numberToKannadaWords(est.totalTerminalBenefits);

  return `
  <div class="p-8 max-w-4xl mx-auto bg-white font-sans text-stone-900 print:p-2">
    <div class="border-b-2 border-stone-800 pb-4 text-center">
      <div class="text-xs font-bold uppercase tracking-wider text-amber-900">${office.departmentName}</div>
      <h1 class="text-xl font-black font-kannada mt-1">${office.officeName}</h1>
      <div class="text-xs text-stone-600 mt-0.5">${office.officeAddress} • Email: ${office.email || office.contactEmail || ''}</div>
      <div class="mt-3 inline-block bg-stone-900 text-amber-300 px-4 py-1 rounded text-xs font-bold font-kannada tracking-wide">
        ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳ ಅಂದಾಜು ಲೆಕ್ಕಾಚಾರ ಪಟ್ಟಿ (PENSION & TERMINAL BENEFITS ESTIMATE)
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 my-4 p-3 bg-stone-50 border border-stone-300 rounded text-xs">
      <div>
        <span class="text-stone-500 block">ನೌಕರರ ಹೆಸರು (Employee Name):</span>
        <strong class="text-sm font-bold text-stone-900">${empInfo?.name || 'ನೌಕರರ ವಿವರ (Employee)'}</strong>
        <div class="text-stone-600 mt-0.5">${empInfo?.designation || 'ಸರ್ಕಾರಿ ನೌಕರರು'} ${empInfo?.kgidNumber ? `• KGID: ${empInfo.kgidNumber}` : ''}</div>
      </div>
      <div class="text-right">
        <span class="text-stone-500 block">ದಿನಾಂಕ (Date of Estimate):</span>
        <strong class="font-mono-code font-bold">${currentDate}</strong>
        <div class="text-[11px] text-stone-500 mt-1">೭ನೇ ವೇತನ ಆಯೋಗ & KCSR ನಿಯಮಾವಳಿಗಳು</div>
      </div>
    </div>

    <!-- PRIMARY INPUT METRICS -->
    <div class="grid grid-cols-4 gap-2 text-center my-3 text-xs">
      <div class="p-2.5 bg-amber-50 rounded border border-amber-300">
        <span class="text-[10px] text-amber-900 font-bold block">ಅರ್ಹತಾ ಸೇವೆ (Service)</span>
        <span class="text-base font-black font-mono-code text-amber-950">${est.yearsOfService} ವರ್ಷ</span>
        <span class="text-[10px] text-stone-500 block">${est.completedHalfYears} ಅರ್ಧವಾರ್ಷಿಕಗಳು</span>
      </div>
      <div class="p-2.5 bg-emerald-50 rounded border border-emerald-300">
        <span class="text-[10px] text-emerald-900 font-bold block">ಕೊನೆಯ ಮೂಲ ವೇತನ (Basic)</span>
        <span class="text-base font-black font-mono-code text-emerald-950">${formatINR(est.lastBasicPay)}</span>
        <span class="text-[10px] text-stone-500 block">DA: ${est.daPercentage}% (${formatINR(est.daAmount)})</span>
      </div>
      <div class="p-2.5 bg-sky-50 rounded border border-sky-300">
        <span class="text-[10px] text-sky-900 font-bold block">ತಿಂಗಳ ನಿವ್ವಳ ಪಿಂಚಣಿ</span>
        <span class="text-base font-black font-mono-code text-sky-950">${formatINR(est.totalMonthlyReceivable)}</span>
        <span class="text-[10px] text-stone-500 block">ಮೂಲ: ${formatINR(est.basicServicePension)}</span>
      </div>
      <div class="p-2.5 bg-stone-900 text-amber-300 rounded border border-stone-800">
        <span class="text-[10px] uppercase font-bold block text-stone-400">ಒಟ್ಟು ನಿವೃತ್ತಿ ಇಡಿಗಂಟು</span>
        <span class="text-base font-black font-mono-code text-amber-400">${formatINR(est.totalTerminalBenefits)}</span>
        <span class="text-[10px] text-stone-400 block">Lump Sum Total</span>
      </div>
    </div>

    <!-- DETAILED FOUR BREAKDOWNS -->
    <table class="w-full text-xs border border-stone-300 border-collapse my-4">
      <thead>
        <tr class="bg-stone-100 font-bold text-stone-800">
          <th class="p-2 border border-stone-300 text-left w-12">ಕ್ರ.ಸಂ</th>
          <th class="p-2 border border-stone-300 text-left">ನಿವೃತ್ತಿ ಸೌಲಭ್ಯದ ವಿವರ (Retirement Benefit Head)</th>
          <th class="p-2 border border-stone-300 text-left">ಲೆಕ್ಕಾಚಾರದ ಸೂತ್ರ / ಆಧಾರ (Formula / Basis)</th>
          <th class="p-2 border border-stone-300 text-right w-36">ಅಂದಾಜು ಮೊತ್ತ (Amount ₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="p-2 border border-stone-300 text-center font-bold">೧</td>
          <td class="p-2 border border-stone-300 font-bold">
            ನಿವೃತ್ತಿ ಉಪದಾನ (Death-cum-Retirement Gratuity - DCRG)
          </td>
          <td class="p-2 border border-stone-300 text-stone-600">
            (ಮೂಲ ವೇತನ + DA) ÷ ೪ × ${est.gratuityHalfYears} ಅರ್ಧವಾರ್ಷಿಕ ಅವಧಿಗಳು (ಗರಿಷ್ಠ ಮಿತಿ ₹೨೦,೦೦,೦೦೦/-)
          </td>
          <td class="p-2 border border-stone-300 text-right font-mono-code font-bold text-stone-950">
            ${formatINR(est.dcrgSanctioned)}
          </td>
        </tr>
        <tr>
          <td class="p-2 border border-stone-300 text-center font-bold">೨</td>
          <td class="p-2 border border-stone-300 font-bold">
            ಪಿಂಚಣಿ ಪರಿವರ್ತನೆ ಗಂಟುಮೊತ್ತ (Commuted Value of Pension - CVP)
          </td>
          <td class="p-2 border border-stone-300 text-stone-600">
            ${est.commutationPercentage}% ರಂತೆ ಪರಿವರ್ತನೆ: ${formatINR(est.commutedPortion)} × ೧೨ × ${est.commutationFactor} (೬೧ನೇ ವಯಸ್ಸಿನ ಮೌಲ್ಯ)
          </td>
          <td class="p-2 border border-stone-300 text-right font-mono-code font-bold text-stone-950">
            ${formatINR(est.commutationLumpSum)}
          </td>
        </tr>
        <tr>
          <td class="p-2 border border-stone-300 text-center font-bold">೩</td>
          <td class="p-2 border border-stone-300 font-bold">
            ಗಳಿಕೆ ರಜೆ ನಗದೀಕರಣ (Earned Leave Encashment)
          </td>
          <td class="p-2 border border-stone-300 text-stone-600">
            ${est.earnedLeaveDays} ದಿನಗಳ ಗಳಿಕೆ ರಜೆ (ವೇತನ + DA ÷ ೩೦ ದಿನ)
          </td>
          <td class="p-2 border border-stone-300 text-right font-mono-code font-bold text-stone-950">
            ${formatINR(est.totalLeaveEncashment)}
          </td>
        </tr>
        <tr class="bg-amber-100 font-bold text-amber-950 border-t-2 border-stone-800">
          <td class="p-2.5 border border-stone-300 text-center" colspan="3">
            ಒಟ್ಟು ಅಂತಿಮ ನಿವೃತ್ತಿ ಗಂಟುಮೊತ್ತ (GRAND TOTAL TERMINAL BENEFITS):
          </td>
          <td class="p-2.5 border border-stone-300 text-right font-mono-code text-sm font-black">
            ${formatINR(est.totalTerminalBenefits)}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="p-3 bg-stone-50 border border-stone-300 rounded text-xs space-y-1">
      <div class="text-[11px] text-stone-600">ಅಕ್ಷರಗಳಲ್ಲಿ ಮೊತ್ತ (In Words):</div>
      <div class="font-bold text-stone-900 font-kannada text-sm">${totalWords} ಮಾತ್ರ.</div>
    </div>

    <div class="mt-4 p-3 bg-stone-100 rounded border border-stone-300 text-xs">
      <div class="font-bold text-stone-800 mb-1">ಮುಂದುವರಿಯುವ ಮಾಸಿಕ ಪಿಂಚಣಿ ವಿವರಗಳು (Ongoing Monthly Pension):</div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
        <div class="p-1.5 bg-white rounded border">
          <span class="text-stone-500 block">ಮೂಲ ಪಿಂಚಣಿ</span>
          <strong>${formatINR(est.basicServicePension)}</strong>
        </div>
        <div class="p-1.5 bg-white rounded border">
          <span class="text-stone-500 block">ಪರಿವರ್ತಿತ ಕಡಿತ (40%)</span>
          <strong class="text-rose-700">-${formatINR(est.commutedPortion)}</strong>
        </div>
        <div class="p-1.5 bg-white rounded border">
          <span class="text-stone-500 block">ತುಟ್ಟಿ ಭತ್ಯೆ (DA)</span>
          <strong class="text-emerald-700">+${formatINR(est.dearnessRelief)}</strong>
        </div>
        <div class="p-1.5 bg-white rounded border">
          <span class="text-stone-500 block">ವೈದ್ಯಕೀಯ ಭತ್ಯೆ</span>
          <strong>+${formatINR(est.medicalAllowance)}</strong>
        </div>
      </div>
      <div class="mt-2 text-right font-bold text-stone-900">
        ಪ್ರತಿ ತಿಂಗಳು ಕೈಗೆ ಸಿಗುವ ನಿವ್ವಳ ಮೊತ್ತ: <span class="font-mono-code text-emerald-800 text-sm">${formatINR(est.totalMonthlyReceivable)}</span>/ತಿಂಗಳಿಗೆ
      </div>
    </div>

    <div class="mt-8 pt-4 border-t border-stone-300 flex justify-between items-end text-xs">
      <div class="text-[10px] text-stone-500">
        ಗಮನಿಸಿ: ಈ ಲೆಕ್ಕಾಚಾರವು ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ನೌಕರರ ೭ನೇ ವೇತನ ಆಯೋಗದ ನಿಯಮಾನುಸಾರ ಅಂದಾಜು ವಿವರವಾಗಿದೆ.
      </div>
      <div class="text-right">
        <div class="font-bold text-stone-800">${office.officerDesignation}</div>
        <div class="text-[11px] text-stone-600">${office.officeName}</div>
      </div>
    </div>
  </div>
  `;
}

