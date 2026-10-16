'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowRight,
  ImageIcon,
} from 'lucide-react';
import { clientProfileSchema, ClientProfileInput } from '@social/shared';
import { HeaderBrand } from '@/components/header-brand';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageCropperModal } from '@/components/image-cropper-modal';
import { useAuth } from '@/providers/auth-provider';
import { useUsernameCheck } from '@/hooks/use-username-check';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';

export default function CreateProfilePage() {
  const router = useRouter();
  const { user, updateProfile, isAuthenticated, isLoading } = useAuth();
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
    formState: { errors, isSubmitting },
  } = useForm<ClientProfileInput>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: user?.name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      avatarUrl: user?.avatarUrl || '',
      skip: false,
    },
  });

  // Keep form updated when user loads
  useEffect(() => {
    if (user) {
      if (user.name) setValue('name', user.name);
      if (user.username) setValue('username', user.username);
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [user, setValue, setAvatarUrl]);

  // Auth guard: unauthenticated -> /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const usernameValue = watch('username') || '';
  const bioValue = watch('bio') || '';

  const { isChecking, isAvailable, suggestions, isValidFormat } =
    useUsernameCheck(usernameValue);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const onSubmit = async (data: ClientProfileInput) => {
    setFormError(null);

    // If username was changed and is marked unavailable, block
    if (usernameValue !== user?.username && isAvailable === false) {
      setFormError('Please select an available username');
      return;
    }

    const res = await updateProfile({
      username: data.username || undefined,
      bio: data.bio || undefined,
      location: data.location || undefined,
      website: data.website || undefined,
      avatarUrl: avatarUrl || undefined,
      skip: false,
    });

    if (res.success) {
      router.push('/');
    } else {
      setFormError(res.error || 'Failed to update profile');
    }
  };

  const handleSkip = async () => {
    setFormError(null);
    const res = await updateProfile({
      skip: true,
    });
    if (res.success) {
      router.push('/');
    } else {
      // Force navigation to home even if backend call fails so user is not stuck
      router.push('/');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 pt-2">
      <div className="w-full space-y-4">
        {/* Header with Step 2 of 2 Pill */}
        <HeaderBrand showBack rightElement="step2" />

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create your profile
          </h1>
          <p className="text-xs text-slate-500">
            Tell us a little about yourself to get started.
          </p>
        </div>

        {/* Avatar Upload Section */}
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
            {/* Circular Avatar */}
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

            {/* Camera Badge on Bottom-Right */}
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110">
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Upload Text Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Upload profile photo
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
          {formError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl">
              {formError}
            </div>
          )}

          {/* Full Name */}
          <Input
            id="name"
            label="Full Name"
            placeholder="Sarah Chen"
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Username with Live Check */}
          <div className="space-y-1">
            <Input
              id="username"
              label="Username"
              placeholder="sarahchen"
              leftIcon={<AtSign className="w-4 h-4 text-slate-400" />}
              rightAdornment={
                isValidFormat ? (
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

            {/* Suggestions */}
            {isAvailable === false && suggestions.length > 0 && (
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

          {/* Location (Optional) */}
          <Input
            id="location"
            label="Location (Optional)"
            placeholder="e.g. San Francisco, CA"
            leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
            error={errors.location?.message}
            {...register('location')}
          />

          {/* Website (Optional) */}
          <Input
            id="website"
            label="Website (Optional)"
            placeholder="https://yourwebsite.com"
            leftIcon={<Link2 className="w-4 h-4 text-slate-400" />}
            error={errors.website?.message}
            {...register('website')}
          />

          {/* Continue Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 mt-3"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile...
              </span>
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Skip for now text button */}
        <div className="text-center pt-1 pb-2">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition p-2"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={selectedRawImage}
        onClose={closeCropper}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
