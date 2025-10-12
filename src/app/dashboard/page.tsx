
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

import { useProjectContext } from '@/context/project-context';
import { getSession, signOut } from '@/lib/auth';
import { api } from '@/lib/api';

interface Album {
  id: string;
  name: string;
  coverArtUrl?: string;
}

export default function DashboardPage() {
  const { createAlbum } = useProjectContext();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isAddAlbumDialogOpen, setIsAddAlbumDialogOpen] = useState(false);
  const [isAlbumSettingsOpen, setIsAlbumSettingsOpen] = useState(false);
  const [isDeleteAlbumOpen, setIsDeleteAlbumOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    const { idToken } = getSession();
    if (!idToken) router.replace('/login');
  }, [router]);

  // hydrate albums from API
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setProgress(15);
        const timer = setInterval(() => setProgress((p) => (p < 85 ? p + 5 : p)), 200);
        const result = await api.listAlbums();
        const items = result.items || [];
        const mapped = await Promise.all(items.map(async (a: any) => {
          let coverArtUrl: string | undefined;
          if (a.coverArtKey) {
            try {
              const signed = await api.presign({ key: a.coverArtKey, action: 'get' });
              coverArtUrl = signed.url;
            } catch {}
          }
          return { id: a.albumId, name: a.name, coverArtUrl } as Album;
        }));
        setAlbums(mapped);
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => setIsLoading(false), 300);
      } catch {}
    })();
  }, []);

  const handleLogout = () => {
    signOut();
  };

  const handleAddAlbum = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const albumName = formData.get("albumName") as string;
    const coverArtFile = formData.get("coverArt") as File;

    if (albums.some(album => album.name.toLowerCase() === albumName.toLowerCase())) {
        
        return;
    }

    if (albumName) {
      const albumId = albumName.toLowerCase().replace(/\s+/g, '-');
      const newAlbum: Album = {
        id: albumId,
        name: albumName,
      };

      let coverArtKey: string | undefined;
      if (coverArtFile && coverArtFile.size > 0) {
        try {
          const buf = await coverArtFile.arrayBuffer();
          const hash = await crypto.subtle.digest('SHA-256', buf).then(d => Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join(''));
          const presign = await api.presign({ filename: coverArtFile.name, contentType: coverArtFile.type || 'image/png', action: 'put', hash });
          await fetch(presign.url, { method: 'PUT', body: coverArtFile, headers: { 'content-type': coverArtFile.type || 'image/png' } });
          coverArtKey = presign.key;
        } catch {}
      }
      
      createAlbum(albumId, albumName);
      try { await api.createAlbum({ albumId, name: albumName, coverArtKey: coverArtKey ?? null }); } catch {}
      if (coverArtKey) {
        try {
          const signed = await api.presign({ key: coverArtKey, action: 'get' });
          newAlbum.coverArtUrl = signed.url;
        } catch {}
      }
      setAlbums(prev => [...prev, newAlbum]);
      setIsAddAlbumDialogOpen(false);
      e.currentTarget.reset();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-background to-background">
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>
      )}
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="border border-primary/50 px-3 py-1 rounded-sm h-auto text-base">
              <span className="font-bold text-primary">StalkIQ</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>StalkIQ</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Album cover settings */}
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setIsAlbumSettingsOpen(true)}>
              Album cover settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/shared" className="w-full">Shared</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setIsDeleteAlbumOpen(true)} className="text-red-500 focus:text-red-500">
              Delete album
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group block cursor-pointer"
              aria-label={`Open ${album.name}`}
              onClick={() => router.push(`/projects?album=${encodeURIComponent(album.id)}`)}
            >
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 relative overflow-hidden border border-border bg-black/30 shadow-2xl shadow-primary/20 backdrop-blur-lg">
                {album.coverArtUrl ? (
                  <Image src={album.coverArtUrl} alt={`${album.name} cover art`} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
                    <span className="text-xl font-bold text-muted-foreground">{album.name}</span>
                  </div>
                )}
              </div>
              <p className="text-center mt-3 text-base font-medium transition-colors group-hover:text-primary">
                {album.name}
              </p>
            </div>
          ))}
          <div className="flex flex-col items-center justify-center w-48 h-48 md:w-56 md:h-56 rounded-2xl border-2 border-dashed border-border/50 bg-black/20 backdrop-blur-lg shadow-primary/10 transition-all duration-300 hover:border-primary hover:shadow-primary/20">
              <Button variant="ghost" size="icon" className="w-20 h-20 text-primary transition-transform hover:scale-110" onClick={() => setIsAddAlbumDialogOpen(true)}>
                <Plus className="w-12 h-12" />
              </Button>
               <p className="mt-3 text-base font-medium text-muted-foreground">Add New Album</p>
          </div>
        </div>
      </main>

      {/* Detached album settings dialog to avoid menu closing issues */}
      <Dialog open={isAlbumSettingsOpen} onOpenChange={setIsAlbumSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Album settings</DialogTitle>
            <DialogDescription>Change name or cover for an album.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget as HTMLFormElement);
            const albumId = data.get('albumId') as string;
            const newName = (data.get('newName') as string) || undefined;
            const file = (data.get('newCover') as File);
            let coverKey: string | null | undefined = undefined;
            if (file && file.size > 0) {
              const buf = await file.arrayBuffer();
              const hash = await crypto.subtle.digest('SHA-256', buf).then(d => Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join(''));
              const presign = await api.presign({ filename: file.name, contentType: file.type || 'image/png', action: 'put', hash });
              await fetch(presign.url, { method: 'PUT', body: file, headers: { 'content-type': file.type || 'image/png' } });
              coverKey = presign.key;
            }
            const payload: any = { albumId };
            if (typeof coverKey !== 'undefined') payload.coverArtKey = coverKey;
            if (newName) payload.name = newName;
            const updated = await api.updateAlbumCover(payload);
            let coverUrl: string | undefined;
            if (updated.coverArtKey) {
              try { const s = await api.presign({ key: updated.coverArtKey, action: 'get' }); coverUrl = s.url; } catch {}
            }
            setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, name: updated.name || a.name, coverArtUrl: coverUrl ?? a.coverArtUrl } : a));
            setIsAlbumSettingsOpen(false);
          }}>
            <div className="grid gap-3 py-2">
              <Label className="text-sm">Album</Label>
              <select name="albumId" className="bg-input/50 rounded p-2">
                {albums.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
              <Label className="text-sm mt-3">New name</Label>
              <Input name="newName" placeholder="Leave blank to keep current" />
              <Label className="text-sm mt-3">New cover</Label>
              <Input name="newCover" type="file" accept="image/*" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete album dialog */}
      <Dialog open={isDeleteAlbumOpen} onOpenChange={setIsDeleteAlbumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete album</DialogTitle>
            <DialogDescription>Deletes the album and all its projects. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget as HTMLFormElement);
            const albumId = data.get('albumId') as string;
            await api.deleteAlbum(albumId);
            setAlbums(prev => prev.filter(a => a.id !== albumId));
            setIsDeleteAlbumOpen(false);
          }}>
            <div className="grid gap-3 py-2">
              <Label className="text-sm">Album</Label>
              <select name="albumId" className="bg-input/50 rounded p-2">
                {albums.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="destructive">Delete</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddAlbumDialogOpen} onOpenChange={setIsAddAlbumDialogOpen}>
        <DialogContent className="border-border bg-black/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Add New Album</DialogTitle>
            <DialogDescription>
              Give your new album a name and optionally add cover art.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAlbum}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="albumName" className="text-right">
                  Name
                </Label>
                <Input
                  id="albumName"
                  name="albumName"
                  placeholder="e.g., Summer Vibes"
                  className="col-span-3 bg-input/50"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coverArt" className="text-right">
                  Cover Art
                </Label>
                <Input
                  id="coverArt"
                  name="coverArt"
                  type="file"
                  className="col-span-3 file:text-foreground"
                  accept="image/*"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Create Album</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
