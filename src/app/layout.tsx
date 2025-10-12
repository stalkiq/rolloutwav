import type {Metadata} from 'next';
import './globals.css';

import { ProjectProvider } from '@/context/project-context';
import { AudioPlayerProvider } from '@/hooks/use-audio-player';
import { AudioPlayer } from '@/components/audio-player';

export const metadata: Metadata = {
  title: 'Rollout HQ',
  description: 'The ultimate app for artists to plan their album rollout.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        {/* Favicon: solid yellow square to match provided image */}
        <link
          rel="icon"
          href={'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#ffff00"/></svg>')}
          sizes="any"
        />
      </head>
      <body className="font-body antialiased">
        <ProjectProvider>
          <AudioPlayerProvider>
            {children}
            <AudioPlayer />
          </AudioPlayerProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
