import React, { memo } from 'react';
import { Avatar, Button, Spin } from 'antd';
import { UserOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { Message } from '@/types';
import { modelList } from '@utils/constants';
import { useChatStore } from '@/store/useChatStore';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import styles from './MessageBubble.module.scss';

interface MessageBubbleProps {
  msg: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg }) => {
  const isUser = msg.role === 'user';
  const startAIResponse = useChatStore((state) => state.startAIResponse);

  const handleRetry = () => {
    if (msg.retryData) {
      startAIResponse(msg.retryData);
    }
  };

  const renderContent = () => {
    if (isUser) {
      // 用户消息直接显示，保留换行
      return <div className={styles.userContent}>{msg.content}</div>;
    } else {
      if (msg.error) {
        return (
          <div className={styles.errorContent}>
            <div>
              {msg.content}
              {msg.isAborted && <span className={styles.abortedTag}>（已中断）</span>}
            </div>
          </div>
        );
      }

      if (msg.isRequesting) {
        return (
          <div className={styles.aiContent}>
            <Spin size="small" className={styles.loading} />
            <span className={styles.requestingText}>正在思考...</span>
          </div>
        );
      }

      return (
        <div className={styles.aiContent}>
          <MarkdownRenderer content={msg.content} />
        </div>
      );
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
        <div className={styles.messageFooter}>
          {msg.retryData && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              className={styles.retryButton}
            >
              重试
            </Button>
          )}
          {msg.role === 'assistant' && (
            <div className={styles.modelTag}>
              {modelList.find((m) => m.value === msg.model)?.label || msg.model}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(MessageBubble);
