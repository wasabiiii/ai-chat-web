import React, { memo } from 'react';
import { Avatar, Button, Spin } from 'antd';
import { UserOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { Message } from '@/types';
import { modelList } from '@utils/constants';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import styles from './MessageBubble.module.scss';

interface MessageBubbleProps {
  msg: Message;
  isThinking: boolean;
  onRetry: (retryData: { userInput: string }) => void;
}
const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isThinking, onRetry }) => {
  const isUser = msg.role === 'user';

  const renderContent = () => {
    if (isUser) {
      // 用户消息直接显示，保留换行
      return <div className={styles.userContent}>{msg.content}</div>;
    } else {
      if (isThinking) {
        return (
          <span style={{ color: '#aaa' }}>
            <Spin size="small" style={{ marginRight: 8 }} />
            {msg.content}
          </span>
        );
      }

      if (msg.error) {
        return (
          <div className={styles.errorContent}>
            <div>{msg.content}</div>
            {msg.retryData && (
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={() => onRetry(msg.retryData!)}
                className={styles.retryButton}
              >
                重试
              </Button>
            )}
          </div>
        );
      }

      return <MarkdownRenderer content={msg.content} />;
    }
  };

  return (
    <div className={`${styles.messageBubble} ${isUser ? styles.user : styles.assistant}`}>
      <Avatar
        className={styles.avatar}
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{ background: isUser ? '#91d5ff' : '#ffd666', color: '#222' }}
      />
      <div className={styles.messageBubbleContent}>
        <div className={styles.content}>{renderContent()}</div>
        {/* 气泡外部展示模型名 */}
        {msg.role === 'assistant' && (
          <div className={styles.modelTag}>
            {modelList.find((m) => m.value === msg.model)?.label || msg.model}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MessageBubble);
