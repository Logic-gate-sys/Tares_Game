resource "aws_key_pair" "admin" {
  key_name   = "${local.name}-admin"
  public_key = file(pathexpand(var.public_key_path))
}

resource "aws_security_group" "app" {
  name        = "${local.name}-app"
  description = "SSH from admin IP; HTTP and HTTPS from anywhere"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  ingress {
    description = "HTTP: certbot challenge and redirect to HTTPS"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-app" }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.admin.key_name
  vpc_security_group_ids = [aws_security_group.app.id]
 
  user_data = templatefile("${path.module}/templates/user-data.sh.tftpl", {
    bootstrap_environment = var.bootstrap_environment
  })


  root_block_device {
    volume_size = 30 # Holds the Postgres data. 30 GB is the free-tier EBS limit.
    volume_type = "gp3"
  }

  metadata_options {
    http_tokens = "required" # IMDSv2
  }

  lifecycle {
    # Changing the AMI or bootstrap script must not replace the server and its database volumes.
    ignore_changes = [ami, user_data]
  }

  tags = { Name = "${local.name}-app" }
}

resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = { Name = "${local.name}-app" }
}

