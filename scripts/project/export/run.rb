#!/usr/bin/env ruby

require 'bundler/inline'
require 'yaml'
require 'securerandom'
require 'date'
require 'rdf/vocab'
require 'tty-prompt'
require 'rdf/turtle'
require 'rdf/reasoner'

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
 <http://mu.semte.ch/vocabularies/core/uuid>
 <http://www.w3.org/ns/regorg#orgStatus>
 <http://data.lblod.info/vocabularies/erediensten/betrokkenBestuur>
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
?org   <http://www.w3.org/ns/adms#identifier> ?id.
?id ?p ?o.
?id skos:notation ?localId.
?id <http://www.w3.org/ns/adms#schemaAgency> ?source.
}
WHERE {
VALUES ?org { #{sparql_escape_uri(unit)}}
?org   <http://www.w3.org/ns/adms#identifier> ?id.
?id ?p ?o.
FILTER (?p NOT IN(<http://www.w3.org/2004/02/skos/core#notation>, <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator>))
?id <http://www.w3.org/2004/02/skos/core#notation> ?source.
FILTER(?source != "SharePoint identificator")
?id <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?gestructureerdeIdentificator.
?gestructureerdeIdentificator <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?localId
}
EOF
  repository << Mu::AuthSudo.query(query)
  query = <<~EOF
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
CONSTRUCT {
?org  besluit:werkingsgebied ?gebied.
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
PREFIX mandaat: <https://data.vlaanderen.be/ns/mandaat#>
CONSTRUCT {
?bestuursorgaan ?bp ?bo.
?bestuursorgaanIntijd generiek:isTijdspecialisatieVan ?bestuursorgaan.
?bestuursorgaanIntijd ?bop ?boo.
}
WHERE {
VALUES ?org { #{sparql_escape_uri(unit)}}
?bestuursorgaan besluit:bestuurt ?org.
?bestuursorgaan ?bp ?bo.
values ?tijdspecialisatie {
generiek:isTijdspecialisatieVan
mandaat:isTijdspecialisatieVan
}
?bestuursorgaanIntijd ?tijdspecialisatie ?bestuursorgaan.
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
OPTIONAL {
  ?role ?roleP ?roleO.
  FILTER(!STRSTARTS(STR(?role), "http://data.vlaanderen.be"))
}
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


def enrich_graph(data)
  RDF::Reasoner.apply(:owl,:rdfs)
  graph = RDF::Graph.load("./enrichment.owl")
  graph << clean_up_dates(data)
  graph.entail!(:subClassOf)
  graph.entail!(:equivalentProperty)
  graph
end

DATE_PREDICATES=[
  RDF::URI("http://data.vlaanderen.be/ns/mandaat#bindingStart"),
  RDF::URI("http://data.vlaanderen.be/ns/mandaat#bindingEinde"),
  RDF::URI("https://data.vlaanderen.be/ns/generiek#bindingStart"),
  RDF::URI("https://data.vlaanderen.be/ns/generiek#bindingEinde")
]

def convert_date_to_datetime(date_literal)
  begin
    date = Date.parse(date_literal.to_s)
    datetime = DateTime.new(date.year, date.month, date.day)
    RDF::Literal.new(datetime.strftime("%Y-%m-%dT%T"), datatype: RDF::XSD.dateTime)
  rescue ArgumentError => e
    puts "Invalid date format for #{date_literal}: #{e.message}"
    nil
  end
end

def clean_up_dates(data)
  clean_data = RDF::Graph.new
  data.each_statement do |statement|
    if DATE_PREDICATES.include?(statement.predicate)
      obj = statement.object
      if obj.is_a?(RDF::Literal) && obj.datatype == RDF::XSD.date
        new_object = convert_date_to_datetime(obj)
        if new_object
          clean_data << [statement.subject, statement.predicate, new_object]  # Add the new statement
        end
      elsif obj.is_a?(RDF::Literal) && obj.datatype == RDF::XSD.dateTime
        clean_data << statement
      else
        puts "unexpected value #{obj.inspect}for statement:\n #{statement.inspect}"
      end
    else
      clean_data << statement
    end
  end
  clean_data
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
    repo = enrich_graph(repo)
    file_name = sanitize_unix_path(unit[:name].to_s)
    timestamp=`date +%Y%0m%0d%0H%0M%0S`.strip.to_i
    path = File.join(output_dir, "#{timestamp}-remove-data-#{file_name}-bestuurseenheid.sparql")
    File.open(path, 'w') do |file|
      file.write <<EOF
PREFIX besluit:  <http://data.vlaanderen.be/ns/besluit#>
PREFIX mandaat:  <http://data.vlaanderen.be/ns/mandaat#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
PREFIX org:      <http://www.w3.org/ns/org#>
PREFIX prov:     <http://www.w3.org/ns/prov#>
DELETE {
 GRAPH <http://mu.semte.ch/graphs/public> {
 ?id ?p ?o.
}
} WHERE {
 GRAPH <http://mu.semte.ch/graphs/public> {
<#{unit[:org]}> <http://www.w3.org/ns/adms#identifier> ?id.
 ?id ?p ?o.
}
};
DELETE {
 GRAPH <http://mu.semte.ch/graphs/public> {
 ?gebied ?p ?o.
}
} WHERE {
 GRAPH <http://mu.semte.ch/graphs/public> {
<#{unit[:org]}> besluit:werkingsgebied ?gebied.
 ?gebied ?p ?o.
}
};
DELETE WHERE {
 GRAPH <http://mu.semte.ch/graphs/public> {
<#{unit[:org]}> ?p ?o
}
};
EOF
    end
    path = File.join(output_dir, "#{timestamp}-remove-data-#{file_name}-bestuursorganen.sparql")
    File.open(path, 'w') do |file|
      file.write <<EOF
PREFIX besluit:  <http://data.vlaanderen.be/ns/besluit#>
PREFIX mandaat:  <http://data.vlaanderen.be/ns/mandaat#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
PREFIX org:      <http://www.w3.org/ns/org#>
PREFIX prov:     <http://www.w3.org/ns/prov#>
DELETE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?mandaat ?p ?o
}
} WHERE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?bestuursorgaan besluit:bestuurt <#{unit[:org]}> .
?bestuursorgaanIntijd mandaat:isTijdspecialisatieVan ?bestuursorgaan.
VALUES ?post { org:hasPost <http://data.lblod.info/vocabularies/leidinggevenden/heeftBestuursfunctie>}
?bestuursorgaanIntijd ?post ?mandaat.
?mandaat ?p ?o.
}
};
DELETE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?mandaat ?p ?o
}
} WHERE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?bestuursorgaan besluit:bestuurt <#{unit[:org]}> .
?bestuursorgaanIntijd mandaat:isTijdspecialisatieVan ?bestuursorgaan.
VALUES ?post { org:hasPost <http://data.lblod.info/vocabularies/leidinggevenden/heeftBestuursfunctie>}
?bestuursorgaanIntijd ?post ?mandaat.
?mandaat ?p ?o.
}
};
DELETE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?bestuursorgaanIntijd ?p ?o
}
} WHERE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?bestuursorgaan besluit:bestuurt <#{unit[:org]}> .
?bestuursorgaanIntijd mandaat:isTijdspecialisatieVan ?bestuursorgaan.
VALUES ?post { org:hasPost <http://data.lblod.info/vocabularies/leidinggevenden/heeftBestuursfunctie>}
?bestuursorgaanIntijd ?p ?o
}
};
DELETE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?bestuursorgaan ?p ?o
}
} WHERE {
 GRAPH <http://mu.semte.ch/graphs/public> {
?bestuursorgaan besluit:bestuurt <#{unit[:org]}>; ?p ?o
}
}
EOF
    end
    timestamp+=1
    path = File.join(output_dir, "#{timestamp}-#{SecureRandom.uuid}-#{file_name}.ttl")
    File.open(path, 'w') do |file|
      file.write repo.dump(:ttl)
    end
    prompt.say("Exported #{repo.size} statements to #{path}")
  end
else
  abort("No classifications found?")
end

