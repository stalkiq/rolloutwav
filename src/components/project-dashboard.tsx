
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
import { Plus, SlidersHorizontal, Eye, List, Columns, GanttChartSquare } from "lucide-react";
import { useProjectContext } from "@/context/project-context";


interface ProjectDashboardProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  albumName: string;
  albumId: string;
}

type DisplayProperty = {
  name: string;
  active: boolean;
};


export function ProjectDashboard({ projects, setProjects, albumName, albumId }: ProjectDashboardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addProjectToAlbum } = useProjectContext();
  const { api } = require('@/lib/api');
  const [displayProperties, setDisplayProperties] = useState<DisplayProperty[]>([
    { name: "Status", active: true },
    { name: "Priority", active: false },
    { name: "Type", active: false },
    { name: "Lead", active: false },
    { name: "Target Date", active: true },
    { name: "Share", active: true },
    { name: "Progress", active: true },
  ]);
  const [colorMode, setColorMode] = useState<'none' | 'status' | 'priority' | 'type'>('none');

  const handleAddProject = async (project: Omit<Project, "id">) => {
    const payload = {
      albumId,
      name: project.name,
      status: project.status,
      priority: project.priority,
      targetDate: project.targetDate ? project.targetDate.toISOString() : undefined,
      type: project.type,
    };
    try {
      const created = await api.createProject(payload);
      const fallbackDate = project.targetDate ?? (created?.targetDate ? new Date(created.targetDate) : new Date(Date.now() + 365*24*60*60*1000));
      const newProject: Project = { ...project, id: created.projectId, targetDate: fallbackDate };
      const newProjects = [...projects, newProject].sort((a, b) => (a.targetDate?.getTime?.() ?? 0) - (b.targetDate?.getTime?.() ?? 0));
      setProjects(newProjects);
      setIsDialogOpen(false);
    } catch (e) {
      // no-op UI stays open; backend error likely auth
    }
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
                  <div className="p-2 space-y-3">
                    <div>
                      <Label className="text-sm font-normal">Display properties</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {displayProperties.map(prop => (
                          <Button key={prop.name} variant={prop.active ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => toggleProperty(prop.name)}>
                            {prop.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal">Row highlighting</Label>
                      <Select value={colorMode} onValueChange={(v: 'none' | 'status' | 'priority' | 'type') => setColorMode(v)}>
                        <SelectTrigger className="w-full h-7 text-xs">
                          <SelectValue placeholder="Highlight rows by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
              <ProjectList projects={projects} setProjects={setProjects} displayProperties={displayProperties} colorMode={colorMode} />
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
