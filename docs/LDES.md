# LDES in Organization Portal

OP uses LDES to share information regarding the concepts it controls. Current consumers are:

- Lokaal Mandatenbeheer, who uses the LDES to keep its information regarding Bestuurseenheid, Bestuursorgaan and Mandaat instances up to date

Note: OP also uses delta producers/consumers to share information with applications (e.g. Loket), but that will not be discussed in this section.

## Published streams

This application publishes a single stream:

- **ldes**: all information on the published entities will be sent on this stream. All of their properties known in this app will be published without filtering, however, consumers of this stream are cautioned against using properties that are not defined in the model.

## Types exposed on LDES feed

The following types will be exposed on the LDES stream (see also [the configuration file](../config/ldes-delta-pusher/ldes-types.ts)

- **http://www.w3.org/ns/org#Organization**
- **http://www.w3.org/ns/org#Post**
- **http://www.w3.org/ns/org#Site**
- **http://www.w3.org/ns/adms#Identifier**
- **https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator**
- **http://data.vlaanderen.be/ns/besluit#Bestuursorgaan**
- **http://schema.org/ContactPoint**
- **http://www.w3.org/ns/locn#Address**
- **http://www.w3.org/ns/org#ChangeEvent**
- **http://www.w3.org/ns/activitystreams#Tombstone**

## Expected Peripheral Knowledge

There is a substantial amount of data that is referenced in the entities on the LDES above but that is not expected to change often (or at all) and that isn't the responsibility of the OP system to maintain. Let's call such data Peripheral Knowledge. At the time of this writing, this set is contained to skos:ConceptSchemes like BestuursorgaanClassificatieCode.

Such data will NOT be published on the OP LDES feeds, but can be referenced by instances on our LDES feed. Therefore we expect systems that use the LDES data to have this Peripheral Knowledge loaded themselves.

This presents the question of how this peripheral knowledge reaches these different systems (and OP itself). Because the data will not change often, a set of migrations will suffice for now. In the future, a central system could be created that provides its own LDES feed with this peripheral knowledge. Other systems can then use this feed to update their peripheral knowledge.

## LDES setup

The LDES spec can be found [here](https://semiceu.github.io/LinkedDataEventStreams/).
We will be using the implementation provided by [redpencil.io on their github](https://github.com/redpencilio/fragmentation-producer-service) to publish the LDES. It will be fed using our own service that monitors deltas on our SEAS instance.

We'll use a time-fragmenter with pagination and the following setup for versioning:

    @prefix dct: <http://purl.org/dc/terms/>.
    @prefix ext: <http://mu.semte.ch/vocabularies/ext/>.
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
    @prefix ldes: <https://w3id.org/ldes#>.
    @prefix tree: <https://w3id.org/tree#>.
    @prefix prov: <http://www.w3.org/ns/prov#>.

    <stream> ldes:timestampPath prov:generatedAtTime ;
             ldes:versionOfPath dct:isVersionOf .
             ldes:retentionPolicy ext:retention .

    ext:retention a ldes:DurationAgoPolicy ;
          tree:value "P1Y"^^xsd:duration .

Note here that the LDES spec calls for the use of a specific versioned URI to be created to represent the state of the concept at a certain time. This URI then refers to the true URI of that concept through the predicate defined as the value of `ldes:versionOfPath`, `dct:isVersionOf` in our case. This versioned URI is not to be confused with the versioned entity of a Mandataris. In fact, the versioned Mandataris entity will itself also have a versioned URI for every change that happened to it.

## Links to Entities

When other entities are referenced from an LDES feed instance, the original URI of that entity is used, not the versioned URI.

For instance, if this snippet is part of a `besluit:Bestuursorgaan` instance that refers to a `besluit:Bestuurseenheid`, its `besluit:bestuurt` predicate refers to the true URI of the eenheid, not the eenheid's versioned URI.

    @prefix dct: <http://purl.org/dc/terms/>.
    @prefix ext: <http://mu.semte.ch/vocabularies/ext/>.
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
    @prefix mandaat: <http://data.vlaanderen.be/ns/mandaat#>.

    ext:orgVersioned1 dct:isVersionOf ext:orgTrueUri
     dct:issued "2024-02-14T14:05:00.000Z"^^xsd:dateTime;
     besluit:bestuurt ext:trueEenheidUri.

    ext:eenheidVersioned42 dct:isVersionOf ext:trueEenheidUri.
     dct:issued "2024-02-14T14:05:00.000Z"^^xsd:dateTime;
     skos:prefLabel "Gemeente Middle Zealand" .

## Healing and dct:modified

The LDES stream is healed nightly, this is based on the `dct:modified` value of the instances on the feed. If an instance is found in the database with a different value for its `dct:modified` than the one on the stream, the instance is sent through the ldes-delta-processor as a fake delta message so it is processed again and put on the stream in its latest version.

The `modified service` ensures that instances receive a `dct:modified` value when they are updated by the OP application. If such an update already contains a `dct:modified` value, it is left untouched. However, if no such value is present in the update, a `dct:modified` value is added with the current dateTime.

There is a chance that there are instances that exist on the LDES feed that are no longer in the database. In that case, the healing will create a `http://www.w3.org/ns/activitystreams#Tombstone` in the OP database and put it on the LDES stream to indicate that the instance has now been removed.

## Manually triggering instances healing

As migrations are run on the virtuoso database directly and don't pass through SEAS, they will not create delta messages and therefore will not be picked up by the LDES. The auto-healing will take care of this when it triggers, but sometimes you will have consumers that just can't wait for these changes to propagate during the night.

For this purpose a script exists that allows you to manually trigger the latest version of a concept to be put on the LDES. You can trigger this script by running:

```bash
mu script project-scripts ldes-republish
```

It requires that you put the instances that you want to republish in the data.ttl file included in the script's directory as `<subejcturi> a <subjectclass>.` an example data.ttl is included.
