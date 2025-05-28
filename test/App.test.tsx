import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

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

// Mock requestLLM
vi.mock('../src/utils/requestLLM', () => ({
  requestLLM: vi.fn().mockResolvedValue('AI response'),
}));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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

      // 等待 AI 回复
      expect(await screen.findByText('AI response')).toBeInTheDocument();
    });

    it('应该保持消息历史记录', async () => {
      // 设置历史消息
      const historyMessages = [
        { role: 'user', content: '历史消息1', model: 'gpt-3.5' },
        { role: 'assistant', content: '历史回复1', model: 'gpt-3.5' },
      ];
      localStorage.setItem('chat_messages', JSON.stringify(historyMessages));

      render(<App />);

      // 验证历史消息被渲染
      expect(screen.getByText('历史消息1')).toBeInTheDocument();
      expect(screen.getByText('历史回复1')).toBeInTheDocument();
    });
  });

  describe('模型切换', () => {
    it('应该正确切换模型', async () => {
      render(<App />);

      // 获取模型选择器
      const modelSelect = screen.getByRole('combobox');

      // 切换到 GPT-4
      await userEvent.click(modelSelect);
      const gpt4Option = screen.getByText('GPT-4');
      await userEvent.click(gpt4Option);

      // 验证 localStorage 已更新
      expect(localStorage.getItem('selected_model')).toBe('gpt-4');

      // 验证 Select 组件显示正确的文本
      const selectedOption = screen.getByRole('combobox').closest('.ant-select-selector');
      expect(selectedOption).toHaveTextContent('GPT-4');
    });

    it('切换模型后发送消息应该使用新模型', async () => {
      render(<App />);

      // 切换到 GPT-4
      const modelSelect = screen.getByRole('combobox');
      await userEvent.click(modelSelect);
      const gpt4Option = screen.getByText('GPT-4');
      await userEvent.click(gpt4Option);

      // 输入消息并发送
      const input = screen.getByPlaceholderText('请输入内容...');
      await userEvent.type(input, 'Hello');
      const sendButton = screen.getByText('发送');
      await userEvent.click(sendButton);

      // 验证消息使用了新的模型
      const messages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      expect(messages[messages.length - 1].model).toBe('gpt-4');
    });

    it('页面刷新后应该保持选择的模型', () => {
      // 先设置一个模型
      localStorage.setItem('selected_model', 'gpt-4');

      // 重新渲染组件
      render(<App />);

      // 验证 Select 组件显示正确的文本
      const selectedOption = screen.getByRole('combobox').closest('.ant-select-selector');
      expect(selectedOption).toHaveTextContent('GPT-4');
    });
  });
});
