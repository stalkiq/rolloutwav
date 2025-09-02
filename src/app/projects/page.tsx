
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronsUpDown,
  Home as HomeIcon,
  LayoutGrid,
  MessageSquare,
  Plus,
  Rocket,
  Search,
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


export default function ProjectsPage() {
  const [isAlbumArtOpen, setAlbumArtOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
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
    if (albumId) {
      setProjectsForAlbum(albumId, projects);
    }
  };

  const handleAlbumSwitch = (newAlbumId: string) => {
    router.push(`/projects?album=${newAlbumId}`);
  };


  useEffect(() => {
    const currentAlbumId = searchParams.get('album');
    if (currentAlbumId) {
        setAlbumId(currentAlbumId);
        const formattedName = projectsByAlbum[currentAlbumId]?.albumName || currentAlbumId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        setAlbumName(formattedName);
    }
  }, [searchParams, projectsByAlbum]);

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
  
  const handleDropOnSidebar = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const projectData = e.dataTransfer.getData("application/json");
    
    if (projectData && albumId) {
      const project: Project = JSON.parse(projectData);
      updateProjectStatus(albumId, project.id, 'Done');
      
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <svg
                  className="size-4"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <path d="M7.74,1.93,1.93,7.74a.5.5,0,0,0,0,.7l.88.88a.5.5,0,0,0,.7,0l3.85-3.85a.5.5,0,0,1,.7,0l3.85,3.85a.5.5,0,0,0,.7,0l.88-.88a.5.5,0,0,0,0,.7L8.45,1.93a1,1,0,0,0-1.42,0Z" />
                  <path d="M12.5,10v2.5a1,1,0,0,1-1,1h-7a1,1,0,0,1-1,1V10H2.5A1.5,1.5,0,0,0,1,11.5v1A1.5,1.5,0,0,0,2.5,14h11A1.5,1.5,0,0,0,15,12.5v-1A1.5,1.5,0,0,0,13.5,10Z" />
                </svg>
              </Button>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2">
             <Dialog open={isAlbumArtOpen} onOpenChange={setAlbumArtOpen}>
              <DialogTrigger asChild>
                <div 
                  className={cn(
                    "aspect-square p-2 flex flex-col justify-end rounded-lg bg-card border-2 border-dashed border-gray-600 cursor-pointer hover:border-gray-400 transition-colors",
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
                    <h3 className="font-bold text-lg text-green-400">{albumName} Cover</h3>
                   )}
                   {isDraggingOver && <p className="text-sm text-primary mt-1">Drop to complete</p>}
                </div>
              </DialogTrigger>
              <DialogContent className="p-0 border-0 max-w-lg bg-transparent shadow-none">
                <VisuallyHidden>
                  <DialogTitle>{albumName} Cover</DialogTitle>
                </VisuallyHidden>
                <Image
                  src="https://placehold.co/600x600.png"
                  alt={`${albumName} Cover`}
                  width={600}
                  height={600}
                  data-ai-hint="album cover"
                  className="rounded-lg"
                />
              </DialogContent>
            </Dialog>
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
                <SidebarMenuButton variant="ghost" className="text-muted-foreground justify-start">
                  Invite people
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton variant="ghost" className="text-muted-foreground justify-start">
                      Drop album
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>DistroKid</DropdownMenuItem>
                    <DropdownMenuItem>TuneCore</DropdownMenuItem>
                    <DropdownMenuItem>CD Baby</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
