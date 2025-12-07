output "frontend_url" {
  description = "CloudFront distribution URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "api_url" {
  description = "Lambda Function URL for the backend API"
  value       = aws_lambda_function_url.api.function_url
}

output "s3_bucket" {
  description = "S3 bucket name for frontend files"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "chats_table" {
  description = "DynamoDB table name for chats"
  value       = aws_dynamodb_table.chats.name
}

output "messages_table" {
  description = "DynamoDB table name for messages"
  value       = aws_dynamodb_table.messages.name
}

output "memories_table" {
  description = "DynamoDB table name for memories"
  value       = aws_dynamodb_table.memories.name
}

output "model_config_table" {
  description = "DynamoDB table name for model config"
  value       = aws_dynamodb_table.model_config.name
}
