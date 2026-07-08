import { LandingLayout } from "@/components/landing/LandingLayout";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "hello@eddva.com";

export default function TermsOfServicePage() {
  return (
    <LandingLayout>
      <article className="landing-shell max-w-3xl py-14 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Legal</p>
        <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-gray-500">Effective Date: October 2026</p>

        <div className="prose prose-gray mt-10 max-w-none text-[15px] leading-relaxed text-gray-700">
          {/* 1. Introduction */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">1. Introduction</h2>
          <p className="mt-2 text-gray-700 text-justify">
            Welcome to EDDVA, an Artificial Intelligence-powered educational platform developed,
            owned and operated by Veteran Ventures & Services Pvt. Ltd. (&quot;VVSPL&quot;, &quot;we&quot;, &quot;our&quot;, or
            &quot;us&quot;). These Terms & Conditions (&quot;Terms&quot;) govern your access to and use of EDDVA,
            including its website, web application, mobile applications, software, APIs, cloud services,
            and all associated products and services (collectively referred to as the &quot;Platform&quot;).
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            By accessing, registering, or using EDDVA, you agree to comply with these Terms. If you do
            not agree with any provision of these Terms, you should not access or use the Platform.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            These Terms should be read together with our Privacy Policy and any separate commercial
            agreement, Service Level Agreement (SLA), Memorandum of Understanding (MoU),
            Purchase Order, or other written agreement executed between VVSPL and an educational
            institution. In the event of any inconsistency between these Terms and such written
            agreement, the executed agreement shall prevail to the extent of such inconsistency.
          </p>
            
          {/* 2. Definitions */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">2. Definitions</h2>
          <p className="mt-2 text-gray-700">For the purposes of these Terms:</p>
          <ul className="mt-2 list-none space-y-3 pl-0 text-gray-700">
            <li><strong className="text-gray-900">Platform</strong> means EDDVA, including its website, web portal, Android application, iOS application, APIs, software modules, cloud infrastructure, artificial intelligence services, databases, and all associated services.</li>
            <li><strong className="text-gray-900">User</strong> means any student, parent, teacher, faculty member, educational institution, administrator, employee, visitor, or any authorised individual using the Platform.</li>
            <li><strong className="text-gray-900">Institution</strong> means any school, college, university, coaching institute, academy, organisation, or government institution subscribing to or using EDDVA.</li>
            <li><strong className="text-gray-900">Content</strong> means all educational materials, documents, videos, assessments, assignments, presentations, messages, reports, question banks, AI-generated outputs, and any other information uploaded, stored, created, or transmitted through the Platform.</li>
          </ul>
            
          {/* 3. Eligibility and User Accounts */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">3. Eligibility and User Accounts</h2>
          <p className="mt-2 text-gray-700 text-justify">
            EDDVA is intended for use by recognised educational institutions and their authorised users.
            Students below the age prescribed under applicable laws may use the Platform only under
            the supervision or authorisation of their educational institution or parent or legal guardian,
            wherever applicable.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Certain services require users to create an account. Users are responsible for ensuring that
            all information provided during registration is accurate, complete, and up to date. Login
            credentials are personal and confidential and must not be shared with any unauthorised
            person.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Users are responsible for all activities carried out through their accounts and shall
            immediately notify the concerned institution or VVSPL of any suspected unauthorised
            access or security breach. VVSPL reserves the right to suspend or terminate accounts
            created using false information or used in violation of these Terms.
          </p>
            
          {/* 4. Licence to Use the Platform */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">4. Licence to Use the Platform</h2>
          <p className="mt-2 text-gray-700 text-justify">
            Subject to compliance with these Terms, VVSPL grants users a limited, non-exclusive, non-
            transferable, non-sublicensable, and revocable licence to access and use EDDVA solely for
            lawful educational, administrative, and institutional purposes.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            This licence does not grant users any ownership rights in the Platform or any intellectual
            property belonging to VVSPL. Users shall not copy, reproduce, modify, distribute, reverse
            engineer, decompile, create derivative works, or commercially exploit any part of EDDVA
            without prior written consent from VVSPL.
          </p>
            
          {/* 5. Acceptable Use and User Responsibilities */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">5. Acceptable Use and User Responsibilities</h2>
          <p className="mt-2 text-gray-700 text-justify">
            Users agree to use EDDVA responsibly, ethically, and in compliance with applicable laws,
            institutional policies, and these Terms. Users shall not use the Platform to engage in 
            unlawful, fraudulent, harmful, or abusive activities. Without limitation, users shall not:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
            <li>access accounts or systems without authorisation;</li>
            <li>upload viruses, malware, ransomware, spyware, or malicious code;</li>
            <li>interfere with the operation or security of the Platform;</li>
            <li>impersonate another individual or organisation;</li>
            <li>upload unlawful, defamatory, obscene, discriminatory, or offensive material;</li>
            <li>misuse AI-generated content for fraudulent or unethical purposes;</li>
            <li>attempt to bypass security controls or authentication mechanisms;</li>
            <li>copy, distribute, sell, or commercially exploit Platform content without authorisation.</li>
          </ul>
          <p className="mt-4 text-gray-700 text-justify">
            Users are responsible for maintaining the confidentiality of their account credentials and
            ensuring that any content uploaded by them does not infringe the intellectual property,
            privacy, or other legal rights of third parties.
          </p>
            
          {/* 6. Educational Institution Responsibilities */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">6. Educational Institution Responsibilities</h2>
          <p className="mt-2 text-gray-700 text-justify">
            Educational institutions subscribing to EDDVA are responsible for administering user
            accounts, maintaining the accuracy of institutional records, obtaining necessary permissions
            or consents from students or parents wherever required by law, and ensuring that the
            Platform is used in accordance with their academic policies and applicable laws.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Institutions shall designate authorised administrators responsible for managing access
            rights, academic records, attendance, assessments, and other institutional data maintained
            within EDDVA.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            VVSPL provides EDDVA as a technology platform. Academic policies relating to
            examinations, grading, attendance, promotions, certifications, disciplinary proceedings, or
            any educational decisions shall remain the sole responsibility of the concerned educational
            institution.
          </p>
            
          {/* 7. Artificial Intelligence Features */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">7. Artificial Intelligence Features</h2>
          <p className="mt-2 text-gray-700 text-justify">
            EDDVA incorporates Artificial Intelligence to enhance teaching, learning, and academic
            administration. AI-powered features may include generation of notes, lecture transcripts,
            quizzes, practice questions, study plans, learning recommendations, summaries, academic
            analytics, and other educational resources.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            AI-generated outputs are intended solely as educational assistance. While VVSPL
            continually improves the accuracy and reliability of its AI systems, such outputs may
            occasionally contain inaccuracies, omissions, or limitations. Users should independently
            verify AI-generated content before relying upon it for academic or administrative purposes.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            VVSPL shall not be responsible for academic decisions made solely on the basis of AI-
            generated outputs. Final evaluation, grading, certification, promotion, and disciplinary
            decisions shall always remain with the concerned educational institution.
          </p>
            
          {/* 8. Intellectual Property Rights */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">8. Intellectual Property Rights</h2>
          <p className="mt-2 text-gray-700 text-justify">
            EDDVA, including its software, source code, databases, artificial intelligence models,
            algorithms, user interface, design, graphics, documentation, trademarks, logos, trade
            names, and all related intellectual property rights, is the exclusive property of Veteran
            Ventures & Services Pvt. Ltd. or its licensors and is protected under applicable intellectual
            property laws.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Educational content uploaded by institutions or users shall remain the property of the
            respective owner. By uploading content to the Platform, the user or institution grants VVSPL
            a limited licence to host, store, process, reproduce, display, and transmit such content solely
            for the purpose of providing, maintaining, securing, and improving the services offered
            through EDDVA.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Users shall not remove proprietary notices, claim ownership of Platform components, or use
            the intellectual property of VVSPL except as expressly permitted under these Terms.
          </p>
            
          {/* 9. User Content */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">9. User Content</h2>
          <p className="mt-2 text-gray-700 text-justify">
            Users are solely responsible for the content they upload or share through EDDVA. They
            represent and warrant that they possess all necessary rights and permissions to upload such
            content and that it does not violate any applicable law or third-party rights.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            VVSPL reserves the right, but not the obligation, to remove or restrict access to any content
            that violates these Terms, infringes intellectual property rights, compromises platform
            security, or is otherwise considered unlawful or inappropriate.
          </p>
            
          {/* 10. Live Classes, Recorded Content and Assessments */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">10. Live Classes, Recorded Content and Assessments</h2>
          <p className="mt-2 text-gray-700 text-justify">
            EDDVA enables educational institutions to conduct live classes, upload recorded lectures,
            create assessments, assign coursework, and provide digital learning resources through the
            Platform. All educational content uploaded by an institution shall remain the property of the
            respective institution or its authorised content owner.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Users are permitted to access such content solely for their personal educational purposes.
            Unless expressly authorised by the concerned educational institution or VVSPL, users shall
            not record, download, reproduce, distribute, publish, sell, or otherwise commercially exploit
            any live class, recorded lecture, assessment, or educational material available through the
            Platform.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Where recording of live sessions is enabled, users acknowledge that such sessions may be
            recorded for academic continuity, revision, quality assurance, teacher training, institutional
            record keeping, or other legitimate educational purposes.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            EDDVA may provide AI-assisted assessments, automated evaluation, performance
            analytics, and examination monitoring features to support academic activities. Such features
            are intended to assist educational institutions and do not replace the academic judgment of
            teachers or institutional authorities. Final evaluation, grading, certification, and disciplinary
            decisions shall remain the sole responsibility of the concerned educational institution.
          </p>
            
          {/* 11. Subscription, Fees and Payments */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">11. Subscription, Fees and Payments</h2>
          <p className="mt-2 text-gray-700 text-justify">
            Certain services or features offered through EDDVA may be subject to subscription fees or
            commercial terms agreed separately between VVSPL and the concerned educational
            institution.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            All implementation charges, subscription fees, Annual Maintenance Charges (AMC),
            payment schedules, taxes, revenue-sharing arrangements, or other commercial terms shall
            be governed by the applicable commercial proposal, Purchase Order, Service Level
            Agreement (SLA), Memorandum of Understanding (MoU), or any other written agreement
            executed between VVSPL and the educational institution.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Where online payment facilities are enabled, transactions shall be processed through
            authorised third-party payment gateway providers. VVSPL does not store debit card
            numbers, credit card details, CVV numbers, UPI PINs, internet banking credentials, or other
            payment authentication information.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Failure to make payments in accordance with the agreed commercial terms may result in
            suspension or restriction of access to the subscribed services.
          </p>
            
          {/* 12. Third-Party Services */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">12. Third-Party Services</h2>
          <p className="mt-2 text-gray-700 text-justify">
            EDDVA may integrate with third-party services including cloud hosting providers, payment
            gateways, video conferencing platforms, email services, SMS gateways, notification
            services, authentication providers, analytics platforms, and other technology partners
            necessary for delivering the Platform.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Such third-party services operate independently and are governed by their respective terms
            and privacy policies. VVSPL shall not be responsible for the availability, performance,
            content, security, or privacy practices of third-party services.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            The inclusion of any third-party service within EDDVA does not constitute an endorsement or
            recommendation by VVSPL.
          </p>
            
          {/* 13. Platform Availability and Updates */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">13. Platform Availability and Updates</h2>
          <p className="mt-2 text-gray-700 text-justify">
            VVSPL strives to maintain the availability, reliability, and security of EDDVA. However,
            uninterrupted or error-free access cannot be guaranteed due to scheduled maintenance,
            software upgrades, infrastructure changes, internet connectivity issues, cloud service
            interruptions, security enhancements, or circumstances beyond our reasonable control.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            We reserve the right to modify, improve, replace, suspend, or discontinue any feature or
            functionality of the Platform whenever necessary to improve performance, security, legal
            compliance, or user experience.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Where reasonably practicable, users shall be notified in advance of scheduled maintenance
            that may significantly affect the availability of the Platform.
          </p>
            
          {/* 14. Suspension and Termination */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">14. Suspension and Termination</h2>
          <p className="mt-2 text-gray-700 text-justify">
            VVSPL reserves the right to suspend, restrict, or terminate access to EDDVA where a user
            or educational institution violates these Terms, applicable laws, contractual obligations, or
            engages in activities that may compromise the security, integrity, or lawful operation of the
            Platform.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Users may discontinue use of the Platform at any time. Educational institutions may
            terminate their subscription in accordance with the terms of the applicable commercial
            agreement executed with VVSPL.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Upon termination, users shall immediately cease using the Platform. Termination shall not
            affect any rights or obligations accrued prior to such termination, including obligations
            relating to confidentiality, intellectual property, payments, indemnification, limitation of liability,
            and dispute resolution.
          </p>
            
          {/* 15. Disclaimer of Warranties */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">15. Disclaimer of Warranties</h2>
          <p className="mt-2 text-gray-700 text-justify">
            EDDVA is provided on an &quot;as is&quot; and &quot;as available&quot; basis. While VVSPL uses reasonable
            efforts to provide a secure, reliable, and high-quality educational platform, we do not warrant
            that the Platform will always operate uninterrupted, error-free, or meet every specific
            educational or institutional requirement.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            AI-generated outputs, automated assessments, learning recommendations, transcripts,
            notes, summaries, and other AI-assisted features are intended solely to support teaching
            and learning. Users should independently verify such outputs before relying upon them for
            academic or administrative purposes.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            VVSPL does not guarantee specific academic performance, examination results,
            admissions, placements, rankings, certifications, or learning outcomes arising from the use
            of EDDVA.
          </p>
            
          {/* 16. Limitation of Liability */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">16. Limitation of Liability</h2>
          <p className="mt-2 text-gray-700 text-justify">
            To the maximum extent permitted under applicable law, VVSPL shall not be liable for any
            indirect, incidental, consequential, special, exemplary, or punitive damages, including loss of
            profits, business interruption, goodwill, educational opportunity, or loss of data arising out of
            or relating to the use of, or inability to use, EDDVA.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            In no event shall the aggregate liability of VVSPL exceed the fees actually paid by the
            concerned educational institution to VVSPL for the services giving rise to the claim during
            the twelve (12) months immediately preceding such claim, except where otherwise required
            by applicable law.
          </p>
            
          {/* 17. Confidentiality */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">17. Confidentiality</h2>
          <p className="mt-2 text-gray-700 text-justify">
            VVSPL recognises the confidential nature of educational information and shall use
            reasonable measures to protect the confidentiality of student records, teacher information,
            institutional documents, assessments, reports, learning resources, administrative
            information, and other confidential data processed through EDDVA.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            Users shall likewise maintain the confidentiality of information accessed through the Platform
            and shall not disclose, reproduce, distribute, or use confidential information except as
            authorised by the concerned educational institution or required under applicable law.
          </p>
            
          {/* 18. Force Majeure */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">18. Force Majeure</h2>
          <p className="mt-2 text-gray-700 text-justify">
            VVSPL shall not be liable for any delay or failure in performing its obligations under these
            Terms where such delay or failure results from events beyond its reasonable control,
            including natural disasters, floods, fires, earthquakes, pandemics, epidemics, war, terrorism,
            cyberattacks, governmental actions, labour disputes, internet outages, power failures, or
            failures of telecommunications or cloud infrastructure.
          </p>
            
          {/* 19. Governing Law and Dispute Resolution */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">19. Governing Law and Dispute Resolution</h2>
          <p className="mt-2 text-gray-700 text-justify">
            These Terms shall be governed by and construed in accordance with the laws of the
            Republic of India.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            The parties shall endeavour to resolve any dispute arising out of or relating to these Terms
            through mutual discussions and good-faith negotiations. If the dispute cannot be resolved
            amicably, it shall be subject to the exclusive jurisdiction of the competent courts at
            Bhubaneswar, Odisha, unless otherwise required under applicable law.
          </p>
            
          {/* 20. Changes to these Terms */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">20. Changes to these Terms</h2>
          <p className="mt-2 text-gray-700 text-justify">
            VVSPL reserves the right to amend or update these Terms from time to time to reflect
            changes in applicable laws, technology, business operations, or the services offered through
            EDDVA.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            The updated version shall be published on the Platform with the revised Effective Date.
            Continued use of EDDVA after such publication shall constitute acceptance of the revised
            Terms.
          </p>
            
          {/* 21. Entire Agreement */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">21. Entire Agreement</h2>
          <p className="mt-2 text-gray-700 text-justify">
            These Terms & Conditions, together with the Privacy Policy and any applicable commercial
            agreement, Service Level Agreement (SLA), Memorandum of Understanding (MoU),
            Purchase Order, or other written agreement executed between VVSPL and the concerned
            educational institution, constitute the entire agreement governing the use of EDDVA.
          </p>
          <p className="mt-4 text-gray-700 text-justify">
            In the event of any inconsistency between these Terms and any separately executed written
            agreement, the provisions of the executed agreement shall prevail to the extent of such
            inconsistency.
          </p>
            
          {/* 22. Contact Us */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">22. Contact Us</h2>
          <p className="mt-2 text-gray-700 text-justify">
            If you have any questions, concerns, or require assistance regarding these Terms &
            Conditions or the use of EDDVA, please contact:
          </p>
            
          <div className="mt-4 bg-gray-50 p-5 rounded-lg border border-gray-100 text-gray-700 space-y-1">
            <strong className="block text-gray-900 text-base mb-1">Veteran Ventures & Services Pvt. Ltd. (VVSPL)</strong>
            <p className="font-medium text-gray-800">EDDVA Support Team</p>
            <p>309-310, 3rd Floor, Odyssa Business Centre,</p>
            <p>Rasulgarh, Bhubaneswar – 751010, Odisha, India</p>
            <p className="pt-2">
              Email: <a className="font-semibold text-blue-600 hover:underline" href="mailto:support@eddva.in?subject=Terms%20enquiry">support@eddva.in</a>
            </p>
            <p>
              Website: <a className="font-semibold text-blue-600 hover:underline" href="https://www.eddva.in" target="_blank" rel="noopener noreferrer">https://www.eddva.in</a>
            </p>
          </div>
            
          <p className="mt-4 text-gray-700 text-justify text-sm italic">
            For implementation support, institutional partnerships, commercial enquiries, or technical
            assistance, you may contact VVSPL through the official contact details published on the
            EDDVA website.
          </p>

          <p className="mt-10 text-sm text-gray-500">
            Our{" "}
            <Link to="/privacy-policy" className="font-semibold text-blue-600 hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/cookie-policy" className="font-semibold text-blue-600 hover:underline">
              Cookie Policy
            </Link>{" "}
            describe how we handle personal data and cookies.
          </p>

          <p className="mt-6">
            <Link to="/" className="font-semibold text-blue-600 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </article>
    </LandingLayout>
  );
}
