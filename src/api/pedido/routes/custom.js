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
				path: "/pedido/cardnet/create/",
				handler: "pedido.cardnetCreate",
			},
			{

				method: "POST",
				path: "/pedido/cardnet/successful-purchase/",
				handler: "pedido.cardnetSuccessPurchase",
			},
			{

				method: "GET",
				path: "/pedido/cardnet/successful-purchase/",
				handler: "pedido.cardnetSuccessPurchase",
			},
			{
				method: "POST",
				path: "/pedido/cardnet/failed-purchase/",
				handler: "pedido.cardnetFailedPurchase",
			},
	],
};