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

  const qualifications = [form.qualification, form.degree, form.specialization]
    .filter(Boolean)
    .join(' | ');

  return {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    phone: form.phone || form.altPhone || null,
    photo: typeof form.photo === 'string' ? form.photo : null,
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
  };
}

/** Map AddStudentMultiStep form → API body for POST /students */
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
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    phone: form.phone || null,
    photo: typeof form.photo === 'string' ? form.photo : null,
    enrollmentNo: form.enrollmentNo || form.enrollmentNumber || form.admissionNo || null,
    rollNo: form.rollNo || form.rollNumber || null,
    sectionId: form.sectionId || (form.sectionIds?.[0] ?? null),
    dob: form.dob || null,
    gender: form.gender || null,
    bloodGroup: form.bloodGroup || null,
    maritalStatus: form.maritalStatus || null,
    nationalId: form.nationalId || null,
    fatherName: form.fatherName || form.parentName || null,
    motherName: form.motherName || null,
    parentPhone: form.parentPhone || form.guardianPhone || null,
    parentEmail: form.parentEmail || null,
    parentOccupation: form.parentOccupation || null,
    address: form.currentAddress || form.address || null,
    city: form.city || null,
    state: form.state || null,
    pinCode: form.pinCode || null,
    admissionDate: form.admissionDate || null,
    medicalConditions: form.medicalConditions || null,
    allergies: form.allergies || null,
    documents: form.documents || {},
    instituteAdminPassword: form.instituteAdminPassword || null,
  };
}
