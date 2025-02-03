# Organization portal

Backend for the organization portal application, based on the mu.semte.ch microservices stack.

## How to

### Boot up the system in DEV environment

    cd /path/to/mu-project
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

You can shut down using `docker-compose stop` and remove everything using `docker-compose rm`.

#### Setup consumers
The application depends on external data. You'll have to perform extra steps if you want this data to be available.
These are multiple data sets, we'll try to be exhaustive on how to ingest these. Even though the procedures are similar.

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

### Setting up the delta-producers related services
To make sure the app can share data, producers need to be set up. There is an intial sync, that is potentially very expensive, and must be started manually

#### producers administrative-units

1. make sure the app is up and running, the migrations have run
2. in docker-compose.override.yml, make sure the following configuration is provided:
```
  delta-producer-pub-graph-maintainer-administrative-units:
    environment:
      START_INITIAL_SYNC: 'true'
```
3. `drc up -d delta-producer-pub-graph-maintainer-administrative-units`
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
