"use client";

import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { createContext, useContext, useRef, useState } from "react";

export const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export const post = async (url: string, body?: unknown) =>
  (
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  ).json();

type Phone = ReturnType<typeof useAgentCall>;
const PhoneContext = createContext<Phone | null>(null);

/** One browser phone for the whole app, so a call keeps going when you switch screens. */
export function PhoneProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConversationProvider>
      <PhoneInner>{children}</PhoneInner>
    </ConversationProvider>
  );
}

function PhoneInner({ children }: { children: React.ReactNode }) {
  return <PhoneContext value={useAgentCall()}>{children}</PhoneContext>;
}

export function usePhone(): Phone {
  const phone = useContext(PhoneContext);
  if (!phone) throw new Error("usePhone needs a PhoneProvider");
  return phone;
}

/**
 * A voice call with the Polku agent from this browser, standing in for the
 * phone line. The agent's tools only forward to the server, which decides
 * what the agent may see. Needs a ConversationProvider above it.
 */
function useAgentCall() {
  const callId = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
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
    /** The call this browser is on, if any. */
    callId: activeId,
    available: Boolean(AGENT_ID),
    live: conversation.status === "connected" || conversation.status === "connecting",
    start(id: string, firstMessage?: string) {
      callId.current = id;
      setActiveId(id);
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
