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
- [x] メッセージを送信してAIから返答が返ることを確認
- [x] ストリーミングで文字が順番に表示されることを確認
- [x] ブラウザの開発者ツールで `ANTHROPIC_API_KEY` がクライアントに露出していないことを確認（.next/static/ に含まれないことを確認済み）
- [x] スマートフォン幅（375px）・タブレット幅（768px）・PC幅（1280px）でレイアウト確認
- [x] `npx tsc --noEmit` で型エラーがないことを確認
- [x] `npm run build` でビルドエラーがないことを確認

---

## Phase 11: Vercel デプロイ準備

- [x] GitHubリポジトリを作成してプッシュ（`rad091217-png/ai-chat`）
- [x] `next.config.ts` を確認（`standalone` なし、Vercel向けOK）
- [x] `package.json` のスクリプトを Vercel 向けに戻す・プッシュ済み

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

---

## 残タスク（実装不足・バグ）

### 🐛 バグ

- [ ] **空のAIメッセージとドットインジケーターの重複表示**
  - `page.tsx` でストリーミング開始時に `content: ''` の空メッセージを追加している
  - 同時に `ChatWindow` で `isLoading=true` のときドットも表示されるため二重になる
  - 修正方針: ストリーミング中は空メッセージを追加せず、最初のチャンクが届いてからメッセージをリストに追加する（または `MessageBubble` で `content` が空のときは非表示にする）

- [ ] **Vercel でストリーミングが10秒でタイムアウトする**
  - `app/api/chat/route.ts` に `export const maxDuration = 30;` が未設定
  - Vercel のデフォルトタイムアウトは10秒のため、長い返答が途切れる可能性がある

- [ ] **`streamText` 内部の非同期エラーが捕捉されない**
  - `streamText` は同期的に Result オブジェクトを返すため、LLM呼び出しエラーは `try/catch` の外（ストリーム読み取り中）で発生する
  - `streamText({ ..., onError: (e) => console.error(e) })` の追加が必要

### 🔒 セキュリティ・堅牢性

- [ ] **APIルートにリクエストバリデーションがない**
  - `message` が空文字・undefined の場合でもLLMを呼び出してしまう
  - `history` が配列でない場合にクラッシュする可能性がある
  - 修正方針: `message` の存在チェックと `history` の型検証を追加し、不正リクエストには400を返す

- [ ] **会話履歴の長さ制限がない**
  - チャットを長く続けるとトークン数がモデルの上限を超えてエラーになる
  - 修正方針: `history` を直近 N ターン（例: 20件）に切り詰める処理を追加する

### ✨ UX改善

- [ ] **`ChatInput` の textarea が自動リサイズされない**
  - 複数行テキストを入力しても入力欄の高さが変わらず、テキストが隠れる
  - 修正方針: `onChange` で `textarea.style.height = 'auto'` → `textarea.style.height = scrollHeight + 'px'` を実行する

- [ ] **ストリーミング中断ボタンがない**
  - 生成中にキャンセルする手段がない
  - 修正方針: `AbortController` を使い、送信ボタンをストリーミング中は「停止ボタン」に切り替える

- [ ] **日本語フォントが未設定**
  - `Nunito` は `subsets: ['latin']` のみのため、日本語テキストにはシステムフォントが使われる
  - 修正方針: `next/font/google` で `Noto Sans JP` を追加し、日本語テキストに適用する

### 🛠 コード品質・設定

- [ ] **`package.json` の `name` が `ai-chat-temp`**
  - create-next-app を一時ディレクトリで実行した際の名前が残っている
  - `"name": "ai-chat"` に修正する

- [ ] **`lib/mastra.ts` の `mastra` インスタンスが未使用**
  - `export const mastra = new Mastra({});` がどこにも import されていない
  - 不要であれば削除する（将来の Agent/Workflow 利用まで保留でも可）

- [ ] **`.playwright-mcp/` ログファイルが Git にコミットされている**
  - テスト用ログが `rad091217-png/ai-chat` リポジトリに含まれている
  - `.gitignore` に `.playwright-mcp/` を追加し、`git rm -r --cached .playwright-mcp/` で除去する

- [ ] **`prisma.config.ts` が `dotenv` に依存しているが未インストール**
  - `prisma init` で自動生成された `prisma.config.ts` が `import "dotenv/config"` を含んでいる
  - `dotenv` は `devDependencies` に含まれていないためビルドエラーになる可能性がある
  - 修正方針: `npm install --save-dev dotenv` を実行するか、`prisma.config.ts` を削除して `schema.prisma` のみで管理する

- [ ] **`next.config.ts` に `turbopack.root` が未設定（開発時の警告）**
  - `npm run dev` のたびに「workspace root の推定が正しくない可能性」という警告が出る
  - 修正方針: `next.config.ts` に `turbopack: { root: __dirname }` を追加する
