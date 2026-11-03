variable "region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Name used in AWS resource names."
  default     = "tares"
}

variable "environment" {
  type        = string
  description = "Deployment environment, such as staging or production."
  default     = "production"
}

variable "admin_cidr" {
  type        = string
  description = "Your public IP in CIDR form, e.g. 203.0.113.10/32. The only address allowed to SSH."

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0))
    error_message = "admin_cidr must be a valid CIDR, such as 203.0.113.10/32."
  }
}

variable "public_key_path" {
  type        = string
  default     = "~/.ssh/tares.pub"
  description = "Public key for SSH access"
}

variable "private_key_path" {
  type        = string
  default     = "~/.ssh/tares"
  description = "Private key path, used only in the ssh_command output"
}

variable "instance_type" {
  type        = string
  default     = "t3.small"
  description = "t3.small (2 GB) is the practical minimum for this stack. t3.micro (1 GB) is free tier but will likely run out of memory."
}

variable "frontend_bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name for the frontend"
}

variable "repo_url" {
  type        = string
  description = "Git URL of the repo. Must be public for the clone in user-data."
  default     = ""
}

variable "repo_branch" {
  type    = string
  default = "main"
}

variable "bootstrap_environment" {
  type        = map(string)
  description = "Non-secret environment values written to the instance .env file. Pass with TF_VAR_bootstrap_environment."
  default     = {}
}