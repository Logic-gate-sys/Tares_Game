output "frontend_url" {
  description = "Frontend URL (HTTP only, since S3 website hosting has no TLS)"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.id
}

output "api_ip" {
  description = "Create an A record for api_domain pointing to this address"
  value       = aws_eip.app.public_ip
}

output "api_domain" {
  value = var.api_domain
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/tares ubuntu@${aws_eip.app.public_ip}"
}