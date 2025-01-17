# Motivation

This folder is designed to contain migration files specific to a specific deployed instance of the app. These files will be ignored by git. The typical use case for this folder includes migrations containing sensitive data or those related to a re-sync of consumers. Migrations that should be applied to all instances of the app should be stored outside of this folder, but within the 'migrations-triggering-indexing' folder.
