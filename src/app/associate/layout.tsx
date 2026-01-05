"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleBasedSidebar } from "@/components/navigation";
import { AppHeader } from "@/components/sidebar/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { NavUser } from "@/lib/navigation/types";
import { generateUserInitials } from "@/lib/navigation/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function AssociateLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Query staff dashboard to verify associate role
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Check if user has any associate positions
  const associatePositions = staffDashboard?.filter(p => p.role === "ASSOCIATES") || [];
  const hasAssociateRole = associatePositions.length > 0;

  // Fetch user data from auth API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const apiUser = data.user;

          // Convert API user to NavUser format
          const navUser: NavUser = {
            id: apiUser._id,
            email: apiUser.email,
            name: apiUser.name,
            role: apiUser.role || "user",
            avatar: apiUser.avatar,
            initials: generateUserInitials(apiUser.name, apiUser.email),
            // Staff role will be verified from database
            staffRoles: ["ASSOCIATES"],
          };

          setUser(navUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Show loading state while fetching user or staff data
  if (loading || staffDashboard === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error if no user (should redirect to login in production)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have associate role
  if (!hasAssociateRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Associate Access Required</CardTitle>
            <CardDescription>
              You don&apos;t have any associate positions assigned yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>To access the Associate Dashboard, you need to be assigned as an associate for at least one event.</p>
              <p className="mt-2">Contact an event organizer or team member to get assigned.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/">Go to Home</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <WorkspaceProvider initialUser={user} initialRole="ASSOCIATES">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          <RoleBasedSidebar user={user} activeRole="ASSOCIATES" />
          <SidebarInset className="flex-1">
            <AppHeader />
            <main className="flex-1 overflow-auto">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
