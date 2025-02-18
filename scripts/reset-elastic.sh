#!/bin/bash
version=$(docker compose version)

if [ $? -eq 0 ]; then
    DRC_COMMAND="docker compose"
else
    DRC_COMMAND="docker-compose"
fi

echo "warning this will run queries on the triplestore and delete containers, you have 3 seconds to press ctrl+c"
sleep 3
eval "$DRC_COMMAND rm -fs elasticsearch search"
sudo rm -rf data/elasticsearch/
eval "$DRC_COMMAND exec -T triplestore isql-v <<EOF
SPARQL DELETE WHERE {   GRAPH <http://mu.semte.ch/authorization> {     ?s ?p ?o.   } };
exec('checkpoint');
exit;
EOF"
eval "$DRC_COMMAND up -d --remove-orphans"
