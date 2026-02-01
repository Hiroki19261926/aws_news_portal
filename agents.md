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

#### RSSフィードURL一覧

| カテゴリ | ソース | RSSフィードURL |
|----------|--------|----------------|
| トップ | Yahoo!ニュース | https://news.yahoo.co.jp/rss/topics/top-picks.xml |
| テック | ITmedia NEWS | https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml |
| テック | Publickey | https://www.publickey1.jp/atom.xml |
| テック | CNET Japan | https://feeds.japan.cnet.com/rss/cnet/all.rdf |
| ガジェット | GIGAZINE | https://gigazine.net/news/rss_2.0/ |
| ガジェット | Impress Watch | https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf |
| ゲームニュース | 4Gamer | https://www.4gamer.net/rss/news.xml |
| ゲームニュース | ファミ通 | https://www.famitsu.com/feed/ |
| インディー/PC | AUTOMATON | https://automaton-media.com/feed/ |
| インディー/PC | Game Spark | https://www.gamespark.jp/feed/rss |
| アニメ・マンガ | アニメイトタイムズ | https://www.animatetimes.com/rss/news.xml |
| アニメ・マンガ | コミックナタリー | https://natalie.mu/comic/feed/news |
| 映画・音楽 | ナタリー | https://natalie.mu/rss/all |
| 映画・音楽 | 映画.com | https://eiga.com/feed/ |

※ 必要に応じてソースを追加・変更可能

### 3.2 天気予報（Open-Meteo API）

- **API**: https://open-meteo.com/
- **料金**: 完全無料（商用利用可、APIキー不要）
- **制限**: なし（ただし常識的な使用量）
- **取得情報**:
  - 現在の天気
  - 7日間の予報
  - 気温、降水確率、天気コード

```
エンドポイント例:
https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=Asia/Tokyo
```

### 3.3 Steam Web API

- **API**: https://partner.steam-api.com/
- **料金**: 無料（APIキー必要）
- **取得情報**:

| エンドポイント | 用途 |
|----------------|------|
| ISteamApps/GetAppList | 全アプリリスト |
| ISteamUserStats/GetNumberOfCurrentPlayers | 同時接続数（人気判定用） |
| store.steampowered.com/api/featuredcategories | セール・新作・人気 |

**注意**: Steam Store APIは非公式だが広く使われている。レート制限に注意。

### 3.4 追加ゲーム情報（RAWG API）

- **API**: https://rawg.io/apidocs
- **料金**: 無料（20,000リクエスト/月）
- **用途**: ゲームのメタデータ、評価、スクリーンショット取得

### 3.5 英語学習（English Tips）

ビジネス英語学習機能。単語リストは自前で保持し、詳細情報はAPIから都度取得する。

#### 使用API

| API | 用途 | 料金 | 制限 |
|-----|------|------|------|
| **Wordnik API** | 単語の定義・例文・関連語 | 無料 | 25,000リクエスト/日 |
| **Free Dictionary API** | 単語の定義・発音記号 | 完全無料 | 制限なし |
| **Datamuse API** | 類義語・関連語検索 | 完全無料 | 制限なし |

#### ビジネス単語リスト（自前データ）

ビジネス頻出単語500〜1000語をJSONで保持。カテゴリ分け：

| カテゴリ | 例 |
|----------|-----|
| 会議・議論 | agenda, minutes, adjourn, consensus |
| メール・連絡 | regarding, attachment, inquiry, notify |
| 交渉・契約 | negotiate, terms, agreement, proposal |
| プロジェクト | milestone, deadline, deliverable, scope |
| 評価・報告 | assess, evaluate, feedback, summary |
| 一般ビジネス | delegate, prioritize, implement, strategy |

#### 機能

| 機能 | 説明 |
|------|------|
| Word of the Day | ビジネス単語リストからランダム選択→APIで詳細取得→表示 |
| Quick Quiz | 4択クイズ（単語→意味を当てる形式） |

#### 処理フロー

```
Word of the Day:
1. ビジネス単語リスト（JSON）からランダムに1語選択
2. Free Dictionary API / Wordnik APIに投げて詳細取得
3. 定義・例文・類義語を表示

Quick Quiz:
1. ビジネス単語リストからランダムに1語選択（正解）
2. 同リストから別の3語を選択（不正解選択肢用）
3. 各単語の日本語訳をリストから取得
4. 4択として表示、回答後に正解・解説表示
```

