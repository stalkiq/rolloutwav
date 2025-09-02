
"use client";

import { format } from "date-fns";
import { Music, Upload, MessageSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  type: "Upload" | "Update";
  timestamp: Date;
  title: string;
  description: string;
  contentType?: "Verse" | "Hook" | "Beat" | "Sample" | "Song";
};

interface ProjectTimelineProps {
  events: TimelineEvent[];
}

export function ProjectTimeline({ events }: ProjectTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <p className="text-muted-foreground">No timeline events yet. <br/> Upload a file or add an update to get started.</p>
      </div>
    );
  }

  const getIconOrTime = (event: TimelineEvent) => {
    switch (event.type) {
      case "Update":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "Upload":
        if(event.contentType === 'Song') {
            return <Music className="h-4 w-4 text-green-400" />
        }
        return <span className="text-xs font-semibold text-muted-foreground">{format(event.timestamp, "p")}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="relative pl-8 py-6">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-border"></div>
      <ul className="space-y-12">
        {events.map((event, index) => (
          <li key={event.id} className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-primary">
              {getIconOrTime(event)}
            </div>
            <div className={cn("flex items-start w-full", index % 2 === 0 ? "justify-start" : "justify-end")}>
               <div className={cn("w-[calc(50%-2rem)] space-y-1", index % 2 === 0 ? "text-left" : "text-right")}>
                 <p className="text-sm text-muted-foreground">{format(event.timestamp, "MMM d, yyyy")}</p>
                 <h4 className="font-semibold text-foreground">{event.title}</h4>
                 <p className="text-sm text-muted-foreground break-words">{event.description}</p>
               </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
