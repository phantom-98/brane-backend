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
			{
				method: "POST",
				path: "/pedido/carnet/create/",
				handler: "pedido.cardnetCreate",
			},
			{

				method: "GET",
				path: "/pedido/carnet/successful-purchase/",
				handler: "pedido.cardnetSuccessPurchase",
			},
			{
				method: "GET",
				path: "/pedido/carnet/failed-purchase/",
				handler: "pedido.cardnetFailedPurchase",
			},
	],
};