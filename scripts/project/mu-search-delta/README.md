#### Scripts mu-search-delta
* make the script executable: `chmod a+x scripts/project/mu-search-delta/build.sh`
* add your delta messages in json format in `config/search-migrations`, e.g:
  ```js
    // config/search-migrations/2023/001-delete-bedinaeren.json
    {
      "deletes": [
        {
          "subject": {
            "type": "uri",
            "value": "http://data.lblod.info/id/mandatarissen/807a3e07c95fe40962d64695069af946"
          },
          "predicate": {
            "type": "uri",
            "value": "http://data.vlaanderen.be/ns/mandaat#isBestuurlijkeAliasVan"
          },
          "object": {
            "type": "uri",
            "value": "http://data.lblod.info/id/personen/620523C451BFC225E4ECFA97"
          }
        },
        {
          "subject": {
            "type": "uri",
            "value": "http://data.lblod.info/id/mandatarissen/40ed3cb19f9fa33e47b39016780dce1d"
          },
          "predicate": {
            "type": "uri",
            "value": "http://data.vlaanderen.be/ns/mandaat#isBestuurlijkeAliasVan"
          },
          "object": {
            "type": "uri",
            "value": "http://data.lblod.info/id/personen/620523C451BFC225E4ECFA97"
          }
        }
      ],
      "inserts": []
    }
  ```
* make sure virtuoso, mu-auth, elasticsearch & mu search are running
* run `mu script project-scripts mu-search-delta`
