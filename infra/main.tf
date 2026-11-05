provider "aws" {
  region = var.region
  shared_config_files      = ["/home/logic/.aws/config"]
  shared_credentials_files = ["/home/logic/.aws/credentials"]
  profile                  = "base"
}

locals {
  name = "${var.project_name}-${var.environment}"
}

data "aws_vpc" "default" {
  default = true
}
data "aws_caller_identity" "current" {}

# amazon machine image to use for ec2
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  
  owners = ["099720109477"] # Canonical
}
