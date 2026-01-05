"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Wallet, CreditCard, Plus, Check, Building2, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentMethodsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const stripeAccount = useQuery(api.users.queries.getStripeConnectAccount);
  const paymentMethods = useQuery(api.organizerPaymentMethods.queries.getMyPaymentMethods);

  const isLoading = currentUser === undefined || stripeAccount === undefined || paymentMethods === undefined;

  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  // Check if Stripe is connected and has any payment methods
  const hasStripeConnected = stripeAccount?.stripeAccountSetupComplete || false;
  const hasPaymentMethods = paymentMethods && paymentMethods.length > 0;

  return (
    <div className="min-h-screen bg-card">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
              <p className="text-muted-foreground mt-1">Manage how you receive payouts</p>
            </div>
            {hasStripeConnected && (
              <button type="button" className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg">
                <Plus className="w-5 h-5" />
                Add Payment Method
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {hasStripeConnected || hasPaymentMethods ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Your Payment Methods</h2>
            <div className="space-y-4">
              {/* Stripe Connected Account */}
              {hasStripeConnected && (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-info/20 p-3 rounded-lg">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Stripe Connected Account</p>
                      <p className="text-sm text-muted-foreground">
                        {stripeAccount?.acceptsStripePayments ? "Accepting payments" : "Setup complete"}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-success/20 text-success text-sm font-medium rounded-full flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Connected
                  </span>
                </div>
              )}

              {/* Other Payment Methods */}
              {paymentMethods?.map((method) => (
                <div key={method._id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-info/20 p-3 rounded-lg">
                      {method.type === "bank_account" ? (
                        <Building2 className="w-6 h-6 text-primary" />
                      ) : method.type === "paypal" ? (
                        <DollarSign className="w-6 h-6 text-primary" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {method.nickname || (method.type === "bank_account" ? method.bankName : method.type === "paypal" ? "PayPal" : "Payment Method")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.type === "bank_account" && `****${method.accountNumberLast4}`}
                        {method.type === "paypal" && method.paypalEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${
                      method.status === "active"
                        ? "bg-success/20 text-success"
                        : method.status === "pending_verification"
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Check className="w-4 h-4" />
                      {method.status === "active" ? "Verified" : method.status === "pending_verification" ? "Pending" : method.status}
                    </span>
                  </div>
                </div>
              ))}

              {/* Empty state for no additional methods */}
              {!hasPaymentMethods && hasStripeConnected && (
                <p className="text-muted-foreground text-center py-4">
                  You can add additional payment methods like bank accounts or PayPal.
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">Connect Stripe to Get Paid</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Set up your Stripe account to receive payouts from ticket sales. It only takes a few minutes.
            </p>
            <Link
              href="/organizer/stripe-connect"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Connect Stripe Account
            </Link>

            <div className="mt-8 bg-info/10 border border-info/30 rounded-lg p-6 max-w-2xl mx-auto text-left">
              <h4 className="font-bold text-foreground mb-3">Why Stripe?</h4>
              <ul className="space-y-2 text-foreground text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Fast and secure payments processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Automatic weekly payouts to your bank account</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Real-time transaction tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Industry-leading fraud protection</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
