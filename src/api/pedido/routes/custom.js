module.exports = {
	routes: [
			{
					method: "POST",
					path: "/pedido/checkout/",
					handler: "pedido.checkout",
			},
			{
					method: "POST",
					path: "/pedido/paypal/create/",
					handler: "pedido.paypalCreate",
			},
			{

					method: "POST",
					path: "/pedido/paypal/webhook/",
					handler: "pedido.webhookPaypal",
			},
	],
};