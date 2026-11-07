terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>6.71.0"
    }
  }
  // required terraform version
  required_version = ">= 1.17"
}


provider "aws" {
  region = var.region
}

// Local values assigning names to expressions, so you can use these multiple times
// without repetition e.g. service_name = "forum"
locals {
  name = "${var.project_name}-${var.environment}"
}

module "vpc" {
  source     = "./modules/vpc"
  cidr_range = var.cidr_range
  name       = var.project_name
  region     = var.region
}

module "iam" {
  source = "./modules/iam"
  name   = local.name
  frontend_bucket_name = var.frontend_bucket_name
}

module "instances" {
  source                    = "./modules/instances"
  instance_type             = var.instance_type
  name                      = local.name
  admin_cidr                = var.admin_cidr
  public_key_path           = var.public_key_path
  vpc_id                    = module.vpc.vpc_id
  public_subnet_id          = module.vpc.public_subnet_id
  frontend_bucket_name      = var.frontend_bucket_name
  iam_instance_profile_name = module.iam.instance_profile_name
  bootstrap_environment     = var.bootstrap_environment
}

data "aws_caller_identity" "current" {}
