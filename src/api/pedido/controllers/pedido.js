'use strict';

/**
	* pedido controller
	*/

const { createCoreController } = require('@strapi/strapi').factories;
const { STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_URL,STRIPE_ID_CLIENT } = process.env;
const stripe = require('stripe')(STRIPE_SECRET_KEY);

const oauth = stripe.oauth;

module.exports = createCoreController(
	"api::pedido.pedido",
	({ strapi }) => ({
		//modifico el metodo create para que cuando se cree mis curso se agregue el campo progress con valor 0
		async create(ctx) {
			const user = ctx.state.user;

			// si no hay usuario



	/*		const paymentIntent = await stripe.paymentIntents.create({
				amount: 1000,
				currency: 'usd',
				automatic_payment_methods: {enabled: true},
				application_fee_amount: 123,
				transfer_data: {
						destination: 'acct_1Mr5YBPxP1XEYy1R',
				},
		});*/

		const session = await stripe.checkout.sessions.create({
			success_url: 'https://example.com/success/',
			cancel_url: 'https://example.com/cance/l',
			line_items: [
    {
					price_data: {currency: 'usd', product_data: {name: 'T-shirt'}, unit_amount: 100},
					quantity: 1,
			},
			],
			mode: 'payment',
			payment_intent_data: {
				application_fee_amount: 5,
				transfer_data: {
					destination: 'acct_1MrA3MPw4H2UsSWp',
				},
		}
		}

	);

			console.log(session);


			return ctx.send(session);

			// RECIBO LOS DATOS DE LA ORDEN DE COMPRA


			// si hay usuario, le agrego el filtro de usuario

			ctx.request.body = {

				...ctx.request.body,

				usuario: user.id,

			};





			return super.create(ctx);
		},
	})
);

