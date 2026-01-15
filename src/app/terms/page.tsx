"use client";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Link from "next/link";

export default function TermsPage() {
  const lastUpdated = "January 15, 2025";

  const sections = [
    { id: "acceptance", title: "Acceptance of Terms" },
    { id: "description", title: "Description of Service" },
    { id: "user-accounts", title: "User Accounts" },
    { id: "organizer-terms", title: "Event Organizer Terms" },
    { id: "ticket-purchases", title: "Ticket Purchases" },
    { id: "prohibited-activities", title: "Prohibited Activities" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "limitation-liability", title: "Limitation of Liability" },
    { id: "indemnification", title: "Indemnification" },
    { id: "dispute-resolution", title: "Dispute Resolution" },
    { id: "termination", title: "Termination" },
    { id: "governing-law", title: "Governing Law" },
    { id: "changes", title: "Changes to Terms" },
    { id: "contact", title: "Contact Information" },
  ];

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-card dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-card rounded-lg shadow-sm p-6 sm:p-8">
          {/* Header */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-8 pb-4 border-b border-border">
            <strong>Last Updated:</strong> {lastUpdated}
          </p>

          {/* Table of Contents */}
          <nav className="mb-10 p-4 sm:p-6 bg-muted/50 dark:bg-muted/20 rounded-lg">
            <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
              Table of Contents
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Introduction */}
          <div className="prose prose-sm sm:prose dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground dark:text-muted-foreground leading-relaxed">
              Welcome to SteppersLife Events. These Terms of Service (&quot;Terms&quot;) govern your
              access to and use of the SteppersLife Events platform, including our website, mobile
              applications, and related services (collectively, the &quot;Service&quot;). Please read
              these Terms carefully before using our Service.
            </p>

            {/* Section 1: Acceptance of Terms */}
            <section id="acceptance" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">1.</span> Acceptance of Terms
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  By accessing or using the SteppersLife Events Service, you agree to be bound by
                  these Terms and our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  . If you do not agree to these Terms, you may not access or use the Service.
                </p>
                <p>
                  You must be at least 18 years of age to create an account and use the Service. By
                  using the Service, you represent and warrant that you are at least 18 years old
                  and have the legal capacity to enter into these Terms.
                </p>
                <p>
                  If you are using the Service on behalf of an organization, you represent and
                  warrant that you have the authority to bind that organization to these Terms.
                </p>
              </div>
            </section>

            {/* Section 2: Description of Service */}
            <section id="description" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">2.</span> Description of Service
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  SteppersLife Events is an event ticketing and management platform that connects
                  event organizers with attendees. Our Service enables:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Event organizers to create, manage, and promote events</li>
                  <li>Attendees to discover, purchase tickets, and attend events</li>
                  <li>Secure payment processing for ticket transactions</li>
                  <li>Digital ticket delivery and event check-in</li>
                  <li>Communication tools between organizers and attendees</li>
                  <li>Event analytics and reporting for organizers</li>
                </ul>
                <p>
                  We act as an intermediary platform and do not organize or produce events
                  ourselves. Event organizers are solely responsible for their events, including
                  event content, accuracy of information, and fulfillment of their obligations to
                  attendees.
                </p>
              </div>
            </section>

            {/* Section 3: User Accounts */}
            <section id="user-accounts" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">3.</span> User Accounts
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  3.1 Account Registration
                </h3>
                <p>
                  To access certain features of the Service, you must create an account. When
                  registering, you agree to provide accurate, current, and complete information.
                  You are responsible for maintaining the accuracy of your account information.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  3.2 Account Security
                </h3>
                <p>
                  You are responsible for maintaining the confidentiality of your account
                  credentials and for all activities that occur under your account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create a strong, unique password</li>
                  <li>Not share your account credentials with others</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Log out from your account at the end of each session</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  3.3 Account Types
                </h3>
                <p>
                  Our platform supports different account types including attendee accounts and
                  event organizer accounts. Each account type has specific features, capabilities,
                  and responsibilities as outlined in these Terms.
                </p>
              </div>
            </section>

            {/* Section 4: Event Organizer Terms */}
            <section id="organizer-terms" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">4.</span> Event Organizer Terms
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  4.1 Organizer Obligations
                </h3>
                <p>As an event organizer on our platform, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete event information</li>
                  <li>Honor all tickets sold through our platform</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Obtain necessary permits, licenses, and insurance</li>
                  <li>Ensure venue safety and compliance with local regulations</li>
                  <li>Communicate any event changes promptly to ticket holders</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  4.2 Refund Policies
                </h3>
                <p>
                  Event organizers are required to establish and clearly communicate their refund
                  policy for each event. Organizers must honor their stated refund policy.
                  SteppersLife Events may facilitate refunds on behalf of organizers but is not
                  responsible for refund decisions made by organizers.
                </p>
                <p>
                  In cases of event cancellation, organizers must provide full refunds to all
                  ticket purchasers within 30 days of the cancellation announcement.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  4.3 Payment and Fees
                </h3>
                <p>
                  Organizers agree to pay applicable platform fees and payment processing fees as
                  outlined in our fee schedule. Payouts to organizers are processed according to
                  our payout schedule, typically within 5-7 business days after the event date.
                </p>
              </div>
            </section>

            {/* Section 5: Ticket Purchases */}
            <section id="ticket-purchases" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">5.</span> Ticket Purchases
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  5.1 Payment Processing
                </h3>
                <p>
                  All ticket purchases are processed through our secure payment system. We accept
                  major credit cards, debit cards, and other payment methods as indicated during
                  checkout. All prices are displayed in US dollars unless otherwise specified.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  5.2 Ticket Delivery
                </h3>
                <p>
                  Upon successful purchase, tickets are delivered electronically to the email
                  address associated with your account. Tickets may also be accessed through your
                  account dashboard. You are responsible for ensuring your email address is correct
                  and checking your spam folder for ticket delivery.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  5.3 Ticket Restrictions
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tickets are non-transferable unless the event organizer permits transfers</li>
                  <li>Each ticket is valid for single admission only</li>
                  <li>Duplicate or counterfeit tickets will be voided</li>
                  <li>
                    Resale of tickets may be prohibited or restricted by event organizers
                  </li>
                  <li>Tickets purchased in violation of these Terms may be cancelled without refund</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  5.4 Refunds and Cancellations
                </h3>
                <p>
                  Refund eligibility is determined by the event organizer&apos;s refund policy.
                  SteppersLife Events does not guarantee refunds for any ticket purchases. In the
                  event of a cancelled event, refunds will be processed according to the
                  organizer&apos;s cancellation policy.
                </p>
              </div>
            </section>

            {/* Section 6: Prohibited Activities */}
            <section id="prohibited-activities" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">6.</span> Prohibited Activities
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>You agree not to engage in any of the following prohibited activities:</p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  6.1 Fraudulent Activity
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Creating fake events or fraudulent listings</li>
                  <li>Using stolen payment information</li>
                  <li>Chargebacks for legitimate purchases</li>
                  <li>Identity theft or impersonation</li>
                  <li>Misrepresenting event details or ticket availability</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  6.2 Ticket Scalping and Abuse
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Unauthorized resale of tickets at inflated prices</li>
                  <li>Using bots or automated systems to purchase tickets</li>
                  <li>Circumventing ticket purchase limits</li>
                  <li>Creating counterfeit or duplicate tickets</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  6.3 Platform Abuse
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Attempting to hack, disrupt, or compromise our systems</li>
                  <li>Scraping or harvesting data from our platform</li>
                  <li>Interfering with other users&apos; access to the Service</li>
                  <li>Posting spam, malware, or malicious content</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </div>
            </section>

            {/* Section 7: Intellectual Property */}
            <section id="intellectual-property" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">7.</span> Intellectual Property
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  7.1 Platform Ownership
                </h3>
                <p>
                  The Service, including all content, features, and functionality, is owned by
                  SteppersLife Events and is protected by copyright, trademark, and other
                  intellectual property laws. Our trademarks, logos, and service marks may not be
                  used without our prior written consent.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  7.2 User Content
                </h3>
                <p>
                  You retain ownership of content you submit to the Service (&quot;User Content&quot;).
                  By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free
                  license to use, reproduce, modify, and display your User Content in connection
                  with operating and promoting the Service.
                </p>
                <p>
                  You represent and warrant that you own or have the necessary rights to your User
                  Content and that it does not infringe any third-party rights.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  7.3 DMCA Compliance
                </h3>
                <p>
                  We respect intellectual property rights and will respond to notices of alleged
                  copyright infringement in accordance with the Digital Millennium Copyright Act
                  (DMCA). Please contact us at legal@stepperslife.com to report any copyright
                  concerns.
                </p>
              </div>
            </section>

            {/* Section 8: Limitation of Liability */}
            <section id="limitation-liability" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">8.</span> Limitation of Liability
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  8.1 Service Disclaimers
                </h3>
                <p className="uppercase text-sm">
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                  WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                  IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                  NON-INFRINGEMENT.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  8.2 Event Disclaimers
                </h3>
                <p>
                  SteppersLife Events is not responsible for the actions of event organizers or the
                  quality, safety, or legality of events listed on our platform. We do not
                  guarantee that events will occur as scheduled or that organizers will fulfill
                  their obligations.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  8.3 Limitation of Damages
                </h3>
                <p className="uppercase text-sm">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, STEPPERSLIFE EVENTS SHALL NOT BE LIABLE
                  FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                  INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF YOUR USE OF THE
                  SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE
                  TWELVE MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </section>

            {/* Section 9: Indemnification */}
            <section id="indemnification" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">9.</span> Indemnification
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  You agree to indemnify, defend, and hold harmless SteppersLife Events, its
                  affiliates, officers, directors, employees, and agents from and against any
                  claims, liabilities, damages, losses, and expenses, including reasonable
                  attorneys&apos; fees, arising out of or in any way connected with:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your access to or use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Your User Content</li>
                  <li>Any event you organize through our platform</li>
                </ul>
              </div>
            </section>

            {/* Section 10: Dispute Resolution */}
            <section id="dispute-resolution" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">10.</span> Dispute Resolution
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  10.1 Informal Resolution
                </h3>
                <p>
                  Before filing any formal dispute, you agree to first contact us at
                  legal@stepperslife.com to attempt to resolve the dispute informally. We will
                  attempt to resolve the dispute within 30 days of receiving your notice.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  10.2 Binding Arbitration
                </h3>
                <p>
                  If we cannot resolve the dispute informally, you and SteppersLife Events agree to
                  resolve any disputes through binding arbitration administered by the American
                  Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration
                  will take place in the state of your residence or, at your option, online.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  10.3 Class Action Waiver
                </h3>
                <p className="uppercase text-sm">
                  YOU AND STEPPERSLIFE EVENTS AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER
                  ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN
                  ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  10.4 Exceptions
                </h3>
                <p>
                  Either party may seek injunctive relief in any court of competent jurisdiction
                  for intellectual property infringement or unauthorized access to the Service.
                  Small claims court actions are also permitted.
                </p>
              </div>
            </section>

            {/* Section 11: Termination */}
            <section id="termination" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">11.</span> Termination
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  11.1 Termination by You
                </h3>
                <p>
                  You may terminate your account at any time by contacting us or using the account
                  deletion feature in your account settings. Upon termination, your right to use
                  the Service will immediately cease.
                </p>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  11.2 Termination by Us
                </h3>
                <p>
                  We may suspend or terminate your account and access to the Service at any time,
                  with or without cause, and with or without notice. Reasons for termination may
                  include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or illegal activity</li>
                  <li>Conduct harmful to other users or the platform</li>
                  <li>Extended periods of inactivity</li>
                  <li>Request from law enforcement or government agency</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  11.3 Effect of Termination
                </h3>
                <p>
                  Upon termination, all licenses and rights granted to you will terminate. We may
                  retain your information as required by law or for legitimate business purposes.
                  Sections of these Terms that by their nature should survive termination will
                  continue to apply.
                </p>
              </div>
            </section>

            {/* Section 12: Governing Law */}
            <section id="governing-law" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">12.</span> Governing Law
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the
                  State of Illinois, United States, without regard to its conflict of law
                  provisions.
                </p>
                <p>
                  For any disputes not subject to arbitration, you and SteppersLife Events agree to
                  submit to the personal and exclusive jurisdiction of the state and federal courts
                  located in Cook County, Illinois.
                </p>
              </div>
            </section>

            {/* Section 13: Changes to Terms */}
            <section id="changes" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">13.</span> Changes to Terms
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  We reserve the right to modify these Terms at any time. When we make material
                  changes, we will notify you by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Posting the updated Terms on our website</li>
                  <li>Updating the &quot;Last Updated&quot; date at the top of this page</li>
                  <li>Sending an email notification to registered users (for significant changes)</li>
                </ul>
                <p>
                  Your continued use of the Service after the effective date of any changes
                  constitutes your acceptance of the revised Terms. If you do not agree to the
                  changes, you must stop using the Service and terminate your account.
                </p>
              </div>
            </section>

            {/* Section 14: Contact Information */}
            <section id="contact" className="scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-4 flex items-baseline gap-2">
                <span className="text-primary">14.</span> Contact Information
              </h2>
              <div className="text-muted-foreground dark:text-muted-foreground space-y-4">
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-lg space-y-2">
                  <p>
                    <strong className="text-foreground dark:text-white">SteppersLife Events</strong>
                  </p>
                  <p>
                    <strong>General Inquiries:</strong>{" "}
                    <a
                      href="mailto:support@stepperslife.com"
                      className="text-primary hover:underline"
                    >
                      support@stepperslife.com
                    </a>
                  </p>
                  <p>
                    <strong>Legal Matters:</strong>{" "}
                    <a
                      href="mailto:legal@stepperslife.com"
                      className="text-primary hover:underline"
                    >
                      legal@stepperslife.com
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Related Policies */}
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                Related Policies
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  {" "}&mdash; How we collect, use, and protect your information
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