#### データ構造（business_words.json）

```json
{
  "words": [
    {
      "word": "delegate",
      "category": "一般ビジネス",
      "meaning_ja": "委任する、権限を与える",
      "difficulty": "intermediate"
    },
    {
      "word": "negotiate",
      "category": "交渉・契約",
      "meaning_ja": "交渉する",
      "difficulty": "basic"
    }
  ]
}
```

---

## 4. 機能仕様

### 4.1 メイン画面構成

```
┌─────────────────────────────────────────────────────────────────┐
│ [ロゴ] Personal News Hub          [検索バー🔍]    [設定⚙️]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              天気ウィジェット（現在地 or 設定地域）         │   │
│  │   🌤️ 東京  15°C  │  明日 18°C  │  明後日 12°C ☔         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ── トップニュース ──────────────────────────────────────────   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │     │ │     │ │     │ │     │ │     │  ← カルーセル →      │
│  │ 記事1│ │ 記事2│ │ 記事3│ │ 記事4│ │ 記事5│                      │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                      │
│                                                                 │
│  ── カテゴリ別タブ ─────────────────────────────────────────   │
│  [トップ][テック][ガジェット][ゲーム][インディー][アニメ][映画]  │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   記事      │ │   記事      │ │   記事      │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  ── Steamセール / 新作 / 人気 ───────────────────────────────   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                              │
│  │SALE │ │SALE │ │ NEW │ │ HOT │  ← カルーセル →              │
│  │-50% │ │-30% │ │     │ │     │                              │
│  └─────┘ └─────┘ └─────┘ └─────┘                              │
│                                                                 │
│  ── 📚 Today's English ─────────────────────────────────────   │
│  ┌──────────────────────┐ ┌──────────────────────┐            │
│  │ 🔤 Word of the Day   │ │ 🎯 Quick Quiz        │            │
│  │                      │ │                      │            │
│  │ "delegate"           │ │ "negotiate"の意味は？ │            │
│  │ 委任する、権限を与える │ │ ○ 無視する          │            │
│  │                      │ │ ○ 交渉する          │            │
│  │ 例文: You should...  │ │ ○ 記録する          │            │
│  │                      │ │ ○ 延期する          │            │
│  │ [次の単語]           │ │ [Check Answer]      │            │
│  └──────────────────────┘ └──────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 機能一覧

| 機能 | 説明 | 実装方法 |
|------|------|----------|
| ニュース表示 | カテゴリ別にニュースをカルーセル/リスト表示 | RSSフィード → Lambda → フロント |
| 天気表示 | 現在の天気と週間予報 | Open-Meteo API → Lambda → フロント |
| Steamセール | セール中のゲームを表示 | Steam API → Lambda → フロント |
| Steam新作 | 新作ゲームを表示 | Steam API → Lambda → フロント |
| Steam人気 | 同時接続数ベースの人気ゲーム | Steam API → Lambda → フロント |
| Word of the Day | ビジネス英単語と定義・例文を表示 | 単語リスト + 外部API → Lambda → フロント |
| Quick Quiz | 英単語4択クイズ | 単語リスト → Lambda → フロント |
| 検索 | キーワードでニュースを検索 | GNews API（100件/日）またはRSS全文検索 |
| 興味分野設定 | 表示カテゴリのカスタマイズ | localStorage保存 |
| 地域設定 | 天気表示地域の変更 | localStorage保存 |

### 4.3 レスポンシブ対応

| デバイス | 画面幅 | レイアウト |
|----------|--------|------------|
| スマホ | 〜767px | 1カラム、カルーセル小 |
| iPad | 768px〜1023px | 2カラム、カルーセル中 |
| PC | 1024px〜 | 3カラム、カルーセル大 |

---

## 5. 技術仕様

### 5.1 フロントエンド

- **ホスティング**: S3 + CloudFront
- **フレームワーク**: Vanilla JS（軽量化のため）または軽量フレームワーク
- **スタイリング**: CSS（Tailwind CDN検討）
- **カルーセル**: Swiper.js（軽量、レスポンシブ対応）
- **状態管理**: localStorage（ユーザー設定保存）

### 5.2 バックエンド（Lambda）

- **ランタイム**: Python 3.12
- **メモリ**: 256MB（十分なはず）
- **タイムアウト**: 30秒
- **処理内容**:
  - 複数RSSフィードの並列取得・パース
  - 外部API呼び出し
  - レスポンスの統一フォーマット変換
  - エラーハンドリング

### 5.3 キャッシュ戦略

| 対象 | キャッシュ場所 | TTL |
|------|----------------|-----|
| 静的ファイル（HTML/CSS/JS） | CloudFront | 1日 |
| ニュースAPI | CloudFront | 20分 |
| 天気API | CloudFront | 30分 |
| Steam API | CloudFront | 1時間 |

※ CloudFrontのCache-Controlヘッダーで制御

### 5.4 API エンドポイント設計

| エンドポイント | メソッド | 説明 |
|----------------|----------|------|
| `/api/news` | GET | ニュース取得（?category=xxx） |
| `/api/news/search` | GET | ニュース検索（?q=xxx） |
| `/api/weather` | GET | 天気取得（?lat=xxx&lon=xxx） |
| `/api/steam/sales` | GET | Steamセール情報 |
| `/api/steam/new` | GET | Steam新作 |
| `/api/steam/popular` | GET | Steam人気 |
| `/api/english/word` | GET | 今日の単語（ランダム取得） |
| `/api/english/quiz` | GET | クイズ問題生成（4択） |

---

## 6. ディレクトリ構成

```
/
├── terraform/
│   ├── main.tf              # プロバイダー設定、バックエンド設定
│   ├── variables.tf         # 変数定義
│   ├── outputs.tf           # 出力値定義
│   ├── versions.tf          # Terraformバージョン制約
│   ├── s3.tf                # S3バケット（静的サイト）
│   ├── cloudfront.tf        # CloudFrontディストリビューション
│   ├── lambda.tf            # Lambda関数定義
│   ├── api_gateway.tf       # API Gateway設定
│   └── iam.tf               # IAMロール・ポリシー
│
├── lambda/
│   └── api_aggregator/
│       ├── index.py         # メインハンドラー
│       ├── news.py          # ニュース取得ロジック
│       ├── weather.py       # 天気取得ロジック
│       ├── steam.py         # Steam API連携
│       ├── english.py       # 英語学習機能ロジック
│       └── requirements.txt # 依存ライブラリ
│
├── frontend/
│   ├── index.html           # メインページ
│   ├── css/
│   │   └── style.css        # スタイルシート
│   ├── js/
│   │   ├── app.js           # メインアプリケーションロジック
│   │   ├── api.js           # API呼び出し
│   │   ├── carousel.js      # カルーセル制御
│   │   ├── settings.js      # 設定管理（localStorage）
│   │   ├── weather.js       # 天気ウィジェット
│   │   └── english.js       # 英語学習ウィジェット
│   └── assets/
│       └── images/          # 画像ファイル
│
├── data/
│   └── english/
│       └── business_words.json  # ビジネス英単語リスト（500〜1000語）
│
├── iam/
│   └── github-actions-policy.json  # GitHub Actions用IAMポリシー参考
│
├── .github/
│   └── workflows/
│       └── terraform.yml    # CI/CDパイプライン
│
├── .gitignore               # Git除外設定
│
└── agents.md                # この仕様書
```

---

## 7. Terraform設計方針

### 7.1 Backend設定 (main.tf)

```hcl
terraform {
  backend "s3" {
    bucket         = "＜S3バケット名：後で指定＞"
    key            = "news-hub/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
```

### 7.2 変数定義 (variables.tf)

| 変数名 | 型 | 説明 | デフォルト値 |
|--------|-----|------|--------------|
| `aws_region` | string | AWSリージョン | `ap-northeast-1` |
| `domain_name` | string | カスタムドメイン（オプション） | `null` |
| `steam_api_key` | string | Steam Web APIキー | （必須・Secret経由） |
| `wordnik_api_key` | string | Wordnik APIキー | （必須・Secret経由） |

### 7.3 出力定義 (outputs.tf)

| 出力名 | 説明 |
|--------|------|
| `cloudfront_domain` | CloudFrontドメイン（サイトURL） |
| `s3_bucket_name` | フロントエンド用S3バケット名 |
| `api_endpoint` | API Gatewayエンドポイント |

---

## 8. GitHub Actions設計方針

### 8.1 ワークフロー (.github/workflows/terraform.yml)

**Minecraftリポジトリと認証方式を統一**（IAMユーザーのアクセスキー方式）

ジョブを細分化し、以下の構成とする：

| ジョブ | 役割 | 実行条件 |
|--------|------|----------|
| `checkout-and-setup` | コードチェックアウト・共通セットアップ | 常に実行 |
| `terraform-validate` | Terraform検証（fmt, init, validate） | 常に実行 |
| `terraform-plan` | Terraform Plan実行 | PR時・push時 |
| `terraform-apply` | Terraform Apply実行 | mainへのpush時のみ |

```yaml
name: Terraform CI/CD

on:
  push:
    branches:
      - main
    paths:
      - 'terraform/**'
      - 'lambda/**'
  pull_request:
    branches:
      - main
    paths:
      - 'terraform/**'
      - 'lambda/**'

# -----------------------------------------------------------------------------
# 環境変数（Minecraftリポジトリと形式を統一）
# -----------------------------------------------------------------------------
env:
  TF_VERSION: "1.6.0"
  AWS_REGION: "ap-northeast-1"

jobs:
  # ===========================================================================
  # Job 1: チェックアウトと共通セットアップ
  # ===========================================================================
  checkout-and-setup:
    name: Checkout & Setup
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache-key.outputs.key }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate cache key
        id: cache-key
        run: echo "key=${{ github.sha }}" >> $GITHUB_OUTPUT

      - name: Cache repository
        uses: actions/cache/save@v4
        with:
          path: .
          key: repo-${{ github.sha }}

  # ===========================================================================
  # Job 2: AWS認証確認
  # ===========================================================================
  aws-auth:
    name: AWS Authentication
    runs-on: ubuntu-latest
    needs: checkout-and-setup
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Verify AWS credentials
        run: |
          aws sts get-caller-identity
          echo "✅ AWS認証成功"

  # ===========================================================================
  # Job 3: Terraform検証（Format, Init, Validate）
  # ===========================================================================
  terraform-validate:
    name: Terraform Validate
    runs-on: ubuntu-latest
    needs: [checkout-and-setup, aws-auth]
    defaults:
      run:
        working-directory: terraform
    steps:
      - name: Restore repository cache
        uses: actions/cache/restore@v4
        with:
          path: .
          key: repo-${{ github.sha }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Format Check
        run: |
          terraform fmt -check -recursive
          echo "✅ フォーマットチェック完了"

      - name: Terraform Init
        run: |
          terraform init \
            -backend-config="bucket=${{ secrets.TF_BACKEND_BUCKET }}" \
            -backend-config="dynamodb_table=${{ secrets.TF_BACKEND_DYNAMO_TABLE }}"
          echo "✅ Terraform初期化完了"

      - name: Terraform Validate
        run: |
          terraform validate
          echo "✅ 構文検証完了"

  # ===========================================================================
  # Job 4: Lambda依存関係インストール
  # ===========================================================================
  lambda-dependencies:
    name: Lambda Dependencies
    runs-on: ubuntu-latest
    needs: checkout-and-setup
    steps:
      - name: Restore repository cache
        uses: actions/cache/restore@v4
        with:
          path: .
          key: repo-${{ github.sha }}

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Lambda Dependencies
        run: |
          pip install -r lambda/api_aggregator/requirements.txt -t lambda/api_aggregator/
          echo "✅ Lambda依存関係インストール完了"

      - name: Cache Lambda with dependencies
        uses: actions/cache/save@v4
        with:
          path: lambda/
          key: lambda-${{ github.sha }}

  # ===========================================================================
  # Job 5: Terraform Plan
  # ===========================================================================
  terraform-plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    needs: [terraform-validate, lambda-dependencies]
    if: github.event_name == 'pull_request' || github.event_name == 'push'
    defaults:
      run:
        working-directory: terraform
    steps:
      - name: Restore repository cache
        uses: actions/cache/restore@v4
        with:
          path: .
          key: repo-${{ github.sha }}

      - name: Restore Lambda cache
        uses: actions/cache/restore@v4
        with:
          path: lambda/
          key: lambda-${{ github.sha }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Init
        run: |
          terraform init \
            -backend-config="bucket=${{ secrets.TF_BACKEND_BUCKET }}" \
            -backend-config="dynamodb_table=${{ secrets.TF_BACKEND_DYNAMO_TABLE }}"

      - name: Terraform Plan
        env:
          TF_VAR_steam_api_key: ${{ secrets.STEAM_API_KEY }}
          TF_VAR_wordnik_api_key: ${{ secrets.WORDNIK_API_KEY }}
        run: |
          terraform plan -no-color
          echo "✅ Terraform Plan完了"

  # ===========================================================================
  # Job 6: Terraform Apply（mainブランチへのpush時のみ）
  # ===========================================================================
  terraform-apply:
    name: Terraform Apply
    runs-on: ubuntu-latest
    needs: terraform-plan
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    defaults:
      run:
        working-directory: terraform
    steps:
      - name: Restore repository cache
        uses: actions/cache/restore@v4
        with:
          path: .
          key: repo-${{ github.sha }}

      - name: Restore Lambda cache
        uses: actions/cache/restore@v4
        with:
          path: lambda/
          key: lambda-${{ github.sha }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Init
        run: |
          terraform init \
            -backend-config="bucket=${{ secrets.TF_BACKEND_BUCKET }}" \
            -backend-config="dynamodb_table=${{ secrets.TF_BACKEND_DYNAMO_TABLE }}"

      - name: Terraform Apply
        env:
          TF_VAR_steam_api_key: ${{ secrets.STEAM_API_KEY }}
          TF_VAR_wordnik_api_key: ${{ secrets.WORDNIK_API_KEY }}
        run: |
          terraform apply -auto-approve
          echo "✅ Terraform Apply完了"
```

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

### 8.3 ジョブ分割のメリット

| 観点 | 説明 |
|------|------|
| デバッグ容易性 | どのステップで失敗したか一目でわかる |
| 再実行効率 | 失敗したジョブのみ再実行可能 |
| 並列実行 | aws-authとlambda-dependenciesが並列で実行される |
| 視認性 | GitHub Actions UIでジョブごとに状態が表示される |

### 8.4 必要なGitHub Secrets

| Secret名 | 説明 | 取得方法 |
|----------|------|----------|
| `AWS_ACCESS_KEY_ID` | AWSアクセスキーID | IAMユーザー作成時 |
| `AWS_SECRET_ACCESS_KEY` | AWSシークレットアクセスキー | IAMユーザー作成時 |
| `TF_BACKEND_BUCKET` | tfstate保存用S3バケット名 | 手動作成後に設定 |
| `TF_BACKEND_DYNAMO_TABLE` | tfstateロック用DynamoDBテーブル名 | 手動作成後に設定 |
| `STEAM_API_KEY` | Steam Web APIキー | https://steamcommunity.com/dev/apikey |
| `WORDNIK_API_KEY` | Wordnik APIキー | https://developer.wordnik.com/ |
| `S3_BUCKET_NAME` | フロントエンド用S3バケット名 | Terraform apply後に設定 |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFrontディストリビューションID | Terraform apply後に設定 |

---

## 9. 前提条件（手動で事前準備が必要なもの）

### 9.1 AWS側の準備

1. **S3バケット** (tfstate保存用)
   - バケット名: `＜任意の一意な名前＞`
   - リージョン: ap-northeast-1
   - バージョニング: 有効推奨
   - パブリックアクセス: 全てブロック

2. **DynamoDBテーブル** (tfstateロック用)
   - テーブル名: `terraform-locks`
   - パーティションキー: `LockID` (String)
   - 課金モード: オンデマンド

3. **IAMユーザー** (GitHub Actions用)
   - ユーザー名: `github-actions-news-hub`
   - 必要なポリシー: S3, CloudFront, Lambda, API Gateway, IAM等への権限

### 9.2 外部サービスの準備

1. **Steam Web API Key取得**
   - https://steamcommunity.com/dev/apikey からAPIキーを取得
   - Steamアカウントが必要

2. **Wordnik API Key取得**
   - https://developer.wordnik.com/ でアカウント作成
   - APIキーを取得（無料プランで25,000リクエスト/日）

---

## 10. コスト見積もり

| リソース | 単価 | 月間見積もり |
|----------|------|--------------|
| S3 | ストレージ: ¥3/GB, リクエスト: 微量 | ¥10以下 |
| CloudFront | 無料枠: 1TB/月 | ¥0（無料枠内想定） |
| Lambda | 無料枠: 100万リクエスト/月 | ¥0（無料枠内想定） |
| API Gateway | 無料枠: 100万リクエスト/月（12ヶ月） | ¥0〜数十円 |
| データ転送 | 微量 | ¥0〜10 |
| **合計** | | **¥0〜50/月** |

※ 個人利用であれば、ほぼ無料枠内に収まる見込み

---

## 11. 実装上の注意点

### 11.1 RSSフィードのパース

```python
import feedparser
from concurrent.futures import ThreadPoolExecutor

def fetch_all_feeds(feed_urls):
    """複数のRSSフィードを並列取得"""
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(feedparser.parse, feed_urls))
    return results
```

### 11.2 CORS設定

API GatewayでCORSを有効化する必要あり。

```hcl
# api_gateway.tf
resource "aws_apigatewayv2_api" "main" {
  name          = "news-hub-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]  # 本番では適切に制限
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 300
  }
}
```

### 11.3 localStorage設定の構造

```javascript
// 設定データ構造
const userSettings = {
  categories: ["tech", "game", "entertainment"],  // 興味分野
  location: {
    name: "東京",
    lat: 35.6895,
    lon: 139.6917
  },
  theme: "light"  // 将来的な拡張用
};

localStorage.setItem('newsHubSettings', JSON.stringify(userSettings));
```

### 11.4 エラーハンドリング

外部API障害時でもサイトが表示できるよう、各セクションを独立させる。

```javascript
// 各APIは独立して取得、一部失敗しても他は表示
Promise.allSettled([
  fetchNews(),
  fetchWeather(),
  fetchSteamSales()
]).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      renderSection(index, result.value);
    } else {
      renderErrorSection(index);
    }
  });
});
```

---

## 12. 未決定事項・TODO

- [ ] S3バケット名の決定・作成（tfstate用）
- [ ] Steam APIキーの取得
- [ ] Wordnik APIキーの取得
- [ ] GitHub Secretsへの各種情報登録
- [ ] カスタムドメイン使用有無の決定
- [ ] サイトのロゴ・デザインカラーの決定
- [ ] ビジネス英単語リスト（business_words.json）の作成（500〜1000語）
- [ ] 将来的な追加機能の検討
  - [ ] ダークモード対応
  - [ ] PWA化（オフライン対応）
  - [ ] プッシュ通知

---

## 13. 開発ルール（Julesへの指示）

### 13.1 基本方針

- 作業依頼時は一度作業が完了した後、もう一度自身で振り返りを行い品質を担保した上で、プルリクエストまで実施する
- コード内のコメントは厚めにつける
- コード内のコメントやプルリクエスト作成時の文言など、コード本体以外の部分は日本語で作成する
- フロントエンドはシンプルでモダンなデザインを心がける
- レスポンシブ対応は必須。モバイルファーストで実装する
- 外部ライブラリは最小限に抑え、ページ読み込み速度を優先する

### 13.2 ブランチ戦略

- 作業ごとにブランチを作成する（直接mainにコミットしない）
- **ブランチ命名規則**: `jules-＜作業内容＞`
  - 例: `jules-terraform-infrastructure`
  - 例: `jules-lambda-api-aggregator`
  - 例: `jules-frontend-news-carousel`
  - 例: `jules-frontend-english-quiz`
  - 例: `jules-github-actions`
  - 例: `jules-bugfix-cors`
- 作業完了後は `main` ブランチへプルリクエストを作成する

### 13.3 コミットルール

- **1リソース or 1機能の修正ごとにコミット**する（まとめてコミットしない）
- 作業履歴が見返しやすいように、細かくコミットを分ける
- コミットメッセージは**日本語**で記述する
- コミットメッセージには修正内容を明確に記載する
- コミットメッセージのフォーマット例:
  ```
  [追加] S3バケットの定義を作成
  [追加] CloudFrontディストリビューションを設定
  [追加] Lambda関数のベース実装
  [追加] ニュースカルーセルコンポーネントを実装
  [追加] 英語クイズ機能を実装
  [修正] CORSの設定を修正
  [修正] レスポンシブ対応のブレークポイントを調整
  [削除] 不要な変数定義を削除
  [修正] typoの修正
  ```

### 13.4 プルリクエスト（PR）ルール

- PRのタイトル・説明は**日本語**で記述する
- PRの説明には以下を含める:
  - 変更の概要
  - 変更したファイル一覧
  - 動作確認の有無（該当する場合）
  - 関連するセクション番号（例: 「3.1 ニュース（RSSフィード）」に対応）
- レビュー依頼時は変更点がわかりやすいように記載する

### 13.5 言語ルールまとめ

| 対象 | 言語 |
|------|------|
| コミットメッセージ | 日本語 |
| PRタイトル・説明 | 日本語 |
| コード内コメント | 日本語 |
| ファイル名 | 英語（スネークケース推奨） |
| 変数名・関数名 | 英語（スネークケース推奨） |
| Terraformリソース名 | 英語（スネークケース） |
| CSSクラス名 | 英語（ケバブケース推奨） |

### 13.6 フロントエンド実装ルール

- CSSはBEM記法を推奨
- JavaScriptは可能な限りモダンな記法（ES6+）を使用
- 外部ライブラリはCDN経由で読み込み、以下を許可:
  - Swiper.js（カルーセル用）
  - Tailwind CSS（オプション、CDN版）
- 画像は適切に圧縮し、遅延読み込み（loading="lazy"）を使用
- アクセシビリティを意識（alt属性、適切なaria属性）

### 13.7 Lambda実装ルール

- エラーハンドリングを適切に行い、外部API障害時もクラッシュしないようにする
- レスポンスはJSON形式で統一
- 環境変数でAPIキー等を管理（コードにハードコードしない）
- ログ出力は適切に行い、デバッグしやすくする

---

## 14. 残タスク一覧

### 14.1 インフラ・CI/CD関連

| # | タスク | 優先度 | 状態 | 備考 |
|---|--------|--------|------|------|
| 1 | `.gitignore` の追加 | 高 | 🔴 未着手 | Terraform/Python関連の除外設定 |
| 2 | `iam/github-actions-policy.json` の追加 | 中 | 🔴 未着手 | IAMポリシーの参考ファイル |
| 3 | `.github/workflows/terraform.yml` の更新 | 高 | 🔴 未着手 | ジョブ細分化、Minecraftリポジトリと統一 |
| 4 | GitHub Secretsの設定確認・ドキュメント化 | 高 | 🔴 未着手 | 必要なSecretsの一覧と設定手順 |

### 14.2 AWS環境構築（手動作業）

| # | タスク | 優先度 | 状態 | 備考 |
|---|--------|--------|------|------|
| 5 | tfstate用S3バケットの作成 | 高 | 🔴 未着手 | Terraform管理外、手動作成 |
| 6 | tfstateロック用DynamoDBテーブルの作成 | 高 | 🔴 未着手 | Terraform管理外、手動作成 |
| 7 | GitHub Actions用IAMユーザーの作成 | 高 | 🔴 未着手 | ポリシーは `iam/github-actions-policy.json` 参照 |

### 14.3 外部サービス準備

| # | タスク | 優先度 | 状態 | 備考 |
|---|--------|--------|------|------|
| 8 | Steam Web API Keyの取得 | 中 | 🔴 未着手 | https://steamcommunity.com/dev/apikey |
| 9 | Wordnik API Keyの取得 | 中 | 🔴 未着手 | https://developer.wordnik.com/ |

### 14.4 コンテンツ準備

| # | タスク | 優先度 | 状態 | 備考 |
|---|--------|--------|------|------|
| 10 | ビジネス英単語リスト（business_words.json）の作成 | 低 | 🔴 未着手 | 500〜1000語 |

### 14.5 凡例

| 状態 | 意味 |
|------|------|
| 🔴 未着手 | まだ作業を開始していない |
| 🟡 作業中 | 現在作業中 |
| 🟢 完了 | 作業完了・レビュー済み |

---

## 15. Julesへの最初の作業指示

以下の順番で作業を進めてください：

### Phase 1: リポジトリ基盤整備

**作業1: ファイル追加（ブランチ: `jules-repo-setup`）**

1. `iam/github-actions-policy.json` を作成（セクション9.1参照、S3バケット名は `＜TF_BACKEND_BUCKETの値を入れる＞` のままでOK）

2. `.github/workflows/terraform.yml` をセクション8.1の内容で更新（ジョブ細分化版）

3. PRを作成

### Phase 2以降は別途指示