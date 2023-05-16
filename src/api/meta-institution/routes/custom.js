// rutas personalizadas para el modelo meta-usuario

module.exports = {
	routes: [
			{
					method: "GET",
					path: "/meta-institution/me",
					handler: "meta-institution.me",
			},
			//añado para actualizar la meta del company
			{
				method: "PUT",
				path: "/meta-institution/me",
				handler: "meta-institution.updateMe",
			},
			{
				method: "POST",
				path: "/meta-institution/me",
				handler: "meta-institution.createMe",
			},
			{
				method: "GET",
				path: "/meta-institution/stripe-connect",
				handler: "meta-institution.stripeConnect",
			},						
	],
};