# Contact Hub

Backend for the Contact Hub application based on the  mu.semte.ch microservices stack.

## How to

### Boot up the system in DEV environment

    cd /path/to/mu-project
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

You can shut down using `docker-compose stop` and remove everything using `docker-compose rm`.


## Add username/password for Basic Auth

By default, there are two accounts you can use to log-in using basic auth:

- root/root
- contacthub/contacthub

To add new accounts, execute the following command, then add the result to `./config/proxy/nginx.htpasswd`

`docker run --rm --entrypoint htpasswd registry:2.7.0 -bn username password`

