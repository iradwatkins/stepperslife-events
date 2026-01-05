"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Plus,
  Star,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentMethodType = "bank_account" | "paypal" | "stripe_connect";

export default function PaymentMethodsPage() {
  const paymentMethods = useQuery(
    api.organizerPaymentMethods.queries.getMyPaymentMethods
  );
  const addBankAccount = useMutation(
    api.organizerPaymentMethods.mutations.addBankAccount
  );
  const addPayPal = useMutation(
    api.organizerPaymentMethods.mutations.addPayPal
  );
  const setAsDefault = useMutation(
    api.organizerPaymentMethods.mutations.setAsDefault
  );
  const removePaymentMethod = useMutation(
    api.organizerPaymentMethods.mutations.removePaymentMethod
  );
  const updateNickname = useMutation(
    api.organizerPaymentMethods.mutations.updateNickname
  );

  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [addMethodType, setAddMethodType] = useState<PaymentMethodType | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<Id<"organizerPaymentMethods"> | null>(null);
  const [editingNickname, setEditingNickname] = useState<{
    id: Id<"organizerPaymentMethods">;
    nickname: string;
  } | null>(null);

  // Bank account form state
  const [bankForm, setBankForm] = useState({
    nickname: "",
    bankName: "",
    accountType: "checking" as "checking" | "savings",
    accountHolderName: "",
    routingNumber: "",
    accountNumber: "",
    confirmAccountNumber: "",
    setAsDefault: true,
  });

  // PayPal form state
  const [paypalForm, setPaypalForm] = useState({
    nickname: "",
    paypalEmail: "",
    confirmEmail: "",
    setAsDefault: true,
  });

  const resetForms = () => {
    setBankForm({
      nickname: "",
      bankName: "",
      accountType: "checking",
      accountHolderName: "",
      routingNumber: "",
      accountNumber: "",
      confirmAccountNumber: "",
      setAsDefault: true,
    });
    setPaypalForm({
      nickname: "",
      paypalEmail: "",
      confirmEmail: "",
      setAsDefault: true,
    });
    setAddMethodType(null);
    setIsAddingMethod(false);
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      toast.error("Account numbers do not match");
      return;
    }

    if (bankForm.routingNumber.length !== 9) {
      toast.error("Routing number must be 9 digits");
      return;
    }

    setIsSubmitting(true);
    try {
      await addBankAccount({
        nickname: bankForm.nickname || undefined,
        bankName: bankForm.bankName,
        accountType: bankForm.accountType,
        accountHolderName: bankForm.accountHolderName,
        routingNumber: bankForm.routingNumber,
        accountNumber: bankForm.accountNumber,
        setAsDefault: bankForm.setAsDefault,
      });
      toast.success("Bank account added successfully");
      resetForms();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add bank account";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayPal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paypalForm.paypalEmail !== paypalForm.confirmEmail) {
      toast.error("Email addresses do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayPal({
        nickname: paypalForm.nickname || undefined,
        paypalEmail: paypalForm.paypalEmail,
        setAsDefault: paypalForm.setAsDefault,
      });
      toast.success("PayPal account added successfully");
      resetForms();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add PayPal account";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: Id<"organizerPaymentMethods">) => {
    try {
      await setAsDefault({ paymentMethodId: id });
      toast.success("Default payment method updated");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update default";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: Id<"organizerPaymentMethods">) => {
    try {
      await removePaymentMethod({ paymentMethodId: id });
      toast.success("Payment method removed");
      setDeleteConfirmId(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove payment method";
      toast.error(errorMessage);
    }
  };

  const handleUpdateNickname = async () => {
    if (!editingNickname) return;
    try {
      await updateNickname({
        paymentMethodId: editingNickname.id,
        nickname: editingNickname.nickname,
      });
      toast.success("Nickname updated");
      setEditingNickname(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update nickname";
      toast.error(errorMessage);
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (local.length <= 3) return `***@${domain}`;
    return `${local.substring(0, 3)}***@${domain}`;
  };

  const getPaymentMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case "bank_account":
        return <Building2 className="w-5 h-5" />;
      case "paypal":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.1 5.053-2.14 7.93-6.876 7.93h-2.163c-.524 0-.968.382-1.05.9l-1.425 9.04a.641.641 0 0 0 .633.74h4.116c.457 0 .844-.333.916-.784l.038-.196.728-4.608.047-.253a.92.92 0 0 1 .915-.784h.575c3.731 0 6.65-1.515 7.504-5.897.357-1.831.172-3.36-.351-4.547z" />
          </svg>
        );
      case "stripe_connect":
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending_verification":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  if (paymentMethods === undefined) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/organizer/settings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Payout Methods</h1>
              <p className="text-muted-foreground">
                Manage how you receive your earnings
              </p>
            </div>
          </div>
          <Button onClick={() => setIsAddingMethod(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </div>

        {/* Payment Methods List */}
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payout Methods</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add a bank account or PayPal to receive your earnings
              </p>
              <Button onClick={() => setIsAddingMethod(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <Card
                key={method._id}
                className={method.isDefault ? "border-primary" : ""}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        {getPaymentMethodIcon(method.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {method.nickname ||
                              (method.type === "bank_account"
                                ? `${method.bankName} ****${method.accountNumberLast4}`
                                : method.type === "paypal"
                                  ? `PayPal (${maskEmail(method.paypalEmail || "")})`
                                  : "Stripe Connect")}
                          </h3>
                          {method.isDefault && (
                            <Badge variant="outline" className="text-primary border-primary">
                              <Star className="w-3 h-3 mr-1 fill-primary" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {method.type === "bank_account" && (
                            <>
                              {method.accountType === "checking"
                                ? "Checking"
                                : "Savings"}{" "}
                              account • {method.bankName}
                            </>
                          )}
                          {method.type === "paypal" && (
                            <>PayPal • {method.paypalEmail}</>
                          )}
                          {method.type === "stripe_connect" && (
                            <>
                              Stripe Connect •{" "}
                              {method.stripeAccountStatus || "pending"}
                            </>
                          )}
                        </p>
                        <div className="mt-2">
                          {getStatusBadge(method.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && method.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method._id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingNickname({
                            id: method._id,
                            nickname: method.nickname || "",
                          })
                        }
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(method._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Method Dialog */}
        <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {addMethodType
                  ? addMethodType === "bank_account"
                    ? "Add Bank Account"
                    : "Add PayPal"
                  : "Add Payout Method"}
              </DialogTitle>
              <DialogDescription>
                {addMethodType
                  ? "Enter your account details below"
                  : "Choose how you'd like to receive your earnings"}
              </DialogDescription>
            </DialogHeader>

            {!addMethodType ? (
              <div className="grid gap-4 py-4">
                <button
                  onClick={() => setAddMethodType("bank_account")}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="p-3 bg-muted rounded-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Bank Account (ACH)</h3>
                    <p className="text-sm text-muted-foreground">
                      Direct deposit to your bank account
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setAddMethodType("paypal")}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="p-3 bg-muted rounded-lg">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.1 5.053-2.14 7.93-6.876 7.93h-2.163c-.524 0-.968.382-1.05.9l-1.425 9.04a.641.641 0 0 0 .633.74h4.116c.457 0 .844-.333.916-.784l.038-.196.728-4.608.047-.253a.92.92 0 0 1 .915-.784h.575c3.731 0 6.65-1.515 7.504-5.897.357-1.831.172-3.36-.351-4.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">PayPal</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive payments to your PayPal account
                    </p>
                  </div>
                </button>
              </div>
            ) : addMethodType === "bank_account" ? (
              <form onSubmit={handleAddBankAccount} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input
                    id="nickname"
                    placeholder="e.g., Business Checking"
                    value={bankForm.nickname}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, nickname: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., Chase, Wells Fargo"
                    value={bankForm.bankName}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, bankName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={bankForm.accountType}
                    onValueChange={(value: "checking" | "savings") =>
                      setBankForm({ ...bankForm, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    placeholder="Name on the account"
                    value={bankForm.accountHolderName}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        accountHolderName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    placeholder="9-digit routing number"
                    value={bankForm.routingNumber}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        routingNumber: e.target.value.replace(/\D/g, "").slice(0, 9),
                      })
                    }
                    maxLength={9}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Account number"
                    value={bankForm.accountNumber}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        accountNumber: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmAccountNumber">
                    Confirm Account Number
                  </Label>
                  <Input
                    id="confirmAccountNumber"
                    placeholder="Re-enter account number"
                    value={bankForm.confirmAccountNumber}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        confirmAccountNumber: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="setAsDefault"
                    checked={bankForm.setAsDefault}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, setAsDefault: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="setAsDefault" className="font-normal">
                    Set as default payout method
                  </Label>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForms}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Add Bank Account
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handleAddPayPal} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="paypalNickname">Nickname (Optional)</Label>
                  <Input
                    id="paypalNickname"
                    placeholder="e.g., Business PayPal"
                    value={paypalForm.nickname}
                    onChange={(e) =>
                      setPaypalForm({ ...paypalForm, nickname: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypalEmail">PayPal Email</Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={paypalForm.paypalEmail}
                    onChange={(e) =>
                      setPaypalForm({
                        ...paypalForm,
                        paypalEmail: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirm Email</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="Re-enter email"
                    value={paypalForm.confirmEmail}
                    onChange={(e) =>
                      setPaypalForm({
                        ...paypalForm,
                        confirmEmail: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="paypalSetAsDefault"
                    checked={paypalForm.setAsDefault}
                    onChange={(e) =>
                      setPaypalForm({
                        ...paypalForm,
                        setAsDefault: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="paypalSetAsDefault" className="font-normal">
                    Set as default payout method
                  </Label>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForms}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Add PayPal
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Payment Method?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Are you sure you want to remove
                this payment method?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Nickname Dialog */}
        <Dialog
          open={editingNickname !== null}
          onOpenChange={() => setEditingNickname(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Nickname</DialogTitle>
              <DialogDescription>
                Give this payment method a recognizable name
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="editNickname">Nickname</Label>
              <Input
                id="editNickname"
                value={editingNickname?.nickname || ""}
                onChange={(e) =>
                  editingNickname &&
                  setEditingNickname({
                    ...editingNickname,
                    nickname: e.target.value,
                  })
                }
                placeholder="e.g., Business Account"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingNickname(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateNickname}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
