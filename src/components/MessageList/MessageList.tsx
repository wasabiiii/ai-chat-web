import React, { memo } from 'react';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from '../MessageBubble/MessageBubble';
import { Message } from '@/types';
import styles from './MessageList.module.scss';

const MessageList: React.FC = () => {
  const messages = useChatStore((state) => {
    const currentSessionId = state.currentSessionId;
    if (!currentSessionId) return [] as Message[];
    return state.sessions[currentSessionId]?.messages || [];
  });

  return (
    <div className={styles.messageList}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>欢迎使用，输入内容开始对话…</div>
      )}
      {messages.map((msg, idx) => (
        <MessageBubble key={msg.id || idx} msg={msg} />
      ))}
    </div>
  );
};

export default memo(MessageList);
