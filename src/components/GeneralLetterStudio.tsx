import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  Copy,
  Save,
  RefreshCw,
  Sparkles,
  Eye,
  Edit3,
  Search,
  Trash2,
  Calendar,
  User,
  Building2,
  FileCheck2,
  ArrowRight,
  ShieldAlert,
  Inbox,
  Send,
  HelpCircle,
  FileCode,
  Users,
} from 'lucide-react';
import { GeneratedOfficeLetter, GeneralLetterCategory, GeneralLetterFormData, Employee } from '../types';
import { PrintPreviewModal } from './PrintPreviewModal';

interface GeneralLetterStudioProps {
  currentUser?: { displayName: string; role: string } | null;
  employees?: Employee[];
  prefilledEmployee?: Employee | null;
  onSaveToRegistry?: (letterData: any) => Promise<void>;
  prefilledLetter?: any;
}

export const GeneralLetterStudio: React.FC<GeneralLetterStudioProps> = ({
  currentUser,
  employees = [],
  prefilledEmployee,
  onSaveToRegistry,
  prefilledLetter,
}) => {
  // Category selection: strictly 'employee' (ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ) or 'other' (ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರ)
  const [category, setCategory] = useState<GeneralLetterCategory>('employee');
  const [empPickerFilter, setEmpPickerFilter] = useState('');
  const [showEmpPicker, setShowEmpPicker] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Dynamic DDO Signatory State
  const [ddoOfficer, setDdoOfficer] = useState<{
    name: string;
    designation: string;
    office: string;
    code: string;
  }>(() => {
    const emp = employees?.find(e => e.isDdo === true) ||
                employees?.find(e => e.designation?.toLowerCase().includes('ddo')) ||
                employees?.find(e => e.designation?.includes('ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿ'));
    return {
      name: emp?.fullName || 'ಹೆಚ್. ರವಿಕುಮಾರ್',
      designation: emp?.designation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಡಿಡಿಓ',
      office: emp?.placeOfWork || emp?.officeLocation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
      code: emp?.ddoCode || '14041ED001',
    };
  });

  useEffect(() => {
    const ddoEmp = employees.find(e => e.isDdo === true) || 
                   employees.find(e => e.designation?.toLowerCase().includes('ddo')) ||
                   employees.find(e => e.designation?.includes('ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿ'));
    fetch('/api/memorandum/office-config')
      .then(res => res.json())
      .then(data => {
        const cfg = data.office || data.config || null;
        if (ddoEmp) {
          setDdoOfficer({
            name: ddoEmp.fullName,
            designation: ddoEmp.designation || cfg?.ddoDesignation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಡಿಡಿಓ',
            office: ddoEmp.placeOfWork || ddoEmp.officeLocation || cfg?.ddoOfficeName || cfg?.officeNameKannada || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
            code: ddoEmp.ddoCode || cfg?.ddoCode || '14041ED001',
          });
        } else if (cfg && (cfg.ddoOfficerName || cfg.officerName)) {
          setDdoOfficer({
            name: cfg.ddoOfficerName || cfg.officerName,
            designation: cfg.ddoDesignation || cfg.officerDesignation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು & ಡಿಡಿಓ',
            office: cfg.ddoOfficeName || cfg.officeNameKannada || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
            code: cfg.ddoCode || '14041ED001',
          });
        }
      })
      .catch(() => {
        if (ddoEmp) {
          setDdoOfficer({
            name: ddoEmp.fullName,
            designation: ddoEmp.designation,
            office: ddoEmp.placeOfWork || ddoEmp.officeLocation || 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ ತಾಲ್ಲೂಕು',
            code: ddoEmp.ddoCode || '14041ED001',
          });
        }
      });
  }, [employees]);

  // Form states
  const [formData, setFormData] = useState<GeneralLetterFormData>({
    category: 'employee',
    fileNumber: '57',
    employeeName: '',
    kgidNumber: '',
    designation: '',
    officeName: 'ಸರ್ಕಾರಿ ಶಾಲೆ / ಕಚೇರಿ, ಭದ್ರಾವತಿ',
    employeeDetails: '',
    recipient: 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಎಲ್ಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು / ಪ್ರಾಂಶುಪಾಲರು',
    mainContent: '',
    otherInstructions: '',
    subject: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    additionalPrompt: 'ಈ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ ತಯಾರಿಸಿ.',
  });

  // Clean single "ಸಂ:" helper preventing any double "ಸಂ: ಸಂ:"
  const formatCleanSam = (str?: string) => {
    if (!str) return 'ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಇತರೆ/57/2026-27';
    const clean = str.replace(/^(ಸಂ\s*:\s*)+/gi, '').trim();
    return `ಸಂ: ${clean}`;
  };

  // Render recipient lines cleanly under "ರಿಗೆ:"
  const renderRecipientLines = (recText?: string, cat?: string, letter?: GeneratedOfficeLetter | null) => {
    if (recText && recText.trim()) {
      const cleaned = recText.replace(/^(ಇವರಿಗೆ\s*,?|ರಿಗೆ\s*:?)/gi, '').trim();
      const lines = cleaned.includes('\n') 
        ? cleaned.split('\n').map(l => l.trim()).filter(Boolean)
        : cleaned.split(',').map(l => l.trim()).filter(Boolean);
      return lines.map((line, idx) => (
        <div key={idx} className="font-medium text-stone-900">{line}</div>
      ));
    }
    if (cat === 'employee') {
      return (
        <div className="space-y-0.5">
          <div className="font-bold text-stone-950">ಶ್ರೀ/ಶ್ರೀಮತಿ {letter?.employeeName || formData.employeeName || '[ನೌಕರರ ಹೆಸರು]'},</div>
          <div>{letter?.designation || formData.designation || '[ಹುದ್ದೆ]'},</div>
          <div>{letter?.officeName || formData.officeName || 'ಸರ್ಕಾರಿ ಕಛೇರಿ / ಶಾಲೆ, ಭದ್ರಾವತಿ'}</div>
          {(letter?.kgidNumber || formData.kgidNumber) && (
            <div className="font-mono text-stone-600">(ಕೆಜಿಐಡಿ: {letter?.kgidNumber || formData.kgidNumber})</div>
          )}
        </div>
      );
    }
    return <div className="font-medium text-stone-900">ಸಂಬಂಧಪಟ್ಟ ಅಧಿಕಾರಿಗಳು / ಮುಖ್ಯಸ್ಥರು</div>;
  };

  // Render reference lines cleanly with numbered points
  const renderReferenceLines = (refText?: string) => {
    if (!refText) return null;
    const lines = refText.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map((line, idx) => (
      <div key={idx} className="text-xs text-stone-800">{line}</div>
    ));
  };

  // Sync prefilledEmployee
  useEffect(() => {
    if (prefilledEmployee) {
      setCategory('employee');
      const fileNo = formData.fileNumber || '57';
      const secCode = formData.sectionCode || 'ಆ2';
      const secName = formData.sectionName || 'ಸ.ಪ್ರಾ.ಶಿ';
      const employeeName = prefilledEmployee.fullName;
      const kgid = prefilledEmployee.kgidNumber || prefilledEmployee.employeeCode || '';
      const desig = prefilledEmployee.designation;
      const workPlace = prefilledEmployee.placeOfWork || prefilledEmployee.officeLocation || 'ಸರ್ಕಾರಿ ಶಾಲೆ / ಕಚೇರಿ, ಭದ್ರಾವತಿ';
      const details = `ವೇತನ ಶ್ರೇಣಿ: ${prefilledEmployee.payScale || '-'}, ಮೂಲ ವೇತನ: ₹${(prefilledEmployee.basicPay || 0).toLocaleString('en-IN')}, ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ: ${prefilledEmployee.joiningDate || prefilledEmployee.appointmentDate || '-'}, ಗಳಿಕೆ ರಜೆ ಶಿಲ್ಕು: ${prefilledEmployee.earnedLeaveBalance || 0} ದಿನಗಳು`;
      const subj = `ಶ್ರೀ/ಶ್ರೀಮತಿ ${employeeName}, ${desig}, ${workPlace} (ಕೆ.ಜಿ.ಐ.ಡಿ: ${kgid || '-'}) ರವರ ಕುರಿತು ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ.`;
      const rec = 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಎಲ್ಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು / ಪ್ರಾಂಶುಪಾಲರು, ಭದ್ರಾವತಿ';
      const ref = `೧. ನೌಕರರ ಸೇವಾ ಪುಸ್ತಿಕೆ ಮತ್ತು ರಜೆ / ವೇತನ ದಾಖಲಾತಿ ದಿನಾಂಕ: ${new Date().toISOString().split('T')[0]}.\n೨. ಈ ಕಚೇರಿಯ ಆದೇಶಗಳ ಕಡತ ಸಂಖ್ಯೆ: ${fileNo}.`;
      const todayStr = new Date().toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        category: 'employee',
        employeeName,
        kgidNumber: kgid,
        designation: desig,
        officeName: workPlace,
        employeeDetails: details,
        subject: subj,
        recipient: prev.recipient || rec,
        reference: prev.reference || ref,
      }));

      // Immediately populate generatedLetter so there is zero flinch or blank flicker
      const initialDraft: GeneratedOfficeLetter = {
        id: `gen-let-${Date.now()}`,
        documentId: `GL-${Date.now().toString().slice(-4)}`,
        letterNumber: `ಸಂ: ${secCode}/${secName}/ಇತರೆ/${fileNo}/2026-27`,
        date: todayStr,
        letterType: 'ಸಾಮಾನ್ಯ ಪತ್ರ',
        letterCategory: 'normal',
        userPrompt: 'ಸಾಮಾನ್ಯ ಕಚೇರಿ ಪತ್ರ',
        ocrExtracted: {
          confidenceScore: 100,
          extractedEntities: {},
        } as any,
        recipient: rec,
        subject: subj,
        reference: ref,
        bodyText: `ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸುತ್ತಿರುವ ಶ್ರೀ/ಶ್ರೀಮತಿ ${employeeName}, ${desig} (ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ: ${kgid || '-'}) ರವರ ಸೇವಾ ಹಾಗೂ ಅಧಿಕೃತ ವಿಷಯಗಳ ಕುರಿತಂತೆ ಈ ಮೂಲಕ ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರವನ್ನು ಹೊರಡಿಸಲಾಗಿದೆ. ಸದರಿ ನೌಕರರ ಸೇವಾ ದಾಖಲೆಗಳು ಹಾಗೂ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಅಗತ್ಯ ಮುಂದಿನ ಕ್ರಮ ಜರುಗಿಸಲು ಸೂಚಿಸಲಾಗಿದೆ.`,
        bodyHtml: `<p>ಮೇಲ್ಕಂಡ ವಿಷಯ ಹಾಗೂ ಉಲ್ಲೇಖಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸುತ್ತಿರುವ ಶ್ರೀ/ಶ್ರೀಮತಿ <strong>${employeeName}</strong>, ${desig} (ಕೆ.ಜಿ.ಐ.ಡಿ ಸಂಖ್ಯೆ: <strong>${kgid || '-'}</strong>) ರವರ ಸೇವಾ ಹಾಗೂ ಅಧಿಕೃತ ವಿಷಯಗಳ ಕುರಿತಂತೆ ಈ ಮೂಲಕ ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರವನ್ನು ಹೊರಡಿಸಲಾಗಿದೆ.</p><p class="mt-2">ಸದರಿ ನೌಕರರ ಸೇವಾ ದಾಖಲೆಗಳು ಹಾಗೂ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಅಗತ್ಯ ಮುಂದಿನ ಕ್ರಮ ಜರುಗಿಸಲು ಸೂಚಿಸಲಾಗಿದೆ.</p>`,
        endorsements: [
          `೧. ಶ್ರೀ/ಶ್ರೀಮತಿ ${employeeName}, ${desig} ರವರಿಗೆ ಮಾಹಿತಿಗಾಗಿ.`,
          `೨. ಸಂಬಂಧಪಟ್ಟ ಶಾಲಾ ಮುಖ್ಯಸ್ಥರು / ಕಚೇರಿ ಅಧೀಕ್ಷಕರು, ಭದ್ರಾವತಿ.`,
          `೩. ಕಚೇರಿಯ ಕಡತ ಸಂಖ್ಯೆ: ${fileNo}.`
        ],
        signatory: {
          name: ddoOfficer.name,
          designation: ddoOfficer.designation,
          office: ddoOfficer.office,
        },
        employeeName,
        designation: desig,
        kgidNumber: kgid,
        officeName: workPlace,
        status: 'Draft',
        createdBy: currentUser?.displayName || 'ಆಡಳಿತ ಶಾಖೆ',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        currentVersion: 1,
        versions: [],
      };

      setGeneratedLetter(initialDraft);
      setEditSubject(initialDraft.subject);
      setEditReference(initialDraft.reference);
      setEditRecipient(initialDraft.recipient || '');
      setEditBodyText(initialDraft.bodyText);
      setEditBodyHtml(initialDraft.bodyHtml);
      setActiveViewMode('preview');
    }
  }, [prefilledEmployee]);

  // OCR Upload States
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [ocrExtractedData, setOcrExtractedData] = useState<any | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation & View states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'preview' | 'edit'>('preview');
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedOfficeLetter | null>(null);

  // In-line editing states
  const [editSubject, setEditSubject] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editRecipient, setEditRecipient] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [editBodyText, setEditBodyText] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Recent General Letters
  const [savedGeneralLetters, setSavedGeneralLetters] = useState<GeneratedOfficeLetter[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Fetch saved general letters
  const fetchGeneralLetters = async () => {
    try {
      setIsLoadingSaved(true);
      const res = await fetch('/api/letter-maker/letters');
      if (res.ok) {
        const data = await res.json();
        // Filter specifically for General Letters
        const generalList = (data.letters || []).filter(
          (l: any) =>
            l.letterType === 'ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ' ||
            l.letterType === 'ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರ' ||
            l.letterType === 'ಸಾಮಾನ್ಯ ಪತ್ರ'
        );
        setSavedGeneralLetters(generalList);
      }
    } catch (err) {
      console.error('Failed to fetch general letters:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchGeneralLetters();
  }, []);

  useEffect(() => {
    if (prefilledLetter) {
      const cat = prefilledLetter.category === 'employee' ? 'employee' : 'other';
      setCategory(cat);
      setFormData(prev => ({
        ...prev,
        category: cat,
        recipient: prefilledLetter.recipient || prev.recipient,
        subject: prefilledLetter.subject || prev.subject,
        reference: prefilledLetter.reference || prev.reference,
        mainContent: prefilledLetter.mainContent || prefilledLetter.body || prev.mainContent,
        otherInstructions: prefilledLetter.otherInstructions || prev.otherInstructions,
        officeName: prefilledLetter.officeName || prev.officeName,
        date: prefilledLetter.date || new Date().toISOString().split('T')[0],
      }));
      if (prefilledLetter.subject) setEditSubject(prefilledLetter.subject);
      if (prefilledLetter.recipient) setEditRecipient(prefilledLetter.recipient);
      if (prefilledLetter.reference) setEditReference(prefilledLetter.reference);
      showToast('ಪತ್ರದ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ.');
    }
  }, [prefilledLetter]);

  // Update category and sync form state
  const handleCategoryChange = (newCat: GeneralLetterCategory) => {
    setCategory(newCat);
    setFormData((prev) => ({
      ...prev,
      category: newCat,
      subject: '',
      reference: '',
    }));
  };

  // Handle Input Changes
  const handleInputChange = (field: keyof GeneralLetterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // File Upload & OCR Reader
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.includes('image') && !file.type.includes('pdf')) {
      showToast('ದಯವಿಟ್ಟು PDF ಅಥವಾ JPG/PNG ಫೈಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.');
      return;
    }

    setUploadedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
    });
    setIsOcrProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;

        const res = await fetch('/api/letter-maker/ocr-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Content,
            fileName: file.name,
            mimeType: file.type,
          }),
        });

        if (!res.ok) {
          throw new Error('ದಾಖಲೆ ಓದುವಿಕೆಯಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.');
        }

        const data = await res.json();
        const ocr = data.extractedData;
        setOcrExtractedData(ocr);

        // Auto-fill fields based on extracted OCR
        setFormData((prev) => ({
          ...prev,
          employeeName: ocr.employeeName || prev.employeeName,
          kgidNumber: ocr.kgidNumber || prev.kgidNumber,
          designation: ocr.designation || prev.designation,
          officeName: ocr.officeName || prev.officeName,
          subject: ocr.subject || prev.subject,
          reference: ocr.reference || prev.reference,
          date: ocr.date || prev.date,
          employeeDetails: ocr.otherInfo || ocr.rawText?.substring(0, 300) || prev.employeeDetails,
          mainContent: ocr.otherInfo || ocr.rawText?.substring(0, 300) || prev.mainContent,
        }));

        showToast('ದಾಖಲೆಯ ಮಾಹಿತಿಯನ್ನು OCR ಮೂಲಕ ಯಶಸ್ವಿಯಾಗಿ ಓದಲಾಗಿದೆ.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      showToast('OCR ಓದುವಿಕೆ ವಿಫಲವಾಗಿದೆ: ' + err.message);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Preset Sample Scenarios for Testing
  const handleLoadSample = (sampleType: 'emp_service' | 'emp_doc' | 'other_circular' | 'other_repair') => {
    if (sampleType === 'emp_service') {
      setCategory('employee');
      setFormData({
        category: 'employee',
        employeeName: 'ಶ್ರೀ ರಮೇಶ್ ಎನ್.',
        kgidNumber: '1128456',
        designation: 'ಸಹಾಯಕ ಶಿಕ್ಷಕರು',
        officeName: 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ',
        subject: 'ಶ್ರೀ ರಮೇಶ್ ಎನ್., ಸಹಾಯಕ ಶಿಕ್ಷಕರು ರವರ ಸೇವಾ ವಿವರ ಹಾಗೂ ದಾಖಲೆ ಪರಿಶೀಲನೆ ಕುರಿತು.',
        reference: '೧. ಈ ಕಚೇರಿಯ ಕಡತ ಸಂಖ್ಯೆ: ಬಿಇಒ/ಭದ್ರಾ/ಸಿ೨/ಸಿಬ್ಬಂದಿ-೪೨/೨೦೨೬-೨೭.\n೨. ನೌಕರರ ಮನವಿ ದಿನಾಂಕ: ೦೧-೦೮-೨೦೨೬.',
        employeeDetails: 'ಸದರಿ ಶಿಕ್ಷಕರು ತಮ್ಮ ಸೇವಾ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಹಿಂದಿನ ಶಾಲೆಯ ಸೇವಾ ವಿವರ ಮತ್ತು ವೇತನ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಸಲ್ಲಿಸುವಂತೆ ಕೋರಿರುತ್ತಾರೆ. ಅವರ ಮೂಲ ಸೇವಾ ಪುಸ್ತಕದ ದಾಖಲಾತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ವರದಿ ನೀಡಬೇಕಾಗಿದೆ.',
        recipient: '',
        mainContent: '',
        otherInstructions: '',
        date: new Date().toISOString().split('T')[0],
        additionalPrompt: 'ಈ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ ತಯಾರಿಸಿ.',
      });
      showToast('ಮಾದರಿ ೧ (ನೌಕರರ ಸೇವಾ ವಿವರ) ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ.');
    } else if (sampleType === 'emp_doc') {
      setCategory('employee');
      setFormData({
        category: 'employee',
        employeeName: 'ಶ್ರೀಮತಿ ಮಂಜುಳಾ ಕೆ. ಎಸ್.',
        kgidNumber: '984521',
        designation: 'ಮುಖ್ಯ ಶಿಕ್ಷಕರು',
        officeName: 'ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ, ಕಾಗದನಗರ, ಭದ್ರಾವತಿ',
        subject: 'ಶ್ರೀಮತಿ ಮಂಜುಳಾ ಕೆ. ಎಸ್., ಮುಖ್ಯ ಶಿಕ್ಷಕರು ರವರಿಂದ ಶೈಕ್ಷಣಿಕ ದಾಖಲೆ ಸಲ್ಲಿಕೆ ಕೋರಿಕೆ.',
        reference: '೧. ಜಿಪಂ ಉಪನಿರ್ದೇಶಕರ (ಆಡಳಿತ) ಪತ್ರ ಸಂಖ್ಯೆ: ಡಿಡಿಪಿಐ/ಆಡಳಿತ/೨೦೨೬ ದಿನಾಂಕ: ೧೫-೦೭-೨೦೨೬.',
        employeeDetails: 'ಪ್ರಸ್ತುತ ಶೈಕ್ಷಣಿಕ ಸಾಲಿನಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲಾತಿ ಹಾಗೂ ಹಾಜರಾತಿ ಪ್ರಗತಿ ವರದಿಯನ್ನು ಶಾಲಾ ಮುಖ್ಯಸ್ಥರು ಕಚೇರಿಗೆ ನಿಯಮಾನುಸಾರ ೩ ದಿನಗಳೊಳಗಾಗಿ ಖುದ್ದಾಗಿ ಸಲ್ಲಿಸಲು ಸೂಚಿಸುವುದು.',
        recipient: '',
        mainContent: '',
        otherInstructions: '',
        date: new Date().toISOString().split('T')[0],
        additionalPrompt: 'ಈ ಪತ್ರವನ್ನು ಸರಳವಾದ ಸರ್ಕಾರಿ ಕಚೇರಿ ಭಾಷೆಯಲ್ಲಿ ತಯಾರಿಸಿ.',
      });
      showToast('ಮಾದರಿ ೨ (ದಾಖಲೆ ಸಲ್ಲಿಕೆ ಪತ್ರ) ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ.');
    } else if (sampleType === 'other_circular') {
      setCategory('other');
      setFormData({
        category: 'other',
        employeeName: '',
        kgidNumber: '',
        designation: '',
        officeName: '',
        employeeDetails: '',
        recipient: 'ಭದ್ರಾವತಿ ಶೈಕ್ಷಣಿಕ ವಲಯದ ಎಲ್ಲಾ ಸರ್ಕಾರಿ / ಅನುದಾನಿತ ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರುಗಳು',
        subject: '೨೦೨೬-೨೭ ನೇ ಸಾಲಿನ ಶಾಲಾ ವಾರ್ಷಿಕ ಕ್ರೀಡಾಕೂಟ ಹಾಗೂ ಪ್ರತಿಭಾ ಕಾರಂಜಿ ಆಯೋಜನೆ ಕುರಿತು ಸುತ್ತೋಲೆ.',
        reference: '೧. ಆಯುಕ್ತರು, ಶಾಲಾ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಬೆಂಗಳೂರು ರವರ ಜ್ಞಾಪನ ಸಂಖ್ಯೆ: ಇಡಿ/ಕ್ರೀಡೆ/೨೦೨೬ ದಿನಾಂಕ: ೨೫-೦೭-೨೦೨೬.',
        mainContent: 'ಭದ್ರಾವತಿ ತಾಲೂಕು ಮಟ್ಟದ ವಾರ್ಷಿಕ ಕ್ರೀಡಾಕೂಟ ಮತ್ತು ಪ್ರತಿಭಾ ಕಾರಂಜಿ ಸ್ಪರ್ಧೆಗಳನ್ನು ದಿನಾಂಕ: ೨೨-೦೯-೨೦೨೬ ರಂದು ತಾಲೂಕು ಕ್ರೀಡಾಂಗಣದಲ್ಲಿ ಆಯೋಜಿಸಲಾಗಿದ್ದು, ಎಲ್ಲಾ ಶಾಲೆಗಳು ತಮ್ಮ ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿಯನ್ನು ದಿನಾಂಕ: ೧೫-೦೯-೨೦೨೬ ರೊಳಗೆ ಕಚೇರಿಗೆ ಸಲ್ಲಿಸತಕ್ಕದ್ದು.',
        otherInstructions: 'ಸ್ಪರ್ಧಾ ನಿಯಮಾವಳಿಗಳನ್ನು ಶಾಲಾ ಸೂಚನಾ ಫಲಕದಲ್ಲಿ ಪ್ರಕಟಿಸುವುದು ಮತ್ತು ದೈಹಿಕ ಶಿಕ್ಷಣ ಶಿಕ್ಷಕರಿಗೆ ಅಗತ್ಯ ಜವಾಬ್ದಾರಿ ಹಂಚಿಕೆ ಮಾಡುವುದು.',
        date: new Date().toISOString().split('T')[0],
        additionalPrompt: 'ಈ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ ತಯಾರಿಸಿ.',
      });
      showToast('ಮಾದರಿ ೩ (ಇತರೆ ಸುತ್ತೋಲೆ ಪತ್ರ) ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ.');
    } else {
      setCategory('other');
      setFormData({
        category: 'other',
        employeeName: '',
        kgidNumber: '',
        designation: '',
        officeName: '',
        employeeDetails: '',
        recipient: 'ಕಾರ್ಯನಿರ್ವಾಹಕ ಇಂಜಿನಿಯರ್, ಪಂಚಾಯತ್ ರಾಜ್ ಇಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ, ಭದ್ರಾವತಿ',
        subject: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ಜನ್ನಾಪುರ ಶಾಲಾ ಕೊಠಡಿ ದುರಸ್ತಿ ಕೈಗೊಳ್ಳುವ ಕುರಿತು ಪ್ರಸ್ತಾವನೆ.',
        reference: '೧. ಶಾಲಾಭಿವೃದ್ಧಿ ಮತ್ತು ಮೇಲುಸ್ತುವಾರಿ ಸಮಿತಿ (SDMC) ನಿರ್ಣಯ ದಿನಾಂಕ: ೧೨-೦೬-೨೦೨೬.\n೨. ಈ ಕಚೇರಿಯ ಸ್ಥಳ ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿ ದಿನಾಂಕ: ೨೦-೦೬-೨೦೨೬.',
        mainContent: 'ಜನ್ನಾಪುರ ಶಾಲೆಯ ಎರಡು ಹಳೆಯ ಕೊಠಡಿಗಳ ಮೇಲ್ಛಾವಣಿ ಮಳೆಗಾಲದಲ್ಲಿ ಸೋರುತ್ತಿದ್ದು, ವಿದ್ಯಾರ್ಥಿಗಳ ಸುರಕ್ಷತೆಯ ದೃಷ್ಟಿಯಿಂದ ತುರ್ತು ದುರಸ್ತಿ ಕಾರ್ಯ ಕೈಗೊಳ್ಳಲು ಅಂದಾಜು ಪಟ್ಟಿ ಸಿದ್ಧಪಡಿಸಿ ಕಾಮಗಾರಿ ಆರಂಭಿಸಲು ಕೋರಿದೆ.',
        otherInstructions: 'ಕಾಮಗಾರಿಯ ಅಂದಾಜು ವೆಚ್ಚದ ತಾಂತ್ರಿಕ ಮಂಜೂರಾತಿ ಪ್ರತಿಯನ್ನು ಶಾಲಾ ಕಚೇರಿಗೆ ಒದಗಿಸುವುದು.',
        date: new Date().toISOString().split('T')[0],
        additionalPrompt: 'ಅಧಿಕೃತ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಕಚೇರಿ ಶೈಲಿಯಲ್ಲಿ ವಿಸ್ತೃತ ಪತ್ರ ತಯಾರಿಸಿ.',
      });
      showToast('ಮಾದರಿ ೪ (ದುರಸ್ತಿ ಪ್ರಸ್ತಾವನೆ ಪತ್ರ) ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ.');
    }
  };

  // Generate General Letter with AI
  const handleGenerateLetter = async () => {
    // Workflow Enforcement: "ಮೊದಲು ಯಾವುದೇ ಪತ್ರ ತಯಾರಿಸುವ ಮೊದಲು ಕಡತ ತಯಾರಿಸಬೇಕು ನಂತರ ಪತ್ರ ತಯಾರಿಸಬೇಕು"
    if (!formData.fileNumber || !formData.fileNumber.trim()) {
      showToast('ಕಡ್ಡಾಯ ನಿಯಮಾವಳಿ: ಮೊದಲು ಕಡತ ತಯಾರಿಸಬೇಕು ನಂತರ ಪತ್ರ ತಯಾರಿಸಬೇಕು! ದಯವಿಟ್ಟು ಕಡತ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.');
      return;
    }

    // Validation
    if (category === 'employee') {
      if (!formData.employeeName.trim()) {
        showToast('ದಯವಿಟ್ಟು ನೌಕರರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.');
        return;
      }
      if (!formData.subject.trim()) {
        showToast('ದಯವಿಟ್ಟು ಪತ್ರದ ವಿಷಯವನ್ನು ನಮೂದಿಸಿ.');
        return;
      }
    } else {
      if (!formData.recipient.trim()) {
        showToast('ದಯವಿಟ್ಟು "ಯಾರಿಗೆ" (ಸ್ವೀಕೃತದಾರರ ವಿವರ) ನಮೂದಿಸಿ.');
        return;
      }
      if (!formData.subject.trim()) {
        showToast('ದಯವಿಟ್ಟು ಪತ್ರದ ವಿಷಯವನ್ನು ನಮೂದಿಸಿ.');
        return;
      }
    }

    setIsGenerating(true);

    try {
      const payload = {
        category,
        fileNumber: formData.fileNumber || '57',
        employeeName: formData.employeeName,
        kgidNumber: formData.kgidNumber,
        designation: formData.designation,
        officeName: formData.officeName,
        recipient: formData.recipient,
        subject: formData.subject,
        reference: formData.reference,
        details: formData.employeeDetails,
        mainContent: formData.mainContent,
        otherInstructions: formData.otherInstructions,
        date: formData.date,
        additionalPrompt: formData.additionalPrompt,
        ocrData: ocrExtractedData,
      };

      const res = await fetch('/api/general-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('ಸಾಮಾನ್ಯ ಪತ್ರ ಸೃಜಿಸುವಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.');
      }

      const data = await res.json();
      const letter: GeneratedOfficeLetter = data.letter;

      setGeneratedLetter(letter);

      // Sync editable states
      setEditSubject(letter.subject);
      setEditReference(letter.reference);
      setEditRecipient(letter.recipient || '');
      setEditBodyHtml(letter.bodyHtml);
      setEditBodyText(letter.bodyText);

      setActiveViewMode('preview');
      showToast(data.message || 'ಸಾಮಾನ್ಯ ಪತ್ರ ಯಶಸ್ವಿಯಾಗಿ ಸಿದ್ಧಗೊಂಡಿದೆ.');
      fetchGeneralLetters();
    } catch (err: any) {
      console.error(err);
      showToast('ದೋಷ: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply In-line Edits
  const handleApplyEdits = () => {
    if (!generatedLetter) return;

    const updated: GeneratedOfficeLetter = {
      ...generatedLetter,
      subject: editSubject,
      reference: editReference,
      recipient: editRecipient,
      bodyHtml: editBodyHtml,
      bodyText: editBodyText || editBodyHtml.replace(/<[^>]+>/g, ''),
      lastUpdated: new Date().toISOString(),
    };

    setGeneratedLetter(updated);
    setActiveViewMode('preview');
    showToast('ತಿದ್ದುಪಡಿಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅನ್ವಯಿಸಲಾಗಿದೆ.');
  };

  // Save Letter to Storage
  const handleSaveLetter = async () => {
    if (!generatedLetter) return;
    setIsSaving(true);
    try {
      const letterToSave = {
        ...generatedLetter,
        subject: editSubject || generatedLetter.subject,
        reference: editReference || generatedLetter.reference,
        recipient: editRecipient || generatedLetter.recipient,
        bodyHtml: editBodyHtml || generatedLetter.bodyHtml,
        bodyText: editBodyText || generatedLetter.bodyText,
        status: 'Finalized',
      };

      const res = await fetch('/api/letter-maker/letters/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letterToSave),
      });

      if (!res.ok) {
        throw new Error('ಪತ್ರ ಉಳಿಸುವಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ.');
      }

      const data = await res.json();
      if (data.letter) {
        setGeneratedLetter(data.letter);
      }

      // Link and save directly to file docket in e-Dak registry
      if (onSaveToRegistry) {
        await onSaveToRegistry({
          direction: 'outward',
          referenceNumber: letterToSave.letterNumber,
          senderName: 'ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು, ಭದ್ರಾವತಿ',
          senderDepartment: 'ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ',
          recipientName: letterToSave.recipient || (category === 'employee' ? letterToSave.employeeName : 'ಸಂಬಂಧಪಟ್ಟವರು'),
          recipientDepartment: letterToSave.officeName || 'ಸರ್ಕಾರಿ ಶಾಲೆ / ಕಚೇರಿ, ಭದ್ರಾವತಿ',
          recipientDesignation: letterToSave.designation || 'ಅಧಿಕಾರಿಗಳು / ಮುಖ್ಯಸ್ಥರು',
          subject: letterToSave.subject,
          category: category === 'employee' ? 'Establishment & Service' : 'General Circular',
          section: 'ಸ.ಪ್ರಾ.ಶಿ (ಆ2)',
          priority: 'Normal',
          status: 'Dispatched',
          fileNumber: formData.fileNumber || '57',
          dateReceivedOrIssued: letterToSave.date || new Date().toISOString().split('T')[0],
          bodyText: letterToSave.bodyText,
          createdBy: (currentUser as any)?.id || (currentUser as any)?.username || currentUser?.displayName || 'User-1',
        });
      }

      showToast('ಪತ್ರವನ್ನು ಕಡತಾಗಾರದಲ್ಲಿ ಹಾಗೂ ಕಡತ ನಿರ್ವಹಣೆಯಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ.');
      fetchGeneralLetters();
    } catch (err: any) {
      console.error(err);
      showToast('ದೋಷ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Word (.docx) Download
  const handleDownloadDocx = () => {
    if (!generatedLetter?.id) {
      showToast('ದಯವಿಟ್ಟು ಮೊದಲು ಪತ್ರವನ್ನು ಉಳಿಸಿ.');
      return;
    }
    window.open(`/api/letter-maker/letters/${generatedLetter.id}/download-docx`, '_blank');
    showToast('Microsoft Word (.docx) ಡೌನ್‌ಲೋಡ್ ಆರಂಭವಾಗಿದೆ.');
  };

  // Print Document (Opens A4 Print Preview Modal first)
  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  // PDF Download (Opens A4 Print Preview Modal with print guidance)
  const handleDownloadPdf = () => {
    setIsPrintPreviewOpen(true);
    showToast('A4 ಪ್ರಿಂಟ್ ಪ್ರಿವ್ಯೂ ತೆರೆಯಲಾಗಿದೆ. "ಮುದ್ರಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ "Save as PDF" ಆಯ್ಕೆಮಾಡಿ.');
  };

  // Copy Plain Text
  const handleCopyText = () => {
    if (!generatedLetter) return;
    const textToCopy =
      generatedLetter.bodyText ||
      document.getElementById('general-letter-paper')?.innerText ||
      '';
    navigator.clipboard.writeText(textToCopy);
    showToast('ಪತ್ರದ ಪಠ್ಯವನ್ನು ನಕಲಿಸಲಾಗಿದೆ (Copied to Clipboard).');
  };

  // Load a previously saved letter
  const handleLoadSavedLetter = (saved: GeneratedOfficeLetter) => {
    setGeneratedLetter(saved);
    setCategory(saved.letterType === 'ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ' ? 'employee' : 'other');
    setEditSubject(saved.subject);
    setEditReference(saved.reference);
    setEditRecipient(saved.recipient || '');
    setEditBodyHtml(saved.bodyHtml);
    setEditBodyText(saved.bodyText);
    setActiveViewMode('preview');
    showToast(`ಪತ್ರ ಸಂಖ್ಯೆ: ${saved.letterNumber} ಲೋಡ್ ಮಾಡಲಾಗಿದೆ.`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="general-letter-toast"
          className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl border border-stone-800 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Module Title & Scope Discipline */}
      <div className="card-brutal p-5 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#2b2b2b] text-[#f59e0b] border border-[#2b2b2b]">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2b2b2b] tracking-tight">
                ಸಾಮಾನ್ಯ ಪತ್ರ ತಯಾರಿಸಿ (General Letter Studio)
              </h1>
              <span className="label-secondary">
                ಅಧಿಕೃತ ಪತ್ರ ವ್ಯವಸ್ಥೆ
              </span>
            </div>
            <p className="text-xs text-[#2b2b2b]/80 leading-relaxed max-w-3xl font-kannada">
              ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆಯ ಅಧಿಕೃತ ಕಚೇರಿ ಸಾಮಾನ್ಯ ಪತ್ರಗಳನ್ನು ಸೃಜಿಸುವ ಪ್ರತ್ಯೇಕ ಘಟಕ.
              ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರಗಳು ಹಾಗೂ ಸಾರ್ವಜನಿಕ/ಇತರೆ ಸಾಮಾನ್ಯ ಕಚೇರಿ ಪತ್ರಗಳನ್ನು ನೇರವಾಗಿ ಅಥವಾ OCR ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮೂಲಕ ತಯಾರಿಸಬಹುದು.
            </p>
          </div>

          {/* Rule 6 Enforcement Badge */}
          <div className="bg-[#fffbf2] border-2 border-[#2b2b2b] rounded-lg p-3 max-w-sm text-xs text-[#2b2b2b] shadow-[3px_3px_0px_#f59e0b]">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-[#2b2b2b] font-kannada">ಮುಖ್ಯ ನಿಯಮ (Strict Scope):</p>
                <p className="text-[11px] text-[#2b2b2b]/80 leading-normal font-kannada">
                  ಈ ಮಾಡ್ಯೂಲ್ ಕೇವಲ <strong>ಸಾಮಾನ್ಯ ಪತ್ರಗಳಿಗೆ</strong> ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ. ಯಾವುದೇ ವೇತನ ಬಡ್ತಿ, ಗಳಿಕೆ ರಜೆ, ಶಿಶುಪಾಲನ ರಜೆ ಅಥವಾ ಜ್ಞಾಪನಾ ಆದೇಶದ ಲೆಕ್ಕಾಚಾರಗಳನ್ನು ಇಲ್ಲಿ ಮಾಡಲಾಗುವುದಿಲ್ಲ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Form (Left) & Document Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Input Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step 1: Category Selector (Tab Switcher) */}
          <div className="card-brutal p-4 bg-white">
            <label className="block text-xs font-bold text-[#2b2b2b] uppercase tracking-wider mb-2.5 font-kannada">
              ೧. ಸಾಮಾನ್ಯ ಪತ್ರದ ವರ್ಗ ಆಯ್ಕೆ ಮಾಡಿ (Select Category)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="tab-emp-general-letter"
                type="button"
                onClick={() => handleCategoryChange('employee')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold border-2 border-[#2b2b2b] transition-all flex flex-col items-center gap-1 cursor-pointer font-kannada ${
                  category === 'employee'
                    ? 'bg-[#2b2b2b] text-[#f59e0b] shadow-[2px_2px_0px_#f59e0b]'
                    : 'bg-[#fffbf2] text-[#2b2b2b] hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>೧. ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ</span>
                </div>
                <span className={`text-[10px] ${category === 'employee' ? 'text-[#f59e0b]/80' : 'text-[#2b2b2b]/70'}`}>
                  (Employee General Letter)
                </span>
              </button>

              <button
                id="tab-other-general-letter"
                type="button"
                onClick={() => handleCategoryChange('other')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold border-2 border-[#2b2b2b] transition-all flex flex-col items-center gap-1 cursor-pointer font-kannada ${
                  category === 'other'
                    ? 'bg-[#2b2b2b] text-[#f59e0b] shadow-[2px_2px_0px_#f59e0b]'
                    : 'bg-[#fffbf2] text-[#2b2b2b] hover:bg-stone-100 shadow-[2px_2px_0px_#2b2b2b]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>೨. ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರ</span>
                </div>
                <span className={`text-[10px] ${category === 'other' ? 'text-[#f59e0b]/80' : 'text-[#2b2b2b]/70'}`}>
                  (Other General Letter)
                </span>
              </button>
            </div>
          </div>

          {/* Step 2: Document Upload with OCR (Optional) */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-sky-700" />
                <span>ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ (PDF/JPG OCR ಓದುವಿಕೆ)</span>
              </label>
              <span className="text-[10px] text-stone-500 font-medium">(ಐಚ್ಛಿಕ - Optional)</span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-50/50'
                  : 'border-stone-300 hover:border-sky-800 bg-stone-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {isOcrProcessing ? (
                <div className="py-3 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-sky-950 border-t-amber-400 rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-sky-950">
                    ದಾಖಲೆಯ ಪಠ್ಯವನ್ನು OCR ಮೂಲಕ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...
                  </p>
                </div>
              ) : uploadedFile ? (
                <div className="py-1 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-stone-900 truncate max-w-xs">{uploadedFile.name}</p>
                      <p className="text-[10px] text-stone-500">{uploadedFile.size} • OCR ಮಾಹಿತಿ ಹೊರತೆಗೆಯಲಾಗಿದೆ</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ಯಶಸ್ವಿ
                  </span>
                </div>
              ) : (
                <div className="py-2 space-y-1">
                  <p className="text-xs font-semibold text-stone-800">
                    PDF ಅಥವಾ JPG ಕಡತವನ್ನು ಇಲ್ಲಿ ಎಳೆಯಿರಿ ಅಥವಾ ಕ್ಲಿಕ್ ಮಾಡಿ
                  </p>
                  <p className="text-[10px] text-stone-500">
                    ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಯಲ್ಲಿರುವ ಮಾಹಿತಿಗಳನ್ನು AI ಸ್ವಯಂಚಾಲಿತವಾಗಿ ನಮೂದಿಸುತ್ತದೆ.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Information Input Form */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider pb-2 border-b border-stone-100 flex items-center justify-between">
              <span>
                {category === 'employee' ? '೨. ನೌಕರರ ಪತ್ರದ ವಿವರಗಳು' : '೨. ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರದ ವಿವರಗಳು'}
              </span>
              <span className="text-[11px] font-normal text-stone-500">
                {category === 'employee' ? 'ನೌಕರರ ಮಾಹಿತಿ ಕಡ್ಡಾಯ' : 'KGID ಕಡ್ಡಾಯವಲ್ಲ'}
              </span>
            </h2>

            {/* TYPE 1: ನೌಕರರ ಸಾಮಾನ್ಯ ಪತ್ರ FIELDS */}
            {category === 'employee' && (
              <div className="space-y-3.5">
                {/* Employee Quick Selector Dropdown */}
                {employees && employees.length > 0 && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 font-kannada">
                        <Users className="w-4 h-4 text-amber-800" />
                        <span>ನೌಕರರ ಪಟ್ಟಿಯಿಂದ ಆಯ್ಕೆ (Auto-fill Employee)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                          {employees.length} ನೌಕರರು
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEmpPicker(!showEmpPicker)}
                        className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                      >
                        {showEmpPicker ? 'ಪಟ್ಟಿ ಮರೆಮಾಡಿ ▲' : 'ನೌಕರರ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ ▼'}
                      </button>
                    </div>

                    {showEmpPicker && (
                      <div className="space-y-2 pt-1">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            value={empPickerFilter}
                            onChange={(e) => setEmpPickerFilter(e.target.value)}
                            placeholder="ನೌಕರರ ಹೆಸರು ಅಥವಾ KGID ಇಂದ ಹುಡುಕಿ..."
                            className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {employees
                            .filter((emp) => {
                              const q = empPickerFilter.toLowerCase().trim();
                              if (!q) return true;
                              return (
                                (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
                                (emp.kgidNumber && emp.kgidNumber.toLowerCase().includes(q)) ||
                                (emp.designation && emp.designation.toLowerCase().includes(q))
                              );
                            })
                            .map((emp) => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    employeeName: emp.fullName,
                                    kgidNumber: emp.kgidNumber || emp.employeeCode || '',
                                    designation: emp.designation,
                                    officeName: emp.placeOfWork || emp.officeLocation || 'ಸರ್ಕಾರಿ ಶಾಲೆ / ಕಚೇರಿ, ಭದ್ರಾವತಿ',
                                    employeeDetails: `ವೇತನ ಶ್ರೇಣಿ: ${emp.payScale || '-'}, ಮೂಲ ವೇತನ: ₹${(emp.basicPay || 0).toLocaleString('en-IN')}, ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ: ${emp.joiningDate || emp.appointmentDate || '-'}, ಗಳಿಕೆ ರಜೆ ಶಿಲ್ಕು: ${emp.earnedLeaveBalance || 0} ದಿನಗಳು`,
                                    subject: `ಶ್ರೀ/ಶ್ರೀಮತಿ ${emp.fullName}, ${emp.designation}, ${emp.placeOfWork || emp.officeLocation || 'ಭದ್ರಾವತಿ'} (ಕೆ.ಜಿ.ಐ.ಡಿ: ${emp.kgidNumber || emp.employeeCode || '-'}) ರವರ ಕುರಿತು ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ.`,
                                  }));
                                  setShowEmpPicker(false);
                                  showToast(`${emp.fullName} ರವರ ವಿವರಗಳನ್ನು ನಮೂದಿಸಲಾಗಿದೆ.`);
                                }}
                                className="w-full text-left p-2 rounded bg-white hover:bg-amber-100/70 border border-amber-200 transition-colors flex items-center justify-between text-xs cursor-pointer"
                              >
                                <div className="truncate">
                                  <strong className="text-stone-900 font-kannada">{emp.fullName}</strong>
                                  <span className="text-stone-500 text-[11px] ml-1.5 font-sans">({emp.designation})</span>
                                </div>
                                <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0 ml-2">
                                  {emp.kgidNumber || emp.employeeCode || '-'}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 flex items-center gap-2 shadow-2xs">
                  <FileCheck2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span><strong>ಕಡ್ಡಾಯ ನಿಯಮಾವಳಿ:</strong> ಯಾವುದೇ ಪತ್ರ ತಯಾರಿಸುವ ಮೊದಲು ಕಡತ ತಯಾರಿಸಬೇಕು ನಂತರ ಪತ್ರ ತಯಾರಿಸಬೇಕು. (ಕಡತ ಸಂಖ್ಯೆ: <span className="font-bold text-sky-950 font-mono">{formData.fileNumber || '57'}</span>)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ನೌಕರರ ಹೆಸರು <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-emp-name"
                      type="text"
                      placeholder="ಉದಾ: ಶ್ರೀ ರಮೇಶ್ ಎನ್."
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange('employeeName', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ಕೆಜಿಐಡಿ ಸಂಖ್ಯೆ (KGID)
                    </label>
                    <input
                      id="input-emp-kgid"
                      type="text"
                      placeholder="ಉದಾ: 1128456"
                      value={formData.kgidNumber}
                      onChange={(e) => handleInputChange('kgidNumber', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ಹುದ್ದೆ (Designation)
                    </label>
                    <input
                      id="input-emp-designation"
                      type="text"
                      placeholder="ಉದಾ: ಸಹಾಯಕ ಶಿಕ್ಷಕರು / ಮು.ಶಿ."
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ಕಡತ ಸಂಖ್ಯೆ (File No.) <span className="text-amber-600">*</span>
                    </label>
                    <input
                      id="input-emp-filenumber"
                      type="text"
                      placeholder="ಉದಾ: 57"
                      value={formData.fileNumber || '57'}
                      onChange={(e) => handleInputChange('fileNumber', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-amber-300 bg-amber-50/40 rounded-lg focus:ring-2 focus:ring-sky-950 outline-none font-bold text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ದಿನಾಂಕ (Date)
                    </label>
                    <input
                      id="input-emp-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ಕಚೇರಿ / ಶಾಲೆಯ ಹೆಸರು (Office / School)
                  </label>
                  <input
                    id="input-emp-office"
                    type="text"
                    placeholder="ಉದಾ: ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ"
                    value={formData.officeName}
                    onChange={(e) => handleInputChange('officeName', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ವಿಷಯ (Subject) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-emp-subject"
                    type="text"
                    placeholder="ಉದಾ: ನೌಕರರ ಸೇವಾ ವಿವರ ಹಾಗೂ ಪ್ರಮಾಣಪತ್ರ ಒದಗಿಸುವ ಕುರಿತು."
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ಉಲ್ಲೇಖ (Reference)
                  </label>
                  <textarea
                    id="input-emp-reference"
                    rows={2}
                    placeholder="೧. ನೌಕರರ ಮನವಿ ಪತ್ರ ದಿನಾಂಕ...&#10;೨. ಕಚೇರಿ ಕಡತ ಸಂಖ್ಯೆ..."
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ಪತ್ರದ ವಿವರ / ವಿಷಯವನ್ನು ಬರೆಯಲು ದೊಡ್ಡ Text Box (Details)
                  </label>
                  <textarea
                    id="input-emp-details"
                    rows={4}
                    placeholder="ಪತ್ರದಲ್ಲಿ ನಮೂದಿಸಬೇಕಾದ ವಿವರಣೆ, ನಿರ್ದೇಶನಗಳು, ಷರತ್ತುಗಳು ಅಥವಾ ವರದಿ ಸಲ್ಲಿಕೆಯ ಮಾಹಿತಿಗಳನ್ನು ಇಲ್ಲಿ ವಿಸ್ತೃತವಾಗಿ ಬರೆಯಿರಿ..."
                    value={formData.employeeDetails}
                    onChange={(e) => handleInputChange('employeeDetails', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>
              </div>
            )}

            {/* TYPE 2: ಇತರೆ ಸಾಮಾನ್ಯ ಪತ್ರ FIELDS */}
            {category === 'other' && (
              <div className="space-y-3.5">
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span><strong>ಕಡ್ಡಾಯ ನಿಯಮಾವಳಿ:</strong> ಯಾವುದೇ ಪತ್ರ ತಯಾರಿಸುವ ಮೊದಲು ಕಡತ ತಯಾರಿಸಬೇಕು ನಂತರ ಪತ್ರ ತಯಾರಿಸಬೇಕು.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ಕಡತ ಸಂಖ್ಯೆ (File / Docket Number) <span className="text-amber-600">*</span>
                    </label>
                    <input
                      id="input-other-filenumber"
                      type="text"
                      placeholder="ಉದಾ: 57"
                      value={formData.fileNumber || '57'}
                      onChange={(e) => handleInputChange('fileNumber', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-amber-300 bg-amber-50/40 rounded-lg focus:ring-2 focus:ring-sky-950 outline-none font-bold text-stone-900"
                    />
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      ಪತ್ರದ ಸಂಖ್ಯೆ: <span className="font-mono font-semibold text-amber-800">ಸಂ: ಆ2/ಸ.ಪ್ರಾ.ಶಿ/ಇತರೆ/{formData.fileNumber || '57'}/2026-27</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ದಿನಾಂಕ (Date)
                    </label>
                    <input
                      id="input-other-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ಯಾರಿಗೆ (To / Recipient) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="input-other-recipient"
                    rows={3}
                    placeholder="ಉದಾ:&#10;ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು,&#10;ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆ,&#10;ಭದ್ರಾವತಿ"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange('recipient', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none leading-relaxed"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    ಸೂಚನೆ: ಸ್ವೀಕೃತದಾರರ ವಿವರಗಳನ್ನು ಪ್ರತ್ಯೇಕ ಸಾಲುಗಳಲ್ಲಿ ನಮೂದಿಸಿ (ಪತ್ರದಲ್ಲಿ 'ರಿಗೆ:' ಶೀರ್ಷಿಕೆಯಡಿ ಸಾಲು-ಸಾಲಾಗಿ ಮುದ್ರಿತವಾಗುತ್ತದೆ).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ವಿಷಯ (Subject) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-other-subject"
                    type="text"
                    placeholder="ಉದಾ: ಶಾಲಾ ದಾಖಲಾತಿ ಆಂದೋಲನ ಹಾಗೂ ಸಭೆಯ ನಡಾವಳಿ ಕುರಿತು."
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ಉಲ್ಲೇಖ (Reference)
                  </label>
                  <textarea
                    id="input-other-reference"
                    rows={2}
                    placeholder="೧. ಆಯುಕ್ತರ ಕಚೇರಿ ಸುತ್ತೋಲೆ ಸಂಖ್ಯೆ...&#10;೨. ದಿನಾಂಕ... ರ ಸಭೆಯ ನಡಾವಳಿ."
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ಪತ್ರದ ಮುಖ್ಯ ವಿಷಯ (Main Content / Large Text Box)
                  </label>
                  <textarea
                    id="input-other-main-content"
                    rows={4}
                    placeholder="ಪತ್ರದ ಸಾರಾಂಶ, ಸುತ್ತೋಲೆಯ ನಿರ್ದೇಶನಗಳು, ಸಭೆಯ ವಿವರಗಳು ಅಥವಾ ಅನುಷ್ಠಾನಗೊಳಿಸಬೇಕಾದ ಕಾರ್ಯಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ..."
                    value={formData.mainContent}
                    onChange={(e) => handleInputChange('mainContent', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ಇತರೆ ಸೂಚನೆಗಳು (Other Instructions)
                  </label>
                  <input
                    id="input-other-instructions"
                    type="text"
                    placeholder="ಉದಾ: ದಿನಾಂಕ ೧೫ ರೊಳಗೆ ಅನುಸರಣಾ ವರದಿ ಕಡ್ಡಾಯವಾಗಿ ಸಲ್ಲಿಸುವುದು."
                    value={formData.otherInstructions}
                    onChange={(e) => handleInputChange('otherInstructions', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-sky-950 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 4: AI Prompt Box */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sky-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>ಹೆಚ್ಚುವರಿ ಸೂಚನೆ / Prompt (AI Drafting Prompt)</span>
                </span>
                <span className="text-[10px] text-stone-500">ಕನ್ನಡ ಶೈಲಿ ಮಾರ್ಗದರ್ಶಿ</span>
              </label>

              <textarea
                id="input-general-prompt"
                rows={2}
                value={formData.additionalPrompt}
                onChange={(e) => handleInputChange('additionalPrompt', e.target.value)}
                placeholder="ಉದಾ: ಈ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ ತಯಾರಿಸಿ."
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-amber-50/40 focus:ring-2 focus:ring-amber-500 outline-none text-stone-900"
              />

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      'additionalPrompt',
                      'ಈ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಅಧಿಕೃತ ಕಚೇರಿ ಪತ್ರ ತಯಾರಿಸಿ.'
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 cursor-pointer"
                >
                  ಸಂಕ್ಷಿಪ್ತ & ಅಧಿಕೃತ
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      'additionalPrompt',
                      'ಈ ಪತ್ರವನ್ನು ಸರಳವಾದ ಸರ್ಕಾರಿ ಕಚೇರಿ ಭಾಷೆಯಲ್ಲಿ ತಯಾರಿಸಿ.'
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 cursor-pointer"
                >
                  ಸರಳ ಕಚೇರಿ ಭಾಷೆ
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      'additionalPrompt',
                      'ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಶಿಕ್ಷಣ ಇಲಾಖೆಯ ಅಧಿಕೃತ ಶೈಲಿಯಲ್ಲಿ ವಿಸ್ತೃತ ಪತ್ರ ತಯಾರಿಸಿ.'
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 cursor-pointer"
                >
                  ವಿಸ್ತೃತ ಇಲಾಖಾ ಶೈಲಿ
                </button>
              </div>
            </div>

            {/* Action Button: Generate General Letter */}
            <div className="pt-3">
              <button
                id="btn-generate-general-letter"
                type="button"
                onClick={handleGenerateLetter}
                disabled={isGenerating}
                className="w-full py-3 bg-[#2b2b2b] hover:bg-stone-800 text-[#f59e0b] hover:text-amber-300 rounded-xl text-sm font-bold shadow-[4px_4px_0px_#f59e0b] flex items-center justify-center gap-2 transition-all cursor-pointer border-2 border-[#2b2b2b] disabled:opacity-50 font-kannada"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
                    <span>ಅಧಿಕೃತ ಸಾಮಾನ್ಯ ಪತ್ರ ತಯಾರಾಗುತ್ತಿದೆ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                    <span>✨ AI ಮೂಲಕ ಸಾಮಾನ್ಯ ಪತ್ರ ರಚಿಸಿ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Previous / Saved General Letters Quick Access */}
          {savedGeneralLetters.length > 0 && (
            <div className="card-brutal p-4 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#2b2b2b]">
                <span className="text-xs font-bold text-[#2b2b2b] flex items-center gap-1.5 font-kannada">
                  <FileText className="w-4 h-4 text-[#f59e0b]" />
                  <span>ಉಳಿಸಲಾದ ಸಾಮಾನ್ಯ ಪತ್ರಗಳು ({savedGeneralLetters.length})</span>
                </span>
                <button
                  type="button"
                  onClick={fetchGeneralLetters}
                  className="text-[10px] text-[#2b2b2b] hover:text-[#f59e0b] underline font-bold cursor-pointer font-kannada"
                >
                  ಮರುಲೋಡ್
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedGeneralLetters.map((letter) => (
                  <div
                    key={letter.id || letter.documentId}
                    onClick={() => handleLoadSavedLetter(letter)}
                    className="p-2.5 rounded-lg border-2 border-[#2b2b2b] hover:bg-[#fffbf2] shadow-[2px_2px_0px_#2b2b2b] transition-all cursor-pointer text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#2b2b2b] font-mono-code">
                        {letter.letterNumber}
                      </span>
                      <span className="text-[10px] font-bold text-[#2b2b2b]/70 font-mono-code">
                        {letter.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#2b2b2b] font-medium line-clamp-1 mt-0.5 font-kannada">
                      {letter.subject}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[#2b2b2b]/70 font-kannada">
                      <span>{letter.letterType}</span>
                      <span className="text-[#f59e0b] font-bold group-hover:underline">ವೀಕ್ಷಿಸಿ →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Output Document Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Ribbon: Preview / Edit Modes & Output Controls */}
          <div className="card-brutal p-3 bg-white flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-[#fffbf2] p-1 rounded-lg border-2 border-[#2b2b2b]">
              <button
                id="btn-view-preview"
                type="button"
                onClick={() => setActiveViewMode('preview')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-kannada ${
                  activeViewMode === 'preview'
                    ? 'bg-[#2b2b2b] text-[#f59e0b] shadow-[2px_2px_0px_#f59e0b]'
                    : 'text-[#2b2b2b] hover:bg-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>👁️ ಪೂರ್ವವೀಕ್ಷಣೆ</span>
              </button>

              <button
                id="btn-view-edit"
                type="button"
                onClick={() => setActiveViewMode('edit')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-kannada ${
                  activeViewMode === 'edit'
                    ? 'bg-[#2b2b2b] text-[#f59e0b] shadow-[2px_2px_0px_#f59e0b]'
                    : 'text-[#2b2b2b] hover:bg-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>✏️ ತಿದ್ದುಪಡಿ</span>
              </button>
            </div>

            {/* Output Actions (Save, Word, PDF, Print, Copy) */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                id="btn-save-general-letter"
                type="button"
                onClick={handleSaveLetter}
                disabled={!generatedLetter || isSaving}
                className="px-3 py-1.5 bg-[#f59e0b] hover:bg-amber-400 text-[#2b2b2b] rounded-lg text-xs font-bold border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 font-kannada"
                title="ಕಡತಾಗಾರದಲ್ಲಿ ಉಳಿಸಿ (Save to Database)"
              >
                <Save className="w-3.5 h-3.5 text-[#2b2b2b]" />
                <span>{isSaving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : '💾 ಉಳಿಸಿ'}</span>
              </button>

              <button
                id="btn-download-word-general"
                type="button"
                onClick={handleDownloadDocx}
                disabled={!generatedLetter}
                className="px-3 py-1.5 bg-white hover:bg-[#fffbf2] text-[#2b2b2b] rounded-lg text-xs font-bold border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                title="Microsoft Word (.docx) ಕಡತ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
              >
                <Download className="w-3.5 h-3.5" />
                <span>📄 Word</span>
              </button>

              <button
                id="btn-download-pdf-general"
                type="button"
                onClick={handleDownloadPdf}
                disabled={!generatedLetter}
                className="px-3 py-1.5 bg-white hover:bg-[#fffbf2] text-[#2b2b2b] rounded-lg text-xs font-bold border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                title="PDF ಕಡತ ಡೌನ್‌ಲೋಡ್ / ಮುದ್ರಣ"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>📥 PDF</span>
              </button>

              <button
                id="btn-print-preview-general"
                type="button"
                onClick={() => setIsPrintPreviewOpen(true)}
                disabled={!generatedLetter}
                className="px-3 py-1.5 bg-[#2b2b2b] hover:bg-stone-800 text-white rounded-lg text-xs font-bold border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#f59e0b] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 font-kannada"
                title="A4 ಟೆಂಪ್ಲೇಟ್ ಓವರ್‌ಲೇ ಪ್ರಿಂಟ್ ಪೂರ್ವವೀಕ್ಷಣೆ (Print Preview Modal)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>🖨️ A4 ಪ್ರಿಂಟ್ ಪ್ರಿವ್ಯೂ</span>
              </button>

              <button
                id="btn-copy-general-text"
                type="button"
                onClick={handleCopyText}
                disabled={!generatedLetter}
                className="px-2.5 py-1.5 bg-white hover:bg-[#fffbf2] text-[#2b2b2b] rounded-lg text-xs font-bold border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] transition-all cursor-pointer disabled:opacity-40"
                title="ಪಠ್ಯ ನಕಲಿಸಿ (Copy Text)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Display Area: Preview Mode vs Edit Mode */}
          {activeViewMode === 'edit' ? (
            /* EDIT MODE */
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>ಸಾಮಾನ್ಯ ಪತ್ರ ತಿದ್ದುಪಡಿ (Direct Inline Editor)</span>
                </span>
                <button
                  type="button"
                  onClick={handleApplyEdits}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer"
                >
                  ತಿದ್ದುಪಡಿ ಅನ್ವಯಿಸಿ (Apply)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ಸ್ವೀಕೃತದಾರರು (Recipient / ಯಾರಿಗೆ)</label>
                <textarea
                  rows={2}
                  value={editRecipient}
                  onChange={(e) => setEditRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ವಿಷಯ (Subject)</label>
                <textarea
                  rows={2}
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ಉಲ್ಲೇಖ (Reference)</label>
                <textarea
                  rows={2}
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ಪತ್ರದ ಒಡಲು (Letter Body HTML / Text)
                </label>
                <textarea
                  rows={10}
                  value={editBodyHtml}
                  onChange={(e) => setEditBodyHtml(e.target.value)}
                  className="w-full p-3 text-xs border border-stone-300 rounded-lg font-mono leading-relaxed focus:ring-2 focus:ring-sky-950 outline-none"
                />
              </div>
            </div>
          ) : (
            /* PREVIEW MODE: AUTHENTIC A4 KARNATAKA GOVERNMENT OFFICIAL LETTER PAPER */
            <div
              id="general-letter-paper"
              className="bg-white border border-stone-300 rounded-xl p-8 sm:p-12 shadow-sm font-sans min-h-[700px] text-stone-900 leading-relaxed"
              style={{ minHeight: '800px' }}
            >
              {/* MANDATORY 4-LINE KANNADA HEADER: BOLD, CENTER-ALIGNED, NO ENGLISH, NO OFFICER NAME */}
              <div className="text-center space-y-1 mb-6 pb-4 border-b-2 border-stone-800">
                <p className="text-base font-bold text-stone-950 tracking-normal m-0">
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರ
                </p>
                <p className="text-sm font-bold text-stone-900 tracking-normal m-0">
                  ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
                </p>
                <p className="text-sm font-bold text-stone-900 tracking-normal m-0">
                  ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳ ಕಛೇರಿ, ಭದ್ರಾವತಿ
                </p>
                <p className="text-xs font-bold text-stone-800 tracking-normal m-0">
                  ಬಿ.ಹೆಚ್. ರಸ್ತೆ, ಹಳೇನಗರ, ಭದ್ರಾವತಿ, ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆ - 577301
                </p>
              </div>

              {generatedLetter ? (
                <div className="space-y-5 text-xs text-stone-900">
                  {/* Letter Number and Date Line */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-bold pb-2 border-b border-stone-200">
                    <span className="text-sm text-stone-950 font-bold">{formatCleanSam(generatedLetter.letterNumber)}</span>
                    <span className="text-xs text-stone-900">ದಿನಾಂಕ: {generatedLetter.date}</span>
                  </div>

                  {/* Recipient Block (ರಿಗೆ:) */}
                  <div className="text-stone-900 leading-relaxed font-kannada">
                    <div className="font-bold text-stone-950 text-sm mb-1">ರಿಗೆ:</div>
                    <div className="pl-4 space-y-1 text-xs">
                      {renderRecipientLines(generatedLetter.recipient || formData.recipient, category, generatedLetter)}
                    </div>
                  </div>

                  {/* Salutation */}
                  <div className="font-semibold text-stone-900">
                    ಮಾನ್ಯರೇ,
                  </div>

                  {/* Subject & Reference */}
                  <div className="space-y-2 pl-4 border-l-2 border-stone-400 bg-stone-50/60 p-3 rounded-r-lg">
                    <p className="leading-snug">
                      <strong className="text-stone-950">ವಿಷಯ: </strong>
                      <span>{generatedLetter.subject}</span>
                    </p>
                    {generatedLetter.reference && (
                      <div className="leading-snug">
                        <strong className="text-stone-950">ಉಲ್ಲೇಖ: </strong>
                        <div className="pl-4 text-stone-800 mt-1 space-y-1">
                          {renderReferenceLines(generatedLetter.reference)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main Letter Body */}
                  <div
                    id="general-letter-content-body"
                    className="space-y-3 pt-2 text-justify text-[13px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: generatedLetter.bodyHtml }}
                  />

                  {/* Salutation Close & Signatory Block */}
                  <div className="pt-8 flex flex-col items-end text-right">
                    <div className="text-center w-72 space-y-1">
                      <p className="text-xs text-stone-700 mb-8">ತಮ್ಮ ನಂಬುಗೆಯ,</p>
                      <p className="font-bold text-stone-950 text-xs">
                        ({generatedLetter.signatory?.name || ddoOfficer.name})
                      </p>
                      <p className="text-xs font-semibold text-stone-800">
                        {generatedLetter.signatory?.designation || ddoOfficer.designation}
                      </p>
                      <p className="text-[11px] text-stone-600">
                        {generatedLetter.signatory?.office || ddoOfficer.office}
                      </p>
                    </div>
                  </div>

                  {/* Endorsements / Copies (ಪ್ರತಿ ರವಾನೆ) */}
                  {generatedLetter.endorsements && generatedLetter.endorsements.length > 0 && (
                    <div className="pt-6 border-t border-stone-200 text-xs space-y-1">
                      <p className="font-bold text-stone-900">ಪ್ರತಿಯನ್ನು ಗೌರವಪೂರ್ವಕವಾಗಿ ರವಾನಿಸಲಾಗಿದೆ:</p>
                      <ol className="list-decimal pl-5 space-y-0.5 text-stone-700">
                        {generatedLetter.endorsements.map((end, idx) => (
                          <li key={idx}>{end}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Document ID Tag */}
                  <div className="pt-6 text-right text-[10px] text-stone-400 font-mono no-print">
                    ದಾಖಲೆ ಐಡಿ: {generatedLetter.documentId} | ಆವೃತ್ತಿ: v{generatedLetter.currentVersion || 1}
                  </div>
                </div>
              ) : (
                /* Empty / Initial State Placeholder */
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <p className="text-sm font-bold text-stone-800">
                      ಸಾಮಾನ್ಯ ಪತ್ರ ಇನ್ನೂ ತಯಾರಾಗಿಲ್ಲ
                    </p>
                    <p className="text-xs text-stone-500">
                      ಎಡಭಾಗದ ನಮೂನೆಯಲ್ಲಿ ನೌಕರರ ಅಥವಾ ಇತರೆ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ, &ldquo;✨ AI ಮೂಲಕ ಸಾಮಾನ್ಯ ಪತ್ರ ರಚಿಸಿ&rdquo; ಕ್ಲಿಕ್ ಮಾಡಿ.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* A4 PRINT PREVIEW MODAL OVERLAY */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        elementId="general-letter-paper"
        documentTitle={generatedLetter ? `ಸಾಮಾನ್ಯ ಪತ್ರ - ${generatedLetter.letterNumber}` : 'ಸಾಮಾನ್ಯ ಪತ್ರ A4 ಪೂರ್ವವೀಕ್ಷಣೆ'}
        meta={{
          letterNumber: generatedLetter?.letterNumber,
          date: generatedLetter?.date,
          subject: generatedLetter?.subject,
          recipient: generatedLetter?.recipient
        }}
      />
    </div>
  );
};
