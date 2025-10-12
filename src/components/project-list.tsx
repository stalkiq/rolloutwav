"use client";

import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project, ProjectType, ProjectPriority, ProjectStatus } from "@/lib/types";
import { format } from "date-fns";
import {
  Lightbulb,
  Video,
  Users,
  CircleDashed,
  UserCircle2,
  Puzzle,
  MoreHorizontal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  AlertTriangle,
  Check,
  LayoutGrid as LayoutGridIcon,
  Workflow as WorkflowIcon,
  Circle,
  CheckCircle,
  Music,
  Play,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandInput } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { startLogin } from '@/lib/auth';
import { useAudioPlayer } from "@/hooks/use-audio-player";


const priorities: { value: ProjectPriority; label: string; icon: React.ReactNode }[] = [
  { value: "No priority", label: "No priority", icon: <MoreHorizontal className="h-4 w-4 text-muted-foreground" /> },
  { value: "Urgent", label: "Urgent", icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
  { value: "High", label: "High", icon: <SignalHigh className="h-4 w-4 text-yellow-500" /> },
  { value: "Medium", label: "Medium", icon: <SignalMedium className="h-4 w-4 text-blue-500" /> },
  { value: "Low", label: "Low", icon: <SignalLow className="h-4 w-4 text-green-500" /> },
];

const statusIcons: Record<ProjectStatus, React.ReactNode> = {
    "On Track": <Circle className="h-3 w-3 text-green-500" />,
    "At Risk": <Circle className="h-3 w-3 text-yellow-500" />,
    "Off Track": <Circle className="h-3 w-3 text-red-500" />,
    "No updates": <Circle className="h-3 w-3 text-muted-foreground" />,
    "Done": <CheckCircle className="h-3 w-3 text-purple-500" />,
    "Backlog": <Circle className="h-3 w-3 text-gray-500" />,
    "Todo": <Circle className="h-3 w-3 text-gray-500" />,
    "In Progress": <Circle className="h-3 w-3 text-blue-500" />,
};

interface ProjectListProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  displayProperties: { name: string; active: boolean }[];
  colorMode?: 'none' | 'status' | 'priority' | 'type';
}

