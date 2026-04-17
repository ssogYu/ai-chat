import { AIModelAdapter, UnifiedChatRequest } from "@/types";

// adapters/openai-adapter.ts
export class OpenAIAdapter implements AIModelAdapter {
  provider = "openai";

  getEndpoint(_request: UnifiedChatRequest) {
    return "http://127.0.0.1:1234/v1/chat/completions";
  }

  getHeaders(apiKey: string) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
  }

  transformRequest(request: UnifiedChatRequest) {
    const payload: any = {
      model: request.model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: request.stream ?? false,
    };
    const isReasoningModel =
      request.model.startsWith("o1") || request.model.startsWith("o3");

    // 【新增】：处理 OpenAI 的思考参数适配
    if (request.reasoning?.enabled || isReasoningModel) {
      // 传递推理力度
      payload.reasoning_effort = request?.reasoning?.effort || "medium";

      // 推理模型通常使用 max_completion_tokens 代替 max_tokens
      // 用来同时限制“思考过程” + “最终输出”的总长度
      if (request.maxTokens) {
        payload.max_completion_tokens = request.maxTokens;
      }

      // 推理模型通常不支持常规的 temperature（必须剔除，否则 API 会报错）
      // 注意：部分新模型开始支持了，这里你可以根据实际 OpenAI API 更新情况灵活调整
    } else {
      // 常规模型 (gpt-4o 等)
      payload.temperature = request.temperature ?? 0.7;
      if (request.maxTokens) {
        payload.max_tokens = request.maxTokens;
      }
    }
    return payload;
  }
}
