export const modelList = [
  {
    label: 'GPT-3.5',
    value: 'gpt-3.5',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-3.5-turbo',
    key: 'VITE_KEY_GPT_3_5',
  },
  {
    label: 'GPT-4',
    value: 'gpt-4',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-4',
    key: 'VITE_KEY_GPT_4',
  },
  {
    label: 'DeepSeek',
    value: 'deepseek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    modelName: 'deepseek-chat',
    key: 'VITE_KEY_DEEPSEEK',
  },
];
