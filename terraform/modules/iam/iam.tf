data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Trust policy: only EC2 can assume the server role
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}


# Server role: SSM for remote commands. Images come from GHCR, so no ECR access.
resource "aws_iam_role" "app" {
  name               = "${var.name}-app"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

// this is for github actions to be able to upload built assets to S3
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.name}-app"
  role = aws_iam_role.app.name
}

# CI user: uploads the frontend and sends deploy commands over SSM
data "aws_iam_policy_document" "ci_deploy" {
  # aws s3 sync --delete needs list, put, and delete
  statement {
    sid       = "ListFrontendBucket"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.frontend_bucket_name}"]
  }

  statement {
    sid       = "WriteFrontendObjects"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::${var.frontend_bucket_name}/*"]
  }

  statement {
    sid     = "SendDeployCommand"
    actions = ["ssm:SendCommand"]
    resources = [
      "arn:aws:ec2:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:instance/*",
      "arn:aws:ssm:${data.aws_region.current.region}::document/AWS-RunShellScript",
    ]
  }

  statement {
    sid       = "ReadCommandResult"
    actions   = ["ssm:GetCommandInvocation"]
    resources = ["*"]
  }
}

resource "aws_iam_user" "ci" {
  name = "${var.name}-ci"
}

resource "aws_iam_policy" "ci_deploy" {
  name   = "${var.name}-ci-deploy"
  policy = data.aws_iam_policy_document.ci_deploy.json
}

resource "aws_iam_user_policy_attachment" "ci" {
  user       = aws_iam_user.ci.name
  policy_arn = aws_iam_policy.ci_deploy.arn
}