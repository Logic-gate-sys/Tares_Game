variable "region" {
  type    = string
  default = "us-east-1"
}

variable "admin_cidr" {
  type        = string
  description = "Your public IP in CIDR form, e.g. 203.0.113.10/32. The only address allowed to SSH."
}

variable "public_key_path" {
  type        = string
  default     = "~/.ssh/tares.pub"
  description = "Public key for SSH access to the instance"
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

variable "api_domain" {
  type        = string
  description = "API hostname, e.g. api.example.com. Create the A record in your DNS provider."
}

variable "repo_url" {
  type        = string
  description = "Git URL of the repo. Must be public for the clone in user-data; for a private repo, clone manually."
}

variable "repo_branch" {
  type    = string
  default = "main"
}