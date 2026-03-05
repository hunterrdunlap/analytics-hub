output "table_names" {
  description = "Map of entity name to DynamoDB table name"
  value = {
    for key, table in aws_dynamodb_table.tables : key => table.name
  }
}

output "table_arns" {
  description = "List of all DynamoDB table ARNs"
  value = [
    for table in aws_dynamodb_table.tables : table.arn
  ]
}
