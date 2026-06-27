import { Metadata } from 'next';
import Link from 'next/link';
import BrandLogo from '../../components/shared/BrandLogo';
import Footer from '../../components/shared/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | FamiLink',
  description: 'Terms of Service for FamiLink — the family tree collaboration platform.',
  openGraph: {
    title: 'Terms of Service | FamiLink',
    description: 'Terms of Service for FamiLink — the family tree collaboration platform.',
    url: 'https://familink-og.vercel.app/terms',
    siteName: 'FamiLink',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | FamiLink',
    description: 'Terms of Service for FamiLink — the family tree collaboration platform.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using FamiLink ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not access or use the Service. FamiLink reserves the right to update or modify these terms at any time without prior notice. Continued use of the Service after any changes constitutes acceptance of the new terms.',
  },
  {
    id: 'accounts',
    title: '2. User Accounts',
    content:
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during the registration process. You must notify us immediately of any unauthorized use of your account. FamiLink reserves the right to suspend or terminate accounts that violate these terms or engage in fraudulent or abusive activity.',
  },
  {
    id: 'acceptable-use',
    title: '3. Acceptable Use',
    content:
      'You agree to use the Service only for lawful purposes and in accordance with these terms. You may not use the Service to: (a) upload or share any content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable; (b) impersonate any person or entity or misrepresent your affiliation with any person or entity; (c) interfere with or disrupt the integrity or performance of the Service; (d) attempt to gain unauthorized access to the Service or its related systems or networks; (e) collect or harvest any personally identifiable information from other users without their consent.',
  },
  {
    id: 'subscriptions',
    title: '4. Subscriptions and Payments',
    content:
      'Certain features of the Service may require a paid subscription. Subscription fees, billing terms, and feature availability are described on our pricing page. All fees are non-refundable except as expressly stated in our refund policy. FamiLink reserves the right to change subscription fees upon thirty (30) days notice. If you fail to pay applicable fees, your access to paid features may be suspended or terminated.',
  },
  {
    id: 'intellectual-property',
    title: '5. Intellectual Property',
    content:
      'The Service and its original content, features, and functionality are owned by FamiLink and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of any content you submit, post, or display on or through the Service. By submitting content, you grant FamiLink a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content solely for the purpose of providing and improving the Service.',
  },
  {
    id: 'limitation-of-liability',
    title: '6. Limitation of Liability',
    content:
      'To the fullest extent permitted by applicable law, FamiLink shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service. This includes, without limitation, loss of data, loss of profits, or interruption of service. Our total liability for any claims under these terms shall not exceed the amount you have paid us in the twelve (12) months preceding the claim.',
  },
  {
    id: 'termination',
    title: '7. Termination',
    content:
      'FamiLink may terminate or suspend your account and access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may do so by contacting us or using the account settings. Provisions of these terms that by their nature should survive termination shall survive, including intellectual property provisions, disclaimers, and limitations of liability.',
  },
  {
    id: 'governing-law',
    title: '8. Governing Law',
    content:
      'These Terms of Service shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising under or relating to these terms shall be resolved exclusively in the state or federal courts located in San Francisco County, California.',
  },
  {
    id: 'contact',
    title: '9. Contact Information',
    content:
      'If you have any questions or concerns about these Terms of Service, please contact us at support@familink.app. We will make every effort to address your inquiry promptly.',
  },
];

export default function TermsPage() {
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

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-6">Last updated: June 25, 2026</p>

          <p className="mb-10 leading-relaxed text-muted-foreground">
            Please read these Terms of Service carefully before using the FamiLink
            platform. By using the Service, you agree to be bound by these terms.
          </p>

          <div className="rounded-xl border bg-card p-6 sm:p-8 space-y-10 shadow-sm">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="mb-3 text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer page="terms" />
    </>
  );
}
