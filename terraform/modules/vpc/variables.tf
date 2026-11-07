variable "cidr_range" {
  type        = string
  description = "CIDR Range of VPC IPs"
}

variable "region" {
  type        = string
  description = "AWS region for VPC"
}
variable "name" {
  type        = string
  description = "VPC associated name"
}