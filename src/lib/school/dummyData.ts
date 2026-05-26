export const teacherProfile = {
  id: 'T001',
  name: 'Dr. Sarah Mitchell',
  email: 'sarah.mitchell@edtech.com',
  subject: 'Mathematics',
  department: 'Science & Mathematics',
  avatar: null,
  phone: '+1 234 567 8900',
  experience: '12 years',
  qualification: 'Ph.D. in Applied Mathematics',
};

export const dashboardStats = [
  { id: 1, title: 'Total Students', value: '1,248', change: '+12%', changeType: 'positive', icon: 'Users' },
  { id: 2, title: 'Avg Attendance', value: '87.3%', change: '+2.1%', changeType: 'positive', icon: 'UserCheck' },
  { id: 3, title: 'Assignments Due', value: '24', change: '-3', changeType: 'negative', icon: 'FileText' },
  { id: 4, title: 'Tests This Week', value: '8', change: '+2', changeType: 'neutral', icon: 'ClipboardList' },
];

export const upcomingClasses = [
  { id: 1, subject: 'Calculus - Integration', time: '09:00 AM', duration: '45 min', class: '12-A', room: 'Room 301', status: 'upcoming' },
  { id: 2, subject: 'Linear Algebra', time: '10:30 AM', duration: '45 min', class: '11-B', room: 'Room 205', status: 'upcoming' },
  { id: 3, subject: 'Statistics - Probability', time: '01:00 PM', duration: '60 min', class: '12-C', room: 'Lab 102', status: 'upcoming' },
  { id: 4, subject: 'Trigonometry Review', time: '03:00 PM', duration: '45 min', class: '10-A', room: 'Room 401', status: 'upcoming' },
];

export const notifications = [
  { id: 1, type: 'info', title: 'New assignment submitted', message: '5 students submitted Calculus Homework #4', time: '2 min ago', read: false },
  { id: 2, type: 'warning', title: 'Low attendance alert', message: 'Class 11-B attendance below 75%', time: '15 min ago', read: false },
  { id: 3, type: 'success', title: 'Test results published', message: 'Unit Test 3 results are now available', time: '1 hr ago', read: true },
  { id: 4, type: 'info', title: 'Parent meeting scheduled', message: 'Meeting with Riya\'s parents on May 10', time: '2 hrs ago', read: true },
  { id: 5, type: 'error', title: 'Grievance reported', message: 'Student complaint about grading policy', time: '3 hrs ago', read: false },
];

export const studentActivityFeed = [
  { id: 1, student: 'Aarav Sharma', action: 'submitted assignment', target: 'Calculus HW #4', time: '5 min ago', avatar: null },
  { id: 2, student: 'Priya Patel', action: 'scored 95% in', target: 'Unit Test 3', time: '20 min ago', avatar: null },
  { id: 3, student: 'Rohan Singh', action: 'asked a question in', target: 'Linear Algebra', time: '35 min ago', avatar: null },
  { id: 4, student: 'Meera Gupta', action: 'completed', target: 'DPP Chapter 5', time: '1 hr ago', avatar: null },
  { id: 5, student: 'Kabir Joshi', action: 'joined live class', target: 'Statistics', time: '2 hrs ago', avatar: null },
];

export const attendanceSummary = [
  { class: '12-A', present: 38, total: 42, percentage: 90.5 },
  { class: '11-B', present: 28, total: 40, percentage: 70.0 },
  { class: '12-C', present: 35, total: 38, percentage: 92.1 },
  { class: '10-A', present: 36, total: 44, percentage: 81.8 },
];

export const topics = [
  { id: 1, name: 'Differential Calculus', subject: 'Mathematics', chapters: 5, progress: 78, status: 'active', students: 120 },
  { id: 2, name: 'Integral Calculus', subject: 'Mathematics', chapters: 4, progress: 45, status: 'active', students: 115 },
  { id: 3, name: 'Linear Algebra', subject: 'Mathematics', chapters: 6, progress: 92, status: 'completed', students: 98 },
  { id: 4, name: 'Probability Theory', subject: 'Mathematics', chapters: 3, progress: 30, status: 'active', students: 110 },
  { id: 5, name: 'Trigonometry', subject: 'Mathematics', chapters: 4, progress: 100, status: 'completed', students: 130 },
  { id: 6, name: 'Statistics', subject: 'Mathematics', chapters: 5, progress: 60, status: 'active', students: 105 },
];

