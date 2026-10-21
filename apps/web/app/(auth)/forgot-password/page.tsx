'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { HeaderBrand } from '@/components/header-brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setFormError(null);
    const res = await sendPasswordReset(data.email);
    if (res.success) {
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } else {
      setFormError(res.error || 'Failed to send password reset email');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 pt-2">
      <div className="w-full space-y-6">
        {/* Header Branding */}
        <HeaderBrand showBack />

        {/* Title & Subtitle */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500">
            {isSuccess
              ? 'Check your inbox for password reset instructions'
              : "Enter your account's email to receive a password reset link"}
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-6 pt-4 text-center">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Email Sent Successfully
              </p>
              <p className="text-xs text-slate-500 leading-relaxed px-4">
                We sent a password reset link to{' '}
                <span className="font-semibold text-slate-700">{submittedEmail}</span>.
                Follow the link in the email to choose a new password.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
              </Link>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl">
                {formError}
              </div>
            )}

            {/* Email Field */}
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="Enter your registered email"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 mt-4"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending Link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <div className="pt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-xs text-slate-500">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-bold text-blue-600 hover:text-blue-700 transition"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
