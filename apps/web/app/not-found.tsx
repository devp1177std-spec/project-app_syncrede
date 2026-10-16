import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#121214] flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] min-h-[500px] bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
        <p className="text-xs text-slate-500">The requested page could not be found.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
