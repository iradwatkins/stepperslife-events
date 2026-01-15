"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
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
  Image as ImageIcon,
  Link as LinkIcon,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Upload,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed file types
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Form states
  const [djName, setDjName] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");

  // Social links state
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");

  // Image preview states
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Loading states
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get DJ's station
  const station = useQuery(
    api.radioStreaming.getMyStation,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Mutations
  const updateStationInfo = useMutation(api.radioStreaming.updateStationInfo);
  const updateStationLogo = useMutation(api.radioStreaming.updateStationLogo);
  const updateStationBanner = useMutation(api.radioStreaming.updateStationBanner);
  const updateSocialLinks = useMutation(api.radioStreaming.updateSocialLinks);
  const generateUploadUrl = useMutation(api.radioStreaming.generateStationImageUploadUrl);

  // Initialize form values when station loads
  useEffect(() => {
    if (station) {
      setDjName(station.djName || "");
      setGenre(station.genre || "");
      setDescription(station.description || "");
      setInstagram(station.socialLinks?.instagram || "");
      setTwitter(station.socialLinks?.twitter || "");
      setFacebook(station.socialLinks?.facebook || "");
      setWebsite(station.socialLinks?.website || "");
    }
  }, [station]);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PNG and JPG images are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle banner file selection
  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save station info
  const handleSaveInfo = async () => {
    if (!station || !user) return;

    setSavingInfo(true);
    try {
      await updateStationInfo({
        stationId: station._id,
        userId: user._id as Id<"users">,
        djName: djName.trim() || undefined,
        genre: genre.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast.success("Station info updated successfully");
    } catch (error) {
      console.error("Error updating station info:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update station info");
    } finally {
      setSavingInfo(false);
    }
  };

  // Upload and save logo
  const handleSaveLogo = async () => {
    if (!station || !user || !logoFile) return;

    setSavingLogo(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": logoFile.type },
        body: logoFile,
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const { storageId } = await response.json();

      // Update the station with the new logo
      await updateStationLogo({
        stationId: station._id,
        userId: user._id as Id<"users">,
        logoStorageId: storageId,
      });

      toast.success("Logo updated successfully");
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error("Error updating logo:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update logo");
    } finally {
      setSavingLogo(false);
    }
  };

  // Upload and save banner
  const handleSaveBanner = async () => {
    if (!station || !user || !bannerFile) return;

    setSavingBanner(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": bannerFile.type },
        body: bannerFile,
      });

      if (!response.ok) {
        throw new Error("Failed to upload banner");
      }

      const { storageId } = await response.json();

      // Update the station with the new banner
      await updateStationBanner({
        stationId: station._id,
        userId: user._id as Id<"users">,
        bannerStorageId: storageId,
      });

      toast.success("Banner updated successfully");
      setBannerFile(null);
      setBannerPreview(null);
    } catch (error) {
      console.error("Error updating banner:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update banner");
    } finally {
      setSavingBanner(false);
    }
  };

  // Save social links
  const handleSaveSocial = async () => {
    if (!station || !user) return;

    setSavingSocial(true);
    try {
      await updateSocialLinks({
        stationId: station._id,
        userId: user._id as Id<"users">,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        facebook: facebook.trim() || undefined,
        website: website.trim() || undefined,
      });
      toast.success("Social links updated successfully");
    } catch (error) {
      console.error("Error updating social links:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update social links");
    } finally {
      setSavingSocial(false);
    }
  };

  // Cancel logo preview
  const cancelLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Cancel banner preview
  const cancelBannerPreview = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

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
                value={station.name}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Contact admin to change station name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dj-name">DJ Name</Label>
              <Input
                id="dj-name"
                value={djName}
                onChange={(e) => setDjName(e.target.value)}
                placeholder="Your DJ name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Chicago Steppin', R&B, Soul"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell listeners about your station..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="w-full"
            >
              {savingInfo ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Station Images
            </CardTitle>
            <CardDescription>
              Customize your station&apos;s appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Station Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : station.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={station.logoUrl}
                      alt="Station logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Radio className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleLogoSelect}
                    className="hidden"
                    id="logo-upload"
                  />
                  {logoFile ? (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSaveLogo}
                        disabled={savingLogo}
                      >
                        {savingLogo ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelLogoPreview}
                        disabled={savingLogo}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Logo
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 400x400px, PNG or JPG, max 5MB
              </p>
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {bannerPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : station.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={station.bannerUrl}
                    alt="Station banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleBannerSelect}
                className="hidden"
                id="banner-upload"
              />
              {bannerFile ? (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={handleSaveBanner}
                    disabled={savingBanner}
                    className="flex-1"
                  >
                    {savingBanner ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Save Banner
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelBannerPreview}
                    disabled={savingBanner}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Banner
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x400px, PNG or JPG, max 5MB
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
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
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
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
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
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
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
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveSocial}
              disabled={savingSocial}
              className="w-full mt-6"
            >
              {savingSocial ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Social Links
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
