"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type SharedItem = {
  projectId: string;
  projectName: string;
  ownerName: string;
  albumName?: string | null;
  permissions: 'viewer' | 'editor' | 'admin';
};

export default function SharedPage() {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder: when backend is ready, replace with api.sharedList()
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Shared with me</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            Projects shared with you will appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.projectId} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{it.projectName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {it.ownerName} {it.albumName ? `• ${it.albumName}` : ''} • {it.permissions}
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/project?id=${encodeURIComponent(it.projectId)}`}>Open</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


