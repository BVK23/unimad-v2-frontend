export type ContentGenAssetItem = {
  id: string;
  topic: string;
  funnel?: "top" | "middle" | "bottom";
  content: string;
  status: string;
  datePosted?: string;
  dateScheduled?: string;
  images?: string[];
  mood?: string;
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
