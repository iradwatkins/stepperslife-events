"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Plus,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

interface CarpoolSectionProps {
  eventId: Id<"events">;
  eventName: string;
}

function CarpoolSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CarpoolSection({
  eventId,
  eventName,
}: CarpoolSectionProps) {
  const { isAuthenticated } = useConvexAuth();
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedCarpool, setSelectedCarpool] = useState<Id<"carpoolOffers"> | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  // Form state for offering a ride
  const [departureCity, setDepartureCity] = useState("");
  const [departureState, setDepartureState] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState("2");
  const [contributionRequested, setContributionRequested] = useState("");
  const [contactMethod, setContactMethod] = useState<"app_message" | "phone" | "email">("app_message");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");

  const carpoolData = useQuery(api.carpools.queries.getEventCarpools, { eventId });
  const createOffer = useMutation(api.carpools.mutations.createCarpoolOffer);
  const requestRide = useMutation(api.carpools.mutations.requestRide);

  const handleOfferRide = async () => {
    if (!departureCity || !departureState || !departureDate || !departureTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createOffer({
        eventId,
        departureCity,
        departureState,
        departureDate: new Date(departureDate).getTime(),
        departureTime,
        seatsAvailable: parseInt(seatsAvailable, 10),
        contributionRequested: contributionRequested || undefined,
        contactMethod,
        contactInfo: contactMethod !== "app_message" ? contactInfo : undefined,
        notes: notes || undefined,
      });

      toast.success("Ride offer posted!");
      setShowOfferForm(false);
      // Reset form
      setDepartureCity("");
      setDepartureState("");
      setDepartureDate("");
      setDepartureTime("");
      setSeatsAvailable("2");
      setContributionRequested("");
      setContactMethod("app_message");
      setContactInfo("");
      setNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create offer");
    }
  };

  const handleRequestRide = async () => {
    if (!selectedCarpool) return;

    try {
      await requestRide({
        carpoolId: selectedCarpool,
        message: requestMessage || undefined,
      });

      toast.success("Ride request sent!");
      setShowRequestDialog(false);
      setSelectedCarpool(null);
      setRequestMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request ride");
    }
  };

  // Loading state
  if (carpoolData === undefined) {
    return (
      <section className="mt-8" aria-labelledby="carpool-heading">
        <h2
          id="carpool-heading"
          className="text-xl font-semibold mb-4 flex items-center gap-2"
        >
          <Car className="h-5 w-5 text-primary" />
          Ride Share
        </h2>
        <CarpoolSkeleton />
      </section>
    );
  }

  const { offers, grouped, totalOffers, totalSeats } = carpoolData;

  return (
    <section className="mt-8" aria-labelledby="carpool-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="carpool-heading"
          className="text-xl font-semibold flex items-center gap-2"
        >
          <Car className="h-5 w-5 text-primary" />
          Ride Share
        </h2>

        {isAuthenticated && (
          <Dialog open={showOfferForm} onOpenChange={setShowOfferForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Offer a Ride
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Offer a Ride</DialogTitle>
                <DialogDescription>
                  Help fellow steppers get to {eventName}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Departure Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureCity">Departing From (City) *</Label>
                    <Input
                      id="departureCity"
                      placeholder="Chicago"
                      value={departureCity}
                      onChange={(e) => setDepartureCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departureState">State *</Label>
                    <Input
                      id="departureState"
                      placeholder="IL"
                      value={departureState}
                      onChange={(e) => setDepartureState(e.target.value)}
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* Departure Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureDate">Departure Date *</Label>
                    <Input
                      id="departureDate"
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departureTime">Departure Time *</Label>
                    <Input
                      id="departureTime"
                      placeholder="4:00 PM"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Seats & Contribution */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seatsAvailable">Seats Available *</Label>
                    <Select value={seatsAvailable} onValueChange={setSeatsAvailable}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? "seat" : "seats"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribution">Gas Contribution</Label>
                    <Input
                      id="contribution"
                      placeholder="$25"
                      value={contributionRequested}
                      onChange={(e) => setContributionRequested(e.target.value)}
                    />
                  </div>
                </div>

                {/* Contact Method */}
                <div className="space-y-2">
                  <Label>Contact Method *</Label>
                  <Select
                    value={contactMethod}
                    onValueChange={(v) => setContactMethod(v as typeof contactMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app_message">In-App Message</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {contactMethod !== "app_message" && (
                  <div className="space-y-2">
                    <Label htmlFor="contactInfo">
                      {contactMethod === "phone" ? "Phone Number" : "Email Address"} *
                    </Label>
                    <Input
                      id="contactInfo"
                      placeholder={contactMethod === "phone" ? "(555) 123-4567" : "you@example.com"}
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Pickup location details, luggage space, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOfferForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleOfferRide}>Post Offer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mb-4">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          SteppersLife is not responsible for ride arrangements. Please exercise
          caution and verify drivers before traveling.
        </p>
      </div>

      {/* Stats */}
      {totalOffers > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground mb-4">
          <span>{totalOffers} ride{totalOffers === 1 ? "" : "s"} available</span>
          <span>•</span>
          <span>{totalSeats} seat{totalSeats === 1 ? "" : "s"} open</span>
        </div>
      )}

      {/* No offers */}
      {totalOffers === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Car className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              No rides offered yet for this event
            </p>
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={() => setShowOfferForm(true)}>
                Be the first to offer a ride
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Log in to offer or request rides
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grouped offers by city */}
      {Object.entries(grouped).map(([city, cityOffers]) => (
        <div key={city} className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            From {city}
          </h3>

          <div className="space-y-3">
            {cityOffers.map((offer) => (
              <Card key={offer._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Driver Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={offer.driverImage} />
                      <AvatarFallback>
                        {offer.driverName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Offer Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{offer.driverName}</span>
                        {offer.seatsAvailable - (offer.seatsTaken || 0) <= 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Last seat!
                          </Badge>
                        )}
                      </div>

                      {/* Departure info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(offer.departureDate), "EEE, MMM d")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {offer.departureTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {offer.seatsAvailable - (offer.seatsTaken || 0)} seats left
                        </span>
                        {offer.contributionRequested && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {offer.contributionRequested}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {offer.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {offer.notes}
                        </p>
                      )}
                    </div>

                    {/* Request button */}
                    {isAuthenticated && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCarpool(offer._id);
                          setShowRequestDialog(true);
                        }}
                      >
                        Request
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Request Ride Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Request a Ride</DialogTitle>
            <DialogDescription>
              Send a message to the driver to request a seat
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="requestMessage">Message (optional)</Label>
              <Textarea
                id="requestMessage"
                placeholder="Introduce yourself, mention any pickup preferences..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false);
                setSelectedCarpool(null);
                setRequestMessage("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestRide}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
