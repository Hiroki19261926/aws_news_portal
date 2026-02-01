# =============================================================================
# Terraformとプロバイダーのバージョン制約
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    # AWSプロバイダー
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    # S3バケット名の一意性確保用
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
    # Lambdaダミーコード用
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
}
