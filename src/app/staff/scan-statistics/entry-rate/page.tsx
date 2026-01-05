"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import Link from "next/link";

export default function EntryRatePage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/scan-statistics" className="hover:text-foreground">
            Scan Statistics
          </Link>
          <span>/</span>
          <span>Entry Rate</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Entry Rate Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Monitor check-in speed and flow metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Rate</p>
                <p className="text-2xl font-bold mt-1">0/min</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rate</p>
                <p className="text-2xl font-bold mt-1">0/min</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Peak Rate</p>
                <p className="text-2xl font-bold mt-1">0/min</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Rate Timeline</CardTitle>
          <CardDescription>Real-time check-in rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data available</p>
            <p className="text-sm mt-2">Entry rate charts will appear during active events</p>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Tips to improve entry flow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">✓ Maintain steady scanning pace</p>
              <p className="text-sm text-muted-foreground mt-1">
                Consistent scanning helps reduce queue times
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">✓ Peak hours preparation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Most entries occur 30-60 minutes before event start
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