export const chapters = [
  { id: 1, topicId: 1, name: 'Limits and Continuity', order: 1, materials: 3, progress: 100, status: 'completed' },
  { id: 2, topicId: 1, name: 'Derivatives', order: 2, materials: 4, progress: 85, status: 'active' },
  { id: 3, topicId: 1, name: 'Applications of Derivatives', order: 3, materials: 2, progress: 50, status: 'active' },
  { id: 4, topicId: 1, name: 'Higher Order Derivatives', order: 4, materials: 2, progress: 20, status: 'active' },
  { id: 5, topicId: 1, name: 'Mean Value Theorems', order: 5, materials: 1, progress: 0, status: 'pending' },
];

export const studyMaterials = [
  { id: 1, name: 'Limits & Continuity Notes', type: 'pdf', size: '2.4 MB', uploadedAt: '2026-04-20', downloads: 89 },
  { id: 2, name: 'Derivative Formulas Sheet', type: 'pdf', size: '1.1 MB', uploadedAt: '2026-04-22', downloads: 156 },
  { id: 3, name: 'Calculus Video Lecture 1', type: 'video', size: '245 MB', uploadedAt: '2026-04-18', downloads: 203 },
  { id: 4, name: 'Practice Problems Set A', type: 'doc', size: '890 KB', uploadedAt: '2026-04-25', downloads: 67 },
];

export const liveClasses = [
  { id: 1, title: 'Calculus - Integration Techniques', subject: 'Mathematics', class: '12-A', date: '2026-05-08', time: '09:00 AM', duration: '45 min', status: 'live', attendees: 38 },
  { id: 2, title: 'Linear Algebra - Matrices', subject: 'Mathematics', class: '11-B', date: '2026-05-08', time: '10:30 AM', duration: '45 min', status: 'scheduled', attendees: 0 },
  { id: 3, title: 'Statistics - Distributions', subject: 'Mathematics', class: '12-C', date: '2026-05-08', time: '01:00 PM', duration: '60 min', status: 'scheduled', attendees: 0 },
  { id: 4, title: 'Trigonometry - Identities', subject: 'Mathematics', class: '10-A', date: '2026-05-09', time: '09:00 AM', duration: '45 min', status: 'scheduled', attendees: 0 },
];

export const recordedClasses = [
  { id: 1, title: 'Differential Equations Intro', subject: 'Mathematics', date: '2026-05-06', duration: '48 min', views: 89, likes: 34 },
  { id: 2, title: 'Matrix Operations', subject: 'Mathematics', date: '2026-05-05', duration: '52 min', views: 112, likes: 45 },
  { id: 3, title: 'Probability Basics', subject: 'Mathematics', date: '2026-05-04', duration: '45 min', views: 76, likes: 28 },
  { id: 4, title: 'Integration by Parts', subject: 'Mathematics', date: '2026-05-03', duration: '55 min', views: 134, likes: 56 },
  { id: 5, title: 'Sequence & Series', subject: 'Mathematics', date: '2026-05-02', duration: '50 min', views: 98, likes: 41 },
];

export const calendarEvents = [
  { id: 1, title: 'Calculus Class', date: '2026-05-08', time: '09:00', type: 'class' },
  { id: 2, title: 'Unit Test 4', date: '2026-05-10', time: '10:00', type: 'exam' },
  { id: 3, title: 'Parent Meeting', date: '2026-05-12', time: '14:00', type: 'meeting' },
  { id: 4, title: 'Linear Algebra Class', date: '2026-05-08', time: '10:30', type: 'class' },
  { id: 5, title: 'Assignment Deadline', date: '2026-05-15', time: '23:59', type: 'deadline' },
];

