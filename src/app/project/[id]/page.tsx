import { ProjectDetailContent } from "./project-detail-content";

// Generate static params for static export
export async function generateStaticParams() {
  // For static export, we'll generate a few common project IDs
  // In a real app, you might fetch these from an API or database
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
  ];
}

export default function ProjectDetailPage() {
    return (
        <ProjectDetailContent />
    )
}