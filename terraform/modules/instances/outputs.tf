output "instance_id" {
  value = aws_instance.app.id
}

output "api_ip" {
  value = aws_eip.app.public_ip
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.id
}

output "frontend_url" {
  value = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}