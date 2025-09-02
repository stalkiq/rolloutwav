
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
import { Label } from "@/components/ui/label";

import { useProjectContext } from '@/context/project-context';

interface Album {
  id: string;
  name: string;
  coverArtUrl?: string;
}

export default function DashboardPage() {
  const { createAlbum } = useProjectContext();
  const [albums, setAlbums] = useState<Album[]>([{ id: 'music1', name: 'Music1' }]);
  const [isAddAlbumDialogOpen, setIsAddAlbumDialogOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('authenticated');
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    router.push('/');
  };

  const handleAddAlbum = (e: React.FormEvent<HTMLFormElement>) => {
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

      if (coverArtFile && coverArtFile.size > 0) {
        newAlbum.coverArtUrl = URL.createObjectURL(coverArtFile);
      }
      
      createAlbum(albumId, albumName);
      setAlbums([...albums, newAlbum]);
      setIsAddAlbumDialogOpen(false);
      e.currentTarget.reset();
      
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-background to-background">
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
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
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
            <Link href={`/projects?album=${album.id}`} key={album.id} className="group">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 relative overflow-hidden border border-border bg-black/30 shadow-2xl shadow-primary/20 backdrop-blur-lg">
                {album.coverArtUrl ? (
                   <Image src={album.coverArtUrl} alt={`${album.name} cover art`} layout="fill" objectFit="cover" />
                ) : (
                   <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
                    <span className="text-xl font-bold text-muted-foreground">{album.name}</span>
                   </div>
                )}
              </div>
              <p className="text-center mt-3 text-base font-medium transition-colors group-hover:text-primary">
                {album.name}
              </p>
            </Link>
          ))}
          <div className="flex flex-col items-center justify-center w-48 h-48 md:w-56 md:h-56 rounded-2xl border-2 border-dashed border-border/50 bg-black/20 backdrop-blur-lg shadow-primary/10 transition-all duration-300 hover:border-primary hover:shadow-primary/20">
              <Button variant="ghost" size="icon" className="w-20 h-20 text-primary transition-transform hover:scale-110" onClick={() => setIsAddAlbumDialogOpen(true)}>
                <Plus className="w-12 h-12" />
              </Button>
               <p className="mt-3 text-base font-medium text-muted-foreground">Add New Album</p>
          </div>
        </div>
      </main>

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
