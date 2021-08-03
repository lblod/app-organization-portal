defmodule Dispatcher do
  use Matcher

  define_accept_types [
    html: ["text/html", "application/xhtml+html"],
    json: ["application/json", "application/vnd.api+json"],
    upload: ["multipart/form-data"],
    any: [ "*/*" ],
  ]

  define_layers [ :api_services, :api, :frontend, :not_found ]

  ###############################################################
  # domain.json
  ###############################################################
  match "/people/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/people/"
  end

  match "/agents-in-position/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/agents-in-position/"
  end

  match "/posts/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/posts/"
  end

  match "/mandatories/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/mandatories/"
  end

  match "/mandatory-status-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/mandatory-status-codes/"
  end

  match "/worship-mandatories/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/worship-mandatories/"
  end

  match "/half-elections/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/half-elections/"
  end

  match "/contact-points/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/contact-points/"
  end

  match "/mandates/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/mandates/"
  end

  match "/board-positions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/board-positions/"
  end

  match "/roles/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/roles/"
  end

  match "/organizations/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/organizations/"
  end

  match "/administrative-units/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/administrative-units/"
  end

  match "/administrative-unit-classification-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/administrative-unit-classification-codes/"
  end

  match "/worship-administrative-units/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/worship-administrative-units/"
  end
  
  match "/worship-services/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/worship-services/"
  end

  match "/recognized-worship-types/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/recognized-worship-types/"
  end

  match "/central-worship-services/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/central-worship-services/"
  end

  match "/representative-bodies/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/representative-bodies/"
  end

  match "/governing-bodies/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/governing-bodies/"
  end

  match "/governing-body-classification-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/governing-body-classification-codes/"
  end

  match "/local-involvements/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/local-involvements/"
  end

  match "/identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/identifiers/"
  end

  match "/structured-identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/structured-identifiers/"
  end

  match "/addresses/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/addresses/"
  end

  match "/sites/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/sites/"
  end

  match "/change-events/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/change-events/"
  end

  match "/change-event-types/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/change-event-types/"
  end 

  match "/organization-status-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/organization-status-codes/"
  end   

  match "/locations/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/locations/"
  end

  match "/involvement-types/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/involvement-types/"
  end

  match "/ministers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/ministers/"
  end 

  match "/minister-conditions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/minister-conditions/"
  end 

  match "/associated-legal-structures/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/associated-legal-structures/"
  end 

  match "/dates-of-birth/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/dates-of-birth/"
  end   

  match "/nationalities/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/nationalities/"
  end

  match "/gender-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/gender-codes/"
  end

  match "/minister-positions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/minister-positions/"
  end

  match "/minister-position-functions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/minister-position-functions/"
  end

  match "/financing-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/financing-codes/"
  end

  match "/minister-condition-criterions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/minister-condition-criterions/"
  end

  match "/legal-form-types/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/legal-form-types/"
  end

  match "/document-types-criterions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/document-types-criterions/"
  end  

  match "/site-types/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/site-types/"
  end
  

  ###############################################################
  # sparql endpoint
  ###############################################################
  match "/sparql/*path", %{ accept: [:any], layer: :api} do
    Proxy.forward conn, path, "http://db:8890/sparql/"
  end

  ###############
  # LOGIN
  match "/mock/sessions/*path", %{ accept: [:any], layer: :api} do
    Proxy.forward conn, path, "http://mocklogin/sessions/"
  end

  ###############
  # API SERVICES
  ###############
  match "/v3/api-docs/*path", %{ layer: :api_services, accept: %{ json: true } } do
    forward conn, path, "http://kalliope-api/v3/api-docs/"
  end

  match "/delta/*path", %{ layer: :api_services, accept: %{ json: true } } do
    forward conn, path, "http://kalliope-api/delta/"
  end

  match "/bulk/*path", %{ layer: :api_services, accept: %{ json: true } } do
    forward conn, path, "http://kalliope-api/bulk"
  end

  match "/changes/*path", %{ layer: :api_services, accept: %{ json: true } } do
    forward conn, path, "http://kalliope-api/changes/"
  end

  match "/consolidated/*path", %{ layer: :api_services, accept: %{ json: true } } do
    forward conn, path, "http://kalliope-api/consolidated/"
  end


  ###############################################################
  # ember metis
  ###############################################################
  get "/uri-info/*path", %{ accept: [:json], layer: :api} do
    forward conn, path, "http://uri-info/"
  end

  get "/resource-labels/*path", %{ accept: [:json], layer: :api} do
    forward conn, path, "http://resource-labels/"
  end  

  ###############################################################
  # frontend layer
  ###############################################################
  match "/assets/*path", %{ layer: :api } do
    Proxy.forward conn, path, "http://frontend/assets/"
  end

  match "/@appuniversum/*path", %{ layer: :api } do
    Proxy.forward conn, path, "http://frontend/@appuniversum/"
  end

  match "/*path", %{ accept: [:html], layer: :api } do
    Proxy.forward conn, [], "http://frontend/index.html"
  end

  match "/*_path", %{ layer: :frontend } do
    Proxy.forward conn, [], "http://frontend/index.html"
  end
  
  ###############################################################
  # errors
  ###############################################################
  match "/*_path", %{ accept: [:any], layer: :not_found} do
    send_resp( conn, 404, "{\"error\": {\"code\": 404}")
  end


end
