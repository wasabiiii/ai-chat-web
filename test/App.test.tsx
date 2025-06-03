import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { useChatStore } from '../src/store/useChatStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock requestLLM
let readCount = 0;
vi.mock('../src/utils/requestLLM', () => ({
  requestLLM: vi.fn().mockResolvedValue({
    body: {
      getReader: () => ({
        read: () => {
          readCount++;
          if (readCount === 1) {
            return Promise.resolve({
              done: false,
              value: new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"Hello 有什么可以帮您"}}]}\n\n',
              ),
            });
          }
          return Promise.resolve({ done: true, value: new Uint8Array() });
        },
      }),
    },
  }),
}));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useChatStore.getState().sessions = {};
    useChatStore.getState().currentSessionId = null;
    readCount = 0; // 重置读取计数
  });

  describe('消息渲染', () => {
    it('应该正确渲染用户消息', async () => {
      render(<App />);

      // 发送消息
      const input = screen.getByPlaceholderText('请输入内容...');
      await userEvent.type(input, 'Hello AI');
      const sendButton = screen.getByText('发送');
      await userEvent.click(sendButton);

      // 验证消息渲染
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
    });

    it('应该正确渲染 AI 回复', async () => {
      render(<App />);

      // 发送消息
      const input = screen.getByPlaceholderText('请输入内容...');
      await userEvent.type(input, 'Hello AI');
      const sendButton = screen.getByText('发送');
      await userEvent.click(sendButton);

      await vi.waitFor(
        () => {
          // 验证消息状态已更新
          const currentSessionId = useChatStore.getState().currentSessionId;
          const currentSession = useChatStore.getState().sessions[currentSessionId!];
          const lastMessage = currentSession.messages[currentSession.messages.length - 1];
          console.log('lastMessage', lastMessage);

          expect(lastMessage.isStreaming).toBe(false);
          expect(lastMessage.isRequesting).toBe(false);

          expect(screen.getByText('Hello 有什么可以帮您')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('模型切换', () => {
    it('应该正确切换模型', async () => {
      render(<App />);

      // 获取模型选择器
      const modelSelect = screen.getByRole('combobox');

      // 切换到 GPT-4
      await userEvent.click(modelSelect);
      const gpt4Option = screen.getByText('GPT-4', { selector: '.ant-select-item-option-content' });
      await userEvent.click(gpt4Option);

      // 验证 store 已更新
      expect(useChatStore.getState().currentModel).toBe('gpt-4');

      // 验证 Select 组件显示正确的文本
      const selectedOption = screen.getByRole('combobox').closest('.ant-select-selector');
      expect(selectedOption).toHaveTextContent('GPT-4');
    });

    it('切换模型后发送消息应该使用新模型', async () => {
      render(<App />);

      // 切换到 GPT-4
      const modelSelect = screen.getByRole('combobox');
      await userEvent.click(modelSelect);
      const gpt4Option = screen.getByText('GPT-4', { selector: '.ant-select-item-option-content' });
      await userEvent.click(gpt4Option);

      // 输入消息并发送
      const input = screen.getByPlaceholderText('请输入内容...');
      await userEvent.type(input, 'Hello');
      const sendButton = screen.getByText('发送');
      await userEvent.click(sendButton);

      // 验证消息使用了新的模型
      const currentSessionId = useChatStore.getState().currentSessionId;
      const currentSession = useChatStore.getState().sessions[currentSessionId!];
      expect(currentSession.model).toBe('gpt-4');
    });
  });

  describe('会话管理', () => {
    it('应该保持会话状态', () => {
      // 创建一个会话并添加消息
      useChatStore.getState().createNewSession();
      useChatStore.getState().addUserMessage('测试消息');

      render(<App />);

      // 验证消息被正确渲染
      expect(screen.getByText('测试消息')).toBeInTheDocument();
    });
  });
});
