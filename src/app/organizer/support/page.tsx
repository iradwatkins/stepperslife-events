"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { HelpCircle, MessageCircle, FileText, Mail, ExternalLink, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export default function SupportPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const userTickets = useQuery(api.supportTickets.queries.getUserTickets);
  const createTicket = useMutation(api.supportTickets.mutations.createTicket);
  const addReply = useMutation(api.supportTickets.mutations.addReply);
  const closeTicket = useMutation(api.supportTickets.mutations.closeTicket);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<Id<"supportTickets"> | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const isLoading = currentUser === undefined || userTickets === undefined;

  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading support...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTicket({
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
      });
      toast.success(`Ticket ${result.ticketNumber} created! We'll get back to you soon.`);
      setSubject("");
      setMessage("");
      setCategory("general");
      setPriority("medium");
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast.error("Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (ticketId: Id<"supportTickets">) => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsReplying(true);
    try {
      await addReply({
        ticketId,
        message: replyMessage.trim(),
      });
      toast.success("Reply sent!");
      setReplyMessage("");
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply. Please try again.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async (ticketId: Id<"supportTickets">) => {
    try {
      await closeTicket({ ticketId });
      toast.success("Ticket closed");
    } catch (error) {
      console.error("Failed to close ticket:", error);
      toast.error("Failed to close ticket. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            Open
          </span>
        );
      case "in_progress":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-warning/10 text-warning flex items-center gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Resolved
          </span>
        );
      case "closed":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Closed
          </span>
        );
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-muted text-foreground">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive">
            High
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-warning/10 text-warning">
            Medium
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const supportOptions = [
    {
      title: "Documentation",
      description: "Browse our comprehensive guides and tutorials",
      icon: FileText,
      href: "https://docs.stepperslife.com",
      color: "bg-info/100",
    },
    {
      title: "FAQs",
      description: "Quick answers to common questions",
      icon: HelpCircle,
      href: "#faqs",
      color: "bg-sky-500",
    },
    {
      title: "Email Support",
      description: "Send us an email at support@stepperslife.com",
      icon: Mail,
      href: "mailto:support@stepperslife.com",
      color: "bg-success",
    },
  ];

  const faqs = [
    {
      question: "How do I purchase tickets for my event?",
      answer:
        "Navigate to Tickets > Purchase Tickets, select your event, choose the quantity, and complete the purchase using your credits.",
    },
    {
      question: "When will I receive my payouts?",
      answer:
        "Payouts are processed weekly, typically every Monday, and sent to your connected Stripe account.",
    },
    {
      question: "How do I add team members to my events?",
      answer:
        "Go to Team Management, click 'Add Team Member', enter their email, and assign their role and permissions.",
    },
    {
      question: "Can I get a refund on credits?",
      answer:
        "Credits are non-refundable, but they never expire and can be used for any of your events.",
    },
  ];

  return (
    <div className="min-h-screen bg-card">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support & Help</h1>
            <p className="text-muted-foreground mt-1">We're here to help you succeed</p>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {/* Support Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {supportOptions.map((option, index) => (
            <a
              key={index}
              href={option.href}
              target={option.href.startsWith("http") ? "_blank" : undefined}
              rel={option.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className={`${option.color} p-3 rounded-lg text-white w-fit mb-4`}>
                <option.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                {option.title}
                {option.href.startsWith("http") && <ExternalLink className="w-4 h-4" />}
              </h3>
              <p className="text-muted-foreground">{option.description}</p>
            </a>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Create a Support Ticket</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Have a question or need help? Submit a ticket and we'll respond within 24 hours.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Brief description of your issue..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="events">Events</option>
                    <option value="payments">Payments</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe your issue in detail..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
            id="faqs"
          >
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="font-medium text-foreground mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Ticket History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Your Support Tickets</h2>
          </div>

          {!userTickets || userTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No support tickets yet</p>
              <p className="text-sm mt-1">Create your first ticket above if you need help</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(userTickets as SupportTicket[]).map((ticket: SupportTicket) => (
                <TicketItem
                  key={ticket._id}
                  ticket={ticket}
                  isExpanded={expandedTicket === ticket._id}
                  onToggle={() => setExpandedTicket(expandedTicket === ticket._id ? null : ticket._id)}
                  getStatusBadge={getStatusBadge}
                  getPriorityBadge={getPriorityBadge}
                  replyMessage={replyMessage}
                  setReplyMessage={setReplyMessage}
                  onReply={() => handleReply(ticket._id)}
                  onClose={() => handleCloseTicket(ticket._id)}
                  isReplying={isReplying}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

interface SupportTicket {
  _id: Id<"supportTickets">;
  ticketNumber: string;
  subject: string;
  message: string;
  category?: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: number;
  updatedAt: number;
}

interface TicketReply {
  _id: Id<"supportTicketReplies">;
  ticketId: Id<"supportTickets">;
  authorId: Id<"users">;
  message: string;
  isInternal: boolean;
  createdAt: number;
  author: {
    _id: Id<"users">;
    name?: string;
    email: string;
    role?: string;
  } | null;
}

interface TicketItemProps {
  ticket: {
    _id: Id<"supportTickets">;
    ticketNumber: string;
    subject: string;
    message: string;
    category?: string;
    priority: "low" | "medium" | "high";
    status: "open" | "in_progress" | "resolved" | "closed";
    createdAt: number;
    updatedAt: number;
  };
  isExpanded: boolean;
  onToggle: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getPriorityBadge: (priority: string) => React.ReactNode;
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  onReply: () => void;
  onClose: () => void;
  isReplying: boolean;
}

function TicketItem({
  ticket,
  isExpanded,
  onToggle,
  getStatusBadge,
  getPriorityBadge,
  replyMessage,
  setReplyMessage,
  onReply,
  onClose,
  isReplying,
}: TicketItemProps) {
  const ticketReplies = useQuery(
    api.supportTickets.queries.getTicketReplies,
    isExpanded ? { ticketId: ticket._id } : "skip"
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-muted-foreground">{ticket.ticketNumber}</span>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
          <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Created {new Date(ticket.createdAt).toLocaleDateString()} at{" "}
            {new Date(ticket.createdAt).toLocaleTimeString()}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t"
          >
            <div className="p-4 space-y-4">
              {/* Original Message */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Original Message</p>
                <p className="text-foreground whitespace-pre-wrap">{ticket.message}</p>
                {ticket.category && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Category: <span className="capitalize">{ticket.category}</span>
                  </p>
                )}
              </div>

              {/* Replies */}
              {ticketReplies && ticketReplies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Conversation</p>
                  {(ticketReplies as TicketReply[]).map((reply: TicketReply) => (
                    <div
                      key={reply._id}
                      className={`rounded-lg p-4 ${
                        reply.author?.role === "admin"
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {reply.author?.name || "Unknown"}
                        </span>
                        {reply.author?.role === "admin" && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary">
                            Support Team
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {ticket.status !== "closed" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onReply();
                      }
                    }}
                  />
                  <button
                    onClick={onReply}
                    disabled={isReplying || !replyMessage.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isReplying ? "Sending..." : "Reply"}
                  </button>
                </div>
              )}

              {/* Actions */}
              {ticket.status !== "closed" && (
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Close Ticket
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
