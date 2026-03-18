# AI Chat Bot 仕様書

## プロジェクト概要

キャラクターと雑談を楽しめるエンターテインメント向けWebチャットbot。
匿名ユーザーが特定キャラクターのペルソナを持つAIと自由に会話できる。

## 技術スタック

| レイヤー | 技術 |
|--------|------|
| フレームワーク | Next.js (App Router) |
| バックエンドAPI | Hono |
| ORM | Prisma.js |
| データベース | MongoDB |
| AIフレームワーク | Mastra（LLM呼び出し管理） |
| AIモデル | Claude (Anthropic) |
| スタイリング | Tailwind CSS |
| 言語 | TypeScript |
| デプロイ | Google Cloud Cloud Run |
| コンテナ | Docker |

## 機能要件

### コア機能（MVP）
- ユーザーがテキストを入力してキャラクターAIと対話できる（これのみが必須）
- AIはキャラクターのペルソナ（口調・性格・設定）に沿って返答する
- 会話はストリーミングで表示する（UX向上のため）
- 会話履歴はセッション内のみ保持し、ページリロードでリセットされる

### 認証
- 不要（匿名利用）

### キャラクター設定
- システムプロンプトでキャラクターのペルソナを定義する
- キャラクター名・性格・口調・禁止事項をプロンプトに含める

## 非機能要件

### パフォーマンス・スケール
- 想定同時接続ユーザー数：5〜10人（小規模）
- Cloud Run の最小インスタンス数：1（コールドスタート許容）
- Cloud Run の最大インスタンス数：3程度で十分

### UI・デザイン
- デザインテーマ：ポップ（明るい色使い、丸みのあるUI、遊び心のあるフォント）
- レスポンシブデザイン対応（スマートフォン・タブレット・PC）
- Tailwind CSS を使用

### セキュリティ
- APIキーはサーバーサイドのみで管理、クライアントに露出させない
- 会話履歴はサーバーやDBに永続化しない（セッションのみ）

## ディレクトリ構成（想定）

```
ai-chat/
├── app/
│   ├── page.tsx              # チャットUI（メインページ）
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # Hono or Next.js Route Handler でチャットAPI
├── lib/
│   ├── mastra.ts             # Mastraクライアント設定
│   ├── character.ts          # キャラクタープロンプト定義
│   └── prisma.ts             # Prismaクライアント（将来の拡張用）
├── components/
│   ├── ChatWindow.tsx        # メッセージ表示エリア
│   ├── MessageBubble.tsx     # 吹き出しコンポーネント
│   └── ChatInput.tsx         # 入力フォーム
├── prisma/
│   └── schema.prisma         # MongoDB スキーマ定義
├── .env.local                # ANTHROPIC_API_KEY など
└── CLAUDE.md
```

## APIエンドポイント

### POST /api/chat

**リクエスト**
```json
{
  "message": "こんにちは！",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**レスポンス**
- `Content-Type: text/event-stream`（ストリーミング）
- Server-Sent Events 形式で返答テキストをチャンク送信

## Mastra 設定方針

- シンプルなLLM呼び出し管理のみに使用（AgentやWorkflowは使わない）
- キャラクターのシステムプロンプトと会話履歴をMastraに渡してClaudeを呼び出す
- ストリーミングレスポンスを利用する

```ts
// lib/mastra.ts の例
import { Mastra } from '@mastra/core';

export const mastra = new Mastra({
  model: 'claude-sonnet-4-6', // 最新Claudeモデル
});
```

## 環境変数

```
ANTHROPIC_API_KEY=your_api_key_here
DATABASE_URL=mongodb+srv://...
```

## キャラクター定義（例）

```ts
// lib/character.ts
export const CHARACTER_SYSTEM_PROMPT = `
あなたは「〇〇」というキャラクターです。
- 性格：明るく、フレンドリーで少しおちゃめ
- 口調：敬語は使わず、友達口調で話す
- 禁止事項：暴力的・差別的な発言はしない
`;
```

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run lint     # ESLint実行
npx prisma generate  # Prismaクライアント生成
npx prisma db push   # スキーマをMongoDBに反映
```

## デプロイ構成（Google Cloud Cloud Run）

```
GitHub → Cloud Build → Artifact Registry → Cloud Run
```

- Dockerfile でアプリをコンテナ化
- Cloud Run はリクエストベースの自動スケーリング（5〜10人想定のため最小構成でOK）
- 環境変数（`ANTHROPIC_API_KEY` など）は Cloud Run のシークレット or 環境変数設定で管理
- リージョン：asia-northeast1（東京）推奨

### Dockerfile（例）

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> Next.js の `output: 'standalone'` を `next.config.ts` に設定すること

## コーディング規約

- **すべてのコードはTypeScriptで記述する**（`.ts` / `.tsx`）
- `any` 型の使用は禁止。型が不明な場合は `unknown` を使い適切に絞り込む
- APIのリクエスト・レスポンスには型定義を必ず付ける
- `strict: true` を `tsconfig.json` に設定する

## 将来の拡張候補（スコープ外）

- 複数キャラクターの切り替え機能
- ユーザー認証と会話履歴の永続化
- RAGによる独自知識ベースの参照
- キャラクター画像・アバター表示
