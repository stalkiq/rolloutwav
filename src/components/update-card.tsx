
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Update } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Smile, TrendingUp } from "lucide-react";

interface UpdateCardProps {
    update: Update;
}

export function UpdateCard({ update }: UpdateCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className={cn("flex items-center gap-1.5 text-sm", {
                    "text-green-500": update.status === "On Track",
                    "text-yellow-500": update.status === "At Risk",
                    "text-red-500": update.status === "Off Track",
                    "text-muted-foreground": update.status === "No updates"
                })}>
                    <TrendingUp className="h-4 w-4" />
                    <span>{update.status}</span>
                </div>
                <Avatar className="h-6 w-6">
                    {update.avatar ? (
                        <AvatarImage src={update.avatar} alt={update.author} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {update.author.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{update.author}</span>
                <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(update.timestamp, { addSuffix: true })}
                </span>
            </div>
            <p className="text-foreground whitespace-pre-wrap">{update.text}</p>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <Smile className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
