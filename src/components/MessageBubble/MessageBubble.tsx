import React from 'react';
import { Avatar, Button, Spin } from 'antd';
import { UserOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { Message } from '@/types';
import { modelList } from '@utils/constants';
import MarkdownRenderer from '../MarkdownRenderer';
import styles from './MessageBubble.module.scss';

interface MessageBubbleProps {
  msg: Message;
  idx: number;
  onRetry: (retryData: { userInput: string }) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, idx, onRetry }) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'start',
          width: '100%',
          marginBottom: 2,
          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          className={msg.role === 'user' ? `${styles.avatar} ${styles.user}` : styles.avatar}
          icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
          style={{ background: msg.role === 'user' ? '#91d5ff' : '#ffd666', color: '#222' }}
        />
        <div
          className={
            msg.role === 'user'
              ? `${styles.bubble} ${styles.user}`
              : `${styles.bubble} ${styles.assistant}`
          }
        >
          {msg.content === '正在思考…' ? (
            <span style={{ color: '#aaa' }}>
              <Spin size="small" style={{ marginRight: 8 }} />
              {msg.content}
            </span>
          ) : msg.error ? (
            <span style={{ color: '#f5222d' }}>
              {msg.content}
              {msg.retryData && (
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  style={{ marginLeft: 12 }}
                  onClick={() => onRetry(msg.retryData!)}
                  type="link"
                >
                  重试
                </Button>
              )}
            </span>
          ) : (
            <MarkdownRenderer content={msg.content} />
          )}
        </div>
      </div>
      {/* 气泡外部右下角展示模型名 */}
      {msg.role === 'assistant' && (
        <div className={styles.modelTag}>
          {modelList.find((m) => m.value === msg.model)?.label || msg.model}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
