"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, MapPin, Plane, Hotel, Compass, StickyNote } from "lucide-react";
import type { AgentEvent } from "@wanderly/ai";

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
}

interface ToolCall {
  id: string;
  toolName: string;
  input: unknown;
  result?: unknown;
  status: "pending" | "done" | "error";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  search_flights:     <Plane className="h-3.5 w-3.5" />,
  search_hotels:      <Hotel className="h-3.5 w-3.5" />,
  search_activities:  <Compass className="h-3.5 w-3.5" />,
  get_destination_info: <MapPin className="h-3.5 w-3.5" />,
  save_itinerary:     <StickyNote className="h-3.5 w-3.5" />,
};

const TOOL_LABELS: Record<string, string> = {
  search_flights:      "Searching flights",
  search_hotels:       "Searching hotels",
  search_activities:   "Searching activities",
  get_destination_info: "Getting destination info",
  save_itinerary:      "Saving itinerary",
};

function ToolCallBadge({ call }: { call: ToolCall }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-ink-mute bg-paper-warm border border-line rounded px-2 py-1">
      {TOOL_ICONS[call.toolName] ?? <Compass className="h-3.5 w-3.5" />}
      <span>{TOOL_LABELS[call.toolName] ?? call.toolName}</span>
      {call.status === "pending" && (
        <Loader2 className="h-3 w-3 animate-spin ml-1" />
      )}
      {call.status === "done" && (
        <span className="text-teal ml-1">✓</span>
      )}
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.role === "assistant" && (
        <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center text-cream text-xs font-semibold flex-shrink-0 mt-1">
          W
        </div>
      )}
      <div className={`max-w-[80%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1">
            {message.toolCalls.map((call) => (
              <ToolCallBadge key={call.id} call={call} />
            ))}
          </div>
        )}
        {message.content && (
          <div
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              message.role === "user"
                ? "bg-terracotta text-cream rounded-tr-sm"
                : "bg-paper-warm text-ink border border-line rounded-tl-sm"
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
      {message.role === "user" && (
        <div className="w-8 h-8 rounded-full bg-ink-soft flex items-center justify-center text-cream text-xs font-semibold flex-shrink-0 mt-1">
          You
        </div>
      )}
    </div>
  );
}

const STARTER_PROMPTS = [
  "Plan a 5-day food trip to Bangkok in October, budget ~$1,800",
  "I want to explore Tokyo for 7 days in August — culture, food, and a day trip",
  "Weekend escape to Istanbul, budget $600, just one person",
];

export function PlanShell({
  trips,
  initialTripId,
}: {
  trips: Trip[];
  initialTripId?: string;
}) {
  const [selectedTripId, setSelectedTripId] = useState(initialTripId ?? trips[0]?.id ?? "");
  const [messages, setMessages]             = useState<Message[]>([]);
  const [inputText, setInputText]           = useState("");
  const [sessionId, setSessionId]           = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming]       = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || !selectedTripId || isStreaming) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const assistantMsg: Message = { role: "assistant", content: "", toolCalls: [] };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputText("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/plan/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId:    selectedTripId,
          message:   text.trim(),
          sessionId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;

          let event: AgentEvent;
          try {
            event = JSON.parse(line) as AgentEvent;
          } catch {
            continue;
          }

          setMessages((prev) => {
            const updated = [...prev];
            const prevLast = updated[updated.length - 1]!;
            let newContent   = prevLast.content;
            let newToolCalls = prevLast.toolCalls ?? [];

            if (event.type === "text") {
              newContent += event.delta;
            } else if (event.type === "tool_start") {
              const calls = [...newToolCalls];
              calls.push({
                id:       `${event.toolName}-${Date.now()}`,
                toolName: event.toolName,
                input:    event.input,
                status:   "pending",
              });
              newToolCalls = calls;
            } else if (event.type === "tool_done") {
              const calls = [...newToolCalls];
              const idx = [...calls].reverse().findIndex((c) => c.toolName === event.toolName && c.status === "pending");
              if (idx !== -1) {
                const realIdx = calls.length - 1 - idx;
                const c = calls[realIdx]!;
                calls[realIdx] = { id: c.id, toolName: c.toolName, input: c.input, result: event.result, status: "done" as const };
              }
              newToolCalls = calls;
            } else if (event.type === "done") {
              setSessionId(event.sessionId);
            } else if (event.type === "error") {
              newContent += `\n\n[Error: ${event.message}]`;
            }

            updated[updated.length - 1] = { role: prevLast.role, content: newContent, toolCalls: newToolCalls };
            return updated;
          });
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const prevLast = updated[updated.length - 1]!;
        updated[updated.length - 1] = {
          role:      prevLast.role,
          content:   `Something went wrong. Please try again.\n\n${String(err)}`,
          toolCalls: prevLast.toolCalls ?? [],
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [selectedTripId, sessionId, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(inputText);
    }
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="border-b border-line bg-cream px-6 py-4 flex items-center gap-4">
        <div>
          <h1 className="font-display text-xl text-ink">
            Plan your trip
          </h1>
          <p className="text-xs text-ink-mute mt-0.5">AI concierge · powered by Claude</p>
        </div>
        <div className="ml-auto w-64">
          <Select value={selectedTripId} onValueChange={(v) => {
            if (v) setSelectedTripId(v);
            setMessages([]);
            setSessionId(undefined);
          }}>
            <SelectTrigger className="bg-paper border-line text-sm">
              <SelectValue placeholder="Select a trip" />
            </SelectTrigger>
            <SelectContent>
              {trips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  <span className="font-medium">{trip.title}</span>
                  {trip.destination && (
                    <span className="text-ink-mute ml-1">· {trip.destination}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center mx-auto mb-4">
                <Compass className="h-7 w-7 text-terracotta" />
              </div>
              <h2 className="font-display text-2xl text-ink mb-2">
                Where would you like to <em>go?</em>
              </h2>
              {selectedTrip && (
                <p className="text-sm text-ink-mute">
                  Planning for{" "}
                  <span className="text-ink font-medium">{selectedTrip.title}</span>
                </p>
              )}
            </div>

            <div className="grid gap-3 w-full max-w-lg">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-left text-sm px-4 py-3 rounded-lg border border-line bg-paper-warm hover:bg-paper-deep hover:border-terracotta/40 transition-colors text-ink-mute hover:text-ink"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {isStreaming && messages[messages.length - 1]?.role === "assistant" &&
          !messages[messages.length - 1]?.content &&
          !messages[messages.length - 1]?.toolCalls?.length && (
          <div className="flex items-center gap-2 text-ink-mute text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line bg-cream px-6 py-4">
        {!selectedTripId && (
          <p className="text-xs text-terracotta mb-2">Select a trip above to start planning.</p>
        )}
        <div className="flex gap-3 items-end">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your ideal trip, dates, budget…"
            className="resize-none min-h-[44px] max-h-32 bg-paper border-line text-sm"
            rows={2}
            disabled={isStreaming || !selectedTripId}
          />
          <Button
            onClick={() => send(inputText)}
            disabled={!inputText.trim() || isStreaming || !selectedTripId}
            className="bg-terracotta hover:bg-terracotta-deep text-cream h-11 px-4 flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-ink-mute mt-2">
          Press Enter to send · Shift+Enter for new line · Max 12 tool calls per session
        </p>
      </div>
    </div>
  );
}
