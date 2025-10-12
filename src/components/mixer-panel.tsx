"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ContentFile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type MixerItem = {
  id: string;
  name: string;
  url: string;
  selected: boolean;
  volume: number; // 0..1
  position?: number; // seconds
  duration?: number; // seconds
  element?: HTMLAudioElement;
  node?: MediaElementAudioSourceNode;
  gain?: GainNode;
};

function extractKeyFromUrl(u: string): string | null {
  try {
    const parsed = new URL(u);
    const path = decodeURIComponent(parsed.pathname);
    if (parsed.hostname.includes(".s3")) {
      return path.startsWith("/") ? path.slice(1) : path;
    }
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2) return parts.slice(1).join("/");
    return null;
  } catch {
    return null;
  }
}

export default function MixerPanel({ files }: { files: ContentFile[] }) {
  const [items, setItems] = useState<MixerItem[]>(() =>
    files.map((f) => ({ id: f.id, name: f.name, url: f.url, selected: false, volume: 1 }))
  );
  const [isLoading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize context on first interaction
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const master = ctx.createGain();
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterGainRef.current = master;
    }
  }, []);

  // Reconcile internal state when files prop changes (e.g., new uploads)
  useEffect(() => {
    setItems((prev) => {
      const prevById = new Map(prev.map((p) => [p.id, p] as const));
      const next: MixerItem[] = files.map((f) => {
        const existing = prevById.get(f.id);
        return existing
          ? { ...existing, name: f.name, url: f.url }
          : { id: f.id, name: f.name, url: f.url, selected: false, volume: 1 };
      });
      return next;
    });
  }, [files]);

  async function getPlayableUrl(original: string): Promise<string> {
    const key = extractKeyFromUrl(original);
    try {
      if (key) {
        const fresh = await api.presign({ key, action: "get" });
        return fresh.url || original;
      }
    } catch {}
    return original;
  }

  async function ensureElement(item: MixerItem, ctx: AudioContext): Promise<HTMLAudioElement> {
    if (item.element) return item.element;
    const url = await getPlayableUrl(item.url);
    const el = new Audio();
    el.src = url;
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    el.addEventListener("loadedmetadata", () => {
      item.duration = isFinite(el.duration) ? el.duration : 0;
      setItems((prev) => [...prev]);
    });
    const node = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.value = item.volume ?? 1;
    node.connect(gain);
    gain.connect(masterGainRef.current!);
    item.node = node;
    item.gain = gain;
    item.element = el;
    if (typeof item.position !== 'number') item.position = 0;
    return el;
  }

  function destroySources() {
    setItems((prev) => {
      prev.forEach((it) => {
        try {
          if (it.element) {
            it.element.pause();
          }
        } catch {}
        try {
          it.node?.disconnect();
          it.gain?.disconnect();
        } catch {}
        it.node = undefined;
        it.gain = undefined;
        it.element = undefined;
      });
      return [...prev];
    });
  }

  async function handlePlay() {
    const ctx = ctxRef.current!;
    if (ctx.state === "suspended") await ctx.resume();
    setLoading(true);
    try {
      const selected = items.filter((i) => i.selected);
      if (selected.length === 0) return;
      destroySources();
      for (const it of selected) {
        const el = await ensureElement(it, ctx);
        try { el.currentTime = Math.max(0, Math.min(it.position ?? 0, it.duration ?? Infinity)); } catch {}
        await el.play().catch(() => {});
      }
      setItems([...items]);
      setIsPlaying(true);
    } finally {
      setLoading(false);
    }
  }

  async function handlePause() {
    const ctx = ctxRef.current!;
    await ctx.suspend();
    setIsPlaying(false);
  }

  async function handleResume() {
    const ctx = ctxRef.current!;
    await ctx.resume();
    setIsPlaying(true);
  }

  function handleStop() {
    destroySources();
    setIsPlaying(false);
  }

  const master = masterGainRef.current;

  function formatTime(sec: number): string {
    if (!isFinite(sec)) return "0:00";
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2,'0')}`;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {items.length === 0
          ? "No files yet. Upload tracks above and they’ll appear here immediately."
          : "Select multiple files and adjust per-track volumes. Click Play to start them in sync."}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-auto pr-2">
        {items.map((it) => (
          <div key={it.id} className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={it.selected}
                onChange={(e) => {
                  it.selected = e.target.checked;
                  setItems([...items]);
                }}
              />
              <span className="truncate flex-1">{it.name}</span>
              <div className="w-28 flex items-center gap-2">
                <Slider
                  value={[Math.round((it.volume ?? 1) * 100)]}
                  onValueChange={(v) => {
                    const val = (v[0] ?? 100) / 100;
                    it.volume = val;
                    if (it.gain) it.gain.gain.value = val;
                    setItems([...items]);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(it.position || 0)}
              </span>
              <Slider
                value={[Math.round(((it.position || 0) / Math.max(1, it.duration || 1)) * 100)]}
                onValueChange={async (v) => {
                  const pct = (v[0] ?? 0) / 100;
                  const nextTime = pct * (it.duration || 0);
                  it.position = nextTime;
                  if (it.element) {
                    try { it.element.currentTime = nextTime; } catch {}
                  }
                  setItems([...items]);
                }}
              />
              <span className="text-xs text-muted-foreground w-12">
                {formatTime(it.duration || 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <Button onClick={handlePlay} disabled={isLoading}>
            {isLoading ? "Loading..." : "Play"}
          </Button>
        ) : (
          <Button onClick={handlePause}>Pause</Button>
        )}
        {!isPlaying && (
          <Button variant="outline" onClick={handleResume} disabled={isLoading}>
            Resume
          </Button>
        )}
        <Button variant="outline" onClick={handleStop}>
          Stop
        </Button>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>Master</span>
          <div className="w-32">
            <Slider
              value={[Math.round((master?.gain.value ?? 1) * 100)]}
              onValueChange={(v) => {
                if (master) master.gain.value = (v[0] ?? 100) / 100;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


