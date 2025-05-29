import React, { useCallback, useRef, useState } from 'react';
import { Input, Button, Select, Form } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { modelList } from '@utils/constants';
import { useModel } from '@/contexts/ModelContext';
import styles from './ChatInput.module.scss';

const { TextArea } = Input;

const ModelSelect: React.FC = () => {
  const { selectedModel, setSelectedModel } = useModel();

  return (
    <Select
      className={styles.modelSelect}
      value={selectedModel}
      onChange={setSelectedModel}
      options={modelList}
    />
  );
};

interface ChatInputProps {
  loading: boolean;
  onSend: (message: string) => void;
  onAbort: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ loading, onSend, onAbort }) => {
  const [form] = Form.useForm();
  const inputRef = useRef<TextAreaRef>(null);
  const [hasInput, setHasInput] = useState(false);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (loading) return;

      const message = form.getFieldValue('message');
      if (!message?.trim()) return;

      form.resetFields();
      setHasInput(false);
      await onSend(message);
    },
    [loading, form, onSend],
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
              disabled={loading}
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ background: 'transparent', boxShadow: 'none' }}
            />
          </Form.Item>
        </Form>
        <div className={styles.actionBar}>
          <Button
            className={styles.sendBtn}
            type="primary"
            icon={loading ? <StopOutlined /> : <SendOutlined />}
            onClick={loading ? onAbort : handleSubmit}
            loading={false}
            disabled={loading ? false : !hasInput}
          >
            {loading ? '中断' : '发送'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
