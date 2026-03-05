terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "database" {
  source = "./modules/database"

  environment  = var.environment
  project_name = var.project_name
}

module "lambda" {
  source = "./modules/lambda"

  environment     = var.environment
  project_name    = var.project_name
  table_names     = module.database.table_names
  table_arns      = module.database.table_arns
  allowed_origins = var.allowed_origins
}

module "api" {
  source = "./modules/api"

  environment        = var.environment
  project_name       = var.project_name
  allowed_origins    = var.allowed_origins
  lambda_invoke_arns = module.lambda.invoke_arns
}