export const attendanceRecords = [
  { id: 1, studentId: 'S001', name: 'Aarav Sharma', class: '12-A', present: 22, absent: 3, late: 1, percentage: 84.6 },
  { id: 2, studentId: 'S002', name: 'Priya Patel', class: '12-A', present: 25, absent: 0, late: 1, percentage: 96.2 },
  { id: 3, studentId: 'S003', name: 'Rohan Singh', class: '12-A', present: 20, absent: 5, late: 1, percentage: 76.9 },
  { id: 4, studentId: 'S004', name: 'Meera Gupta', class: '12-A', present: 24, absent: 1, late: 1, percentage: 92.3 },
  { id: 5, studentId: 'S005', name: 'Kabir Joshi', class: '12-A', present: 23, absent: 2, late: 1, percentage: 88.5 },
  { id: 6, studentId: 'S006', name: 'Ananya Reddy', class: '12-A', present: 21, absent: 4, late: 1, percentage: 80.8 },
  { id: 7, studentId: 'S007', name: 'Vikram Nair', class: '12-A', present: 26, absent: 0, late: 0, percentage: 100 },
  { id: 8, studentId: 'S008', name: 'Sneha Iyer', class: '12-A', present: 19, absent: 6, late: 1, percentage: 73.1 },
];

export const monthlyAttendance = [
  { month: 'Jan', present: 92, absent: 8 },
  { month: 'Feb', present: 88, absent: 12 },
  { month: 'Mar', present: 95, absent: 5 },
  { month: 'Apr', present: 87, absent: 13 },
  { month: 'May', present: 90, absent: 10 },
];

export const assignments = [
  { id: 1, title: 'Calculus Homework #4', type: 'homework', subject: 'Mathematics', class: '12-A', dueDate: '2026-05-10', totalStudents: 42, submitted: 28, graded: 15, status: 'active' },
  { id: 2, title: 'DPP - Chapter 5', type: 'dpp', subject: 'Mathematics', class: '12-A', dueDate: '2026-05-12', totalStudents: 42, submitted: 35, graded: 35, status: 'completed' },
  { id: 3, title: 'Linear Algebra Notes', type: 'notes', subject: 'Mathematics', class: '11-B', dueDate: '2026-05-15', totalStudents: 40, submitted: 0, graded: 0, status: 'upcoming' },
  { id: 4, title: 'Probability Practice Set', type: 'homework', subject: 'Mathematics', class: '12-C', dueDate: '2026-05-11', totalStudents: 38, submitted: 20, graded: 8, status: 'active' },
  { id: 5, title: 'Trigonometry DPP', type: 'dpp', subject: 'Mathematics', class: '10-A', dueDate: '2026-05-09', totalStudents: 44, submitted: 40, graded: 40, status: 'completed' },
];

export const assessmentTests = [
  { id: 1, title: 'Topic Test - Derivatives', type: 'topic', subject: 'Mathematics', totalMarks: 30, duration: '45 min', date: '2026-05-12', class: '12-A', status: 'scheduled', submissions: 0 },
  { id: 2, title: 'Unit Test 3 - Calculus', type: 'unit', subject: 'Mathematics', totalMarks: 100, duration: '2 hrs', date: '2026-05-08', class: '12-A', status: 'completed', submissions: 40 },
  { id: 3, title: 'Mock Test - Full Syllabus', type: 'mock', subject: 'Mathematics', totalMarks: 200, duration: '3 hrs', date: '2026-05-20', class: '12-A', status: 'scheduled', submissions: 0 },
  { id: 4, title: 'Subject Test - Algebra', type: 'subject', subject: 'Mathematics', totalMarks: 80, duration: '1.5 hrs', date: '2026-05-15', class: '11-B', status: 'scheduled', submissions: 0 },
  { id: 5, title: 'Final Exam - Mathematics', type: 'final', subject: 'Mathematics', totalMarks: 150, duration: '3 hrs', date: '2026-06-01', class: '12-A', status: 'upcoming', submissions: 0 },
];

export const leaderboard = [
  { rank: 1, name: 'Priya Patel', marks: 98, percentage: 98, class: '12-A' },
  { rank: 2, name: 'Vikram Nair', marks: 95, percentage: 95, class: '12-A' },
  { rank: 3, name: 'Meera Gupta', marks: 93, percentage: 93, class: '12-A' },
  { rank: 4, name: 'Aarav Sharma', marks: 89, percentage: 89, class: '12-A' },
  { rank: 5, name: 'Kabir Joshi', marks: 87, percentage: 87, class: '12-A' },
  { rank: 6, name: 'Ananya Reddy', marks: 85, percentage: 85, class: '12-A' },
  { rank: 7, name: 'Rohan Singh', marks: 82, percentage: 82, class: '12-A' },
  { rank: 8, name: 'Sneha Iyer', marks: 78, percentage: 78, class: '12-A' },
];

