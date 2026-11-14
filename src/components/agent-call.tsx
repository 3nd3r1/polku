"use client";

import { useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useRef } from "react";

export const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export const post = async (url: string, body?: unknown) =>
  (
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  ).json();

/**
 * A voice call with the Polku agent from this browser, standing in for the
 * phone line. The agent's tools only forward to the server, which decides
 * what the agent may see. Needs a ConversationProvider above it.
 */
export function useAgentCall() {
  const callId = useRef<string | null>(null);
  const conversation = useConversation({
    onMessage: (m) =>
      callId.current &&
      post(`/api/calls/${callId.current}/transcript`, { role: m.role === "user" ? "caller" : "agent", text: m.message }),
    onDisconnect: () => {
      if (callId.current) post(`/api/calls/${callId.current}/end`);
    },
  });
  const say = (r: { sayThis?: string; error?: string }) => r.sayThis ?? r.error;
  useConversationClientTool("verify_identity", async (p) =>
    say(await post(`/api/calls/${callId.current}/verify`, { hetu: String(p?.hetu ?? "") })),
  );
  useConversationClientTool("get_case", async () => say(await post(`/api/calls/${callId.current}/case`)));
  // On a gap the server says exactly what to ask next; the agent asks and calls again.
  useConversationClientTool("record_intake", async (p) => say(await post(`/api/intake?channel=web_call&call=${callId.current}`, p)));
  useConversationClientTool("book_time", async (p) => say(await post(`/api/calls/${callId.current}/book`, { option: p?.option })));

  return {
    available: Boolean(AGENT_ID),
    live: conversation.status === "connected" || conversation.status === "connecting",
    start(id: string, firstMessage?: string) {
      callId.current = id;
      conversation.startSession({
        agentId: AGENT_ID!,
        connectionType: "webrtc",
        ...(firstMessage && { overrides: { agent: { firstMessage } } }),
      });
    },
    end: () => conversation.endSession(),
  };
}

export const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
