"use client";

import { getDesktopURL } from "@/lib/sandbox/utils";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ABORTED } from "@/lib/utils";
import { LeftPanel, ChatInterface } from "@/components/layout/LeftPanel";
import { RightPanel } from "@/components/layout/RightPanel";
import { SidebarPanel } from "@/components/layout/Sidebar";
import { useSessionStore } from "@/stores/session-store";
import { useUIStore } from "@/stores/ui-store";

function ChatSession({ sessionId }: { sessionId: string }) {
  const [desktopContainerRef, desktopEndRef] = useScrollToBottom();
  const [mobileContainerRef, mobileEndRef] = useScrollToBottom();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isWaitingForNextStep, setIsWaitingForNextStep] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const activeSession = useSessionStore((s) =>
    s.sessions.find((session) => session.id === sessionId)
  );
  const updateSession = useSessionStore((s) => s.updateSession);
  const setSelectedEventId = useUIStore((s) => s.setSelectedEventId);
  // Initialize UI selection on newly mounted session safely dropping previously locked items
  useEffect(() => {
    if (activeSession) {
      setSelectedEventId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sandboxId, setSandboxId] = useState<string | null>(
    activeSession?.sandboxId || null
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: sessionId,
    initialMessages: activeSession?.messages || [],
    body: {
      sandboxId,
    },
    maxSteps: 30,
    onError: (error) => {
      console.error("Chat Error:", error);
      let errorMessage = "Please try again later.";
      
      if (error.message?.toLowerCase().includes("rate limit") || error.message?.includes("429")) {
        errorMessage = "You have exceeded the rate limit. Please wait a minute and try again.";
      }
      
      toast.error("There was an error", {
        description: errorMessage,
        richColors: true,
        position: "top-center",
      });
    },
    fetch: async (url, options) => {
      if (options?.body) {
        try {
          const body = JSON.parse(options.body as string);
          const messages = body.messages;
          if (Array.isArray(messages) && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            
            // Check if this request is sending tool results back to the server.
            // In the AI SDK, this is usually a message with role 'tool', or parts containing 'tool-result'
            const isToolResponse = 
              lastMessage.role === "tool" || 
              (Array.isArray(lastMessage.parts) && lastMessage.parts.some((p: any) => p.type === "tool-result" || p.type === "tool-invocation"));
            
            if (isToolResponse) {
              setIsWaitingForNextStep(true);
              console.log("Waiting 10 seconds after event before next step...");
              await new Promise(resolve => setTimeout(resolve, 10000));
              setIsWaitingForNextStep(false);
            }
          }
        } catch (e) {
          console.error("Error in custom fetch interceptor", e);
        }
      }
      return fetch(url, options);
    },
  });

  // Sync messages into local session storage constantly
  useEffect(() => {
    if (messages) {
      updateSession(sessionId, { messages });
    }
  }, [messages, sessionId, updateSession]);

  const stop = () => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  };

  const isLoading = status !== "ready";

  const refreshDesktop = useCallback(async () => {
    try {
      setIsInitializing(true);
      const { streamUrl, id } = await getDesktopURL(sandboxId || undefined);
      setStreamUrl(streamUrl);
      setSandboxId(id);
      updateSession(sessionId, { sandboxId: id });
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [sandboxId, sessionId, updateSession]);

  useEffect(() => {
    if (!sandboxId) return;

    const killDesktop = () => {
      if (!sandboxId) return;
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );
    };

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      window.addEventListener("pagehide", killDesktop);
      return () => {
        window.removeEventListener("pagehide", killDesktop);
        killDesktop();
      };
    } else {
      window.addEventListener("beforeunload", killDesktop);
      return () => {
        window.removeEventListener("beforeunload", killDesktop);
        killDesktop();
      };
    }
  }, [sandboxId]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        const { streamUrl, id } = await getDesktopURL(sandboxId ?? undefined);
        setStreamUrl(streamUrl);
        setSandboxId(id);
        updateSession(sessionId, { sandboxId: id });
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
      } finally {
        setIsInitializing(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chatProps = {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status: status as "submitted" | "streaming" | "ready" | "error",
    stop,
    isLoading,
    append,
    containerRef: desktopContainerRef,
    endRef: desktopEndRef,
    isInitializing,
    isWaitingForNextStep,
  };

  const mobileChatProps = {
    ...chatProps,
    containerRef: mobileContainerRef,
    endRef: mobileEndRef,
  };

  return (
    <>
      <div className="w-full hidden xl:block h-full flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <LeftPanel chatProps={chatProps} />
          <ResizableHandle withHandle />
          <RightPanel
            streamUrl={streamUrl}
            isInitializing={isInitializing}
            refreshDesktop={refreshDesktop}
          />
        </ResizablePanelGroup>
      </div>
      <div className="w-full xl:hidden flex flex-col h-full flex-1 relative z-0">
        <ChatInterface {...mobileChatProps} />
      </div>
    </>
  );
}

export default function ChatMain() {
  const { activeSessionId, createSession, sessions } = useSessionStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  if (!mounted) return null;

  return (
    <div className="flex h-dvh relative bg-white dark:bg-zinc-950 w-full overflow-hidden">
      <div className="flex items-center justify-center fixed left-1/2 -translate-x-1/2 top-5 shadow-md text-xs mx-auto rounded-lg h-8 w-fit bg-blue-600 text-white px-3 py-2 text-left z-50 xl:hidden">
        <span>Headless mode</span>
      </div>

      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <SidebarPanel />
        <ResizableHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={80} className="flex-1 h-full min-w-0">
          {activeSessionId ? (
            <ChatSession key={activeSessionId} sessionId={activeSessionId} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
               <p className="text-zinc-500">Pick or create a session to chat.</p>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
