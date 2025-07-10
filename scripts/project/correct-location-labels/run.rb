#!/usr/bin/env ruby
require 'date'
require 'rdf/turtle'
require 'fileutils'

$stdout.sync = true
ENV['LOG_SPARQL_ALL']='false'
ENV['MU_SPARQL_ENDPOINT']='http://triplestore:8890/sparql'
ENV['MU_SPARQL_TIMEOUT']='180'
require 'mu/auth-sudo'

def ensure_dir(path)
 unless Dir.exist?(path)
   FileUtils.mkdir_p(path)
 end
end

def sparql_escape_uri(value)
  '<' + value.to_s.gsub(/[\\"<>]/) { |s| '\\' + s } + '>'
end

def sparql_escape_string(str)
  '"""' + str.gsub(/[\\"]/) { |s| '\\' + s } + '"""'
end

def get_locations()
  query = <<~EOF
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

SELECT DISTINCT ?location ?label
WHERE {
  GRAPH <http://mu.semte.ch/graphs/public> {
    ?location a prov:Location ;
              rdfs:label ?label ;
              ext:werkingsgebiedNiveau """Samengesteld werkingsgebied""" .
  }
}
EOF
  Mu::AuthSudo.query(query)
end

def sort_literal(literal)
  literal
    .humanize
    .split(", ")
    .sort
    .join(", ")
end

# Create output directory
timestamp=`date +%Y%0m%0d%0H%0M%0S`.strip.to_i
output_dir = "/app/config/migrations/local/2025/#{timestamp}-correct-labels-aggregate-locations/"
ensure_dir(output_dir)


# Generate SPARQL migration to remove existing labels
path = File.join(output_dir, "#{timestamp}-remove-labels-aggregate-locations.sparql")
File.open(path, 'w') do |file|
  file.write <<EOF
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

DELETE {
  GRAPH <http://mu.semte.ch/graphs/public> {
    ?location rdfs:label ?label
  }
} WHERE {
  GRAPH <http://mu.semte.ch/graphs/public> {
    ?location a prov:Location ;
              rdfs:label ?label ;
              ext:werkingsgebiedNiveau """Samengesteld werkingsgebied""" .
  }
}
EOF
end


# Generate TTL migration to insert alphabetically sorted labels
timestamp += 1
filename = "#{timestamp}-insert-labels-aggregate-locations"

path = File.join(output_dir, "#{filename}.graph")
File.open(path, 'w') do |file|
  file.write <<EOF
http://mu.semte.ch/graphs/public
EOF
end

path = File.join(output_dir, "#{filename}.ttl")
File.open(path, 'w') do |file|
  file.write <<EOF
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
EOF
end

locations = get_locations()
locations.each do |location|
  File.open(path, 'a') do |file|
    file.write <<EOF
    #{sparql_escape_uri(location[:location])} rdfs:label "#{(sort_literal(location[:label]))}" .
EOF
  end
end
