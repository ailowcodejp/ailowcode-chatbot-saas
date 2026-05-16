# LLM Gateway 連携ガイド

このドキュメントは **AILowcode Chatbot SaaS** で LLM Gateway を利用するためのセットアップ手順と実装パターンを説明します。

> LLM Gateway は、1 つのエンドポイントで多様な LLM を利用できるプロキシサービスです。  
> このプロジェクトでは **サーバーサイドのみ** で LLM Gateway を呼び出し、API キーをクライアントに露出しません。

---

## 1 · API キーを取得する

1. [LLM Gateway ダッシュボード](https://llmgateway.io) にサインインします。
2. 新しいプロジェクトを作成 → **キーをコピー**します。
3. ローカル開発用に `.env.local` に、共有用サンプルとして `.env.example` に設定します。

```bash
# .env.local（コミット禁止）
LLM_GATEWAY_API_KEY="llmgtwy_XXXXXXXXXXXXXXXX"
```

```bash
# .env.example（コミット対象、プレースホルダー）
LLM_GATEWAY_API_KEY=""
```

Cloudflare Workers にデプロイする場合は、ダッシュボードの **Runtime variables** にも同じキーを登録してください。

> **注意**: `NEXT_PUBLIC_` プレフィックスが付いていないため、Client Component からは読めません。意図通りの設計です。

---

## 2 · 環境変数をプロジェクトの設定に追加する

このプロジェクトでは環境変数を `src/config/` で検証・管理します。  
LLM Gateway の API キーもここに追加します。

### `src/config/env.server.ts`

`env.server.ts` に `LLM_GATEWAY_API_KEY` を追加します。

```ts title="src/config/env.server.ts"
import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
	// ... 既存の設定
	LLM_GATEWAY_API_KEY: z.string().min(1),
});

export const serverEnv = serverEnvSchema.parse({
	// ... 既存の設定
	LLM_GATEWAY_API_KEY: process.env.LLM_GATEWAY_API_KEY,
});
```

zod で必須検証を行うため、キー未設定時は起動時にエラーになり、誤ったデプロイを防止できます。

---

## 3 · サーバーサイドで LLM Gateway を呼び出す

LLM Gateway の呼び出しは **必ずサーバーサイド** に閉じます。  
`server-only` を指定したモジュールに処理を集約し、API キーがクライアントバンドルに含まれないようにします。

### `src/lib/llm-gateway/client.ts`

```ts title="src/lib/llm-gateway/client.ts"
import "server-only";

import { serverEnv } from "@/config/env.server";

type Message = {
	role: "user" | "assistant" | "system";
	content: string;
};

type ChatCompletionOptions = {
	model?: string;
	messages: Message[];
	stream?: boolean;
};

type ChatCompletionResponse = {
	message: string;
};

export async function createChatCompletion(
	options: ChatCompletionOptions,
): Promise<ChatCompletionResponse> {
	const { model = "gpt-4o", messages, stream = false } = options;

	const response = await fetch(
		"https://api.llmgateway.io/v1/chat/completions",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${serverEnv.LLM_GATEWAY_API_KEY}`,
			},
			body: JSON.stringify({
				model,
				messages,
				stream,
			}),
		},
	);

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`LLM Gateway API error: ${response.status} ${response.statusText}\n${errorBody}`,
		);
	}

	const data = (await response.json()) as {
		choices: Array<{ message: { content: string } }>;
	};

	return {
		message: data.choices[0].message.content,
	};
}
```

#### ポイント

- `import "server-only"` でクライアントバンドルへの混入を防ぐ
- API キーは `serverEnv` 経由で参照する（`process.env` を直接読まない）
- エラーハンドリングを実装し、HTTP エラー時に詳細をログ出力する

---

## 4 · Route Handler から LLM Gateway を呼び出す

チャット機能は `src/app/api/chat/route.ts` に Route Handler として実装します。

### `src/app/api/chat/route.ts`

```ts title="src/app/api/chat/route.ts"
import { NextRequest, NextResponse } from "next/server";

