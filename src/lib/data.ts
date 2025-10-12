
import type { Project } from "@/lib/types";

export const initialProjects: Project[] = [
    {
      id: "1",
      name: "Track 1",
      emoji: "💡",
      status: "On Track",
      targetDate: new Date("2024-08-10"),
      type: "Idea",
      priority: "No priority",
      lead: "You",
      progress: 0,
      description: "A collection of new song and video ideas.",
       updates: [
        {
          id: crypto.randomUUID(),
          text: " brainstormed some new concepts for the album art.",
          author: "Stalkiq",
          avatar: "",
          status: "On Track",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        }
      ],
      artists: [],
      producers: [],
      writers: [],
    },
    {
      id: "2",
      name: "Track 2",
      emoji: "🎵",
      status: "On Track",
      targetDate: new Date("2024-08-12"),
      type: "Song",
      priority: "Medium",
      lead: "You",
      progress: 0,
      description: "Developing the lead single for the upcoming album.",
      updates: [
        {
          id: crypto.randomUUID(),
          text: "The first draft of the lyrics is complete. Moving on to vocal recording.",
          author: "Stalkiq",
          avatar: "",
          status: "On Track",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        }
      ],
      artists: [],
      producers: [],
      writers: [],
    },
    {
      id: "3",
      name: "Music video",
      emoji: "🧪",
      status: "On Track",
      targetDate: new Date("2024-08-15"),
      type: "Other",
      priority: "High",
      lead: "You",
      progress: 0,
      description: "Experimental sound design project.",
       updates: [
        {
            id: crypto.randomUUID(),
            text: "Need to figure out how to get random users like monkey app or Omegle",
            author: "almoreau589",
            avatar: "https://i.pravatar.cc/32?u=almoreau589",
            status: "On Track",
            timestamp: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
        },
        {
            id: crypto.randomUUID(),
            text: "Initial project setup complete. Ready for development.",
            author: "Stalkiq",
            avatar: "",
            status: "On Track",
            timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        }
      ],
      artists: [],
      producers: [],
      writers: [],
    }
  ];

    
