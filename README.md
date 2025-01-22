# Organization portal

Backend for the organization portal application, based on the mu.semte.ch microservices stack.

## How to

### Boot up the system in DEV environment

    cd /path/to/mu-project
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

You can shut down using `docker-compose stop` and remove everything using `docker-compose rm`.


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
