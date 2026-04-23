import { LandingLayout } from "@/components/landing/LandingLayout";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "hello@eddva.com";

export default function CookiePolicyPage() {
  return (
    <LandingLayout>
      <article className="landing-shell max-w-3xl py-14 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Legal</p>
        <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Cookie Policy</h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: 22 April 2026</p>

        <div className="prose prose-gray mt-10 max-w-none text-[15px] leading-relaxed text-gray-700">
          <p>
            EDDVA (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar technologies on our website
            and learning platform. This Cookie Policy explains what they are, why we use them, and your choices.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">1. What are cookies?</h2>
          <p>
            Cookies are small text files placed on your device when you visit a site. They help the site work efficiently,
            remember preferences, and (where allowed) understand how the service is used. We also use similar technologies
            such as local storage for essential app functionality.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">2. How we use cookies</h2>
          <p>We use cookies and storage for the following purposes:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Strictly necessary:</strong> to keep you signed in, protect against fraud, load balanced requests,
              and save session security tokens (e.g. authentication and refresh handling).
            </li>
            <li>
              <strong>Preferences:</strong> to remember your choices such as language or UI settings when you opt in
              to saving them.
            </li>
            <li>
              <strong>Analytics and performance (if enabled):</strong> to understand traffic and improve the product.
              We only enable non-essential analytics in line with your consent where required.
            </li>
          </ul>

          <h2 className="mt-10 text-lg font-bold text-gray-900">3. Your choices</h2>
          <p>
            You can control cookies through your browser settings (e.g. block third-party cookies or delete existing cookies).
            Blocking strictly necessary cookies may affect login and core features. When we show a cookie notice on the site,
            you can accept or adjust non-essential categories as offered.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">4. Third parties</h2>
          <p>
            Some features may set cookies through trusted providers (e.g. hosting, video, or support chat), subject to
            their policies. We recommend reviewing your browser&apos;s help documentation for more control.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">5. Changes</h2>
          <p>
            We may update this Cookie Policy from time to time. The &quot;Last updated&quot; date at the top will change
            when we do. Continued use of the Services after changes means you accept the updated policy, except where
            the law requires additional steps.
          </p>

          <h2 className="mt-10 text-lg font-bold text-gray-900">6. Contact</h2>
          <p>
            Questions about this policy:{" "}
            <a className="font-semibold text-blue-600 hover:underline" href={`mailto:${CONTACT_EMAIL}?subject=Cookie%20policy`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>

          <p className="mt-8 text-sm text-gray-500">
            See also our{" "}
            <Link to="/privacy-policy" className="font-semibold text-blue-600 hover:underline">
              Privacy Policy
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
