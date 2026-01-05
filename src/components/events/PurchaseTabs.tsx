"use client";

import React, { useState, useEffect } from "react";
import { Ticket, Users, Hotel, Check } from "lucide-react";
import { useEventCart } from "@/contexts/EventCartContext";
import { motion, AnimatePresence } from "framer-motion";

interface PurchaseTabsProps {
  eventId: string;
  hasTickets: boolean;
  hasSeating: boolean;
  hasHotels: boolean;
  ticketContent: React.ReactNode;
  seatingContent: React.ReactNode;
  hotelContent: React.ReactNode;
  defaultTab?: "tickets" | "tables" | "hotels";
}

type TabId = "tickets" | "tables" | "hotels";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  content: React.ReactNode;
}

export function PurchaseTabs({
  eventId,
  hasTickets,
  hasSeating,
  hasHotels,
  ticketContent,
  seatingContent,
  hotelContent,
  defaultTab,
}: PurchaseTabsProps) {
  const { setEventId, getTicketCount, getSeatCount, getHotelRoomCount } = useEventCart();

  // Initialize cart with eventId
  useEffect(() => {
    setEventId(eventId);
  }, [eventId, setEventId]);

  const tabs: TabConfig[] = [
    {
      id: "tickets",
      label: "Tickets",
      icon: Ticket,
      available: hasTickets,
      content: ticketContent,
    },
    {
      id: "tables",
      label: "Tables",
      icon: Users,
      available: hasSeating,
      content: seatingContent,
    },
    {
      id: "hotels",
      label: "Hotels",
      icon: Hotel,
      available: hasHotels,
      content: hotelContent,
    },
  ];

  const availableTabs = tabs.filter((tab) => tab.available);

  // Determine default tab
  const getDefaultTab = (): TabId => {
    if (defaultTab && availableTabs.some((t) => t.id === defaultTab)) {
      return defaultTab;
    }
    return availableTabs[0]?.id || "tickets";
  };

  const [activeTab, setActiveTab] = useState<TabId>(getDefaultTab);

  // Count items in each category for badges
  const ticketCount = getTicketCount();
  const seatCount = getSeatCount();
  const hotelCount = getHotelRoomCount();

  const getItemCount = (tabId: TabId): number => {
    switch (tabId) {
      case "tickets":
        return ticketCount;
      case "tables":
        return seatCount;
      case "hotels":
        return hotelCount;
      default:
        return 0;
    }
  };

  // No tabs available
  if (availableTabs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No purchase options are currently available for this event.
        </p>
      </div>
    );
  }

  // Only one tab available - don't show tabs UI
  if (availableTabs.length === 1) {
    return <div className="py-4">{availableTabs[0].content}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide" role="tablist">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const itemCount = getItemCount(tab.id);
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>

                {/* Item count badge */}
                {itemCount > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {itemCount > 0 && <Check className="w-3 h-3 mr-0.5" />}
                    {itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {availableTabs.map((tab) =>
          activeTab === tab.id ? (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              role="tabpanel"
            >
              {tab.content}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Helper component to wrap tab content with consistent styling
 */
export function TabContent({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
