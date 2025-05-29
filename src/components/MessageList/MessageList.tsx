import React, { memo, useCallback } from 'react';
import { Message } from '@/types';
import MessageBubble from '../MessageBubble/MessageBubble';
import styles from './MessageList.module.scss';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onRetry: (retryData: { userInput: string }) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading, onRetry }) => {
  const emptyRetry = useCallback(() => {}, []);

  return (
    <div className={styles.messageList}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>欢迎使用，输入内容开始对话…</div>
      )}
      {messages.map((msg, idx) => (
        <MessageBubble
          key={idx}
          msg={msg}
          onRetry={idx === messages.length - 1 ? onRetry : emptyRetry}
          isThinking={loading && idx === messages.length - 1}
        />
      ))}
    </div>
  );
};

export default memo(MessageList);
