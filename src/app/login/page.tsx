
"use client";

import { Button } from '@/components/ui/button';
import { startLogin, scheduleRefresh } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center">
      <style>{`
        @keyframes floatSlow { 0%{ transform: translateY(0) } 50%{ transform: translateY(-8px) } 100%{ transform: translateY(0) } }
      `}</style>

      {/* Decorative musical notes using emojis for unmistakable shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        {/* Top row */}
        <span className="absolute left-[6%] top-[10%] text-6xl text-primary/70 animate-[floatSlow_7s_ease-in-out_infinite]">🎵</span>
        <span className="absolute left-[28%] top-[14%] text-5xl rotate-12 text-primary/80 animate-[floatSlow_6s_ease-in-out_infinite]">🎶</span>
        <span className="absolute left-[50%] top-[8%] text-6xl -rotate-6 text-primary/60 animate-[floatSlow_8s_ease-in-out_infinite]">🎵</span>
        <span className="absolute left-[72%] top-[16%] text-5xl rotate-6 text-primary/70 animate-[floatSlow_6.8s_ease-in-out_infinite]">🎶</span>
        <span className="absolute left-[90%] top-[12%] text-6xl text-primary/70 animate-[floatSlow_7.6s_ease-in-out_infinite]">🎵</span>

        {/* Middle row */}
        <span className="absolute left-[12%] top-[45%] text-5xl -rotate-3 text-primary/70 animate-[floatSlow_6.5s_ease-in-out_infinite]">🎶</span>
        <span className="absolute left-[35%] top-[52%] text-6xl rotate-6 text-primary/60 animate-[floatSlow_7.2s_ease-in-out_infinite]">🎵</span>
        <span className="absolute left-[65%] top-[50%] text-5xl -rotate-6 text-primary/80 animate-[floatSlow_6.9s_ease-in-out_infinite]">🎶</span>
        <span className="absolute left-[88%] top-[46%] text-6xl text-primary/70 animate-[floatSlow_7.4s_ease-in-out_infinite]">🎵</span>

        {/* Bottom row */}
        <span className="absolute left-[10%] bottom-[12%] text-5xl text-primary/80 animate-[floatSlow_6s_ease-in-out_infinite]">🎶</span>
        <span className="absolute left-[30%] bottom-[8%] text-6xl -rotate-6 text-primary/70 animate-[floatSlow_8s_ease-in-out_infinite]">🎵</span>
        <span className="absolute left-[52%] bottom-[14%] text-5xl rotate-6 text-primary/60 animate-[floatSlow_7s_ease-in-out_infinite]">🎶</span>
        <span className="absolute left-[72%] bottom-[10%] text-6xl text-primary/70 animate-[floatSlow_6.7s_ease-in-out_infinite]">🎵</span>
        <span className="absolute left-[90%] bottom-[12%] text-6xl -rotate-6 text-primary/80 animate-[floatSlow_7.1s_ease-in-out_infinite]">🎶</span>
      </div>

      {/* Sign-in card (center) */}
      <div className="relative z-10 flex flex-col gap-3 w-[280px] px-4 sm:px-0">
        <div className="text-center mb-1 text-lg font-semibold tracking-wide">rollout.wav</div>
        <Button onClick={() => startLogin()} className="w-full">Sign in</Button>
        <Button variant="outline" onClick={() => startLogin({ signup: true })} className="w-full">Sign up</Button>
      </div>
    </div>
  );
}
