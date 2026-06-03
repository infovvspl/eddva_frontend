import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, BookOpen, Briefcase, MapPin, FileText, CheckCircle, 
  Camera, Plus, Trash2, Upload, Sparkles, AlertCircle, 
  Eye, EyeOff, ChevronRight, ChevronLeft, Save, 
  Smartphone, Mail, Shield, HeartPulse,
  Award, Globe, Clock, Building, Check, Loader2, Calendar, FileDown
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import SearchableMultiSelect from './SearchableMultiSelect';

// --- Constants ---
const STEPS = [
  { id: 1, title: 'Basic Information', icon: User, description: 'Personal & identity details' },
  { id: 2, title: 'Academic Qualification', icon: Award, description: 'Degrees & qualifications' },
  { id: 3, title: 'School Assignment', icon: BookOpen, description: 'Class, Section & Subject mapping' },
  { id: 4, title: 'Professional Information', icon: Briefcase, description: 'Join details & experience history' },
  { id: 5, title: 'Availability', icon: Clock, description: 'Shifts & working hours' },
  { id: 6, title: 'Address & Emergency', icon: MapPin, description: 'Contacts & medical info' },
  { id: 7, title: 'Documents', icon: Upload, description: 'Upload verification files' },
  { id: 8, title: 'Review & Submit', icon: CheckCircle, description: 'Verify & save profile' }
];

