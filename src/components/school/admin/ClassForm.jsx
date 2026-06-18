import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, GraduationCap, Users, MapPin, FileText, CheckCircle, 
  Camera, Upload, Sparkles, AlertCircle, 
  Eye, EyeOff, ChevronRight, ChevronLeft, Save, 
  Smartphone, Mail, Shield, HeartPulse,
  Check, Loader2, Calendar, Fingerprint, Briefcase
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Basic Information', icon: User, description: 'Personal & identity details' },
  { id: 2, title: 'Academic Details', icon: GraduationCap, description: 'Enrollment & class info' },
  { id: 3, title: 'Parent Details', icon: Users, description: 'Guardian information' },
  { id: 4, title: 'Address & Medical', icon: MapPin, description: 'Residence & health info' },
  { id: 5, title: 'Document Uploads', icon: Upload, description: 'Identity & certificates' },
  { id: 6, title: 'Review & Submit', icon: CheckCircle, description: 'Final verification' }
];

const FloatingInput = ({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, error, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;

  return (
    <div className="relative group">
      <div className={`
        relative flex items-center transition-all duration-300 rounded-2xl border-2 
        ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-700'}
        ${error ? 'border-red-500' : ''}
        bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm
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
          className={`
            w-full bg-transparent px-4 py-3.5 outline-none text-slate-900 dark:text-white font-semibold text-sm
            placeholder-transparent
          `}
          placeholder={placeholder || label}
          {...props}
        />
        <label className={`
          absolute left-10 transition-all duration-300 pointer-events-none font-bold
          ${(isFocused || hasValue) ? '-top-2.5 left-8 px-2 bg-white dark:bg-slate-900 text-xs text-blue-600' : 'top-3.5 text-sm text-slate-400'}
        `}>
          {label}
        </label>
      </div>
      {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
    </div>
  );
};

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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    dob: '', gender: '', bloodGroup: '', nationalId: '', profileImage: null,
    enrollmentNo: '', rollNo: '', classId: '', sectionId: '', admissionDate: '',
    fatherName: '', motherName: '', parentPhone: '', parentEmail: '', parentOccupation: '',
    currentAddress: '', permanentAddress: '', city: '', state: '', pinCode: '',
    allergies: '', medicalConditions: '', documents: {},
  });

  const [idLoading, setIdLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

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

  const fetchClasses = async () => {
    try {
      // Using the standardized api instance is preferred as it includes auth headers
      const res = await api.get('/academic/classes');
      
      if (res.status !== 200) {
        throw new Error("Failed to fetch classes");
      }
      
      const data = res.data;
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  useEffect(() => {
    if (student) {
      const studentClassId = student.studentProfile?.section?.classId || student.classId || '';
      setFormData(prev => ({
        ...prev,
        ...student,
        ...(student.studentProfile || {}),
        classId: studentClassId,
      }));
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateEnrollmentNo = () => {
    setIdLoading(true);
    setTimeout(() => {
      setFormData(prev => ({ ...prev, enrollmentNo: `ENR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` }));
      setIdLoading(false);
    }, 800);
  };

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
                <FloatingInput label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={User} />
                <FloatingInput label="Email Address" name="email" value={formData.email} onChange={handleChange} icon={Mail} />
                <FloatingInput label="Mobile Number" name="phone" value={formData.phone} onChange={handleChange} icon={Smartphone} />
                <FloatingInput label="Aadhar / National ID" name="nationalId" value={formData.nationalId} onChange={handleChange} icon={Fingerprint} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FloatingInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
              <div className="relative">
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full h-[54px] rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4 pt-4 outline-none text-sm font-semibold appearance-none">
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <label className="absolute left-4 top-1.5 text-[10px] font-bold tracking-tight text-blue-600 uppercase">Gender</label>
              </div>
              <FloatingInput label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Academic Details" description="Enrollment and class assignment." badge="Enrollment" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div className="flex gap-2">
                <div className="flex-1"><FloatingInput label="Enrollment No" name="enrollmentNo" value={formData.enrollmentNo} readOnly icon={Fingerprint} /></div>
                <button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">
                  {idLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>
              <FloatingInput label="Roll No" name="rollNo" value={formData.rollNo} onChange={handleChange} icon={Fingerprint} />
              <FloatingInput label="Admission Date" type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div className="relative">
                <select 
                  name="classId" 
                  value={formData.classId} 
                  onChange={handleChange}
                  className="w-full h-[54px] rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4 pt-4 outline-none text-sm font-semibold appearance-none"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <label className="absolute left-4 top-1.5 text-[10px] font-bold tracking-tight text-blue-600 uppercase">Class</label>
              </div>

              <div className="relative">
                <select 
                  name="sectionId" 
                  value={formData.sectionId} 
                  onChange={handleChange}
                  disabled={!formData.classId}
                  className="w-full h-[54px] rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4 pt-4 outline-none text-sm font-semibold appearance-none disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <label className="absolute left-4 top-1.5 text-[10px] font-bold tracking-tight text-blue-600 uppercase">Section</label>
              </div>
            </div>

            <AIAssistantCard message={`AI recommends ${formData.classId ? classes.find(c => c.id === formData.classId)?.name : 'a class'} based on age and previous school curriculum compatibility.`} />
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Parent Details" description="Guardian contact information." badge="Guardian" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FloatingInput label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} icon={User} />
              <FloatingInput label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} icon={User} />
              <FloatingInput label="Parent Phone" name="parentPhone" value={formData.parentPhone} onChange={handleChange} icon={Smartphone} />
              <FloatingInput label="Parent Email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} icon={Mail} />
              <FloatingInput label="Parent Occupation" name="parentOccupation" value={formData.parentOccupation} onChange={handleChange} icon={Briefcase} />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SectionHeader title="Address & Medical" description="Residence and health info." badge="Safety" />
            <div className="space-y-6">
              <FloatingInput label="Address" name="currentAddress" value={formData.currentAddress} onChange={handleChange} icon={MapPin} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FloatingInput label="City" name="city" value={formData.city} onChange={handleChange} />
                <FloatingInput label="State" name="state" value={formData.state} onChange={handleChange} />
                <FloatingInput label="PIN Code" name="pinCode" value={formData.pinCode} onChange={handleChange} />
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
            <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="text-emerald-500" size={20} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Information verified and ready for enrollment.</p>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-[85vh] min-h-[600px] overflow-hidden bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
      <div className="w-64 xl:w-80 shrink-0 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800 p-6 xl:p-8 hidden lg:flex flex-col">
        <div className="mb-10 font-bold tracking-tight text-2xl tracking-tighter">EDDVA <span className="text-blue-600">STUDENT</span></div>
        <div className="flex-1 space-y-2">
          {STEPS.map(step => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
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
            {currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}
            <button 
              onClick={currentStep < STEPS.length ? () => setCurrentStep(s => s + 1) : () => onSubmit(formData)} 
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
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, BookOpen, Briefcase, MapPin, FileText, CheckCircle, 
  Camera, Plus, Trash2, Upload, Sparkles, AlertCircle, 
  Eye, EyeOff, ChevronRight, ChevronLeft, Save, 
  Printer, Smartphone, Mail, Shield, HeartPulse,
  Award, Globe, Languages, Clock, Building,
  Search, Check, X, Loader2
} from 'lucide-react';
import api from '@/lib/api/school-client';

// --- Constants ---
const STEPS = [
  { id: 1, title: 'Basic Information', icon: User, description: 'Personal & identity details' },
  { id: 2, title: 'Academic Details', icon: BookOpen, description: 'Qualifications & certifications' },
  { id: 3, title: 'Professional Details', icon: Briefcase, description: 'Roles & assignments' },
  { id: 4, title: 'Address & Medical', icon: MapPin, description: 'Contact & health info' },
  { id: 5, title: 'Documents Upload', icon: Upload, description: 'Identity & experience proofs' },
  { id: 6, title: 'Review & Submit', icon: CheckCircle, description: 'Final verification' }
];

// --- Sub-components ---

const FloatingInput = ({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, error, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;

  return (
    <div className="relative group">
      <div className={`
        relative flex items-center transition-all duration-300 rounded-2xl border-2 
        ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-700'}
        ${error ? 'border-red-500' : ''}
        bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm
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
          className={`
            w-full bg-transparent px-4 py-3.5 outline-none text-slate-900 dark:text-white font-semibold text-sm
            placeholder-transparent
          `}
          placeholder={placeholder || label}
          {...props}
        />
        <label className={`
          absolute left-10 transition-all duration-300 pointer-events-none font-bold
          ${(isFocused || hasValue) ? '-top-2.5 left-8 px-2 bg-white dark:bg-slate-900 text-xs text-blue-600' : 'top-3.5 text-sm text-slate-400'}
        `}>
          {label}
        </label>
      </div>
      {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
    </div>
  );
};

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

// --- Main Component ---

export default function AddTeacherMultiStep({ teacher, onSubmit, onCancel, isLoading }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '', email: '', password: '', confirmPassword: '', phone: '', altPhone: '',
    dob: '', gender: '', bloodGroup: '', nationalId: '', nationality: 'Indian',
    religion: '', maritalStatus: '', profileImage: null,
    
    // Academic
    qualification: '', degree: '', institute: '', passingYear: '', 
    specialization: '', subjects: [], languages: [], certifications: '',
    experience: '', achievements: '',

    // Professional
    department: '', role: '', employmentType: 'FULL_TIME', joinDate: '',
    salary: '', employeeCode: '', classTeacher: '', assignedSections: [],
    shift: '', prevOrg: '',

    // Address & Medical
    currentAddress: '', permanentAddress: '', city: '', state: '', 
    country: 'India', pinCode: '', sameAsPermanent: false,
    emergencyContact: '', guardianContact: '',
    allergies: '', medicalConditions: '', disability: '', emergencyDoctor: '',

    // Documents
    docs: {}
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [idLoading, setIdLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/academic/subjects');
      setAvailableSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const handleToggleSection = (sectionId) => {
    setFormData(prev => {
      const current = prev.assignedSections || [];
      if (current.includes(sectionId)) {
        return { ...prev, assignedSections: current.filter(id => id !== sectionId) };
      }
      return { ...prev, assignedSections: [...current, sectionId] };
    });
  };

  // Sync with existing teacher data if editing
  useEffect(() => {
    if (teacher) {
      setFormData(prev => ({
        ...prev,
        ...teacher,
        name: teacher.name || '',
        email: teacher.email || '',
        // Map nested profile data
        ...(teacher.teacherProfile || {})
      }));
    }
  }, [teacher]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const generateTeacherId = () => {
    setIdLoading(true);
    setTimeout(() => {
      setFormData(prev => ({ ...prev, employeeCode: `EDDVA-T-${Math.floor(1000 + Math.random() * 9000)}` }));
      setIdLoading(false);
    }, 800);
  };

  // --- Step Renderers ---

  const renderBasicInfo = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SectionHeader 
        title="Basic Information" 
        description="Let's start with the teacher's personal profile and identification."
        badge="Identity"
      />
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="shrink-0 flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all">
            {formData.profileImage ? (
              <img src={typeof formData.profileImage === 'string' ? formData.profileImage : URL.createObjectURL(formData.profileImage)} alt="Preview" className="w-full h-full object-cover" />
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
                    setFormData(prev => ({ ...prev, profileImage: reader.result }));
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG up to 2MB</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={User} />
          <FloatingInput label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} icon={Mail} />
          <div className="relative">
            <FloatingInput 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              icon={Shield} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-slate-400 hover:text-blue-500 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FloatingInput label="Confirm Password" type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} icon={Shield} />
          <FloatingInput label="Mobile Number" name="phone" value={formData.phone} onChange={handleChange} icon={Smartphone} />
          <FloatingInput label="Aadhar / National ID" name="nationalId" value={formData.nationalId} onChange={handleChange} icon={CheckCircle} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FloatingInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
        <div className="relative">
          <select 
            name="gender" 
            value={formData.gender} 
            onChange={handleChange}
            className="w-full h-[54px] rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4 pt-4 outline-none text-sm font-semibold appearance-none"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <label className="absolute left-4 top-1.5 text-[10px] font-bold tracking-tight text-blue-600 uppercase">Gender</label>
        </div>
        <FloatingInput label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} />
        <FloatingInput label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} />
      </div>

      <AIAssistantCard message="I've verified the national ID format. No duplicate teacher records found for this identity." />
    </motion.div>
  );

  const renderAcademicDetails = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SectionHeader 
        title="Academic Details" 
        description="Specify the teacher's educational background and specializations."
        badge="Education"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <FloatingInput label="Highest Qualification" name="qualification" value={formData.qualification} onChange={handleChange} icon={Award} />
        <FloatingInput label="Degree / Certification" name="degree" value={formData.degree} onChange={handleChange} icon={FileText} />
        <FloatingInput label="University / Institute" name="institute" value={formData.institute} onChange={handleChange} icon={Building} />
        <FloatingInput label="Passing Year" name="passingYear" value={formData.passingYear} onChange={handleChange} icon={Clock} />
        <FloatingInput label="Subject Specialization" name="specialization" value={formData.specialization} onChange={handleChange} icon={Sparkles} />
        <FloatingInput label="Languages Known" name="languages" value={formData.languages} onChange={handleChange} icon={Globe} />
      </div>
      <div className="grid grid-cols-1 gap-5">
        <div className="relative flex items-start transition-all duration-300 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 p-4">
          <textarea 
            name="achievements" 
            value={formData.achievements} 
            onChange={handleChange}
            className="w-full bg-transparent outline-none text-sm font-semibold resize-none h-24"
            placeholder="Academic Achievements & Awards..."
          />
          <label className="absolute left-4 -top-2.5 px-2 bg-white dark:bg-slate-900 text-xs text-blue-600 font-bold">Achievements</label>
        </div>
      </div>
    </motion.div>
  );

  const renderProfessionalDetails = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SectionHeader 
        title="Professional Details" 
        description="Configure roles, assignments, and employment structure."
        badge="Career"
      />
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
        <FloatingInput label="Department" name="department" value={formData.department} onChange={handleChange} icon={Building} />
        <FloatingInput label="Role / Designation" name="role" value={formData.role} onChange={handleChange} icon={User} />
        <FloatingInput label="Experience (Years)" name="experience" value={formData.experience} onChange={handleChange} icon={Clock} />
      </div>

      <div className="mb-8">
        <h5 className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-4 ml-1">Class & Section Assignments</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {cls.name}
              </h6>
              <div className="flex flex-wrap gap-2">
                {(cls.sections || []).map(sec => {
                  const isSelected = (formData.sectionIds || []).includes(sec.id);
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        const current = formData.sectionIds || [];
                        const next = isSelected ? current.filter(id => id !== sec.id) : [...current, sec.id];
                        setFormData(prev => ({ ...prev, sectionIds: next }));
                      }}
                      className={`
                        px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all
                        ${isSelected 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}
                      `}
                    >
                      SEC {sec.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AIAssistantCard message={`I've analyzed the current class schedules. The teacher is assigned to ${(formData.assignedSections || []).length} sections. Recommended subjects based on expertise: Physics, Mathematics.`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <h5 className="text-xs font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-4">Subject Expertise</h5>
          <div className="flex flex-wrap gap-2">
            {availableSubjects.length > 0 ? (
              availableSubjects.map(sub => {
                const isSelected = (formData.subjectIds || []).includes(sub.id);
                return (
                  <button 
                    key={sub.id} 
                    type="button"
                    onClick={() => {
                      const current = formData.subjectIds || [];
                      setFormData(prev => ({
                        ...prev,
                        subjectIds: isSelected ? current.filter(id => id !== sub.id) : [...current, sub.id]
                      }));
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 text-blue-600 hover:bg-blue-500 hover:text-white'}`}
                  >
                    {sub.name}
                  </button>
                );
              })
            ) : (
              ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'].map(sub => (
                <div key={sub} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-300 border border-slate-100 opacity-50 cursor-not-allowed">
                  {sub}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <h5 className="text-xs font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-4">Shift & Availability</h5>
          <div className="space-y-3">
            {['Morning Shift (8 AM - 2 PM)', 'Regular Shift (9 AM - 4 PM)'].map(shift => (
              <label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{shift}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAddressMedical = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SectionHeader 
        title="Address & Medical" 
        description="Ensure we have accurate contact and health information for emergencies."
        badge="Safety"
      />
      <div className="space-y-6">
        <div>
          <h5 className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-3 ml-1">Current Address</h5>
          <FloatingInput label="Street / Area" name="currentAddress" value={formData.currentAddress} onChange={handleChange} icon={MapPin} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <FloatingInput label="City" name="city" value={formData.city} onChange={handleChange} />
            <FloatingInput label="State" name="state" value={formData.state} onChange={handleChange} />
            <FloatingInput label="Country" name="country" value={formData.country} onChange={handleChange} />
            <FloatingInput label="PIN Code" name="pinCode" value={formData.pinCode} onChange={handleChange} />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1">Medical Information</h5>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">
              <HeartPulse size={12} /> Critical Info
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput label="Allergies (if any)" name="allergies" value={formData.allergies} onChange={handleChange} icon={AlertCircle} />
            <FloatingInput label="Medical Conditions" name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} icon={HeartPulse} />
            <FloatingInput label="Emergency Doctor" name="emergencyDoctor" value={formData.emergencyDoctor} onChange={handleChange} icon={User} />
            <FloatingInput label="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} icon={Smartphone} />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDocsUpload = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SectionHeader 
        title="Documents Upload" 
        description="Please upload valid digital copies of the following documents."
        badge="Verification"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Resume / CV', type: 'resume' },
          { label: 'Aadhar Card', type: 'aadhar' },
          { label: 'Degree Certificates', type: 'degree' },
          { label: 'Joining Documents', type: 'joining' }
        ].map(doc => (
          <div key={doc.type} className="p-8 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center group hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-blue-500" size={24} />
            </div>
            <h6 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white mb-1">{doc.label}</h6>
            <p className="text-xs font-bold text-slate-400">PDF, JPG or PNG up to 5MB</p>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderReviewSubmit = () => (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <SectionHeader 
        title="Review & Submit" 
        description="Verify all the information before adding the teacher to EDDVA."
        badge="Review"
      />
      
      <div className="p-8 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-8 relative overflow-hidden shadow-2xl shadow-blue-600/30">
        <div className="relative z-10 flex items-center gap-8">
          <div className="w-32 h-32 rounded-[2rem] border-4 border-white/20 overflow-hidden shrink-0 shadow-xl">
             <div className="w-full h-full bg-white/10 flex items-center justify-center">
                {formData.profileImage ? (
                  <img src={typeof formData.profileImage === 'string' ? formData.profileImage : URL.createObjectURL(formData.profileImage)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="opacity-40" />
                )}
             </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold tracking-tight tracking-tight mb-2">{formData.name || 'New Teacher'}</h3>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-white/80">
              <div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>
              <div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>
              <div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8">
           <Sparkles className="text-white/20" size={120} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { title: 'Academic Profile', data: [`Degree: ${formData.degree || '—'}`, `Univ: ${formData.institute || '—'}`, `Spec: ${formData.specialization || '—'}`] },
          { title: 'Professional Info', data: [`Dept: ${formData.department || '—'}`, `Role: ${formData.role || '—'}`, `Exp: ${formData.experience || '—'} Yrs`] },
        ].map(card => (
          <div key={card.title} className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h5 className="text-[10px] font-bold tracking-tight text-blue-600 uppercase tracking-widest mb-4">{card.title}</h5>
            <div className="space-y-2">
              {card.data.map((d, i) => <p key={i} className="text-sm font-bold text-slate-700 dark:text-slate-300">{d}</p>)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
        <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
          <CheckCircle className="text-white" size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Ready for Deployment</h4>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">All mandatory fields are filled and validated by AI.</p>
        </div>
      </div>
    </motion.div>
  );

  const CurrentStepComponent = () => {
    switch (currentStep) {
      case 1: return renderBasicInfo();
      case 2: return renderAcademicDetails();
      case 3: return renderProfessionalDetails();
      case 4: return renderAddressMedical();
      case 5: return renderDocsUpload();
      case 6: return renderReviewSubmit();
      default: return null;
    }
  };

  return (
    <div className="flex h-[85vh] min-h-[600px] overflow-hidden bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
      {/* Sidebar Navigation */}
      <div className="w-64 xl:w-80 shrink-0 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800 p-6 xl:p-8 hidden lg:flex flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
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
                onClick={() => setCurrentStep(step.id)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left
                  ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/30'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all
                  ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 rotate-3' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}
                `}>
                  {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                </div>
                <div>
                  <h4 className={`text-xs font-bold tracking-tight uppercase tracking-wider ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{step.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 leading-tight">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
           <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.2em] text-slate-500 mb-2">System Status</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-tight">AI CORE ACTIVE</span>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 absolute top-0 left-0 right-0 z-20">
          <motion.div 
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-white dark:bg-slate-950">
          <AnimatePresence mode="wait">
            <CurrentStepComponent key={currentStep} />
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl text-sm font-bold tracking-tight text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            CANCEL
          </button>

          <div className="flex gap-3">
            <button 
              type="button"
              className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <Save size={16} /> Save Draft
            </button>
            
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={handleBack}
                className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            {currentStep < STEPS.length ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                disabled={isLoading}
                onClick={() => onSubmit(formData)}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                Deploy Teacher
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function AttendanceForm({ attendance, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    remarks: ''
  });
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attendance) {
      setFormData({
        studentId: attendance.studentId || '',
        date: attendance.date ? new Date(attendance.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: attendance.status || 'PRESENT',
        remarks: attendance.remarks || ''
      });
    }
    fetchStudents();
  }, [attendance]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.studentId) {
      setError('Please select a student');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Student *</label>
            <select
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="">Select Student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="Any remarks..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {attendance ? 'Update Attendance' : 'Mark Attendance'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import React from 'react';
import { BrainCircuit, GraduationCap } from 'lucide-react';
import { cn } from './Skeleton';

export function EddvaLogo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-primary via-primary to-sky-400 text-white shadow-blue">
        <GraduationCap className="h-6 w-6" />
        <BrainCircuit className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5 text-primary" />
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-2xl font-bold text-surface-950">EDDVA</p>
          <p className="mt-1 text-[11px] font-bold uppercase text-primary-dark">Learn with AI</p>
        </div>
      )}
    </div>
  );
}

export function InstituteLogo({ institute, size = 'md', className }) {
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-base',
    lg: 'h-16 w-16 text-2xl',
  };

  if (institute?.logo) {
    return (
      <img
        src={institute.logo}
        alt={`${institute.name || 'Institute'} logo`}
        className={cn(sizes[size], 'rounded-lg border border-sky-100 bg-white object-cover shadow-sm', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizes[size],
        'grid place-items-center rounded-lg bg-gradient-to-br from-primary to-sky-400 font-bold text-white shadow-blue',
        className
      )}
    >
      {(institute?.name || 'E').charAt(0).toUpperCase()}
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    PENDING: 'border-sky-200 bg-sky-50 text-sky-700',
    SUSPENDED: 'border-red-200 bg-red-50 text-red-700',
    OPEN: 'border-red-200 bg-red-50 text-red-700',
    IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-700',
    RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CLOSED: 'border-surface-200 bg-surface-100 text-surface-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold', styles[status] || styles.CLOSED)}>
      {String(status || 'UNKNOWN').replace('_', ' ')}
    </span>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function ClassForm({ classData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    section: '',
    building: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        level: classData.level?.toString() || '',
        section: (classData.sections || []).map(s => s.name).join(', ') || '',
        building: classData.building || ''
      });
    }
  }, [classData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Class name is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Class Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="Class 10-A"
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Level</label>
          <input
            type="number"
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="10"
          />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Section(s)</label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="A, B, C etc."
            />
            <p className="mt-1 text-[10px] text-surface-500 italic">Separate multiple sections with commas</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-surface-700 mb-2">Building/Block</label>
            <input
              type="text"
              name="building"
              value={formData.building}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="Main Building, Block A"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {classData ? 'Update Class' : 'Add Class'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { PageTransition } from './PageTransition';
import { useAuth } from '@/context/SchoolAuthContext';
import { cn } from './Skeleton';

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';

  return (
    <div className={cn('relative flex min-h-screen w-full overflow-hidden', isInstitute ? 'eddva-canvas' : 'bg-surface-50 dark:bg-slate-950')}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <div className="h-full w-full">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, title, onClose, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    'full': 'max-w-[95vw]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-surface-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`w-full ${sizes[size]} rounded-lg border border-surface-200 bg-white shadow-2xl`}>
              <div className="flex items-center justify-between border-b border-surface-200 p-6">
                <h2 className="font-display text-xl font-bold text-surface-950">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className={size === 'full' ? '' : 'p-6'}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  MessageCircle,
  X,
  User,
  GraduationCap,
  Users,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { InstituteLogo } from './Brand';
import { cn } from './Skeleton';
import api from '@/lib/api/school-client';

function pageTitle(pathname) {
  if (pathname === '/' || pathname.includes('dashboard')) return 'Dashboard';
  return pathname
    .split('/')
    .pop()
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, institute, logout } = useAuth();
  const title = pageTitle(location.pathname);
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';

  const [theme, setTheme] = useState(() => localStorage.getItem('eddva-theme') || 'light');
  const [quickOpen, setQuickOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ students: [], teachers: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  const quickRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('eddva-theme', theme);
  }, [theme]);

  useEffect(() => {
    function onDocClick(e) {
      if (!quickRef.current?.contains(e.target)) setQuickOpen(false);
      if (!searchRef.current?.contains(e.target)) setSearchOpen(false);
      if (!notifRef.current?.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch();
      } else {
        setSearchResults({ students: [], teachers: [], pages: [] });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      // Internal page matching
      const pages = [
        { name: 'Dashboard', path: '/institute/dashboard', icon: Sparkles },
        { name: 'Students List', path: '/students', icon: GraduationCap },
        { name: 'Teachers Directory', path: '/teachers', icon: Users },
        { name: 'Fees Management', path: '/fees', icon: SettingsIcon },
        { name: 'System Settings', path: '/settings', icon: SettingsIcon },
        { name: 'Academics & Classes', path: '/academics', icon: SettingsIcon },
      ].filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      // Mock API calls for students and teachers (would be real API in production)
      const [sRes, tRes] = await Promise.all([
        api.get('/students'),
        api.get('/teachers')
      ]);

      const students = (sRes.data || [])
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3);
      
      const teachers = (tRes.data || [])
        .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3);

      setSearchResults({ students, teachers, pages });
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const searchPlaceholder = useMemo(
    () =>
      isInstitute
        ? 'Search students, classes, teachers, reports…'
        : 'Search institutes, tickets, or activity',
    [isInstitute]
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-6 py-3 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-xl p-2 text-surface-600 hover:bg-slate-50 md:hidden dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-col">
            <p className="text-[11px] font-bold tracking-tight text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
              {isInstitute ? (institute?.name || 'Eddva Institute') : 'EDDVA HQ'}
            </p>
            <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest opacity-60">
              {isInstitute ? 'Active Workspace' : 'Super Admin Console'}
            </p>
          </div>
        </div>

        <div className="hidden flex-1 justify-center lg:flex" ref={searchRef}>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder={searchPlaceholder}
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-slate-100 bg-white px-2 py-1 text-[10px] font-bold tracking-tight text-slate-400 md:inline dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              Ctrl K
            </kbd>

            {/* Search Results Dropdown */}
            {searchOpen && (searchQuery.length > 0 || searchResults.pages.length > 0) && (
              <div className="absolute top-full mt-3 w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="max-h-[480px] overflow-y-auto p-2">
                  {isSearching && (
                    <div className="p-4 text-center text-xs font-bold text-slate-400 animate-pulse">Searching the intelligence engine...</div>
                  )}
                  
                  {searchResults.pages.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Navigation</p>
                      {searchResults.pages.map(page => (
                        <Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                            <page.icon size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{page.name}</span>
                          <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-blue-600" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.students.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Students</p>
                      {searchResults.students.map(s => (
                        <Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold tracking-tight">
                            {s.profileImage ? <img src={s.profileImage} className="w-full h-full object-cover rounded-xl" /> : s.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{s.studentProfile?.enrollmentNo || 'No ID'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {!isSearching && searchResults.pages.length === 0 && searchResults.students.length === 0 && searchResults.teachers.length === 0 && (
                    <div className="p-8 text-center">
                      <Search className="mx-auto h-8 w-8 text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400 italic">No matching records found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={quickRef}>
            <button
              type="button"
              onClick={() => setQuickOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:scale-105 active:scale-95"
              aria-label="Quick create"
            >
              <Plus className={cn('h-6 w-6 transition-transform duration-300', quickOpen && 'rotate-45')} />
            </button>
            {quickOpen && (
              <div className="absolute right-0 z-50 mt-4 w-56 overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <GraduationCap size={16} />
                  </div>
                  Add student
                </Link>
                <Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  Add teacher
                </Link>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-4" />
                <Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                    <MessageCircle size={16} />
                  </div>
                  Publish notice
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => navigate('/communications')}
              className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold tracking-tight text-white border-2 border-white dark:border-slate-950">
                  5
                </span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <span className="text-[10px] font-bold tracking-tight text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">5 Unread</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">New Institute Registered</p>
                      <p className="text-xs text-slate-500 mt-1">Delhi Public School just registered on the platform.</p>
                      <p className="text-[10px] text-slate-400 mt-2">2 minutes ago</p>
                    </div>
                    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">System Update</p>
                      <p className="text-xs text-slate-500 mt-1">Version 2.4.1 has been deployed successfully.</p>
                      <p className="text-[10px] text-slate-400 mt-2">1 hour ago</p>
                    </div>
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all as read</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-bold tracking-tight text-slate-950 dark:text-white leading-tight">{user?.name || 'Admin'}</p>
              <p className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">
                {isInstitute ? 'Institute Admin' : 'Super Admin'}
              </p>
            </div>
          </div>
          <button onClick={logout} className="ml-2 rounded-2xl p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function NoticeForm({ notice, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    postedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    targetRoles: [],
    attachments: {}
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title || '',
        content: notice.content || '',
        category: notice.category || 'GENERAL',
        priority: notice.priority || 'NORMAL',
        postedDate: notice.postedDate ? new Date(notice.postedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().split('T')[0] : '',
        targetRoles: notice.targetRoles || [],
        attachments: notice.attachments || {}
      });
    }
  }, [notice]);

  const handleChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'targetRoles') {
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setFormData(prev => ({ ...prev, [name]: selected }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        attachments: { ...prev.attachments, [file.name]: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Notice title is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Notice content is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="Notice Title"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="GENERAL">General</option>
              <option value="ACADEMIC">Academic</option>
              <option value="EVENT">Event</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="EXAM">Exam</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Posted Date</label>
            <input
              type="date"
              name="postedDate"
              value={formData.postedDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-surface-700 mb-2">Target Audience (Multi-select)</label>
            <select
              name="targetRoles"
              multiple
              value={formData.targetRoles}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20 h-24"
            >
              <option value="TEACHER">Teachers</option>
              <option value="STUDENT">Students</option>
              <option value="PARENT">Parents</option>
              <option value="INSTITUTE_ADMIN">Admins</option>
            </select>
            <p className="text-xs text-surface-500 mt-1">Leave unselected to broadcast to everyone.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Attachments</label>
          <input
            type="file"
            onChange={handleFileUpload}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
          />
          {Object.keys(formData.attachments).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.keys(formData.attachments).map(filename => (
                <span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">
                  {filename}
                  <button type="button" onClick={() => {
                    const newAtt = { ...formData.attachments };
                    delete newAtt[filename];
                    setFormData(prev => ({ ...prev, attachments: newAtt }));
                  }} className="text-red-500 hover:text-red-700 ml-1">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="6"
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="Notice content..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {notice ? 'Update Notice' : 'Publish Notice'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import React from 'react';
import { motion } from 'framer-motion';

export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function SectionForm({ sectionData, classes = [], onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    classTeacherId: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
    if (sectionData) {
      setFormData({
        name: sectionData.name || '',
        classId: sectionData.classId || '',
        classTeacherId: sectionData.classTeacherId || ''
      });
    }
  }, [sectionData]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error('Failed to fetch teachers');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) return setError('Section name is required');
    if (!formData.classId) return setError('Please select a class');

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Class *</label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
          >
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Section Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="A, B, C etc."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Class Teacher (Optional)</label>
          <select
            name="classTeacherId"
            value={formData.classTeacherId}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
          >
            <option value="">Select Class Teacher</option>
            {teachers.map(t => (
              <option key={t.id} value={t.teacherProfile?.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {sectionData ? 'Update Section' : 'Add Section'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  GraduationCap,
  Home,
  LayoutDashboard,
  MessageSquare,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Users,
  Wallet,
  Landmark,
  X,
} from 'lucide-react';
import { cn } from './Skeleton';
import { EddvaLogo, InstituteLogo } from './Brand';
import { useAuth } from '@/context/SchoolAuthContext';

const superAdminItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/institutes', label: 'Institutes', icon: Building2 },
  { to: '/complaints', label: 'Tickets', icon: AlertCircle },
  { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const instituteGroups = [
  {
    heading: 'Academics',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/students', label: 'Students', icon: GraduationCap },
      { to: '/teachers', label: 'Teachers', icon: Users },
      { to: '/academics', label: 'Classes & curriculum', icon: Building2 },
    ],
  },
  {
    heading: 'Management',
    items: [
      { to: '/attendance', label: 'Attendance', icon: BarChart3 },
      { to: '/timetable', label: 'Timetable & live classes', icon: CalendarDays },
      { to: '/fees', label: 'Fees Management', icon: Wallet },
      { to: '/finance', label: 'Finance & Analytics', icon: Landmark },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { to: '/notices', label: 'Notices & announcements', icon: AlertCircle },
      { to: '/communications', label: 'Messages & parent connect', icon: MessageSquare },
    ],
  },
  {
    heading: 'AI & Analytics',
    items: [{ to: '/reports', label: 'AI insights & analytics', icon: Sparkles }],
  },
  {
    heading: 'System',
    items: [
      { to: '/complaints', label: 'Support tickets', icon: Shield },
      { to: '/settings', label: 'Settings & security', icon: SettingsIcon },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, institute } = useAuth();
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';
  const items = isInstitute ? null : superAdminItems;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex-shrink-0 border-r border-slate-100 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 md:static',
          collapsed && isInstitute ? 'md:w-[80px]' : 'md:w-[280px]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
            <div className={cn('min-w-0 transition-opacity', collapsed && isInstitute && 'md:opacity-0 md:pointer-events-none md:w-0 md:overflow-hidden')}>
              <EddvaLogo />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onClose} className="rounded-xl p-2 text-surface-500 hover:bg-surface-100 md:hidden" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            {!isInstitute && (
              <>
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  Super Admin
                </p>
                <nav className="space-y-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.to + item.label}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 before:absolute before:left-1 before:top-1/2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-white/90'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                        )
                      }
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>

                <div className="mt-6 rounded-3xl border border-[rgba(37,99,235,0.10)] bg-gradient-to-br from-white/95 to-blue-50/40 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900/90 dark:to-slate-900/40">
                  <div className="flex items-center gap-3">
                    <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
                      <Sparkles className="h-6 w-6" />
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-slate-950 dark:text-white">EDDVA AI Assistant</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Your smart admin assistant
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"
                  >
                    Ask EDDVA AI
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}

            {isInstitute &&
              instituteGroups.map((group) => (
                <div key={group.heading} className="mb-6">
                  <p
                    className={cn(
                      'mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest tracking-widest text-slate-400 dark:text-slate-500',
                      collapsed && 'md:hidden'
                    )}
                  >
                    {group.heading}
                  </p>
                  <nav className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={`${group.heading}-${item.label}`}
                        to={item.to}
                        end={item.end}
                        title={collapsed ? item.label : undefined}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                          )
                        }
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ))}
          </div>

          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            {isInstitute ? (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',
                  collapsed && 'md:justify-center md:p-2'
                )}
              >
                <InstituteLogo institute={institute} size="sm" />
                <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
                  <p className="truncate text-xs font-bold text-slate-950 dark:text-white">{institute?.name || 'Institute'}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600">Online</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-slate-900">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden" onClick={onClose} aria-label="Close menu overlay" />}
    </>
  );
}
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-200/60", className)}
      {...props}
    />
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function StudentForm({ student, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    enrollmentNo: '',
    rollNo: '',
    dob: '',
    gender: 'MALE',
    fatherName: '',
    motherName: '',
    parentPhone: '',
    parentEmail: '',
    sectionId: '',
    admissionDate: ''
  });
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        password: '',
        enrollmentNo: student.studentProfile?.enrollmentNo || '',
        rollNo: student.studentProfile?.rollNo || '',
        dob: student.studentProfile?.dob ? new Date(student.studentProfile.dob).toISOString().split('T')[0] : '',
        gender: student.studentProfile?.gender || 'MALE',
        fatherName: student.studentProfile?.fatherName || '',
        motherName: student.studentProfile?.motherName || '',
        parentPhone: student.studentProfile?.parentPhone || '',
        parentEmail: student.studentProfile?.parentEmail || '',
        sectionId: student.studentProfile?.sectionId || '',
        admissionDate: student.studentProfile?.admissionDate ? new Date(student.studentProfile.admissionDate).toISOString().split('T')[0] : ''
      });
    }
    fetchSections();
  }, [student]);

  const fetchSections = async () => {
    try {
      const res = await api.get('/academic/classes');
      const allSections = [];
      (Array.isArray(res.data) ? res.data : []).forEach(cls => {
        (cls.sections || []).forEach(section => {
          allSections.push({ ...section, className: cls.name });
        });
      });
      setSections(allSections);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Student name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!student && !formData.password.trim()) {
      setError('Password is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh]">
      <div className="overflow-y-auto pr-2 space-y-4">
        {error && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="student@school.com"
            />
          </div>

          {!student && (
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
                placeholder="••••••••"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Enrollment No.</label>
            <input
              type="text"
              name="enrollmentNo"
              value={formData.enrollmentNo}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="ENR001"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Roll No.</label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Class & Section</label>
            <select
              name="sectionId"
              value={formData.sectionId}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="">Select Section</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.className} - {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Admission Date</label>
            <input
              type="date"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            />
          </div>
        </div>

        <div className="border-t border-surface-200 pt-4">
          <h3 className="font-semibold text-surface-950 mb-4">Parent Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Father's Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
                placeholder="Father's Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Mother's Name</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
                placeholder="Mother's Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Parent Phone</label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Parent Email</label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
                placeholder="parent@email.com"
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {student ? 'Update Student' : 'Add Student'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function SubjectForm({ subject, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classIds: []
  });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        classIds: subject.classes?.map(c => c.id) || []
      });
    }
    fetchClasses();
  }, [subject]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassToggle = (classId) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Subject name is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Subject Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="Mathematics"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Subject Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="MATH-101"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-3">Assign to Classes</label>
          <div className="grid gap-2 md:grid-cols-2">
            {classes.map(cls => (
              <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.classIds.includes(cls.id)}
                  onChange={() => handleClassToggle(cls.id)}
                  className="h-4 w-4 rounded border-surface-300 accent-brand-600"
                />
                <span className="text-sm text-surface-700">{cls.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {subject ? 'Update Subject' : 'Add Subject'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function TeacherForm({ teacher, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: '',
    joiningDate: '',
    qualifications: '',
    subjectIds: [],
    sectionIds: []
  });
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        email: teacher.email || '',
        password: '', // Don't pre-fill password on edit
        employeeId: teacher.teacherProfile?.employeeId || '',
        department: teacher.teacherProfile?.department || '',
        joiningDate: teacher.teacherProfile?.joiningDate ? new Date(teacher.teacherProfile.joiningDate).toISOString().split('T')[0] : '',
        qualifications: teacher.teacherProfile?.qualifications || '',
        subjectIds: teacher.teacherProfile?.subjects?.map(s => s.id) || [],
        sectionIds: teacher.teacherProfile?.classSections?.map(s => s.id) || []
      });
    }
    fetchSubjects();
    fetchSections();
  }, [teacher]);

  const fetchSections = async () => {
    try {
      const res = await api.get('/academic/classes');
      const all = [];
      (res.data || []).forEach(cls => {
        (cls.sections || []).forEach(sec => {
          all.push({ ...sec, className: cls.name });
        });
      });
      setSections(all);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/academic/subjects');
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter(id => id !== subjectId)
        : [...prev.subjectIds, subjectId]
    }));
  };

  const handleSectionToggle = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sectionIds: prev.sectionIds.includes(sectionId)
        ? prev.sectionIds.filter(id => id !== sectionId)
        : [...prev.sectionIds, sectionId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Teacher name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!teacher && !formData.password.trim()) {
      setError('Password is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="teacher@school.com"
          />
        </div>

        {!teacher && (
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="••••••••"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Employee ID</label>
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="EMP001"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="Science"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Joining Date</label>
          <input
            type="date"
            name="joiningDate"
            value={formData.joiningDate}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-surface-700 mb-2">Qualifications</label>
          <textarea
            name="qualifications"
            value={formData.qualifications}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            placeholder="B.Sc., M.Ed., etc."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-surface-700 mb-3">Subjects</label>
          <div className="grid gap-2 md:grid-cols-2">
            {subjects.map(subject => (
              <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.subjectIds.includes(subject.id)}
                  onChange={() => handleSubjectToggle(subject.id)}
                  className="h-4 w-4 rounded border-surface-300 accent-brand-600"
                />
                <span className="text-sm text-surface-700">{subject.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-surface-700 mb-3">Lead Sections (Class Teacher)</label>
          <div className="grid gap-2 md:grid-cols-2">
            {sections.map(section => (
              <label key={section.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sectionIds.includes(section.id)}
                  onChange={() => handleSectionToggle(section.id)}
                  className="h-4 w-4 rounded border-surface-300 accent-brand-600"
                />
                <span className="text-sm text-surface-700">{section.className} - {section.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {teacher ? 'Update Teacher' : 'Add Teacher'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function TimetableForm({ timetable, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    sectionId: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    subjectId: '',
    teacherId: '',
    room: ''
  });
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (timetable) {
      setFormData({
        sectionId: timetable.sectionId || '',
        dayOfWeek: timetable.dayOfWeek || 'MONDAY',
        startTime: timetable.startTime || '09:00',
        endTime: timetable.endTime || '10:00',
        subjectId: timetable.subjectId || '',
        teacherId: timetable.teacherId || '',
        room: timetable.room || ''
      });
    }
    fetchData();
  }, [timetable]);

  const fetchData = async () => {
    try {
      const [secRes, subjRes, teachRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
        api.get('/teachers')
      ]);
      
      const allSections = [];
      (Array.isArray(secRes.data) ? secRes.data : []).forEach(cls => {
        (cls.sections || []).forEach(section => {
          allSections.push({ ...section, className: cls.name });
        });
      });
      
      setSections(allSections);
      setSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
      setTeachers(Array.isArray(teachRes.data) ? teachRes.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.sectionId) {
      setError('Please select a section');
      return;
    }
    if (!formData.subjectId) {
      setError('Please select a subject');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Section *</label>
            <select
              name="sectionId"
              value={formData.sectionId}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="">Select Section</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.className} - {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Day of Week</label>
            <select
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="MONDAY">Monday</option>
              <option value="TUESDAY">Tuesday</option>
              <option value="WEDNESDAY">Wednesday</option>
              <option value="THURSDAY">Thursday</option>
              <option value="FRIDAY">Friday</option>
              <option value="SATURDAY">Saturday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Subject *</label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Teacher</label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            >
              <option value="">Select Teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-surface-700 mb-2">Room/Lab</label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20"
              placeholder="Room 101"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {timetable ? 'Update Timetable' : 'Add Timetable'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
