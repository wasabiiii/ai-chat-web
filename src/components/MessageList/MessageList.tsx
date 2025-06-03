import React, { memo, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from '../MessageBubble/MessageBubble';
import { Message } from '@/types';
import styles from './MessageList.module.scss';

const MessageList: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useChatStore((state) => {
    const currentSessionId = state.currentSessionId;
    if (!currentSessionId) return [] as Message[];
    return state.sessions[currentSessionId]?.messages || [];
  });

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.messageList}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>欢迎使用，输入内容开始对话…</div>
      )}
      {messages.map((msg, idx) => (
        <MessageBubble key={msg.id || idx} msg={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default memo(MessageList);
