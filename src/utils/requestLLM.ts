import { Message } from '@/types';
import { modelList } from '@utils/constants';

export async function requestLLM(
  modelId: string,
  messages: Message[],
  options: { signal?: AbortSignal },
): Promise<Response> {
  const { signal } = options;
  const modelInfo = modelList.find((m) => m.value === modelId);

  if (!modelInfo) throw new Error('暂不支持该模型');
  // 通过环境变量名动态获取 key
  const apiKey = (import.meta.env[modelInfo.key] as string) || undefined;

  if (!apiKey) throw new Error('请在环境变量中配置该模型的 API Key');

  // mock start
  if (modelInfo.label !== 'DeepSeek') {
    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          const mockData = {
            id: 'mock-id',
            object: 'chat.completion.chunk',
            created: Date.now(),
            model: modelId,
            choices: [{ index: 0, delta: { content: '这是一个模拟AI回复' }, finish_reason: null }],
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(mockData)}\n\n`));
          controller.close();
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
    return mockResponse;
  }
  // mock end

  const data = await fetch(modelInfo.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelInfo.modelName,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    signal,
  });
  return data;
}
