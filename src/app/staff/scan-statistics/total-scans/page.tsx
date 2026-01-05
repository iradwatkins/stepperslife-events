"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TotalScansPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const totalScans = 0;
  const validScans = 0;
  const invalidScans = 0;
  const duplicateScans = 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/scan-statistics" className="hover:text-foreground">
            Scan Statistics
          </Link>
          <span>/</span>
          <span>Total Scans</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Total Scans Overview</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive view of all scanning activity
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold mt-1">{totalScans}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid</p>
                <p className="text-2xl font-bold mt-1 text-success">{validScans}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invalid</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{invalidScans}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duplicates</p>
                <p className="text-2xl font-bold mt-1 text-warning">{duplicateScans}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Event */}
      <Card>
        <CardHeader>
          <CardTitle>Scans by Event</CardTitle>
          <CardDescription>Breakdown of scan activity per event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scan data available</p>
            <p className="text-sm mt-2">Event scan statistics will appear here</p>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Success Rate</CardTitle>
          <CardDescription>Percentage of valid vs invalid scans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-5xl font-bold text-success mb-2">
              {totalScans > 0 ? ((validScans / totalScans) * 100).toFixed(1) : "100"}%
            </div>
            <p className="text-muted-foreground">Success Rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
