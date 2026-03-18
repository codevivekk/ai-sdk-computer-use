import React from "react";
import { motion } from "motion/react";
import { type AIEvent } from "@/types/event";
import { useActiveEvents } from "@/stores/event-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import {
  Camera,
  CheckCircle,
  CircleSlash,
  Clock,
  Keyboard,
  KeyRound,
  Loader2,
  MousePointer,
  MousePointerClick,
  ScrollText,
  StopCircle,
} from "lucide-react";

export interface ToolCardProps {
  event: AIEvent;
}

export function ToolCard({ event }: ToolCardProps) {
  const selectedEventId = useUIStore((s) => s.selectedEventId);
  const setSelectedEventId = useUIStore((s) => s.setSelectedEventId);

  const isSelected = selectedEventId === event.id;

  let actionLabel = "";
  let actionDetail = "";
  let ActionIcon: React.ElementType = MousePointer;

  switch (event.type) {
    case "typing":
      actionLabel = "Typing";
      actionDetail = `"${event.payload.text}"`;
      ActionIcon = Keyboard;
      break;
    case "key_press":
      actionLabel = "Pressing key";
      actionDetail = `"${event.payload.key}"`;
      ActionIcon = KeyRound;
      break;
    case "screenshot":
      actionLabel = "Taking screenshot";
      ActionIcon = Camera;
      break;
    case "wait":
      actionLabel = "Waiting";
      actionDetail = `${event.payload.durationMs / 1000} seconds`;
      ActionIcon = Clock;
      break;
    case "bash":
      actionLabel = "Running command";
      actionDetail = event.payload.command.length > 40
        ? event.payload.command.slice(0, 40) + "..."
        : event.payload.command;
      ActionIcon = ScrollText;
      break;
    case "mouse":
      switch (event.payload.action) {
        case "left_click":
          actionLabel = "Left clicking";
          actionDetail = event.payload.coordinate ? `at (${event.payload.coordinate[0]}, ${event.payload.coordinate[1]})` : "";
          ActionIcon = MousePointer;
          break;
        case "right_click":
          actionLabel = "Right clicking";
          actionDetail = event.payload.coordinate ? `at (${event.payload.coordinate[0]}, ${event.payload.coordinate[1]})` : "";
          ActionIcon = MousePointerClick;
          break;
        case "double_click":
          actionLabel = "Double clicking";
          actionDetail = event.payload.coordinate ? `at (${event.payload.coordinate[0]}, ${event.payload.coordinate[1]})` : "";
          ActionIcon = MousePointerClick;
          break;
        case "mouse_move":
          actionLabel = "Moving mouse";
          actionDetail = event.payload.coordinate ? `to (${event.payload.coordinate[0]}, ${event.payload.coordinate[1]})` : "";
          ActionIcon = MousePointer;
          break;
        default:
          actionLabel = event.payload.action;
          ActionIcon = MousePointer;
          break;
      }
      break;
    case "scroll":
      actionLabel = "Scrolling";
      actionDetail = (event.payload.direction && event.payload.amount)
        ? `${event.payload.direction} by ${event.payload.amount}`
        : "";
      ActionIcon = ScrollText;
      break;
    default:
      actionLabel = "Executing action";
      break;
  }

  return (
    <motion.div
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={() => setSelectedEventId(event.id)}
      className={cn(
        "flex flex-col gap-2 p-2 mb-3 text-sm rounded-md border cursor-pointer transition-colors",
        isSelected
          ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 ring-1 ring-black/10 dark:ring-white/10"
          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      )}
    >
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center w-8 h-8 bg-zinc-50 dark:bg-zinc-800 rounded-full">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
        </div>
        <div className="flex-1 ml-2">
          <div className="font-medium font-mono flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span>{actionLabel}</span>
            {actionDetail && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                {actionDetail}
              </span>
            )}
          </div>
          {event.duration !== undefined && (
            <div className="text-[10px] text-zinc-400">
              Duration: {(event.duration / 1000).toFixed(2)}s
            </div>
          )}
        </div>
        <div className="w-5 h-5 flex items-center justify-center ml-2">
          {event.status === "pending" ? (
            <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
          ) : event.status === "error" ? (
            <StopCircle className="h-4 w-4 text-red-500" />
          ) : event.status === "aborted" ? (
            <CircleSlash size={14} className="text-amber-600" />
          ) : (
            <CheckCircle size={14} className="text-green-600" />
          )}
        </div>
      </div>
      
      {event.type === "screenshot" && event.status === "pending" && (
         <div className="w-full aspect-[1024/768] rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse mt-2"></div>
      )}

      {/* Optional: we can display bash command response securely here */}
      {/* {event.type === "bash" && event.status === "success" && event.payload.stdout && (
         <pre className="text-xs text-zinc-600 bg-white p-2 rounded border max-h-[150px] overflow-auto">
           {event.payload.stdout}
         </pre>
      )} */}
    </motion.div>
  );
}

export function ToolCardWrapper({ toolCallId }: { toolCallId: string }) {
  const events = useActiveEvents();
  const event = events.find((e) => e.id === toolCallId);

  if (!event) return null;

  return <ToolCard event={event} />;
}
