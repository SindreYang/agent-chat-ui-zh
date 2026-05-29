# Agent Chat UI

Agent Chat UI 是一个 Next.js 应用程序，通过聊天界面实现与任何带有 `messages` 键的 LangGraph 服务器进行聊天。

> [!NOTE]
> 🎥 观看视频设置指南 [这里](https://youtu.be/lInrwVnZ83o)。

## 设置

> [!TIP]
> 不想在本地运行应用？使用已部署的站点：[agentchat.vercel.app](https://agentchat.vercel.app)！

首先，克隆仓库，或运行 [`npx` 命令](https://www.npmjs.com/package/create-agent-chat-app)：

```bash
npx create-agent-chat-app
```

或者

```bash
git clone https://github.com/langchain-ai/agent-chat-ui.git

cd agent-chat-ui
```

安装依赖：

```bash
pnpm install
```

运行应用：

```bash
pnpm dev
```

应用将在 `http://localhost:3000` 上可用。

## 使用方法

应用运行后（或使用已部署站点），您将被提示输入：

- **部署 URL**：您要聊天的 LangGraph 服务器的 URL。这可以是生产或开发 URL。
- **助手/图 ID**：图的名称，或在聊天界面获取和提交运行时要使用的助手 ID。
- **LangSmith API 密钥**：（仅连接到已部署的 LangGraph 服务器时需要）用于向 LangGraph 服务器发送请求进行身份验证的 LangSmith API 密钥。
- **使用 Agent Builder 构建**：对于 Agent Builder 部署，启用此选项。这会自动将认证方案设置为 `langsmith-api-key`。

输入这些值后，点击 `Continue`。然后您将被重定向到聊天界面，可以开始与 LangGraph 服务器聊天。

## 环境变量

您可以通过设置以下环境变量来跳过初始设置表单：

```bash
NEXT_PUBLIC_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent
NEXT_PUBLIC_AUTH_SCHEME=
```

> [!NOTE]
> 如果您正在连接到 LangSmith Agent Builder 部署，请设置 `NEXT_PUBLIC_AUTH_SCHEME=langsmith-api-key`。

> [!TIP]
> 如果您想连接到生产环境的 LangGraph 服务器，请阅读 [进入生产环境](#going-to-production) 部分。

使用这些变量：

1. 将 `.env.example` 文件复制到名为 `.env` 的新文件
2. 在 `.env` 文件中填写值
3. 重新启动应用

设置这些环境变量后，应用将使用它们而不是显示设置表单。

## 在聊天中隐藏消息

您可以通过两种主要方式控制 Agent Chat UI 中消息的可见性：

**1. 阻止实时流式传输：**

要阻止消息在从 LLM 调用流式传输时显示，请在聊天模型的配置中添加 `langsmith:nostream` 标签。UI 通常使用 `on_chat_model_stream` 事件来渲染流式消息；此标签可防止为标记的模型发出这些事件。

_Python 示例：_

```python
from langchain_anthropic import ChatAnthropic

# 通过 .with_config 方法添加标签
model = ChatAnthropic().with_config(
    config={"tags": ["langsmith:nostream"]}
)
```

_TypeScript 示例：_

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic()
  // 通过 .withConfig 方法添加标签
  .withConfig({ tags: ["langsmith:nostream"] });
```

**注意：** 即使以这种方式隐藏流式传输，如果消息在保存到图状态后没有进一步修改，它仍然会在 LLM 调用完成后显示。

**2. 永久隐藏消息：**

要确保消息在聊天 UI 中从不显示（无论是在流式传输期间还是保存到状态后），在将消息添加到图状态之前，在其 `id` 字段前加上 `do-not-render-` 前缀，并在聊天模型的配置中添加 `langsmith:do-not-render` 标签。UI 会显式过滤掉任何 `id` 以此前缀开头的消息。

_Python 示例：_

```python
result = model.invoke([messages])
# 在保存到状态之前为 ID 添加前缀
result.id = f"do-not-render-{result.id}"
return {"messages": [result]}
```

_TypeScript 示例：_

```typescript
const result = await model.invoke([messages]);
// 在保存到状态之前为 ID 添加前缀
result.id = `do-not-render-${result.id}`;
return { messages: [result] };
```

这种方法保证消息完全隐藏在用户界面中。

## 渲染工件

Agent Chat UI 支持在聊天中渲染工件。工件渲染在聊天右侧的侧边栏中。要渲染工件，您可以从 `thread.meta.artifact` 字段获取工件上下文。以下是获取工件上下文的示例工具钩子：

```tsx
export function useArtifact<TContext = Record<string, unknown>>() {
  type Component = (props: {
    children: React.ReactNode;
    title?: React.ReactNode;
  }) => React.ReactNode;

  type Context = TContext | undefined;

  type Bag = {
    open: boolean;
    setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;

    context: Context;
    setContext: (value: Context | ((prev: Context) => Context)) => void;
  };

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { artifact: [Component, Bag] } }
  >();

  return thread.meta?.artifact;
}
```

之后，您可以使用 `useArtifact` 钩子中的 `Artifact` 组件渲染额外内容：

```tsx
import { useArtifact } from "../utils/use-artifact";
import { LoaderIcon } from "lucide-react";

export function Writer(props: {
  title?: string;
  content?: string;
  description?: string;
}) {
  const [Artifact, { open, setOpen }] = useArtifact();

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-lg border p-4"
      >
        <p className="font-medium">{props.title}</p>
        <p className="text-sm text-gray-500">{props.description}</p>
      </div>

      <Artifact title={props.title}>
        <p className="whitespace-pre-wrap p-4">{props.content}</p>
      </Artifact>
    </>
  );
}
```

## 进入生产环境

准备好进入生产环境后，您需要更新连接方式以及对部署的请求进行身份验证。默认情况下，Agent Chat UI 设置为本地开发，直接从客户端连接到您的 LangGraph 服务器。如果要进入生产环境，这是不可能的，因为它要求每个用户都有自己的 LangSmith API 密钥，并自己设置 LangGraph 配置。

### 生产设置

要将 Agent Chat UI 投入生产，您需要选择两种方式之一来对 LangGraph 服务器的请求进行身份验证。下面概述这两种选项：

### 快速入门 - API 透传

将 Agent Chat UI 投入生产的最快方式是使用 [API Passthrough](https://github.com/bracesproul/langgraph-nextjs-api-passthrough) 包（[NPM 链接在此](https://www.npmjs.com/package/langgraph-nextjs-api-passthrough)）。此包提供了一种简单的方式来代理对 LangGraph 服务器的请求，并为您处理身份验证。

此仓库已包含使用此方法所需的所有代码。您唯一需要做的配置是设置适当的环境变量。

```bash
NEXT_PUBLIC_ASSISTANT_ID="agent"
# 这应该是您的 LangGraph 服务器的部署 URL
LANGGRAPH_API_URL="https://my-agent.default.us.langgraph.app"
# 这应该是您的网站 URL + "/api"。这是您连接到 API 代理的方式
NEXT_PUBLIC_API_URL="https://my-website.com/api"
# 您的 LangSmith API 密钥，将在 API 代理内部注入到请求中
LANGSMITH_API_KEY="lsv2_..."
```

让我们介绍每个环境变量的作用：

- `NEXT_PUBLIC_ASSISTANT_ID`：在聊天界面获取和提交运行时要使用的助手 ID。这仍然需要 `NEXT_PUBLIC_` 前缀，因为它不是秘密，我们在客户端提交请求时使用它。
- `LANGGRAPH_API_URL`：您的 LangGraph 服务器的 URL。这应该是生产部署 URL。
- `NEXT_PUBLIC_API_URL`：您的网站 URL + `/api`。这是您连接到 API 代理的方式。对于 [Agent Chat 演示](https://agentchat.vercel.app)，这将设置为 `https://agentchat.vercel.app/api`。您应该将其设置为您的生产 URL。
- `LANGSMITH_API_KEY`：用于向 LangGraph 服务器发送请求进行身份验证的 LangSmith API 密钥。同样，不要用 `NEXT_PUBLIC_` 作为前缀，因为它是秘密，仅在服务器上 API 代理将其注入到对已部署 LangGraph 服务器的请求时使用。

有关深入文档，请参阅 [LangGraph Next.js API Passthrough](https://www.npmjs.com/package/langgraph-nextjs-api-passthrough) 文档。

### 高级设置 - 自定义身份验证

在您的 LangGraph 部署中使用自定义身份验证是一种高级且更强大的方式来对 LangGraph 服务器的请求进行身份验证。使用自定义身份验证，您可以允许从客户端发出请求，而无需 LangSmith API 密钥。此外，您可以在请求上指定自定义访问控制。

要在您的 LangGraph 部署中设置此功能，请阅读 LangGraph 自定义身份验证文档，[Python](https://langchain-ai.github.io/langgraph/tutorials/auth/getting_started/) 和 [TypeScript 版本在此](https://langchain-ai.github.io/langgraphjs/how-tos/auth/custom_auth/)。

在您的部署上设置好后，您应该对 Agent Chat UI 进行以下更改：

1. 配置任何额外的 API 请求，从您的 LangGraph 部署获取身份验证令牌，该令牌将用于对来自客户端的请求进行身份验证。
2. 将 `NEXT_PUBLIC_API_URL` 环境变量设置为您的生产 LangGraph 部署 URL。
3. 将 `NEXT_PUBLIC_ASSISTANT_ID` 环境变量设置为在聊天界面获取和提交运行时要使用的助手 ID。
4. 修改 [`useTypedStream`](src/providers/Stream.tsx)（`useStream` 的扩展）钩子，通过标头将您的身份验证令牌传递给 LangGraph 服务器：

```tsx
const streamValue = useTypedStream({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  assistantId: process.env.NEXT_PUBLIC_ASSISTANT_ID,
  // ... 其他字段
  defaultHeaders: {
    Authentication: `Bearer ${addYourTokenHere}`, // 这是您传递身份验证令牌的地方
  },
});
```