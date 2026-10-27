package route

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/logic-gate-sys/wss_service/internals/app"
	"github.com/logic-gate-sys/wss_service/internals/docs"
	"github.com/logic-gate-sys/wss_service/internals/ws"
)

func SetupRoute(app *app.Application) *chi.Mux {
	router := chi.NewRouter()
	// 2. Configure and inject CORS middleware at the root level
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if len(strings.Split(allowedOrigins, ",")) < 1 {
		fmt.Println("Invalid allowed origins")
	}
	origins := strings.Split(allowedOrigins, ",")
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true, // for  HTTP-only cookies or auth headers
		MaxAge:           300,  // Maximum value for Preflight request caching (in seconds)
	}))
	roomManager := ws.NewRoomManager(app.RoomHandler.RoomStore, app.GrpcClient)

	// routing
	router.Route("/api/v1", func(r chi.Router) {
		// api docs: HTML viewer and raw spec
		r.Get("/rooms/docs", serveSwaggerUI)
		r.Get("/rooms/docs/openapi.yaml", serveOpenAPISpec)

		// protected routes
		r.Group(func(rt chi.Router) {
			// authenticate all routes here
			rt.Use(app.Middleware.Authenticate)
			rt.Post("/rooms", app.Middleware.RequireAuth(http.HandlerFunc(app.RoomHandler.HandleCreateRoom)))
			rt.Patch("/rooms/{id}", app.Middleware.RequireAuth(http.HandlerFunc(app.RoomHandler.HandleUpdateRoom)))
			rt.Delete("/rooms/{id}", app.Middleware.RequireAuth(http.HandlerFunc(app.RoomHandler.HandleDeleteRoom)))
			rt.Get("/rooms", app.Middleware.RequireAuth(http.HandlerFunc(app.RoomHandler.HandleGetRooms)))
			// websocket upgrade require authorisation
			rt.Get("/ws", app.Middleware.RequireAuth(http.HandlerFunc(roomManager.HandleWS)))
		})
	})

	// export router
	return router
}

const swaggerUIHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rooms API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/api/v1/rooms/docs/openapi.yaml",
        dom_id: "#swagger-ui",
      });
    };
  </script>
</body>
</html>`

func serveSwaggerUI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(swaggerUIHTML))
}

func serveOpenAPISpec(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/yaml")
	w.Write(docs.OpenAPISpecs)
}
