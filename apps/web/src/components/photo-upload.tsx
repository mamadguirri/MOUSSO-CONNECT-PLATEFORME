"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X } from "lucide-react";

interface PhotoUploadProps {
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  existingPhotos?: { id: string; url: string }[];
  onRemoveExisting?: (id: string) => void;
}

export function PhotoUpload({ maxFiles = 5, onFilesChange, existingPhotos = [], onRemoveExisting }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const remaining = maxFiles - existingPhotos.length - previews.length;
      const accepted = Array.from(newFiles).slice(0, remaining);
      const newPreviews = accepted.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      const updated = [...previews, ...newPreviews];
      setPreviews(updated);
      onFilesChange(updated.map((p) => p.file));
    },
    [maxFiles, existingPhotos.length, previews, onFilesChange]
  );

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
  };

  const totalPhotos = existingPhotos.length + previews.length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {existingPhotos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
            {onRemoveExisting && (
              <button
                onClick={() => onRemoveExisting(photo.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {previews.map((preview, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
            <img src={preview.url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removePreview(i)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {totalPhotos < maxFiles && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-btn p-6 text-center hover:border-musso-pink transition-colors"
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <span className="text-sm text-gray-500">
            Ajouter des photos ({totalPhotos}/{maxFiles})
          </span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
