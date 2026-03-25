/* eslint-disable @typescript-eslint/no-explicit-any */
import { AIModelAdapter, UnifiedChatRequest } from "@/types";
export class AnthropicAdapter implements AIModelAdapter {
  provider = "anthropic";

  getEndpoint(_request: UnifiedChatRequest) {
    return "https://api.anthropic.com/v1/messages";
  }

  getHeaders(apiKey: string) {
    return {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01", // Claude 强制要求带版本号
    };
  }

  transformRequest(request: UnifiedChatRequest) {
    const systemMessages = request.messages.filter((m) => m.role === "system");
    const systemPrompt = systemMessages.map((m) => m.content).join("\n");

    const chatMessages = request.messages
      .filter((m) => m.role !== "system")
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      
    const payload: any = {
      model: request.model,
      system: systemPrompt || undefined,
      messages: chatMessages,
      stream: request.stream ?? false,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    };
    if (request.reasoning?.enabled) {
      const budget = request.reasoning.budgetTokens || 1024; // 给个默认预算
      payload.thinking = {
        type: 'enabled',
        budget_tokens: budget,
      };
      
      // Claude 强制规范 1：max_tokens 必须大于 budget_tokens
      if (payload.max_tokens <= budget) {
        payload.max_tokens = budget + 1024; // 自动修正为合法值
      }
      
      // Claude 强制规范 2：使用 thinking 时，temperature 必须为 1（目前 API 的限制）
      payload.temperature = 1; 
    }

    return payload
  }
}
