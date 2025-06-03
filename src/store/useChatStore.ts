import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, ModelConfig, Message, Session } from '@/types';
import { requestLLM } from '@/services/requestLLM';
import { modelList } from '@/utils/constants';

// 默认模型配置
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // === 会话状态 ===
      sessions: {}, // 所有会话 { sessionId: { messages: [], model: 'gpt-4' } }
      currentSessionId: null,

      // === 模型状态 ===
      models: modelList,
      currentModel: modelList[0].value,
      modelConfig: DEFAULT_MODEL_CONFIG,

      // === UI 状态 ===
      theme: 'dark', // light/dark
      isConfigPanelOpen: false,

      // === 消息流状态 ===
      isGenerating: false,
      abortController: null,

      // === 操作函数 ===

      // 创建新会话
      createNewSession: () => {
        const sessionId = Date.now().toString();
        const newSession: Session = {
          messages: [],
          model: get().currentModel,
          createdAt: Date.now(),
        };

        set({
          sessions: {
            ...get().sessions,
            [sessionId]: newSession,
          },
          currentSessionId: sessionId,
        });
        return sessionId;
      },

      // 切换模型（保留历史）
      switchModel: (modelId) => {
        console.log('modelId', modelId);
        const { currentSessionId, sessions } = get();
        if (!currentSessionId) return;

        set({
          currentModel: modelId,
          sessions: {
            ...sessions,
            [currentSessionId]: {
              ...sessions[currentSessionId],
              model: modelId,
            },
          },
        });
      },

      // 添加用户消息
      addUserMessage: (content) => {
        const { currentSessionId, sessions } = get();
        if (!currentSessionId) return;

        const newMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        set({
          sessions: {
            ...sessions,
            [currentSessionId]: {
              ...sessions[currentSessionId],
              messages: [...sessions[currentSessionId].messages, newMessage],
            },
          },
        });
      },

      // 开始 AI 响应（流式处理）
      startAIResponse: async (retryData?: { userInput: string }) => {
        const { currentSessionId, sessions, currentModel, modelConfig } = get();
        if (!currentSessionId || get().isGenerating) return;

        // 创建新的中断控制器
        const controller = new AbortController();
        set({ isGenerating: true, abortController: controller });

        // 如果是重试，找到最后一条 AI 消息
        const currentSession = sessions[currentSessionId];
        const lastAIMessage = retryData
          ? currentSession.messages.filter((msg) => msg.role === 'assistant').pop()
          : null;

        // 添加初始 AI 消息
        const aiMessageId = retryData
          ? lastAIMessage?.id || `ai_${Date.now()}`
          : `ai_${Date.now()}`;
        const initialAIMessage: Message = {
          id: aiMessageId,
          role: 'assistant',
          content: '', // 重试时清空内容
          model: currentModel,
          isStreaming: false,
          isRequesting: true,
          timestamp: Date.now(),
        };

        set({
          sessions: {
            ...sessions,
            [currentSessionId]: {
              ...sessions[currentSessionId],
              messages: retryData
                ? sessions[currentSessionId].messages.map((msg) =>
                    msg.id === aiMessageId ? initialAIMessage : msg,
                  )
                : [...sessions[currentSessionId].messages, initialAIMessage],
            },
          },
        });

        try {
          const response = await requestLLM(currentModel, sessions[currentSessionId].messages, {
            signal: controller.signal,
          });

          if (!response.body) throw new Error('No response body');

          // 开始流式返回，更新状态
          set((state) => {
            const session = state.sessions[currentSessionId];
            const updatedMessages = session.messages.map((msg) =>
              msg.id === aiMessageId ? { ...msg, isRequesting: false, isStreaming: true } : msg,
            );

            return {
              sessions: {
                ...state.sessions,
                [currentSessionId]: {
                  ...session,
                  messages: updatedMessages,
                },
              },
            };
          });

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let aiContent = ''; // 重试时从空内容开始

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 流式处理数据
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                // 处理 [DONE] 消息
                if (data === '[DONE]') {
                  continue;
                }
                try {
                  const parsedData = JSON.parse(data);
                  if (parsedData.choices?.[0]?.delta?.content) {
                    aiContent += parsedData.choices[0].delta.content;

                    // 高效更新状态 - 只更新内容部分
                    set((state) => {
                      const session = state.sessions[currentSessionId];
                      const updatedMessages = session.messages.map((msg) =>
                        msg.id === aiMessageId ? { ...msg, content: aiContent } : msg,
                      );

                      return {
                        sessions: {
                          ...state.sessions,
                          [currentSessionId]: {
                            ...session,
                            messages: updatedMessages,
                          },
                        },
                      };
                    });
                  }
                } catch (e) {
                  console.error('解析 SSE 数据失败:', e);
                }
              }
            }
          }

          // 完成流式处理
          set((state) => {
            const session = state.sessions[currentSessionId];
            const updatedMessages = session.messages.map((msg) =>
              msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg,
            );

            return {
              isGenerating: false,
              abortController: null,
              sessions: {
                ...state.sessions,
                [currentSessionId]: {
                  ...session,
                  messages: updatedMessages,
                },
              },
            };
          });
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('请求被中断');
          } else {
            console.error('流式处理错误:', error);
          }

          // 统一错误处理逻辑
          set((state) => {
            const session = state.sessions[currentSessionId];
            const lastUserMessage = session.messages.filter((msg) => msg.role === 'user').pop();

            const updatedMessages = session.messages.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    isStreaming: false,
                    isRequesting: false,
                    error: true,
                    isAborted: error instanceof Error && error.name === 'AbortError',
                    retryData: lastUserMessage ? { userInput: lastUserMessage.content } : undefined,
                  }
                : msg,
            );

            return {
              isGenerating: false,
              abortController: null,
              sessions: {
                ...state.sessions,
                [currentSessionId]: {
                  ...session,
                  messages: updatedMessages,
                },
              },
            };
          });
        }
      },

      // 中断生成
      abortGeneration: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
          set({ isGenerating: false, abortController: null });
        }
      },

      // 更新模型配置
      updateModelConfig: (config) => {
        set({ modelConfig: { ...get().modelConfig, ...config } });
      },

      // 切换主题
      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
      },
    }),
    {
      name: 'chat-app-storage', // 存储键名
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        currentModel: state.currentModel,
        theme: state.theme,
      }), // 只持久化这些状态
      // TODO: 使用 IndexedDB 存储（大容量）
      storage: {
        getItem: async (name) => {
          const data = localStorage.getItem(name);
          return data ? JSON.parse(data) : null;
        },
        setItem: async (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          localStorage.removeItem(name);
        },
      },
    },
  ),
);
