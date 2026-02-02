# Personal News Hub on AWS - プロジェクト仕様書

## 1. プロジェクト概要

個人用のニュースアグリゲーションサイトをAWS上に構築する。
ニュース、天気、ゲーム情報を一箇所で確認でき、興味のある分野をカスタマイズできる。

### 目標
- 月額100円以下に収める（理想は無料枠内）
- スマホ・iPad・PCでレスポンシブ対応
- 外部APIは全て無料のものを使用
- 過去データは保持せず、常に最新情報を表示

---

## 2. アーキテクチャ

### 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                         全体アーキテクチャ                        │
└─────────────────────────────────────────────────────────────────┘

[ユーザー] ─── スマホ / iPad / PC
    │
    ↓
[CloudFront] ←── CDN、キャッシュ（TTL: 20分）
    │
    ├──→ [S3] 静的サイト（HTML/CSS/JS）
    │
    └──→ [API Gateway (HTTP API)]
              │
              ↓
         [Lambda: api_aggregator]
              │
              ├──→ RSSフィード取得（ニュース）
              ├──→ Open-Meteo API（天気）
              └──→ Steam Web API（ゲーム情報）

[ユーザー設定]
    └── localStorage（ブラウザ側で興味分野を保存）
```

### AWSリソース一覧

| リソース | 用途 | Terraform管理 |
|----------|------|---------------|
| S3 | 静的サイトホスティング | ✅ |
| CloudFront | CDN・キャッシュ・HTTPS | ✅ |
| Lambda (api_aggregator) | API集約・データ整形 | ✅ |
| API Gateway (HTTP API) | Lambda呼び出し用エンドポイント | ✅ |
| IAM Role/Policy | Lambda実行権限 | ✅ |
| S3 (tfstate用) | Terraform状態管理 | ❌ 手動作成 |
| DynamoDB (tfstate lock用) | 同時実行防止 | ❌ 手動作成 |

---

## 3. 外部API仕様

### 3.1 ニュース（RSSフィード）

RSSフィードは完全無料で商用利用可能。Lambda側でパースして統一フォーマットに変換する。

#### カテゴリ構成

| カテゴリ | 内容 | ソース |
|----------|------|--------|
| トップ | 総合ニュース | Yahoo!ニュース |
| テック | IT・開発 | ITmedia、Publickey、CNET Japan |
| ガジェット | ハードウェア | GIGAZINE、Impress Watch |
| ゲームニュース | ゲーム情報 | 4Gamer、ファミ通 |
| インディー/PC | Steam系、海外ゲーム | AUTOMATON、Game Spark |
| アニメ・マンガ | オタク系コンテンツ | アニメイトタイムズ、コミックナタリー |
| 映画・音楽 | カルチャー | ナタリー、映画.com |

※ RSSフィードURLは `lambda/api_aggregator/news.py` を参照

### 3.2 天気予報（Open-Meteo API）

- **API**: https://open-meteo.com/
- **料金**: 完全無料（商用利用可、APIキー不要）
- **取得情報**: 現在の天気、7日間の予報、気温、降水確率、天気コード

### 3.3 Steam Web API

- **API**: https://partner.steam-api.com/
- **料金**: 無料（APIキー必要）
- **取得情報**: セール・新作・人気ゲーム

### 3.4 英語学習（English Tips）

ビジネス英語学習機能。単語リストは `lambda/api_aggregator/business_words.json` で保持。

| API | 用途 | 料金 |
|-----|------|------|
| Wordnik API | 単語の定義・例文 | 無料（25,000リクエスト/日） |
| Free Dictionary API | 定義・発音記号 | 完全無料 |

---

## 4. 機能仕様

### 4.1 メイン画面構成

```
┌─────────────────────────────────────────────────────────────────┐
│ [ロゴ] Personal News Hub          [検索バー🔍]    [設定⚙️]     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              天気ウィジェット（現在地 or 設定地域）         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ── トップニュース ─────────────────────────────────────────    │
│  [カルーセル: 記事1 | 記事2 | 記事3 | ...]                      │
│                                                                 │
│  ── カテゴリ別タブ ─────────────────────────────────────────   │
│  [トップ][テック][ガジェット][ゲーム][インディー][アニメ][映画]  │
│                                                                 │
│  ── Steamセール / 新作 / 人気 ──────────────────────────────    │
│  [カルーセル: ゲーム情報]                                        │
│                                                                 │
│  ── 📚 Today's English ─────────────────────────────────────   │
│  [Word of the Day] [Quick Quiz]                                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 機能一覧

