import { Metadata } from 'next';
import Link from 'next/link';
import BrandLogo from '../../components/shared/BrandLogo';
import Footer from '../../components/shared/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'FamiLink Privacy Policy — Learn how we collect, use, and protect your personal data.',
};

export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 relative">
          <Link href="/" className="absolute -left-18 top-16 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <BrandLogo />
            <span className="text-lg font-bold tracking-tight text-foreground">FamiLink</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: June 25, 2026</p>

          <div className="rounded-xl border bg-card p-6 sm:p-8 space-y-8 text-foreground/85 leading-relaxed shadow-sm">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p className="mt-2">
                FamiLink (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit
                our website <a href="https://familink-og.vercel.app" className="text-primary underline underline-offset-2 hover:opacity-80">https://familink-og.vercel.app</a>
                and use our family-tree application.
              </p>
              <p className="mt-2">
                By using FamiLink, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
              <h3 className="mt-3 font-medium text-foreground">Personal Data</h3>
              <p className="mt-1">
                We may ask you to provide certain personally identifiable information that can be used to contact or
                identify you. This includes, but is not limited to:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Email address</li>
                <li>Full name</li>
                <li>Profile photo (optional)</li>
                <li>Family tree data you voluntarily submit (names, relationships, dates, memories)</li>
              </ul>

              <h3 className="mt-4 font-medium text-foreground">Usage Data</h3>
              <p className="mt-1">
                We collect information automatically when you access the Service, including your IP address, browser type,
                operating system, referral URLs, and pages visited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="mt-2">We use the collected data for the following purposes:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve the Service</li>
                <li>To monitor usage and detect technical issues</li>
                <li>To send you tree-related notifications and invitations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Cookies and Tracking Technologies</h2>
              <p className="mt-2">
                We use cookies and similar tracking technologies to track activity on our Service and hold certain
                information. Cookies are small data files placed on your device. You can instruct your browser to refuse
                all cookies or to indicate when a cookie is being sent.
              </p>
              <p className="mt-2">
                We use session cookies to authenticate you and remember your preferences, and persistent cookies to
                improve your experience. Third-party services we rely on may also use cookies as described in their
                respective privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Third-Party Services</h2>
              <p className="mt-2">FamiLink integrates with the following third-party service providers:</p>

              <h3 className="mt-4 font-medium text-foreground">Supabase</h3>
              <p className="mt-1">
                We use Supabase for authentication, database management, and real-time features. Your email address and
                hashed credentials are stored securely on Supabase&rsquo;s infrastructure. Supabase is SOC 2 compliant and
                processes data in accordance with their privacy policy.
              </p>

              <h3 className="mt-4 font-medium text-foreground">Neo4j (AuraDB)</h3>
              <p className="mt-1">
                Family tree relationship data is stored in a Neo4j graph database via AuraDB. This includes the people,
                relationships, and metadata you add to your trees. Neo4j AuraDB is GDPR-compliant and encrypts data at
                rest and in transit.
              </p>

              <h3 className="mt-4 font-medium text-foreground">Stripe</h3>
              <p className="mt-1">
                If you subscribe to a paid plan, payment processing is handled entirely by Stripe. We do not store
                credit card numbers or bank details on our servers. Stripe is a PCI-DSS compliant payment processor.
                Your payment data is governed by Stripe&rsquo;s privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
              <p className="mt-2">
                We retain your personal data only for as long as necessary to fulfill the purposes described in this
                Privacy Policy. When you delete your account, we delete or anonymize your personal data within 30 days,
                unless a longer retention period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Data Security</h2>
              <p className="mt-2">
                We implement appropriate technical and organizational measures to protect your personal data. All data
                transmitted between your browser and our servers is encrypted using TLS. Access to production data is
                restricted to authorized personnel only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Your Rights (GDPR)</h2>
              <p className="mt-2">
                If you are a resident of the European Economic Area (EEA), you have the following data protection rights:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><strong>Right to access</strong> — Request copies of your personal data.</li>
                <li><strong>Right to rectification</strong> — Request correction of inaccurate data.</li>
                <li><strong>Right to erasure</strong> — Request deletion of your personal data.</li>
                <li><strong>Right to restrict processing</strong> — Request limitation of data processing.</li>
                <li><strong>Right to data portability</strong> — Request transfer of your data to another service.</li>
                <li><strong>Right to object</strong> — Object to our processing of your personal data.</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please contact us at the email address below. We will respond within
                30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">9. Your Rights (CCPA)</h2>
              <p className="mt-2">
                If you are a California resident, you have the following rights under the California Consumer Privacy Act:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><strong>Right to know</strong> — Request disclosure of categories and specific pieces of personal
                  information we have collected.</li>
                <li><strong>Right to delete</strong> — Request deletion of personal information we have collected.</li>
                <li><strong>Right to opt-out</strong> — Opt out of the sale of your personal information. FamiLink does
                  not sell personal information.</li>
                <li><strong>Right to non-discrimination</strong> — We will not discriminate against you for exercising
                  your CCPA rights.</li>
              </ul>
              <p className="mt-2">
                To exercise your CCPA rights, please contact us at the email below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">10. Children&rsquo;s Privacy</h2>
              <p className="mt-2">
                Our Service is not intended for children under the age of 13. We do not knowingly collect personally
                identifiable information from children under 13. If we become aware that a child has provided us with
                personal data, we will take steps to delete that information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">11. Changes to This Privacy Policy</h2>
              <p className="mt-2">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date. You are advised to review
                this policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
              <p className="mt-2">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <p className="mt-2">
                <strong>FamiLink</strong><br />
                Email: <a href="mailto:privacy@familink.app" className="text-primary underline underline-offset-2 hover:opacity-80">privacy@familink.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer page="privacy" />
    </>
  );
}
