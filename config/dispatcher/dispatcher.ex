defmodule Dispatcher do
  use Matcher

  define_accept_types [
    html: ["text/html", "application/xhtml+html"],
    json: ["application/json", "application/vnd.api+json"],
    upload: ["multipart/form-data"],
    any: [ "*/*" ],
  ]

  define_layers [ :api, :frontend, :not_found ]

  ###############################################################
  # domain.json
  ###############################################################
  match "/people/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/people/"
  end

  match "/mandatories/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/mandatories/"
  end

  match "/mandatory-status-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/mandatory-status-codes/"
  end

  match "/contact-points/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/contact-points/"
  end

  match "/mandates/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/mandates/"
  end
  
  match "/governing-bories/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/governing-bories/"
  end

  match "/governing-body-classification-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/governing-body-classification-codes/"
  end

  match "/administrative-units/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/administrative-units/"
  end

  match "/administrative-unit-classification-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/administrative-unit-classification-codes/"
  end

  match "/addresses/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/addresses/"
  end

  match "/sites/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/sites/"
  end

  match "/identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/identifiers/"
  end

  match "/structured-identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/structured-identifiers/"
  end

  match "/worship-services/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/worship-services/"
  end

  ###############################################################
  # sparql endpoint
  ###############################################################
  match "/sparql/*path", %{ accept: [:any], layer: :api} do
    forward conn, path, "http://db:8890/sparql/"
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
