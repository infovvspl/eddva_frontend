export function mapTeacherFormToApiUpdate(form) {
  const qualifications = [form.qualification, form.degree, form.specialization]
    .filter(Boolean)
    .join(' | ');

  return {
    name: form.name?.trim() || null,
    email: form.email?.trim().toLowerCase() || null,
    phone: form.phone || form.altPhone || null,
    profileImage: typeof form.profileImage === 'string' ? form.profileImage : (typeof form.photo === 'string' ? form.photo : null),
    employeeId: form.employeeId || form.employeeCode || null,
    bloodGroup: form.bloodGroup || null,
    maritalStatus: form.maritalStatus || null,
    department: form.department || null,
    joiningDate: form.joiningDate || form.joinDate || null,
    qualifications: qualifications || null,
    educationDetails: Array.isArray(form.educationDetails) ? form.educationDetails : [],
    experienceDetails: Array.isArray(form.experienceDetails) ? form.experienceDetails : [],
    subjectIds: Array.isArray(form.subjectIds) ? form.subjectIds : [],
    assignments: Array.isArray(form.assignments) ? form.assignments.map(a => ({
      classId: a.classId,
      sectionId: a.sectionId,
      subjectId: a.subjectId || null,
      isClassTeacher: !!a.isClassTeacher
    })) : [],
    dob: form.dob || null,
    gender: form.gender || null,
    nationalId: form.nationalId || null,
    role: form.role || null,
    salary: form.salary || null,
    experience: form.experience || null,
    shift: form.shift || null,
    weekdays: Array.isArray(form.weekdays) ? form.weekdays : [],
    officeHoursStart: form.officeHoursStart || null,
    officeHoursEnd: form.officeHoursEnd || null,
    maxHoursPerWeek: form.maxHoursPerWeek || null,
    currentAddress: form.currentAddress || null,
    permanentAddress: form.permanentAddress || null,
    emergencyContact: form.emergencyContact || null,
    guardianContact: form.guardianContact || null,
    allergies: form.allergies || null,
    medicalConditions: form.medicalConditions || null,
    disability: form.disability || null,
    emergencyDoctor: form.emergencyDoctor || null,
    docs: form.docs || {},
  };
}

/** Map AddTeacherMultiStep form → API body for POST /teachers */
export function mapTeacherFormToApi(form) {
  if (!form?.name?.trim()) throw new Error('Teacher name is required');
  if (!form?.email?.trim()) throw new Error('Email is required');
  if (!form?.password?.trim()) {
    throw new Error('Password is required so the teacher can log in at /login');
  }
  if (form.password !== form.confirmPassword) {
    throw new Error('Password and confirm password do not match');
  }

  return {
    ...mapTeacherFormToApiUpdate(form),
    password: form.password,
  };
}

/** Build the shared student body — sends BOTH camelCase and snake_case so the
 *  backend receives whichever convention it expects. */
function buildStudentBody(form) {
  const fatherPhone  = form.fatherPhone  || null;
  const motherPhone  = form.motherPhone  || null;
  const guardianPhone = form.guardianPhone || null;
  const parentPhone  = form.parentPhone || fatherPhone || motherPhone || guardianPhone || null;

  return {
    name:  form.name?.trim()  || null,
    email: form.email?.trim().toLowerCase() || null,
    phone: form.phone || null,
    photo: typeof form.photo === 'string' ? form.photo : null,

    // ── Academic (snake_case + camelCase) ──────────────────────────
    enrollment_no: form.enrollmentNo || form.enrollmentNumber || form.admissionNo || null,
    enrollmentNo:  form.enrollmentNo || form.enrollmentNumber || form.admissionNo || null,
    roll_no:       form.rollNo || null,
    rollNo:        form.rollNo || null,
    section_id:    form.sectionId || null,
    sectionId:     form.sectionId || null,
    admission_date: form.admissionDate || null,
    admissionDate:  form.admissionDate || null,

    // ── Personal ───────────────────────────────────────────────────
    dob:    form.dob || null,
    gender: form.gender || null,
    blood_group:    form.bloodGroup || null,
    bloodGroup:     form.bloodGroup || null,
    marital_status: form.maritalStatus || null,
    maritalStatus:  form.maritalStatus || null,
    national_id:    form.nationalId || null,
    nationalId:     form.nationalId || null,

    // ── Parent flat fields (snake_case + camelCase) ────────────────
    father_name:       form.fatherName || null,
    fatherName:        form.fatherName || null,
    mother_name:       form.motherName || null,
    motherName:        form.motherName || null,
    parent_phone:      parentPhone,
    parentPhone:       parentPhone,
    parent_email:      form.parentEmail || null,
    parentEmail:       form.parentEmail || null,
    parent_occupation: form.parentOccupation || null,
    parentOccupation:  form.parentOccupation || null,

    // ── Guardian / extra parent fields ────────────────────────────
    guardian_name:     form.guardianName || null,
    guardianName:      form.guardianName || null,
    guardian_relation: form.guardianRelation || null,
    guardianRelation:  form.guardianRelation || null,
    guardian_phone:    guardianPhone,
    guardianPhone:     guardianPhone,
    whatsapp_number:   form.whatsappNumber || null,
    whatsappNumber:    form.whatsappNumber || null,
    primary_contact:   form.primaryContact || 'father',
    primaryContact:    form.primaryContact || 'father',
    annual_income:     form.annualIncome || null,
    annualIncome:      form.annualIncome || null,

    // ── Nested parentDetails (in case backend supports it) ─────────
    parentDetails: {
      primaryContact:   form.primaryContact || 'father',
      fatherName:       form.fatherName || null,
      fatherPhone,
      motherName:       form.motherName || null,
      motherPhone,
      email:            form.parentEmail || null,
      whatsappNumber:   form.whatsappNumber || null,
      occupation:       form.parentOccupation || null,
      annualIncome:     form.annualIncome || null,
      guardianName:     form.guardianName || null,
      guardianRelation: form.guardianRelation || null,
      guardianPhone,
      createLogin:      form.createParentLogin !== false,
      sendViaSms:       form.sendViaSms !== false,
      sendViaEmail:     form.sendViaEmail === true,
    },

    // ── Address ───────────────────────────────────────────────────
    address:          form.currentAddress || form.address || null,
    current_address:  form.currentAddress || null,
    currentAddress:   form.currentAddress || null,
    permanent_address:form.permanentAddress || null,
    permanentAddress: form.permanentAddress || null,
    city:             form.city  || null,
    state:            form.state || null,
    pin_code:         form.pinCode || null,
    pinCode:          form.pinCode || null,

    // ── Medical ───────────────────────────────────────────────────
    medical_conditions: form.medicalConditions || null,
    medicalConditions:  form.medicalConditions || null,
    allergies: form.allergies || null,

    // ── Documents ─────────────────────────────────────────────────
    documents: form.documents || {},
  };
}

/** Map AddStudentMultiStep form → API body for POST /students (create) */
export function mapStudentFormToApi(form) {
  if (!form?.name?.trim()) throw new Error('Student name is required');
  if (!form?.email?.trim()) throw new Error('Email is required');
  if (!form?.password?.trim()) {
    throw new Error('Password is required so the student can log in at /login');
  }
  if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
    throw new Error('Password and confirm password do not match');
  }

  return {
    ...buildStudentBody(form),
    password: form.password,
    institute_admin_password: form.instituteAdminPassword || null,
    instituteAdminPassword:   form.instituteAdminPassword || null,
  };
}

/** Map AddStudentMultiStep form → API body for PUT /students/:id (update) */
export function mapStudentFormToApiUpdate(form) {
  return buildStudentBody(form);
}
