import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, RetryData } from '@/types';
import { CHAT_LOCAL_KEY } from '@utils/constants';
import { requestLLM } from '@utils/requestLLM';

export const useChat = (selectedModel: string) => {
  const selectedModelRef = useRef(selectedModel);

  // 更新 ref 中的模型值
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const data = localStorage.getItem(CHAT_LOCAL_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);

  // 保存消息到 localStorage
  useEffect(() => {
    localStorage.setItem(CHAT_LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  // 更新最后一条消息的工具函数
  const updateLastMessage = useCallback(
    (
      messages: Message[],
      updates: Pick<Message, 'content'> & Partial<Omit<Message, 'content'>>,
    ) => {
      const arr = [...messages];
      arr[arr.length - 1] = {
        ...arr[arr.length - 1],
        ...updates,
        model: selectedModelRef.current,
        role: 'assistant',
      };
      return arr;
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, retryData?: RetryData) => {
      if (loading) return;

      const history = retryData ? messages.slice(0, -2) : messages;
      const newMessages: Message[] = [
        ...history,
        { role: 'user', content, model: selectedModelRef.current },
      ];
      setMessages([
        ...newMessages,
        { role: 'assistant', content: '正在思考…', model: selectedModelRef.current },
      ]);

      setLoading(true);
      const controller = new AbortController();
      setAbortCtrl(controller);
      try {
        const reply = await requestLLM(selectedModelRef.current, newMessages, {
          signal: controller.signal,
        });
        setMessages((msgs) => updateLastMessage(msgs, { content: reply }));
      } catch {
        if (controller.signal.aborted) {
          setMessages((msgs) =>
            updateLastMessage(msgs, {
              content: '已中断',
              error: true,
              retryData: { userInput: content },
            }),
          );
        } else {
          setMessages((msgs) =>
            updateLastMessage(msgs, {
              content: '请求失败，可重试',
              error: true,
              retryData: { userInput: content },
            }),
          );
        }
      } finally {
        setLoading(false);
        setAbortCtrl(null);
      }
    },
    [loading, messages, updateLastMessage],
  );

  const abortRequest = useCallback(() => {
    abortCtrl?.abort();
  }, [abortCtrl]);

  return {
    messages,
    loading,
    sendMessage,
    abortRequest,
  };
};
