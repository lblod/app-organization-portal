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
    Proxy.forward conn, path, "http://resource/people/"
  end

  match "/agent-in-position/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/agent-in-position/"
  end

  match "/posts/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/posts/"
  end

  match "/mandatories/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/mandatories/"
  end

  match "/mandatory-status-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/mandatory-status-codes/"
  end

  match "/worship-mandatories/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/worship-mandatories/"
  end

  match "/half-elections/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/half-elections/"
  end

  match "/contact-points/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/contact-points/"
  end

  match "/mandates/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/mandates/"
  end

  match "/board-positions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/board-positions/"
  end

  match "/roles/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/roles/"
  end

  match "/organizations/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/organizations/"
  end

  match "/administrative-units/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/administrative-units/"
  end

  match "/administrative-unit-classification-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/administrative-unit-classification-codes/"
  end
  
  match "/worship-services/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/worship-services/"
  end

  match "/honorary-service-types/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/honorary-service-types/"
  end

  match "/central-worship-services/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/central-worship-services/"
  end

  match "/representative-bodies/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/representative-bodies/"
  end

  match "/governing-bodies/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/governing-bodies/"
  end

  match "/governing-body-classification-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/governing-body-classification-codes/"
  end

  match "/public-involvements/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/public-involvements/"
  end

  match "/identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/identifiers/"
  end

  match "/structured-identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/structured-identifiers/"
  end

  match "/addresses/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/addresses/"
  end

  match "/sites/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/sites/"
  end

  match "/change-events/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/change-events/"
  end

  match "/change-event-types/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/change-event-types/"
  end 

  match "/organization-status-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/organization-status-codes/"
  end   

  ###############################################################
  # sparql endpoint
  ###############################################################
  match "/sparql/*path", %{ accept: [:any], layer: :api} do
    forward conn, path, "http://db:8890/sparql/"
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
