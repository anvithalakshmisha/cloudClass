packer {
  required_plugins {
    amazon = {
      version = ">= 1.1.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-08c40ec9ead489470"
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "access_key" {
  type    = string
  default = ""
}

variable "secret_key" {
  type    = string
  default = ""
}

#replace with default vpc subnet id
variable "subnet_id" {
  type    = string
  default = "subnet-01e767276646afd6d"
}

# add root ami user
variable "ami_users" {
  type    = list(string)
  default = ["800415706217"]
}

variable "zip_file" {
  type    = string
  default = ""
}

# https://www.packer.io/plugins/builders/amazon/ebs
source "amazon-ebs" "my-ami" {
  region = "${var.aws_region}"
  # replace this with the pull request hash ID
  ami_name        = "csye6225_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "AMI for CSYE 6225"
  ami_regions = [
    "us-east-1",
  ]

  instance_type = "t2.micro"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"
  ami_users     = "${var.ami_users}"
  access_key = "${var.access_key}"
  secret_key = "${var.secret_key}"

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1"
    volume_size           = 50
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.my-ami"]

  provisioner "file" {
    source = "${var.zip_file}"
    // source      = "/Users/anvithalakshmisha/workspace/CSYE-6225/webapp.zip"
    destination = "/home/ubuntu/webapp.zip"
  }

  provisioner "shell" {
    script = "./shell/node.sh"
    // inline = [
    //   "sudo apt-get update",
    //   "sudo apt-get upgrade -y",
    //   "sudo apt-get -y install curl",
    //   "curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh",
    //   "sudo bash /tmp/nodesource_setup.sh",
    //   "sudo apt install nodejs",
    //   "sudo apt-get install unzip",
    //   "unzip /home/ubuntu/webapp.zip",
    //   "cd ./webapp/",
    //   "npm i",

    //   "sleep 10",

    //   "sudo mv /home/ubuntu/webapp/node.service /etc/systemd/system/node.service",

    //   "sudo systemctl enable node.service",

    //   "sudo systemctl start node.service",

    //   "sudo apt-get -y install mysql-server",
    //   "sudo systemctl stop mysql.service",
    //   "sudo systemctl start mysql.service",
    //   "sudo systemctl enable mysql.service",
    //   "sudo systemctl status mysql.service",
    //   "sudo apt-get clean",
    // ]
  }
  // provisioner "shell" {
  //   script = "./shell/mysql.sh"
  // }
  provisioner "shell" {
    script = "./shell/cloudwatch.sh"
  }
  post-processors {
    post-processor "manifest" {
      output     = "manifest.json"
      strip_path = true
    }
  }
}
