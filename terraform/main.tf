# S3バックエンド設定（bucket, dynamodb_tableは-backend-configで指定）
terraform {
  backend "s3" {
    key     = "news-hub/terraform.tfstate"
    region  = "ap-northeast-1"
    encrypt = true
  }
}

# AWSプロバイダー設定
provider "aws" {
  region = var.aws_region
}
