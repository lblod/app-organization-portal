# Changelog

## 1.36.0 (2025-10-03)
### Dashboard
- Enable ACM/IDM for the dashboard [OP-3674]

#### QA
Configure the environment variables for the QA ACM/IDM environment:

```yml
  frontend-dashboard:
    environment:
      EMBER_ACMIDM_CLIENT_ID: "03382bf4-4886-4fb6-8602-945ad3080a7a"
      EMBER_ACMIDM_BASE_URL: "https://authenticatie-ti.vlaanderen.be/op/v1/auth"
      EMBER_ACMIDM_REDIRECT_URL: "https://dashboard.organisaties.abb.lblod.info/authorization/callback"
      EMBER_ACMIDM_LOGOUT_URL: "https://authenticatie-ti.vlaanderen.be/op/v1/logout"
      EMBER_ACMIDM_SCOPE: "openid vo profile abb_organisatieportaal"

  login-dashboard:
    environment:
      MU_APPLICATION_AUTH_DISCOVERY_URL: "https://authenticatie-ti.vlaanderen.be/op"
      MU_APPLICATION_AUTH_CLIENT_ID: "03382bf4-4886-4fb6-8602-945ad3080a7a"
      MU_APPLICATION_AUTH_REDIRECT_URI: "https://dashboard.organisaties.abb.lblod.info/authorization/callback"
      MU_APPLICATION_AUTH_CLIENT_SECRET: "snip" # see ticket for secret

```

Link the new domain name to QA (and remove from dev)

#### PROD
Configure the environment variables for the PROD ACM/IDM environment once the values are known.

Link the new domain name to PROD + DNS config to the server

#### CLI
```
drc restart migrations
drc restart dispatcher database
drc up -d --remove-orphans
```

### Frontend
- Bump to [v1.34.1](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.34.1) [OP-3638]
- Remove province for addresses in the Brussels area [OP-3638] & [OP-3648]

### Deploy notes
```
drc pull frontend; drc up -d frontend
drc restart migrations-triggering-indexing; drc logs -ft --tail=200 migrations-triggering-indexing
```

## v1.35.1 (2025-09-15)
### Backend
- Produce memberships and their roles in organizations and public producers [OP-3658] & [OP-3661]
### Deploy notes
```
drc restart delta-producer-publication-graph-maintainer
```

## v1.35.0 (2025-08-04)
### Frontend
- Bump to [v1.34.0](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.34.0)
### Backend
- Add a service to manage organisation's their scope of operation [OP-3205]
- datamodel: Allow a location to be within multiple other locations [OP-3205]
- datafix: set scope of operation for worship administrative units [OP-3626]
- Clean addresses linked to both sites and contact points of mandatarissen and addresses that are in the wrong graph (admin unit graph but linked to a contact point in the worship graph) [DL-6701]
- datafix: cleanup of general memberships if specific ones exist [OP-3640]
- datafix: cleanup of duplicate memberships [OP-3634]
- Fix KBO organizations' date formats [OP-3560]


### Deploy notes
```
drc pull scope-of-operation; drc up -d scope-of-operation
drc restart db resource dispatcher
drc pull frontend; drc up -d frontend
drc restart migrations; drc logs -ft --tail=200 migrations
drc up -d kbo-data-sync
```