export const resultAnalysis = {
  averageScore: 84.5,
  highestScore: 98,
  lowestScore: 45,
  passRate: 92,
  distinctionRate: 35,
  gradeDistribution: [
    { grade: 'A+', count: 8, color: '#22c55e' },
    { grade: 'A', count: 12, color: '#3b82f6' },
    { grade: 'B+', count: 10, color: '#8b5cf6' },
    { grade: 'B', count: 6, color: '#f59e0b' },
    { grade: 'C', count: 4, color: '#f97316' },
    { grade: 'D', count: 2, color: '#ef4444' },
  ],
};

export const pptSlides = [
  { id: 1, title: 'Introduction to Calculus', slides: 12, lastEdited: '2026-05-06', status: 'published' },
  { id: 2, title: 'Integration Techniques', slides: 18, lastEdited: '2026-05-04', status: 'draft' },
  { id: 3, title: 'Linear Algebra Basics', slides: 15, lastEdited: '2026-05-02', status: 'published' },
  { id: 4, title: 'Probability Distributions', slides: 10, lastEdited: '2026-04-28', status: 'draft' },
];

export const mindMaps = [
  { id: 1, title: 'Calculus Overview', nodes: 24, lastEdited: '2026-05-05', status: 'active' },
  { id: 2, title: 'Algebra Connections', nodes: 18, lastEdited: '2026-05-01', status: 'active' },
  { id: 3, title: 'Statistics Flow', nodes: 15, lastEdited: '2026-04-25', status: 'archived' },
];

export const studentPerformance = [
  { id: 1, name: 'Aarav Sharma', class: '12-A', avgScore: 78, trend: 'improving', weakAreas: ['Integration', 'Probability'], strongAreas: ['Algebra', 'Trigonometry'] },
  { id: 2, name: 'Priya Patel', class: '12-A', avgScore: 95, trend: 'consistent', weakAreas: ['Statistics'], strongAreas: ['Calculus', 'Algebra', 'Trigonometry'] },
  { id: 3, name: 'Rohan Singh', class: '12-A', avgScore: 62, trend: 'declining', weakAreas: ['Calculus', 'Algebra', 'Probability'], strongAreas: ['Trigonometry'] },
  { id: 4, name: 'Meera Gupta', class: '12-A', avgScore: 88, trend: 'improving', weakAreas: ['Integration'], strongAreas: ['Differentiation', 'Algebra'] },
  { id: 5, name: 'Kabir Joshi', class: '12-A', avgScore: 82, trend: 'consistent', weakAreas: ['Probability', 'Statistics'], strongAreas: ['Calculus', 'Algebra'] },
];

export const classAnalytics = [
  { class: '12-A', avgScore: 82, passRate: 95, topSubject: 'Algebra', weakSubject: 'Probability', attendance: 90 },
  { class: '11-B', avgScore: 74, passRate: 88, topSubject: 'Trigonometry', weakSubject: 'Calculus', attendance: 70 },
  { class: '12-C', avgScore: 79, passRate: 92, topSubject: 'Statistics', weakSubject: 'Algebra', attendance: 92 },
  { class: '10-A', avgScore: 71, passRate: 85, topSubject: 'Geometry', weakSubject: 'Statistics', attendance: 82 },
];

export const grievances = [
  { id: 1, title: 'Grading discrepancy in Unit Test 3', category: 'academic', status: 'open', priority: 'high', raisedBy: 'Aarav Sharma', class: '12-A', date: '2026-05-06', description: 'Question 5 was marked incorrectly despite correct answer' },
  { id: 2, title: 'Classroom temperature issue', category: 'infrastructure', status: 'in-progress', priority: 'medium', raisedBy: 'Priya Patel', class: '12-A', date: '2026-05-04', description: 'AC not working in Room 301' },
  { id: 3, title: 'Study material not uploaded', category: 'academic', status: 'resolved', priority: 'low', raisedBy: 'Rohan Singh', class: '12-A', date: '2026-05-02', description: 'Chapter 5 notes were not available on the portal' },
  { id: 4, title: 'Schedule conflict', category: 'administrative', status: 'open', priority: 'medium', raisedBy: 'Meera Gupta', class: '12-A', date: '2026-05-07', description: 'Two classes scheduled at the same time on Friday' },
  { id: 5, title: 'Library book availability', category: 'infrastructure', status: 'closed', priority: 'low', raisedBy: 'Kabir Joshi', class: '12-A', date: '2026-04-28', description: 'Reference book for Chapter 4 not available' },
];

