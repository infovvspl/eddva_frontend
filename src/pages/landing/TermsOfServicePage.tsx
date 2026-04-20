import { LandingLayout } from "@/components/landing/LandingLayout";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "hello@eddva.com";

export default function TermsOfServicePage() {
  return (
    <LandingLayout>
      <article className="landing-shell max-w-3xl py-14 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Legal</p>
        <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: 18 April 2026</p>

        <div className="prose prose-gray mt-10 max-w-none text-[15px] leading-relaxed text-gray-700">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the EDDVA platform, website, mobile applications,
            and related services (the &quot;Services&quot;) provided by EDDVA. By creating an account, accessing, or using the Services,
            you agree to these Terms.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">1. Eligibility and accounts</h2>
          <p>
            You must provide accurate registration information and keep your credentials confidential. You are responsible for all
            activity under your account. If you use the Services on behalf of an institute, you confirm you are authorised to bind that
            organisation where applicable.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">2. The Services</h2>
          <p>
            EDDVA provides online educational tools, including but not limited to recorded and live learning content, assessments,
            doubt resolution features, and analytics, as made available to your role (student, teacher, institute administrator, etc.).
            We may modify, suspend, or discontinue features with reasonable notice where practicable.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Violate applicable laws or third-party rights;</li>
            <li>Attempt to gain unauthorised access to the Services, other accounts, or underlying systems;</li>
            <li>Upload malware, scrape the Services in bulk without permission, or interfere with security or performance;</li>
            <li>Use the Services to harass, abuse, or distribute unlawful or harmful content; or</li>
            <li>Resell or redistribute platform content outside the permissions granted by your institute or these Terms.</li>
          </ul>

          <h2 className="mt-10 text-lg font-bold text-gray-900">4. Intellectual property</h2>
          <p>
            EDDVA and its licensors own the Services, branding, software, and default platform content, subject to agreements with
            institutes. Your institute or instructors may own or license course materials; you receive only the rights necessary to access
            those materials for personal learning during your enrolment unless otherwise agreed.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">5. Third-party services</h2>
          <p>
            The Services may integrate third-party tools (e.g. video, analytics, or communication providers). Your use of those features
            may be subject to additional terms from those providers.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">6. Disclaimers</h2>
          <p>
            The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis to the fullest extent permitted by law.
            We do not guarantee uninterrupted or error-free operation, or specific academic outcomes. Educational results depend on many
            factors outside our control.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law, EDDVA and its affiliates will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from your use of the Services.
            Our aggregate liability for direct damages arising out of these Terms or the Services is limited to the greater of the fees
            you paid us in the twelve (12) months preceding the claim or INR 5,000, except where liability cannot be limited by law.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">8. Indemnity</h2>
          <p>
            You will defend and indemnify EDDVA against claims arising from your misuse of the Services, your content, or your violation of
            these Terms, to the extent permitted by law.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">9. Suspension and termination</h2>
          <p>
            We may suspend or terminate access for breach of these Terms, legal requirements, or risk to the platform. You may stop using
            the Services at any time; institute administrators may request deactivation of accounts in line with institute agreements.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">10. Governing law</h2>
          <p>
            These Terms are governed by the laws of India. Courts at Bengaluru, Karnataka shall have exclusive jurisdiction, subject to
            any mandatory consumer protections that apply to you.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">11. Contact</h2>
          <p>
            Questions about these Terms:{" "}
            <a className="font-semibold text-blue-600 hover:underline" href={`mailto:${CONTACT_EMAIL}?subject=Terms%20enquiry`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>

          <p className="mt-10 text-sm text-gray-500">
            Our{" "}
            <Link to="/privacy-policy" className="font-semibold text-blue-600 hover:underline">
              Privacy Policy
            </Link>{" "}
            explains how we handle personal data.
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
