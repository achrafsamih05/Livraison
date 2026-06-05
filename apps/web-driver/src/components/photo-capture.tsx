'use client';

import * as React from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;

/**
 * Capture-or-pick a delivery photo from the device camera. Downscales and
 * re-encodes to JPEG so the data URL stays small enough to queue offline.
 */
export function PhotoCapture({
  onChange,
}: {
  onChange: (dataUrl: string | undefined) => void;
}): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = React.useState<string | undefined>(undefined);

  const handleFile = async (file: File): Promise<void> => {
    const dataUrl = await downscale(file);
    setPreview(dataUrl);
    onChange(dataUrl);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Delivery photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file !== undefined) {
            void handleFile(file);
          }
        }}
      />
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
        <Camera className="size-4" /> {preview ? 'Retake photo' : 'Add photo'}
      </Button>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Delivery proof preview"
          className="h-40 w-full rounded-md object-cover"
        />
      ) : null}
    </div>
  );
}

function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load image'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
          reject(new Error('Canvas unsupported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
