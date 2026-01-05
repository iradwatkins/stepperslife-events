"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, XCircle, Copy, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function IssuesPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // Mock data
  const invalidTickets = 0;
  const duplicateScans = 0;
  const totalIssues = invalidTickets + duplicateScans;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Issues & Problems</h1>
        <p className="text-muted-foreground mt-2">
          Track and report ticket validation issues
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invalid Tickets</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{invalidTickets}</div>
            <p className="text-xs text-muted-foreground">Rejected entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicate Scans</CardTitle>
            <Copy className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{duplicateScans}</div>
            <p className="text-xs text-muted-foreground">Already scanned</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links to Subpages */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/staff/issues/invalid">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Invalid Tickets</CardTitle>
                    <CardDescription className="mt-1">
                      {invalidTickets} invalid
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/staff/issues/duplicates">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Copy className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Duplicate Scans</CardTitle>
                    <CardDescription className="mt-1">
                      {duplicateScans} duplicates
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/staff/issues/report">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Report Issue</CardTitle>
                    <CardDescription className="mt-1">
                      Submit new report
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
          <CardDescription>Latest problems encountered during scanning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No issues reported</p>
            <p className="text-sm mt-2">Issues will appear here when encountered</p>
          </div>
        </CardContent>
      </Card>

      {/* Report New Issue CTA */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Need to report an issue?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Encountered a problem during scanning? Report it immediately.
          </p>
          <Button asChild>
            <Link href="/staff/issues/report">Report New Issue</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
