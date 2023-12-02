// rutas personalizadas para el modelo meta-usuario

module.exports = {
	routes: [
			{
					method: "GET",
					path: "/meta-company/me",
					handler: "meta-company.me",
			},
			//añado para actualizar la meta del company
			{
				method: "PUT",
				path: "/meta-company/me",
				handler: "meta-company.updateMe",
			},
			{
				method: "POST",
				path: "/meta-company/me",
				handler: "meta-company.createMe",
			},
			{
				method: "GET",
				path: "/meta-company/stripe-connect",
				handler: "meta-company.stripeConnect",
			},						
	],
};