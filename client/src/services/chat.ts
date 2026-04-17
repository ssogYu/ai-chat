import { ConversationDetail, ConversationListResponse } from "@/types/chat";
import { request } from "./request";
import { BaseResponse } from "@unifying/core";

export const chatService = {
  async fetchConversationList(
    pageNo: number,
    pageSize: number,
  ): Promise<BaseResponse<ConversationListResponse>> {
    return await request.get<ConversationListResponse>(
      `chat/conversations?pageNo=${pageNo}&pageSize=${pageSize}`,
    );
  },
  async fetchConversationDetail(
    conversationId: string,
  ): Promise<BaseResponse<ConversationDetail>> {
    return await request.get<ConversationDetail>(
      `chat/conversations/${encodeURIComponent(conversationId)}`,
    );
  },
};
