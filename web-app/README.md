## webapp


### command for building and deploying your application locally
- npm i
### command to run the web application
- npm start

### command to run the api in terminal
- curl -v http://localhost:3000/healthz

GET http://localhost:3000/v1/account/8ec6a070-459c-11ed-8b27-c9541423c17a
Content-Type: application/json
Authorization: Basic alakshmisha@gm.c secret


###

POST http://localhost:3000/v1/account
Content-Type: application/json

{
    "username": "alakshmisha@gmai.co",
    "password": "hey",
    "first_name": "anvitha",
    "last_name": "lakshmisha"
}

###


PUT http://localhost:3000/v1/account/e0d83920-44f0-11ed-bd95-157ae5eb83c5
Content-Type: application/json
Authorization: Basic alakshmisha@gm.c secret


{
    "password": "hey",
    "first_name": "anvitha",
    "last_name": "lakshmisha"
}

 ### ssh into the machine 
 ssh ubuntu@54.144.110.105 -i ~/.ssh/awskey -v

 ### running the application
 - create a pull request
 - merge the code
 - then get the ami id after the code is pushed
 - add this ami id in the parameter list of cloudformation template
 - run the cloud formation template for demo profile
 - take the public ip and run the application

demo