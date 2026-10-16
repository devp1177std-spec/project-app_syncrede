'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedRawImage(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob, previewUrl: string) => {
    // Show preview immediately for instantaneous feedback
    setAvatarUrl(previewUrl);
    setIsUploading(true);
    setUploadError(null);

    try {
      const filename = `avatar-${Date.now()}.jpg`;
      const presignedRes = await apiClient.storage.getPresignedUrl(
        filename,
        'image/jpeg',
      );

      if (presignedRes.success && presignedRes.data) {
        const { uploadUrl, publicUrl } = presignedRes.data;
        const uploaded = await apiClient.storage.uploadToPresignedUrl(
          uploadUrl,
          croppedBlob,
          'image/jpeg',
        );

        if (uploaded) {
          setAvatarUrl(publicUrl);
        } else {
          // Keep local previewUrl as fallback so user is not blocked
          console.warn('Presigned upload failed, using local preview');
        }
      }
    } catch (e: any) {
      console.warn('Avatar upload network error, using local preview:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const closeCropper = () => {
    setIsCropperOpen(false);
    setSelectedRawImage(null);
  };

  return {
    avatarUrl,
    setAvatarUrl,
    isUploading,
    uploadError,
    isCropperOpen,
    selectedRawImage,
    handleFileSelect,
    handleCropComplete,
    closeCropper,
  };
}
