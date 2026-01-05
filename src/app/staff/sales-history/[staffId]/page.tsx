"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DollarSign, Ticket, Calendar, CreditCard, Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function SalesHistoryPage() {
  const params = useParams();
  const staffId = params.staffId as Id<"eventStaff">;

  const staffDetails = useQuery(api.staff.queries.getStaffMemberDetails, { staffId });
  const staffSales = useQuery(api.staff.queries.getStaffSales, { staffId, limit: 100 });

  if (!staffDetails || !staffSales) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <Link
        href="/staff/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Sales History</h1>
        <p className="text-muted-foreground mt-1">{staffDetails.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Sales</span>
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{staffDetails.ticketsSold}</p>
          <p className="text-xs text-muted-foreground mt-1">Tickets sold</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Commission Earned</span>
            <DollarSign className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${(staffDetails.commissionEarned / 100).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total earned</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Cash Collected</span>
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${((staffDetails.cashCollected || 0) / 100).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In hand</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Net Payout</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${(staffDetails.netPayout / 100).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Commission - Cash</p>
        </div>
      </div>

      {/* Sales Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Sales by Payment Method</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-accent rounded-lg">
            <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{staffDetails.salesBreakdown.online}</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
          <div className="text-center p-4 bg-success/10 rounded-lg">
            <Wallet className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{staffDetails.salesBreakdown.cash}</p>
            <p className="text-sm text-muted-foreground">Cash</p>
          </div>
          <div className="text-center p-4 bg-accent rounded-lg">
            <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {staffDetails.salesBreakdown.cashApp}
            </p>
            <p className="text-sm text-muted-foreground">Cash App</p>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border">
          <h2 className="text-xl font-bold text-foreground">Transaction History</h2>
        </div>

        {staffSales.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {staffSales.map((sale) => (
                <div key={sale._id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">{sale.orderId.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sale.createdAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sale.paymentMethod === "CASH"
                          ? "bg-success/20 text-success"
                          : sale.paymentMethod === "CASH_APP"
                            ? "bg-accent text-foreground"
                            : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {sale.paymentMethod || "ONLINE"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{sale.ticketCount} ticket{sale.ticketCount !== 1 ? "s" : ""}</span>
                    <span className="font-medium text-success">${(sale.commissionAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card border-b border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Commission
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffSales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-card">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {format(new Date(sale.createdAt), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                        {sale.orderId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {sale.ticketCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sale.paymentMethod === "CASH"
                              ? "bg-success/20 text-success"
                              : sale.paymentMethod === "CASH_APP"
                                ? "bg-accent text-foreground"
                                : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {sale.paymentMethod || "ONLINE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success">
                        ${(sale.commissionAmount / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Sales Yet</h3>
            <p className="text-muted-foreground">
              Your sales history will appear here once you start selling tickets
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
