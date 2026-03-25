// adapters/gemini-adapter.ts

import { AIModelAdapter, UnifiedChatRequest } from "@/types";

export class GeminiAdapter implements AIModelAdapter {
  provider = 'google';

  getEndpoint(request: UnifiedChatRequest) {
    // Gemini 的特殊之处：URL 必须根据是否流式和模型名称进行动态拼接
    const action = request.stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    // 假设使用 v1beta 版本
    return `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:${action}`;
  }

  getHeaders(apiKey: string) {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey, // Gemini 的鉴权方式
    };
  }

  transformRequest(request: UnifiedChatRequest) {
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const systemInstruction = systemMessages.length > 0 
      ? { parts: [{ text: systemMessages.map(m => m.content).join('\n') }] }
      : undefined;

    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    return {
      contents,
      systemInstruction,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      },
      // Gemini 如果是流式，无需像 OpenAI 那样在 payload 传 stream: true，它由 URL 决定
    };
  }
}