"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Radio,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  Image,
  Link as LinkIcon,
  Instagram,
  Twitter,
  Facebook,
  Globe,
} from "lucide-react";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get DJ's station
  const station = useQuery(
    api.radioStreaming.getMyStation,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Loading state
  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in or no station
  if (!user || !station) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need an active radio station to manage settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/radio/dj-dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/radio/dj-dashboard"
          className="text-sm text-muted-foreground hover:text-primary mb-2 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-600" />
          Station Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize your radio station
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Station Information
            </CardTitle>
            <CardDescription>
              Basic details about your station
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="station-name">Station Name</Label>
              <Input
                id="station-name"
                defaultValue={station.name}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Contact admin to change station name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dj-name">DJ Name</Label>
              <Input id="dj-name" defaultValue={station.djName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" defaultValue={station.genre} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                defaultValue={station.description || ""}
                placeholder="Tell listeners about your station..."
                rows={4}
              />
            </div>

            <Button disabled className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Station Images
            </CardTitle>
            <CardDescription>
              Customize your station&apos;s appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Station Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                  {station.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={station.logoUrl}
                      alt="Station logo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Radio className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Button variant="outline" disabled>
                  Upload Logo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 400x400px, PNG or JPG
              </p>
            </div>

            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                {station.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={station.bannerUrl}
                    alt="Station banner"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" disabled className="w-full">
                Upload Banner
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x400px, PNG or JPG
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Social Links
            </CardTitle>
            <CardDescription>
              Connect your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  placeholder="https://instagram.com/username"
                  defaultValue={station.socialLinks?.instagram || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  placeholder="https://twitter.com/username"
                  defaultValue={station.socialLinks?.twitter || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  placeholder="https://facebook.com/page"
                  defaultValue={station.socialLinks?.facebook || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  defaultValue={station.socialLinks?.website || ""}
                />
              </div>
            </div>

            <Button disabled className="w-full mt-6">
              <Save className="w-4 h-4 mr-2" />
              Save Social Links
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
