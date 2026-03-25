import { AIAdapterFactory, ProviderType } from "@/lib/adapters";
import { UnifiedChatRequest } from "@/types";
import { fetchStream, AIModelProvider, FetchStreamResult, StreamChunk } from "@unifying/core";

const API_KEYS: Record<string, string | undefined> = {
  openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  google: process.env.GEMINI_API_KEY,
};
export const chatService = async (
  request: UnifiedChatRequest,
  provider: ProviderType,
  onMessage: (data: StreamChunk) => void,
): Promise<FetchStreamResult | void>=> {
  const adapter = AIAdapterFactory.getAdapter(provider);
  const apiKey = API_KEYS[adapter.provider];
  if (!apiKey) {
    throw new Error(`Missing API Key for provider: ${provider}`);
  }
  const endpoint = adapter.getEndpoint(request);
  const headers = adapter.getHeaders(apiKey);
  const payload = adapter.transformRequest(request);
  const stream = await fetchStream(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
    model: provider as AIModelProvider,
    headers,
    onMessage: (data) => {
      onMessage(data);
    },
    onEnd: () => {},
    onError: (error) => {},
  });
  return stream;
};
