import React, { useCallback, useRef, useState } from 'react';
import { Input, Button, Select, Form } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { useChatStore } from '@/store/useChatStore';
import styles from './ChatInput.module.scss';

const { TextArea } = Input;

const ModelSelect: React.FC = () => {
  const models = useChatStore((state) => state.models);
  const currentModel = useChatStore((state) => state.currentModel);
  const switchModel = useChatStore((state) => state.switchModel);

  return (
    <Select
      className={styles.modelSelect}
      value={currentModel}
      onChange={(value) => switchModel(value)}
      options={models}
    />
  );
};

const ChatInput: React.FC = () => {
  // 只订阅需要的状态和函数
  const isGenerating = useChatStore((state) => state.isGenerating);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const startAIResponse = useChatStore((state) => state.startAIResponse);
  const abortGeneration = useChatStore((state) => state.abortGeneration);

  const [form] = Form.useForm();
  const inputRef = useRef<TextAreaRef>(null);
  const [hasInput, setHasInput] = useState(false);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (isGenerating) return;

      const message = form.getFieldValue('message');
      if (!message?.trim()) return;

      form.resetFields();
      setHasInput(false);
      addUserMessage(message);
      await startAIResponse();
    },
    [isGenerating, form, addUserMessage, startAIResponse],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className={styles.chatInputPanel}>
      <div className={styles.inputRow}>
        <ModelSelect />
      </div>
      <div className={styles.inputAreaCard}>
        <Form form={form}>
          <Form.Item name="message" style={{ marginBottom: 0 }}>
            <TextArea
              ref={inputRef}
              className={styles.chatInput}
              placeholder="请输入内容..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setHasInput(!!e.target.value.trim())}
              disabled={isGenerating}
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ background: 'transparent', boxShadow: 'none' }}
            />
          </Form.Item>
        </Form>
        <div className={styles.actionBar}>
          <Button
            className={styles.sendBtn}
            type="primary"
            icon={isGenerating ? <StopOutlined /> : <SendOutlined />}
            onClick={isGenerating ? abortGeneration : handleSubmit}
            loading={false}
            disabled={isGenerating ? false : !hasInput}
          >
            {isGenerating ? '中断' : '发送'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
