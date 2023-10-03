<a name="readme-top"></a>

<br />
<div align="center">
  <h1 align="center">sync-ovo-numbers-service</h1>
  <p align="center">
    Service that syncs OVO numbers of OP to match with those in Wegwijs.
    <br />
    <a href="https://github.com/lblod/sync-ovo-numbers-service/issues">Report Bug</a>
    ·
    <a href="https://github.com/lblod/sync-ovo-numbers-service/pulls">Open PR</a>
  </p>
</div>


## 📖 Description

This service maintains OP's OVO numbers in sync together with [Wegwijs](https://wegwijs.vlaanderen.be/#/organisations), which is the official source of OVO numbers.

It gets triggered when a KBO is added or updated in OP, as well as on a regular basis via a cron job to ensure our dataset is in sync with theirs.

*Note: Wegwijs currently (03/10/2023) don't have all the KBOs added in their database. For this reason, the behaviour we follow when we can't find a match on a KBO between OP and them is to leave the OVO number of OP untouched if it exists.*

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ⏩ Quick setup

### 🐋 Docker-compose.yml
```yaml
  sync-ovo-numbers:
    image: lblod/sync-ovo-numbers-service
    links:
      - db:database
    labels:
      - "logging=true"
    restart: always
    logging: *default-logging
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🔑 Environment variables

| ENV  | description | default | required |
|---|---|---|---|
| CRON_PATTERN | Cron pattern describing when the healing runs | '0 0 0 * * *' | |

<p align="right">(<a href="#readme-top">back to top</a>)</p>
