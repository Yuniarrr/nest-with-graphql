## Simple Nest JS for Signin and Signup

## Guide

1. run docker compose

   ```bash
   docker compose up
   ```

2. install all dependencies

   ```bash
   npm install
   ```

3. run program with npm

   ```bash
   npm run start:dev
   ```

4. run prisma

   ```bash
   npx prisma migrate dev --name crete-table
   ```

5. access localhost:3000/graphql

   - for sign up

     ```bash
     # example
     mutation SignUp($input:SignUpInput!) {
        signup(signUpInput: $input) {
          access_token
          refresh_token
          user{email username}
          message
      }}

     # query variables
     {
       "input": {
         "email": "coba@gmail.com",
         "username": "mny",
         "password": "12333"
       }
     }
     ```

   - for sign in

     ```bash
     # example
     mutation SignIn($input:SignInInput!){
      signin(signInInput: $input) {
        access_token
        refresh_token
        user{email username}
        message
     }}

     # query variables
     {
      "input": {
        "email": "coba@gmail.com",
        "password": "12333"
      }
     }
     ```

6. Check data in database

   - Run

     ```bash
     npx prisma studio
     ```

   - access localhost:5555
