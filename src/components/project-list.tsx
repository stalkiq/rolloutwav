
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project, ProjectType, ProjectPriority, ProjectStatus } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandInput } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
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
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  displayProperties: { name: string; active: boolean }[];
}

export function ProjectList({ projects, setProjects, displayProperties }: ProjectListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const albumId = searchParams.get('album');
  const { setCurrentTrack } = useAudioPlayer();

  const isPropertyActive = (name: string) => {
    return displayProperties.find(p => p.name === name)?.active;
  }

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, project: Project) => {
    e.dataTransfer.setData("application/json", JSON.stringify(project));
  };
  
  const handlePriorityChange = (e: React.MouseEvent, projectId: string, priority: ProjectPriority) => {
    e.stopPropagation(); // Prevent row click from firing
    setProjects(projects.map(p => p.id === projectId ? { ...p, priority } : p));
  };

  const handleRowClick = (project: Project) => {
    router.push(`/project/${project.id}?album=${albumId}`);
  };

  const handlePlayClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (project.finalSong) {
      setCurrentTrack({ name: project.finalSong.name, url: project.finalSong.url });
    }
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-border/50 text-xs">
            <TableHead className="w-[400px]">Name</TableHead>
            {isPropertyActive('Status') && <TableHead>Status</TableHead>}
            {isPropertyActive('Priority') && <TableHead>Priority</TableHead>}
            {isPropertyActive('Lead') && <TableHead>Lead</TableHead>}
            {isPropertyActive('Target Date') && <TableHead>Target Date</TableHead>}
            {isPropertyActive('Progress') && <TableHead className="text-right">Progress</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow 
              key={project.id} 
              className="cursor-pointer"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, project)}
              onClick={() => handleRowClick(project)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
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
                  {project.status === "No updates" ? (
                     <Tooltip>
                      <TooltipTrigger asChild>
                        <span>...</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>There are no updates for this project</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    formatDistanceToNow(project.targetDate, {
                      addSuffix: false,
                    })
                  )}
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
    </TooltipProvider>
  );
}
