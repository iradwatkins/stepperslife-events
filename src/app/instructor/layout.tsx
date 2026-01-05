"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RoleBasedSidebar } from "@/components/navigation";
import { AppHeader } from "@/components/sidebar/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { NavUser } from "@/lib/navigation/types";
import { generateUserInitials } from "@/lib/navigation/utils";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import Link from "next/link";

// Wrapper component to check workspace access (must be inside WorkspaceProvider)
function WorkspaceAccessCheck({ children }: { children: React.ReactNode }) {
  useWorkspaceAccess();
  return <>{children}</>;
}

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user data from auth API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const apiUser = data.user;

          // Check if user has instructor or admin role
          if (apiUser.role !== "instructor" && apiUser.role !== "admin") {
            // Redirect non-instructors to their appropriate dashboard
            if (apiUser.role === "organizer") {
              router.push("/organizer/dashboard");
            } else if (apiUser.role === "restaurateur") {
              router.push("/restaurateur/dashboard");
            } else {
              router.push("/");
            }
            return;
          }

          // Convert API user to NavUser format
          const navUser: NavUser = {
            id: apiUser._id,
            email: apiUser.email,
            name: apiUser.name,
            role: apiUser.role || "instructor",
            avatar: apiUser.avatar,
            initials: generateUserInitials(apiUser.name, apiUser.email),
            staffRoles: [],
          };

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
    <WorkspaceProvider initialUser={user} initialRole="instructor">
      <WorkspaceAccessCheck>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <RoleBasedSidebar user={user} activeRole="instructor" />
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
