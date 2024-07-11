# infrastructure
## for demo
### command to run the aws cloud formation template without parameters
- aws cloudformation create-stack --stack-name vpc --profile demo --template-body file://csye6225-infra.yml 
### command to run the aws cloudformation template to create using parameter file
- aws cloudformation create-stack --stack-name vpc --profile demo --template-body file://csye6225-infra.yml --parameters file://csye6225-parameters.json

### command to run the aws cloudformation template in different regions
- aws cloudformation create-stack --stack-name vpc1 --profile demo --template-body file://csye6225-infra.yml --parameters file://csye6225-parameters.json --region us-east-2

### command to delete the resources using cloudformation template
- aws cloudformation delete-stack --stack-name vpc --profile demo

### command to delete the resources using cloudformation template in a different region
- aws cloudformation delete-stack --stack-name vpc --profile demo --region us-east-2

### command to setup profile and configure aws
- aws configure --profile demo



## for development
### command to run the aws cloud formation template without parameters
- aws cloudformation create-stack --stack-name vpc --profile dev --template-body file://csye6225-infra.yml 
### command to run the aws cloudformation template to create using parameter file
- aws cloudformation create-stack --stack-name vpc --profile dev --template-body file://csye6225-infra.yml --parameters file://csye6225-parameters.json

### command to run the aws cloudformation template in different regions
- aws cloudformation create-stack --stack-name vpc1 --profile dev --template-body file://csye6225-infra.yml --parameters file://csye6225-parameters.json --region us-east-2

### command to delete the resources using cloudformation template
- aws cloudformation delete-stack --stack-name vpc --profile dev

### command to delete the resources using cloudformation template in a different region
- aws cloudformation delete-stack --stack-name vpc --profile dev --region us-east-2

### command to setup profile and configure aws
- aws configure --profile dev

