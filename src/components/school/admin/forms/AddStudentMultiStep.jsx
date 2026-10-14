import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, GraduationCap, Users, MapPin, FileText, CheckCircle,
  Camera, Upload, Sparkles, AlertCircle,
  Eye, EyeOff, ChevronRight, ChevronLeft, Save,
  Smartphone, Mail, Shield, HeartPulse,
  Check, Loader2, Calendar, Fingerprint, Briefcase
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { CustomSelect } from "@/components/ui/CustomSelect";

const STEPS = [
  { id: 1, title: 'Basic Information', icon: User, description: 'Personal & identity details' },
  { id: 2, title: 'Academic Details', icon: GraduationCap, description: 'Enrollment & class info' },
  { id: 3, title: 'Parent Details', icon: Users, description: 'Guardian information' },
  { id: 4, title: 'Address & Medical', icon: MapPin, description: 'Residence & health info' },
  { id: 5, title: 'Document Uploads', icon: Upload, description: 'Identity & certificates' },
  { id: 6, title: 'Review & Submit', icon: CheckCircle, description: 'Final verification' }
];

const BLOOD_GROUP_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function getInstituteCode(name = 'Eddva School') {
  const words = String(name)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const code = words.length > 1 ? words.map((word) => word[0]).join('') : (words[0] || 'EDDVA').slice(0, 3);
  return code.toUpperCase().slice(0, 6);
}

function getScopedId(instituteName, existingCount = 0) {
  const year = new Date().getFullYear();
  return `${getInstituteCode(instituteName)}-${year}-${String(existingCount + 1).padStart(3, '0')}`;
}

// Class names like "Class 10" were sorting as plain text (10, 11, 12, then
// 3..9) — sort by the number embedded in the name instead; names with no
// number fall back to alphabetical and sort after the numbered ones.
function sortClassesByNumber(list) {
  return [...list].sort((a, b) => {
    const numA = parseInt(String(a.name).match(/\d+/)?.[0], 10);
    const numB = parseInt(String(b.name).match(/\d+/)?.[0], 10);
    if (Number.isNaN(numA) && Number.isNaN(numB)) return String(a.name).localeCompare(String(b.name));
    if (Number.isNaN(numA)) return 1;
    if (Number.isNaN(numB)) return -1;
    return numA - numB;
  });
}

