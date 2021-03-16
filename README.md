# Contact Hub

Backend for the Contact Hub application based on the  mu.semte.ch microservices stack.

## How to

### Boot up the system in DEV environment

    cd /path/to/mu-project
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

You can shut down using `docker-compose stop` and remove everything using `docker-compose rm`.


## Change default username/password

By default, username/password is equal to root/root. To change it:

`docker run --rm --entrypoint htpasswd registry:2.7.0 -bn root root > ./config/proxy/nginx.htpasswd`