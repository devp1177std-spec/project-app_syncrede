'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { Button } from './ui/button';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when opening with new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirmCrop = async () => {
    if (!imageRef.current || !imageSrc) return;

    const canvas = document.createElement('canvas');
    const cropSize = 320;
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.clip();

    const img = imageRef.current;
    const displaySize = 240; // Diameter of container viewport
    const scale = (img.naturalWidth / displaySize) * zoom;

    // Calculate source rect
    const sx = (displaySize / 2 - position.x) * (img.naturalWidth / (displaySize * zoom)) - cropSize / (2 * zoom);
    const sy = (displaySize / 2 - position.y) * (img.naturalHeight / (displaySize * zoom)) - cropSize / (2 * zoom);

    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
      cropSize / 2 - (displaySize * zoom) / 2 + position.x * (cropSize / displaySize),
      cropSize / 2 - (displaySize * zoom) / 2 + position.y * (cropSize / displaySize),
      displaySize * zoom * (cropSize / displaySize),
      displaySize * zoom * (cropSize / displaySize),
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        onCropComplete(blob, previewUrl);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[350px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Crop Profile Photo</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Circular Viewport */}
        <div
          className="relative w-[240px] h-[240px] mx-auto rounded-full overflow-hidden border-2 border-blue-500 shadow-inner bg-slate-100 flex items-center justify-center cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop Target"
            draggable={false}
            className="absolute max-w-none transition-transform pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />
          {/* Subtle Circular Grid Guide */}
          <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none" />
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min="0.8"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <ZoomIn className="w-4 h-4 text-slate-400" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl h-10 border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmCrop}
            className="flex-1 rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Check className="w-4 h-4" />
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
