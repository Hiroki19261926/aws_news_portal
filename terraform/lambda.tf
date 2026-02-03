# =============================================================================
# Lambda関数
# =============================================================================

# -----------------------------------------------------------------------------
# Lambda用ソースコードZIPファイル
# -----------------------------------------------------------------------------
data "archive_file" "api_package" {
  type        = "zip"
  output_path = "${path.module}/api_package.zip"
  source_dir  = "${path.module}/../lambda/api_aggregator"
  excludes    = ["__pycache__", "*.pyc"]
}

# -----------------------------------------------------------------------------
# Lambda関数
# -----------------------------------------------------------------------------
resource "aws_lambda_function" "api" {
  function_name = "${var.project_name}-${var.environment}-api"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.12"
  memory_size   = 256
  timeout       = 30

  filename         = data.archive_file.api_package.output_path
  source_code_hash = data.archive_file.api_package.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT     = var.environment
      STEAM_API_KEY   = var.steam_api_key
      WORDNIK_API_KEY = var.wordnik_api_key
    }
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Logsロググループ
# Lambda関数のログ保存用（保持期間: 14日）
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 14
}
