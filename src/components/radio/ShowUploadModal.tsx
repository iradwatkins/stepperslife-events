"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileAudio,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ShowUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users">;
}

const GENRES = [
  "Steppers",
  "R&B",
  "Soul",
  "Neo Soul",
  "Slow Jams",
  "Classic R&B",
  "House",
  "Deep House",
  "Afrobeats",
  "Jazz",
  "Gospel",
  "Mixed/Various",
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac"];

export function ShowUploadModal({ isOpen, onClose, userId }: ShowUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<"form" | "uploading" | "success" | "error">("form");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const createShow = useMutation(api.radioStreaming.createShow);
  const generateUploadUrl = useMutation(api.radioStreaming.generateShowUploadUrl);
  const completeUpload = useMutation(api.radioStreaming.completeShowUpload);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setGenre("");
    setFile(null);
    setUploadProgress(0);
    setUploadStep("form");
    setError(null);
  };

  const handleClose = () => {
    if (isUploading) {
      if (!confirm("Upload in progress. Are you sure you want to cancel?")) {
        return;
      }
    }
    resetForm();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload MP3, WAV, OGG, or FLAC files.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAudioDuration = async (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", () => {
        resolve(0);
      });
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setUploadStep("uploading");
    setError(null);

    try {
      // Step 1: Create show record
      setUploadProgress(10);
      const showId = await createShow({
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genre || undefined,
      });

      // Step 2: Get audio duration
      setUploadProgress(20);
      const duration = await getAudioDuration(file);

      // Step 3: Generate upload URL
      setUploadProgress(30);
      const uploadUrl = await generateUploadUrl();

      // Step 4: Upload file
      setUploadProgress(40);
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await response.json();

      // Step 5: Complete upload
      setUploadProgress(90);
      await completeUpload({
        showId,
        storageId,
        duration: Math.round(duration),
      });

      setUploadProgress(100);
      setUploadStep("success");
      toast.success("Show uploaded successfully!");

      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload show");
      setUploadStep("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Show
          </DialogTitle>
          <DialogDescription>
            Upload a pre-recorded mix or show to play on your station
          </DialogDescription>
        </DialogHeader>

        {uploadStep === "form" && (
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Friday Night Steppers Mix"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell listeners about this mix..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select genre" />
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

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Audio File *</Label>
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  file
                    ? "border-green-500 bg-green-50"
                    : "border-muted-foreground/25 hover:border-primary"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,.flac,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                />

                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileAudio className="w-8 h-8 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <FileAudio className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">
                      Drop audio file here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP3, WAV, OGG, FLAC up to 500MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {uploadStep === "uploading" && (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="font-medium mb-2">Uploading your show...</p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
          </div>
        )}

        {uploadStep === "success" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="font-medium text-lg mb-2">Upload Complete!</p>
            <p className="text-muted-foreground">
              Your show has been uploaded and is pending review.
            </p>
          </div>
        )}

        {uploadStep === "error" && (
          <div className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="font-medium text-lg mb-2">Upload Failed</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => setUploadStep("form")}>Try Again</Button>
          </div>
        )}

        {uploadStep === "form" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!title.trim() || !file}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Show
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
