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
			{
				method: "POST",
				path: "/meta-usuario/me",
				handler: "meta-usuario.createMe",
			},
			{
				method: "GET",
				path: "/meta-usuario/stripe-connect",
				handler: "meta-usuario.stripeConnect",
			},
			{
				method: "POST",
				path: "/meta-usuario/paypal-connect",
				handler: "meta-usuario.paypalConnect",
			},						

			{
				method: "GET",
				path: "/meta-usuario/stripe-connect/callback",
				handler: "meta-usuario.stripeConnectCallback",
			},
			{
				method: "GET",
				path: "/meta-usuario/stripe-connect/refresh",
				handler: "meta-usuario.stripeConnectRefresh",
			}
	],
};