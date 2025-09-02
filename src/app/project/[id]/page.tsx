
"use client";

import {
  ChevronsUpDown,
  Home as HomeIcon,
  LayoutGrid,
  Plus,
  Rocket,
  Search,
  Users,
  Link as LinkIcon,
  Pencil,
  Tag,
  Circle,
  PlusCircle,
  Calendar as CalendarIcon,
  User,
  MessageSquare,
  Smile,
  TrendingUp,
  ExternalLink,
  LogOut,
  Settings,
  Music,
  Upload,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback } from "react";

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { initialProjects } from "@/lib/data";
import type { Project, Update, Artist, ContentFile } from "@/lib/types";
import { UpdateCard } from "@/components/update-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectContext } from "@/context/project-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AudioPlayerProvider, useAudioPlayer } from "@/hooks/use-audio-player";
import { ProjectTimeline, type TimelineEvent } from "@/components/project-timeline";


type ProjectStatus = "Backlog" | "Todo" | "In Progress" | "Done";
type ProjectPriority = "No priority" | "Low" | "Medium" | "High" | "Urgent";
type Milestone = { id: string; name: string; description?: string };
type HealthStatus = "On Track" | "At Risk" | "Off Track" | "No updates";

// Extends ContentFile to include the File object for upload purposes
type UploadableContentFile = ContentFile & { file: File };

