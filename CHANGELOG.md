# Changelog
## 1.29.0
### Backend
  - Upgraded `leidinggevenden-consumer` (OP-3533, OP-3511)

### Deploy notes
```
drc down;
```
Update `docker-compose.override.yml` to:
```
  leidinggevenden-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://loket.lokaalbestuur.vlaanderen.be" # or another endpoint
      DCR_LANDING_ZONE_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
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
      DCR_LANDING_ZONE_DATABASE: "database"
      DCR_REMAPPING_DATABASE: "database"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
```
drc up -d
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
