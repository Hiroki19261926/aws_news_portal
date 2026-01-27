# プロジェクト名
variable "project_name" {
  type    = string
  default = "news-hub"
}

# 環境名
variable "environment" {
  type    = string
  default = "prod"
}

# AWSリージョン
variable "aws_region" {
  type    = string
  default = "ap-northeast-1"
}
