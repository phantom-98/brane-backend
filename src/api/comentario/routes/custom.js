// rutas personalizadas para el modelo meta-usuario

module.exports = {
	routes: [
			{
					method: "GET",
					path: "/mensajes/me",
					handler: "comentario.messageMe",
			},
			{
				method: "GET",
				path: "/mensajes/me/:id",
				handler: "comentario.messageMeForId",
		}		
	],
};