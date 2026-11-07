variable "vpc_id" {
  type = string
}

variable "public_subnet_id" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "name" {
  type = string
}

variable "admin_cidr" {
  type = string
}

variable "public_key_path" {
  type = string
}

variable "frontend_bucket_name" {
  type = string
}


variable "iam_instance_profile_name" {
  type = string
}

variable "bootstrap_environment" {
  type = string
}
