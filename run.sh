#!/bin/bash

# Change directory to the client directory
cd client || exit

# Run "npm run build"
npm run build

# Change directory to the server directory
cd ../server || exit

# Check if the .env file exists
if [ -f .env ]; then
    # Push the database schema to the database
    npm run db:push

    # Run "npm run start"
    npm run start

else
    # Display an error message
    echo "The .env file does not exist. Please create a .env file and add the required environment variables."
fi
