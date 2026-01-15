"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2, Users } from "lucide-react";
import Link from "next/link";

type Period = "week" | "month" | "all";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="text-2xl" title="1st Place">🥇</span>;
  }
  if (rank === 2) {
    return <span className="text-2xl" title="2nd Place">🥈</span>;
  }
  if (rank === 3) {
    return <span className="text-2xl" title="3rd Place">🥉</span>;
  }
  return (
    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
      {rank}
    </span>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "same" }) {
  if (trend === "up") {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs">Up</span>
      </div>
    );
  }
  if (trend === "down") {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-xs">Down</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span className="text-xs">Same</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const leaderboard = useQuery(api.associates.queries.getTeamLeaderboard, {
    period,
  });

  const isLoading = leaderboard === undefined;
  const isEmpty = leaderboard !== undefined && leaderboard.length === 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link
            href="/team/sales-performance"
            className="hover:text-foreground"
          >
            Performance
          </Link>
          <span>/</span>
          <span>Leaderboard</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Top performers across all events
        </p>
      </div>

      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as Period)}
      >
        <TabsList>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Sellers
          </CardTitle>
          <CardDescription>
            {period === "week" && "Highest ticket sales this week"}
            {period === "month" && "Highest ticket sales this month"}
            {period === "all" && "Highest ticket sales all time"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isEmpty && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sales data yet</p>
              <p className="text-sm mt-2">
                Sales from your team associates will appear here
              </p>
            </div>
          )}

          {!isLoading && !isEmpty && (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Rank</th>
                      <th className="pb-3 pr-4 font-medium">Associate</th>
                      <th className="pb-3 pr-4 font-medium text-right">
                        Sales
                      </th>
                      <th className="pb-3 pr-4 font-medium text-right">
                        Tickets
                      </th>
                      <th className="pb-3 pr-4 font-medium text-right">
                        Revenue
                      </th>
                      {period !== "all" && (
                        <th className="pb-3 font-medium text-center">Trend</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.associateId}
                        className={`border-b last:border-0 ${
                          entry.rank <= 3 ? "bg-muted/30" : ""
                        }`}
                      >
                        <td className="py-4 pr-4">
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td className="py-4 pr-4">
                          <div>
                            <p className="font-medium">{entry.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right font-medium">
                          {entry.salesCount}
                        </td>
                        <td className="py-4 pr-4 text-right">
                          {entry.ticketCount}
                        </td>
                        <td className="py-4 pr-4 text-right font-medium">
                          {formatCurrency(entry.revenue)}
                        </td>
                        {period !== "all" && (
                          <td className="py-4 text-center">
                            <TrendIndicator trend={entry.trend} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.associateId}
                    className={`p-4 rounded-lg border ${
                      entry.rank <= 3 ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <RankBadge rank={entry.rank} />
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.email}
                          </p>
                        </div>
                      </div>
                      {period !== "all" && (
                        <TrendIndicator trend={entry.trend} />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Sales</p>
                        <p className="font-medium">{entry.salesCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tickets</p>
                        <p className="font-medium">{entry.ticketCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">
                          {formatCurrency(entry.revenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
