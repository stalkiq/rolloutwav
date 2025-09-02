
export type ProjectStatus = "On Track" | "At Risk" | "Off Track" | "No updates" | "Done" | "Backlog" | "Todo" | "In Progress";
export type ProjectType = "Song" | "Video" | "Feature" | "Idea" | "Other";
export type ProjectPriority = "No priority" | "Urgent" | "High" | "Medium" | "Low";

export type Artist = {
  name: string;
  email: string;
  phone: string;
};

export type ContentFile = { 
  id: string; 
  name: string; 
  url: string; 
  timestamp: Date;
  // The File object is not included here to keep the type serializable
  // It will be handled in the component state only
};

export type Project = {
  id: string;
  name: string;
  emoji?: string;
  status: ProjectStatus;
  targetDate: Date;
  type: ProjectType;
  priority: ProjectPriority;
  lead: string;
  progress: number;
  description?: string;
  updates?: Update[];
  artists?: Artist[];
  producers?: Artist[];
  writers?: Artist[];
  verses?: ContentFile[];
  hooks?: ContentFile[];
  beats?: ContentFile[];
  samples?: ContentFile[];
  finalSong?: ContentFile | null;
};

export type Update = {
  id: string;
  text: string;
  author: string;
  avatar: string;
  status: "On Track" | "At Risk" | "Off Track" | "No updates";
  timestamp: Date;
};
