terraform {
  required_version = ">= 1.15"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Create this bucket once before `terraform init` (see bootstrap notes below).
  backend "s3" {
    bucket       = "tares-terraform-state"
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "tares"
      Environment = "prod"
    }
  }
}

locals {
  name = "tares"
}

data "aws_vpc" "default" {
  default = true
}

# Latest Ubuntu 24.04 LTS (amd64) from Canonical's AWS account
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}