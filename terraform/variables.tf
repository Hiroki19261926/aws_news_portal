# =============================================================================
# 変数定義
# =============================================================================

# -----------------------------------------------------------------------------
# プロジェクト基本設定
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "プロジェクト名（リソース命名に使用）"
  type        = string
  default     = "news-hub"
}

variable "environment" {
  description = "環境名（prod, dev等）"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

# -----------------------------------------------------------------------------
# APIキー（GitHub Secrets経由で設定）
# -----------------------------------------------------------------------------

variable "steam_api_key" {
  description = "Steam Web APIキー"
  type        = string
  sensitive   = true
  default     = ""
}

variable "wordnik_api_key" {
  description = "Wordnik APIキー"
  type        = string
  sensitive   = true
  default     = ""
}