| 機能 | 説明 |
|------|------|
| ニュース表示 | カテゴリ別にニュースをカルーセル/リスト表示 |
| 天気表示 | 現在の天気と週間予報 |
| Steamセール/新作/人気 | ゲーム情報を表示 |
| Word of the Day | ビジネス英単語と定義・例文を表示 |
| Quick Quiz | 英単語4択クイズ |
| 興味分野設定 | 表示カテゴリのカスタマイズ（localStorage） |
| 地域設定 | 天気表示地域の変更（localStorage） |

### 4.3 レスポンシブ対応

| デバイス | 画面幅 | レイアウト |
|----------|--------|------------|
| スマホ | 〜767px | 1カラム |
| iPad | 768px〜1023px | 2カラム |
| PC | 1024px〜 | 3カラム |

---

## 5. 技術仕様

### 5.1 フロントエンド

- **ホスティング**: S3 + CloudFront
- **フレームワーク**: Vanilla JS
- **カルーセル**: Swiper.js
- **状態管理**: localStorage

### 5.2 バックエンド（Lambda）

- **ランタイム**: Python 3.12
- **メモリ**: 256MB
- **タイムアウト**: 30秒

### 5.3 キャッシュ戦略

| 対象 | TTL |
|------|-----|
| 静的ファイル | 1日 |
| ニュースAPI | 20分 |
| 天気API | 30分 |
| Steam API | 1時間 |

### 5.4 API エンドポイント

| エンドポイント | 説明 |
|----------------|------|
| `/api/news` | ニュース取得 |
| `/api/weather` | 天気取得 |
| `/api/steam/sales` | Steamセール情報 |
| `/api/english/word` | 今日の単語 |
| `/api/english/quiz` | クイズ問題生成 |

---

## 6. ディレクトリ構成

```
/
├── terraform/           # インフラ定義
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── s3.tf
│   ├── cloudfront.tf
│   ├── lambda.tf
│   ├── api_gateway.tf
│   └── iam.tf
│
├── lambda/
│   └── api_aggregator/  # Lambda関数
│       ├── index.py
│       ├── news.py
│       ├── weather.py
│       ├── steam.py
│       ├── english.py
│       ├── business_words.json
│       └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── app.js
│       ├── api.js
│       ├── carousel.js
│       ├── settings.js
│       ├── weather.js
│       ├── english.js
│       └── prefectures.js
│
├── iam/
│   └── github-actions-policy.json
│
├── .github/workflows/
│   └── terraform.yml
│
├── .gitignore
├── README.md
└── agents.md
```

---

## 7. Terraform設計

### 7.1 変数定義

| 変数名 | 型 | 説明 |
|--------|-----|------|
| `aws_region` | string | AWSリージョン（default: ap-northeast-1） |
| `steam_api_key` | string | Steam Web APIキー |
| `wordnik_api_key` | string | Wordnik APIキー |

### 7.2 出力定義

| 出力名 | 説明 |
|--------|------|
| `cloudfront_domain` | CloudFrontドメイン（サイトURL） |
| `s3_bucket_name` | フロントエンド用S3バケット名 |
| `api_endpoint` | API Gatewayエンドポイント |

---

## 8. GitHub Actions設計

### 8.1 ジョブ構成

| ジョブ | 役割 | 実行条件 |
|--------|------|----------|
| `checkout-and-setup` | コードチェックアウト | 常に実行 |
| `aws-auth` | AWS認証確認 | 常に実行 |
| `terraform-validate` | Terraform検証 | 常に実行 |
| `lambda-dependencies` | Lambda依存関係インストール | 常に実行 |
| `terraform-plan` | Plan実行 | PR時・push時 |
| `terraform-apply` | Apply実行 | mainへのpush時のみ |

