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

It gets triggered when a KBO is updated in OP as well as on a regular basis via a cron job to ensure our dataset is in sync with theirs.

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

### 🗒️ Config

// TODO probably no delta config if we go for the endpoint option right ?

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🔑 Environment variables

| ENV  | description | default | required |
|---|---|---|---|
| xxx | xxx | | X |


<p align="right">(<a href="#readme-top">back to top</a>)</p>
