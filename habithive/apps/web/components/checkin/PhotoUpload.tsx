"use client";
 
import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui";
 
export interface PhotoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}
 
/**
 * Uploads directly to Cloudinary using a short-lived signature fetched from
 * /api/uploads/sign (see lib/services/upload.service.ts) — the file never
 * passes through our own server, and the API secret never reaches the
 * browser.
 */
export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
 
    setError(null);
    setUploading(true);
 
    try {
      const signRes = await fetch("/api/uploads/sign");
      if (!signRes.ok) {
        throw new Error(
          signRes.status === 503 ? "Photo uploads aren't set up yet." : "Couldn't start upload."
        );
      }
      const { cloudName, apiKey, timestamp, signature, folder } = await signRes.json();
 
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);
 
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
 
      if (!uploadRes.ok) throw new Error("Upload failed. Please try again.");
 
      const data = await uploadRes.json();
      onChange(data.secure_url as string);
    } catch (err: any) {
      setError(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
 
  if (value) {
    return (
      <div className="relative inline-block">
        <Image
          src={value}
          alt="Check-in photo"
          width={120}
          height={120}
          className="h-28 w-28 rounded-lg object-cover"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove photo"
          className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-1 text-white shadow"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
 
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
        id="checkin-photo-input"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {!uploading && <Camera className="h-4 w-4" />}
        {uploading ? "Uploading…" : "Add photo"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}