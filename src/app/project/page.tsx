"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProjectDetailContent } from './[id]/project-detail-content';

function ProjectPageInner() {
  const search = useSearchParams();
  const router = useRouter();
  const id = search.get('id');
  if (!id) {
    if (typeof window !== 'undefined') router.replace('/dashboard');
    return null;
  }
  return <ProjectDetailContent />;
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectPageInner />
    </Suspense>
  );
}


