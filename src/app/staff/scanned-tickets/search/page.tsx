"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle, XCircle, Ticket, Loader2, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SearchTicketPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Only run query when we have a search term
  const searchResult = useQuery(
    api.scanning.queries.searchTicketByCode,
    searchQuery ? { ticketCode: searchQuery } : "skip"
  );

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm.trim());
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isLoading = searchQuery && searchResult === undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/scanned-tickets" className="hover:text-foreground">
            Scanned Tickets
          </Link>
          <span>/</span>
          <span>Search Ticket</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Search Ticket</h1>
        <p className="text-muted-foreground mt-2">
          Look up specific ticket by number or QR code
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Ticket Number or QR Code</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Enter ticket number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Searching...</p>
          </CardContent>
        </Card>
      )}

      {/* Not Found */}
      {searchQuery && searchResult === null && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 text-destructive">Ticket Not Found</h3>
                <p className="text-muted-foreground">
                  No ticket found with code: <span className="font-mono font-bold">{searchQuery}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Result */}
      {searchResult && searchResult !== null && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {searchResult.isValid ? (
                  <CheckCircle className="h-12 w-12 text-success" />
                ) : searchResult.isScanned ? (
                  <AlertTriangle className="h-12 w-12 text-warning" />
                ) : (
                  <XCircle className="h-12 w-12 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4">
                  {searchResult.isValid
                    ? "Valid Ticket"
                    : searchResult.isScanned
                      ? "Already Scanned"
                      : `Status: ${searchResult.status}`}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Ticket Code</p>
                    <p className="font-semibold font-mono">{searchResult.ticketCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Event</p>
                    <p className="font-semibold">{searchResult.eventName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Ticket Holder</p>
                    <p className="font-semibold">{searchResult.attendeeName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Tier</p>
                    <p className="font-semibold">{searchResult.tierName}</p>
                  </div>
                  {searchResult.isScanned && searchResult.scannedAt && (
                    <>
                      <div>
                        <p className="text-muted-foreground mb-1">Scanned At</p>
                        <p className="font-semibold">{formatTime(searchResult.scannedAt)}</p>
                      </div>
                      {searchResult.scannedBy && (
                        <div>
                          <p className="text-muted-foreground mb-1">Scanned By</p>
                          <p className="font-semibold">{searchResult.scannedBy}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {searchResult.isScanned && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      This ticket has already been scanned
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Enter a ticket number to search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
