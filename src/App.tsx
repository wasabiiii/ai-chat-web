import React, { useRef, useEffect } from 'react';
import { Layout } from 'antd';
import '@ant-design/v5-patch-for-react-19';
import MessageList from './components/MessageList/MessageList';
import ChatInput from './components/ChatInput/ChatInput';
import { useChatStore } from '@/store/useChatStore';
import './normalize.css';
import styles from './App.module.scss';

const { Header } = Layout;

const ChatApp: React.FC = () => {
  const chatRef = useRef<HTMLDivElement>(null);
  const createNewSession = useChatStore((state) => state.createNewSession);
  const hasSession = useChatStore(
    (state) => state.currentSessionId && Object.keys(state.sessions).length > 0,
  );

  useEffect(() => {
    // 只在没有会话时创建新会话
    if (!hasSession) {
      createNewSession();
    }
  }, [createNewSession, hasSession]);

  return (
    <div className={styles.appContainer}>
      <Header className={styles.header}>
        <div className={styles.headerTitle}>AI 聊天室</div>
      </Header>
      <div className={styles.mainContainer}>
        <div ref={chatRef} className={styles.chatContainer}>
          <MessageList />
        </div>
        <ChatInput />
      </div>
    </div>
  );
};

// 根组件，提供 Context
const App = (): React.ReactNode => {
  return <ChatApp />;
};

export default App;
