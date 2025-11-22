"use client";

import { useState, useRef } from "react";
import { Wand2, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LyricsEditorProps {
  initialLyrics: string;
  onSave: (lyrics: string) => void;
}

export function LyricsEditor({ initialLyrics, onSave }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<"rhyme" | "continue" | "rewrite">("continue");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");

  const handleSave = () => {
    onSave(lyrics);
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiResult("");
    
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let result = "";
    switch (aiMode) {
        case "rhyme":
            result = `Here are some rhymes for "${aiPrompt}":\n- Time\n- Prime\n- Climb\n- Sublime\n- Crime`;
            break;
        case "continue":
            result = `(AI generated continuation based on "${aiPrompt}"):\n\nWalking down the street, lights are low\nNowhere left to hide, nowhere left to go\nCan you hear the sound, beating in my chest\nPut me to the test, put me to the test`;
            break;
        case "rewrite":
            result = `(Rewritten version):\n\nShadows stretching long across the floor\nDon't know what I'm waiting for anymore\nHeartbeat racing, moving fast\nHoping this moment is gonna last`;
            break;
    }
    
    setAiResult(result);
    setAiLoading(false);
  };

  const insertAiResult = () => {
    setLyrics(prev => prev + (prev ? "\n\n" : "") + aiResult);
    setIsAiOpen(false);
    setAiResult("");
    setAiPrompt("");
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Lyrics</h3>
        <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Wand2 className="h-4 w-4 text-purple-500" />
                    AI Assistant
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>AI Lyrics Assistant</DialogTitle>
                    <DialogDescription>
                        Get help with rhymes, writer's block, or rewriting lines.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Mode</Label>
                        <Select value={aiMode} onValueChange={(v: any) => setAiMode(v)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="continue">Continue / Generate Verse</SelectItem>
                                <SelectItem value="rhyme">Find Rhymes</SelectItem>
                                <SelectItem value="rewrite">Rewrite / Polish</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="prompt" className="text-right">
                            {aiMode === "rhyme" ? "Word" : "Topic / Context"}
                        </Label>
                        <Input 
                            id="prompt" 
                            value={aiPrompt} 
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder={aiMode === "rhyme" ? "Enter a word..." : "What should the lyrics be about?"}
                            className="col-span-3" 
                        />
                    </div>
                    
                    {aiResult && (
                        <div className="mt-4 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap border">
                            {aiResult}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {aiResult ? (
                        <>
                            <Button variant="outline" onClick={() => setAiResult("")}>Back</Button>
                            <Button onClick={insertAiResult}>Insert into Lyrics</Button>
                        </>
                    ) : (
                        <Button onClick={handleAiGenerate} disabled={!aiPrompt || aiLoading}>
                            {aiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      
      <Textarea
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Write your lyrics here..."
        className="min-h-[300px] font-mono text-sm leading-relaxed resize-y"
      />
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={lyrics === initialLyrics}>
            Save Lyrics
        </Button>
      </div>
    </div>
  );
}

