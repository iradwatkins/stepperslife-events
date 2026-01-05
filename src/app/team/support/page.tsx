"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Phone, HelpCircle, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function TeamSupportPage() {
  const handleStartChat = () => {
    toast.info("Live chat coming soon! For now, please email us.");
    window.location.href = "mailto:support@stepperslife.com";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground mt-2">Get help with your team member account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </CardTitle>
            <CardDescription>Common questions and answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">How do I sell tickets?</p>
              <p className="text-sm text-muted-foreground">
                Share your unique referral link with customers. When they purchase, you earn commission.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">When do I get paid?</p>
              <p className="text-sm text-muted-foreground">
                Earnings are settled after events. Contact your organizer for payout timing.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">How do I add associates?</p>
              <p className="text-sm text-muted-foreground">
                Go to My Associates and click Add Associate to invite team members.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>Reach out for help</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href="mailto:support@stepperslife.com"
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@stepperslife.com</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-muted-foreground">Available during business hours</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                <Clock className="h-3 w-3" />
                Coming Soon
              </div>
              <Button className="w-full" variant="outline" onClick={handleStartChat}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
