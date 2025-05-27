import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Input, Button, Select, Layout, Typography } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { requestLLM } from '@utils/requestLLM';
import MessageBubble from './components/MessageBubble/MessageBubble';
import { Message, RetryData } from './types';
import { modelList, CHAT_LOCAL_KEY, SELECTED_MODEL_LOCAL_KEY } from '@utils/constants';
import './normalize.css';
import styles from './App.module.scss';

const { Header } = Layout;
const { Text } = Typography;

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
  const [input, setInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(SELECTED_MODEL_LOCAL_KEY) || modelList[0]?.value || 'gpt-3.5';
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

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

  // 发送消息
  const handleSend = async (e?: FormEvent, retryData?: RetryData) => {
    e && e.preventDefault();
    if (loading) return;
    const userMsg = retryData ? retryData.userInput : input;
    if (!userMsg.trim()) return;

    const history = retryData ? messages.slice(0, -2) : messages;
    const newMessages: Message[] = [
      ...history,
      { role: 'user', content: userMsg, model: selectedModel },
    ];
    setMessages([
      ...newMessages,
      { role: 'assistant', content: '正在思考…', model: selectedModel },
    ]);
    setInput('');
    setLoading(true);
    const controller = new AbortController();
    setAbortCtrl(controller);
    try {
      const reply = await requestLLM(selectedModel, newMessages, { signal: controller.signal });
      setMessages((msgs) => updateLastMessage(msgs, { content: reply }, selectedModel));
    } catch (err: any) {
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

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <Header
        style={{
          background: '#fff',
          boxShadow: '0 2px 8px #f0f1f2',
          padding: '0 24px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 101,
        }}
      >
        <Text strong style={{ fontSize: 22 }}>
          AI 聊天室
        </Text>
      </Header>
      <div
        style={{
          width: '800px',
          margin: '80px auto 0',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        <div ref={chatRef} style={{ minHeight: 300, flexGrow: 1 }} className={styles.chatContainer}>
          {messages.length === 0 && (
            <div style={{ color: '#bbb', textAlign: 'center', marginTop: 80 }}>
              欢迎使用，输入内容开始对话…
            </div>
          )}
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} msg={msg} idx={idx} onRetry={handleRetry} />
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
          <form onSubmit={loading ? undefined : handleSend}>
            <div className={styles.inputAreaCard}>
              <div className={styles.inputAreaRow}>
                <Input.TextArea
                  className={styles.chatInput}
                  placeholder="请输入内容..."
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onPressEnter={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (!e.shiftKey && !loading) handleSend(e);
                  }}
                  disabled={loading}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  style={{ background: 'transparent', boxShadow: 'none' }}
                />
                <Button
                  className={styles.sendBtn}
                  type="primary"
                  icon={loading ? <StopOutlined /> : <SendOutlined />}
                  htmlType="submit"
                  loading={false}
                  disabled={!input.trim() && !loading}
                  onClick={loading ? handleAbort : undefined}
                >
                  {loading ? '中断' : '发送'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default App;