### 8.2 ジョブ依存関係図

```
checkout-and-setup
       │
       ├───────────────┐
       │               │
       ↓               ↓
   aws-auth    lambda-dependencies
       │               │
       ↓               │
terraform-validate ────┘
       │
       ↓
 terraform-plan
       │
       ↓ (mainへのpush時のみ)
terraform-apply
```

### 8.3 必要なGitHub Secrets

| Secret名 | 説明 |
|----------|------|
| `AWS_ACCESS_KEY_ID` | AWSアクセスキーID |
| `AWS_SECRET_ACCESS_KEY` | AWSシークレットアクセスキー |
| `TF_BACKEND_BUCKET` | tfstate保存用S3バケット名 |
| `TF_BACKEND_DYNAMO_TABLE` | tfstateロック用DynamoDBテーブル名 |
| `STEAM_API_KEY` | Steam Web APIキー |
| `WORDNIK_API_KEY` | Wordnik APIキー |

---

## 9. 前提条件（手動で事前準備が必要なもの）

### 9.1 AWS側の準備

1. **S3バケット** (tfstate保存用)
   - リージョン: ap-northeast-1
   - バージョニング: 有効推奨
   - パブリックアクセス: 全てブロック

2. **DynamoDBテーブル** (tfstateロック用)
   - テーブル名: `terraform-locks`
   - パーティションキー: `LockID` (String)

3. **IAMユーザー** (GitHub Actions用)
   - 必要なポリシー: `iam/github-actions-policy.json` 参照

### 9.2 外部サービスの準備

- **Steam Web API Key**: https://steamcommunity.com/dev/apikey
- **Wordnik API Key**: https://developer.wordnik.com/

---

## 10. コスト見積もり

| リソース | 月間見積もり |
|----------|--------------|
| S3 | ¥10以下 |
| CloudFront | ¥0（無料枠内） |
| Lambda | ¥0（無料枠内） |
| API Gateway | ¥0〜数十円 |
| **合計** | **¥0〜50/月** |

---

## 11. 開発ルール（Julesへの指示）

### 11.1 基本方針

- 作業完了後、振り返りを行い品質を担保した上でPRを作成
- コード内のコメントは厚めにつける
- コメント・PR文言は日本語

### 11.2 ブランチ戦略

- ブランチ命名規則: `jules-＜作業内容＞`
- 作業完了後は `main` へPRを作成

### 11.3 コミットルール

- 1リソース or 1機能ごとにコミット
- コミットメッセージは日本語
- フォーマット: `[追加/修正/削除] 内容`

### 11.4 言語ルール

| 対象 | 言語 |
|------|------|
| コミットメッセージ | 日本語 |
| PRタイトル・説明 | 日本語 |
| コード内コメント | 日本語 |
| 変数名・関数名 | 英語 |

---

## 12. 残タスク一覧

### 12.1 インフラ・CI/CD関連

| # | タスク | 状態 |
|---|--------|------|
| 1 | `.github/workflows/terraform.yml` の更新（ジョブ細分化） | 🔴 未着手 |

### 12.2 AWS環境構築（手動作業）

| # | タスク | 状態 |
|---|--------|------|
| 2 | tfstate用S3バケットの作成 | 🔴 未着手 |
| 3 | tfstateロック用DynamoDBテーブルの作成 | 🔴 未着手 |
| 4 | GitHub Actions用IAMユーザーの作成 | 🔴 未着手 |

### 12.3 外部サービス準備

| # | タスク | 状態 |
|---|--------|------|
| 5 | Steam Web API Keyの取得 | 🔴 未着手 |
| 6 | Wordnik API Keyの取得 | 🔴 未着手 |

### 凡例

| 状態 | 意味 |
|------|------|
| 🔴 未着手 | まだ作業を開始していない |
| 🟡 作業中 | 現在作業中 |
| 🟢 完了 | 作業完了・レビュー済み |
