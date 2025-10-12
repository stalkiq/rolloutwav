"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeLogin, scheduleRefresh } from '@/lib/auth';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const code = params.get('code');
    (async () => {
      try {
        if (code) await completeLogin(code);
        scheduleRefresh();
        router.replace('/dashboard');
      } catch {
        router.replace('/login');
      }
    })();
  }, [router, params]);
  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackInner />
    </Suspense>
  );
}


