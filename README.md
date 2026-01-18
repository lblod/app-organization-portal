# Organization portal

Backend for the organization portal application, based on the mu.semte.ch microservices stack.

### Boot up the system in DEV environment

    cd /path/to/app-organization-portal
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up

You can shut down using `docker compose stop` and remove everything using `docker compose rm`.

You need to wait until the migrations are ready.

After that, you need to trigger the ES index manually.

You can do it by:
```
# Assumes you are in root of app-organization-portal
/bin/bash scripts/reset-elastic.sh 
```
And follow the steps. It takes a bit, from an install from scratch, about 10 mins. (Mileage may vary)


#### Tricks to make it a bit easier.
If you think typing the full command takes too long every time, run this in your shell:

```
# Assumes you are in root of app-organization-portal
echo "COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml:docker-compose.override.yml" > .env
touch docker-compose.override.yml
```
Now you can just run `docker compose up` and it will take the config files into account.
If you want to go a step further, and still think (like most of us) that `docker compose` is too long to type, you can alias it:
```
echo "alias drc='docker compose'" >> ~/.bashrc
echo "alias drcl='docker compose logs -ft --tail=100'" >> ~/.bashrc
```
Now everywhere `drc up -d` will work as shorthand for `docker compose up -d`.

#### Setup consumers

The application depends on external data. You'll have to perform extra steps if you want this data to be available.
These are multiple data sets, we'll try to be exhaustive on how to ingest these. Even though the procedures are similar.

#### Setup mandatarissen sync
Note: this is assuming you have never ran this before.
```
drc down;
```
Update `docker-compose.override.yml` to:
```
  mandatarissen-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_LANDING_ZONE_DATABASE: "triplestore"
      DCR_REMAPPING_DATABASE: "triplestore"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
Then:
```
drc up -d migrations
drc up -d db mandatarissen-consumer
# Wait until success of the previous step
```
Then, update `docker-compose.override.yml` to:
```
  mandatarissen-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
Finally, put the stack back up and reindex elasticsearch
```
drc up -d
sh scripts/reset-elastic.sh
```

#### Setup leidinggevenden sync (http://data.lblod.info/vocabularies/leidinggevenden/Functionaris)

Note: this is assuming you have never ran this before.
```
drc down;
```
Update `docker-compose.override.yml` to:
```
  leidinggevenden-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_LANDING_ZONE_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
Then:
```
drc up -d migrations
drc up -d db leidinggevenden-consumer
# Wait until success of the previous step
```
Then, update `docker-compose.override.yml` to:
```
  leidinggevenden-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # choose the correct endpoint
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
Finally, put the stack back up and reindex elasticsearch
```
drc up -d
sh scripts/reset-elastic.sh
```

#### Setup worship mandatees sync

Note: this is assuming you have never ran this before.
```
drc down;
```
Update `docker-compose.override.yml` to:
```
  worship-services-main-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lokaalbestuur.vlaanderen.be/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "triplestore"
      DCR_REMAPPING_DATABASE: "triplestore"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  worship-services-private-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lokaalbestuur.vlaanderen.be/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "triplestore"
      DCR_REMAPPING_DATABASE: "triplestore"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
Then:
```
drc up -d migrations
drc up -d db worship-services-main-info-consumer worship-services-private-info-consumer
# Wait until success of the previous step
```
Then, update `docker-compose.override.yml` to:
```
worship-services-main-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lokaalbestuur.vlaanderen.be/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  worship-services-private-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lokaalbestuur.vlaanderen.be/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
Finally, put the stack back up and reindex elasticsearch
```
drc up -d
sh scripts/reset-elastic.sh
```

#### Setup vendors sync
Note: this is assuming you have never ran this before.
```
drc down;
```
Update `docker-compose.override.yml` to:
```
  vendor-management-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://dev.loket.lblod.info/" # or another endpoint
      DCR_DISABLE_INITIAL_SYNC: "true"
      BATCH_SIZE: "500"
      DCR_SECRET_KEY: "<key>>" # fill in key for selected endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://dev.loket.lblod.info/sync/vendor-management/login" # login for selected endpoint
```
Then:
```
drc up -d migrations
drc up -d db vendor-management-consumer
```
Finally, put the stack back up.
```
drc up -d
```

### Setting up the delta-producers related services
To make sure the app can share data, producers need to be set up. There is an intial sync, that is potentially very expensive, and must be started manually

#### producers administrative-units

1. make sure the app is up and running, the migrations have run
2. in docker-compose.override.yml, make sure the following configuration is provided:
```
  delta-producer-publication-graph-maintainer-administrative-units:
    environment:
      START_INITIAL_SYNC: 'true'
```
3. `drc up -d delta-producer-publication-graph-maintainer-administrative-units`
4. You can follow the status of the job, ideally through the dashboard, but this hasn't been setup yet. The following query should also give results:
```
   PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
   PREFIX adms: <http://www.w3.org/ns/adms#>
   PREFIX dct: <http://purl.org/dc/terms/>

    SELECT DISTINCT ?job ?operation ?created ?modified ?status WHERE {
       GRAPH ?g {
         ?job a <http://vocab.deri.ie/cogs#Job>;
              task:operation ?operation;
              adms:status ?status;
              dct:created ?created;
              dct:modified ?modified.
       }
       FILTER( ?operation IN (
         <http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/initialPublicationGraphSyncing/administrative-units>,
         <http://redpencil.data.gift/id/jobs/concept/JobOperation/deltas/healingOperation/administrative-units>
        )
       )
     }
```
