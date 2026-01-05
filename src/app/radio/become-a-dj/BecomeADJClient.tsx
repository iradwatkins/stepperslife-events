"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RadioSubNav } from "@/components/layout/RadioSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  Mic2,
  Radio,
  Wifi,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Music,
  Headphones,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const GENRES = [
  "Steppin'",
  "R&B",
  "Neo Soul",
  "House",
  "Soul",
  "Jazz",
  "Funk",
  "Old School",
  "Gospel",
  "Hip Hop",
  "Reggae",
  "Latin",
  "Other",
];

const BROADCAST_METHODS = [
  { value: "WEB_DJ", label: "Web DJ (Browser-based)", description: "Stream directly from your browser" },
  { value: "OBS", label: "OBS Studio", description: "Professional streaming software" },
  { value: "MIXXX", label: "Mixxx", description: "Free DJ software with streaming" },
  { value: "OTHER", label: "Other Software", description: "Serato, Virtual DJ, etc." },
];

export function BecomeADJClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [djName, setDjName] = useState("");
  const [stationName, setStationName] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [sampleMixUrl, setSampleMixUrl] = useState("");
  const [socialProof, setSocialProof] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [broadcastMethod, setBroadcastMethod] = useState<string>("");
  const [contentAgreement, setContentAgreement] = useState(false);

  // Check if user already has an application or station
  const existingApplication = useQuery(
    api.radioStreaming.getMyDjApplication,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  const existingStation = useQuery(
    api.radioStreaming.getMyStation,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  const submitApplication = useMutation(api.radioStreaming.submitDjApplication);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to submit an application");
      return;
    }

    if (!contentAgreement) {
      toast.error("Please accept the content agreement");
      return;
    }

    if (!djName || !stationName || !genre || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitApplication({
        userId: user._id as Id<"users">,
        userName: user.name || user.email || "",
        userEmail: user.email || "",
        djName,
        proposedStationName: stationName,
        genre,
        description,
        experience: experience || undefined,
        sampleMixUrl: sampleMixUrl || undefined,
        socialProof: socialProof || undefined,
        preferredSchedule: preferredSchedule || undefined,
        broadcastMethod: broadcastMethod as "WEB_DJ" | "OBS" | "MIXXX" | "OTHER" | undefined,
      });

      toast.success("Application submitted successfully!");
      router.push("/radio/become-a-dj/success");
    } catch (error) {
      console.error("Application error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <>
        <PublicHeader />
        <RadioSubNav />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <PublicFooter />
      </>
    );
  }

  // Already has a station
  if (existingStation) {
    return (
      <>
        <PublicHeader />
        <RadioSubNav />
        <main className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">You Already Have a Station!</h1>
                <p className="text-muted-foreground mb-6">
                  Your station "{existingStation.name}" is active. Head to your DJ dashboard to manage it.
                </p>
                <Link href="/radio/dj-dashboard">
                  <Button size="lg" className="gap-2">
                    <Radio className="w-4 h-4" />
                    Go to DJ Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <PublicFooter />
      </>
    );
  }

  // Has pending/approved application
  if (existingApplication && existingApplication.status !== "REJECTED") {
    return (
      <>
        <PublicHeader />
        <RadioSubNav />
        <main className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card>
              <CardContent className="pt-6 text-center">
                {existingApplication.status === "APPROVED" ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Application Approved!</h1>
                    <p className="text-muted-foreground mb-6">
                      Congratulations! Your station is being set up. Check your email for login credentials.
                    </p>
                  </>
                ) : (
                  <>
                    <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Application Pending</h1>
                    <p className="text-muted-foreground mb-6">
                      Your application for "{existingApplication.proposedStationName}" is under review.
                      We'll notify you by email once it's approved.
                    </p>
                  </>
                )}
                <Badge variant={existingApplication.status === "APPROVED" ? "default" : "secondary"}>
                  {existingApplication.status}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </main>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <RadioSubNav />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-500/10 via-background to-orange-500/5 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full mb-6">
                <Mic2 className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Stream on SteppersLife Radio
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Become a Radio DJ
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Get your own 24/7 radio station. Broadcast live, schedule shows, and earn revenue.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <Wifi className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-semibold mb-1">24/7 Streaming</h3>
                <p className="text-sm text-muted-foreground">Your station runs around the clock</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                  <Headphones className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold mb-1">Web DJ</h3>
                <p className="text-sm text-muted-foreground">Broadcast from your browser</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-1">Earn Revenue</h3>
                <p className="text-sm text-muted-foreground">70-80% of ad revenue is yours</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-1">Reach Listeners</h3>
                <p className="text-sm text-muted-foreground">National steppin' audience</p>
              </div>
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {!isAuthenticated ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
                    <p className="text-muted-foreground mb-6">
                      Please sign in or create an account to apply for a radio station.
                    </p>
                    <Link href="/auth/signin?redirect=/radio/become-a-dj">
                      <Button size="lg" className="gap-2">
                        Sign In to Continue
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>DJ Application</CardTitle>
                    <CardDescription>
                      Tell us about yourself and your music. Applications are reviewed within 48 hours.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* DJ Name */}
                      <div className="space-y-2">
                        <Label htmlFor="djName">DJ Name / Stage Name *</Label>
                        <Input
                          id="djName"
                          placeholder="DJ Smooth Groove"
                          value={djName}
                          onChange={(e) => setDjName(e.target.value)}
                          required
                        />
                      </div>

                      {/* Station Name */}
                      <div className="space-y-2">
                        <Label htmlFor="stationName">Proposed Station Name *</Label>
                        <Input
                          id="stationName"
                          placeholder="Smooth Groove Radio"
                          value={stationName}
                          onChange={(e) => setStationName(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          This will be your station's display name
                        </p>
                      </div>

                      {/* Genre */}
                      <div className="space-y-2">
                        <Label htmlFor="genre">Primary Genre *</Label>
                        <Select value={genre} onValueChange={setGenre} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a genre" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENRES.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Station Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your station's vibe, music style, and what listeners can expect..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>

                      {/* Experience */}
                      <div className="space-y-2">
                        <Label htmlFor="experience">DJ Experience (Optional)</Label>
                        <Textarea
                          id="experience"
                          placeholder="Tell us about your DJ experience, events you've played, etc."
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Sample Mix URL */}
                      <div className="space-y-2">
                        <Label htmlFor="sampleMixUrl">Sample Mix URL (Optional)</Label>
                        <Input
                          id="sampleMixUrl"
                          type="url"
                          placeholder="https://soundcloud.com/your-mix or https://mixcloud.com/your-mix"
                          value={sampleMixUrl}
                          onChange={(e) => setSampleMixUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          SoundCloud, Mixcloud, YouTube, or other streaming link
                        </p>
                      </div>

                      {/* Social Proof */}
                      <div className="space-y-2">
                        <Label htmlFor="socialProof">Social Media / Following (Optional)</Label>
                        <Input
                          id="socialProof"
                          placeholder="Instagram: @djsmooth (5k followers), Facebook: 2k likes"
                          value={socialProof}
                          onChange={(e) => setSocialProof(e.target.value)}
                        />
                      </div>

                      {/* Preferred Schedule */}
                      <div className="space-y-2">
                        <Label htmlFor="preferredSchedule">Preferred Live Schedule (Optional)</Label>
                        <Input
                          id="preferredSchedule"
                          placeholder="e.g., Fridays 8-10pm CST, Weekends"
                          value={preferredSchedule}
                          onChange={(e) => setPreferredSchedule(e.target.value)}
                        />
                      </div>

                      {/* Broadcast Method */}
                      <div className="space-y-2">
                        <Label>Preferred Broadcast Method</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {BROADCAST_METHODS.map((method) => (
                            <div
                              key={method.value}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                broadcastMethod === method.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => setBroadcastMethod(method.value)}
                            >
                              <div className="font-medium text-sm">{method.label}</div>
                              <div className="text-xs text-muted-foreground">{method.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Content Agreement */}
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <h3 className="font-semibold">Content Agreement</h3>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>By submitting this application, you agree to:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Only play music you have rights to broadcast</li>
                            <li>Follow FCC guidelines and avoid explicit content</li>
                            <li>Maintain a professional broadcast environment</li>
                            <li>Not use the platform for illegal activities</li>
                            <li>Allow SteppersLife to insert ads into your stream</li>
                          </ul>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="contentAgreement"
                            checked={contentAgreement}
                            onCheckedChange={(checked) => setContentAgreement(checked === true)}
                          />
                          <Label htmlFor="contentAgreement" className="text-sm cursor-pointer">
                            I agree to the content guidelines and terms of service
                          </Label>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={isSubmitting || !contentAgreement}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Mic2 className="w-4 h-4" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
