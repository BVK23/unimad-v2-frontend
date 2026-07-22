export type UnibotLegacyHomeChat = {
  id: string;
  section: string;
  title: string;
};

export type UnibotLegacyChatMessage = {
  type: "user" | "bot";
  message: string;
  message_id?: number;
  isFirstMessage?: boolean;
  sectionName?: string;
};
