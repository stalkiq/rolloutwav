
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

  const formatTime = (event: TimelineEvent) => (
    <span className="text-xs font-semibold text-muted-foreground">{format(event.timestamp, "p")}</span>
  );

  return (
    <div className="relative py-4">
      <ul className="space-y-8">
        {events.map((event, index) => (
          <li key={event.id} className="relative">
            <div className="flex items-start w-full">
              <div className="w-24 shrink-0 pt-1">{formatTime(event)}</div>
              <div className="flex-1 space-y-1">
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
