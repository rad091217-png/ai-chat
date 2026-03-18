# 実行計画 TODO

---

## Phase 1: プロジェクトセットアップ

- [x] Next.js プロジェクト作成
  ```bash
  npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
  ```
- [x] 追加パッケージをインストール
  ```bash
  npm install hono @mastra/core @anthropic-ai/sdk
  npm install prisma @prisma/client
  ```
- [x] `tsconfig.json` を確認し `"strict": true` になっていることを確認
- [x] `.env.local` を作成
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/ai-chat
  ```
- [x] `.gitignore` に `.env.local` が含まれているか確認

---

## Phase 2: Prisma / MongoDB セットアップ

- [x] Prisma を初期化
  ```bash
  npx prisma init
  ```
- [x] `prisma/schema.prisma` を編集
  ```prisma
  datasource db {
    provider = "mongodb"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }
  ```
  ※ 今回は会話履歴をDBに保存しないため、モデル定義は不要。将来拡張用として構成だけ整える。
- [x] Prisma クライアントを生成
  ```bash
  npx prisma generate
  ```
- [x] `lib/prisma.ts` を作成（シングルトン）
  ```ts
  import { PrismaClient } from '@prisma/client';

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

  export const prisma =
    globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  ```

---

## Phase 3: キャラクター定義

- [x] `lib/character.ts` を作成
  ```ts
  export const CHARACTER_NAME = 'ミルク';

  export const CHARACTER_SYSTEM_PROMPT = `
  あなたは「ミルク」という名前のキャラクターです。
  - 性格：明るく、フレンドリーで少しおちゃめ。好奇心旺盛。
  - 口調：敬語は使わず、友達口調で話す。語尾に「ね」や「よ」をよく使う。
  - 禁止事項：暴力的・差別的・性的な発言はしない。
  - ユーザーの名前を聞いたら積極的に使う。
  `.trim();
  ```

---

## Phase 4: Mastra セットアップ

- [x] `lib/mastra.ts` を作成
  ```ts
  import { Mastra } from '@mastra/core';
  import { createAnthropic } from '@ai-sdk/anthropic';

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  export const mastra = new Mastra({});

  export const claudeModel = anthropic('claude-sonnet-4-6');
  ```

---

## Phase 5: チャット API 実装

- [x] `app/api/chat/route.ts` を作成

  **型定義**
  ```ts
  type Message = {
    role: 'user' | 'assistant';
    content: string;
  };

  type ChatRequest = {
    message: string;
    history: Message[];
  };
  ```

  **エンドポイント実装（SSEストリーミング）**
  ```ts
  import { NextRequest } from 'next/server';
  import { streamText } from 'ai';
  import { claudeModel } from '@/lib/mastra';
  import { CHARACTER_SYSTEM_PROMPT } from '@/lib/character';

  export async function POST(req: NextRequest) {
    const { message, history }: ChatRequest = await req.json();

    const result = streamText({
      model: claudeModel,
      system: CHARACTER_SYSTEM_PROMPT,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    });

    return result.toDataStreamResponse();
  }
  ```

- [x] APIキーが `process.env.ANTHROPIC_API_KEY` のみで参照されクライアントに漏れないことを確認

---

## Phase 6: フロントエンド型定義

- [x] `types/chat.ts` を作成
  ```ts
  export type Role = 'user' | 'assistant';

  export type Message = {
    id: string;
    role: Role;
    content: string;
  };
  ```

---

## Phase 7: UIコンポーネント実装

### `components/MessageBubble.tsx`
- [x] ユーザーとAIで吹き出しの位置・色を分ける
  - ユーザー：右寄せ、ポップなピンク背景
  - AI：左寄せ、白 or 薄い黄色背景
- [x] `role` を props で受け取り条件分岐でスタイルを切り替える

### `components/ChatInput.tsx`
- [x] テキストエリア（Enter送信 / Shift+Enter改行）
- [x] 送信ボタン（送信中はローディング状態でdisabled）
- [x] `onSubmit` コールバックを props で受け取る

### `components/ChatWindow.tsx`
- [x] `Message[]` を props で受け取り `MessageBubble` を並べる
- [x] 新しいメッセージが追加されたら自動スクロール（`useEffect` + `scrollIntoView`）
- [x] AIの返答ストリーミング中は「入力中...」インジケーターを表示

---

## Phase 8: ページ実装（`app/page.tsx`）

- [x] `useState<Message[]>` で会話履歴を管理
- [x] `useState<boolean>` でローディング状態を管理
- [x] `handleSubmit` 関数を実装
  - `/api/chat` に POST
  - `ReadableStream` でストリーミングレスポンスを受け取る
  - チャンクが届くたびに最後のAIメッセージの `content` を更新
- [x] `ChatWindow` と `ChatInput` を配置

---

## Phase 9: デザイン（ポップ・レスポンシブ）

- [x] `app/globals.css` にGoogle Fontsを追加（例：Nunito、Pacifico）
- [x] Tailwind でカラーパレットを設定（`tailwind.config.ts`）
  ```ts
  theme: {
    extend: {
      colors: {
        pop: {
          pink: '#FF6B9D',
          yellow: '#FFD93D',
          blue: '#6BCEFF',
          green: '#6BCB77',
        },
      },
    },
  }
  ```
- [x] チャット画面のレイアウト
  - PC：中央寄せ、最大幅 `max-w-2xl`
  - スマホ：全幅、下部に入力欄固定
- [x] 吹き出しに `rounded-2xl`、影に `shadow-md` を使ってポップ感を出す
- [x] ページ背景はグラデーションまたは明るい単色

---

## Phase 10: ローカル動作確認

- [x] `npm run dev` で起動し `http://localhost:3000` を開く
- [ ] メッセージを送信してAIから返答が返ることを確認（要: .env.local に実際の ANTHROPIC_API_KEY を設定）
- [ ] ストリーミングで文字が順番に表示されることを確認（要: 実際のAPIキー）
- [x] ブラウザの開発者ツールで `ANTHROPIC_API_KEY` がクライアントに露出していないことを確認（.next/static/ に含まれないことを確認済み）
- [x] スマートフォン幅（375px）・タブレット幅（768px）・PC幅（1280px）でレイアウト確認
- [x] `npx tsc --noEmit` で型エラーがないことを確認
- [x] `npm run build` でビルドエラーがないことを確認

