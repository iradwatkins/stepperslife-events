"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Share2, Facebook, Twitter, Instagram, Loader2, Link2, Calendar } from "lucide-react";
import Link from "next/link";

export default function ShareLinkPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter to only ASSOCIATES role positions
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");

  // Get the selected position or first one
  const selectedPosition = selectedEventId
    ? associatePositions.find(p => p.event?._id === selectedEventId)
    : associatePositions[0];

  // Generate the real referral link
  const getReferralLink = (position: typeof selectedPosition) => {
    if (!position?.event?._id || !position?.referralCode) return "";
    return `https://stepperslife.com/events/${position.event._id}/checkout?ref=${position.referralCode}`;
  };

  const currentLink = selectedPosition ? getReferralLink(selectedPosition) : "";

  const handleShare = (platform: string) => {
    if (!currentLink) return;

    let shareUrl = "";
    const eventName = selectedPosition?.event?.name || "this event";
    const text = `Check out ${eventName}! Get your tickets here:`;

    switch (platform) {
      case "email":
        shareUrl = `mailto:?subject=Tickets for ${eventName}&body=${text} ${currentLink}`;
        break;
      case "sms":
        shareUrl = `sms:?&body=${text} ${currentLink}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentLink)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentLink)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + currentLink)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  const handleNativeShare = async () => {
    if (!currentLink || !navigator.share) return;

    try {
      await navigator.share({
        url: currentLink,
        text: `Check out ${selectedPosition?.event?.name || "this event"}!`
      });
    } catch {
      // User cancelled or error
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-ticket-link" className="hover:text-foreground">My Ticket Link</Link>
          <span>/</span>
          <span>Share Link</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Share Your Link</h1>
        <p className="text-muted-foreground mt-2">Share via your favorite platform</p>
      </div>

      {associatePositions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No events assigned</p>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ll be able to share links once assigned to events
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Event Selector */}
          {associatePositions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Event</CardTitle>
                <CardDescription>Choose which event link to share</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {associatePositions.map((position) => (
                    <Button
                      key={position._id}
                      variant={selectedPosition?._id === position._id ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      onClick={() => setSelectedEventId(position.event?._id || null)}
                    >
                      <div className="flex items-center gap-3">
                        {position.event?.imageUrl && (
                          <img
                            src={position.event.imageUrl}
                            alt={position.event.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div className="text-left">
                          <p className="font-medium">{position.event?.name || "Event"}</p>
                          <p className="text-xs opacity-70">
                            {position.event?.startDate
                              ? new Date(position.event.startDate).toLocaleDateString()
                              : "Date TBD"}
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Link Display */}
          {selectedPosition && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {selectedPosition.event?.name || "Event"}
                </CardTitle>
                <CardDescription>Your referral link for this event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  {currentLink}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Share</CardTitle>
              <CardDescription>Choose a platform to share your ticket link</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleShare("email")}
                  disabled={!currentLink}
                >
                  <Mail className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-semibold">Email</p>
                    <p className="text-xs text-muted-foreground">Share via email</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleShare("sms")}
                  disabled={!currentLink}
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-semibold">Text Message</p>
                    <p className="text-xs text-muted-foreground">Share via SMS</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleShare("whatsapp")}
                  disabled={!currentLink}
                >
                  <MessageCircle className="h-5 w-5 mr-3 text-success" />
                  <div className="text-left">
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Share via WhatsApp</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleShare("facebook")}
                  disabled={!currentLink}
                >
                  <Facebook className="h-5 w-5 mr-3 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Facebook</p>
                    <p className="text-xs text-muted-foreground">Share on Facebook</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleShare("twitter")}
                  disabled={!currentLink}
                >
                  <Twitter className="h-5 w-5 mr-3 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Twitter / X</p>
                    <p className="text-xs text-muted-foreground">Tweet your link</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={handleNativeShare}
                  disabled={!currentLink}
                >
                  <Share2 className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-semibold">More Options</p>
                    <p className="text-xs text-muted-foreground">Share via system</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sharing Tips</CardTitle>
              <CardDescription>Maximize your sales with these strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Instagram className="h-5 w-5 text-accent-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">Social Media Stories</p>
                    <p className="text-sm text-muted-foreground">
                      Add your link to Instagram, Facebook, or Snapchat stories with event photos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MessageCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-semibold">Direct Messages</p>
                    <p className="text-sm text-muted-foreground">
                      Send personalized messages to friends and contacts who might be interested
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Email Lists</p>
                    <p className="text-sm text-muted-foreground">
                      Share with your email contacts or include in your email signature
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
