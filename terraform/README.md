# AWS Infrustructure Provision with Terraform

This infrustructure provisioning is for the deployment of the Tares Game. Frontend and the backend components are created separately. 

A general overview of components and interactions are shown below
```mermaid
flowchart TB
    Internet(["Internet"])
    Admin["Admin IP"]
    GH["GitHub Actions"]

    subgraph AWS["AWS account (eu-north-1)"]
        S3F[("S3: frontend")]
        S3B[("S3: DB backups")]
        ECR[("ECR: user and WSS images")]
        SSM["SSM"]
        IAM["IAM role and instance profile"]

        subgraph VPC["Custom VPC 10.0.0.0/16"]
            IGW["Internet gateway"]
            RT["Route table 0.0.0.0/0 to IGW"]

            subgraph PUB["Public subnet 10.0.1.0/24"]
                SG["Security group<br/>22 from admin IP<br/>80, 443 from anywhere"]
                EC2["EC2 Ubuntu 24.04<br/>Docker Compose: nginx, user-service,<br/>wss-service, user-db, game-db, redis"]
                EIP["Elastic IP"]
            end
        end
    end

    Internet -->|HTTP and HTTPS| IGW
    IGW --> RT --> SG --> EC2
    EIP --- EC2
    Admin -->|SSH| SG
    GH -->|deploy commands| SSM --> EC2
    GH -->|push images| ECR
    EC2 -->|pull images| ECR
    EC2 -->|daily pg_dump| S3B
    IAM -.->|attached to| EC2
    Internet -->|static site| S3F
```


## Provision

```sh
cp infra/terraform.tfvars.example infra/terraform.tfvars
# Set admin_cidr, public_key_path, and a unique frontend_bucket_name.
aws configure
terraform -chdir=infra init
terraform -chdir=infra apply
```

Terraform uses the normal AWS credential chain (`AWS_PROFILE` or environment
credentials). It does not accept AWS credentials as Terraform variables.

## GitHub values

Set `API_BASE_URL` as a repository variable so reusable CI can build the
frontend. Set the remaining values in the `production` environment:

- Variables: `REGION`, `FRONTEND_BUCKET`, `INSTANCE_ID`, `FRONTEND_URL`,
  `API_BASE_URL`, and `GHCR_USERNAME`
- Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GHCR_READ_TOKEN`,
  `USER_DB_USER`, `USER_DB_PASSWORD`, `USER_DB_NAME`, `GAME_DB_USER`,
  `GAME_DB_PASSWORD`, `GAME_DB_NAME`, and `AUTH_SECRET`

For the current domainless setup, use the Terraform outputs:

```text
API_BASE_URL = http://<api_ip>/api/v1
FRONTEND_URL = <frontend_url>
```

The deployment is HTTP-only until a domain and TLS termination are added.






api_ip = "51.20.207.249"
frontend_bucket = "tares-frontend-prod-12345"
frontend_url = "http://tares-frontend-prod-12345.s3-website.eu-north-1.amazonaws.com"
instance_id = "i-0803a5edf174c3d6f"