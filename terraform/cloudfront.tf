# =============================================================================
# CloudFrontディストリビューション
# =============================================================================

# -----------------------------------------------------------------------------
# Origin Access Control（S3へのアクセス制御）
# -----------------------------------------------------------------------------
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project_name}-${var.environment}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# -----------------------------------------------------------------------------
# CloudFrontディストリビューション
# -----------------------------------------------------------------------------
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "${var.project_name}-${var.environment}"

  # ---------------------------------------------------------------------------
  # S3オリジン（静的ファイル用）
  # ---------------------------------------------------------------------------
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # ---------------------------------------------------------------------------
  # API Gatewayオリジン
  # ---------------------------------------------------------------------------
  origin {
    domain_name = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
    origin_id   = "api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # ---------------------------------------------------------------------------
  # デフォルトキャッシュ設定（静的ファイル用）
  # TTL: 1日
  # ---------------------------------------------------------------------------
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400  # 1日
    max_ttl     = 604800 # 7日
  }

  # ---------------------------------------------------------------------------
  # APIパス用キャッシュ設定
  # TTL: 20分（ニュース更新頻度に合わせる）
  # ---------------------------------------------------------------------------
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "api-gateway"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 1200 # 20分
    max_ttl     = 3600 # 1時間
  }

  # ---------------------------------------------------------------------------
  # 配信制限なし
  # ---------------------------------------------------------------------------
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # ---------------------------------------------------------------------------
  # SSL証明書（CloudFrontデフォルト証明書を使用）
  # ---------------------------------------------------------------------------
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # ---------------------------------------------------------------------------
  # カスタムエラーレスポンス（SPA用）
  # 404エラー時にindex.htmlを返す
  # ---------------------------------------------------------------------------
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
}
