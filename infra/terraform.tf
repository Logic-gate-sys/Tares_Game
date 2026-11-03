terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>6.71.0"
    }
  }

  required_version = ">= 1.2"

  # Optional: store state in S3 for team use or safer backups.
  # Requires Terraform >= 1.10 for use_lockfile, and the bucket must exist before `terraform init`.
  # backend "s3" {
  #   bucket       = "tares-terraform-state"
  #   key          = "prod/terraform.tfstate"
  #   region       = "us-east-1"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}