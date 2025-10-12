"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Project, ProjectStatus, ContentFile } from '@/lib/types';
import { api } from '@/lib/api';

interface AlbumData {
  albumName: string;
  projects: Project[];
}

interface ProjectContextType {
  projectsByAlbum: Record<string, AlbumData>;
  getProjectsForAlbum: (albumId: string) => Project[];
  setProjectsForAlbum: (albumId: string, projects: Project[]) => void;
  addProjectToAlbum: (albumId: string, project: Omit<Project, 'id'>) => void;
  createAlbum: (albumId: string, albumName: string) => void;
  updateProjectStatus: (albumId: string, projectId: string, status: ProjectStatus) => void;
  updateProject: (albumId: string, updatedProject: Project) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projectsByAlbum, setProjectsByAlbum] = useState<Record<string, AlbumData>>({});

  const getProjectsForAlbum = (albumId: string): Project[] => {
    return projectsByAlbum[albumId]?.projects || [];
  };

  const setProjectsForAlbum = (albumId: string, projects: Project[]) => {
    setProjectsByAlbum(prev => ({
      ...prev,
      [albumId]: { ...prev[albumId], projects },
    }));
  };

  const addProjectToAlbum = (albumId: string, project: Omit<Project, 'id'>) => {
    const newProject: Project = { ...project, id: crypto.randomUUID() };
    const currentProjects = projectsByAlbum[albumId]?.projects || [];
    const updatedProjects = [...currentProjects, newProject].sort(
        (a, b) => a.targetDate.getTime() - b.targetDate.getTime()
    );
    setProjectsForAlbum(albumId, updatedProjects);
  };
  
  const createAlbum = (albumId: string, albumName: string) => {
    if (!projectsByAlbum[albumId]) {
      setProjectsByAlbum(prev => ({
        ...prev,
        [albumId]: { albumName, projects: [] }
      }));
    }
  };

  const updateProjectStatus = (albumId: string, projectId: string, status: ProjectStatus) => {
    const currentProjects = projectsByAlbum[albumId]?.projects || [];
    const updatedProjects = currentProjects.map(p => 
      p.id === projectId ? { ...p, status: status } : p
    );
    setProjectsForAlbum(albumId, updatedProjects);
  };

  const updateProject = (albumId: string, updatedProject: Project) => {
    const currentProjects = projectsByAlbum[albumId]?.projects || [];
    const updatedProjects = currentProjects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjectsForAlbum(albumId, updatedProjects);
  };

  return (
    <ProjectContext.Provider value={{ projectsByAlbum, getProjectsForAlbum, setProjectsForAlbum, addProjectToAlbum, createAlbum, updateProjectStatus, updateProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
