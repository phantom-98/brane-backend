"use strict";

/**
	* meta-usuario controller
	*/
	const { STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_URL, STRIPE_ID_CLIENT, STRIPE_WEBHOOK_SECRET, REMOTE_URL, PAYPAL_ID_CLIENT, PAYPAL_SECRET_KEY, PAYPAL_URL, URL } = process.env;
const stripe = require("stripe")(STRIPE_SECRET_KEY);

const axios = require("axios");

const uuid = require("uuid");

const oauth = stripe.oauth;
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::meta-usuario.meta-usuario",
	({ strapi }) => ({
		// creo medodo me devuelve la meta data del usuario logueado

		async me(ctx) {
			const user = ctx.state.user;

			// si no hay usuario

			if (!user) {
				return ctx.badRequest(null, [
					{
						messages: [
							{
								id: "No autorizado",
								message: "No autorizado",
							},
						],
					},
				]);
			}

			const meta = await strapi.db
				.query("api::meta-usuario.meta-usuario")
				.findOne({ where: { usuario: user.id } });

			console.log(meta);

			if (!meta) {
				return ctx.notFound(null, [
					{
						messages: [
							{
								id: "No tienes una meta creada",

								message: "No tienes una meta creada",
							},
						],
					},
				]);
			}

			// si hay meta data, la retorno dentro de un objeto data {id:meta.id, attributes : meta}

			return ctx.send({ data: { id: meta.id, attributes: meta } });
		},

		async updateMe(ctx) {
			const user = ctx.state.user;

			// si no hay usuario

			if (!user) {
				return ctx.badRequest(null, [
					{
						messages: [
							{
								id: "No autorizado",
								message: "No autorizado",
							},
						],
					},
				]);
			}

			// si hay usuario, lo agrego como parametro id

			// busco el id de la meta del usuario logueado

			const meta = await strapi.db
				.query("api::meta-usuario.meta-usuario")
				.findOne({ where: { usuario: user.id } });

			console.log(meta);

			if (!meta) {
				return ctx.notFound(null, [
					{
						messages: [
							{
								id: "No tienes una meta creada",

								message: "No tienes una meta creada",
							},
						],
					},
				]);
			}

			ctx.params.id = meta.id;

			return super.update(ctx);
		},

		//modifico el metodo create para inyectar el id del usuario logueado en el campo usuario, al menos que quien envie	la peticion sea un admin

		async createMe(ctx) {
			const user = ctx.state.user;

			// si no hay usuario

			if (!user) {
				return ctx.badRequest(401, [
					{
						messages: [
							{
								id: "No autorizado",

								message: "No autorizado",
							},
						],
					},
				]);
			}

			console.log("USER", user);

			// verifico si el usuario logueado es admin con el role 5

			if (user.role.id != 5) {
				// si es distinto al admin, inyecto el id del usuario logueado en el campo usuario

				ctx.request.body.data.usuario = user.id;
			}

			console.log("BODY", ctx.request.body);

			// verifico quue el usuario no tenga ya una meta creada

			const meta = await strapi.db
				.query("api::meta-usuario.meta-usuario")
				.findOne({ where: { usuario: user.id } });

			console.log("META", meta);

			if (meta) {
				return ctx.badRequest(500, [
					{
						messages: [
							{
								id: "Ya tienes una meta creada",

								message: "Ya tienes una meta creada",
							},
						],
					},
				]);
			}

			return super.create(ctx);
		},

		async stripeConnect(ctx) {

			try {
				const user = ctx.state.user;

				// verifico que sea usuario y tenga role instructor
	
				if (!user || user.role.id != 3) {
					//ctx.response.status	= 401;
					return ctx.response.unauthorized([
	
						{
							id: "No autorizado",
	
							message: "No autorizado",
						},
	
					]);
				}
	
				// verifico que el usuario no tenga ya una cuenta creada
				let sesion_stripe_id = uuid.v4();
				let meta = await strapi.db.query("api::meta-usuario.meta-usuario").findOne({ where: { usuario: user.id } });
	
				if (!meta) {
	
					// le creamos	una meta
	
					meta = await strapi.db.query("api::meta-usuario.meta-usuario").create({ data: { usuario: user.id } });
	
	
	
				}
	
				// verifico que no tenga ya una cuenta creada con el campo stripe_account_id
				let account  ="";
				if (meta.stripe_account_id_state == "completed") {
	
					return ctx.badRequest("Ya tienes una cuenta creada", { message: "Ya tienes una cuenta creada" });
				}else if(meta.stripe_account_id_state == "pending"){
	
					account = await stripe.accounts.retrieve(meta.stripe_account_id);
	
				}else{
					account = await stripe.accounts.create({
						type: 'express',
						country: 'US',
						email: user.email,
						capabilities: {
							transfers: { requested: true },
						},
						//tos_acceptance: {service_agreement: 'recipient'},
						business_type: 'individual',
						individual: {
							first_name: user.nombre,
							last_name: user.apellidos
						}
					});
					
					meta = 	await strapi.db
					.query("api::meta-usuario.meta-usuario")
					.update(
							{
									where: { usuario: user.id },
									data: { stripe_account_id: account.id , stripe_account_id_state: "pending", sesion_stripe_id: sesion_stripe_id }
							}
					);
	
				}
				console.log(account);
	
	
				
	
	
	
				const link = await stripe.accountLinks.create({
					account: account.id,
					refresh_url: `https://example.com/reauth?account_id=${account.id}&user_id=${user.id}&sesion_stripe_id=${sesion_stripe_id}`,
					return_url: `${URL}/meta-usuario/stripe-connect/callback?account_id=${account.id}&user_id=${user.id}&sesion_stripe_id=${sesion_stripe_id}`,
					type: 'account_onboarding',
				});
	
				return ctx.send({ link });
	
	
	
			} catch (error) {
				console.log(error);
			}
			// recibo el usuario logueado



		},

		async paypalConnect(ctx) {

			try {
				const user = ctx.state.user;

				// verifico que sea usuario y tenga role instructor
	
				if (!user || user.role.id != 3) {
					//ctx.response.status	= 401;
					return ctx.response.unauthorized([
	
						{
							id: "No autorizado",
	
							message: "No autorizado",
						},
	
					]);
				}
	
				// verifico que el usuario no tenga ya una cuenta creada
	
				let meta = await strapi.db.query("api::meta-usuario.meta-usuario").findOne({ where: { usuario: user.id } });
	
				if (!meta) {
	
					// le creamos	una meta
	
					meta = await strapi.db.query("api::meta-usuario.meta-usuario").create({ data: { usuario: user.id } });
				}
	
	
				if (meta.paypal_account_id) {
	
					return ctx.badRequest("Ya tienes una cuenta creada", { message: "Ya tienes una cuenta creada" });
				}

				if (user.email != ctx.request.body.data.paypal_account_id) {

					return ctx.badRequest("El email debe ser el mismo con el que se registró en la plataforma", { message: "El email no coincide" });

				}


				// la guardo en la base de datos


			// borro todo del body menos el el paypal_account_id

			ctx.request.body.data = { paypal_account_id: ctx.request.body.data.paypal_account_id };

			ctx.params.id = meta.id;

				return super.update(ctx);
	
			} catch (error) {
			//	console.log(error);
				console.log(error.response);
			}
		},


		async stripeConnectCallback(ctx) {


			try {

				
				// saco de la url los parametros account_id y user_id

				const account_id = ctx.request.query.account_id;

				const user_id = ctx.request.query.user_id;

				const sesion_stripe_id = ctx.request.query.sesion_stripe_id;

				if(!account_id || !user_id || !sesion_stripe_id){

					return ctx.badRequest("No se recibieron los parametros account_id y user_id", { message: "No se recibieron los parametros account_id y user_id" });

				}

				// busco el usuario

				const user = await strapi.query("user", "users-permissions").findOne({ id: user_id });

				if(!user){

					return ctx.badRequest("No se encontró el usuario", { message: "No se encontró el usuario" });

				}


				// busco la meta del usuario

				let meta = await strapi.db.query("api::meta-usuario.meta-usuario").findOne({ where: { usuario: user.id } });

				if(!meta){

					return ctx.badRequest("No se encontró la meta del usuario", { message: "No se encontró la meta del usuario" });

				}


				// verifico que no tenga ya una cuenta creada con el campo stripe_account_id

				if (meta.stripe_account_id_state == "completed") {

					return ctx.badRequest("Ya tienes una cuenta creada", { message: "Ya tienes una cuenta creada" });

				}


				// verifico que sesion_stripe_id sea el mismo el de meta.sesion_stripe_id


				if (meta.sesion_stripe_id != sesion_stripe_id) {

					return ctx.badRequest("No se encontró la meta del usuario", { message: "No se encontró la meta del usuario" });

				}


				// verifico que el acount_id sea el mismo que el de meta.stripe_account_id

				if (meta.stripe_account_id != account_id) {

					return ctx.badRequest("No se encontró la meta del usuario", { message: "No se encontró la meta del usuario" });

				}


				// verifico que el estado de la cuenta sea completed


				const account = await stripe.accounts.retrieve(account_id);


				console.log(account);


				if (account.details_submitted != true || account.charges_enabled != true || account.payouts_enabled != true) {

					return ctx.badRequest("No se encontró la meta del usuario", { message: "No se encontró la meta del usuario" });

				}





				



	
				return ctx.send({ meta });
	
			} catch (error) {
				console.log(error);
			}

		}

		


	})
);
