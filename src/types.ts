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

export interface RetryData {
  userInput: string;
}
