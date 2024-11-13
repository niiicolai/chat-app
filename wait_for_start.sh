#!/bin/sh

MYSQL_HOST="mysql"
MYSQL_PORT="3306"

MONGO_HOST="mongodb"
MONGO_PORT="27017"

NEO4J_HOST="neo4j"
NEO4J_PORT="7474"

if [ -z "$MYSQL_USER" ]; then
    echo "MYSQL_USER is not set. Exiting..."
    exit 1
fi

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    echo "MYSQL_ROOT_PASSWORD is not set. Exiting..."
    exit 1
fi

until mysqladmin ping -h "$MYSQL_HOST" -P "$MYSQL_PORT" --user="$MYSQL_USER" --password="$MYSQL_ROOT_PASSWORD" --silent; do
     echo "Waiting for MySQL to be ready..."
     sleep 2
done

echo "MySQL is ready!"

until mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    echo "Waiting for MongoDB to be ready..."
    sleep 2
done

echo "MongoDB is ready!"

until curl -s http://$NEO4J_HOST:$NEO4J_PORT/ | grep -q "neo4j"; do
    echo "Waiting for Neo4j to be ready..."
    sleep 2
done

echo "Neo4j is ready!"

if [ "$1" = "--db-overwrite" ]; then
    echo "Dropping and recreating the database"
    npm run db:override
fi

echo "Starting the application"

npm start