const BLOOD_GROUP_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_STATUS_OPTIONS = ['', 'Single', 'Married', 'Divorced', 'Widowed'];
const GENDER_OPTIONS = ['', 'MALE', 'FEMALE', 'OTHER'];
const EMPLOYMENT_TYPE_OPTIONS = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING'];
const SHIFT_OPTIONS = ['Morning Shift (8:00 AM - 2:00 PM)', 'Regular Shift (9:00 AM - 4:00 PM)', 'Afternoon Shift (1:00 PM - 7:00 PM)'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

// --- Sub-components ---

const FloatingInput = React.memo(function FloatingInput({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, error, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;
  const isDateField = type === 'date';

  if (isDateField) {
    return (
      <div className="relative group">
        <label className="mb-2 block text-[10px] font-bold tracking-tight uppercase tracking-widest text-blue-600 dark:text-blue-400">
          {label}
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
          {label}
        </label>
      </div>
      {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
    </div>
  );
});

const FloatingSelect = React.memo(function FloatingSelect({ label, name, value, onChange, options, error }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full h-[54px] rounded-2xl border-2 ${error ? 'border-red-500' : 'border-slate-100 dark:border-slate-800'} bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-4 pt-4 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-blue-500`}
      >
        {options.map((option) => (
          <option key={option || 'blank'} value={option} className="dark:bg-slate-900">
            {option || `Select ${label}`}
          </option>
        ))}
      </select>
      <label className="absolute left-4 top-1.5 text-[10px] font-bold tracking-tight uppercase text-blue-600 dark:text-blue-400">{label}</label>
      {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
    </div>
  );
});

const SectionHeader = React.memo(function SectionHeader({ title, description, badge }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">{title}</h2>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-sky-400 text-[10px] font-bold tracking-tight uppercase tracking-widest border border-blue-500/20">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
});

const AIAssistantCard = React.memo(function AIAssistantCard({ message }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 dark:border-slate-800 rounded-2xl p-5 mb-8 flex gap-4 items-start"
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
});

export default function AddTeacherMultiStep({ teacher, onSubmit, onCancel, isLoading }) {
  const { institute } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '', email: '', password: '', confirmPassword: '', phone: '', altPhone: '',
    dob: '', gender: '', bloodGroup: '', nationalId: '', nationality: 'Indian',
    religion: '', maritalStatus: '', photo: null,
    
    // Academic
    qualification: '', degree: '', institute: '', passingYear: '', 
    specialization: '', languages: '', certifications: '',
    experience: '', achievements: '',
    educationDetails: [],
    experienceDetails: [],

    // School Assignments
    assignedRows: [{ id: 'init', classId: '', sectionId: '', subjectIds: [], isClassTeacher: false }],

    // Professional
    department: '', role: '', employmentType: 'FULL_TIME', joinDate: '',
    salary: '', employeeCode: '',

    // Availability
    shift: 'Regular Shift (9:00 AM - 4:00 PM)',
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    officeHoursStart: '09:00',
    officeHoursEnd: '16:00',
    maxHoursPerWeek: '40',

    // Address & Emergency
    currentAddress: '', permanentAddress: '', sameAsPermanent: false,
    emergencyContact: '', guardianContact: '',
    allergies: '', medicalConditions: '', disability: '', emergencyDoctor: '',

    // Documents
    docs: {}
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [idLoading, setIdLoading] = useState(false);
  
  // Dynamic collections
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      const data = res.data?.data ?? res.data;
      setClassesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      const data = res.data?.data ?? res.data;
      setSubjectsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  // Sync edit mode data
  useEffect(() => {
    if (teacher) {
      const profile = teacher.teacherProfile || {};
      const flatAssignments = profile.assignments || [];
      const grouped = {};
      flatAssignments.forEach(a => {
        const key = `${a.classId}_${a.sectionId}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            classId: a.classId,
            sectionId: a.sectionId,
            subjectIds: [],
            isClassTeacher: !!a.isClassTeacher
          };
        }
        if (a.subjectId) {
          grouped[key].subjectIds.push(a.subjectId);
        }
        if (a.isClassTeacher) {
          grouped[key].isClassTeacher = true;
        }
      });
      const assignedRows = Object.values(grouped);

      const qualificationsArr = String(profile.qualifications || '').split(' | ');

      const parseJsonArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      const parseJsonObject = (val) => {
        if (!val) return {};
        if (typeof val === 'object' && !Array.isArray(val)) return val;
        try {
          const parsed = JSON.parse(val);
          return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch {
          return {};
        }
      };

      setFormData(prev => ({
        ...prev,
        ...teacher,
        ...profile,
        qualification: qualificationsArr[0] || '',
        degree: qualificationsArr[1] || '',
        specialization: qualificationsArr[2] || '',
        employeeCode: profile.employeeId || profile.employeeCode || teacher.employeeId || '',
        joinDate: profile.joiningDate ? new Date(profile.joiningDate).toISOString().split('T')[0] : '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        educationDetails: parseJsonArray(profile.educationDetails),
        experienceDetails: parseJsonArray(profile.experienceDetails),
        assignedRows: assignedRows.length > 0 ? assignedRows : [{ id: 'init', classId: '', sectionId: '', subjectIds: [], isClassTeacher: false }],
        // availability
        shift: profile.shift || prev.shift,
        weekdays: Array.isArray(profile.weekdays) ? profile.weekdays : prev.weekdays,
        officeHoursStart: profile.officeHoursStart || prev.officeHoursStart,
        officeHoursEnd: profile.officeHoursEnd || prev.officeHoursEnd,
        maxHoursPerWeek: profile.maxHoursPerWeek || prev.maxHoursPerWeek,
        // address & emergency
        currentAddress: profile.currentAddress || prev.currentAddress,
        permanentAddress: profile.permanentAddress || prev.permanentAddress,
        emergencyContact: profile.emergencyContact || prev.emergencyContact,
        guardianContact: profile.guardianContact || prev.guardianContact,
        allergies: profile.allergies || prev.allergies,
        medicalConditions: profile.medicalConditions || prev.medicalConditions,
        disability: profile.disability || prev.disability,
        emergencyDoctor: profile.emergencyDoctor || prev.emergencyDoctor,
        docs: parseJsonObject(profile.docs)
      }));
    }
  }, [teacher]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleStepSelect = (stepId) => {
    if (validateStep(currentStep)) {
      setCurrentStep(stepId);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(STEPS.length, prev + 1));
    }
  };

  const generateTeacherId = useCallback(async () => {
    setIdLoading(true);
    try {
      const res = await api.get('/teachers');
      const list = res.data?.data ?? res.data;
      const count = Array.isArray(list) ? list.length : 0;
      setFormData(prev => ({ ...prev, employeeCode: getScopedId(institute?.name, count) }));
    } catch (error) {
      console.error('Failed to generate teacher id:', error);
      setFormData(prev => ({ ...prev, employeeCode: getScopedId(institute?.name, 0) }));
    } finally {
      setIdLoading(false);
    }
  }, [institute?.name]);

  // Validation
  const validateStep = (step) => {
    const tempErrors = {};
    if (step === 1) {
      if (!formData.name?.trim()) tempErrors.name = 'Full name is required';
      if (!formData.email?.trim()) tempErrors.email = 'Email address is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = 'Invalid email address';
      if (!teacher) {
        if (!formData.password) tempErrors.password = 'Password is required';
        if (formData.password !== formData.confirmPassword) tempErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.phone?.trim()) tempErrors.phone = 'Mobile number is required';
    } else if (step === 3) {
      // Validate Assignments
      const rows = formData.assignedRows || [];
      rows.forEach((r, idx) => {
        if (r.classId && !r.sectionId) {
          tempErrors[`row_${idx}_section`] = 'Please select a section';
        }
      });
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveAssignments = useCallback(() => {
    const flatAssignments = [];
    const rows = formData.assignedRows || [];
    rows.forEach(r => {
      if (r.classId && r.sectionId) {
        if (r.subjectIds.length > 0) {
          r.subjectIds.forEach(subId => {
            flatAssignments.push({
              classId: r.classId,
              sectionId: r.sectionId,
              subjectId: subId,
              isClassTeacher: !!r.isClassTeacher
            });
          });
        } else {
          flatAssignments.push({
            classId: r.classId,
            sectionId: r.sectionId,
            subjectId: null,
            isClassTeacher: !!r.isClassTeacher
          });
        }
      }
    });

    const qualificationsStr = [formData.qualification, formData.degree, formData.specialization]
      .filter(Boolean)
      .join(' | ');

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password || undefined,
      confirmPassword: formData.confirmPassword || undefined,
      phone: formData.phone || null,
      photo: formData.photo || null,
      employeeId: formData.employeeCode || null,
      bloodGroup: formData.bloodGroup || null,
      maritalStatus: formData.maritalStatus || null,
      department: formData.department || null,
      joiningDate: formData.joinDate || null,
      qualifications: qualificationsStr || null,
      educationDetails: formData.educationDetails,
      experienceDetails: formData.experienceDetails,
      assignments: flatAssignments,
      // availability
      shift: formData.shift,
      weekdays: formData.weekdays,
      officeHoursStart: formData.officeHoursStart,
      officeHoursEnd: formData.officeHoursEnd,
      maxHoursPerWeek: formData.maxHoursPerWeek,
      // address & emergency
      currentAddress: formData.currentAddress || null,
      permanentAddress: formData.sameAsPermanent ? formData.currentAddress : (formData.permanentAddress || null),
      emergencyContact: formData.emergencyContact || null,
      guardianContact: formData.guardianContact || null,
      allergies: formData.allergies || null,
      medicalConditions: formData.medicalConditions || null,
      disability: formData.disability || null,
      emergencyDoctor: formData.emergencyDoctor || null,
      docs: formData.docs,
      // missing fields
      dob: formData.dob || null,
      gender: formData.gender || null,
      nationalId: formData.nationalId || null,
      role: formData.role || null,
      salary: formData.salary || null,
      experience: formData.experience || null
    };

    onSubmit(payload);
  }, [formData, onSubmit]);

  // Section lists mapped dynamically per row
  const getSectionsForClass = (classId) => {
    const cls = classesList.find(c => String(c.id) === String(classId));
    return cls ? (cls.sections || []) : [];
  };

  // Subjects filtered dynamically per row class
  const getSubjectsForClassSection = (classId, sectionId) => {
    if (!classId) return [];
    return subjectsList.filter(sub => String(sub.class_id) === String(classId));
  };

  // Step 1: Basic Info
  const renderBasicInfo = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <SectionHeader title="Basic Information" description="Set up the primary profile, portal login details, and contact info." badge="Identity" />
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="shrink-0 flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all">
            {formData.photo ? (
              <img src={typeof formData.photo === 'string' ? formData.photo : URL.createObjectURL(formData.photo)} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="text-slate-400 group-hover:text-blue-500 transition-colors" size={32} />
                <span className="text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400 mt-2">Upload Photo</span>
              </>
            )}
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, photo: reader.result }));
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG up to 2MB</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} icon={User} />
          <FloatingInput label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} />
          {!teacher && (
            <>
              <div className="relative">
                <FloatingInput label="Password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} error={errors.password} icon={Shield} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-blue-500 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FloatingInput label="Confirm Password" type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} icon={Shield} />
            </>
          )}
          <FloatingInput label="Mobile Number" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} icon={Smartphone} />
          <FloatingInput label="Aadhar / National ID" name="nationalId" value={formData.nationalId} onChange={handleChange} icon={Shield} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FloatingInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
        <FloatingSelect label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={GENDER_OPTIONS} />
        <FloatingSelect label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={BLOOD_GROUP_OPTIONS} />
        <FloatingSelect label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={MARITAL_STATUS_OPTIONS} />
      </div>

      <AIAssistantCard message="EDDVA AI validated email and phone syntax. Everything is clear to deploy." />
    </motion.div>
  );

  // Step 2: Academic Qualification
  const renderAcademicQualification = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <SectionHeader title="Academic Qualification" description="Track the educational background, qualifications, and certifications." badge="Education" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloatingInput label="Highest Qualification" name="qualification" value={formData.qualification} onChange={handleChange} icon={Award} />
        <FloatingInput label="Degree / Diploma" name="degree" value={formData.degree} onChange={handleChange} icon={FileText} />
        <FloatingInput label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} icon={Sparkles} />
        <FloatingInput label="University / Institute" name="institute" value={formData.institute} onChange={handleChange} icon={Building} />
        <FloatingInput label="Passing Year" name="passingYear" value={formData.passingYear} onChange={handleChange} icon={Clock} />
        <FloatingInput label="Languages Known" name="languages" value={formData.languages} onChange={handleChange} icon={Globe} />
      </div>

      {/* Education History List */}
      <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Education History</h4>
            <p className="text-[10px] font-semibold text-slate-400">List previous educational milestones</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              educationDetails: [...prev.educationDetails, { qualification: '', institute: '', year: '', grade: '' }]
            }))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="space-y-3">
          {formData.educationDetails.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_40px] gap-2.5 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="Degree / Diploma"
                value={row.qualification}
                onChange={(e) => {
                  const list = [...formData.educationDetails];
                  list[idx].qualification = e.target.value;
                  setFormData(prev => ({ ...prev, educationDetails: list }));
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Institute / Board"
                value={row.institute}
                onChange={(e) => {
                  const list = [...formData.educationDetails];
                  list[idx].institute = e.target.value;
                  setFormData(prev => ({ ...prev, educationDetails: list }));
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Year"
                value={row.year}
                onChange={(e) => {
                  const list = [...formData.educationDetails];
                  list[idx].year = e.target.value;
                  setFormData(prev => ({ ...prev, educationDetails: list }));
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold text-center"
              />
              <input
                type="text"
                placeholder="Grade / Pct"
                value={row.grade}
                onChange={(e) => {
                  const list = [...formData.educationDetails];
                  list[idx].grade = e.target.value;
                  setFormData(prev => ({ ...prev, educationDetails: list }));
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold text-center"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  educationDetails: prev.educationDetails.filter((_, i) => i !== idx)
                }))}
                className="flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-xl"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {formData.educationDetails.length === 0 && (
            <p className="text-center py-4 text-xs font-semibold text-slate-400">No education milestones added yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Step 3: School Assignment (Cascading Class -> Section -> Subject)
  const renderSchoolAssignment = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <SectionHeader title="School Assignment" description="Assign classes, sections, and subjects this teacher will manage. Designate Class Teacher role here." badge="Academic Mapping" />

      <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Mapping Rows</h4>
            <p className="text-[10px] font-semibold text-slate-400">Map Class &rarr; Section &rarr; Subjects</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              assignedRows: [...prev.assignedRows, { id: String(Date.now()), classId: '', sectionId: '', subjectIds: [], isClassTeacher: false }]
            }))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="space-y-6">
          {formData.assignedRows.map((row, idx) => {
            const classSections = getSectionsForClass(row.classId);
            const sectionSubjects = getSubjectsForClassSection(row.classId, row.sectionId);

            return (
              <div key={row.id} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment Row #{idx + 1}</span>
                  {formData.assignedRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        assignedRows: prev.assignedRows.filter(r => r.id !== row.id)
                      }))}
                      className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Remove Row
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Class Dropdown */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Class</label>
                    <select
                      value={row.classId}
                      onChange={(e) => {
                        const list = [...formData.assignedRows];
                        list[idx].classId = e.target.value;
                        list[idx].sectionId = '';
                        list[idx].subjectIds = [];
                        setFormData(prev => ({ ...prev, assignedRows: list }));
                      }}
                      className="w-full h-[54px] rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-semibold outline-none"
                    >
                      <option value="">Select Class</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section Dropdown */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Section</label>
                    <select
                      value={row.sectionId}
                      disabled={!row.classId}
                      onChange={(e) => {
                        const list = [...formData.assignedRows];
                        list[idx].sectionId = e.target.value;
                        list[idx].subjectIds = [];
                        setFormData(prev => ({ ...prev, assignedRows: list }));
                      }}
                      className="w-full h-[54px] rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-semibold outline-none disabled:opacity-50"
                    >
                      <option value="">Select Section</option>
                      {classSections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors[`row_${idx}_section`] && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors[`row_${idx}_section`]}</p>}
                  </div>

                  {/* Subject Dropdown (Multi-select) */}
                  <div>
                    <SearchableMultiSelect
                      label="Subjects"
                      placeholder="Select Subjects..."
                      options={sectionSubjects.map(sub => ({ value: sub.id, label: sub.name }))}
                      selectedValues={row.subjectIds}
                      onChange={(vals) => {
                        const list = [...formData.assignedRows];
                        list[idx].subjectIds = vals;
                        setFormData(prev => ({ ...prev, assignedRows: list }));
                      }}
                    />
                  </div>
                </div>

                {/* Class Teacher Toggle */}
                {row.sectionId && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-sky-400 rounded-lg">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Designate Class Teacher</p>
                        <p className="text-[10px] font-semibold text-slate-400">Allows managing student records, approvals, and report cards in this section.</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.isClassTeacher}
                        onChange={(e) => {
                          const val = e.target.checked;
                          const list = [...formData.assignedRows];
                          // Toggle this section
                          list[idx].isClassTeacher = val;
                          // If set to true, unset class teacher for all other rows
                          if (val) {
                            list.forEach((r, i) => {
                              if (i !== idx) r.isClassTeacher = false;
                            });
                          }
                          setFormData(prev => ({ ...prev, assignedRows: list }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-650 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  // Step 4: Professional Information
  const renderProfessionalInformation = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <SectionHeader title="Professional Information" description="Set up designation, join date, previous experience history, and salary." badge="Career Details" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="md:col-span-2 flex gap-2">
          <div className="flex-1">
            <FloatingInput label="Employee ID" name="employeeCode" value={formData.employeeCode} onChange={handleChange} icon={Shield} readOnly />
          </div>
          <button 
            type="button"
            onClick={generateTeacherId}
            className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {idLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Auto-Generate
          </button>
        </div>
        <FloatingInput label="Join Date" type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} />
        <FloatingInput label="Designation / Role" name="role" value={formData.role} onChange={handleChange} icon={User} />
        <FloatingSelect label="Employment Type" name="employmentType" value={formData.employmentType} onChange={handleChange} options={EMPLOYMENT_TYPE_OPTIONS} />
        <FloatingInput label="Salary / CTC" name="salary" value={formData.salary} onChange={handleChange} icon={Briefcase} />
        <FloatingInput label="Teaching Experience (Years)" name="experience" value={formData.experience} onChange={handleChange} icon={Clock} />
      </div>

      {/* Experience History List */}
      <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Experience History</h4>
            <p className="text-[10px] font-semibold text-slate-400">List previous schools / organizations served</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              experienceDetails: [...prev.experienceDetails, { organization: '', role: '', from: '', to: '', description: '' }]
            }))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="space-y-4">
          {formData.experienceDetails.map((row, idx) => (
            <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1.5fr_40px] gap-2.5">
                <input
                  type="text"
                  placeholder="Organization"
                  value={row.organization}
                  onChange={(e) => {
                    const list = [...formData.experienceDetails];
                    list[idx].organization = e.target.value;
                    setFormData(prev => ({ ...prev, experienceDetails: list }));
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Role / Title"
                  value={row.role}
                  onChange={(e) => {
                    const list = [...formData.experienceDetails];
                    list[idx].role = e.target.value;
                    setFormData(prev => ({ ...prev, experienceDetails: list }));
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold"
                />
                <input
                  type="date"
                  value={row.from}
                  onChange={(e) => {
                    const list = [...formData.experienceDetails];
                    list[idx].from = e.target.value;
                    setFormData(prev => ({ ...prev, experienceDetails: list }));
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold"
                />
                <input
                  type="date"
                  value={row.to}
                  onChange={(e) => {
                    const list = [...formData.experienceDetails];
                    list[idx].to = e.target.value;
                    setFormData(prev => ({ ...prev, experienceDetails: list }));
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    experienceDetails: prev.experienceDetails.filter((_, i) => i !== idx)
                  }))}
                  className="flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea
                placeholder="Description of duties, key courses taught..."
                value={row.description}
                rows={2}
                onChange={(e) => {
                  const list = [...formData.experienceDetails];
                  list[idx].description = e.target.value;
                  setFormData(prev => ({ ...prev, experienceDetails: list }));
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold resize-none"
              />
            </div>
          ))}

          {formData.experienceDetails.length === 0 && (
            <p className="text-center py-4 text-xs font-semibold text-slate-400">No experience history milestones added yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Step 5: Availability
  const renderAvailability = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <SectionHeader title="Availability" description="Configure default shifts, days, and working hour limits." badge="Work Availability" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FloatingSelect label="Preferred Shift" name="shift" value={formData.shift} onChange={handleChange} options={SHIFT_OPTIONS} />
          
          <div className="grid grid-cols-2 gap-4">
            <FloatingInput label="Office Start Time" type="time" name="officeHoursStart" value={formData.officeHoursStart} onChange={handleChange} />
            <FloatingInput label="Office End Time" type="time" name="officeHoursEnd" value={formData.officeHoursEnd} onChange={handleChange} />
          </div>

          <FloatingInput label="Max Hours Per Week" type="number" name="maxHoursPerWeek" value={formData.maxHoursPerWeek} onChange={handleChange} icon={Clock} />
        </div>

        <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Teaching Days Availability</h4>
          <div className="space-y-3">
            {WEEKDAYS.map(day => {
              const isChecked = formData.weekdays.includes(day);
              return (
                <label key={day} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked
                        ? formData.weekdays.filter(d => d !== day)
                        : [...formData.weekdays, day];
                      setFormData(prev => ({ ...prev, weekdays: next }));
                    }}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-350 dark:border-slate-650"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{day}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Step 6: Address & Emergency
  const renderAddressEmergency = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <SectionHeader title="Address & Emergency Details" description="Configure emergency contacts and vital medical information." badge="Safety" />

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Address</h4>
          <textarea
            name="currentAddress"
            value={formData.currentAddress}
            onChange={handleChange}
            placeholder="Street Address, City, State, Country, Pin Code..."
            rows={3}
            className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 pl-1">
          <input
            type="checkbox"
            id="sameAsPermanent"
            name="sameAsPermanent"
            checked={formData.sameAsPermanent}
            onChange={handleChange}
            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-800"
          />
          <label htmlFor="sameAsPermanent" className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none cursor-pointer">
            Permanent Address is same as Current Address
          </label>
        </div>

        {!formData.sameAsPermanent && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Permanent Address</h4>
            <textarea
              name="permanentAddress"
              value={formData.permanentAddress}
              onChange={handleChange}
              placeholder="Street Address, City, State, Country, Pin Code..."
              rows={3}
              className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold"
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1">Emergency Contacts & Medical Profile</h5>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">
              <HeartPulse size={12} /> Critical Information
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput label="Emergency Contact (Name/Phone)" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} icon={Smartphone} />
            <FloatingInput label="Guardian Contact Info" name="guardianContact" value={formData.guardianContact} onChange={handleChange} icon={Smartphone} />
            <FloatingInput label="Allergies (if any)" name="allergies" value={formData.allergies} onChange={handleChange} icon={AlertCircle} />
            <FloatingInput label="Medical Conditions" name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} icon={HeartPulse} />
            <FloatingInput label="Emergency Doctor" name="emergencyDoctor" value={formData.emergencyDoctor} onChange={handleChange} icon={User} />
            <FloatingInput label="Disability Status" name="disability" value={formData.disability} onChange={handleChange} icon={AlertCircle} />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Step 7: Documents
  const renderDocuments = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <SectionHeader title="Documents" description="Upload digital copies of verification documents." badge="Verification" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Resume / CV', type: 'resume' },
          { label: 'Aadhar Card / Identity Proof', type: 'idProof' },
          { label: 'Degree Certificates', type: 'degreeCertificates' },
          { label: 'Previous Payslip / Experience Letter', type: 'experienceLetter' }
        ].map(doc => {
          const isUploaded = !!formData.docs[doc.type];
          return (
            <div
              key={doc.type}
              className={`p-8 rounded-3xl border-2 border-dashed ${isUploaded ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'} flex flex-col items-center justify-center text-center group hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-500/5 transition-all cursor-pointer relative`}
            >
              <div className={`w-14 h-14 rounded-2xl ${isUploaded ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-blue-500'} shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {isUploaded ? <Check size={24} strokeWidth={3} /> : <Upload size={24} />}
              </div>
              <h6 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white mb-1">{doc.label}</h6>
              <p className="text-xs font-bold text-slate-400">PDF, JPG or PNG up to 5MB</p>
              {isUploaded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextDocs = { ...formData.docs };
                    delete nextDocs[doc.type];
                    setFormData(prev => ({ ...prev, docs: nextDocs }));
                  }}
                  className="absolute top-4 right-4 text-xs font-bold text-red-500 hover:underline"
                >
                  Delete
                </button>
              )}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({
                        ...prev,
                        docs: { ...prev.docs, [doc.type]: { name: file.name, url: reader.result } }
                      }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );

  // Step 8: Review & Submit
  const renderReviewSubmit = () => {
    const qualificationsStr = [formData.qualification, formData.degree, formData.specialization]
      .filter(Boolean)
      .join(' | ');

    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <SectionHeader title="Review & Submit" description="Verify all details prior to finalizing deployment." badge="Review" />

        {/* Welcome Card Summary */}
        <div className="p-8 rounded-[30px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-2xl shadow-blue-600/30">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-28 rounded-2xl border-4 border-white/20 overflow-hidden shrink-0 shadow-xl bg-white/10 flex items-center justify-center">
              {formData.photo ? (
                <img src={typeof formData.photo === 'string' ? formData.photo : URL.createObjectURL(formData.photo)} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="opacity-40" />
              )}
            </div>
            <div>
              <h3 className="text-3xl font-bold tracking-tight mb-2">{formData.name || 'New Teacher Profile'}</h3>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-white/80">
                <div className="flex items-center gap-1.5"><Mail size={14} /> {formData.email || '—'}</div>
                <div className="flex items-center gap-1.5"><Smartphone size={14} /> {formData.phone || '—'}</div>
                <div className="flex items-center gap-1.5"><Shield size={14} /> {formData.employeeCode || '—'}</div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 select-none pointer-events-none">
            <Sparkles className="text-white/10" size={100} />
          </div>
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h5 className="text-[10px] font-black text-blue-600 dark:text-sky-400 uppercase tracking-widest">Academic & Qualifications</h5>
            <p className="text-xs font-semibold text-slate-500">Degree/Spec: <strong className="text-slate-850 dark:text-slate-100">{qualificationsStr || '—'}</strong></p>
            <p className="text-xs font-semibold text-slate-500">Passing Year: <strong className="text-slate-850 dark:text-slate-100">{formData.passingYear || '—'}</strong></p>
            <p className="text-xs font-semibold text-slate-500">Languages: <strong className="text-slate-850 dark:text-slate-100">{formData.languages || '—'}</strong></p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h5 className="text-[10px] font-black text-blue-600 dark:text-sky-400 uppercase tracking-widest">Professional Setup</h5>
            <p className="text-xs font-semibold text-slate-500">Designation: <strong className="text-slate-850 dark:text-slate-100">{formData.role || '—'}</strong></p>
            <p className="text-xs font-semibold text-slate-500">Shift & Hours: <strong className="text-slate-850 dark:text-slate-100">{formData.shift || '—'} ({formData.officeHoursStart} - {formData.officeHoursEnd})</strong></p>
          </div>
        </div>

        {/* Assigned Rows Summary */}
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h5 className="text-[10px] font-black text-blue-600 dark:text-sky-400 uppercase tracking-widest mb-3">Academic Assignments</h5>
          <div className="space-y-2">
            {formData.assignedRows.some(r => r.classId) ? (
              formData.assignedRows.map((row, i) => {
                if (!row.classId) return null;
                const cls = classesList.find(c => c.id === row.classId);
                const sec = cls?.sections?.find(s => String(s.id) === String(row.sectionId));
                const subs = subjectsList.filter(s => row.subjectIds.some(id => String(id) === String(s.id))).map(s => s.name).join(', ');
                return (
                  <div key={i} className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                    <span>
                      {cls?.name || '—'} &rarr; Section {sec?.name || '—'} &rarr; <span className="text-blue-500 font-bold">{subs || 'No Subjects'}</span>
                    </span>
                    {row.isClassTeacher && (
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-sky-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest">
                        Class Teacher
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 font-semibold py-2">No academic mappings configured.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <CheckCircle className="text-white" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Assignments Validated</h4>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">All configurations meet standard institute policies. No conflicts found.</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-[85vh] min-h-[600px] overflow-hidden bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
      {/* Sidebar navigation */}
      <div className="w-80 shrink-0 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800 p-8 hidden lg:flex flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter flex items-center gap-2 select-none">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="text-white" size={16} />
             </div>
             EDDVA <span className="text-blue-600">PRO</span>
          </h1>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          {STEPS.map(step => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepSelect(step.id)}
                className={`
                  w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 text-left
                  ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/30'}
                `}
              >
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0
                  ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 rotate-3' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-450'}
                `}>
                  {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                </div>
                <div className="min-w-0">
                  <h4 className={`text-xs font-black tracking-tight uppercase tracking-wider ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{step.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 leading-tight truncate">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white select-none">
           <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.2em] text-slate-500 mb-1">System status</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-tight">AI CORE ACTIVE</span>
           </div>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 absolute top-0 left-0 right-0 z-20">
          <motion.div 
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white dark:bg-slate-950">
          <AnimatePresence mode="wait">
            {currentStep === 1 && <React.Fragment key={1}>{renderBasicInfo()}</React.Fragment>}
            {currentStep === 2 && <React.Fragment key={2}>{renderAcademicQualification()}</React.Fragment>}
            {currentStep === 3 && <React.Fragment key={3}>{renderSchoolAssignment()}</React.Fragment>}
            {currentStep === 4 && <React.Fragment key={4}>{renderProfessionalInformation()}</React.Fragment>}
            {currentStep === 5 && <React.Fragment key={5}>{renderAvailability()}</React.Fragment>}
            {currentStep === 6 && <React.Fragment key={6}>{renderAddressEmergency()}</React.Fragment>}
            {currentStep === 7 && <React.Fragment key={7}>{renderDocuments()}</React.Fragment>}
            {currentStep === 8 && <React.Fragment key={8}>{renderReviewSubmit()}</React.Fragment>}
          </AnimatePresence>
        </div>

        {/* Actions Footer */}
        <div className="p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-between z-10 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-2xl text-xs font-black tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            CANCEL
          </button>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-black tracking-widest flex items-center gap-1.5 hover:bg-slate-50 transition-all text-slate-650 dark:text-slate-300"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSaveAssignments}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                Deploy Teacher
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
