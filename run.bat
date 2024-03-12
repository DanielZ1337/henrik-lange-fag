@echo off

REM Change directory to the client directory
cd client

REM Run "npm run build"
call npm run build

REM Change directory to the server directory
cd ../server

REM Check if the .env file exists
if exist .env (
    REM Push the database schema to the database
    call npm run db:push

    REM Run "npm run start"
    call npm run start
) else (
    REM Display an error message
    echo The .env file does not exist. Please create a .env file and add the required environment variables.
)