export function ProjectList({ projects, setProjects, displayProperties, colorMode = 'none' }: ProjectListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const albumId = searchParams.get('album');
  const { setCurrentTrack } = useAudioPlayer();

  const isPropertyActive = (name: string) => {
    return displayProperties.find(p => p.name === name)?.active;
  }

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, project: Project) => {
    try {
      e.dataTransfer.setData("application/json", JSON.stringify(project));
      e.dataTransfer.setData("text/plain", JSON.stringify({ id: project.id, name: project.name }));
      e.dataTransfer.effectAllowed = "move";
    } catch {}
  };
  
  const handlePriorityChange = (e: React.MouseEvent<Element, MouseEvent> | MouseEvent, projectId: string, priority: ProjectPriority) => {
    // Normalize and prevent row click from firing
    if ('stopPropagation' in e) e.stopPropagation();
    setProjects(projects.map(p => p.id === projectId ? { ...p, priority } : p));
  };

  const handleRowClick = (project: Project) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('id_token') : null;
    if (!token) {
      startLogin();
      return;
    }
    router.push(`/project?id=${encodeURIComponent(project.id)}&album=${encodeURIComponent(albumId || '')}`);
  };

  const handlePlayClick = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (project.finalSong) {
      // Attempt to refresh presigned URL before playback
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
      let playUrl = project.finalSong.url;
      try {
        const key = extractKeyFromUrl(project.finalSong.url);
        if (key) {
          const fresh = await api.presign({ key, action: 'get' });
          playUrl = fresh.url || playUrl;
        }
      } catch {}
      setCurrentTrack({ name: project.finalSong.name, url: playUrl });
    }
  };

  const [actionProjectId, setActionProjectId] = React.useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [confirmRestartOpen, setConfirmRestartOpen] = React.useState(false);

  const triggerDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setActionProjectId(projectId);
    setConfirmDeleteOpen(true);
  };
  const triggerRestart = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setActionProjectId(projectId);
    setConfirmRestartOpen(true);
  };
  const doDelete = async () => {
    if (!actionProjectId) return;
    try { await api.deleteProject(albumId || '', actionProjectId); } catch {}
    setProjects(projects.filter(p => p.id !== actionProjectId));
    setActionProjectId(null);
  };
  const doRestart = async () => {
    if (!actionProjectId) return;
    try { await api.resetProject(albumId || '', actionProjectId); } catch {}
    setProjects(projects.map(p => p.id === actionProjectId ? { ...p, verses: [], hooks: [], beats: [], samples: [], finalSong: null } : p));
    setActionProjectId(null);
  };

  const rowColorClass = (p: Project) => {
    switch (colorMode) {
      case 'status':
        return p.status === 'On Track'
          ? 'bg-green-500/5'
          : p.status === 'At Risk'
          ? 'bg-yellow-500/5'
          : p.status === 'Off Track'
          ? 'bg-red-500/5'
          : p.status === 'Done'
          ? 'bg-purple-500/5'
          : '';
      case 'priority':
        return p.priority === 'Urgent'
          ? 'bg-red-500/5'
          : p.priority === 'High'
          ? 'bg-yellow-500/5'
          : p.priority === 'Medium'
          ? 'bg-blue-500/5'
          : p.priority === 'Low'
          ? 'bg-green-500/5'
          : '';
      case 'type':
        return p.type === 'Song'
          ? 'bg-blue-500/5'
          : p.type === 'Video'
          ? 'bg-pink-500/5'
          : p.type === 'Idea'
          ? 'bg-amber-500/5'
          : '';
      default:
        return '';
    }
  };

  return (
    <TooltipProvider>
      {/* Mobile horizontal scroll wrapper */}
      <div className="w-full overflow-x-auto sm:overflow-visible">
      <Table className="min-w-[640px] sm:min-w-0">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-border/50 text-xs">
            <TableHead className="w-[400px]">Name</TableHead>
            {isPropertyActive('Status') && <TableHead>Status</TableHead>}
            {isPropertyActive('Priority') && <TableHead>Priority</TableHead>}
            {isPropertyActive('Lead') && <TableHead>Lead</TableHead>}
            {isPropertyActive('Target Date') && <TableHead>Target Date</TableHead>}
            {isPropertyActive('Share') && <TableHead>Share</TableHead>}
            {isPropertyActive('Progress') && <TableHead className="text-right">Progress</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow 
              key={project.id} 
              className={cn("cursor-pointer", rowColorClass(project))}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, project)}
              onClick={() => handleRowClick(project)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{project.emoji}</span>
                   <span className="hover:underline">
                    {project.name}
                  </span>
                  {project.finalSong && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handlePlayClick(e, project)}>
                            <Play className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Play: {project.finalSong.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e)=>e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e)=>triggerRestart(e, project.id)}>Restart</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e)=>triggerDelete(e, project.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </TableCell>
              {isPropertyActive('Status') && (
                <TableCell>
                   <div className="flex items-center gap-2">
                      {statusIcons[project.status]}
                      <span className="text-sm">{project.status}</span>
                  </div>
                </TableCell>
              )}
              {isPropertyActive('Priority') && (
                <TableCell>
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                          {priorities.find(p => p.value === project.priority)?.icon}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" onClick={(e) => e.stopPropagation()}>
                         <Command>
                          <CommandInput placeholder="Change priority..." />
                          <CommandGroup>
                             {priorities.map((p) => (
                              <CommandItem
                                key={p.value}
                                onSelect={() => handlePriorityChange(new MouseEvent('click'), project.id, p.value)}
                                className="flex justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  {p.icon}
                                  <span>{p.label}</span>
                                </div>
                                {project.priority === p.value && <Check className="h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                         </Command>
                      </PopoverContent>
                    </Popover>
                </TableCell>
              )}
              {isPropertyActive('Lead') && (
                <TableCell>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-muted">
                      <UserCircle2 className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
              )}
              {isPropertyActive('Target Date') && (
                <TableCell className="text-muted-foreground">
                  {format(project.targetDate, 'LLL d, yyyy')}
                </TableCell>
              )}
              {isPropertyActive('Share') && (
                <TableCell>
                  <span className="text-sm text-muted-foreground">0</span>
                </TableCell>
              )}
              {isPropertyActive('Progress') && (
                <TableCell className="text-right text-muted-foreground">
                  <div className="flex items-center justify-end gap-2">
                    <CircleDashed className="h-4 w-4" />
                    <span>{project.progress}%</span>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all of its contents in Project Detail. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRestartOpen} onOpenChange={setConfirmRestartOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This keeps the track but removes verses, hooks, beats, samples, and the final song from Project Detail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doRestart}>Restart</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
