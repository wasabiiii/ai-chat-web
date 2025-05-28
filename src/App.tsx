import React, { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { Input, Button, Select, Layout, Typography, Form } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { requestLLM } from '@utils/requestLLM';
import MessageBubble from './components/MessageBubble/MessageBubble';
import { Message, RetryData } from './types';
import { modelList, CHAT_LOCAL_KEY, SELECTED_MODEL_LOCAL_KEY } from '@utils/constants';
import './normalize.css';
import styles from './App.module.scss';

const { Header } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

// 更新最后一条消息的工具函数
const updateLastMessage = (
  messages: Message[],
  updates: Pick<Message, 'content'> & Partial<Omit<Message, 'content'>>,
  selectedModel: string,
): Message[] => {
  const arr = [...messages];
  arr[arr.length - 1] = {
    ...arr[arr.length - 1],
    ...updates,
    model: selectedModel,
    role: 'assistant',
  };
  return arr;
};

const App = (): React.ReactNode => {
  // 初始化时从 localStorage 读取
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const data = localStorage.getItem(CHAT_LOCAL_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(SELECTED_MODEL_LOCAL_KEY) || modelList[0]?.value || 'gpt-3.5';
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const [form] = Form.useForm();
  const [hasInput, setHasInput] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<TextAreaRef>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // 每次 messages 变化时写入 localStorage
  useEffect(() => {
    localStorage.setItem(CHAT_LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  // 持久化 selectedModel
  useEffect(() => {
    localStorage.setItem(SELECTED_MODEL_LOCAL_KEY, selectedModel);
  }, [selectedModel]);

  // 监听输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasInput(!!e.target.value.trim());
  }, []);

  // 发送消息
  const handleSend = async (e?: FormEvent, retryData?: RetryData) => {
    e?.preventDefault();
    if (loading) return;

    const userMsg = retryData ? retryData.userInput : form.getFieldValue('message');
    if (!userMsg?.trim()) return;

    // 清空输入框
    form.resetFields();

    const history = retryData ? messages.slice(0, -2) : messages;
    const newMessages: Message[] = [
      ...history,
      { role: 'user', content: userMsg, model: selectedModel },
    ];
    setMessages([
      ...newMessages,
      { role: 'assistant', content: '正在思考…', model: selectedModel },
    ]);

    setLoading(true);
    const controller = new AbortController();
    setAbortCtrl(controller);
    try {
      const reply = await requestLLM(selectedModel, newMessages, { signal: controller.signal });
      setMessages((msgs) => updateLastMessage(msgs, { content: reply }, selectedModel));
    } catch {
      if (controller.signal.aborted) {
        setMessages((msgs) =>
          updateLastMessage(
            msgs,
            { content: '已中断', error: true, retryData: { userInput: userMsg } },
            selectedModel,
          ),
        );
      } else {
        setMessages((msgs) =>
          updateLastMessage(
            msgs,
            { content: '请求失败，可重试', error: true, retryData: { userInput: userMsg } },
            selectedModel,
          ),
        );
      }
    } finally {
      setLoading(false);
      setAbortCtrl(null);
    }
  };

  // 中断
  const handleAbort = () => {
    abortCtrl?.abort();
  };

  // 重试
  const handleRetry = (retryData: RetryData) => {
    handleSend(undefined, retryData);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [loading],
  );

  return (
    <div className={styles.appContainer}>
      <Header className={styles.header}>
        <Text className={styles.headerTitle}>AI 聊天室</Text>
      </Header>
      <div className={styles.mainContainer}>
        <div ref={chatRef} className={styles.chatContainer}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>欢迎使用，输入内容开始对话…</div>
          )}
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              msg={msg}
              idx={idx}
              onRetry={handleRetry}
              isThinking={loading && idx === messages.length - 1}
            />
          ))}
        </div>
        <div className={styles.chatInputPanel}>
          <div className={styles.inputRow}>
            <Select
              className={styles.modelSelect}
              value={selectedModel}
              onChange={setSelectedModel}
              options={modelList}
            />
          </div>
          <div className={styles.inputAreaCard}>
            <Form form={form}>
              <Form.Item name="message">
                <TextArea
                  ref={inputRef}
                  className={styles.chatInput}
                  placeholder="请输入内容..."
                  onKeyDown={handleKeyDown}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  style={{ background: 'transparent', boxShadow: 'none' }}
                />
              </Form.Item>
            </Form>
            <div className={styles.actionBar}>
              <Button
                className={styles.sendBtn}
                type="primary"
                icon={loading ? <StopOutlined /> : <SendOutlined />}
                onClick={loading ? handleAbort : handleSend}
                loading={false}
                disabled={loading ? false : !hasInput}
              >
                {loading ? '中断' : '发送'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
