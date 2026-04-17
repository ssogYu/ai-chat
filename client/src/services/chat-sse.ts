import type {
  ChatSseEvent,
  ChatSseEventType,
  ChatStreamRequest,
} from "@/types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const CHAT_ENDPOINT = `${API_BASE_URL}/chat/stream`;
const TOKEN_KEY = "ai_chat_token";

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function buildAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("登录状态已失效，请重新登录");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function parseSseChunk(chunk: string) {
  const events: ChatSseEvent[] = [];
  const segments = chunk.split("\n\n");
  const rest = segments.pop() ?? "";

  for (const segment of segments) {
    const lines = segment.split("\n");
    let event: ChatSseEventType = "meta";
    const dataLines: string[] = [];

    for (const line of lines) {
      const normalizedLine = line.replace(/\r$/, "");

      if (!normalizedLine || normalizedLine.startsWith(":")) {
        continue;
      }

      if (normalizedLine.startsWith("event:")) {
        event = normalizedLine.slice(6).trim() as ChatSseEventType;
        continue;
      }

      if (normalizedLine.startsWith("data:")) {
        dataLines.push(normalizedLine.slice(5).trim());
      }
    }

    if (dataLines.length === 0) {
      continue;
    }

    try {
      events.push({
        event,
        data: JSON.parse(dataLines.join("\n")) as Record<string, unknown>,
      });
    } catch {
      continue;
    }
  }

  return {
    events,
    rest,
  };
}

async function consumeSseStream(
  response: Response,
  onEvent: (event: ChatSseEvent) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("当前环境不支持流式响应");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseSseChunk(buffer);
    buffer = rest;

    for (const event of events) {
      onEvent(event);
    }
  }

  buffer += decoder.decode();

  if (!buffer.trim()) {
    return;
  }

  const { events } = parseSseChunk(`${buffer}\n\n`);
  for (const event of events) {
    onEvent(event);
  }
}

async function createChatStream(request: ChatStreamRequest) {
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (response.ok) {
    return response;
  }

  let errorMessage = `请求失败 (${response.status})`;

  try {
    const errorResponse = (await response.json()) as { message?: string };
    if (errorResponse?.message) {
      errorMessage = errorResponse.message;
    }
  } catch {}

  throw new Error(errorMessage);
}

async function streamConversation(
  request: ChatStreamRequest,
  onEvent: (event: ChatSseEvent) => void,
) {
  const response = await createChatStream(request);
  await consumeSseStream(response, onEvent);
}

export const chatSSEService = {
  streamConversation,
};
