# Changelog
## Unreleased
### Backend
- Completely remove AGB Stekene's data. [OP-3409]
- Remove gemeente and provincie classifications from admin unit graph [OP-3393]

### Deploy Notes
- Migration listed in [this comment](https://github.com/lblod/app-organization-portal/pull/491#issuecomment-2587185027) must run on the DEV environment.
#### Docker Commands
```
drc restart migrations-triggering-indexing && drc logs -ft --tail=200 migrations-triggering-indexing
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