const FloatingInput = ({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, error, required, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;
  const isDateField = type === 'date';

  if (isDateField) {
    return (
      <div className="relative group">
        <label className="mb-2 block text-[10px] font-bold tracking-tight uppercase tracking-widest text-blue-600 dark:text-blue-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className={`
          relative flex items-center rounded-2xl border-2 transition-all duration-300
          ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-300 dark:border-slate-700'}
          ${error ? 'border-red-500' : ''}
          bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl
        `}>
          {Icon && (
            <div className={`pl-4 transition-colors duration-300 ${isFocused ? 'text-blue-500' : 'text-slate-400'}`}>
              <Icon size={18} />
            </div>
          )}
          <input
            type={type}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent px-4 py-3.5 outline-none text-slate-900 dark:text-white font-semibold text-sm"
            placeholder={placeholder || label}
            {...props}
          />
        </div>
        {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`
        relative flex items-center h-[50px] min-h-[50px] transition-all duration-300 rounded-2xl border-2
        ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-300 dark:border-slate-700'}
        ${error ? 'border-red-500' : ''}
        bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl
      `}>
        {Icon && (
          <div className={`pl-4 transition-colors duration-300 ${isFocused ? 'text-blue-500' : 'text-slate-400'}`}>
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent px-4 py-3.5 outline-none text-slate-900 dark:text-white font-semibold text-sm placeholder-transparent"
          placeholder={placeholder || label}
          {...props}
        />
        <label className={`
          absolute left-10 transition-all duration-300 pointer-events-none font-bold
          ${(isFocused || hasValue) ? '-top-2.5 left-8 px-2 bg-white dark:bg-slate-950 text-xs text-blue-600 dark:text-blue-400' : 'top-3.5 text-sm text-slate-400'}
        `}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
    </div>
  );
};

const FloatingSelect = ({ label, name, value, onChange, options, error, required, disabled }) => (
  <div className="flex flex-col gap-1.5">
    <label className="block text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <CustomSelect
      value={value}
      placeholder={`Select ${label}...`}
      onChange={(val) => onChange && onChange({ target: { name, value: val } })}
      options={options.map((option) => {
        if (typeof option === 'object' && option !== null) {
          return { value: option.value, label: option.label || `Select ${label}` };
        }
        return { value: option, label: option ? option : `Select ${label}` };
      })}
      disabled={disabled}
      className="w-full"
    />
    {error && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
  </div>
);

const SectionHeader = ({ title, description, badge }) => (
  <div className="mb-4 sm:mb-7">
    <div className="flex flex-wrap items-center gap-2 mb-1">
      <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{title}</h2>
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[9px] font-bold uppercase tracking-wider border border-blue-500/20">
          {badge}
        </span>
      )}
    </div>
    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-snug">{description}</p>
  </div>
);

const AIAssistantCard = () => null;

const StepRail = ({ currentStep, onStepClick, compact = false }) => (
  <div className={compact ? 'flex gap-2 overflow-x-auto pb-1.5 scrollbar-none sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible sm:pb-0' : 'space-y-3'}>
    {STEPS.map(step => {
      const Icon = step.icon;
      const isActive = currentStep === step.id;
      const isCompleted = currentStep > step.id;
      return (
        <button
          key={step.id}
          type="button"
          onClick={() => onStepClick(step.id)}
          className={`${compact ? 'min-w-[150px] sm:min-w-0 rounded-xl p-2 gap-2' : 'w-full flex items-center gap-3 rounded-[22px] p-3'} flex items-center text-left transition-all ${isActive ? 'bg-white shadow-sm ring-1 ring-blue-100 dark:bg-slate-800 dark:ring-slate-700' : 'hover:bg-white/70 dark:hover:bg-slate-800/70'}`}
        >
          <div className={`${compact ? 'size-7 rounded-lg' : 'size-11 rounded-2xl'} grid shrink-0 place-items-center ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
            {isCompleted ? <Check size={compact ? 12 : 18} strokeWidth={3} /> : <Icon size={compact ? 12 : 18} />}
          </div>
          <div className="min-w-0">
            <h4 className={`truncate ${compact ? 'text-[9px] tracking-wider' : 'text-[11px] tracking-[0.18em]'} font-black uppercase ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{step.title}</h4>
            <p className={`truncate ${compact ? 'text-[8px]' : 'text-[10px]'} font-semibold text-slate-400`}>{step.description}</p>
          </div>
        </button>
      );
    })}
  </div>
);

export default function AddStudentMultiStep({ student, onSubmit, onCancel, isLoading, pageMode = false }) {
  const { institute } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', autoGeneratePassword: true,
    credentialDeliveryChannel: 'student_email', phone: '',
    dob: '', gender: '', bloodGroup: '', nationalId: '', profileImage: null,
    casteCategory: '', previousSchoolName: '', previousAdmissionNo: '', reasonForTransfer: '', boardRegistrationNo: '', boardName: '',
    enrollmentNo: '', rollNo: '', classId: '', sectionId: '', admissionDate: '',
    primaryContact: 'father', fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', parentPhone: '', parentEmail: '', whatsappNumber: '', parentOccupation: '', annualIncome: '', guardianName: '', guardianRelation: '', guardianPhone: '', createParentLogin: true, sendViaSms: true, sendViaEmail: false,
    currentAddress: '', permanentAddress: '', city: '', state: '', pinCode: '',
    allergies: '', medicalConditions: '', documents: {},
  });

  const [idLoading, setIdLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showGuardian, setShowGuardian] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachingMap, setTeachingMap] = useState(null);
  const [teachingMapLoading, setTeachingMapLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.classId) {
      const selectedClass = classes.find(c => c.id === formData.classId);
      setSections(selectedClass?.sections || []);
    } else {
      setSections([]);
    }
  }, [formData.classId, classes]);

  useEffect(() => {
    if (!formData.sectionId) {
      setTeachingMap(null);
      return;
    }
    let cancelled = false;
    const loadMap = async () => {
      setTeachingMapLoading(true);
      try {
        const res = await api.get(`/academic/sections/${formData.sectionId}/teaching-map`);
        const data = res.data?.data ?? res.data;
        if (!cancelled) setTeachingMap(data);
      } catch (error) {
        console.error('Failed to load teaching map:', error);
        if (!cancelled) setTeachingMap(null);
      } finally {
        if (!cancelled) setTeachingMapLoading(false);
      }
    };
    loadMap();
    return () => { cancelled = true; };
  }, [formData.sectionId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      const data = res.data?.data ?? res.data;
      setClasses(Array.isArray(data) ? sortClassesByNumber(data) : []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  useEffect(() => {
    if (student) {
      const sectionId = student.studentProfile?.section?.id || student.studentProfile?.sectionId || '';
      const inferredClass = classes.find((cls) => (cls.sections || []).some((sec) => sec.id === sectionId));
      const studentClassId = student.studentProfile?.section?.classId || student.classId || inferredClass?.id || '';
      const profile = student.studentProfile || {};
      const parents = student.parentDetails || student.parent_details || profile.parentDetails || {};
      const primaryContact = parents.primaryContact || parents.primary_contact || profile.primaryContact || student.primaryContact || student.primary_contact || 'father';
      const parentPhone = profile.parentPhone || profile.parent_phone || student.parentPhone || student.parent_phone || parents.parentPhone || parents.parent_phone || '';
      const savedFatherPhone = parents.fatherPhone || parents.father_phone || profile.fatherPhone || profile.father_phone || student.fatherPhone || student.father_phone || '';
      const savedMotherPhone = parents.motherPhone || parents.mother_phone || profile.motherPhone || profile.mother_phone || student.motherPhone || student.mother_phone || '';
      const savedGuardianPhone = parents.guardianPhone || parents.guardian_phone || profile.guardianPhone || profile.guardian_phone || student.guardianPhone || student.guardian_phone || '';
      const hasSpecificParentPhone = Boolean(savedFatherPhone || savedMotherPhone || savedGuardianPhone);
      const fatherPhone = savedFatherPhone || (!hasSpecificParentPhone && primaryContact === 'father' ? parentPhone : '');
      const motherPhone = savedMotherPhone || (!hasSpecificParentPhone && primaryContact === 'mother' ? parentPhone : '');
      const guardianPhone = savedGuardianPhone || (!hasSpecificParentPhone && primaryContact === 'guardian' ? parentPhone : '');

      const formatInputDate = (d) => {
        if (!d) return '';
        try {
          return new Date(d).toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      setFormData(prev => ({
        ...prev,
        ...student,
        ...profile,
        classId: studentClassId,
        casteCategory: profile.casteCategory || profile.caste_category || student.casteCategory || '',
        previousSchoolName: profile.previousSchoolName || profile.previous_school_name || student.previousSchoolName || '',
        previousAdmissionNo: profile.previousAdmissionNo || profile.previous_admission_no || student.previousAdmissionNo || '',
        reasonForTransfer: profile.reasonForTransfer || profile.reason_for_transfer || student.reasonForTransfer || '',
        boardRegistrationNo: profile.boardRegistrationNo || profile.board_registration_no || student.boardRegistrationNo || '',
        boardName: profile.boardName || profile.board_name || student.boardName || '',
        dob: formatInputDate(profile.dob || student.dob),
        admissionDate: formatInputDate(profile.admissionDate || student.admissionDate),
        primaryContact,
        parentPhone,
        fatherName: parents.fatherName || parents.father_name || profile.fatherName || profile.father_name || student.fatherName || student.father_name || '',
        fatherPhone,
        motherName: parents.motherName || parents.mother_name || profile.motherName || profile.mother_name || student.motherName || student.mother_name || '',
        motherPhone,
        parentEmail: parents.email || parents.parentEmail || parents.parent_email || profile.parentEmail || profile.parent_email || student.parentEmail || student.parent_email || '',
        whatsappNumber: parents.whatsappNumber || parents.whatsapp_number || profile.whatsappNumber || profile.whatsapp_number || student.whatsappNumber || student.whatsapp_number || parentPhone || '',
        parentOccupation: parents.occupation || parents.parentOccupation || parents.parent_occupation || profile.parentOccupation || profile.parent_occupation || student.parentOccupation || student.parent_occupation || '',
        annualIncome: parents.annualIncome || parents.annual_income || profile.annualIncome || profile.annual_income || student.annualIncome || student.annual_income || '',
        guardianName: parents.guardianName || parents.guardian_name || profile.guardianName || profile.guardian_name || student.guardianName || student.guardian_name || '',
        guardianRelation: parents.guardianRelation || parents.guardian_relation || profile.guardianRelation || profile.guardian_relation || student.guardianRelation || student.guardian_relation || '',
        guardianPhone,
        createParentLogin: parents.createLogin ?? parents.createParentLogin ?? parents.create_login ?? profile.createLogin ?? student.createLogin ?? prev.createParentLogin,
        sendViaSms: parents.sendViaSms ?? parents.send_via_sms ?? profile.sendViaSms ?? student.sendViaSms ?? prev.sendViaSms,
        sendViaEmail: parents.sendViaEmail ?? parents.send_via_email ?? profile.sendViaEmail ?? student.sendViaEmail ?? prev.sendViaEmail,
      }));
      setShowGuardian(Boolean(guardianPhone || parents.guardianName || parents.guardian_name || profile.guardianName || student.guardianName || primaryContact === 'guardian'));
    }
  }, [student, classes]);

  const updateField = (name, value) => {
    setFormData(prev => {
      if (name !== 'primaryContact') return { ...prev, [name]: value };

      const fallbackPhone = prev.parentPhone || prev.whatsappNumber || prev.fatherPhone || prev.motherPhone || prev.guardianPhone || '';
      const next = { ...prev, primaryContact: value };
      if (value === 'father' && !next.fatherPhone) next.fatherPhone = fallbackPhone;
      if (value === 'mother' && !next.motherPhone) next.motherPhone = fallbackPhone;
      if (value === 'guardian' && !next.guardianPhone) next.guardianPhone = fallbackPhone;
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateField(name, type === 'checkbox' ? checked : value);
  };

  // Strips non-digits as the admin types, so a phone/Aadhaar/PIN box can never
  // hold letters or extra digits in the first place, instead of only flagging
  // it after Next is clicked.
  const handleDigitsChange = (maxLen) => (e) => {
    updateField(e.target.name, e.target.value.replace(/\D/g, '').slice(0, maxLen));
  };

  const generateEnrollmentNo = async () => {
    setIdLoading(true);
    try {
      // `total` is the institute's real student count; the `data` array is
      // just the current page (defaults to 10), so counting it instead
      // under-counts past page 1 and keeps generating the same duplicate ID.
      const res = await api.get('/students', { params: { limit: 1 } });
      const list = res.data?.data ?? res.data;
      const count = typeof res.data?.total === 'number' ? res.data.total : (Array.isArray(list) ? list.length : 0);
      setFormData(prev => ({ ...prev, enrollmentNo: getScopedId(institute?.name, count) }));
    } catch (error) {
      console.error('Failed to generate student id:', error);
      setFormData(prev => ({ ...prev, enrollmentNo: getScopedId(institute?.name, 0) }));
    } finally {
      setIdLoading(false);
    }
  };

  // Auto-generate enrollment ID on mount
  useEffect(() => {
    if (!formData.enrollmentNo && institute?.name && !student) {
      generateEnrollmentNo();
    }
  }, [institute, student]);

  const handleDocumentUpload = (docName, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        documents: {
          ...(prev.documents || {}),
          [docName]: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
  const PHONE_REGEX = /^\d{10}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Pure — computes a step's errors without touching state, so it can be
  // reused for the Next button, jump-ahead navigation, the final pre-submit
  // sweep, and the Review step's "what's still missing" summary alike.
  const getStepErrors = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name?.trim()) {
        newErrors.name = 'Full Name is required';
      } else if (!NAME_REGEX.test(formData.name.trim())) {
        newErrors.name = 'Name can only contain letters, spaces, and - . \'';
      }

      if (!formData.email?.trim()) {
        newErrors.email = 'Email Address is required';
      } else if (!EMAIL_REGEX.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }

      if (!formData.phone?.trim()) {
        newErrors.phone = 'Mobile Number is required';
      } else if (!PHONE_REGEX.test(formData.phone?.trim())) {
        newErrors.phone = 'Mobile number must be exactly 10 digits';
      }

      if (!formData.nationalId?.trim()) {
        newErrors.nationalId = 'Aadhaar ID is required';
      } else if (!/^\d{12}$/.test(formData.nationalId.trim())) {
        newErrors.nationalId = 'Aadhaar ID must be exactly 12 digits';
      }

      if (!formData.dob) {
        newErrors.dob = 'Date of birth is required';
      }

      if (!formData.gender) {
        newErrors.gender = 'Gender is required';
      }

      // Password is only ever required (and validated) when the admin has
      // switched off auto-generation — a blank password is a valid, normal
      // state now, filled in server-side.
      if (!formData.autoGeneratePassword) {
        if (!student && !formData.password) {
          newErrors.password = 'Student Password is required (or turn Auto-generate back on)';
        } else if (formData.password && formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.password && !formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm the password';
        } else if (formData.password && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }

      if (!formData.instituteAdminPassword?.trim()) {
        newErrors.instituteAdminPassword = 'Admin Password is required to authorize registration';
      }
    } else if (step === 2) {
      if (!formData.enrollmentNo?.trim()) newErrors.enrollmentNo = 'Enrollment number is required';
      if (!formData.rollNo?.trim()) newErrors.rollNo = 'Roll number is required';
      if (!formData.admissionDate) newErrors.admissionDate = 'Admission date is required';
      if (!formData.classId) newErrors.classId = 'Class is required';
      if (!formData.sectionId) newErrors.sectionId = 'Section is required';
    } else if (step === 3) {
      if (formData.primaryContact === 'father') {
        if (!formData.fatherName?.trim()) newErrors.fatherName = "Father's name is required";
        if (!formData.fatherPhone || !PHONE_REGEX.test(formData.fatherPhone)) newErrors.fatherPhone = 'Valid 10-digit number required';
      } else if (formData.primaryContact === 'mother') {
        if (!formData.motherName?.trim()) newErrors.motherName = "Mother's name is required";
        if (!formData.motherPhone || !PHONE_REGEX.test(formData.motherPhone)) newErrors.motherPhone = 'Valid 10-digit number required';
      } else if (formData.primaryContact === 'guardian') {
        if (!formData.guardianName?.trim()) newErrors.guardianName = "Guardian's name is required";
        if (!formData.guardianPhone || !PHONE_REGEX.test(formData.guardianPhone)) newErrors.guardianPhone = 'Valid 10-digit number required';
        if (!formData.guardianRelation?.trim()) newErrors.guardianRelation = 'Required';
      }

      // Any phone the admin HAS filled in (even for a non-primary contact)
      // must still be well-formed — only presence is optional for those.
      if (formData.fatherPhone && !PHONE_REGEX.test(formData.fatherPhone) && formData.primaryContact !== 'father') newErrors.fatherPhone = 'Valid 10-digit number required';
      if (formData.motherPhone && !PHONE_REGEX.test(formData.motherPhone) && formData.primaryContact !== 'mother') newErrors.motherPhone = 'Valid 10-digit number required';
      if (formData.guardianPhone && !PHONE_REGEX.test(formData.guardianPhone) && formData.primaryContact !== 'guardian') newErrors.guardianPhone = 'Valid 10-digit number required';
      if (formData.whatsappNumber && !PHONE_REGEX.test(formData.whatsappNumber)) newErrors.whatsappNumber = 'Valid 10-digit number required';

      if (formData.parentEmail && !EMAIL_REGEX.test(formData.parentEmail)) {
        newErrors.parentEmail = 'Invalid email format';
      }

      if (formData.createParentLogin) {
        if (!formData.sendViaSms && !formData.sendViaEmail) {
          newErrors.sendViaSms = 'Select at least one delivery method';
        }
        if (formData.sendViaEmail && !formData.parentEmail) {
          newErrors.parentEmail = 'Email required for delivery';
        }
      }
    } else if (step === 4) {
      if (!formData.currentAddress?.trim()) newErrors.currentAddress = 'Address is required';
      if (!formData.city?.trim()) newErrors.city = 'City is required';
      if (!formData.state?.trim()) newErrors.state = 'State is required';
      if (!formData.pinCode?.trim()) {
        newErrors.pinCode = 'PIN code is required';
      } else if (!/^\d{6}$/.test(formData.pinCode?.trim())) {
        newErrors.pinCode = 'PIN code must be exactly 6 digits';
      }
    }

    return newErrors;
  };

  const validateStep = (step) => {
    const newErrors = getStepErrors(step);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Steps with actual required/validated fields — 5 (uploads) and 6 (review)
  // have none of their own, so there's nothing to gate there.
  const VALIDATED_STEPS = [1, 2, 3, 4];

  // Used by the Review step to show real status instead of an unconditional
  // "verified" banner, and by the final submit to catch anything a user
  // reached via the sidebar's jump-to-a-later-completed-step shortcut.
  const firstInvalidStep = () => VALIDATED_STEPS.find((s) => Object.keys(getStepErrors(s)).length > 0) || null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Basic Information" description="Enter the student's personal details." badge="Personal" />
            <div className="mb-5 grid gap-4 lg:grid-cols-[150px_1fr] xl:grid-cols-[160px_1fr]">
              <div className="flex flex-col items-start gap-3 sm:items-center">
                <div className="relative flex size-32 sm:size-36 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-blue-500 dark:border-slate-700 dark:bg-slate-800/50 group cursor-pointer">
                  {formData.profileImage ? (
                    <img src={typeof formData.profileImage === 'string' ? formData.profileImage : URL.createObjectURL(formData.profileImage)} alt="Preview" className="size-full object-cover" />
                  ) : (
                    <Camera className="text-slate-400 group-hover:text-blue-500" size={32} />
                  )}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, profileImage: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-400">Student photo</p>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingInput label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={User} error={errors.name} required autoComplete="off" />
                <FloatingInput label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} icon={Mail} error={errors.email} required autoComplete="off" />
                {!student && (
                  <label className="md:col-span-2 -mt-1 mb-1 flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.autoGeneratePassword}
                      onChange={(e) => setFormData((prev) => ({ ...prev, autoGeneratePassword: e.target.checked, password: '', confirmPassword: '' }))}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Auto-generate a secure password
                    <span className="font-medium text-slate-400">(recommended — you'll choose how to deliver it in the last step)</span>
                  </label>
                )}
                {(!student && formData.autoGeneratePassword) ? null : (
                  <>
                    <div className="relative">
                      <FloatingInput
                        label="Student Password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        icon={Shield}
                        error={errors.password}
                        required={!student}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-blue-500"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="relative">
                      <FloatingInput
                        label="Confirm Student Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        icon={Shield}
                        error={errors.confirmPassword}
                        required={!student}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-blue-500"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </>
                )}
                <FloatingInput label="Mobile Number" name="phone" value={formData.phone} onChange={handleDigitsChange(10)} icon={Smartphone} error={errors.phone} required inputMode="numeric" maxLength={10} autoComplete="off" />
                <FloatingInput label="Aadhaar ID" name="nationalId" value={formData.nationalId} onChange={handleDigitsChange(12)} icon={Fingerprint} error={errors.nationalId} required inputMode="numeric" maxLength={12} autoComplete="off" />
                <div className="relative md:col-span-2">
                  <FloatingInput
                    label="Institute Admin Password"
                    type={showAdminPassword ? 'text' : 'password'}
                    name="instituteAdminPassword"
                    value={formData.instituteAdminPassword || ''}
                    onChange={handleChange}
                    icon={Shield}
                    error={errors.instituteAdminPassword}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((v) => !v)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-blue-500"
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FloatingInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} error={errors.dob} required />
              <FloatingSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={['', 'MALE', 'FEMALE', 'OTHER']}
                error={errors.gender}
                required
              />
              <FloatingSelect label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={BLOOD_GROUP_OPTIONS} />
              <FloatingSelect label="Category" name="casteCategory" value={formData.casteCategory} onChange={handleChange} options={['', 'General', 'OBC', 'SC', 'ST', 'EWS', 'Other']} />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Academic & Previous School Details" description="Enrollment, class assignment, and previous school info." badge="Enrollment" />
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <FloatingInput label="Enrollment No" name="enrollmentNo" value={formData.enrollmentNo} readOnly icon={Fingerprint} error={errors.enrollmentNo} required />
                </div>
                <button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">
                  {idLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>
              <FloatingInput label="Roll No" name="rollNo" value={formData.rollNo} onChange={handleChange} icon={Fingerprint} error={errors.rollNo} required />
              <FloatingInput label="Admission Date" type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} error={errors.admissionDate} required />
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <FloatingSelect
                label="Class"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map(c => ({ value: c.id, label: c.name }))
                ]}
                error={errors.classId}
                required
              />

              <FloatingSelect
                label="Section"
                name="sectionId"
                value={formData.sectionId}
                onChange={handleChange}
                disabled={!formData.classId}
                options={[
                  { value: '', label: 'Select Section' },
                  ...sections.map(s => ({ value: s.id, label: s.name }))
                ]}
                error={errors.sectionId}
                required
              />
            </div>

            {/* Previous School & Board Information */}
            <div className="mb-6 p-4 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-3">
                Previous School & Board Details (For Transfer Students)
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingInput label="Previous School Name" name="previousSchoolName" value={formData.previousSchoolName} onChange={handleChange} icon={GraduationCap} />
                <FloatingInput label="Previous Admission / Reg No" name="previousAdmissionNo" value={formData.previousAdmissionNo} onChange={handleChange} icon={Fingerprint} />
                <FloatingInput label="Reason for Transfer" name="reasonForTransfer" value={formData.reasonForTransfer} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-2">
                  <FloatingInput label="Board Name (CBSE/ICSE/State)" name="boardName" value={formData.boardName} onChange={handleChange} />
                  <FloatingInput label="Board Reg No" name="boardRegistrationNo" value={formData.boardRegistrationNo} onChange={handleChange} />
                </div>
              </div>
            </div>

            {formData.sectionId && (
              <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                  Class setup — subjects & teachers
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  This student will follow the timetable and teacher assignments configured for this section.
                </p>
                {teachingMapLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" /> Loading…
                  </div>
                ) : teachingMap ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {teachingMap.className} · Section {teachingMap.sectionName}
                      <span className="ml-2 text-xs font-semibold text-blue-600">
                        {teachingMap.subjectCount} subject{teachingMap.subjectCount === 1 ? '' : 's'}
                      </span>
                    </p>
                    {teachingMap.classTeacher?.name && (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Class teacher: {teachingMap.classTeacher.name}
                      </p>
                    )}
                    {teachingMap.subjects?.length > 0 ? (
                      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-950">
                        {teachingMap.subjects.map((row) => (
                          <li key={row.subjectId || row.subjectName} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                            <span className="font-bold text-slate-800 dark:text-slate-100">{row.subjectName}</span>
                            <span className="text-xs font-semibold text-slate-500">
                              {row.teachers?.length
                                ? row.teachers.map((t) => t.name).join(', ')
                                : <span className="text-amber-600">No teacher assigned yet</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-semibold text-amber-600">
                        No subjects or teacher assignments found for this section. Add subjects under Subjects and assign teachers under Teachers → Academic Assignments.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <AIAssistantCard message={
              formData.sectionId && teachingMap?.subjectCount
                ? `This student will be enrolled in ${teachingMap.className} (${teachingMap.sectionName}) with ${teachingMap.subjectCount} subjects. Assignments, doubts, and timetable use these teacher mappings.`
                : `Select class and section to see which subjects and teachers apply. Configure teachers under Teachers → profile → Academic Assignments.`
            } />
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Parent Details" description="Guardian contact information." badge="Guardian" />

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Primary Contact
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Login credentials and notifications will be sent to the primary contact
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {['Father', 'Mother', 'Guardian'].map(option => (
                  <label
                    key={option}
                    className={`flex min-w-[110px] items-center justify-center gap-2 px-4 py-2.5
                      rounded-xl border cursor-pointer transition-colors
                      ${formData.primaryContact === option.toLowerCase()
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                      }`}
                  >
                    <input
                      type="radio"
                      name="primaryContact"
                      value={option.toLowerCase()}
                      checked={formData.primaryContact === option.toLowerCase()}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Father's Details
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FloatingInput label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} error={errors.fatherName} icon={User} />
                <FloatingInput label="Father's Phone" name="fatherPhone" value={formData.fatherPhone} onChange={handleDigitsChange(10)} error={errors.fatherPhone} icon={Smartphone} inputMode="numeric" maxLength={10} />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Mother's Details
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FloatingInput label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} error={errors.motherName} icon={User} />
                <FloatingInput label="Mother's Phone" name="motherPhone" value={formData.motherPhone} onChange={handleDigitsChange(10)} error={errors.motherPhone} icon={Smartphone} inputMode="numeric" maxLength={10} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
              <FloatingInput label="Parent Email" type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} error={errors.parentEmail} icon={Mail} />
              <FloatingInput label="WhatsApp Number" name="whatsappNumber" placeholder="WhatsApp number (for notifications)" value={formData.whatsappNumber} onChange={handleDigitsChange(10)} error={errors.whatsappNumber} icon={Smartphone} inputMode="numeric" maxLength={10} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
              <FloatingInput label="Parent Occupation" name="parentOccupation" value={formData.parentOccupation} onChange={handleChange} icon={Briefcase} />
              <FloatingInput label="Annual Income (Optional)" name="annualIncome" placeholder="Annual income (optional)" type="text" value={formData.annualIncome} onChange={handleChange} />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Guardian Details
                  <span className="text-slate-400 font-normal ml-1">
                    (if applicable)
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowGuardian(!showGuardian)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showGuardian || formData.primaryContact === 'guardian' ? 'Hide' : 'Add Guardian'}
                </button>
              </div>

              {(showGuardian || formData.primaryContact === 'guardian') && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FloatingInput label="Guardian Name" name="guardianName" value={formData.guardianName} onChange={handleChange} error={errors.guardianName} icon={User} />
                  <FloatingSelect
                    label="Relation to Student"
                    name="guardianRelation"
                    value={formData.guardianRelation}
                    onChange={handleChange}
                    error={errors.guardianRelation}
                    options={['', 'Uncle', 'Aunt', 'Grandparent', 'Elder Sibling', 'Other']}
                  />
                  <FloatingInput label="Guardian Phone" name="guardianPhone" value={formData.guardianPhone} onChange={handleDigitsChange(10)} error={errors.guardianPhone} icon={Smartphone} inputMode="numeric" maxLength={10} />
                </div>
              )}
            </div>

            <div className="border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 bg-blue-50 dark:bg-blue-500/10 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Create Parent Login Account
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Send login credentials to the primary contact
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.createParentLogin} onChange={(e) => updateField('createParentLogin', e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:size-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.createParentLogin && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Credentials will be sent via:
                    {errors.sendViaSms && <span className="ml-2 text-red-500">{errors.sendViaSms}</span>}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={formData.sendViaSms}
                        onChange={e => updateField('sendViaSms', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      SMS to primary phone
                    </label>
                    <label className={`flex items-center gap-2 text-xs ${!formData.parentEmail ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={formData.sendViaEmail}
                        onChange={e => updateField('sendViaEmail', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        disabled={!formData.parentEmail}
                      />
                      Email {!formData.parentEmail && '(add email above)'}
                    </label>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Address & Medical" description="Residence and health info." badge="Safety" />
            <div className="space-y-6">
              <FloatingInput label="Address" name="currentAddress" value={formData.currentAddress} onChange={handleChange} icon={MapPin} error={errors.currentAddress} required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FloatingInput label="City" name="city" value={formData.city} onChange={handleChange} error={errors.city} required />
                <FloatingInput label="State" name="state" value={formData.state} onChange={handleChange} error={errors.state} required />
                <FloatingInput label="PIN Code" name="pinCode" value={formData.pinCode} onChange={handleDigitsChange(6)} error={errors.pinCode} required inputMode="numeric" maxLength={6} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <FloatingInput label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} icon={AlertCircle} />
                <FloatingInput label="Medical Conditions" name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} icon={HeartPulse} />
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Document Uploads" description="Upload student identity, previous school, board, and category documents." badge="Docs" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                'Birth Certificate',
                'Aadhaar Card',
                'Medical / Health Record',
                'Transfer Certificate (TC)',
                'Previous Report Card',
                'Character Certificate',
                'Fee Clearance Certificate',
                'Migration Certificate',
                'Promotion / Pass Certificate',
                'Parent / Guardian ID',
                'Address Proof',
                'Caste / Category Certificate',
              ].map(doc => {
                const hasDoc = formData.documents?.[doc];
                return (
                  <div key={doc} className="relative min-h-36 p-4 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center group hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer overflow-hidden text-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleDocumentUpload(doc, e.target.files[0])}
                    />
                    {hasDoc ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-emerald-500 mb-1" size={24} />
                        <h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-0.5">{doc} Uploaded</h6>
                        <div className="flex gap-1.5 mt-1.5 relative z-20">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (hasDoc) window.open(hasDoc, '_blank', 'noopener,noreferrer'); }}
                            className="px-2.5 py-0.5 bg-white text-blue-600 rounded-lg text-[10px] font-bold shadow-sm hover:bg-blue-50"
                          >Preview</button>
                          <a
                            href={hasDoc}
                            download={`${doc.replace(/\s+/g, '_')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-0.5 bg-white text-emerald-600 rounded-lg text-[10px] font-bold shadow-sm hover:bg-emerald-50"
                          >Download</a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={20} />
                        <h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-0.5">{doc}</h6>
                        <p className="text-[10px] font-semibold text-slate-400">PDF, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      case 6: {
        const reviewBadStep = firstInvalidStep();
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <SectionHeader title="Review & Submit" description="Verify all student information." badge="Review" />
            <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white mb-6 sm:mb-8 shadow-2xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                <div className="size-24 sm:size-32 rounded-3xl border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                  {formData.profileImage ? <img src={typeof formData.profileImage === 'string' ? formData.profileImage : URL.createObjectURL(formData.profileImage)} className="size-full object-cover" /> : <User size={48} className="opacity-40" />}
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{formData.name || 'New Student'}</h3>
                  <div className="flex flex-wrap gap-4 text-sm font-bold text-white/80">
                    <div>{formData.enrollmentNo || 'No Enrollment'}</div>
                    <div>{formData.email || 'No Email'}</div>
                  </div>
                </div>
              </div>
            </div>
            {reviewBadStep ? (
              <button
                type="button"
                onClick={() => { validateStep(reviewBadStep); setCurrentStep(reviewBadStep); }}
                className="flex w-full items-center gap-4 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-8 text-left transition hover:bg-amber-500/15"
              >
                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Missing or invalid information in "{STEPS.find((s) => s.id === reviewBadStep)?.title}" — tap to go fix it.
                </p>
              </button>
            ) : (
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
                <CheckCircle className="text-emerald-500" size={20} />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Information verified and ready for enrollment.</p>
              </div>
            )}

            <div className="grid gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-blue-500" /> Student Details Summary
                </h4>
                <div className="grid grid-cols-1 gap-y-4 gap-x-6 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Mobile</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Aadhaar ID</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.nationalId || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Date of Birth</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.dob || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Gender</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{formData.gender?.toLowerCase() || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap size={16} className="text-blue-500" /> Academic Details Summary
                </h4>
                <div className="grid grid-cols-1 gap-y-4 gap-x-6 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Roll No</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.rollNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Admission Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.admissionDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Class & Section</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {classes.find((c) => c.id === formData.classId)?.name || '—'}
                      {formData.sectionId ? ` • ${sections.find((s) => s.id === formData.sectionId)?.name || ''}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" /> Address Summary
                </h4>
                <div className="grid grid-cols-1 gap-y-4 gap-x-6 text-sm md:grid-cols-2">
                  <div className="md:col-span-2">
                    <span className="text-slate-500 block text-xs mb-1">Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.currentAddress || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">City / State</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{[formData.city, formData.state].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">PIN Code</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.pinCode || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Parent Details Summary
                </h4>
                <div className="grid grid-cols-1 gap-y-4 gap-x-6 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Primary Contact</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{formData.primaryContact}</span>
                  </div>
                  {formData.fatherName && (
                    <div>
                      <span className="text-slate-500 block text-xs mb-1">Father</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.fatherName} • {formData.fatherPhone}</span>
                    </div>
                  )}
                  {formData.motherName && (
                    <div>
                      <span className="text-slate-500 block text-xs mb-1">Mother</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.motherName} • {formData.motherPhone}</span>
                    </div>
                  )}
                  {formData.primaryContact === 'guardian' && formData.guardianName && (
                    <div>
                      <span className="text-slate-500 block text-xs mb-1">Guardian ({formData.guardianRelation})</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.guardianName} • {formData.guardianPhone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Communication</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formData.parentEmail || 'No Email'}
                      {formData.whatsappNumber ? ` • WhatsApp: ${formData.whatsappNumber}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Parent Login</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formData.createParentLogin
                        ? `Yes (via ${[formData.sendViaSms && 'SMS', formData.sendViaEmail && 'Email'].filter(Boolean).join(' & ')})`
                        : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {!student && (
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wider flex items-center gap-2">
                    <Shield size={16} className="text-blue-500" /> Student Login Delivery
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    How should {formData.name || 'the student'} receive their login details?
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      { value: 'student_email', label: "Student's Email", hint: formData.email || 'No email on file' },
                      { value: 'parent_email', label: "Parent's Email", hint: formData.parentEmail || 'No parent email on file' },
                      { value: 'slip', label: 'Printable Slip', hint: 'Download a PDF to hand out' },
                      { value: 'skip', label: "Skip for now", hint: "You'll send it later from the student's profile" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3.5 transition ${
                          formData.credentialDeliveryChannel === opt.value
                            ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <input
                          type="radio"
                          name="credentialDeliveryChannel"
                          value={opt.value}
                          checked={formData.credentialDeliveryChannel === opt.value}
                          onChange={handleChange}
                          className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                          <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{opt.label}</span>
                          <span className="block text-xs text-slate-400">{opt.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      }
      default: return null;
    }
  };

  const goToStep = (stepId) => {
    let canGo = true;
    for (let i = 1; i < stepId; i++) {
      if (!validateStep(i)) {
        canGo = false;
        break;
      }
    }
    if (canGo) setCurrentStep(stepId);
  };

  return (
    <div className={`flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 ${pageMode ? 'min-h-[calc(100vh-150px)] rounded-[20px] lg:h-[calc(100vh-168px)] lg:min-h-[620px] lg:rounded-[24px]' : 'h-[calc(90vh-88px)] min-h-[520px]'}`}>
        <div className="shrink-0 border-b border-slate-200 bg-[#f3f6fb] p-2 dark:border-slate-800 dark:bg-slate-950 lg:p-3">
          <StepRail currentStep={currentStep} onStepClick={goToStep} compact />
        </div>

        <div className="h-1 shrink-0 bg-slate-200 dark:bg-slate-800">
          <motion.div className="h-full bg-blue-600" animate={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
        </div>

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:px-6 custom-scrollbar">
          <div className="w-full">
            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
          </div>
        </main>

        <div className="sticky bottom-0 shrink-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 sm:p-4 lg:static">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={onCancel} className="rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 sm:py-3">Cancel</button>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              {currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 sm:px-5 sm:py-3"><ChevronLeft size={16} /> Back</button>}
              <button
                onClick={() => {
                  if (VALIDATED_STEPS.includes(currentStep) && !validateStep(currentStep)) {
                    return;
                  }
                  setErrors({});
                  if (currentStep < STEPS.length) {
                    setCurrentStep(s => s + 1);
                  } else {
                    // Safety net: re-check every step before the real submit,
                    // in case one was reached without going through Next (e.g.
                    // the sidebar's own jump-ahead guard, or state restored
                    // from an edit). Jump to the first thing still wrong
                    // instead of silently failing at the API.
                    const badStep = firstInvalidStep();
                    if (badStep) {
                      validateStep(badStep);
                      setCurrentStep(badStep);
                      return;
                    }
                    onSubmit(formData);
                  }
                }}
                disabled={isLoading}
                className={`${currentStep === 1 ? 'col-span-2 sm:col-span-1' : ''} inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50 sm:px-6 sm:py-3`}
              >
                {currentStep < STEPS.length ? (
                  <>Next Step <ChevronRight size={16} /></>
                ) : (
                  <>
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                    Enroll Student
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
