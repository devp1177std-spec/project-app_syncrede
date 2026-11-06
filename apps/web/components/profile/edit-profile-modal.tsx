'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  AtSign,
  MapPin,
  Link2,
  Camera,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { clientProfileSchema, ClientProfileInput } from '@social/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageCropperModal } from '@/components/image-cropper-modal';
import { useAuth } from '@/providers/auth-provider';
import { useUsernameCheck } from '@/hooks/use-username-check';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import { UserProfileResponse } from '@social/types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileResponse;
  onProfileUpdated?: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    avatarUrl,
    setAvatarUrl,
    isCropperOpen,
    selectedRawImage,
    handleFileSelect,
    handleCropComplete,
    closeCropper,
  } = useAvatarUpload();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientProfileInput>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: profile.displayName || '',
      username: profile.username || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      avatarUrl: profile.avatar || '',
      skip: false,
    },
  });

  // Sync initial values when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatarUrl: profile.avatar || '',
        skip: false,
      });
      setAvatarUrl(profile.avatar || null);
      setFormError(null);
    }
  }, [isOpen, profile, reset, setAvatarUrl]);

  const usernameValue = watch('username') || '';
  const bioValue = watch('bio') || '';

  const isUsernameChanged = usernameValue.toLowerCase() !== (profile.username || '').toLowerCase();
  const { isChecking, isAvailable, suggestions, isValidFormat } =
    useUsernameCheck(isUsernameChanged ? usernameValue : '');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const onSubmit = async (data: ClientProfileInput) => {
    setFormError(null);

    if (isUsernameChanged && isAvailable === false) {
      setFormError('Please select an available username');
      return;
    }

    const res = await updateProfile({
      name: data.name || undefined,
      username: data.username || undefined,
      bio: data.bio || undefined,
      location: data.location || undefined,
      website: data.website || undefined,
      avatarUrl: avatarUrl || undefined,
      completeOnboarding: true,
      skip: false,
    });

    if (res.success) {
      onProfileUpdated?.();
      onClose();
    } else {
      setFormError(res.error || 'Failed to update profile');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Sheet */}
      <div className="relative w-full sm:max-w-md max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Edit Profile</h2>
            <p className="text-xs text-slate-400">Update your public profile details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
          {formError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl">
              {formError}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept="image/*"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group"
            >
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center text-slate-300 shadow-sm transition group-hover:border-blue-400">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 stroke-[1.25]" />
                )}
              </div>

              <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110">
                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Change profile photo
            </button>
          </div>

          <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Full Name */}
            <Input
              id="name"
              label="Full Name"
              placeholder="Your Name"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Username with Live Check */}
            <div className="space-y-1">
              <Input
                id="username"
                label="Username"
                placeholder="username"
                leftIcon={<AtSign className="w-4 h-4 text-slate-400" />}
                rightAdornment={
                  isUsernameChanged && isValidFormat ? (
                    isChecking ? (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                      </span>
                    ) : isAvailable === true ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 animate-in fade-in">
                        <Check className="w-3 h-3 stroke-[3]" /> Available
                      </span>
                    ) : isAvailable === false ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/60">
                        Taken
                      </span>
                    ) : null
                  ) : null
                }
                error={errors.username?.message}
                {...register('username')}
              />

              {isUsernameChanged && isAvailable === false && suggestions.length > 0 && (
                <div className="text-[11px] text-slate-500 pl-1 pt-0.5">
                  <span>Suggestions:{' '}</span>
                  <span className="inline-flex flex-wrap gap-1 mt-1">
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setValue('username', sug, { shouldValidate: true })}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-blue-600 font-medium rounded text-[11px]"
                      >
                        {sug}
                      </button>
                    ))}
                  </span>
                </div>
              )}
            </div>

            {/* Bio with Live 0/150 Counter */}
            <Textarea
              id="bio"
              label="Bio"
              charCount={bioValue.length}
              maxChars={150}
              placeholder="Write a short bio to introduce yourself..."
              error={errors.bio?.message}
              {...register('bio')}
            />

            {/* Location */}
            <Input
              id="location"
              label="Location (Optional)"
              placeholder="e.g. San Francisco, CA"
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              error={errors.location?.message}
              {...register('location')}
            />

            {/* Website */}
            <Input
              id="website"
              label="Website (Optional)"
              placeholder="https://yourwebsite.com"
              leftIcon={<Link2 className="w-4 h-4 text-slate-400" />}
              error={errors.website?.message}
              {...register('website')}
            />
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={selectedRawImage}
        onClose={closeCropper}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
