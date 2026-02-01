# =============================================================================
# 出力値定義
# =============================================================================

# -----------------------------------------------------------------------------
# CloudFront関連
# -----------------------------------------------------------------------------
output "cloudfront_domain" {
  description = "CloudFrontのドメイン名（サイトURL）"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFrontディストリビューションID（キャッシュ削除時に使用）"
  value       = aws_cloudfront_distribution.main.id
}

# -----------------------------------------------------------------------------
# S3関連
# -----------------------------------------------------------------------------
output "s3_bucket_name" {
  description = "フロントエンド用S3バケット名"
  value       = aws_s3_bucket.frontend.id
}

output "s3_bucket_arn" {
  description = "フロントエンド用S3バケットARN"
  value       = aws_s3_bucket.frontend.arn
}

# -----------------------------------------------------------------------------
# API Gateway関連
# -----------------------------------------------------------------------------
output "api_endpoint" {
  description = "API Gatewayのエンドポイント"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.main.id
}

# -----------------------------------------------------------------------------
# Lambda関連
# -----------------------------------------------------------------------------
output "lambda_function_name" {
  description = "Lambda関数名"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "Lambda関数ARN"
  value       = aws_lambda_function.api.arn
}

# -----------------------------------------------------------------------------
# 便利な出力（デプロイ時に使用）
# -----------------------------------------------------------------------------
output "site_url" {
  description = "サイトのURL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}