function ProjectDetailContent() {
  const [project, setProject] = useState<Project | null>(null);
  const { getProjectsForAlbum, updateProject } = useProjectContext();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("Add a short summary...");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const [status, setStatus] = useState<ProjectStatus>("Backlog");
  const [priority, setPriority] = useState<ProjectPriority>("No priority");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isAddArtistDialogOpen, setIsAddArtistDialogOpen] = useState(false);
  const [producers, setProducers] = useState<Artist[]>([]);
  const [isAddProducerDialogOpen, setIsAddProducerDialogOpen] = useState(false);
  const [writers, setWriters] = useState<Artist[]>([]);
  const [isAddWriterDialogOpen, setIsAddWriterDialogOpen] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isAllUpdatesOpen, setIsAllUpdatesOpen] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<Update | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  
  const [verses, setVerses] = useState<ContentFile[]>([]);
  const [hooks, setHooks] = useState<ContentFile[]>([]);
  const [beats, setBeats] = useState<ContentFile[]>([]);
  const [samples, setSamples] = useState<ContentFile[]>([]);
  const [finalSong, setFinalSong] = useState<ContentFile | null>(null);

  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [selectedHookIds, setSelectedHookIds] = useState<string[]>([]);
  const [selectedBeatIds, setSelectedBeatIds] = useState<string[]>([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);

  const { setCurrentTrack } = useAudioPlayer();

  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const albumId = searchParams.get('album');

  const updateProjectInContext = useCallback((updatedProjectData: Partial<Project>) => {
    if (project && albumId) {
      const updatedProject = { ...project, ...updatedProjectData };
      updateProject(albumId, updatedProject);
      setProject(updatedProject);
    }
  }, [project, albumId, updateProject]);

  useEffect(() => {
    if (projectId && albumId) {
        const albumProjects = getProjectsForAlbum(albumId);
        const foundProject = albumProjects.find((p) => p.id === projectId);
        if (foundProject) {
            setProject(foundProject);
            setProjectName(foundProject.name);
            const currentDescription = foundProject.description || "Add description...";
            setDescription(currentDescription);
            setTempDescription(currentDescription);
            setTargetDate(foundProject.targetDate);
            setArtists(foundProject.artists || []);
            setProducers(foundProject.producers || []);
            setWriters(foundProject.writers || []);
            const projectUpdates = (foundProject.updates || []).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setUpdates(projectUpdates);
            setLatestUpdate(projectUpdates.length > 0 ? projectUpdates[0] : null);
            setVerses(foundProject.verses || []);
            setHooks(foundProject.hooks || []);
            setBeats(foundProject.beats || []);
            setSamples(foundProject.samples || []);
            setFinalSong(foundProject.finalSong || null);
        }
    }
  }, [projectId, albumId, getProjectsForAlbum]);
  
    const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const fileEvents: TimelineEvent[] = [
      ...verses.map(v => ({ id: v.id, type: 'Upload' as const, timestamp: v.timestamp, title: "Verse Added", description: v.name, contentType: 'Verse' as const })),
      ...hooks.map(h => ({ id: h.id, type: 'Upload' as const, timestamp: h.timestamp, title: "Hook Added", description: h.name, contentType: 'Hook' as const })),
      ...beats.map(b => ({ id: b.id, type: 'Upload' as const, timestamp: b.timestamp, title: "Beat Added", description: b.name, contentType: 'Beat' as const })),
      ...samples.map(s => ({ id: s.id, type: 'Upload'as const, timestamp: s.timestamp, title: "Sample Added", description: s.name, contentType: 'Sample' as const })),
    ];

    if (finalSong) {
      fileEvents.push({ id: 'final-song', type: 'Upload', timestamp: finalSong.timestamp, title: 'Final Song Uploaded', description: finalSong.name, contentType: 'Song' });
    }

    const updateEvents: TimelineEvent[] = updates.map(u => ({
      id: u.id,
      type: 'Update',
      timestamp: u.timestamp,
      title: 'Project Update',
      description: u.text,
    }));

    return [...fileEvents, ...updateEvents].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [verses, hooks, beats, samples, finalSong, updates]);


  const handleDescriptionSave = () => {
    setDescription(tempDescription);
    updateProjectInContext({ description: tempDescription });
    setIsEditingDescription(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleSaveChanges = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newName = formData.get("projectName") as string;
    setProjectName(newName);
    updateProjectInContext({ name: newName });
    setIsEditDialogOpen(false);
  };

  const handleAddMilestone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const milestoneName = formData.get("milestoneName") as string;
    const milestoneDescription = formData.get("milestoneDescription") as string;
    if (milestoneName) {
      setMilestones([
        ...milestones,
        { id: crypto.randomUUID(), name: milestoneName, description: milestoneDescription },
      ]);
      setIsMilestoneDialogOpen(false);
      e.currentTarget.reset();
    }
  };

  const handleAddArtist = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const artistName = formData.get('artistName') as string;
    const artistEmail = formData.get('artistEmail') as string;
    const artistPhone = formData.get('artistPhone') as string;

    if (artistName) {
        const newArtist = { name: artistName, email: artistEmail, phone: artistPhone };
        const updatedArtists = [...artists, newArtist];
        setArtists(updatedArtists);
        updateProjectInContext({ artists: updatedArtists });
        setIsAddArtistDialogOpen(false);
        e.currentTarget.reset();
    }
  };

  const handleAddProducer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const producerName = formData.get('producerName') as string;
    const producerEmail = formData.get('producerEmail') as string;
    const producerPhone = formData.get('producerPhone') as string;

    if (producerName) {
        const newProducer = { name: producerName, email: producerEmail, phone: producerPhone };
        const updatedProducers = [...producers, newProducer];
        setProducers(updatedProducers);
        updateProjectInContext({ producers: updatedProducers });
        setIsAddProducerDialogOpen(false);
        e.currentTarget.reset();
    }
  };

  const handleAddWriter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const writerName = formData.get('writerName') as string;
    const writerEmail = formData.get('writerEmail') as string;
    const writerPhone = formData.get('writerPhone') as string;

    if (writerName) {
        const newWriter = { name: writerName, email: writerEmail, phone: writerPhone };
        const updatedWriters = [...writers, newWriter];
        setWriters(updatedWriters);
        updateProjectInContext({ writers: updatedWriters });
        setIsAddWriterDialogOpen(false);
        e.currentTarget.reset();
    }
  };


  const handleAddUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updateText = formData.get("updateText") as string;
    const updateStatus = formData.get("updateStatus") as HealthStatus;

    if (updateText) {
      const newUpdate: Update = {
        id: crypto.randomUUID(),
        text: updateText,
        author: "Stalkiq",
        avatar: "",
        status: updateStatus,
        timestamp: new Date(),
      };
      const newUpdates = [newUpdate, ...updates];
      setUpdates(newUpdates);
      setLatestUpdate(newUpdate);
      updateProjectInContext({ updates: newUpdates });
      setIsUpdateDialogOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'verse' | 'hook' | 'beat' | 'sample') => {
    const file = e.target.files?.[0];
    if (file) {
        const newFile: ContentFile = { 
          id: crypto.randomUUID(), 
          name: file.name, 
          url: URL.createObjectURL(file),
          timestamp: new Date()
        };
        
        const updateStateAndContext = (prev: ContentFile[], newFile: ContentFile) => {
            const updatedFiles = [...prev, newFile];
            switch(type) {
                case 'verse': 
                  setVerses(updatedFiles);
                  updateProjectInContext({ verses: updatedFiles });
                  break;
                case 'hook':
                  setHooks(updatedFiles);
                  updateProjectInContext({ hooks: updatedFiles });
                  break;
                case 'beat':
                  setBeats(updatedFiles);
                  updateProjectInContext({ beats: updatedFiles });
                  break;
                case 'sample':
                  setSamples(updatedFiles);
                  updateProjectInContext({ samples: updatedFiles });
                  break;
            }
        };

        switch(type) {
            case 'verse': updateStateAndContext(verses, newFile); break;
            case 'hook': updateStateAndContext(hooks, newFile); break;
            case 'beat': updateStateAndContext(beats, newFile); break;
            case 'sample': updateStateAndContext(samples, newFile); break;
        }

        e.target.value = "";
    }
  };

  const handleFinalSongUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFile: ContentFile = {
        id: 'final-song',
        name: file.name,
        url: URL.createObjectURL(file),
        timestamp: new Date()
      }
      setFinalSong(newFile);
      updateProjectInContext({ finalSong: newFile });
      e.target.value = "";
    }
  };

  const toggleSelection = (id: string, type: 'verse' | 'hook' | 'beat' | 'sample') => {
    switch (type) {
      case 'verse':
        setSelectedVerseIds(prev => prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]);
        break;
      case 'hook':
        setSelectedHookIds(prev => prev.includes(id) ? prev.filter(hId => hId !== id) : [...prev, id]);
        break;
      case 'beat':
        setSelectedBeatIds(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
        break;
      case 'sample':
        setSelectedSampleIds(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
        break;
    }
  };

  const clearAllSelections = () => {
    setSelectedVerseIds([]);
    setSelectedHookIds([]);
    setSelectedBeatIds([]);
    setSelectedSampleIds([]);
  }

  const selectedCount = selectedVerseIds.length + selectedHookIds.length + selectedBeatIds.length + selectedSampleIds.length;

  const renderContentFileList = (files: ContentFile[], selectedIds: string[], type: 'verse' | 'hook' | 'beat' | 'sample') => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h4 className="font-medium capitalize text-sm">{type}s</h4>
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-4 w-4" />
          </Button>
          <Input 
            type="file" 
            accept="audio/*,.pdf,.doc,.docx" 
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={(e) => handleFileUpload(e, type)}
          />
        </div>
      </div>
      {files.length > 0 ? (
        <ScrollArea className="h-auto max-h-32">
          <div className="space-y-1 pr-4">
            {files.map(file => (
              <TooltipProvider key={file.id} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => toggleSelection(file.id, type)}
                      className={cn(
                        "flex items-center space-x-2 p-1.5 rounded-md cursor-pointer hover:bg-accent",
                        selectedIds.includes(file.id) && "bg-accent"
                      )}
                    >
                      {selectedIds.includes(file.id) ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <div className="h-4 w-4 shrink-0" /> // Placeholder for alignment
                      )}
                      <span className="text-sm font-normal truncate flex-1 min-w-0">
                        {file.name}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{file.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-xs text-muted-foreground px-1.5">No {type}s uploaded.</p>
      )}
    </div>
  );


  const statusColors: Record<ProjectStatus, string> = {
    Backlog: "text-yellow-500 fill-yellow-500/30",
    Todo: "text-gray-500 fill-gray-500/30",
    "In Progress": "text-blue-500 fill-blue-500/30",
    Done: "text-green-500 fill-green-500/30",
    "On Track": "text-green-500 fill-green-500/30",
    "At Risk": "text-yellow-500 fill-yellow-500/30",
    "Off Track": "text-red-500 fill-red-500/30",
    "No updates": "text-gray-500 fill-gray-500/30"
  };

  if (!project) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <p>Loading project...</p>
      </div>
    );
  }

  const renderFileButton = (file: ContentFile) => (
    <Button 
      key={file.id} 
      variant="outline" 
      size="sm" 
      className="h-7"
      onClick={() => setCurrentTrack({ name: file.name, url: file.url })}
    >
      <Music className="h-3 w-3 mr-2" />
      <span className="truncate max-w-[150px]">{file.name}</span>
    </Button>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <main className="flex-1 overflow-auto pb-20"> {/* Add padding-bottom for audio player */}
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects?album=${albumId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              Projects
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-green-900/50 rounded-md">
                <svg
                  className="size-4 text-green-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.8392 10.3801C16.8392 7.08008 14.1592 4.40008 10.8592 4.40008C7.55919 4.40008 4.87919 7.08008 4.87919 10.3801C4.87919 12.8301 6.50919 14.9301 8.73919 15.6801V16.7801C8.73919 17.6101 9.40919 18.2801 10.2392 18.2801H11.4792C12.3092 18.2801 12.9792 17.6101 12.9792 16.7801V15.6801C15.2092 14.9301 16.8392 12.8301 16.8392 10.3801Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                  ></path>
                  <path
                    d="M10.8601 18.2799V20.9999"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                  ></path>
                  <path
                    d="M7.7998 10.3799H13.9198"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                  ></path>
                  <path
                    d="M9.03906 13.48H12.6791"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                  ></path>
                  <path
                    d="M19.1209 10.3801C19.1209 12.2001 18.3109 13.8501 17.0009 14.9501"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M18.1302 7.82993C18.7702 8.56993 19.1202 9.45993 19.1202 10.3799"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M4.88019 10.3799C4.88019 9.45993 5.23019 8.56993 5.87019 7.82993C6.42019 7.19993 7.14019 6.70993 7.96019 6.42993"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>
              <h1 className="text-lg font-semibold">{projectName}</h1>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-accent p-1">
              {finalSong ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 bg-background"
                    onClick={() => setCurrentTrack({ name: finalSong.name, url: finalSong.url })}
                  >
                    <Music className="mr-2 h-3 w-3" />
                    <span className="truncate max-w-[150px]">{finalSong.name}</span>
                  </Button>
              ) : (
                <div className="relative">
                  <Button variant="ghost" size="sm" className="h-6 bg-background">
                    <Upload className="mr-2 h-3 w-3"/>
                    Upload Song
                  </Button>
                   <Input 
                    type="file" 
                    accept="audio/*" 
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    onChange={handleFinalSongUpload}
                  />
                </div>
              )}
               <Button variant="ghost" size="sm" className="h-6 bg-background" onClick={() => setIsTimelineOpen(true)}>
                 Timeline
               </Button>
               <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 bg-background relative">
                    Overview
                    {selectedCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                        {selectedCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium leading-none">Song Composition</h4>
                         {selectedCount > 0 && (
                           <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={clearAllSelections}>Clear all</Button>
                         )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select the files used in the final mix.
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {renderContentFileList(verses, selectedVerseIds, 'verse')}
                      {renderContentFileList(hooks, selectedHookIds, 'hook')}
                      {renderContentFileList(beats, selectedBeatIds, 'beat')}
                      {renderContentFileList(samples, selectedSampleIds, 'sample')}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopyLink}>
              <LinkIcon className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        ST
                    </AvatarFallback>
                    </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>StalkIQ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Make changes to your project here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveChanges}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="projectName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="projectName"
                    name="projectName"
                    defaultValue={projectName}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
              <DialogDescription>
                Create a new milestone for your project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMilestone}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="milestoneName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="milestoneName"
                    name="milestoneName"
                    placeholder="e.g. Q3 Release"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="milestoneDescription" className="text-right pt-2">
                    Details
                  </Label>
                  <Textarea
                    id="milestoneDescription"
                    name="milestoneDescription"
                    placeholder="Add more details about this milestone..."
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Add Milestone</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isAddArtistDialogOpen} onOpenChange={setIsAddArtistDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Artist</DialogTitle>
              <DialogDescription>
                Invite a new artist to collaborate on this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddArtist}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="artistName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="artistName"
                    name="artistName"
                    placeholder="e.g. Jane Doe"
                    className="col-span-3"
                    required
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="artistEmail" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="artistEmail"
                    name="artistEmail"
                    type="email"
                    placeholder="e.g. jane@example.com"
                    className="col-span-3"
                    required
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="artistPhone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="artistPhone"
                    name="artistPhone"
                    type="tel"
                    placeholder="e.g. (123) 456-7890"
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Add Artist</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddProducerDialogOpen} onOpenChange={setIsAddProducerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Producer</DialogTitle>
              <DialogDescription>
                Add a new producer to this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProducer}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="producerName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="producerName"
                    name="producerName"
                    placeholder="e.g. Metro Boomin"
                    className="col-span-3"
                    required
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="producerEmail" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="producerEmail"
                    name="producerEmail"
                    type="email"
                    placeholder="e.g. producer@example.com"
                    className="col-span-3"
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="producerPhone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="producerPhone"
                    name="producerPhone"
                    type="tel"
                    placeholder="e.g. (123) 456-7890"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Add Producer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddWriterDialogOpen} onOpenChange={setIsAddWriterDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Writer</DialogTitle>
              <DialogDescription>
                Add a new writer to this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddWriter}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="writerName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="writerName"
                    name="writerName"
                    placeholder="e.g. John Lennon"
                    className="col-span-3"
                    required
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="writerEmail" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="writerEmail"
                    name="writerEmail"
                    type="email"
                    placeholder="e.g. writer@example.com"
                    className="col-span-3"
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="writerPhone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="writerPhone"
                    name="writerPhone"
                    type="tel"
                    placeholder="e.g. (123) 456-7890"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Add Writer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


         <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Update</DialogTitle>
                    <DialogDescription>
                        Post a new update for your project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUpdate}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="updateText" className="text-right pt-2">
                                Update
                            </Label>
                            <Textarea
                                id="updateText"
                                name="updateText"
                                placeholder="What's new?"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="updateStatus" className="text-right">
                                Status
                            </Label>
                             <Select name="updateStatus" defaultValue="On Track">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="On Track">On Track</SelectItem>
                                    <SelectItem value="At Risk">At Risk</SelectItem>
                                    <SelectItem value="Off Track">Off Track</SelectItem>
                                    <SelectItem value="No updates">No updates</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Post Update</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        <Sheet open={isAllUpdatesOpen} onOpenChange={setIsAllUpdatesOpen}>
            <SheetContent className="w-[500px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Project Updates</SheetTitle>
                    <SheetDescription>
                        A chronological history of all updates for {projectName}.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-4rem)] pr-4 mt-4">
                    <div className="space-y-6">
                        {updates.length > 0 ? (
                            updates.map((update) => (
                                <UpdateCard key={update.id} update={update} />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No updates have been posted for this project yet.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>

        <Sheet open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
            <SheetContent className="w-[600px] sm:w-[640px]">
                <SheetHeader>
                    <SheetTitle>Project Timeline</SheetTitle>
                    <SheetDescription>
                        A chronological history of all events for {projectName}.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-4rem)] mt-4">
                    <ProjectTimeline events={timelineEvents} />
                </ScrollArea>
            </SheetContent>
        </Sheet>


        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-3 p-8 space-y-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{projectName}</h1>
              <p className="text-muted-foreground">{project?.description}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold">Properties</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Circle className={cn("h-3 w-3", statusColors[status])} /> {status}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                {priority}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" /> Lead
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarIcon className="h-3 w-3" /> {targetDate ? format(targetDate, "LLL d") : "Target date"}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">ST</AvatarFallback>
                </Avatar>
                Stalkiq
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[auto_1fr] items-start gap-4 text-sm">
                <div className="flex items-center gap-2 w-24 shrink-0 pt-1.5">
                  <span className="font-semibold">Media</span>
                   <div className="relative ml-auto">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Add Resource</h4>
                            <p className="text-sm text-muted-foreground">
                              Add a new link to your project.
                            </p>
                          </div>
                          <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                              <Label htmlFor="width">Link</Label>
                              <Input
                                id="width"
                                defaultValue="https://example.com"
                                className="col-span-2 h-8"
                              />
                            </div>
                          </div>
                          <Button size="sm">Add Link</Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  
                </div>
              </div>
              
              <div className="grid grid-cols-[auto_1fr] items-start gap-4 text-sm">
                <div className="flex items-center gap-2 w-24 shrink-0 pt-1.5">
                  <span className="font-semibold">Verses</span>
                  <div className="relative ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="file" 
                      accept="audio/*" 
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'verse')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {verses.map(renderFileButton)}
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] items-start gap-4 text-sm">
                <div className="flex items-center gap-2 w-24 shrink-0 pt-1.5">
                  <span className="font-semibold">Hooks</span>
                  <div className="relative ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="file" 
                      accept="audio/*" 
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'hook')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {hooks.map(renderFileButton)}
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] items-start gap-4 text-sm">
                <div className="flex items-center gap-2 w-24 shrink-0 pt-1.5">
                  <span className="font-semibold">Beats</span>
                   <div className="relative ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="file" 
                      accept="audio/*" 
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'beat')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {beats.map(renderFileButton)}
                </div>
              </div>
              
              <div className="grid grid-cols-[auto_1fr] items-start gap-4 text-sm">
                 <div className="flex items-center gap-2 w-24 shrink-0 pt-1.5">
                  <span className="font-semibold">Samples</span>
                   <div className="relative ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="file" 
                      accept="audio/*" 
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'sample')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {samples.map(renderFileButton)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">Latest update</h3>
                      <Button variant="outline" size="sm" className="h-7" onClick={() => setIsAllUpdatesOpen(true)}>All</Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <Button variant="outline" size="sm" onClick={() => setIsUpdateDialogOpen(true)}>
                            <ExternalLink className="h-3 w-3 mr-2" />
                            New update
                        </Button>
                    </div>
                </div>
                {latestUpdate ? (
                  <UpdateCard update={latestUpdate} />
                ) : (
                    <p className="text-sm text-muted-foreground">No updates for this project yet.</p>
                )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    placeholder="Add a detailed description for your project..."
                    className="min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleDescriptionSave}>Save</Button>
                    <Button variant="ghost" onClick={() => setIsEditingDescription(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-muted-foreground whitespace-pre-wrap min-h-[40px] cursor-pointer hover:bg-accent/50 p-2 rounded-md"
                  onClick={() => {
                    setTempDescription(description === "Add description..." ? "" : description);
                    setIsEditingDescription(true);
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setIsMilestoneDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Milestone
            </Button>
          </div>
          <aside className="md:col-span-1 xl:col-span-1 border-l border-border p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Properties</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7">
                        <Circle className={cn("h-3 w-3 mr-2", statusColors[status])} />
                        {status}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0">
                       <Select value={status} onValueChange={(value: ProjectStatus) => setStatus(value)}>
                        <SelectTrigger className="border-0 focus:ring-0">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Backlog">Backlog</SelectItem>
                          <SelectItem value="Todo">Todo</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                           <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Priority</span>
                  <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7">
                          {priority}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0">
                       <Select value={priority} onValueChange={(value: ProjectPriority) => setPriority(value)}>
                          <SelectTrigger className="border-0 focus:ring-0">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No priority">No priority</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lead</span>
                  <Button variant="ghost" size="sm" className="h-7">
                    <User className="h-3 w-3 mr-2" /> Add lead
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Artists</span>
                   {artists.length === 0 ? (
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => setIsAddArtistDialogOpen(true)}>
                            <Users className="h-3 w-3 mr-2" /> Add artists
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                             <Button variant="ghost" size="sm" className="h-7 pr-2" onClick={() => setIsAddArtistDialogOpen(true)}>
                                <span className="truncate max-w-[100px]">{artists[0].name}</span>
                                {artists.length > 1 && ` +${artists.length - 1}`}
                             </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setIsAddArtistDialogOpen(true)}>
                                <Plus className="h-4 w-4"/>
                             </Button>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Producers</span>
                   {producers.length === 0 ? (
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => setIsAddProducerDialogOpen(true)}>
                            <Users className="h-3 w-3 mr-2" /> Add producers
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                             <Button variant="ghost" size="sm" className="h-7 pr-2" onClick={() => setIsAddProducerDialogOpen(true)}>
                                <span className="truncate max-w-[100px]">{producers[0].name}</span>
                                {producers.length > 1 && ` +${producers.length - 1}`}
                             </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setIsAddProducerDialogOpen(true)}>
                                <Plus className="h-4 w-4"/>
                             </Button>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Writers</span>
                   {writers.length === 0 ? (
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => setIsAddWriterDialogOpen(true)}>
                            <Users className="h-3 w-3 mr-2" /> Add writers
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                             <Button variant="ghost" size="sm" className="h-7 pr-2" onClick={() => setIsAddWriterDialogOpen(true)}>
                                <span className="truncate max-w-[100px]">{writers[0].name}</span>
                                {writers.length > 1 && ` +${writers.length - 1}`}
                             </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setIsAddWriterDialogOpen(true)}>
                                <Plus className="h-4 w-4"/>
                             </Button>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Dates</span>
                  <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7">
                                <PlusCircle className="h-3 w-3 mr-2" /> {startDate ? format(startDate, 'LLL d') : 'Start'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <span>&rarr;</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7">
                                <CalendarIcon className="h-3 w-3 mr-2" /> {targetDate ? format(targetDate, 'LLL d') : 'Target'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={targetDate}
                                onSelect={setTargetDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Teams</span>
                  <Button variant="ghost" size="sm" className="h-7">
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarFallback className="text-xs">ST</AvatarFallback>
                    </Avatar>
                    Stalkiq
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Labels</span>
                  <Button variant="ghost" size="sm" className="h-7">
                    <Tag className="h-3 w-3 mr-2" /> Add label
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Milestones</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsMilestoneDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {milestones.length > 0 ? (
                <TooltipProvider>
                  <ul className="space-y-2 text-sm">
                    {milestones.map((milestone) => (
                      <li key={milestone.id} className="flex items-center text-muted-foreground">
                        <LayoutGrid className="h-3 w-3 mr-2 shrink-0" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="truncate">{milestone.name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{milestone.name}</p>
                                {milestone.description && <p className="text-xs text-muted-foreground">{milestone.description}</p>}
                            </TooltipContent>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                </TooltipProvider>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add milestones to organize work within your project and break it
                  into more granular stages.{" "}
                  <Link href="#" className="text-foreground">
                    Learn more
                  </Link>
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function ProjectDetailPage() {
    return (
        <ProjectDetailContent />
    )
}
