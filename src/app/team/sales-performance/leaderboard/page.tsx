"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/sales-performance" className="hover:text-foreground">Performance</Link>
          <span>/</span>
          <span>Leaderboard</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">Top performers across all events</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Sellers
          </CardTitle>
          <CardDescription>Highest ticket sales this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Leaderboard coming soon</p>
            <p className="text-sm mt-2">Track top performers across events</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
