'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginFormSchema, LoginFormInput } from '@social/shared';
import { HeaderBrand } from '@/components/header-brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, loginWithGoogle, loginWithApple, isOnboarded } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormInput) => {
    setFormError(null);
    const res = await loginWithCredentials(data.identifier, data.password);
    if (res.success) {
      if (!isOnboarded) {
        router.push('/create-profile');
      } else {
        router.push('/');
      }
    } else {
      setFormError(res.error || 'Invalid credentials');
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    setIsSocialLoading(true);
    const res = await loginWithGoogle();
    setIsSocialLoading(false);
    if (res.success) {
      router.push('/');
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  const handleAppleLogin = async () => {
    setFormError(null);
    const res = await loginWithApple();
    if (!res.success && res.error) {
      setFormError(res.error);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 pt-2">
      <div className="w-full space-y-6">
        {/* Header Branding */}
        <HeaderBrand />

        {/* Title & Subtitle */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500">
            Log in to continue to SocialFeed
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl">
              {formError}
            </div>
          )}

          {/* Single Identifier Field: Email or Username */}
          <Input
            id="identifier"
            label="Email or Username"
            placeholder="Enter your email or username"
            leftIcon={<AtSign className="w-4 h-4 text-slate-400" />}
            error={errors.identifier?.message}
            {...register('identifier')}
          />

          {/* Password Field */}
          <div className="space-y-1.5">
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Forgot password link */}
            <div className="flex justify-end pr-0.5">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Primary Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Logging In...
              </span>
            ) : (
              'Log In'
            )}
          </Button>
        </form>

        {/* OR Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
              OR
            </span>
          </div>
        </div>

        {/* Social Logins */}
        <div className="space-y-2.5">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSocialLoading || isSubmitting}
            className="w-full h-11 px-4 border border-slate-200 hover:bg-slate-50/80 active:scale-[0.99] disabled:opacity-60 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-700 transition-colors"
          >
            {isSocialLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Continue with Apple */}
          <button
            type="button"
            onClick={handleAppleLogin}
            disabled={isSocialLoading || isSubmitting}
            className="w-full h-11 px-4 border border-slate-200 hover:bg-slate-50/80 active:scale-[0.99] disabled:opacity-60 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-700 transition-colors"
          >
            {/* Apple Icon */}
            <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-5.7-8.71-10.22-18.73-13.56-30.06-3.34-11.34-5.01-22.14-5.01-32.4 0-14.34 3.48-26.04 10.45-35.09 6.97-9.05 15.63-13.67 25.99-13.88 4.93 0 10.37 1.25 16.32 3.75 5.96 2.51 9.94 3.76 11.96 3.76 1.63 0 5.69-1.25 12.18-3.76 6.49-2.5 11.83-3.75 16.03-3.75 8.71.21 16.09 2.97 22.14 8.27 6.06 5.3 10.37 11.83 12.95 19.58-7.73 4.69-11.75 11.12-12.06 19.29-.32 7.08 2.29 13.4 7.82 18.96 5.53 5.55 12.18 8.87 19.95 9.95-1.96 5.99-4.3 11.77-7.03 17.34zM119.22 32.55c0-6.97 2.45-13.72 7.36-20.25 4.9-6.53 11.05-10.74 18.44-12.63.11 1.09.16 1.96.16 2.61 0 7.08-2.67 14.05-8.01 20.91-5.34 6.86-11.97 10.87-19.89 12.03-.43-.87-.65-1.5-.65-2.67z" />
            </svg>
            Continue with Apple
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-bold text-blue-600 hover:text-blue-700 transition"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
