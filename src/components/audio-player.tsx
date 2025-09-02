
"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { Pause, Play, X, Volume2, VolumeX } from "lucide-react";

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    isMuted,
    playPause,
    seek,
    toggleMute,
    closePlayer,
    formattedProgress,
    formattedDuration,
  } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-t border-border bg-background/80 px-6 backdrop-blur-lg">
      <div className="flex items-center gap-4 w-1/3">
        <span className="font-medium text-sm truncate">{currentTrack.name}</span>
      </div>
      
      <div className="flex flex-col items-center gap-2 w-1/3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={playPause}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
        </div>
        <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
          <span>{formattedProgress}</span>
          <Slider
            value={[progress]}
            max={duration}
            step={1}
            onValueChange={(value) => seek(value[0])}
            className="w-full"
          />
          <span>{formattedDuration}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-4 w-1/3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closePlayer}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
