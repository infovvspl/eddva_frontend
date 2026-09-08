// The full FAQ set for /faq — supplied verbatim across 10 categories.
// HTML entities (&amp; &#39;) from the source are decoded to plain characters;
// wording is otherwise untouched. A handful of answers carry a short `list`
// of items (e.g. the school solutions, the stakeholder list) rather than
// being pasted as a run-on sentence, since that's how the source formatted
// them — everything else is a single `a` string.
//
// One inconsistency in the source is normalised rather than preserved
// literally: "24X7" (capital X) in one answer vs "24×7" (multiplication
// sign) in that same answer's own question and everywhere else — kept as
// "24×7" throughout since it's the same word, not different wording.

export const faqCategories = [
  {
    id: "general",
    label: "General – About EDDVA",
    questions: [
      {
        q: "What is EDDVA?",
        a: "EDDVA is an AI-powered education technology platform designed to support schools and educational institutes with digital learning, academic management, assessments, personalized learning and institutional operations.",
      },
      {
        q: "Who is EDDVA designed for?",
        a: "EDDVA serves two primary segments:",
        list: [
          "Schools – with ERP, AI-LMS and ERP + AI-LMS solutions",
          "Educational Institutes – with AI and Non-AI learning platforms",
          "Colleges & Universities – with AI LMS, ERP and Placement Management System",
        ],
        after: "The platform can be configured according to the institution's academic model, requirements and student strength.",
      },
      {
        q: "Is EDDVA an ERP or an LMS?",
        a: "EDDVA can be both. For schools EDDVA offers an ERP, AI-LMS, or integrated ERP + AI-LMS solution. For educational institutes, EDDVA provides AI and Non-AI learning platforms.",
      },
      {
        q: "What makes EDDVA different from a traditional LMS?",
        a: "EDDVA goes beyond content delivery by combining AI powered learning, assessments, academic assistance, personalization and analytics in one platform. For teachers, EDDVA provides intelligent tools to generate PPTs, DPPs, assessments, notes and animated learning videos, reducing repetitive academic work so they can focus more on teaching and mentoring. For students, EDDVA delivers personalized learning, identifies weak topics and learning gaps, recommends targeted practice and provides AI powered doubt assistance based on individual performance and progress. For schools, EDDVA brings academic insights and school management capabilities together, helping institutions make informed, data driven decisions.",
      },
      {
        q: "Who benefits from EDDVA?",
        a: "EDDVA is designed around the needs of different stakeholders:",
        list: [
          "Institute Administrators & Faculty – centralized management, analytics and digital learning",
          "Teachers – academic and administrative assistance",
          "Students – personalized learning and academic support",
          "Parents – visibility into their child's academic journey",
        ],
      },
      {
        q: "Can EDDVA be customized?",
        a: "Yes. EDDVA can be configured according to the institution's academic structure, workflows, branding, user roles, modules and specific requirements.",
      },
      {
        q: "Can EDDVA support institutions of different sizes?",
        a: "Yes. EDDVA can be implemented for institutions with different student strengths, faculty sizes, branches and operational requirements.",
      },
      {
        q: "Can we start with selected modules and expand later?",
        a: "Yes. Institutions can begin with the solution most relevant to their immediate requirements and expand the platform as their needs grow.",
      },
      {
        q: "Can students use EDDVA directly?",
        a: "No. EDDVA is designed for schools, colleges and educational institutions. Students access EDDVA through their institution once the institution adopts the platform. This enables the institution to provide students with personalized learning, AI powered academic assistance, assessments and performance insights within a structured learning environment.",
      },
    ],
  },
  {
    id: "schools",
    label: "EDDVA for Schools",
    questions: [
      {
        q: "What solutions does EDDVA offer for schools?",
        a: "Schools can choose from:",
        list: ["School ERP", "AI-Powered LMS", "ERP + AI-Powered LMS"],
        after: "The appropriate solution depends on the school's existing systems, requirements and digital learning objectives.",
      },
      {
        q: "What does the School ERP manage?",
        a: "Depending on the selected scope, the ERP can include student management, teacher & staff management, attendance, fee management, timetable, homework & assignments, examinations, transport, hostel, canteen, accounts, inventory, sports, reports, communication and analytics.",
      },
      {
        q: "What does the AI-LMS provide?",
        a: "The AI-LMS can provide features such as AI-generated notes, transcripts, intelligent assessments, personalized learning support, AI-powered doubt assistance, study planning, digital learning resources and academic analytics.",
      },
      {
        q: "Can a school use both ERP and AI-LMS?",
        a: "Yes. Schools can implement an integrated ERP + AI-LMS solution to manage both institutional operations and digital learning through one ecosystem.",
      },
      {
        q: "Can EDDVA work with our existing ERP?",
        a: "Yes. A school does not necessarily have to replace its existing ERP immediately. EDDVA can be evaluated for areas where additional capabilities are required, particularly AI-powered learning, personalized academic assistance, assessments and learning analytics. Integration possibilities can also be evaluated where technically feasible.",
      },
      {
        q: "How is EDDVA useful for school management?",
        a: "Management can gain centralized visibility into academic and administrative activities, monitor performance, access reports and make data-driven decisions.",
      },
      {
        q: "How is EDDVA useful for teachers?",
        a: "Teachers can manage attendance, assignments, assessments, learning resources and student performance while using AI-enabled tools to reduce repetitive academic work.",
      },
      {
        q: "How is EDDVA useful for students?",
        a: "Students can access digital learning resources, assessments, personalized academic support and AI-powered doubt assistance.",
      },
      {
        q: "How is EDDVA useful for parents?",
        a: "Parents can access relevant information about their child's attendance, assignments, academic performance and school communications through the parent-facing features enabled by the school.",
      },
      {
        q: "Can EDDVA be configured according to our school's academic structure?",
        a: "Yes. Classes, sections, subjects, teachers, academic workflows, user roles and other supported configurations can be aligned with the school's requirements.",
      },
    ],
  },
  {
    id: "teachers",
    label: "EDDVA for Teachers",
    questions: [
      {
        q: "How does EDDVA make teachers' work easier?",
        a: "EDDVA brings attendance, assignments, assessments, academic resources and student performance information into one platform, helping reduce repetitive administrative work.",
      },
      {
        q: "Can teachers create assignments and assessments?",
        a: "Yes. Teachers can create and manage assignments, homework, assessments and other academic activities according to the features enabled for their institution.",
      },
      {
        q: "Can teachers use their own teaching material?",
        a: "Yes. Teachers can manage supported academic resources and teaching material within the platform.",
      },
      {
        q: "Can AI assist teachers?",
        a: "Yes. Where AI functionality is enabled, teachers can use AI-powered tools to assist with supported content preparation, notes, questions, assessments and other academic activities.",
      },
      {
        q: "Can teachers monitor individual student performance?",
        a: "Yes. Teachers can access relevant academic, attendance, assignment and assessment information to monitor student performance.",
      },
      {
        q: "Can EDDVA help identify learning gaps?",
        a: "Yes. Available assessment and performance insights can help teachers identify areas where students require additional practice or intervention.",
      },
      {
        q: "Can teachers manage multiple classes and subjects?",
        a: "Yes. The platform can be configured according to the institution's class, section, subject and teacher structure.",
      },
      {
        q: "Does EDDVA replace teachers?",
        a: "No. EDDVA is designed to assist teachers, not replace them. AI provides academic assistance, automation and insights while teachers remain responsible for instruction, mentoring and evaluation.",
      },
    ],
  },
  {
    id: "students",
    label: "EDDVA for Students",
    questions: [
      {
        q: "How does EDDVA help students?",
        a: "EDDVA provides students with structured learning resources, assignments, assessments, personalized academic assistance and AI-powered learning support.",
      },
      {
        q: "Can students get 24×7 doubt assistance?",
        a: "Yes. Where AI functionality is enabled, students can use AI-powered doubt assistance for academic support beyond classroom hours.",
      },
      {
        q: "Can EDDVA personalize learning?",
        a: "Yes. AI-enabled features can use available learning and assessment information to provide more personalized academic assistance and study support.",
      },
      {
        q: "Can students revise classroom learning through EDDVA?",
        a: "Yes. Schools and institutes can provide digital learning resources that allow students to revisit concepts and learning materials beyond classroom hours.",
      },
      {
        q: "Can students take online assessments?",
        a: "Yes. EDDVA can support digital assessments, practice activities and performance tracking depending on the selected solution.",
      },
      {
        q: "Can students access EDDVA from home?",
        a: "Yes, where remote access has been enabled by the school or institute. Students can use supported devices and an internet connection to access permitted features.",
      },
      {
        q: "Do students need smartphones to use EDDVA?",
        a: "Not necessarily. EDDVA can support computers, laptops, tablets and smartphones, depending on the implementation. Institutions can determine when and which devices students are permitted to use.",
      },
      {
        q: "How can EDDVA help students who are struggling academically?",
        a: "Assessment data, learning insights and personalized academic assistance can help identify areas requiring additional practice and support.",
      },
    ],
  },
  {
    id: "parents",
    label: "EDDVA for Parents",
    questions: [
      {
        q: "How does EDDVA help parents?",
        a: "EDDVA gives parents greater visibility into their child's academic journey through relevant information such as attendance, assignments, academic performance and school communications.",
      },
      {
        q: "Can parents monitor their child's academic progress?",
        a: "Yes. Where the Parent Dashboard is enabled, parents can view relevant academic information and progress.",
      },
      {
        q: "Can parents view attendance?",
        a: "Yes, where attendance and parent-access functionality has been enabled by the school.",
      },
      {
        q: "Can parents view assignments and academic activities?",
        a: "Yes. Relevant assignments and academic activities can be made available to parents according to the school's configuration.",
      },
      {
        q: "Can parents view examination or assessment results?",
        a: "Yes, where the relevant assessment functionality and parent access have been enabled.",
      },
      {
        q: "Can parents receive school announcements?",
        a: "Yes. Schools can use EDDVA's communication capabilities to share relevant announcements and updates with parents.",
      },
      {
        q: "Can parents access information about other students?",
        a: "No. Parent access is role-based and restricted to the student/account authorized by the institution.",
      },
      {
        q: "How does EDDVA improve parent-school engagement?",
        a: "By providing structured access to relevant academic information and school communication, EDDVA can help parents remain more informed and involved in their child's education.",
      },
    ],
  },
  {
    id: "ai-learning",
    label: "AI-Powered Learning",
    questions: [
      {
        q: "What AI features are available in EDDVA?",
        a: "Depending on the selected solution, EDDVA can provide AI generated notes, AI powered doubt assistance, intelligent assessments, personalized study support, learning insights and AI assisted academic content creation. Book a demo to explore the features and capabilities available for your institution.",
      },
      {
        q: "Can AI generate notes for students?",
        a: "Yes. Where enabled, AI can assist in generating structured academic notes from supported learning content.",
      },
      {
        q: "Can AI help teachers prepare assessments?",
        a: "Yes. AI-enabled functionality can assist teachers with supported question and assessment creation.",
      },
      {
        q: "Can students use AI for doubt solving?",
        a: "Yes. The AI-powered 24×7 doubt assistance feature is designed to provide students with academic support beyond traditional classroom hours.",
      },
      {
        q: "Can AI provide personalized learning recommendations?",
        a: "Where enabled, EDDVA can use available learning and assessment information to provide more personalized academic support.",
      },
      {
        q: "Can AI replace classroom teaching?",
        a: "No. AI is an academic support tool, not a replacement for teachers, classroom interaction or human mentorship.",
      },
      {
        q: "Can teachers review AI-generated content?",
        a: "Yes. Teachers should review and validate AI-assisted academic content before using it as official instructional material.",
      },
      {
        q: "What happens if the AI provides an incorrect answer?",
        a: "AI-generated responses should be reviewed, particularly for important academic content. Incorrect or inappropriate responses can be reported through the appropriate support mechanism for review.",
      },
    ],
  },
  {
    id: "institutes",
    label: "EDDVA for Educational Institutes",
    questions: [
      {
        q: "What type of institutes can use EDDVA?",
        a: "EDDVA can support schools, universities and competitive-exam preparation centres and other educational institutes that require a structured digital learning platform.",
      },
      {
        q: "What solutions does EDDVA offer for institutes?",
        a: "EDDVA offers two primary institute models:",
        list: ["AI Learning Platform", "Non-AI Learning Platform"],
        after: "Institutes can select the model based on their teaching methodology, student requirements and digital learning objectives.",
      },
      {
        q: "What is the AI model for institutes?",
        a: "The AI model adds AI-powered capabilities to the institute's learning ecosystem, such as AI-assisted learning, doubt assistance, personalized academic support, intelligent assessments and other applicable AI features.",
      },
      {
        q: "What is the Non-AI model?",
        a: "The Non-AI model provides a structured digital learning platform without the AI-powered components. It can support digital content, classes, assessments, assignments, student management and other applicable learning features.",
      },
      {
        q: "Can EDDVA be used for competitive-exam preparation?",
        a: "Yes. EDDVA can be configured for institutes preparing students for competitive examinations, according to the institute's curriculum, content and academic model.",
      },
      {
        q: "How is EDDVA useful for institute management?",
        a: "Institute administrators can centralize student and academic information, monitor performance, manage learning activities and gain better visibility into institutional operations.",
      },
      {
        q: "How is EDDVA useful for institute faculty?",
        a: "Faculty can manage learning content, assignments, assessments and student performance while using AI-enabled tools where applicable.",
      },
      {
        q: "How is EDDVA useful for institute students?",
        a: "Students can access digital learning resources, assessments and academic support, with additional AI-powered assistance available under the AI model.",
      },
      {
        q: "Can an institute choose AI or Non-AI based on its budget and requirements?",
        a: "Yes. The two models allow institutes to choose the level of technology and AI functionality that best fits their academic and commercial requirements.",
      },
      {
        q: "Can the institute platform be customized?",
        a: "Yes. The platform can be configured according to the institute's courses, batches, subjects, faculty structure, academic workflows and specific requirements.",
      },
    ],
  },
  {
    id: "implementation",
    label: "Implementation & Customization",
    questions: [
      {
        q: "How long does EDDVA implementation take?",
        a: "Implementation time depends on the selected solution, number of users, modules, customization, data migration and integration requirements. A detailed timeline is provided after understanding the institution's requirements.",
      },
      {
        q: "Will EDDVA be customized for our institution?",
        a: "Yes. The platform can be configured according to the institution's academic structure, workflows, branding, user roles and selected modules.",
      },
      {
        q: "Can our existing student and teacher data be migrated?",
        a: "Where technically feasible, structured existing data can be migrated after reviewing the institution's current data format and requirements.",
      },
      {
        q: "Will teachers and administrators receive training?",
        a: "Yes. Onboarding and training can be provided to relevant administrators, teachers and users.",
      },
      {
        q: "Can we start with selected modules?",
        a: "Yes. Institutions can begin with their immediate requirements and expand the platform later.",
      },
      {
        q: "Can we integrate EDDVA with our existing software?",
        a: "Integration possibilities can be evaluated based on the existing system, APIs, technical infrastructure and specific requirements.",
      },
      {
        q: "Can EDDVA support multiple branches?",
        a: "Yes. Multi-branch functionality can be enabled where required and included within the applicable implementation scope.",
      },
      {
        q: "Can we request additional features or customization?",
        a: "Yes. Additional customization or development requirements can be evaluated separately based on technical feasibility and project scope.",
      },
    ],
  },
  {
    id: "security",
    label: "Security, Privacy & Support",
    questions: [
      {
        q: "Is institutional data secure?",
        a: "EDDVA is designed with security controls and role-based access mechanisms to help protect institutional and user data.",
      },
      {
        q: "Who can access student and institutional information?",
        a: "Access is controlled through user roles and permissions. Users receive access only to information relevant to their authorized role.",
      },
      {
        q: "Can the institution control user permissions?",
        a: "Yes. Authorized administrators can manage access and permissions according to institutional requirements.",
      },
      {
        q: "Can students access another student's information?",
        a: "No. Role-based access is designed to restrict users from viewing information they are not authorized to access.",
      },
      {
        q: "What happens when a student or teacher leaves the institution?",
        a: "Authorized administrators can deactivate or modify user access according to the institution's policies.",
      },
      {
        q: "Is technical support provided?",
        a: "Yes. Technical support and maintenance are provided according to the selected service and AMC/support plan.",
      },
      {
        q: "What if teachers or administrators need help using EDDVA?",
        a: "Onboarding and training can be provided, and users can also contact the designated support channel for assistance.",
      },
      {
        q: "Can users report technical issues or incorrect AI responses?",
        a: "Yes. Issues can be reported through the designated EDDVA support mechanism for investigation and resolution.",
      },
    ],
  },
  {
    id: "getting-started",
    label: "Getting Started with EDDVA",
    questions: [
      {
        q: "Can we see EDDVA before making a decision?",
        a: "Absolutely. Schools and educational institutes can request a Free Demo to explore the platform and understand the relevant features.",
      },
      {
        q: "Can the demo be customized according to our requirements?",
        a: "Yes. The demonstration can focus on the modules, workflows and challenges most relevant to your school or institute.",
      },
      {
        q: "Who should attend the demo?",
        a: "We recommend involving relevant School/Institute Management, Principal/Director, Academic Heads, Administrators, IT representatives and Teachers/Faculty, depending on your requirements.",
      },
      {
        q: "We already have an ERP/LMS. Can we still consider EDDVA?",
        a: "Yes. EDDVA can be evaluated alongside your existing system to identify gaps and determine whether EDDVA can complement, integrate with or replace specific components.",
      },
      {
        q: "Do we have to implement everything at once?",
        a: "No. EDDVA can be introduced according to your priorities and expanded progressively.",
      },
      {
        q: "Can we discuss our requirements before receiving a quotation?",
        a: "Yes. Understanding your student strength, academic model, existing systems and required features allows us to recommend the most appropriate solution and commercial structure.",
      },
      {
        q: "Can EDDVA support our institution's specific workflow?",
        a: "Yes. Requirements can be assessed during the discovery and demo process to determine what can be configured, integrated or customized.",
      },
      {
        q: "How do we get started?",
        a: "Simply Book a Free Demo. Our team will understand your requirements, demonstrate the relevant EDDVA solution and provide a customized implementation and commercial proposal.",
      },
    ],
  },
];
