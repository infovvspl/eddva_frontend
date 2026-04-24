import { LandingLayout } from "@/components/landing/LandingLayout";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "hello@eddva.com";

export default function PrivacyPolicyPage() {
  return (
    <LandingLayout>
      <article className="landing-shell max-w-3xl py-14 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Legal</p>
        <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: 18 April 2026</p>

        <div className="prose prose-gray mt-10 max-w-none text-[15px] leading-relaxed text-gray-700">
          <p>
            EDDVA (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the EDDVA learning platform, including our website,
            mobile applications, and related services (collectively, the &quot;Services&quot;). This Privacy Policy explains how we collect,
            use, disclose, and safeguard information when you use the Services.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">1. Who this applies to</h2>
          <p>
            This policy applies to visitors, registered students, teachers, institute administrators, and other users who access or use
            the Services on behalf of themselves or an educational institution.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">2. Information we collect</h2>
          <p>We may collect the following categories of information, depending on how you use the Services:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Account and profile data:</strong> name, email address, phone number, password (stored in hashed form), role
              (e.g. student, teacher), institute or batch associations, and profile preferences you choose to provide.
            </li>
            <li>
              <strong>Learning activity:</strong> course progress, lecture views, quiz and assessment results, doubt questions you submit,
              attendance in live classes, and similar usage data generated through the platform.
            </li>
            <li>
              <strong>Content you upload:</strong> files, images, or text you submit for assignments, doubts, or institute-managed content,
              where applicable.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, device type, browser type, approximate location derived from IP, log timestamps,
              and diagnostic data used to secure and improve the Services.
            </li>
            <li>
              <strong>Communications:</strong> messages you send to us (e.g. support requests) and optional marketing preferences where
              permitted by law.
            </li>
          </ul>

          <h2 className="mt-10 text-lg font-bold text-gray-900">3. How we use information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Provide, operate, and improve the Services, including personalization and adaptive learning features;</li>
            <li>Authenticate users, prevent fraud and abuse, and maintain the security of the platform;</li>
            <li>Communicate with you about your account, updates, and (where you have opted in) marketing;</li>
            <li>Comply with legal obligations and enforce our terms; and</li>
            <li>Analyse aggregated or de-identified usage to improve product experience.</li>
          </ul>

          <h2 className="mt-10 text-lg font-bold text-gray-900">4. Sharing of information</h2>
          <p>
            We do not sell your personal information. We may share information with: (a) the educational institute or batch you are
            enrolled with, as needed for teaching and administration; (b) service providers who assist us with hosting, analytics,
            email delivery, or security, under appropriate contracts; (c) professional advisers where required; and (d) authorities when
            required by law or to protect rights and safety.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">5. Data retention</h2>
          <p>
            We retain information for as long as your account is active or as needed to provide the Services, comply with legal
            obligations, resolve disputes, and enforce our agreements. Retention periods may vary by data type and institute configuration.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">6. Security</h2>
          <p>
            We implement technical and organisational measures designed to protect personal information. No method of transmission over
            the Internet is completely secure; we encourage you to use strong passwords and protect your credentials.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">7. Your choices and rights</h2>
          <p>
            Depending on applicable law, you may have the right to access, correct, delete, or export certain personal data, or to object
            to or restrict certain processing. To exercise these rights, contact us at the email below. You may opt out of marketing
            communications at any time using the unsubscribe link in those messages.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">8. Children&apos;s privacy</h2>
          <p>
            Our Services may be used by students under 18 with the involvement of a parent, guardian, or educational institute. We do not
            knowingly collect personal information from children without appropriate authority. If you believe we have collected information
            improperly, please contact us.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">9. International transfers</h2>
          <p>
            Your information may be processed in India and in other countries where we or our subprocessors operate, subject to appropriate
            safeguards as required by law.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">10. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the &quot;Last
            updated&quot; date. Material changes may be communicated through the Services or by email where appropriate.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">11. Contact</h2>
          <p>
            For privacy-related questions or requests, contact us at{" "}
            <a className="font-semibold text-blue-600 hover:underline" href={`mailto:${CONTACT_EMAIL}?subject=Privacy%20enquiry`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>

          <p className="mt-8 text-sm text-gray-500">
            See also our{" "}
            <Link to="/cookie-policy" className="font-semibold text-blue-600 hover:underline">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link to="/terms" className="font-semibold text-blue-600 hover:underline">
              Terms of Service
            </Link>
            .
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
