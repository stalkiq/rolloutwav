
"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { ProjectList } from "@/components/project-list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, SlidersHorizontal, Eye, List, Columns, GanttChartSquare, ArrowDownUp, GripVertical } from "lucide-react";
import { useProjectContext } from "@/context/project-context";


interface ProjectDashboardProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  albumName: string;
}

type DisplayProperty = {
  name: string;
  active: boolean;
};


export function ProjectDashboard({ projects, setProjects, albumName }: ProjectDashboardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addProjectToAlbum } = useProjectContext();
  const [displayProperties, setDisplayProperties] = useState<DisplayProperty[]>([
    { name: "Milestones", active: false },
    { name: "Priority", active: true },
    { name: "Status", active: true },
    { name: "Teams", active: false },
    { name: "Lead", active: true },
    { name: "Members", active: false },
    { name: "Dependencies", active: false },
    { name: "Start Date", active: false },
    { name: "Target Date", active: true },
    { name: "Created", active: false },
    { name: "Updated", active: false },
    { name: "Completed", active: false },
    { name: "Labels", active: false },
    { name: "Progress", active: true },
  ]);

  const handleAddProject = (project: Omit<Project, "id">) => {
    const newProject: Project = { ...project, id: crypto.randomUUID() };
    const newProjects = [...projects, newProject].sort(
        (a, b) => a.targetDate.getTime() - b.targetDate.getTime()
      );
    setProjects(newProjects);
    setIsDialogOpen(false);
  };

  const toggleProperty = (propertyName: string) => {
    setDisplayProperties(prev => 
      prev.map(prop => 
        prop.name === propertyName ? { ...prop, active: !prop.active } : prop
      )
    );
  };


  return (
    <>
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onProjectCreate={handleAddProject}
      />
      <div className="flex flex-col h-full">
          <header className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">{albumName} Projects</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add project
              </Button>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Display
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <div className="p-2">
                    <div className="grid grid-cols-3 gap-1">
                      <Button variant="ghost" size="sm" className="h-auto py-1.5 bg-accent">
                        <List className="mr-2 h-4 w-4" /> List
                      </Button>
                      <Button variant="ghost" size="sm" className="h-auto py-1.5">
                        <Columns className="mr-2 h-4 w-4" /> Board
                      </Button>
                      <Button variant="ghost" size="sm" className="h-auto py-1.5">
                        <GanttChartSquare className="mr-2 h-4 w-4" /> Timeline
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-2">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span>Grouping</span>
                       </div>
                       <Select defaultValue="lead">
                          <SelectTrigger className="w-[150px] h-7 text-xs">
                            <SelectValue placeholder="Select grouping" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span>Sub-grouping</span>
                       </div>
                       <Select defaultValue="none">
                          <SelectTrigger className="w-[150px] h-7 text-xs">
                            <SelectValue placeholder="Select sub-grouping" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No grouping</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowDownUp className="h-4 w-4" />
                        <span>Ordering</span>
                       </div>
                       <Select defaultValue="manual">
                          <SelectTrigger className="w-[150px] h-7 text-xs">
                            <SelectValue placeholder="Select ordering" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="target-date">Target Date</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                  </div>
                   <DropdownMenuSeparator />
                    <div className="p-2 space-y-3">
                      <Label className="text-xs font-normal text-muted-foreground">List options</Label>
                       <div className="flex items-center justify-between">
                          <Label htmlFor="show-empty-groups" className="text-sm font-normal">Show empty groups</Label>
                          <Switch id="show-empty-groups" />
                       </div>
                        <div>
                          <Label className="text-sm font-normal">Display properties</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {displayProperties.map(prop => (
                              <Button key={prop.name} variant={prop.active ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => toggleProperty(prop.name)}>
                                {prop.name}
                              </Button>
                            ))}
                          </div>
                          <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs text-muted-foreground">Add label group...</Button>
                        </div>
                    </div>
                  <DropdownMenuSeparator />
                   <div className="p-2 flex justify-between items-center">
                     <Button variant="ghost" size="sm" className="h-7 text-xs">Reset</Button>
                     <Button variant="ghost" size="sm" className="h-7 text-xs">Set default for everyone</Button>
                   </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex items-center pb-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          <div className="flex-grow rounded-lg border">
            {projects.length > 0 ? (
              <ProjectList projects={projects} setProjects={setProjects} displayProperties={displayProperties} />
            ) : (
              <div className="flex items-center justify-center h-full text-center p-8">
                 <p className="text-muted-foreground">This album has no projects yet. <br/> Click "Add project" to get started.</p>
              </div>
            )}
          </div>
      </div>
    </>
  );
}
