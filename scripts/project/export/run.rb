#!/usr/bin/env ruby

require 'bundler/inline'
require 'yaml'
require 'securerandom'
require 'date'
require 'rdf/vocab'
require 'tty-prompt'
require 'rdf/turtle'

$stdout.sync = true
ENV['LOG_SPARQL_ALL']='false'
ENV['MU_SPARQL_ENDPOINT']='http://triplestore:8890/sparql'
ENV['MU_SPARQL_TIMEOUT']='180'
require 'mu/auth-sudo'



def sparql_escape_uri(value)
  '<' + value.to_s.gsub(/[\\"<>]/) { |s| '\\' + s } + '>'
end

def sparql_escape_string(str)
  '"""' + str.gsub(/[\\"]/) { |s| '\\' + s } + '"""'
end

def search_classifications
  query = <<~EOF
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
SELECT DISTINCT ?type ?name ?classification WHERE {
    ?org a ?type;
         org:classification ?classification.
    ?classification skos:prefLabel ?name.
    VALUES ?type { besluit:Bestuurseenheid }
} ORDER BY ?name
EOF
  Mu::AuthSudo.query(query)
end

def get_admin_units(classifications)
  query = <<~EOF
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
SELECT DISTINCT ?org ?name WHERE {
    ?org a ?type;
         skos:prefLabel ?name;
         org:classification ?classification.
    VALUES ?type { besluit:Bestuurseenheid }
    VALUES ?classification { #{classifications.map{ |c| sparql_escape_uri(c) }.join(" ")}}
}
EOF
  Mu::AuthSudo.query(query)
end

def export_admin_unit(unit)
  repository = RDF::Repository.new
  query = <<~EOF
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
CONSTRUCT {
?org ?p ?o
}
WHERE {
VALUES ?org { #{sparql_escape_uri(unit)}}
?org ?p ?o.
VALUES ?p {
 rdf:type
 org:classification
 besluit:classificatie
 skos:prefLabel
 besluit:werkingsgebied
 <http://www.w3.org/ns/adms#identifier>
 <http://mu.semte.ch/vocabularies/core/uuid>
 <http://www.w3.org/ns/regorg#orgStatus>
}
}
EOF
  repository << Mu::AuthSudo.query(query)

  query = <<~EOF
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
CONSTRUCT {
?gebied ?p ?o.
}
WHERE {
VALUES ?org { #{sparql_escape_uri(unit)}}
?org  besluit:werkingsgebied ?gebied.
?gebied ?p ?o
}
EOF
  repository << Mu::AuthSudo.query(query)

  query = <<~EOF
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
CONSTRUCT {
?bestuursorgaan ?bp ?bo.
?bestuursorgaanIntijd ?bop ?boo.
}
WHERE {
VALUES ?org { #{sparql_escape_uri(unit)}}
?bestuursorgaan besluit:bestuurt ?org.
?bestuursorgaan ?bp ?bo.
?bestuursorgaanIntijd generiek:isTijdspecialisatieVan ?bestuursorgaan.
?bestuursorgaanIntijd ?bop ?boo.
}

EOF
  repository << Mu::AuthSudo.query(query)
  query = <<~EOF
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
CONSTRUCT {
?mandaat ?p ?o.
?role ?roleP ?roleO.
}
WHERE {
VALUES ?org { #{sparql_escape_uri(unit)}}
?bestuursorgaan besluit:bestuurt ?org.
?bestuursorgaanIntijd generiek:isTijdspecialisatieVan ?bestuursorgaan.
VALUES ?post { org:hasPost <http://data.lblod.info/vocabularies/leidinggevenden/heeftBestuursfunctie>}
?bestuursorgaanIntijd ?post ?mandaat.
?mandaat ?p ?o.
?mandaat org:role ?role.
?role ?roleP ?roleO.
}
EOF
  repository << Mu::AuthSudo.query(query)
  repository
end

def ensure_dir(path)
 unless Dir.exist?(path)
   Dir.mkdir(path)
 end
end

def sanitize_unix_path(path)
  # Regular expression to match characters not allowed in Unix paths
  sanitized_path = path.gsub(/[^a-zA-Z0-9._\-\/]/, '-')
  sanitized_path
end

prompt = TTY::Prompt.new
prompt.say("\n\n")
prompt.say("This script will help you export administrative units and their respective bodies")
options = search_classifications.map do |binding|
  {name: "#{binding[:name]}", value: binding[:classification]}
end

if options.size > 0
  classifications = prompt.multi_select("Please select the matching admin unit classifications", options)
  admin_units = get_admin_units(classifications)
  prompt.say("found #{admin_units.size} admin units")
  output_dir = prompt.ask("Provide the directory the exports should be written to?", default: "/app/exports/")
  ensure_dir(output_dir)
  admin_units.each do |unit|
    repo = export_admin_unit(unit[:org])
    path = File.join(output_dir, "#{sanitize_unix_path(unit[:name].to_s)}.ttl")
    File.open(path, 'w') do |file|
      file.write repo.dump(:ttl)
    end
    prompt.say("Exported #{repo.size} statements to #{path}")
  end
else
  abort("No classifications found?")
end