---

## Phase 11: Vercel デプロイ準備

- [ ] GitHubリポジトリを作成してプッシュ
  ```bash
  git init
  git add .
  git commit -m "initial commit"
  gh repo create ai-chat --public --push --source=.
  ```
  ※ `.env.local` は `.gitignore` で除外されているため、コミットに含まれない
- [ ] `next.config.ts` を確認（Vercel は `standalone` 不要のためデフォルトのままでOK）
- [ ] `package.json` のスクリプトを Vercel 向けに戻す
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
  ```
  ※ Vercel はビルド環境が正常なため `node node_modules/...` の回避策は不要

---

## Phase 12: Vercel デプロイ

- [ ] [vercel.com](https://vercel.com) にサインアップ / ログイン（GitHubアカウント連携）
- [ ] Vercel ダッシュボードで「Add New Project」→ GitHubリポジトリ `ai-chat` をインポート
- [ ] 「Environment Variables」に以下を追加
  ```
  ANTHROPIC_API_KEY = <実際のAPIキー>
  ```
  ※ `DATABASE_URL` は現時点でDB未使用のため任意
- [ ] 「Deploy」ボタンをクリック → 自動ビルド・デプロイ完了を待つ
- [ ] 発行された `*.vercel.app` の URL でチャットが動作することを確認

---

## 完了条件チェックリスト

- [ ] Vercel の URL でチャット画面が表示される
- [ ] メッセージを送るとキャラクターAIから返答が来る
- [ ] 返答がストリーミングで表示される
- [ ] スマートフォン・タブレット・PCどれでもレイアウトが崩れない
- [ ] ブラウザコンソールにエラーが出ていない
- [ ] `ANTHROPIC_API_KEY` がクライアント側に露出していない
