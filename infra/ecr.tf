resource "aws_ecr_repository" "user_service" {
  name = "tares-user-service"
}

resource "aws_ecr_repository" "wss_service" {
  name = "tares-wss-service"
}

resource "aws_ecr_lifecycle_policy" "user" {
  repository = aws_ecr_repository.user_service.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the 3 most recent images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 3
      }
      action = { type = "expire" }
    }]
  })
}