"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Plus,
  Hotel,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Star,
  Copy,
  ToggleLeft,
  ToggleRight,
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Dumbbell,
  Coffee,
  Check,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Common hotel amenities
const AMENITIES_OPTIONS = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "breakfast", label: "Breakfast", icon: UtensilsCrossed },
  { id: "pool", label: "Pool", icon: Waves },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "restaurant", label: "Restaurant", icon: Coffee },
];

interface RoomType {
  id: string;
  name: string;
  pricePerNightCents: number;
  quantity: number;
  sold: number;
  maxGuests: number;
  description?: string;
}

interface HotelFormData {
  hotelName: string;
  address: string;
  city: string;
  state: string;
  description: string;
  amenities: string[];
  starRating: number;
  checkInDate: string;
  checkOutDate: string;
  specialInstructions: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  roomTypes: RoomType[];
}

interface HotelPackageData {
  _id: Id<"hotelPackages">;
  hotelName: string;
  address: string;
  city: string;
  state: string;
  description?: string;
  amenities?: string[];
  starRating?: number;
  checkInDate: number;
  checkOutDate: number;
  specialInstructions?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  roomTypes: RoomType[];
  isActive: boolean;
}

const emptyFormData: HotelFormData = {
  hotelName: "",
  address: "",
  city: "",
  state: "",
  description: "",
  amenities: [],
  starRating: 3,
  checkInDate: "",
  checkOutDate: "",
  specialInstructions: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  roomTypes: [
    {
      id: `room-${Date.now()}`,
      name: "",
      pricePerNightCents: 0,
      quantity: 0,
      sold: 0,
      maxGuests: 2,
      description: "",
    },
  ],
};

