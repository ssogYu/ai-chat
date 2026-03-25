// types/ai-adapter.ts

export type Role = 'user' | 'assistant' | 'system';

export interface ReasoningConfig {
  /** 是否开启思考模型 */
  enabled: boolean;
  /** 给 Claude 使用的思考 token 预算 (需小于 maxTokens) */
  budgetTokens?: number; 
  /** 给 OpenAI o 系列使用的推理力度控制 */
  effort?: 'low' | 'medium' | 'high'; 
}

export interface UnifiedMessage {
  role: Role;
  content: string;
  /** 是否正在思考 */
  isThinking?: boolean;
  /** 思考过程 */
  thinkingContent?: string;
}

export interface UnifiedChatRequest {
  model: string;
  messages: UnifiedMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  reasoning?: ReasoningConfig;
}

export interface AIModelAdapter {
  provider: string;
  
  /**
   * 动态获取该厂商的 API 请求地址
   * @param request 传入 request 是因为某些厂商(如 Gemini)的 URL 依赖模型名称和是否流式
   */
  getEndpoint(request: UnifiedChatRequest): string;

  /**
   * 生成该厂商所需的专属请求头 (主要用于鉴权和版本控制)
   * @param apiKey 该厂商的 API Key
   */
  getHeaders(apiKey: string): Record<string, string>;

  /**
   * 将内部统一请求格式转换为特定厂商的 API 请求参数
   */
  transformRequest(request: UnifiedChatRequest): unknown;
}