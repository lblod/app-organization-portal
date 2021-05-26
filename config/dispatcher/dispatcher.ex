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