export const chatContacts = {
  students: [
    { id: 'S001', name: 'Aarav Sharma', class: '12-A', lastMessage: 'Thank you, ma\'am!', time: '2 min ago', unread: 0, online: true },
    { id: 'S002', name: 'Priya Patel', class: '12-A', lastMessage: 'I have a doubt in Q3', time: '15 min ago', unread: 2, online: true },
    { id: 'S003', name: 'Rohan Singh', class: '12-A', lastMessage: 'When is the next test?', time: '1 hr ago', unread: 0, online: false },
    { id: 'S004', name: 'Meera Gupta', class: '12-A', lastMessage: 'Submitted the assignment', time: '3 hrs ago', unread: 0, online: false },
  ],
  parents: [
    { id: 'P001', name: 'Mr. Sharma (Aarav)', lastMessage: 'Thank you for the update', time: '1 hr ago', unread: 0, online: false },
    { id: 'P002', name: 'Mrs. Patel (Priya)', lastMessage: 'Can we schedule a meeting?', time: '2 hrs ago', unread: 1, online: true },
    { id: 'P003', name: 'Mr. Singh (Rohan)', lastMessage: 'Noted, will discuss with Rohan', time: '1 day ago', unread: 0, online: false },
  ],
  staff: [
    { id: 'T002', name: 'Prof. James Wilson', subject: 'Physics', lastMessage: 'Lab schedule confirmed', time: '30 min ago', unread: 1, online: true },
    { id: 'T003', name: 'Dr. Emily Chen', subject: 'Chemistry', lastMessage: 'Shared the notes', time: '2 hrs ago', unread: 0, online: false },
    { id: 'T004', name: 'Ms. Rachel Green', subject: 'English', lastMessage: 'Meeting at 4 PM?', time: '5 hrs ago', unread: 0, online: false },
  ],
};

export const chatMessages = [
  { id: 1, sender: 'student', text: 'Good morning, ma\'am! I have a doubt in the integration problem from yesterday\'s class.', time: '10:30 AM' },
  { id: 2, sender: 'teacher', text: 'Good morning, Aarav! Sure, which problem specifically?', time: '10:32 AM' },
  { id: 3, sender: 'student', text: 'Problem 5 from the DPP - the one with substitution method. I\'m getting a different answer.', time: '10:33 AM' },
  { id: 4, sender: 'teacher', text: 'Let me check. In substitution problems, make sure you\'re also changing the limits when dealing with definite integrals. That\'s a common mistake.', time: '10:35 AM' },
  { id: 5, sender: 'student', text: 'Oh! I didn\'t change the limits. Let me try again.', time: '10:36 AM' },
  { id: 6, sender: 'teacher', text: 'Exactly. Convert the limits to the new variable, solve, then convert back if needed. Let me know if you still get stuck.', time: '10:38 AM' },
  { id: 7, sender: 'student', text: 'Thank you, ma\'am!', time: '10:40 AM' },
];

export const performanceChartData = [
  { month: 'Jan', avgScore: 72, attendance: 88 },
  { month: 'Feb', avgScore: 75, attendance: 85 },
  { month: 'Mar', avgScore: 78, attendance: 90 },
  { month: 'Apr', avgScore: 82, attendance: 87 },
  { month: 'May', avgScore: 85, attendance: 92 },
];

export const weaknessData = [
  { topic: 'Integration', weakStudents: 15, avgScore: 58 },
  { topic: 'Probability', weakStudents: 12, avgScore: 62 },
  { topic: 'Matrices', weakStudents: 8, avgScore: 65 },
  { topic: 'Statistics', weakStudents: 10, avgScore: 60 },
  { topic: 'Differential Equations', weakStudents: 11, avgScore: 55 },
];
