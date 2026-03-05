output "api_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
