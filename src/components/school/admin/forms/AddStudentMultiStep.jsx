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

const STEPS = [
  { id: 1, title: 'Basic Information', icon: User, description: 'Personal & identity details' },
  { id: 2, title: 'Academic Details', icon: GraduationCap, description: 'Enrollment & class info' },
  { id: 3, title: 'Parent Details', icon: Users, description: 'Guardian information' },
  { id: 4, title: 'Address & Medical', icon: MapPin, description: 'Residence & health info' },
  { id: 5, title: 'Document Uploads', icon: Upload, description: 'Identity & certificates' },
  { id: 6, title: 'Review & Submit', icon: CheckCircle, description: 'Final verification' }
];

const BLOOD_GROUP_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_STATUS_OPTIONS = ['', 'Single', 'Married'];

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
          ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800'}
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
            value={value}
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
        relative flex items-center transition-all duration-300 rounded-2xl border-2 
        ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800'}
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
          value={value}
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
  <div className="relative">
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full h-[54px] rounded-2xl border-2 ${error ? 'border-red-500' : 'border-slate-100 dark:border-slate-800'} bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-4 pt-4 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-blue-500 disabled:opacity-50`}
    >
      {options.map((option) => {
        const val = typeof option === 'object' ? option.value : option;
        const lbl = typeof option === 'object' ? option.label : (option || `Select ${label}`);
        return (
          <option key={val || 'blank'} value={val} className="dark:bg-slate-900">
            {lbl}
          </option>
        );
      })}
    </select>
    <label className="absolute left-4 top-1.5 text-[10px] font-bold tracking-tight uppercase text-blue-600 dark:text-blue-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
  </div>
);

const SectionHeader = ({ title, description, badge }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-1">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">{title}</h2>
      {badge && (
        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold tracking-tight uppercase tracking-widest border border-blue-500/20">
          {badge}
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

const AIAssistantCard = ({ message }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"
  >
    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 shrink-0">
      <Sparkles className="text-white" size={20} />
    </div>
    <div>
      <h4 className="text-sm font-bold tracking-tight text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">EDDVA AI Insight</h4>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>
    </div>
  </motion.div>
);

export default function AddStudentMultiStep({ student, onSubmit, onCancel, isLoading }) {
  const { institute } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    dob: '', gender: '', bloodGroup: '', maritalStatus: '', nationalId: '', profileImage: null,
    enrollmentNo: '', rollNo: '', classId: '', sectionId: '', admissionDate: '',
    primaryContact: 'father', fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', parentEmail: '', whatsappNumber: '', parentOccupation: '', annualIncome: '', guardianName: '', guardianRelation: '', guardianPhone: '', createParentLogin: true, sendViaSms: true, sendViaEmail: false,
    currentAddress: '', permanentAddress: '', city: '', state: '', pinCode: '',
    allergies: '', medicalConditions: '', documents: {},
  });

  const [idLoading, setIdLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      setClasses(Array.isArray(data) ? data : []);
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
        dob: formatInputDate(profile.dob || student.dob),
        admissionDate: formatInputDate(profile.admissionDate || student.admissionDate),
      }));
    }
  }, [student, classes]);

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateField(name, type === 'checkbox' ? checked : value);
  };

  const validateStep3 = () => {
    const errs = {};
    const phoneRegex = /^\d{10}$/;

    if (formData.primaryContact === 'father') {
      if (!formData.fatherName?.trim()) errs.fatherName = "Required";
      if (!formData.fatherPhone || !phoneRegex.test(formData.fatherPhone)) errs.fatherPhone = "Valid 10-digit number required";
    } else if (formData.primaryContact === 'mother') {
      if (!formData.motherName?.trim()) errs.motherName = "Required";
      if (!formData.motherPhone || !phoneRegex.test(formData.motherPhone)) errs.motherPhone = "Valid 10-digit number required";
    } else if (formData.primaryContact === 'guardian') {
      if (!formData.guardianName?.trim()) errs.guardianName = "Required";
      if (!formData.guardianPhone || !phoneRegex.test(formData.guardianPhone)) errs.guardianPhone = "Valid 10-digit number required";
      if (!formData.guardianRelation?.trim()) errs.guardianRelation = "Required";
    }

    if (formData.fatherPhone && !phoneRegex.test(formData.fatherPhone) && formData.primaryContact !== 'father') errs.fatherPhone = "Valid 10-digit number required";
    if (formData.motherPhone && !phoneRegex.test(formData.motherPhone) && formData.primaryContact !== 'mother') errs.motherPhone = "Valid 10-digit number required";
    if (formData.guardianPhone && !phoneRegex.test(formData.guardianPhone) && formData.primaryContact !== 'guardian') errs.guardianPhone = "Valid 10-digit number required";
    if (formData.whatsappNumber && !phoneRegex.test(formData.whatsappNumber)) errs.whatsappNumber = "Valid 10-digit number required";

    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      errs.parentEmail = "Invalid email format";
    }

    if (formData.createParentLogin) {
      if (!formData.sendViaSms && !formData.sendViaEmail) {
        errs.sendViaSms = "Select at least one delivery method";
      }
      if (formData.sendViaEmail && !formData.parentEmail) {
        errs.parentEmail = "Email required for delivery";
      }
    }

    return errs;
  };

  const generateEnrollmentNo = async () => {
    setIdLoading(true);
    try {
      const res = await api.get('/students');
      const list = res.data?.data ?? res.data;
      const count = Array.isArray(list) ? list.length : 0;
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

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name?.trim()) newErrors.name = 'Full Name is required';
      
      if (!formData.email?.trim()) {
        newErrors.email = 'Email Address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
      
      if (!formData.phone?.trim()) {
        newErrors.phone = 'Mobile Number is required';
      } else if (!/^\d{10}$/.test(formData.phone?.trim())) {
        newErrors.phone = 'Mobile number must be exactly 10 digits';
      }
      
      if (!formData.nationalId?.trim()) {
        newErrors.nationalId = 'Aadhar / National ID is required';
      }
      
      if (!formData.dob) {
        newErrors.dob = 'Date of birth is required';
      }
      
      if (!formData.gender) {
        newErrors.gender = 'Gender is required';
      }
      
      if (!student) {
        if (!formData.password) {
          newErrors.password = 'Student Password is required';
        } else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      } else {
        if (formData.password && formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.password && formData.password !== formData.confirmPassword) {
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
      if (!formData.fatherName?.trim()) newErrors.fatherName = "Father's name is required";
      if (!formData.motherName?.trim()) newErrors.motherName = "Mother's name is required";
      if (!formData.parentPhone?.trim()) {
        newErrors.parentPhone = 'Parent phone is required';
      } else if (!/^\d{10}$/.test(formData.parentPhone?.trim())) {
        newErrors.parentPhone = 'Parent phone must be exactly 10 digits';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Basic Information" description="Enter the student's personal details." badge="Personal" />
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="shrink-0 flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-500 transition-all">
                  {formData.profileImage ? (
                    <img src={typeof formData.profileImage === 'string' ? formData.profileImage : URL.createObjectURL(formData.profileImage)} alt="Preview" className="w-full h-full object-cover" />
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
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={User} error={errors.name} required />
                <FloatingInput label="Email Address" name="email" value={formData.email} onChange={handleChange} icon={Mail} error={errors.email} required />
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-blue-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FloatingInput
                  label="Confirm Student Password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={Shield}
                  error={errors.confirmPassword}
                  required={!student}
                />
                <FloatingInput label="Mobile Number" name="phone" value={formData.phone} onChange={handleChange} icon={Smartphone} error={errors.phone} required />
                <FloatingInput label="Aadhar / National ID" name="nationalId" value={formData.nationalId} onChange={handleChange} icon={Fingerprint} error={errors.nationalId} required />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <FloatingSelect label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={MARITAL_STATUS_OPTIONS} />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Academic Details" description="Enrollment and class assignment." badge="Enrollment" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
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
              <div className="flex gap-4">
                {['Father', 'Mother', 'Guardian'].map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-4 py-2.5
                      rounded-lg border cursor-pointer transition-colors
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
              <div className="grid grid-cols-2 gap-4">
                <FloatingInput label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} error={errors.fatherName} icon={User} />
                <FloatingInput label="Father's Phone" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} error={errors.fatherPhone} icon={Smartphone} />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Mother's Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FloatingInput label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} error={errors.motherName} icon={User} />
                <FloatingInput label="Mother's Phone" name="motherPhone" value={formData.motherPhone} onChange={handleChange} error={errors.motherPhone} icon={Smartphone} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <FloatingInput label="Parent Email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} error={errors.parentEmail} icon={Mail} />
              <FloatingInput label="WhatsApp Number" name="whatsappNumber" placeholder="WhatsApp number (for notifications)" value={formData.whatsappNumber} onChange={handleChange} error={errors.whatsappNumber} icon={Smartphone} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput label="Guardian Name" name="guardianName" value={formData.guardianName} onChange={handleChange} error={errors.guardianName} icon={User} />
                  <FloatingSelect 
                    label="Relation to Student" 
                    name="guardianRelation" 
                    value={formData.guardianRelation} 
                    onChange={handleChange} 
                    error={errors.guardianRelation}
                    options={['', 'Uncle', 'Aunt', 'Grandparent', 'Elder Sibling', 'Other']} 
                  />
                  <FloatingInput label="Guardian Phone" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} error={errors.guardianPhone} icon={Smartphone} />
                  <div/>
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
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.createParentLogin && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Credentials will be sent via:
                    {errors.sendViaSms && <span className="ml-2 text-red-500">{errors.sendViaSms}</span>}
                  </p>
                  <div className="flex gap-4">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FloatingInput label="City" name="city" value={formData.city} onChange={handleChange} error={errors.city} required />
                <FloatingInput label="State" name="state" value={formData.state} onChange={handleChange} error={errors.state} required />
                <FloatingInput label="PIN Code" name="pinCode" value={formData.pinCode} onChange={handleChange} error={errors.pinCode} required />
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
            <SectionHeader title="Document Uploads" description="Upload necessary certificates." badge="Docs" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Birth Certificate', 'Aadhar Card', 'Previous Marksheet', 'Transfer Certificate'].map(doc => {
                const hasDoc = formData.documents?.[doc];
                return (
                  <div key={doc} className="relative p-8 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center group hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer overflow-hidden">
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={(e) => handleDocumentUpload(doc, e.target.files[0])} 
                    />
                    {hasDoc ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-emerald-500 mb-2" size={32} />
                        <h6 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white mb-1">{doc} Uploaded</h6>
                        <div className="flex gap-2 mt-2 relative z-20">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); const w = window.open(); w.document.write(`<iframe src="${hasDoc}" width="100%" height="100%"></iframe>`); }}
                            className="px-3 py-1 bg-white text-blue-600 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50"
                          >Preview</button>
                          <a 
                            href={hasDoc} 
                            download={`${doc.replace(' ', '_')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 bg-white text-emerald-600 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-50"
                          >Download</a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={24} />
                        <h6 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white mb-1">{doc}</h6>
                        <p className="text-xs font-bold text-slate-400">PDF, DOC, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      case 6:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <SectionHeader title="Review & Submit" description="Verify all student information." badge="Review" />
            <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600 to-blue-700 text-white mb-8 shadow-2xl">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 rounded-[2rem] border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                   {formData.profileImage ? <img src={typeof formData.profileImage === 'string' ? formData.profileImage : URL.createObjectURL(formData.profileImage)} className="w-full h-full object-cover" /> : <User size={48} className="opacity-40" />}
                </div>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight mb-2">{formData.name || 'New Student'}</h3>
                  <div className="flex flex-wrap gap-4 text-sm font-bold text-white/80">
                    <div>{formData.enrollmentNo || 'No Enrollment'}</div>
                    <div>{formData.email || 'No Email'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <CheckCircle className="text-emerald-500" size={20} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Information verified and ready for enrollment.</p>
            </div>
            
            <div className="grid gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Parent Details Summary
                </h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
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
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-[85vh] min-h-[600px] overflow-hidden bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
      <div className="w-80 shrink-0 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800 p-8 hidden lg:flex flex-col">
        <div className="mb-10 font-bold tracking-tight text-2xl tracking-tighter text-slate-900 dark:text-white">EDDVA <span className="text-blue-600">STUDENT</span></div>
        <div className="flex-1 space-y-2">
          {STEPS.map(step => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button 
                key={step.id} 
                onClick={() => {
                  // Allow clicking directly to standard steps only if valid
                  let canGo = true;
                  for (let i = 1; i < step.id; i++) {
                    if (!validateStep(i)) {
                      canGo = false;
                      break;
                    }
                  }
                  if (canGo) {
                    setCurrentStep(step.id);
                  }
                }} 
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                  {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                </div>
                <div className="text-left">
                  <h4 className={`text-xs font-bold tracking-tight uppercase tracking-wider ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{step.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 flex flex-col relative">
        <div className="h-1 bg-slate-100 dark:bg-slate-800 absolute top-0 left-0 right-0 z-20">
          <motion.div className="h-full bg-blue-600" animate={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
        </div>
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>
        <div className="p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-between">
          <button onClick={onCancel} className="text-sm font-bold tracking-tight text-slate-400 hover:text-slate-900 transition-colors">CANCEL</button>
          <div className="flex gap-3">
            {currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}
            <button 
              onClick={() => {
                if (currentStep === 3) {
                  const errs = validateStep3();
                  if (Object.keys(errs).length > 0) {
                    setErrors(errs);
                    return;
                  }
                  setErrors({});
                }
                if (currentStep < STEPS.length) {
                  setCurrentStep(s => s + 1);
                } else {
                  onSubmit(formData);
                }
              }} 
              disabled={isLoading}
              className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"
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
