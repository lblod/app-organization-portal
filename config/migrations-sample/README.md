# Motivation

This folder contains migration files that are typically executed on an as-needed, or ad hoc, basis.
In addition, these files can function as templates or provide inspiration for future migrations.

## Warning

- Please keep in mind, when adding these files to the migrations folder, it's important to rename them according to the conventions established by the migration service
- As the data model or the data location may undergo changes over time, it's imporant to have a clear understanding of the implications when using these files.

## Template files

- `pseudonimyze-data.sparql-template` - the file that contains the sparql for pseudonymizing data in the triplestore. It should run every time the db is "refreshed" with a copy from PROD.
- `remove-stale-jobs.sparql-template` - removing `busy` and `scheduled` jobs. 
- `remove-type-in-producer-graph.sparql-template` - the migration to handle the occasional sync issue between OP and Loket. 
