export interface LLMMessage {
  role: string;
  content: string;
}

export interface Message extends LLMMessage {
  role: 'user' | 'assistant';
  model: string;
  error?: boolean;
  retryData?: { userInput: string };
  content: string;
}

export interface MessageBubbleProps {
  msg: Message;
  idx: number;
  isLast: boolean;
  onRetry: (retryData: { userInput: string }) => void;
}

export interface RetryData {
  userInput: string;
}
