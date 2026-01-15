"use client";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

const LAST_UPDATED = "January 15, 2025";

const tableOfContents = [
  { id: "introduction", title: "1. Introduction" },
  { id: "information-we-collect", title: "2. Information We Collect" },
  { id: "how-we-use-information", title: "3. How We Use Your Information" },
  { id: "information-sharing", title: "4. Information Sharing" },
  { id: "data-security", title: "5. Data Security" },
  { id: "your-rights", title: "6. Your Rights" },
  { id: "cookies", title: "7. Cookies and Tracking" },
  { id: "childrens-privacy", title: "8. Children's Privacy" },
  { id: "policy-changes", title: "9. Changes to This Policy" },
  { id: "contact", title: "10. Contact Information" },
];

export default function PrivacyPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-card dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-8 mb-6">
            <h1 className="text-3xl font-bold text-foreground dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              <strong>Last Updated:</strong> {LAST_UPDATED}
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="bg-white dark:bg-card rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
              Table of Contents
            </h2>
            <ul className="space-y-2">
              {tableOfContents.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className="text-primary hover:text-primary/80 hover:underline text-left transition-colors"
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <div className="bg-white dark:bg-card rounded-lg shadow-sm p-8 space-y-10">
            {/* Section 1: Introduction */}
            <section id="introduction" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                1. Introduction
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  Welcome to SteppersLife Events ("we," "our," or "us"). We are committed to protecting
                  your privacy and ensuring the security of your personal information. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your information when you use our
                  event ticketing platform and related services.
                </p>
                <p>
                  SteppersLife Events is an event ticketing and management platform that connects event
                  organizers with attendees, primarily serving the Chicago stepping and line dancing
                  communities. This policy applies to all users of our website, mobile applications,
                  and services, including event organizers, ticket purchasers, and general visitors.
                </p>
                <p>
                  By using our services, you agree to the collection and use of information in accordance
                  with this policy. If you do not agree with the terms of this privacy policy, please do
                  not access our platform.
                </p>
              </div>
            </section>

            {/* Section 2: Information We Collect */}
            <section id="information-we-collect" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  2.1 Account Information
                </h3>
                <p>When you create an account, we collect:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number (optional)</li>
                  <li>Profile picture (optional)</li>
                  <li>Account preferences and settings</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  2.2 Payment Information
                </h3>
                <p>When you purchase tickets or receive payouts as an organizer, we collect:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Billing name and address</li>
                  <li>Payment method details (processed securely by Stripe or PayPal)</li>
                  <li>Transaction history</li>
                  <li>Payout preferences and bank account information (for organizers)</li>
                </ul>
                <p className="text-sm italic">
                  Note: We do not store complete credit card numbers on our servers. All payment
                  information is processed and stored securely by our payment partners (Stripe and PayPal).
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  2.3 Event Information
                </h3>
                <p>For event organizers, we collect:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Event details (name, description, date, time, location)</li>
                  <li>Event images and promotional materials</li>
                  <li>Ticket pricing and availability</li>
                  <li>Attendee lists and check-in data</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  2.4 Usage Data
                </h3>
                <p>We automatically collect certain information when you use our platform:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device information (browser type, operating system, device type)</li>
                  <li>IP address and approximate location</li>
                  <li>Pages visited and features used</li>
                  <li>Time spent on the platform</li>
                  <li>Referral sources</li>
                  <li>Search queries within the platform</li>
                </ul>
              </div>
            </section>

            {/* Section 3: How We Use Your Information */}
            <section id="how-we-use-information" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  3.1 Service Delivery
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Process ticket purchases and refunds</li>
                  <li>Deliver electronic tickets and confirmations</li>
                  <li>Facilitate event check-in and attendance tracking</li>
                  <li>Process payouts to event organizers</li>
                  <li>Provide customer support</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  3.2 Communications
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Send order confirmations and receipts</li>
                  <li>Notify you of event updates or changes</li>
                  <li>Send event reminders</li>
                  <li>Respond to your inquiries and support requests</li>
                  <li>Send promotional communications (with your consent)</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  3.3 Analytics and Improvement
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Analyze usage patterns to improve our services</li>
                  <li>Develop new features and functionality</li>
                  <li>Monitor and prevent fraud</li>
                  <li>Ensure platform security and stability</li>
                  <li>Generate aggregated, anonymized reports for organizers</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  3.4 Legal and Safety
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Comply with legal obligations</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Protect against fraud and abuse</li>
                  <li>Respond to lawful requests from authorities</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Information Sharing */}
            <section id="information-sharing" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                4. Information Sharing
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  We do not sell your personal information to third parties. We may share your
                  information in the following circumstances:
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  4.1 Event Organizers
                </h3>
                <p>
                  When you purchase tickets, we share your name, email, and ticket information with
                  the event organizer to facilitate your attendance. Organizers may use this information
                  to communicate with you about the specific event.
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  4.2 Service Providers
                </h3>
                <p>We work with trusted third-party service providers who assist in operating our platform:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Stripe:</strong> Payment processing for credit/debit card transactions.
                    Stripe's privacy policy is available at{" "}
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      stripe.com/privacy
                    </a>
                  </li>
                  <li>
                    <strong>PayPal:</strong> Alternative payment processing and organizer payouts.
                    PayPal's privacy policy is available at{" "}
                    <a
                      href="https://www.paypal.com/us/legalhub/privacy-full"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      paypal.com/privacy
                    </a>
                  </li>
                  <li>
                    <strong>Cloudflare:</strong> Content delivery, security, and performance optimization.
                    Cloudflare's privacy policy is available at{" "}
                    <a
                      href="https://www.cloudflare.com/privacypolicy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      cloudflare.com/privacypolicy
                    </a>
                  </li>
                  <li>
                    <strong>Convex:</strong> Database and backend services for real-time data synchronization.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  4.3 Legal Requirements
                </h3>
                <p>
                  We may disclose your information if required by law, court order, or government
                  regulation, or if we believe disclosure is necessary to protect our rights, your
                  safety, or the safety of others.
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  4.4 Business Transfers
                </h3>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your information may be
                  transferred as part of that transaction. We will notify you of any such change in
                  ownership or control of your personal information.
                </p>
              </div>
            </section>

            {/* Section 5: Data Security */}
            <section id="data-security" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                5. Data Security
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  We implement industry-standard security measures to protect your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Encryption:</strong> All data transmitted between your device and our
                    servers is encrypted using TLS (Transport Layer Security) / SSL encryption.
                  </li>
                  <li>
                    <strong>Secure Storage:</strong> Personal data is stored in secure, encrypted
                    databases with restricted access controls.
                  </li>
                  <li>
                    <strong>Payment Security:</strong> Payment card data is handled exclusively by
                    PCI-DSS compliant payment processors (Stripe and PayPal). We never store complete
                    card numbers on our servers.
                  </li>
                  <li>
                    <strong>Access Controls:</strong> Employee access to personal data is limited to
                    those who require it for their job functions.
                  </li>
                  <li>
                    <strong>Regular Audits:</strong> We regularly review and update our security
                    practices to address new threats and vulnerabilities.
                  </li>
                </ul>
                <p>
                  While we strive to protect your information, no method of transmission over the
                  Internet or electronic storage is 100% secure. We cannot guarantee absolute security
                  but are committed to maintaining the highest practicable standards.
                </p>
              </div>
            </section>

            {/* Section 6: Your Rights */}
            <section id="your-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                6. Your Rights
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  Depending on your location, you may have certain rights regarding your personal
                  information. We honor these rights for all users regardless of location:
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  6.1 Right to Access
                </h3>
                <p>
                  You have the right to request a copy of the personal information we hold about you.
                  You can access much of this information directly through your account settings.
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  6.2 Right to Correction
                </h3>
                <p>
                  You can update or correct your personal information at any time through your account
                  settings or by contacting us.
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  6.3 Right to Deletion
                </h3>
                <p>
                  You may request deletion of your account and personal information. Please note that:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>We may retain certain information as required by law or for legitimate business purposes</li>
                  <li>Transaction records may be retained for accounting and legal compliance</li>
                  <li>Anonymized data may be retained for analytics purposes</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  6.4 Right to Data Portability
                </h3>
                <p>
                  You have the right to receive your personal data in a structured, commonly used,
                  and machine-readable format. Contact us to request an export of your data.
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  6.5 Right to Opt-Out
                </h3>
                <p>
                  You may opt out of promotional communications at any time by clicking the
                  "unsubscribe" link in our emails or adjusting your notification preferences in
                  your account settings.
                </p>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  6.6 California Residents (CCPA)
                </h3>
                <p>
                  If you are a California resident, you have additional rights under the California
                  Consumer Privacy Act (CCPA):
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Right to know what personal information is collected, used, shared, or sold</li>
                  <li>Right to delete personal information held by businesses</li>
                  <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                  <li>Right to non-discrimination for exercising your CCPA rights</li>
                </ul>
                <p>
                  To exercise any of these rights, please contact us at{" "}
                  <a href="mailto:privacy@stepperslife.com" className="text-primary hover:underline">
                    privacy@stepperslife.com
                  </a>
                </p>
              </div>
            </section>

            {/* Section 7: Cookies */}
            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                7. Cookies and Tracking
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  7.1 What We Use
                </h3>
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Keep you signed in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Understand how you use our platform</li>
                  <li>Improve our services and user experience</li>
                  <li>Provide security and prevent fraud</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  7.2 Types of Cookies
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Essential Cookies:</strong> Required for the platform to function properly
                    (authentication, security, basic functionality)
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand how visitors interact with
                    our platform to improve user experience
                  </li>
                  <li>
                    <strong>Preference Cookies:</strong> Remember your settings and preferences
                    (language, theme, etc.)
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground dark:text-white mt-6 mb-3">
                  7.3 Managing Cookies
                </h3>
                <p>
                  Most web browsers allow you to control cookies through their settings. You can:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete all or specific cookies</li>
                  <li>Block all or certain types of cookies</li>
                  <li>Set preferences for specific websites</li>
                </ul>
                <p>
                  Please note that disabling essential cookies may affect the functionality of our
                  platform and prevent you from using certain features.
                </p>
              </div>
            </section>

            {/* Section 8: Children's Privacy */}
            <section id="childrens-privacy" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                8. Children's Privacy
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  SteppersLife Events is not intended for children under the age of 13. We do not
                  knowingly collect personal information from children under 13 years of age.
                </p>
                <p>
                  If you are under 13, please do not use our services or provide any personal
                  information to us. If you are a parent or guardian and believe your child has
                  provided us with personal information, please contact us immediately at{" "}
                  <a href="mailto:privacy@stepperslife.com" className="text-primary hover:underline">
                    privacy@stepperslife.com
                  </a>
                  , and we will take steps to delete such information.
                </p>
                <p>
                  Users between 13 and 18 years of age may use our services only with the involvement
                  and consent of a parent or guardian.
                </p>
              </div>
            </section>

            {/* Section 9: Policy Changes */}
            <section id="policy-changes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                9. Changes to This Policy
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our
                  practices, technology, legal requirements, or other factors. When we make changes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    We will update the "Last Updated" date at the top of this policy
                  </li>
                  <li>
                    For significant changes, we will provide prominent notice on our platform or
                    send you an email notification
                  </li>
                  <li>
                    We encourage you to review this policy periodically to stay informed about how
                    we protect your information
                  </li>
                </ul>
                <p>
                  Your continued use of our services after any changes to this Privacy Policy
                  constitutes your acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Section 10: Contact Information */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
                10. Contact Information
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or
                  our data practices, please contact us:
                </p>
                <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-6 mt-4">
                  <p className="mb-2">
                    <strong>Email:</strong>{" "}
                    <a href="mailto:privacy@stepperslife.com" className="text-primary hover:underline">
                      privacy@stepperslife.com
                    </a>
                  </p>
                  <p className="mb-2">
                    <strong>General Support:</strong>{" "}
                    <a href="mailto:support@stepperslife.com" className="text-primary hover:underline">
                      support@stepperslife.com
                    </a>
                  </p>
                  <p className="mb-0">
                    <strong>Website:</strong>{" "}
                    <a
                      href="https://stepperslife.com"
                      className="text-primary hover:underline"
                    >
                      stepperslife.com
                    </a>
                  </p>
                </div>
                <p className="mt-6">
                  We will respond to your inquiry within 30 days. For data access or deletion
                  requests, we may need to verify your identity before processing your request.
                </p>
              </div>
            </section>

            {/* Back to Top */}
            <div className="pt-8 border-t border-border">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                Back to top
              </button>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
