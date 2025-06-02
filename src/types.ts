export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: number;
  isStreaming?: boolean;
  isRequesting?: boolean;
  error?: boolean;
  isAborted?: boolean;
  retryData?: {
    userInput: string;
  };
}

export interface Session {
  messages: Message[];
  model: string;
  createdAt: number;
}

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ChatState {
  // === 会话状态 ===
  sessions: Record<string, Session>;
  currentSessionId: string | null;

  // === 模型状态 ===
  models: { label: string; value: string }[];
  currentModel: string;
  modelConfig: ModelConfig;

  // === UI 状态 ===
  theme: 'light' | 'dark';
  isConfigPanelOpen: boolean;

  // === 消息流状态 ===
  isGenerating: boolean;
  abortController: AbortController | null;

  // === 操作函数 ===
  createNewSession: () => string;
  switchModel: (modelId: string) => void;
  addUserMessage: (content: string) => void;
  startAIResponse: (retryData?: { userInput: string }) => Promise<void>;
  abortGeneration: () => void;
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  toggleTheme: () => void;
}
