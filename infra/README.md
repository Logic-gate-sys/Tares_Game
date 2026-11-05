# Tares deployment

Terraform only creates the EC2 host, Elastic IP, S3 frontend bucket, and supporting
AWS resources. GitHub Actions builds and pushes the backend images to GHCR, uploads
the frontend, and starts the production Compose stack on the host.

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
