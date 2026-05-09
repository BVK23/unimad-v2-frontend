export type ContentGenAssetItem = {
  id: string;
  topic: string;
  content: string;
  status: string;
  datePosted?: string;
  dateScheduled?: string;
  images?: string[];
  created_at?: string;
  taskId?: string;
};

export type UnibotChatMessage = {
  type: "user" | "bot";
  message: string;
  message_id?: number;
  isFirstMessage?: boolean;
  sectionName?: string;
};