export default function OrganizerHotelsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [showAddHotel, setShowAddHotel] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Id<"hotelPackages"> | null>(null);
  const [formData, setFormData] = useState<HotelFormData>(emptyFormData);

  const deleteConfirmDialog = useConfirmDialog();
  const [packageToDelete, setPackageToDelete] = useState<Id<"hotelPackages"> | null>(null);

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const hotelPackages = useQuery(api.hotels.queries.getOrganizerHotelPackages, { eventId });
  const hotelStats = useQuery(api.hotels.queries.getHotelStats, { eventId });

  const createHotelPackage = useMutation(api.hotels.mutations.createHotelPackage);
  const updateHotelPackage = useMutation(api.hotels.mutations.updateHotelPackage);
  const deleteHotelPackage = useMutation(api.hotels.mutations.deleteHotelPackage);
  const toggleActive = useMutation(api.hotels.mutations.toggleHotelPackageActive);
  const duplicatePackage = useMutation(api.hotels.mutations.duplicateHotelPackage);

  const isLoading = event === undefined;

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading hotel packages..." />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-destructive">Event not found</div>
      </div>
    );
  }

  const handleOpenAddHotel = () => {
    // Pre-fill dates based on event
    const eventDate = event.startDate
      ? new Date(event.startDate)
      : new Date();
    const checkIn = new Date(eventDate);
    checkIn.setDate(checkIn.getDate() - 1); // Day before event
    const checkOut = new Date(eventDate);
    checkOut.setDate(checkOut.getDate() + 1); // Day after event

    setFormData({
      ...emptyFormData,
      city: typeof event.location === "object" ? event.location.city : "",
      state: typeof event.location === "object" ? event.location.state : "",
      checkInDate: checkIn.toISOString().split("T")[0],
      checkOutDate: checkOut.toISOString().split("T")[0],
      roomTypes: [
        {
          id: `room-${Date.now()}`,
          name: "",
          pricePerNightCents: 0,
          quantity: 0,
          sold: 0,
          maxGuests: 2,
          description: "",
        },
      ],
    });
    setEditingPackage(null);
    setShowAddHotel(true);
  };

  const handleEditPackage = (pkg: HotelPackageData) => {
    setFormData({
      hotelName: pkg.hotelName,
      address: pkg.address,
      city: pkg.city,
      state: pkg.state,
      description: pkg.description || "",
      amenities: pkg.amenities || [],
      starRating: pkg.starRating || 3,
      checkInDate: new Date(pkg.checkInDate).toISOString().split("T")[0],
      checkOutDate: new Date(pkg.checkOutDate).toISOString().split("T")[0],
      specialInstructions: pkg.specialInstructions || "",
      contactName: pkg.contactName || "",
      contactPhone: pkg.contactPhone || "",
      contactEmail: pkg.contactEmail || "",
      roomTypes: pkg.roomTypes,
    });
    setEditingPackage(pkg._id);
    setShowAddHotel(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.hotelName || !formData.address || !formData.city || !formData.state) {
      toast.error("Please fill in all required hotel fields");
      return;
    }

    if (!formData.checkInDate || !formData.checkOutDate) {
      toast.error("Please set check-in and check-out dates");
      return;
    }

    const validRoomTypes = formData.roomTypes.filter(
      (rt) => rt.name && rt.pricePerNightCents > 0 && rt.quantity > 0
    );

    if (validRoomTypes.length === 0) {
      toast.error("Please add at least one valid room type");
      return;
    }

    try {
      const checkInDate = new Date(formData.checkInDate).getTime();
      const checkOutDate = new Date(formData.checkOutDate).getTime();

      if (editingPackage) {
        // Update existing package
        await updateHotelPackage({
          packageId: editingPackage,
          hotelName: formData.hotelName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          description: formData.description || undefined,
          amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
          starRating: formData.starRating,
          checkInDate,
          checkOutDate,
          specialInstructions: formData.specialInstructions || undefined,
          contactName: formData.contactName || undefined,
          contactPhone: formData.contactPhone || undefined,
          contactEmail: formData.contactEmail || undefined,
          roomTypes: validRoomTypes,
        });
        toast.success("Hotel package updated!");
      } else {
        // Create new package
        await createHotelPackage({
          eventId,
          hotelName: formData.hotelName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          description: formData.description || undefined,
          amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
          starRating: formData.starRating,
          checkInDate,
          checkOutDate,
          specialInstructions: formData.specialInstructions || undefined,
          contactName: formData.contactName || undefined,
          contactPhone: formData.contactPhone || undefined,
          contactEmail: formData.contactEmail || undefined,
          roomTypes: validRoomTypes,
        });
        toast.success("Hotel package created!");
      }

      setShowAddHotel(false);
      setFormData(emptyFormData);
      setEditingPackage(null);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save hotel package");
    }
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;
    try {
      await deleteHotelPackage({ packageId: packageToDelete });
      toast.success("Hotel package deleted");
      setPackageToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const handleToggleActive = async (packageId: Id<"hotelPackages">) => {
    try {
      await toggleActive({ packageId });
      toast.success("Status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleDuplicate = async (packageId: Id<"hotelPackages">) => {
    try {
      await duplicatePackage({ packageId });
      toast.success("Hotel package duplicated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate");
    }
  };

  const addRoomType = () => {
    setFormData({
      ...formData,
      roomTypes: [
        ...formData.roomTypes,
        {
          id: `room-${Date.now()}`,
          name: "",
          pricePerNightCents: 0,
          quantity: 0,
          sold: 0,
          maxGuests: 2,
          description: "",
        },
      ],
    });
  };

  const updateRoomType = (index: number, field: keyof RoomType, value: string | number) => {
    const updated = [...formData.roomTypes];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, roomTypes: updated });
  };

  const removeRoomType = (index: number) => {
    if (formData.roomTypes.length <= 1) {
      toast.error("Must have at least one room type");
      return;
    }
    setFormData({
      ...formData,
      roomTypes: formData.roomTypes.filter((_, i) => i !== index),
    });
  };

  const toggleAmenity = (amenityId: string) => {
    const current = formData.amenities;
    if (current.includes(amenityId)) {
      setFormData({ ...formData, amenities: current.filter((a) => a !== amenityId) });
    } else {
      setFormData({ ...formData, amenities: [...current, amenityId] });
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/organizer/events/${eventId}`}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Hotel Packages</h1>
                <p className="text-white/80 text-sm">{event.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        {hotelStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Hotel className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{hotelStats.activePackages}</p>
                    <p className="text-xs text-muted-foreground">Active Hotels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Users className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{hotelStats.totalReservations}</p>
                    <p className="text-xs text-muted-foreground">Reservations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(hotelStats.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{hotelStats.fillRate}%</p>
                    <p className="text-xs text-muted-foreground">Fill Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Hotel Button */}
        <div className="mb-6">
          <Button onClick={handleOpenAddHotel} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Hotel Package
          </Button>
        </div>

        {/* Hotel Packages List */}
        {hotelPackages && hotelPackages.length > 0 ? (
          <div className="space-y-4">
            {hotelPackages.map((pkg) => (
              <Card key={pkg._id} className={!pkg.isActive ? "opacity-60" : ""}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{pkg.hotelName}</h3>
                        {pkg.starRating && (
                          <div className="flex items-center gap-0.5">
                            {[...Array(pkg.starRating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 text-warning fill-warning"
                              />
                            ))}
                          </div>
                        )}
                        {!pkg.isActive && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        {pkg.address}, {pkg.city}, {pkg.state}
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {pkg.description}
                        </p>
                      )}
                      {pkg.amenities && pkg.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {pkg.amenities.map((amenity) => {
                            const option = AMENITIES_OPTIONS.find(
                              (a) => a.id === amenity
                            );
                            const Icon = option?.icon || Check;
                            return (
                              <span
                                key={amenity}
                                className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                              >
                                <Icon className="w-3 h-3" />
                                {option?.label || amenity}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {format(new Date(pkg.checkInDate), "MMM d")} -{" "}
                          {format(new Date(pkg.checkOutDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      {/* Room Types */}
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Room Types:</p>
                        <div className="grid gap-2">
                          {pkg.roomTypes.map((rt) => (
                            <div
                              key={rt.id}
                              className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded text-sm"
                            >
                              <div>
                                <span className="font-medium">{rt.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  (up to {rt.maxGuests} guests)
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">
                                  {formatCurrency(rt.pricePerNightCents)}/night
                                </span>
                                <span className="text-muted-foreground">
                                  {rt.sold}/{rt.quantity} booked
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(pkg._id)}
                        title={pkg.isActive ? "Deactivate" : "Activate"}
                      >
                        {pkg.isActive ? (
                          <ToggleRight className="w-4 h-4 text-success" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPackage(pkg)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(pkg._id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPackageToDelete(pkg._id);
                          deleteConfirmDialog.showConfirm({
                            title: "Delete Hotel Package",
                            description: "Are you sure you want to delete this hotel package? This action cannot be undone.",
                            confirmText: "Delete",
                            variant: "destructive",
                            onConfirm: async () => {
                              try {
                                await deleteHotelPackage({ packageId: pkg._id });
                                toast.success("Hotel package deleted");
                                setPackageToDelete(null);
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Failed to delete");
                              }
                            },
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Hotel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Hotel Packages Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add partner hotels so your attendees can book accommodation near the event.
              </p>
              <Button onClick={handleOpenAddHotel}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Hotel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Hotel Modal */}
      {showAddHotel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-background">
              <h2 className="text-xl font-semibold">
                {editingPackage ? "Edit Hotel Package" : "Add Hotel Package"}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Hotel Details */}
              <div className="space-y-4">
                <h3 className="font-medium">Hotel Details</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="hotelName">Hotel Name *</Label>
                    <Input
                      id="hotelName"
                      value={formData.hotelName}
                      onChange={(e) =>
                        setFormData({ ...formData, hotelName: e.target.value })
                      }
                      placeholder="Marriott Downtown"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Chicago"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        placeholder="IL"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe the hotel..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Star Rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, starRating: rating })
                          }
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              rating <= formData.starRating
                                ? "text-warning fill-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="font-medium">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_OPTIONS.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = formData.amenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {amenity.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h3 className="font-medium">Booking Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkInDate">Check-in Date *</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) =>
                        setFormData({ ...formData, checkInDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOutDate">Check-out Date *</Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) =>
                        setFormData({ ...formData, checkOutDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Room Types */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Room Types</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addRoomType}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Room Type
                  </Button>
                </div>
                {formData.roomTypes.map((rt, index) => (
                  <div key={rt.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Room Type {index + 1}</span>
                      {formData.roomTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRoomType(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4">
                      <div>
                        <Label>Room Name *</Label>
                        <Input
                          value={rt.name}
                          onChange={(e) =>
                            updateRoomType(index, "name", e.target.value)
                          }
                          placeholder="Standard King"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Price/Night ($) *</Label>
                          <Input
                            type="number"
                            value={rt.pricePerNightCents / 100 || ""}
                            onChange={(e) =>
                              updateRoomType(
                                index,
                                "pricePerNightCents",
                                Math.round(parseFloat(e.target.value || "0") * 100)
                              )
                            }
                            placeholder="129"
                          />
                        </div>
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            value={rt.quantity || ""}
                            onChange={(e) =>
                              updateRoomType(
                                index,
                                "quantity",
                                parseInt(e.target.value || "0")
                              )
                            }
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <Label>Max Guests</Label>
                          <Input
                            type="number"
                            value={rt.maxGuests || ""}
                            onChange={(e) =>
                              updateRoomType(
                                index,
                                "maxGuests",
                                parseInt(e.target.value || "2")
                              )
                            }
                            placeholder="2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={rt.description || ""}
                          onChange={(e) =>
                            updateRoomType(index, "description", e.target.value)
                          }
                          placeholder="One king bed with city view"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact & Instructions */}
              <div className="space-y-4">
                <h3 className="font-medium">Contact & Instructions (Optional)</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) =>
                          setFormData({ ...formData, contactName: e.target.value })
                        }
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, contactPhone: e.target.value })
                        }
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, contactEmail: e.target.value })
                      }
                      placeholder="reservations@hotel.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions</Label>
                    <Textarea
                      id="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialInstructions: e.target.value,
                        })
                      }
                      placeholder="Mention 'SteppersLife Event' for group rate..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-background">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddHotel(false);
                  setFormData(emptyFormData);
                  setEditingPackage(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingPackage ? "Update Hotel" : "Add Hotel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog {...deleteConfirmDialog.props} />
    </div>
  );
}
