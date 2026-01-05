"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  User,
  Mail,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function SettingsPage() {
  const updatePaymentSettings = useMutation(api.users.mutations.updatePaymentProcessorSettings);
  const connectStripe = useMutation(api.users.mutations.connectStripeAccount);
  const connectPaypal = useMutation(api.users.mutations.connectPaypalAccount);
  const disconnectProcessor = useMutation(api.users.mutations.disconnectPaymentProcessor);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processorToDisconnect, setProcessorToDisconnect] = useState<"stripe" | "paypal" | null>(null);
  const confirmDialog = useConfirmDialog();

  // Fetch user data from API instead of Convex
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleConnectStripe = async () => {
    try {
      setIsProcessing(true);

      // Create Stripe Connect account and get onboarding link
      const response = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create Stripe Connect account");
      }

      const data = await response.json();

      // Redirect to Stripe onboarding
      if (data.accountLinkUrl) {
        window.location.href = data.accountLinkUrl;
      } else {
        throw new Error("No onboarding link received");
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast.error("Failed to connect Stripe account. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectPaypal = async () => {
    try {
      setIsProcessing(true);
      // In production, this would redirect to PayPal OAuth flow
      toast.info("PayPal integration coming soon! You'll be redirected to complete PayPal setup.");
    } catch (error) {
      console.error("Error connecting PayPal:", error);
      toast.error("Failed to connect PayPal account");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectProcessor = async (processor: "stripe" | "paypal") => {
    setProcessorToDisconnect(processor);
    confirmDialog.showConfirm({
      title: `Disconnect ${processor === "stripe" ? "Stripe" : "PayPal"}?`,
      description: `Are you sure you want to disconnect your ${processor === "stripe" ? "Stripe" : "PayPal"} account? You will no longer be able to receive payments through this provider.`,
      confirmText: "Disconnect",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await disconnectProcessor({ processor });
          setProcessorToDisconnect(null);
          toast.success(`${processor === "stripe" ? "Stripe" : "PayPal"} disconnected successfully`);
        } catch (error) {
          console.error(`Error disconnecting ${processor}:`, error);
          toast.error(`Failed to disconnect ${processor}`);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleTogglePaymentMethod = async (
    method: "stripe" | "paypal" | "cash",
    enabled: boolean
  ) => {
    try {
      setIsProcessing(true);
      const updates: any = {};

      if (method === "stripe") updates.acceptsStripePayments = enabled;
      if (method === "paypal") updates.acceptsPaypalPayments = enabled;
      if (method === "cash") updates.acceptsCashPayments = enabled;

      await updatePaymentSettings(updates);
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast.error("Failed to update payment method");
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if still loading
  if (isLoading || !currentUser) {
    return <LoadingSpinner fullPage text="Loading settings..." />;
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Account Information */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input
                type="text"
                value={currentUser.name || ""}
                className="w-full px-4 py-3 border border-border rounded-lg bg-muted"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={currentUser.email}
                className="w-full px-4 py-3 border border-border rounded-lg bg-muted"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role</label>
              <div className="px-4 py-3 border border-border rounded-lg bg-muted">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                  {currentUser.role === "organizer"
                    ? "Event Organizer"
                    : currentUser.role || "User"}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Account settings are managed through your authentication provider.
            </p>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure how you receive ticket payments from customers
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Stripe Payment Processor */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Stripe Connect
                    {currentUser.stripeAccountSetupComplete && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accept credit card payments with automatic split payments
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Platform fee: 3.7% + $1.79 per ticket
                  </p>
                </div>
                {currentUser.stripeAccountSetupComplete && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentUser.acceptsStripePayments || false}
                      onChange={(e) => handleTogglePaymentMethod("stripe", e.target.checked)}
                      disabled={!currentUser.stripeAccountSetupComplete || isProcessing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                  </label>
                )}
              </div>

              {/* Connected and Complete */}
              {currentUser.stripeAccountSetupComplete && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-3 py-2 bg-success/10 border border-success rounded text-sm text-success">
                      ✓ Setup Complete - Ready to Accept Payments
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/organizer/onboarding/refresh"
                      className="px-3 py-2 text-sm text-primary hover:text-primary/90 hover:bg-primary/10 rounded border border-primary transition-colors"
                    >
                      Update Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDisconnectProcessor("stripe")}
                      disabled={isProcessing}
                      className="px-3 py-2 text-sm text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded border border-destructive transition-colors disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}

              {/* Connected but Incomplete */}
              {currentUser.stripeConnectedAccountId && !currentUser.stripeAccountSetupComplete && (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-warning/10 border border-warning rounded text-sm text-warning">
                    ⚠ Setup Incomplete - Additional Information Required
                  </div>
                  <Link
                    href="/organizer/onboarding/refresh"
                    className="w-full block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm text-center"
                  >
                    Complete Setup
                  </Link>
                </div>
              )}

              {/* Not Connected */}
              {!currentUser.stripeConnectedAccountId && (
                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                >
                  {isProcessing ? "Connecting..." : "Connect Stripe Account"}
                </button>
              )}
            </div>

            {/* PayPal Payment Processor */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    PayPal
                    {currentUser.paypalMerchantId && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accept PayPal payments from customers
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentUser.acceptsPaypalPayments || false}
                    onChange={(e) => handleTogglePaymentMethod("paypal", e.target.checked)}
                    disabled={!currentUser.paypalMerchantId || isProcessing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
              {currentUser.paypalMerchantId ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2 bg-success/10 border border-success rounded text-sm text-success">
                    Connected
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDisconnectProcessor("paypal")}
                    disabled={isProcessing}
                    className="px-3 py-2 text-sm text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded border border-destructive transition-colors disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectPaypal}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                >
                  Connect PayPal Account
                </button>
              )}
            </div>

            {/* Cash Payments */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Cash Payments</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accept cash payments in person (no online processing)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentUser.acceptsCashPayments || false}
                    onChange={(e) => handleTogglePaymentMethod("cash", e.target.checked)}
                    disabled={isProcessing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground mb-2">Credit Balance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your pre-purchased ticket credits for the PREPAY payment model
              </p>
              <div className="flex items-center gap-4">
                <div className="px-4 py-3 bg-accent border border-border rounded-lg">
                  <p className="text-sm text-primary">Available Credits</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Link href="/pricing" className="text-sm text-primary hover:underline">
                  Purchase Credits
                </Link>
              </div>
            </div>

            {/* Payout Methods */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground mb-2">Payout Methods</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage how you receive your earnings from ticket sales
              </p>
              <Link
                href="/organizer/settings/payment-methods"
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Manage Payout Methods</p>
                    <p className="text-sm text-muted-foreground">Add bank accounts, PayPal, or update defaults</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-semibold text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about your events and sales</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-semibold text-foreground">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">Get tips and news about SteppersLife</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <p className="text-sm text-muted-foreground">
              Note: Notification settings will be saved when we implement the backend.
            </p>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href="/privacy"
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">Privacy Policy</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/terms"
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">Terms of Service</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Help & Support
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href="/help"
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">Help Center</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
            <a
              href="mailto:support@stepperslife.com"
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">Contact Support</p>
                <p className="text-sm text-muted-foreground">support@stepperslife.com</p>
              </div>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>

      {/* Disconnect Payment Processor Confirmation */}
      <ConfirmDialog {...confirmDialog.props} />
    </div>
  );
}
