# main.tf - Vault 2.0 Free Tier Architecture (UK Region)

provider "aws" {
  region = "eu-west-2" 
}

# 1. Auto-Generate SSH Key
resource "tls_private_key" "vault_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = "vault-free-tier-key"
  public_key = tls_private_key.vault_key.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.vault_key.private_key_pem
  filename        = "${path.module}/vault-free-tier-key.pem"
}

# 2. Free Tier Security Group (Firewall)
resource "aws_security_group" "vault_sg" {
  name        = "vault_free_tier_sg"
  description = "Allow inbound traffic for Vault 2.0"

  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "React Frontend"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Node.js Backend"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. Get the latest Ubuntu OS Image
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] 
}

# 4. Provision the Free Tier Server
resource "aws_instance" "vault_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro" 
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.vault_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y ca-certificates curl
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
              chmod a+r /etc/apt/keyrings/docker.asc
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name = "Vault-2-Production"
  }
}

# 5. Output the IP address
output "server_public_ip" {
  value       = aws_instance.vault_server.public_ip
}