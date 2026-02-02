# Personal News Hub

個人用ニュースアグリゲーションサイト on AWS

## 概要

ニュース、天気、ゲーム情報、英語学習を一箇所で確認できる個人向けダッシュボードです。

## 機能

- 📰 **ニュース** - 複数RSSフィードから最新ニュースを取得・表示
- 🌤️ **天気** - Open-Meteo APIで天気予報を表示
- 🎮 **Steam** - セール・新作・人気ゲーム情報
- 📚 **英語学習** - Word of the Day & クイズ機能

## アーキテクチャ

```
[ユーザー] → [CloudFront] → [S3] 静的サイト
                  ↓
            [API Gateway] → [Lambda] → 外部API
```

| リソース | 用途 |
|----------|------|
| S3 | 静的サイトホスティング |
| CloudFront | CDN・HTTPS |
| Lambda | APIアグリゲーション |
| API Gateway | エンドポイント |

## ディレクトリ構成

```
├── terraform/          # インフラ定義
├── lambda/             # バックエンド (Python)
│   └── api_aggregator/
├── frontend/           # フロントエンド (HTML/CSS/JS)
├── iam/                # IAMポリシー参考
├── .github/workflows/  # CI/CD
└── agents.md           # 詳細仕様書
```

## 技術スタック

- **インフラ**: Terraform, AWS (S3, CloudFront, Lambda, API Gateway)
- **バックエンド**: Python 3.12
- **フロントエンド**: Vanilla JS, CSS
- **CI/CD**: GitHub Actions

## セットアップ

### 前提条件

- AWSアカウント
- Terraform 1.6+
- Steam API Key
- Wordnik API Key

### GitHub Secrets

| Secret | 説明 |
|--------|------|
| `AWS_ACCESS_KEY_ID` | AWSアクセスキー |
| `AWS_SECRET_ACCESS_KEY` | AWSシークレットキー |
| `TF_BACKEND_BUCKET` | tfstate用S3バケット |
| `TF_BACKEND_DYNAMO_TABLE` | tfstateロック用DynamoDB |
| `STEAM_API_KEY` | Steam Web API Key |
| `WORDNIK_API_KEY` | Wordnik API Key |

### デプロイ

1. GitHub Secretsを設定
2. `main`ブランチにpushすると自動デプロイ

## コスト

月額 ¥0〜50（個人利用・無料枠内想定）

## ドキュメント

詳細は [agents.md](./agents.md) を参照

## ライセンス

[LICENSE.txt](./LICENSE.txt) を参照
