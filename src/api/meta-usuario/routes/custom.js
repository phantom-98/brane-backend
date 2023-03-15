// rutas personalizadas para el modelo meta-usuario

module.exports = {
	routes: [
			{
					method: "GET",
					path: "/meta-usuario/me",
					handler: "meta-usuario.me",
			},
			//añado para actualizar la meta del usuario
			{
				method: "PUT",
				path: "/meta-usuario/me",
				handler: "meta-usuario.updateMe",
			},
			
	],
};