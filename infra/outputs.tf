output "instance_id" {
  value = aws_instance.app.id
}

output "api_ip" {
  description = "Public Elastic IP for the API and gateway"
  value       = aws_eip.app.public_ip
}


output "ssh_command" {
  sensitive = true
  value     = "ssh -i ${var.private_key_path} ubuntu@${aws_eip.app.public_ip}"
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.id
}

output "frontend_url" {
  description = "Frontend URL (HTTP only, since S3 website hosting has no TLS)"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

# api_ip = "16.171.221.169"
# frontend_bucket = "tares-frontend-prod-12345"
# frontend_url = "http://tares-frontend-prod-12345.s3-website.eu-north-1.amazonaws.com"
# instance_id = "i-0854fb7a18bca4ac3"
# ssh_command = <sensitive>