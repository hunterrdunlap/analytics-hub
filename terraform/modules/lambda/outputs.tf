output "invoke_arns" {
  description = "Map of entity name to Lambda invoke ARN"
  value = {
    for key, fn in aws_lambda_function.functions : key => fn.invoke_arn
  }
}
