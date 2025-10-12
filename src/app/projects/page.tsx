
"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProjectDashboard } from "@/components/project-dashboard";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronsUpDown,
  Home as HomeIcon,
  LayoutGrid,
  MessageSquare,
  Plus,
  Rocket,
  Search,
  Upload,
  Settings,
  LogOut,
  Users,
  X,
} from "lucide-react";
import Link from 'next/link';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useProjectContext } from "@/context/project-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";


function ProjectsPageContent() {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  type CollaboratorAccess = { type: 'album' | 'tracks'; trackIds?: string[] };
  type Collaborator = { id: string; name: string; email: string; access: CollaboratorAccess };
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [editingCollaboratorId, setEditingCollaboratorId] = useState<string | null>(null);
  const [collabName, setCollabName] = useState("");
  const [collabEmail, setCollabEmail] = useState("");
  const [accessType, setAccessType] = useState<'album' | 'tracks'>('album');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null);
  const [tracklistCoverUrl, setTracklistCoverUrl] = useState<string | null>(null);
  const [labelCredit, setLabelCredit] = useState("");
  const [producersCredit, setProducersCredit] = useState("");
  const [writersCredit, setWritersCredit] = useState("");
  
  const { projectsByAlbum, getProjectsForAlbum, setProjectsForAlbum, updateProjectStatus } = useProjectContext();
  const [albumName, setAlbumName] = useState("Music1");
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [draggedProject, setDraggedProject] = useState<Project | null>(null);

  const currentAlbumProjects = albumId ? getProjectsForAlbum(albumId) : [];
  const allAlbumIds = Object.keys(projectsByAlbum);

  const setCurrentAlbumProjects = (projects: Project[]) => {
    if (!albumId) return;
    setProjectsForAlbum(albumId, projects);
  };

  const handleAlbumSwitch = (newAlbumId: string) => {
    router.push(`/projects?album=${newAlbumId}`);
  };


  // Helper to fetch and hydrate album projects from API (includes finalSong)
  const refreshAlbumProjects = async (album: string) => {
    try {
      // guarantee album exists locally
      if (!projectsByAlbum[album]) {
        setProjectsForAlbum(album, []);
      }
      const projectsRes = await api.listProjects(album);
      const parseFile = (f: any) => f ? ({ id: f.id, name: f.name, url: f.url, timestamp: new Date(f.timestamp) }) : null;
      const prev = projectsByAlbum[album]?.projects || [];
      const mapped: Project[] = (projectsRes.items || []).map((p: any) => {
        const prevProj = prev.find(x => x.id === p.projectId);
        return {
          id: p.projectId,
          name: p.name,
          emoji: '🎵',
          status: (prevProj?.status as any) || (p.status as any) || 'On Track',
          targetDate: p.targetDate ? new Date(p.targetDate) : new Date(Date.now() + 86400000 * 365),
          type: 'Song',
          priority: (p.priority as any) || 'No priority',
          lead: 'You',
          progress: 0,
          description: '',
          updates: [],
          artists: [],
          producers: [],
          writers: [],
          finalSong: parseFile(p.finalSong),
        };
      });
      setProjectsForAlbum(album, mapped);
    } catch {}
  };

  useEffect(() => {
    const currentAlbumId = searchParams.get('album');
    if (!currentAlbumId) return;
    setAlbumId(currentAlbumId);
    const formattedName = projectsByAlbum[currentAlbumId]?.albumName || currentAlbumId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setAlbumName(formattedName);
    // Initial fetch
    refreshAlbumProjects(currentAlbumId);
    // Refetch on window focus/visibility change to capture newly uploaded Final Song
    const onFocus = () => refreshAlbumProjects(currentAlbumId);
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshAlbumProjects(currentAlbumId); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [searchParams]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };
  
  const handleDropOnSidebar = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const projectData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
    
    if (projectData && albumId) {
      const project: Project = JSON.parse(projectData);
      const updated = getProjectsForAlbum(albumId).find(p => p.id === project.id);
      if (updated?.finalSong) {
        updateProjectStatus(albumId, project.id, 'Done');
      } else {
        alert('Upload a Final Song in the project before marking it complete.');
      }
      
    }
  };

  const handleRemoveFromDone = (projectId: string) => {
    if (albumId) {
      updateProjectStatus(albumId, projectId, 'In Progress');
    }
  };

  const filteredProjects = currentAlbumProjects.filter(project => {
    if (!activeFilter) return true;
    return project.status === activeFilter;
  });

  const doneProjects = currentAlbumProjects.filter(project => project.status === 'Done');

  const handleDoneItemDragStart = (e: React.DragEvent<HTMLDivElement>, project: Project) => {
    setDraggedProject(project);
  };

  const handleDoneItemDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDoneItemDrop = (e: React.DragEvent<HTMLDivElement>, targetProject: Project) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedProject || draggedProject.id === targetProject.id || !albumId) {
        return;
    }

    const newProjects = [...currentAlbumProjects];
    const draggedIndex = newProjects.findIndex(p => p.id === draggedProject.id);
    const targetIndex = newProjects.findIndex(p => p.id === targetProject.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove the dragged project from its original position
    const [removed] = newProjects.splice(draggedIndex, 1);
    // Insert it at the target project's position
    newProjects.splice(targetIndex, 0, removed);

    setCurrentAlbumProjects(newProjects);
    setDraggedProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
  }

  const resetCollaboratorForm = () => {
    setEditingCollaboratorId(null);
    setCollabName("");
    setCollabEmail("");
    setAccessType('album');
    setSelectedTrackIds([]);
  };

  const handleSaveCollaborator = () => {
    const access: CollaboratorAccess = accessType === 'album' ? { type: 'album' } : { type: 'tracks', trackIds: selectedTrackIds };
    if (editingCollaboratorId) {
      setCollaborators(prev => prev.map(c => c.id === editingCollaboratorId ? { ...c, name: collabName, email: collabEmail, access } : c));
    } else {
      setCollaborators(prev => [...prev, { id: crypto.randomUUID(), name: collabName, email: collabEmail, access }]);
    }
    resetCollaboratorForm();
  };

  const handleEditCollaborator = (c: Collaborator) => {
    setEditingCollaboratorId(c.id);
    setCollabName(c.name);
    setCollabEmail(c.email);
    if (c.access.type === 'album') {
      setAccessType('album');
      setSelectedTrackIds([]);
    } else {
      setAccessType('tracks');
      setSelectedTrackIds(c.access.trackIds || []);
    }
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    if (editingCollaboratorId === id) {
      resetCollaboratorForm();
    }
  };
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto text-sm">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      ST
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold">{albumName}</span>
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>{albumName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Albums</DropdownMenuLabel>
                    {allAlbumIds.map((id) => (
                        <DropdownMenuItem key={id} onSelect={() => handleAlbumSwitch(id)}>
                            {projectsByAlbum[id]?.albumName || id}
                        </DropdownMenuItem>
                    ))}
                 </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1">
               <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/dashboard">
                  <HomeIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2">
            <div 
              className={cn(
                "aspect-square p-2 flex flex-col justify-end rounded-lg bg-card border-2 border-dashed border-gray-600",
                isDraggingOver && "border-primary bg-primary/20"
              )}
              onDragOver={handleDragOver}
              onDrop={handleDropOnSidebar}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              {doneProjects.length > 0 ? (
                <div className="space-y-1 overflow-auto">
                  {doneProjects.map(p => (
                    <div 
                      key={p.id} 
                      draggable="true"
                      onDragStart={(e) => handleDoneItemDragStart(e, p)}
                      onDragOver={handleDoneItemDragOver}
                      onDrop={(e) => handleDoneItemDrop(e, p)}
                      onDragEnd={handleDragEnd}
                      className="group flex items-center justify-between text-sm text-muted-foreground p-1 bg-accent/50 rounded-md cursor-move"
                    >
                      <span className="truncate">{p.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromDone(p.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Upload className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Drag a track here to complete the album</p>
                </div>
              )}
              {isDraggingOver && <p className="text-sm text-primary mt-1">Drop to complete</p>}
            </div>
          </div>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveFilter('Done')} isActive={activeFilter === 'Done'}>
                  <HomeIcon />
                  {albumName}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveFilter(null)} isActive={activeFilter === null}>
                  <LayoutGrid />
                  Projects
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <Dialog open={isCollaboratorsOpen} onOpenChange={setIsCollaboratorsOpen}>
                  <DialogTrigger asChild>
                    <SidebarMenuButton className="text-muted-foreground justify-start">
                      Collaborators
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Collaborators</DialogTitle>
                      <DialogDescription>Invite collaborators and control their access.</DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Current collaborators</h4>
                        <div className="border rounded-md p-2 max-h-64 overflow-auto space-y-1">
                          {collaborators.length > 0 ? (
                            collaborators.map(c => (
                              <div key={c.id} className="flex items-center justify-between text-sm p-1 rounded hover:bg-accent">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{c.name}</div>
                                  <div className="text-muted-foreground truncate">{c.email}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {c.access.type === 'album' ? 'Full album access' : `${c.access.trackIds?.length || 0} track(s)`}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button variant="ghost" size="sm" className="h-7" onClick={() => handleEditCollaborator(c)}>Edit</Button>
                                  <Button variant="ghost" size="sm" className="h-7" onClick={() => handleRemoveCollaborator(c.id)}>Remove</Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No collaborators yet.</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold">{editingCollaboratorId ? 'Edit collaborator' : 'Add collaborator'}</h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="collabName" className="text-sm">Name</Label>
                            <Input id="collabName" value={collabName} onChange={(e)=>setCollabName(e.target.value)} placeholder="e.g. Jane Doe" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="collabEmail" className="text-sm">Email</Label>
                            <Input id="collabEmail" type="email" value={collabEmail} onChange={(e)=>setCollabEmail(e.target.value)} placeholder="jane@example.com" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">Access</Label>
                            <div className="flex gap-2">
                              <Button type="button" variant={accessType === 'album' ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={()=>setAccessType('album')}>Full album</Button>
                              <Button type="button" variant={accessType === 'tracks' ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={()=>setAccessType('tracks')}>Specific tracks</Button>
                            </div>
                          </div>
                          {accessType === 'tracks' && (
                            <div className="space-y-2">
                              <Label className="text-sm">Choose tracks</Label>
                              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-auto pr-2">
                                {currentAlbumProjects.map(p => (
                                  <label key={p.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      checked={selectedTrackIds.includes(p.id)}
                                      onCheckedChange={(checked) => {
                                        setSelectedTrackIds(prev => checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                                      }}
                                    />
                                    <span className="truncate">{p.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={handleSaveCollaborator}>{editingCollaboratorId ? 'Save changes' : 'Add collaborator'}</Button>
                          <Button variant="ghost" onClick={resetCollaboratorForm}>Clear</Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="secondary">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-muted-foreground justify-start" onClick={() => setIsDropDialogOpen(true)}>
                  Drop album
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full w-full flex-col bg-background">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <ProjectDashboard 
              projects={filteredProjects} 
              setProjects={setCurrentAlbumProjects} 
              albumName={albumName} 
              albumId={albumId || ''}
            />
          </main>
        </div>
      </SidebarInset>
      <Dialog open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Drop album</DialogTitle>
            <DialogDescription>Review completed tracks, upload covers, and add credits.</DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Completed tracks</h4>
              <div className="border rounded-md p-2 max-h-56 overflow-auto">
                {doneProjects.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {doneProjects.map(t => (
                      <li key={t.id} className="flex items-center justify-between">
                        <span className="truncate">{t.name}</span>
                        <span className="text-muted-foreground">{t.type}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No completed tracks yet.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Album cover</Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={(e) => { const f=e.target.files?.[0]; if (f) setAlbumCoverUrl(URL.createObjectURL(f)); }} />
                  {albumCoverUrl && <Image src={albumCoverUrl} alt="Album cover" width={64} height={64} className="rounded object-cover" />}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Tracklist cover</Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={(e) => { const f=e.target.files?.[0]; if (f) setTracklistCoverUrl(URL.createObjectURL(f)); }} />
                  {tracklistCoverUrl && <Image src={tracklistCoverUrl} alt="Tracklist cover" width={64} height={64} className="rounded object-cover" />}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="albumNameInput" className="text-sm">Album name</Label>
                <Input id="albumNameInput" value={albumName} onChange={(e)=>setAlbumName(e.target.value)} placeholder="Album name" />
              </div>
              <h4 className="text-sm font-semibold">Credits</h4>
              <div className="space-y-2">
                <Label htmlFor="labelCredit" className="text-sm">Label</Label>
                <Input id="labelCredit" value={labelCredit} onChange={(e)=>setLabelCredit(e.target.value)} placeholder="Label name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="producersCredit" className="text-sm">Producers</Label>
                <Textarea id="producersCredit" value={producersCredit} onChange={(e)=>setProducersCredit(e.target.value)} placeholder="Comma or line separated" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="writersCredit" className="text-sm">Writers</Label>
                <Textarea id="writersCredit" value={writersCredit} onChange={(e)=>setWritersCredit(e.target.value)} placeholder="Comma or line separated" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();

                const safe = (name: string) => name.replace(/[^a-z0-9\-_. ]/gi, '_');

                // Prefer exporting only completed tracks (Done). Fallback to all if none are Done yet.
                const exportProjects = doneProjects.length > 0 ? doneProjects : currentAlbumProjects;

                const metadata = {
                  albumId,
                  albumName,
                  credits: {
                    label: labelCredit,
                    producers: producersCredit,
                    writers: writersCredit,
                  },
                  projects: exportProjects.map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    priority: p.priority,
                    description: p.description,
                    finalSong: p.finalSong ? { name: p.finalSong.name } : null,
                    counts: {
                      verses: (p.verses || []).length,
                      hooks: (p.hooks || []).length,
                      beats: (p.beats || []).length,
                      samples: (p.samples || []).length,
                    },
                  }))
                };
                zip.file('metadata.json', JSON.stringify(metadata, null, 2));

                const extractKeyFromUrl = (u: string): string | null => {
                  try {
                    const parsed = new URL(u);
                    const host = parsed.hostname;
                    const path = decodeURIComponent(parsed.pathname);
                    if (host.includes('.s3')) return path.startsWith('/') ? path.slice(1) : path;
                    const parts = path.split('/').filter(Boolean);
                    if (parts.length >= 2) return parts.slice(1).join('/');
                    return null;
                  } catch { return null; }
                };

                const getPlayableUrl = async (url: string): Promise<string> => {
                  const key = extractKeyFromUrl(url);
                  if (!key) return url;
                  try {
                    const fresh = await api.presign({ key, action: 'get' });
                    return fresh.url || url;
                  } catch { return url; }
                };

                const addFile = async (folder: any, name: string, url: string) => {
                  try {
                    const playUrl = await getPlayableUrl(url);
                    const res = await fetch(playUrl);
                    const blob = await res.blob();
                    folder.file(safe(name || 'file'), blob);
                  } catch {}
                };

                // Covers
                if (albumCoverUrl) {
                  await addFile(zip, `album-cover.${(albumCoverUrl.split(';')[0].split('/').pop() || 'png')}`, albumCoverUrl);
                }
                if (tracklistCoverUrl) {
                  await addFile(zip, `tracklist-cover.${(tracklistCoverUrl.split(';')[0].split('/').pop() || 'png')}`, tracklistCoverUrl);
                }

                // Project files
                for (const p of exportProjects) {
                  const pf = zip.folder(safe(p.name))!;
                  if (p.finalSong) {
                    await addFile(pf, `Final_${p.finalSong.name}`, p.finalSong.url);
                  }
                  const addGroup = async (arr: any[] | undefined, group: string) => {
                    if (!arr || arr.length === 0) return;
                    const gf = pf.folder(group)!;
                    for (const f of arr) {
                      await addFile(gf, f.name, f.url);
                    }
                  };
                  await addGroup(p.verses, 'Verses');
                  await addGroup(p.hooks, 'Hooks');
                  await addGroup(p.beats, 'Beats');
                  await addGroup(p.samples, 'Samples');
                }

                const blob = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${safe(albumName)}-export.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(a.href), 2000);
              }}
            >
              Export
            </Button>
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
            <Button onClick={()=> setIsDropDialogOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}
