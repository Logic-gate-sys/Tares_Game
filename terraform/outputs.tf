output "instance_id" {
  value = module.instances.instance_id
}

output "api_ip" {
  description = "Public Elastic IP for the API and gateway"
  value       = module.instances.api_ip
}


output "ssh_command" {
  sensitive = true
  value     = "ssh -i ${var.private_key_path} ubuntu@${module.instances.api_ip}"
}

output "frontend_bucket" {
  value = module.instances.frontend_bucket
}

output "frontend_url" {
  description = "Frontend URL (HTTP only, since S3 website hosting has no TLS)"
  value       = module.instances.frontend_url
}

# api_ip = "13.48.154.77"
# frontend_bucket = "tares-frontend-prod-12345"
# frontend_url = "http://tares-frontend-prod-12345.s3-website.eu-north-1.amazonaws.com"
# http://tares-frontend-prod-12345.s3-website.eu-north-1.amazonaws.com/
# instance_id = "i-0f3a0ed23ba224bd9"
# ssh_command = <sensitive>