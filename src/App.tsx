import React, { useRef, useEffect, useCallback } from 'react';
import { Layout } from 'antd';
import MessageList from './components/MessageList/MessageList';
import ChatInput from './components/ChatInput/ChatInput';
import { useChat } from './hooks/useChat';
import { ModelProvider, useModel } from './contexts/ModelContext';
import { RetryData } from '@/types';
import './normalize.css';
import styles from './App.module.scss';

const { Header } = Layout;

const ChatApp: React.FC = () => {
  const { selectedModel } = useModel();
  const { messages, loading, sendMessage, abortRequest } = useChat(selectedModel);
  const chatRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRetry = useCallback(
    (retryData: RetryData) => {
      sendMessage(retryData.userInput, retryData);
    },
    [sendMessage],
  );

  return (
    <div className={styles.appContainer}>
      <Header className={styles.header}>
        <div className={styles.headerTitle}>AI 聊天室</div>
      </Header>
      <div className={styles.mainContainer}>
        <div ref={chatRef} className={styles.chatContainer}>
          <MessageList messages={messages} loading={loading} onRetry={handleRetry} />
        </div>
        <ChatInput loading={loading} onSend={sendMessage} onAbort={abortRequest} />
      </div>
    </div>
  );
};

// 根组件，提供 Context
const App = (): React.ReactNode => {
  return (
    <ModelProvider>
      <ChatApp />
    </ModelProvider>
  );
};

export default App;