import { createChatCompletion } from "@/lib/llm-gateway/client";

export async function POST(request: NextRequest) {
	const { message } = (await request.json()) as { message: string };

	if (!message || typeof message !== "string") {
		return NextResponse.json({ error: "message は必須です" }, { status: 400 });
	}

	try {
		const result = await createChatCompletion({
			model: "gpt-4o",
			messages: [{ role: "user", content: message }],
		});

		return NextResponse.json({ message: result.message });
	} catch (error) {
		console.error("Chat API error:", error);
		return NextResponse.json(
			{ error: "AI からのレスポンスの取得に失敗しました" },
			{ status: 500 },
		);
	}
}
```

#### ポイント

- 入力値のバリデーションを行う
- try-catch でエラーをハンドリングし、クライアントにエラーレスポンスを返す
- 内部エラーの詳細はクライアントに露出しない

---

## 5 · フロントエンドから API を呼び出す

### `src/features/chat/components/chat-form.tsx`

```tsx title="src/features/chat/components/chat-form.tsx"
"use client";

import { useState } from "react";

export function ChatForm() {
	const [input, setInput] = useState("");
	const [response, setResponse] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		setLoading(true);
		setResponse("");

		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: input }),
			});

			if (!res.ok) {
				throw new Error("API エラー");
			}

			const data = (await res.json()) as { message: string };
			setResponse(data.message);
		} catch (error) {
			console.error("Chat error:", error);
			setResponse("エラーが発生しました。もう一度お試しください。");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="メッセージを入力..."
					className="flex-1 rounded border px-3 py-2"
					disabled={loading}
				/>
				<button
					type="submit"
					disabled={loading}
					className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
				>
					{loading ? "送信中..." : "送信"}
				</button>
			</form>
			{response && (
				<div className="rounded-lg border bg-gray-50 p-4">
					<p className="whitespace-pre-wrap">{response}</p>
				</div>
			)}
		</div>
	);
}
```

---

## 6 · チャット機能をページに配置する

```tsx title="src/app/(dashboard)/chat/page.tsx"
import { ChatForm } from "@/features/chat/components/chat-form";

export default function ChatPage() {
	return (
		<div className="mx-auto max-w-2xl py-8">
			<h1 className="mb-6 text-2xl font-bold">AI チャット</h1>
			<ChatForm />
		</div>
	);
}
```

---

## 7 · フォルダ構成（参考）

LLM Gateway 関連のファイルは以下のように配置します。

```text
src/
├── config/
│   └── env.server.ts           # LLM_GATEWAY_API_KEY を追加
├── lib/
│   └── llm-gateway/
│       └── client.ts           # LLM Gateway 呼び出し（server-only）
├── features/
│   └── chat/
│       ├── components/
│       │   └── chat-form.tsx    # クライアントコンポーネント
│       └── ...                  # queries.ts, actions.ts 等（必要に応じて）
└── app/
    ├── api/
    │   └── chat/
    │       └── route.ts         # Route Handler
    └── (dashboard)/
        └── chat/
            └── page.tsx         # チャットページ
```

---

## 8 · 次のステップ

- **ストリーミング対応**: `createChatCompletion` に `stream: true` を渡し、`ReadableStream` を利用した Server-Sent Events を実装する
- **モデル選択機能**: ユーザーがモデルを選択できる UI を追加する
- **会話履歴の保存**: Supabase にメッセージを保存し、継続的な会話を実現する
- **クレジット消費との連携**: ビジネスプランに応じたクレジット消費処理を組み込む

---

## 9 · 参考リンク

- [LLM Gateway 公式ドキュメント](https://llmgateway.io/docs)
- [LLM Gateway GitHub](https://github.com/theopenco/llmgateway)
- [プロジェクト全体のアーキテクチャ](../architecture/01_architecture-overview.md)
- [フォルダ構成ガイド](../coding-guide/11_nextjs-folder-structure-guide.md)
- [環境変数設定ガイド](../setup/environment-setup-guide.md)
