
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Eye, EyeOff, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    // Optional: If the user is already authenticated, redirect them away from the login page.
    const isAuthenticated = localStorage.getItem('authenticated');
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [router]);


  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would perform authentication here.
    // For this prototype, we'll just set a flag in localStorage.
    localStorage.setItem('authenticated', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-background to-background">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-black/30 p-8 shadow-2xl shadow-primary/20 backdrop-blur-lg">
        <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-6 w-6 text-muted-foreground">
            <X className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center space-y-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-12 w-12 text-primary"
            >
              <path d="M3 15v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 13a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2z"/>
              <path d="M3 13a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
              <circle cx="12" cy="13" r="5"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
              <User className="h-5 w-5" />
              Sign in
            </h1>
            <p className="text-muted-foreground">Keep it all together and you'll be fine</p>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" placeholder="test" defaultValue="test" className="mt-1 bg-input/50" required/>
          </div>
          <div className="relative">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type={isPasswordVisible ? "text" : "password"} 
              placeholder="••••••••" 
              defaultValue="test"
              className="mt-1 bg-input/50"
              required
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{isPasswordVisible ? 'Hide' : 'Show'} password</span>
            </Button>
          </div>
          <div className="text-right">
            <Button variant="link" className="p-0 text-sm h-auto text-muted-foreground">Forgot Password</Button>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
