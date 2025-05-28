import request from './request';
import { LLMMessage } from '@/types';
import { modelList } from '@utils/constants';

export async function requestLLM(
  modelId: string,
  messages: LLMMessage[],
  options: { signal?: AbortSignal },
): Promise<string> {
  const { signal } = options;
  const modelInfo = modelList.find((m) => m.value === modelId);

  if (!modelInfo) throw new Error('暂不支持该模型');
  // 通过环境变量名动态获取 key
  const apiKey = (import.meta.env[modelInfo.key] as string) || undefined;

  if (!apiKey) throw new Error('请在环境变量中配置该模型的 API Key');

  // mock start
  if (modelInfo.label !== 'DeepSeek') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('这是一个模拟AI回复');
      }, 1000);
    });
  }
  // mock end

  const config: any = {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (signal) config.signal = signal;

  const data = await request.post(
    modelInfo.apiUrl,
    {
      model: modelInfo.modelName,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    },
    config,
  );
  return data.choices?.[0]?.message?.content || 'AI无回复';
}
