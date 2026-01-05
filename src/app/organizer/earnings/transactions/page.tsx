"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { TrendingUp, ArrowLeft, Calendar, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";

interface Transaction {
  _id: string;
  orderId: string;
  eventId: string;
  eventName: string;
  date: number;
  amount: number;
  status: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string | undefined;
}

const ITEMS_PER_PAGE = 20;

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Reset to page 1 on search change
    setCurrentPage(1);
    // Simple debounce with timeout
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch transactions with pagination and search
  const transactionsResult = useQuery(api.orders.queries.getOrganizerTransactions, {
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
  });

  const isLoading = transactionsResult === undefined;

  // Extract data from result
  const transactions = transactionsResult?.transactions || [];
  const totalCount = transactionsResult?.total || 0;
  const hasMore = transactionsResult?.hasMore || false;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return { label: "Completed", className: "text-green-600 bg-green-50" };
      case "PENDING":
        return { label: "Pending", className: "text-yellow-600 bg-yellow-50" };
      case "PENDING_PAYMENT":
        return { label: "Awaiting Payment", className: "text-orange-600 bg-orange-50" };
      case "CANCELLED":
        return { label: "Cancelled", className: "text-gray-600 bg-gray-50" };
      case "FAILED":
        return { label: "Failed", className: "text-red-600 bg-red-50" };
      case "REFUNDED":
        return { label: "Refunded", className: "text-purple-600 bg-purple-50" };
      default:
        return { label: status, className: "text-gray-600 bg-gray-50" };
    }
  };

  // CSV Export function
  const exportToCSV = useCallback(() => {
    if (!transactions.length) return;

    const headers = ["Date", "Order ID", "Event", "Customer", "Email", "Amount", "Status", "Payment Method"];
    const rows = transactions.map((t: Transaction) => [
      new Date(t.date).toLocaleString(),
      t.orderId,
      t.eventName,
      t.customerName,
      t.customerEmail,
      `$${(t.amount / 100).toFixed(2)}`,
      t.status,
      t.paymentMethod || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <Link
                href="/organizer/earnings"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
                <p className="text-muted-foreground mt-1">
                  {totalCount > 0 ? `${totalCount} transaction${totalCount !== 1 ? "s" : ""}` : "Detailed view of all your transactions"}
                </p>
              </div>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order ID, event name, or customer..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {transactions.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {transactions.map((transaction: Transaction) => {
                  const statusInfo = formatStatus(transaction.status);
                  return (
                    <div key={transaction._id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{transaction.eventName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.date).toLocaleDateString()} • {transaction.orderId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.customerName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className={`text-sm font-medium ${transaction.status === "COMPLETED" ? "text-green-600" : "text-foreground"}`}>
                            ${(transaction.amount / 100).toFixed(2)}
                          </span>
                          <span className={`block text-xs px-2 py-0.5 rounded-full mt-1 ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-card">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {transactions.map((transaction: Transaction) => {
                      const statusInfo = formatStatus(transaction.status);
                      return (
                        <tr key={transaction._id} className="hover:bg-card">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                            {transaction.orderId}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{transaction.eventName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            <div>
                              <div className="font-medium">{transaction.customerName}</div>
                              <div className="text-muted-foreground text-xs">{transaction.customerEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.status === "COMPLETED" ? "text-green-600" : transaction.status === "REFUNDED" ? "text-purple-600" : "text-foreground"}`}>
                            {transaction.status === "REFUNDED" ? "-" : ""}${(transaction.amount / 100).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-foreground px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "Transactions will appear here when you make sales"}
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
