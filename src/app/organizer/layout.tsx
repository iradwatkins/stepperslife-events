"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { RoleBasedSidebar } from "@/components/navigation";
import { AppHeader } from "@/components/sidebar/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { NavUser, OrganizerTeamMembership } from "@/lib/navigation/types";
import { generateUserInitials } from "@/lib/navigation/utils";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import Link from "next/link";

// Wrapper component to check workspace access (must be inside WorkspaceProvider)
function WorkspaceAccessCheck({ children }: { children: React.ReactNode }) {
  useWorkspaceAccess();
  return <>{children}</>;
}

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch organizer team roles from Convex (Sprint 13.4)
  const organizerTeamRoles = useQuery(api.staff.queries.getMyOrganizerTeamRoles);

  // Track if we've already applied team roles to avoid infinite loop
  const [teamRolesApplied, setTeamRolesApplied] = useState(false);

  // Update user with team roles when they load
  useEffect(() => {
    if (user && organizerTeamRoles && !teamRolesApplied) {
      // Map Convex response to OrganizerTeamMembership type
      const teamMemberships: OrganizerTeamMembership[] = organizerTeamRoles.map((tr) => ({
        organizerId: tr.organizerId,
        organizerName: tr.organizerName,
        organizerEmail: tr.organizerEmail,
        role: tr.role,
        permissions: tr.permissions,
      }));
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          organizerTeamRoles: teamMemberships,
        };
      });
      setTeamRolesApplied(true);
    }
  }, [organizerTeamRoles, user, teamRolesApplied]);

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
            role: apiUser.role || "organizer",
            avatar: apiUser.avatar,
            initials: generateUserInitials(apiUser.name, apiUser.email),
            staffRoles: [],
            organizerTeamRoles: [], // Will be populated by Convex query
          };

          // Multi-role support: Allow users with any authenticated role to access organizer features
          // The FAQ says "You can be an event organizer, instructor, vendor, and more all at once"
          // Only block if user has no valid role at all
          const allowedRoles = ["organizer", "admin", "instructor", "user", "restaurateur", "vendor"];
          if (!allowedRoles.includes(apiUser.role)) {
            router.push("/unauthorized");
            return;
          }

          setUser(navUser);
        } else {
          // Not authenticated - redirect to login
          const returnUrl = encodeURIComponent(pathname);
          router.push(`/login?returnUrl=${returnUrl}`);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        // On error, redirect to login
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login prompt with link if redirect didn't happen
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please log in to continue</p>
          <Link
            href={`/login?returnUrl=${encodeURIComponent(pathname)}`}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider initialUser={user} initialRole="organizer">
      <WorkspaceAccessCheck>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <RoleBasedSidebar user={user} activeRole="organizer" />
            <SidebarInset className="flex-1">
              <AppHeader />
              <main className="flex-1 overflow-auto">{children}</main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </WorkspaceAccessCheck>
    </WorkspaceProvider>
  );
}