The labels for new location resources created when setting the scope of operation for worship services are not necessarily alphabetically sorted. To correct this run the `correct-location-labels` project script using [mu-cli](https://github.com/mu-semtech/mu-cli) and restart the migrations service once more to execute the generated local migrations.

```
mu script project-scripts correct-location-labels
drc restart migrations; drc logs -ft --tail=200 migrations
```

## v1.34.0 (2025-07-11)
### Frontend
- Bump to version [v1.33.0](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.33.0)
### Backend
- Add Brussels Hoofdstedelijk Gewest as province and location, update province of addresses in Brussel's area, update resource config to add `skos:note` on organizations [OP-3624]
- Add Brussel as a municipality [OP-3628]
- Revert Brussel as province and municipality and update back province of addresses in Brussel's area [OP-3637]
- Bump delta-notifier service to most recent version [OP-3190]
- Add URI to resource's organization responses
- Fix query for organizations report [OP-3636]
- Bump report-generation-service to most recent version
- Write migration to harmonize date formats of change events [OP-3559]
### Deploy notes
```
drc pull deltanotifier; drc up -d deltanotifier
drc restart migrations-triggering-indexing resource
drc pull frontend; drc up -d frontend
drc pull report-generation; drc up -d report-generation
drc restart migrations; drc logs -ft --tail=200 migrations
```

## v1.33.3 (2025-07-04)
### Backend
- datafix: re-add Havenbedrijf Antwerpen as an AGB [OP-3639]
### Deploy notes
```
drc restart migrations; drc logs -ft --tail=200 migrations
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs
```

## v1.33.2 (2025-06-20)
### Backend
- datafix: correct name for locations whose municipalities kept their URI in the 2025 mergers [OP-3627]
### Deploy notes
```
drc restart migrations-triggering-indexing && drc logs -ft --tail=200
```

## v1.33.1 (2025-06-16)
### Backend
- Added Vlaams Parlement as bestuurseenheid. [DL-6686]
### Deploy Notes
```
drc restart migrations;
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs
```

## v1.33.0 (2025-06-05)
### Frontend
- Bump to version [v1.32.0](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.32.0)
### Backend
- datafix: move memberships involving provinces and municipalities to shared graph [OP-3619]
### Deploy notes
```
drc restart migrations; drc logs -ft --tail=200 migrations
drc exec db-cleanup curl -X POST "http://localhost/cleanup"
drc pull frontend; drc up -d frontend
```

## v1.32.1 (2025-06-02)
### Backend
- Added Kabinet Crevits as bestuurseenheid. [DL-6655]
### Deploy Notes
```
drc restart migrations;
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs
```

## v1.32.0 (2025-05-23)
### Frontend
- Bump to version [v1.31.0](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.31.0)
### Backend
- Fix KBO statuses not being displayed [OP-3584]
- datafix: update NIS2019 end dates and link additional NIS2025 to werkingsgebieden [part of OP-3566]
- datafix: correct date of change event of ckb olen [OP-3594]
- datafix: move memberships from shared to administrative unit graph
- datafix: cleanup werkingsgbieden data [OP-3566]
  + Move werkingsgebieden to public graph
  + Link district werkingsgebieden to Antwerp municipality werkingsgebied
  + Add missing werkingsgebied for Borsbeek district
- Write migration to extract from existing primary sites the province URI [OP-3597]
- datafix: update status kerkfabriek weelde [OP-3598]
- datafix: delete change event and update status protestantse kerk oostende [OP-3604]
- datafix: update change event date islamic assocation [OP-3602]
### Deploy Notes
```
drc pull frontend; drc up -d frontend
drc restart migrations; drc logs -ft --tail=200 migrations
drc restart migrations-triggering-indexing && drc logs -ft --tail=200 migrations-triggering-indexing
drc up -d kbo-data-sync
drc exec kbo-data-sync curl -X POST http://localhost/sync-all-kbo-data

drc restart delta-producer-publication-graph-maintainer
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs # or wait until nightly healing kicks in
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/organizations/healing-jobs # or wait until nightly healing kicks in
drc exec db-cleanup curl -X POST "http://localhost/cleanup"
```

## v1.31.3 (2025-05-08)
### Backend
 - Migrate active organizations linked to inactive CKB to the active one. [DL-6604]
### Deploy notes
```
drc restart migrations-triggering-indexing && drc logs -ft --tail=200 migrations-triggering-indexing
```

## v1.31.2 (2025-04-02)
### Backend
- Extend the public producer to include: [CLBV-980]
  - NIS codes
  - Sites and statuses of representative organs
  - Secondary sites with their contacts and addresses
  - Site descriptions

### Deploy notes
```
drc restart delta-producer-publication-graph-maintainer
```

## v1.31.1 (2025-04-01)
### Backend
- Removal of change events of 8 ckb's + update of their status [OP-3562]
### Deploy Notes
```
drc restart migrations-triggering-indexing; drc logs -ft --tail=200 migrations-triggering-indexing
drc restart migrations; drc logs -ft --tail=200 migrations
```

## v1.31.0 (2025-03-27)
### Frontend
- Bump to version [v1.30.0](https://github.com/lblod/frontend-organization-portal/blob/v1.30.0/CHANGELOG.md#v1300-2025-03-27)
### Backend
- Datafix: move status for municipalities and provinces to the `shared` graph such that it can be read by worship users [OP-3469]
- Bump `triplestore` and `publication-triplestore` to `v1.3.0-rc.1`. [OP-2492] [OP-3547]
- Add missing docker compose keys. [DL-6490]
- Reorganize delta consumers config to harmonize with the ecosystem
- Set up the dashboard app [OP-3103]
- Datafix: correct date of change event of kerkfabriek st petrus [OP-3555]
- Update OCMWv to VVMW [OP-3565] and back. It's technically a nil-operation. But you should run the migrations nevertheless.
### Deploy notes
```
drc restart migrations-triggering-indexing
drc restart migrations; drc logs -ft --tail=200 migrations
drc pull frontend; drc up -d frontend
drc up -d mandatarissen-consumer leidinggevenden-consumer worship-services-main-info-consumer worship-services-private-info-consumer
```
#### For upgrade databases
[This README](https://github.com/Riadabd/upgrade-virtuoso) provides the necessary steps for upgrading the database. **NOTE**: This will involve shutting down the app for small period of time (around 30 minutes).
#### For adding the missing keys
```
drc up -d search elasticsearch
```

#### Dashboard

The dashboard requires some server specific configuration before it can be used.

##### 1. Dashboard domains
To configure the domain name that's used by the dashboard frontend, you can add it to the `VIRTUAL_HOST` and `LETSENCRYPT_HOST` environment variables of the identifier service.
- DEV domain: dashboard.dev.app-organisation-portal.contacthub-dev.s.redhost.be
- QA domain: dashboard.qa.app-organisation-portal.contacthub-dev.s.redhost.be
- PROD domain: dashboard.app-organisation-portal.organisaties.s.redpencil.io

##### 2. Dashboard users
Before we can generate a user we need to add an application salt to the server. Add a `MU_APPLICATION_SALT` environment variable to the `dashboard-login` service in the docker-compose.override.yml file.

Once this is done you can generate a user by running `mu script project-scripts generate-dashboard-login` and following the prompts. A new local migration will be generated which can be run by restarting the migrations service and which will insert the new user into the database.

Store the login credentials as a comment in the docker-compose.override.yml file.

##### 3. (Re)start the needed services
`drc up -d frontend-dashboard dashboard-login identifier; drc restart dispatcher resource db`

## v1.30.5 (2025-03-10)
### Backend
 - Added `http://www.w3.org/ns/prov#Location` to delta stream 'public' [DL-6496]
### Deploy notes
```
drc restart delta-producer-publication-graph-maintainer
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs

```

## v1.30.6 (2025-03-25)
### Backend
- Flushed landingzones [DL-6552]
### Deploy notes
```
drc restart migrations
```

## v1.30.5 (2025-03-10)
### Backend
 - Added `http://www.w3.org/ns/prov#Location` to delta stream 'public' [DL-6496]
### Deploy notes
```
drc restart delta-producer-publication-graph-maintainer
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs

```

## v1.30.4 (2025-03-06)
### Backend
- Add missing codes to public producer [DL-6210] [DL-6449]
#### Deploy commands
```
drc restart migrations delta-producer-publication-graph-maintainer
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs
```

## v1.30.3 (2025-03-04)
### Frontend
- Bump to [v1.29.1](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.29.1)
### Deploy notes
- Bump frontend
#### Deploy commands
```
drc pull frontend; drc up -d frontend
```

## v1.30.2 (2025-02-28)
### Backend
- Datafix: add new timed governing bodies for new legislature for AGBs [OP-3552]
### Deploy notes
- Restart the migration service
- Start a healing job the public producer, or wait for it to kick in overnight
#### Deploy commands
```
drc restart migrations; drc logs -ft --tail=200 migrations
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs
```

## v1.30.1 (2025-02-20)
### Backend
 - Bestuursorgaanclassificatiecode of VGC was in wrong graph, so it wouldn't export. [DL-6428]
### Deploy notes
```
drc restart migrations
```

## v1.30.0 (2025-02-19)
### Frontend
- Bump to version [v1.29.0](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.29.0)
### Backend
- Datafix: delete duplicate identifiers [OP-3157]
- Feature: replace different relations between organisations by memberships [OP-3195 (epic), OP-2606, OP-3156, OP-3198, OP-3199, OP-3258, OP-3259, OP-3260, OP-3265, OP-3293, OP-3305]
- Added `db-cleanup-service` to keep membership data backwards compatible [OP-3369]
- Datafix: delete incorrect change event [OP-3363]
- Feature: re-enable contact data editing [OP-3425]
- Remove gemeente and provincie classifications from admin unit graph [OP-3393]
- Remove several OCMW bcsd faciliteitgemeenten [OP-3535]
- Completely remove AGB Stekene's data. [OP-3409]
- Remove reasoner service, replaced by new consumer logic
### Deploy Notes
- Before pulling the changes
  + Shut down the reasoner and thank it for its good service: `drc down reasoner`
- Re-enable contact date editing:
  + remove `EMBER_ENABLE_EDIT_CONTACT_DATA_FEATURE` flag in `docker-compose.override.yml`
  + Stop and remove the `clb-contact-data-consumer` service
  + Remove the `clb-contact-data-consumer` configuration in `docker-compose.override.yml`
- Rebuild the `search` service before starting the re-indexing
- To enable the membership functionality:
  + Restart migration service
  + Restart services for which the configuration was changed: `resource`,  `dispatcher` and `db`
  + Start the `db-cleanup` service
  + Pull and restart the frontend
  + Perform a re-index using `reset-elastic.sh` script
#### Deploy commands
```
drc down clb-contact-data-consumer
drc up -d search
drc restart migrations; drc logs -ft --tail=200 migrations
drc restart migrations-triggering-indexing && drc logs -ft --tail=200 migrations-triggering-indexing
drc restart resource dispatcher db
drc up -d db-cleanup
drc pull frontend; drc up -d frontend
./scripts/reset-elastic.sh
```

## 1.29.2 (2025-02-17)
### Data fix
 - restore betrokken lokale besturen that have been accidentally flushed [OP-3546]

## 1.29.1 (2025-02-14)
### Backend
 - re-init `worship-services-sensitive-consumer` [OP-3483]
### Deploy notes
:warning: Ensure first loket did a full re-sync again of this delta-stream.
```
drc stop worship-services-main-info-consumer worship-services-private-info-consumer
drc retart migrations
```
Update `docker-compose.override.yml` to remove the config of the consumers and replace it by:
```
  worship-services-main-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_INITIAL_SYNC: "false"
      DCR_DISABLE_DELTA_INGEST: "false"
  worship-services-private-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_INITIAL_SYNC: "false"
      DCR_DISABLE_DELTA_INGEST: "false"
```
Then
```
drc up -d db mandatarissen-consumer leidinggevenden-consumer worship-services-main-info-consumer worship-services-private-info-consumer
# Wait until success of the previous step
```
Then, update `docker-compose.override.yml` to:
```
  worship-services-main-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  worship-services-private-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "database"
      DCR_REMAPPING_DATABASE: "database"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
```
drc up -d
sh scripts/reset-elastic.sh

```

## 1.29.0 (2025-02-07)
### Backend
#### Consumer
- Upgraded `mandatarissen-consumer` [OP-3510]
- Upgraded `leidinggevenden-consumer` [OP-3533], [OP-3511]
- Upgraded `worship-services-sensitive-consumer` [OP-3337]

### Deploy notes
```
drc down;
```
Update `docker-compose.override.yml` to remove the config of the consumers and replace it by:
```
  mandatarissen-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_LANDING_ZONE_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  leidinggevenden-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_LANDING_ZONE_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  worship-services-main-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_INITIAL_SYNC: "false"
      DCR_DISABLE_DELTA_INGEST: "false"
  worship-services-private-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "triplestore" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_INITIAL_SYNC: "false"
      DCR_DISABLE_DELTA_INGEST: "false"
```
Then:
```
drc up -d triplestore migrations
drc up -d db mandatarissen-consumer leidinggevenden-consumer worship-services-main-info-consumer worship-services-private-info-consumer
# Wait until success of the previous step
```
Then, update `docker-compose.override.yml` to:
```
  mandatarissen-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  leidinggevenden-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # choose the correct endpoint
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  worship-services-main-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "db"
      DCR_REMAPPING_DATABASE: "db"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
  worship-services-private-info-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lblod.info" # or another endpoint
      DCR_SYNC_LOGIN_ENDPOINT: "https://loket.lblod.info/sync/worship-services-sensitive/login" # or another endpoint
      DCR_SECRET_KEY: "key-of-the-producer"
      DCR_LANDING_ZONE_DATABASE: "database"
      DCR_REMAPPING_DATABASE: "database"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
```
drc up -d
sh scripts/reset-elastic.sh
```

## 1.28.5 (2025-01-23)
### Frontend
- Bump to [v1.28.3](https://github.com/lblod/frontend-organization-portal/releases/tag/v1.28.3)
### Backend
- Datafix: correct merger change events for worship organisations (OP-3534)
- Avoid municipality filter to include partial matches (OP-3509)
### Deploy notes
- `drc restart migrations-triggering-indexing; drc logs -ft --tail=200 migrations-triggering-indexing`
- `drc pull frontend; drc up -d frontend`
- Perform a full re-index by executing `./scripts/reset-elastic.sh`

## 1.28.4 (2025-01-16)
### Backend
#### Data
- Performance fix on 1.28.3 [DL-6377]
### Deploy commands
```
drc restart migrations
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs # or wait for the healing to kick in
```
## 1.28.3 (2025-01-16)
### Backend
#### Data
- Datafix. Fusiegemeentes had different bestuursfuncties attached to OCMW and Gemeente. [DL-6377]
  However, business-rule-wise, these bestuursfuncties are shared.
### Deploy commands
```
drc restart migrations
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs # or wait for the healing to kick in
```
## 1.28.2 (2025-01-13)
### Backend
 - Added "Opdrachthoudende vereniging met private deelname" in delta public (DL-6368)
### Deploy commands
```
drc restart migrations
drc exec delta-producer-background-jobs-initiator curl -X POST http://localhost/public/healing-jobs # or wait for the healing to kick in
```
## 1.28.1 (2025-01-11)
### Backend
- Import 2025 NIS codes and update werkingsgebieden (OP-3342)
- Add merger change events for merged police zones (OP-3454)
- Delete local involvements for worship services (OP-3501, OP-3512)
- Move link between new municipalities and province to shared graph (OP-3513, OP-3514)

### Deploy notes
- Restart both migration services
#### Docker commands
- `drc restart migrations; drc logs -ft --tail=200 migrations`
- `drc restart migrations-triggering-indexing; drc logs -ft --tail=200 migrations-triggering-indexing`

## 1.28.0 (2025-01-02)
### Backend
- Bump frontend to `v1.28.0`
- Add end date for governing bodies for municipalities and OCMWs and update status (OP-3348)
- Update municipality and province name in organisation's addresses (OP-3410)
- Add merger change events for merged municipalities and OCMWs (OP-3412)
- Updates names for merged municipalities and OCMWs (OP-3456)

### Deploy notes
- Restart both migration services
- Bump frontend
#### Docker commands
- `drc restart migrations; drc logs -ft --tail=200 migrations`
- `drc restart migrations-triggering-indexing; drc logs -ft --tail=200 migrations-triggering-indexing`
- `drc pull frontend; drc up -d frontend`
