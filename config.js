export const CRON_PATTERN = process.env.CRON_PATTERN || '0 0 0 * * *'; // every day at midnight

export const ORGANIZATION_STATUS = {
    ACTIVE: "http://lblod.data.gift/concepts/63cc561de9188d64ba5840a42ae8f0d6",
    INACTIVE: "http://lblod.data.gift/concepts/d02c4e12bf88d2fdf5123b07f29c9311"
}

export const WEGWIJSAPI = "https://api.wegwijs.vlaanderen.be/v1/search/organisations";
export const WEGWIJSAPIFIELDS = "changeTime,name,shortName,ovoNumber,kboNumber,labels,contacts,organisationClassifications,locations.parents"

