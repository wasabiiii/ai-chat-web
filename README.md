# AI CHAT

基于React19+Typescript+Vite+Vitest开发的AI Chat

![Image](https://github.com/user-attachments/assets/b1c0b54f-a104-4458-a68b-d8b1a06445b1)

## 功能
- ✅ 模型切换: 支持Deepseek、GPT模型
- ✅ 消息支持中断或重试
- ✅ 当前会话持久化
- ⬜ 主题切换
- ✅ 多行编辑器
- ⬜ 模型配置面板
- ⬜ 响应流式显示


## 本地开发
node版本需要v18.8+

依赖安装
```
npm i
```

本地开发
```
npm run dev
```

单元测试
```
npm run test
```

预览构建后的项目
```
npm run build:preview
```

### 目录结构
```
src/
├── components/        # UI 组件
├── contexts/         # React Context
├── hooks/           # 自定义 Hooks
├── utils/           # 工具函数
├── types.ts         # 类型定义
└── App.tsx          # 根组件
```

### 模型key配置
.env中配置模型对应的key