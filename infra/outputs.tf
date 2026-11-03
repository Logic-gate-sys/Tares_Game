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