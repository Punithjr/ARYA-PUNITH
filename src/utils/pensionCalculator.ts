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
  nonQualifyingDays?: number;
  lastBasicPay: number;
  daPercentage?: number;
  averageEmoluments?: number;
  earnedLeaveDays?: number;
  commutationOpted?: boolean;
  commutationPercentage?: number;
  ageNextBirthday?: number;
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
    completedHalfYears: cappedHalfYears
  };
}

/**
 * Computes all KCSR Pension & Terminal Benefits.
 */
export function computePensionDetails(input: PensionInputData): PensionCalculationResult {
  const {
    doa,
    dor,
    nonQualifyingDays = 0,
    lastBasicPay,
    daPercentage = DEFAULT_DA_PERCENTAGE,
    earnedLeaveDays = 300,
    commutationOpted = true,
    commutationPercentage = 40, // Standard Karnataka max 40% (or 33.33%)
    ageNextBirthday = 61
  } = input;

  const service = calculateServicePeriod(doa, dor, nonQualifyingDays);
  const basicPay = Number(lastBasicPay) || 0;
  const daRate = Number(daPercentage) || 0;
  const daAmount = Math.round((basicPay * daRate) / 100);
  const avgEmoluments = input.averageEmoluments ? Number(input.averageEmoluments) : basicPay;

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

  // Commutation Calculation
  let commutedPortion = 0;
  let commutationLumpSum = 0;
  let factor = KCSR_COMMUTATION_FACTORS[ageNextBirthday] || DEFAULT_COMMUTATION_FACTOR;

  if (commutationOpted && basicServicePension > 0) {
    const commPct = Math.min(40, Math.max(0, Number(commutationPercentage) || 0));
    commutedPortion = Math.round((basicServicePension * commPct) / 100);
    commutationLumpSum = Math.round(commutedPortion * 12 * factor);
  }

  const reducedMonthlyPension = Math.max(0, basicServicePension - commutedPortion);

  // Dearness Relief (DR): As per Karnataka Pension Rules, DR is paid on the FULL Basic Pension, not the reduced pension.
  const dearnessRelief = Math.round((basicServicePension * daRate) / 100);
  const medicalAllowance = basicServicePension > 0 ? FIXED_MEDICAL_ALLOWANCE : 0;
  const totalMonthlyReceivable = reducedMonthlyPension + dearnessRelief + medicalAllowance;

  // DCRG (Death-cum-Retirement Gratuity)
  // Formula: 1/4th of Emoluments (Basic + DA) for each completed six-monthly period of qualifying service
  // Maximum limit: 16.5 times emoluments or ₹20 Lakhs, whichever is less.
  const monthlyEmolumentsForGratuity = basicPay + daAmount;
  const dcrgRaw = Math.round((monthlyEmolumentsForGratuity / 4) * service.completedHalfYears);
  const max16HalfTimes = Math.round(monthlyEmolumentsForGratuity * 16.5);
  const dcrgSanctioned = Math.min(dcrgRaw, max16HalfTimes, MAX_DCRG_CEILING);

  // Family Pension
  // Normal: 30% of Basic Pay (subject to minimum ₹13,500)
  const familyPensionNormal = Math.max(MIN_PENSION_KARNATAKA, Math.round(basicPay * 0.30));
  // Enhanced: 50% of Basic Pay (payable for 7 years from date of retirement or till age 67)
  const familyPensionEnhanced = Math.round(basicPay * 0.50);

  // Earned Leave Encashment (up to 300 days)
  const elDays = Math.min(300, Math.max(0, Number(earnedLeaveDays) || 0));
  const leaveEncashmentAmount = Math.round(((basicPay + daAmount) / 30) * elDays);

  // Total Terminal Lump Sum
  const totalTerminalLumpSum = dcrgSanctioned + commutationLumpSum + leaveEncashmentAmount;

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

    lastBasicPay: basicPay,
    daPercentage: daRate,
    daAmount,
    averageEmoluments: avgEmoluments,

    fullPension,
    basicServicePension,
    commutedPortion,
    reducedMonthlyPension,
    dearnessRelief,
    medicalAllowance,
    totalMonthlyReceivable,

    commutationFactor: factor,
    commutationLumpSum,
    commutationRestorationYears: 15,

    dcrgRaw,
    dcrgSanctioned,

    familyPensionNormal,
    familyPensionEnhanced,

    earnedLeaveDays: elDays,
    leaveEncashmentAmount,

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
 * Universal dispatcher for any Pension Format Letter.
 */
export function renderPensionFormatHtml(
  formatType: PensionLetterFormatType,
  record: PensionCaseRecord,
  office: OfficeConfig = DEFAULT_PENSION_OFFICE_CONFIG
): string {
  switch (formatType) {
    case 'form7':
      return generateForm7Html(record, office);
    case 'form1_2':
      return generateForm1And2Html(record, office);
    case 'form6':
      return generateForm6Html(record, office);
    case 'sanction_order':
      return generateSanctionOrderHtml(record, office);
    case 'provisional_order':
      return generateProvisionalSanctionOrderHtml(record, office);
    case 'commutation_order':
      return generateCommutationOrderHtml(record, office);
    case 'ag_forwarding':
      return generateAgForwardingLetterHtml(record, office);
    case 'no_dues_cert':
      return generateNoDuesCertificateHtml(record, office);
    default:
      return generateForm7Html(record, office);
  }
}
