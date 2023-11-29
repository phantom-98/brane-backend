'use strict';

/**
	* pedido controller
	*/

const { createCoreController } = require('@strapi/strapi').factories;
const { STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_URL, STRIPE_ID_CLIENT, STRIPE_WEBHOOK_SECRET, REMOTE_URL, PAYPAL_ID_CLIENT, PAYPAL_SECRET_KEY, PAYPAL_URL, PAYPAL_WEBHOOK_ID, URL_FRONT, CARDNET_ACCESS_LINK, CARDNET_MERCHANT_TYPE, CARDNET_MERCHANT_NUMBER, CARDNET_MERCHANT_TERMINAL, CARDNET_MERCHANT_TERMINAL_AMEX, CARDNET_MERCHANT_NAME, CARDNET_TAX } = process.env;
const codigosDeRespuestaCardnet = {
	"00": "Aprobada",
	"01": "Llamar al Banco",
	"02": "Llamar al Banco",
	"03": "Comercio Inválido",
	"04": "Rechazada",
	"05": "Rechazada",
	"06": "Error en el Mensaje",
	"07": "Tarjeta Rechazada",
	"08": "Llamar al Banco",
	"09": "Solicitud en progreso",
	"10": "Aprobación Parcial",
	"11": "Aprobación VIP",
	"12": "Transacción Inválida",
	"13": "Monto Inválido",
	"14": "Cuenta Inválida",
	"15": "No such issuer",
	"16": "Aprobado - Actualización de track 3",
	"17": "Cancelación del cliente",
	"18": "Disputa del cliente",
	"19": "Reintentar Transacción",
	"20": "No tomó acción",
	"21": "No tomó acción",
	"22": "Transacción No Aprobada",
	"23": "Transacción No Aceptada",
	"24": "Actualización de archivo no soportada",
	"25": "No se pudo localizar el registro",
	"26": "Registro duplicado",
	"27": "Error de edición en la actualización de archivo",
	"28": "Archivo bloqueado en la actualización de archivo",
	"30": "Error en la actualización de archivo",
	"31": "BIN no soportado",
	"32": "Transacción Completada Parcialmente",
	"33": "Tarjeta Expirada",
	"34": "Transacción No Aprobada",
	"35": "Transacción No Aprobada",
	"36": "Transacción No Aprobada",
	"37": "Transacción No Aprobada",
	"38": "Transacción No Aprobada",
	"39": "Tarjeta Inválida",
	"40": "Función no Soportada",
	"41": "Transacción No Aprobada",
	"42": "Cuenta Inválida",
	"43": "Transacción No Aprobada",
	"44": "No cuenta de inversión",
	"51": "Fondos insuficientes",
	"52": "Cuenta Inválida",
	"53": "Cuenta Inválida",
	"54": "Tarjeta vencida",
	"56": "Cuenta Inválida",
	"57": "Transacción no permitida",
	"58": "Transacción no permitida en terminal",
	"60": "Contactar al Adquirente",
	"61": "Excedió Límite de Retiro",
	"62": "Tarjeta Restringida",
	"65": "Excedió Cantidad de Intentos",
	"66": "Contactar al Adquirente",
	"67": "Hard capture",
	"68": "Respuesta recibida demasiado tarde",
	"75": "PIN excedió el Límite de Intentos",
	"77": "Captura de Lote Inválida",
	"78": "Intervención del Banco Requerida",
	"79": "Rechazada",
	"81": "PIN inválido",
	"82": "PIN requerido",
	"85": "Llaves no disponibles",
	"89": "Terminal Inválida",
	"90": "Cierre en proceso",
	"91": "Host No Disponible",
	"92": "Error de Ruteo",
	"94": "Transacción Duplicada",
	"95": "Error de Reconciliación",
	"96": "Error de Sistema",
	"97": "Emisor no Disponible",
	"98": "Excede Límite de Efectivo",
	"99": "Respuesta de error CVV o CVC"
};


const stripe = require('stripe')(STRIPE_SECRET_KEY);
const unparsed = require("koa-body/unparsed.js");
const axios = require('axios');

// uuid 

const { v4: uuidv4 } = require('uuid');

module.exports = createCoreController(
	"api::pedido.pedido",
	({ strapi }) => ({
		//modifico el metodo create para que cuando se cree mis curso se agregue el campo progress con valor 0
		async create(ctx) {
			const user = ctx.state.user;
			if (!user) {
				return ctx.unauthorized("No tienes permiso", { error: 'No autorizado' });
			}

			let { cursos, redirect } = ctx.request.body.data;

			if (!cursos) {
				return ctx.notFound("Revisa la información enviada", { error: 'No hay cursos' });
			}

			for (let i = 0; i < cursos.length; i++) {
				let mis_curso = await strapi.db.query("api::").findOne({
					where: { usuario: user.id, curso: cursos[i].curso }
				});

				if (mis_curso) {
					return ctx.badRequest(`Curso ya comprado previamente `, { error: 'Uno o más cursos ya se encuentran en tu biblioteca' })
				}
			}

			let monto_centimos = 0;
			let line_items = [];
			let discount_total = 0;
			let destinations = [];
			let total = 0;
			let transfer_group = uuidv4();

			// Función para convertir montos a centavos
			const convertirACentimos = (monto) => Math.round(monto * 100);

			for (let i = 0; i < cursos.length; i++) {
				let monto_curso = 0;
				let discount = 0;
				let monto_curso_descuento_porcentual = 0;
				let monto_curso_descuento_fijo = 0;
				let curso = await strapi.db.query("api::curso.curso").findOne({
					where: { id: cursos[i].curso },
					populate: ['instructor', 'imagen'],
					select: ['precio', 'precioDescuento', 'cupon_descuento', "name"]
				});

				if (!curso) {
					return ctx.notFound(`No existe el curso`, { error: 'No existe el curso' });
				}

				if (cursos[i].cupon) {
					let cupon = await strapi.db.query("api::cupon.cupon").findOne({
						where: { slug: cursos[i].cupon, cursos: cursos[i].curso }
					});

					if (!cupon) {
						return ctx.notFound(`No existe el cupon`, { error: 'No existe el cupon' });
					}

					if (cupon.estado !== true) {
						return ctx.badRequest("Cupón no disponible", { error: 'El cupon no esta activo' });
					}

					if (cupon.tipo == 'porcentaje') {
						monto_curso = this.formatearMontos(curso.precio);
						cupon.valor = monto_curso * (cupon.valor / 100);
						cupon.valor = this.formatearMontos(cupon.valor);
						monto_curso_descuento_porcentual = cupon.valor;
						monto_curso = monto_curso - monto_curso_descuento_porcentual;
						discount = monto_curso_descuento_porcentual;
					} else {
						monto_curso = this.formatearMontos(curso.precio);
						monto_curso_descuento_fijo = this.formatearMontos(cupon.valor);
						monto_curso = monto_curso - monto_curso_descuento_fijo;
						discount = monto_curso_descuento_fijo;
					}
				} else if (curso.precioDescuento) {
					console.log("DESCUENTO");
					monto_curso = this.formatearMontos(curso.precio);
					monto_curso = this.formatearMontos(curso.precioDescuento);
					discount = monto_curso_descuento_fijo;
				} else {
					console.log("SIN DESCUENTO");
					monto_curso = this.formatearMontos(curso.precio);
				}

				// Convertir montos a centimos para Stripe
				console.log("monto_curso_antes", monto_curso);
				monto_curso = convertirACentimos(monto_curso);
				console.log("monto_curso_antesx100", monto_curso);
				monto_curso_descuento_porcentual = convertirACentimos(monto_curso_descuento_porcentual);
				monto_curso_descuento_fijo = convertirACentimos(monto_curso_descuento_fijo);
				discount = convertirACentimos(discount);
				discount_total += discount;
				monto_centimos += monto_curso;

				let stripe_account_id = await strapi.db.query("api::meta-usuario.meta-usuario").findOne({
					where: { usuario: curso.instructor.id },
					select: ['stripe_account_id']
				});

				line_items.push({
					price_data: {
						currency: 'usd',
						product_data: {
							name: curso.name,
							images: curso.imagen ? [`${REMOTE_URL}${curso.imagen[0].url}`] : [],
						},
						unit_amount: monto_curso,
					},
					quantity: 1
				});

				destinations.push({
					amount: monto_curso - Math.round(monto_curso * 0.2),
					application_fee_amount: Math.round(monto_curso * 0.2),
					account: stripe_account_id.stripe_account_id,
				});
			}

			const session = await stripe.checkout.sessions.create({
				success_url: `${URL_FRONT}/successful-purchase/`,
				cancel_url: `${URL_FRONT}/payment-failure/`,
				line_items: line_items,
				mode: 'payment',
				customer_email: user.email,
				payment_method_types: ['card'],
			});

			if (destinations.length > 0) {
				destinations = JSON.stringify(destinations);
			} else {
				destinations = null;
			}

			let raw = JSON.stringify(session);
			ctx.request.body.data = {
				usuario: user.id,
				cursos: cursos.map((curso) => curso.curso),
				total: monto_centimos / 100,
				subtotal: (monto_centimos + discount_total) / 100,
				descuento: discount_total / 100,
				cantidad: cursos.length,
				estado: 'creado',
				metodo_de_pago: 'stripe',
				stripe_sesion_id: session.id,
				destinatarios: destinations,
				monto_comision: JSON.stringify((monto_centimos - Math.round(monto_centimos * 0.2)) / 100),
				fee_comision: "20%",
				raw: raw,
				paymentInId: session.payment_intent
			}

			await super.create(ctx);

			if (redirect) {
				return ctx.response.redirect(session.url);
			}

			return ctx.send({ url: session.url });
		},


		async paypalCreate(ctx) {

			const user = ctx.state.user;




			if (!user) {

				return ctx.unauthorized("No tienes permiso", { error: 'No autorizado' });
			}


			let { cursos, redirect } = ctx.request.body.data;




			// si no hay cursos

			if (!cursos) {

				return ctx.notFound("Revisa la información enviada", { error: 'No hay cursos' });

			}

			// verifico que el usuario no tiene el curso comprado

			for (let i = 0; i < cursos.length; i++) {

				let mis_curso = await strapi.db.query("api::").findOne({

					where: { usuario: user.id, curso: cursos[i].curso }

				});

				if (mis_curso) {

					return ctx.badRequest(`Curso ya comprado previamente `, { error: 'Uno o más cursos ya se encuentran en tu biblioteca' })

					return ctx.badRequest({ error: 'Ya tienes el curso comprado' });

				}

			}

			// verifico que el usuario no tiene el curso comprado



			// recorro los cursos  y calculo el monto total verifico si tienen descuento y si tienen descuento calculo el monto total con el descuento o cupon asociado


			let monto_centimos = 0;

			// defino el array de line_items para enviar a stripe
			let line_items = [];

			let discount_total = 0;
			// defino el array de destinations (instructores) para enviar a stripe

			let destinations = [];

			// defino el total	de la comision de brane

			let total = 0;

			let transfer_group = uuidv4();

			for (let i = 0; i < cursos.length; i++) {

				let monto_curso = 0;

				let discount = 0;

				let monto_curso_descuento_porcentual = 0;
				let monto_curso_descuento_fijo = 0;




				let curso = await strapi.db.query("api::curso.curso").findOne({

					where: { id: cursos[i].curso },
					populate: ['instructor', 'imagen'],
					select: ['precio', 'precioDescuento', 'cupon_descuento', "name"]


				});







				if (!curso) {

					return ctx.notFound(`No existe el curso`, { error: 'No existe el curso' });
				}


				if (cursos[i].cupon) {



					// busco cupon en la base de datos por nombre y  curso


					let cupon = await strapi.db.query("api::cupon.cupon").findOne({

						where: { slug: cursos[i].cupon, cursos: cursos[i].curso }
					});



					if (!cupon) {

						return ctx.notFound(`No existe el cupon`, { error: 'No existe el cupon' });
					}

					if (cupon.estado !== true) {

						return ctx.badRequest("Cupón no disponible", { error: 'El cupon no esta activo' });

					}



					if (cupon.tipo == 'porcentaje') {

						// calculo el monto del curso	con el descuento del cupon

						monto_curso = this.formatearMontos(curso.precio);

						// calculo el descuento del curso con el cupon porcentual


						cupon.valor = monto_curso * (cupon.valor / 100);


						cupon.valor = this.formatearMontos(cupon.valor);

						monto_curso_descuento_porcentual = cupon.valor;


						monto_curso = monto_curso - monto_curso_descuento_porcentual;

						discount = monto_curso_descuento_porcentual;


					} else {

						// calculo el monto del curso	con el descuento del cupon

						monto_curso = this.formatearMontos(curso.precio);

						monto_curso_descuento_fijo = this.formatearMontos(cupon.valor);

						monto_curso = monto_curso - monto_curso_descuento_fijo;

						discount = monto_curso_descuento_fijo;




					}

				} else if (curso.precioDescuento) {

					console.log("DESCUENTO");

					monto_curso = this.formatearMontos(curso.precio);

					monto_curso = this.formatearMontos(curso.precioDescuento);

					discount = monto_curso_descuento_fijo;



				} else {

					console.log("SIN DESCUENTO");

					monto_curso = this.formatearMontos(curso.precio);

				}

				// convierto los montos a centimos

				console.log("monto_curso_antes", monto_curso);
				monto_curso = monto_curso * 100;

				console.log("monto_curso_antesx100", monto_curso);
				monto_curso_descuento_porcentual = monto_curso_descuento_porcentual * 100;

				monto_curso_descuento_fijo = monto_curso_descuento_fijo * 100;


				// defino una variable de descuento para enviar a stripe	donde esté cuañlqueira de los 3 descuentos disponibles. 




				discount = discount * 100;

				// sumo el descuento total


				discount_total += discount;




				monto_centimos += monto_curso;

				monto_centimos = this.formatearMontos(monto_centimos);



				line_items.push({
					price_data: {

						currency: 'usd',

						product_data: {

							name: curso.name,

							images: curso.imagen ? [`${REMOTE_URL}${curso.imagen[0].url}`] : [],


						},

						unit_amount: monto_curso,

						//			discount: discountObject



					},
					//	discount: discountObject,
					quantity: 1

				});




				// agrego el instructor al array de destinations para enviar a stripe

				destinations.push({

					amount: monto_curso - Math.round(monto_curso * 0.2),
					// coloco el 20% de la comision de brane asegurando quede un numero entero
					application_fee_amount: Math.round(monto_centimos * 0.2),

					account: curso.instructor.id,

				});



			}

			//autentifoco con payapl


			const response = await axios({
				url: `${PAYPAL_URL}/v1/oauth2/token`,
				method: 'post',
				headers: {
					'Accept': 'application/json',
					'Accept-Language': 'en_US',
					'Authorization': `Basic ${Buffer.from(`${PAYPAL_ID_CLIENT}:${PAYPAL_SECRET_KEY}`).toString('base64')}`
				},
				data: 'grant_type=client_credentials'
			});








			const session = await axios({

				url: `${PAYPAL_URL}/v2/checkout/orders`,
				method: 'post',
				headers: {

					'Content-Type': 'application/json',
					'Authorization': `Bearer ${response.data.access_token}`
				},

				data: {
					"purchase_units": [
						{
							"amount": {
								"currency_code": "USD",
								"value": monto_centimos / 100
							},
							"reference_id": transfer_group
						}
					],
					"intent": "CAPTURE",
					"application_context": {
						"cancel_url": "https://brane-app.netlify.app/payment-failure/",
						"return_url": "https://brane-app.netlify.app/successful-purchase/",
						"brand_name": "Brane",
						"landing_page": "BILLING",
						"shipping_preference": "NO_SHIPPING",
						"user_action": "PAY_NOW",
						"payment_method": {
							"payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED",
							"payer_selected": "PAYPAL"
						},
						"checkout_payment_preference": {
							"allowed_payment_method": {
								"card": {
									"deferred_payment": {
										"enabled": false
									}
								}
							}
						}
					}
				}
			});



			console.log("order", session.data);


			if (destinations.length > 0) {

				destinations = JSON.stringify(destinations);

			} else {

				destinations = null;

			}


			// convierto la sesion en un string para enviarla a la base de datos llamda raw


			let raw = JSON.stringify(session.data);





			ctx.request.body.data = {

				usuario: user.id,

				cursos: cursos.map((curso) => curso.curso),

				total: monto_centimos / 100,

				subtotal: (monto_centimos + discount_total) / 100,

				descuento: discount_total / 100,

				cantidad: cursos.length,

				estado: 'creado',

				metodo_de_pago: 'paypal',

				paypal_sesion_id: session.data.id,



				destinatarios: destinations,
				// monto_comision : monto_centimos - Math.round(monto_centimos * 0.2) , lo paso a string	para que no me de error en la base de datos

				monto_comision: JSON.stringify((monto_centimos - Math.round(monto_centimos * 0.2)) / 100),


				fee_comision: "20%",


				raw: raw,

				paymentInId: session.data.id





			}
			console.log("session", session.data);

			await super.create(ctx);



			let url = session.data.links.find((link) => link.rel === 'approve').href;
			// redirecciono	al usuario a la pagina de pago de stripe
			if (redirect) {


				// saco de session el url de paypal y lo redirecciono al usuario



				return ctx.response.redirect(url);
			}


			return ctx.send({ url: url });










		},

		async cardnetCreate(ctx) {

			const user = ctx.state.user;
			if (!user) {
				return ctx.unauthorized("No tienes permiso", { error: 'No autorizado' });
			}

			let { cursos, redirect } = ctx.request.body.data;

			if (!cursos) {
				return ctx.notFound("Revisa la información enviada", { error: 'No hay cursos' });
			}

			for (let i = 0; i < cursos.length; i++) {
				let mis_curso = await strapi.db.query("api::").findOne({
					where: { usuario: user.id, curso: cursos[i].curso }
				});

				if (mis_curso) {
					return ctx.badRequest(`Curso ya comprado previamente `, { error: 'Uno o más cursos ya se encuentran en tu biblioteca' })
				}
			}

			let monto_centimos = 0;
			let line_items = [];
			let discount_total = 0;
			let destinations = [];
			let total = 0;
			let transfer_group = uuidv4();

			// Función para convertir montos a centavos
			const convertirACentimos = (monto) => Math.round(monto * 100);

			for (let i = 0; i < cursos.length; i++) {
				let monto_curso = 0;
				let discount = 0;
				let monto_curso_descuento_porcentual = 0;
				let monto_curso_descuento_fijo = 0;
				let curso = await strapi.db.query("api::curso.curso").findOne({
					where: { id: cursos[i].curso },
					populate: ['instructor', 'imagen'],
					select: ['precio', 'precioDescuento', 'cupon_descuento', "name"]
				});

				if (!curso) {
					return ctx.notFound(`No existe el curso`, { error: 'No existe el curso' });
				}

				if (cursos[i].cupon) {
					let cupon = await strapi.db.query("api::cupon.cupon").findOne({
						where: { slug: cursos[i].cupon, cursos: cursos[i].curso }
					});

					if (!cupon) {
						return ctx.notFound(`No existe el cupon`, { error: 'No existe el cupon' });
					}

					if (cupon.estado !== true) {
						return ctx.badRequest("Cupón no disponible", { error: 'El cupon no esta activo' });
					}

					if (cupon.tipo == 'porcentaje') {
						monto_curso = this.formatearMontos(curso.precio);
						cupon.valor = monto_curso * (cupon.valor / 100);
						cupon.valor = this.formatearMontos(cupon.valor);
						monto_curso_descuento_porcentual = cupon.valor;
						monto_curso = monto_curso - monto_curso_descuento_porcentual;
						discount = monto_curso_descuento_porcentual;
					} else {
						monto_curso = this.formatearMontos(curso.precio);
						monto_curso_descuento_fijo = this.formatearMontos(cupon.valor);
						monto_curso = monto_curso - monto_curso_descuento_fijo;
						discount = monto_curso_descuento_fijo;
					}
				} else if (curso.precioDescuento) {
					console.log("DESCUENTO");
					monto_curso = this.formatearMontos(curso.precio);
					monto_curso = this.formatearMontos(curso.precioDescuento);
					discount = monto_curso_descuento_fijo;
				} else {
					console.log("SIN DESCUENTO");
					monto_curso = this.formatearMontos(curso.precio);
				}

				// Convertir montos a centimos para Stripe
				console.log("monto_curso_antes", monto_curso);
				monto_curso = convertirACentimos(monto_curso);
				console.log("monto_curso_antesx100", monto_curso);
				monto_curso_descuento_porcentual = convertirACentimos(monto_curso_descuento_porcentual);
				monto_curso_descuento_fijo = convertirACentimos(monto_curso_descuento_fijo);
				discount = convertirACentimos(discount);
				discount_total += discount;
				monto_centimos += monto_curso;
			}
			let session = null;

			ctx.request.body.data = {
				usuario: user.id,
				cursos: cursos.map((curso) => curso.curso),
				total: monto_centimos / 100,
				subtotal: (monto_centimos + discount_total) / 100,
				descuento: discount_total / 100,
				cantidad: cursos.length,
				estado: 'creado',
				metodo_de_pago: 'cardnet',
				monto_comision: JSON.stringify((monto_centimos - Math.round(monto_centimos * 0.2)) / 100),
				fee_comision: "20%",
			}



			let pedido = await super.create(ctx);


			try {
				let { data } = await axios.post(`${CARDNET_ACCESS_LINK}/sessions`, {

					"TransactionType": "200",
					"CurrencyCode": "214",
					"AcquiringInstitutionCode": "349",
					"MerchantType": `${CARDNET_MERCHANT_TYPE}`,
					"MerchantNumber": `${CARDNET_MERCHANT_NUMBER}`,
					"MerchantTerminal": `${CARDNET_MERCHANT_TERMINAL}`,
					"MerchantTerminal_amex": `${CARDNET_MERCHANT_TERMINAL_AMEX}`,
					"ReturnUrl": `${REMOTE_URL}/api/pedido/cardnet/successful-purchase/`,
					"CancelUrl": `${REMOTE_URL}/api/pedido/cardnet/failed-purchase/`,
					"Tax": `${CARDNET_TAX}`,
					"MerchantName": `${CARDNET_MERCHANT_NAME}`,
					"Amount": monto_centimos,
					"AVS": "33024 1000 ST JOHN PLACE PEMBROKE PINES FLORIDA",

				}, {
					headers: {
						'Content-Type': 'application/json'
					}
				});

				session = {
					session: data.SESSION,
					session_key: data['session-key']

				}

			} catch (error) {
				console.log("error", error);
				return ctx.badRequest("Ha ocurrido un error", { error: error.message });


			}


			let raw = JSON.stringify(session.data);

			await strapi.entityService.update("api::pedido.pedido", pedido.data.id, {



				data: {
					raw: raw,
					cardnetSession: session.session,
					cardnetSk: session.session_key
				}

			});





			return ctx.send({ url: `${CARDNET_ACCESS_LINK}/authorize`, session: session.session });



		},

		async cardnetSuccessPurchase(ctx) {


			const { SESSION: session } = ctx.request.body;


			if (!session) {

				return ctx.badRequest("Ha ocurrido un error", { error: "No se ha encontrado el session" });
			}


			// busco el pedido por session. 


			let pedido = await strapi.db.query("api::pedido.pedido").findOne({

				where: {
					cardnetSession: session
				},
				populate : ["usuario","cursos"]
			});


			if (!pedido) {


				return ctx.badRequest("Ha ocurrido un error", { error: "No se encuentra un pedido asociado a dicha session" });

			}


			try {
				var { data } = await axios.get(`${CARDNET_ACCESS_LINK}/sessions/${pedido.cardnetSession}?sk=${pedido.cardnetSk}`)



				await strapi.entityService.update("api::pedido.pedido", pedido.id, {
					data: {
						cardNetDataResponse: {
							...data,
							textResponse: codigosDeRespuestaCardnet[data.ResponseCode]
						},
						estado: data.ResponseCode == '00' ? 'completado' : 'rechazado'





					}
				});


			} catch (error) {
				console.log(error)

				return ctx.redirect(`${URL_FRONT}/payment-failure?error=${error.message}`);
				return ctx.badRequest("Ha ocurrido un error", { error: error.message });




			}

			if (data.ResponseCode != '00') {

				return ctx.redirect(`${URL_FRONT}/payment-failure?error=${codigosDeRespuestaCardnet[data.ResponseCode]}&code=${data.ResponseCode}`);
			} else {

				for (let i = 0; i < pedido.cursos.length; i++) {

					const curso = pedido.cursos[i];

					data = {

						usuario: pedido.usuario.id,

						curso: curso.id,


						progress: 0,

					}


					let misCurso = await strapi.db.query("api::").findOne({

						where: { usuario: pedido.usuario.id, curso: curso.id }

					});

					if (misCurso) {

						continue;

					}

					const curso1 = await strapi.db.query("api::curso.curso").findOne({
						where: { id: curso.id },
						populate: ['instructor']
					});

					// añado el id del instructor al curso

					data.instructor = curso1.instructor.id;

					await strapi.db.query("api::").create({ data: data });


					await strapi.db.query("api::curso.curso").update({
						where: { id: curso1.id },
						data: { cantidadEstudiantes: curso1.cantidadEstudiantes + 1 },
					});



					
				}
				

				return ctx.redirect(`${URL_FRONT}/payment-success/`);


			}






		},

		async cardnetFailedPurchase(ctx) {

			const { SESSION: session } = ctx.request.body;


			if (!session) {

				return ctx.badRequest("Ha ocurrido un error", { error: "No se ha encontrado el session" });
			}


			// busco el pedido por session. 


			let pedido = await strapi.db.query("api::pedido.pedido").findOne({

				where: {
					cardnetSession: session
				}
			});



			if (!pedido) {


				return ctx.badRequest("Ha ocurrido un error", { error: "No se encuentra un pedido asociado a dicha session" });

			}


			try {
				var { data } = await axios.get(`${CARDNET_ACCESS_LINK}/sessions/${pedido.cardnetSession}?sk=${pedido.cardnetSk}`)



				await strapi.entityService.update("api::pedido.pedido", pedido.id, {
					data: {
						cardNetDataResponse: {
							...data,
							textResponse: codigosDeRespuestaCardnet[data.ResponseCode]
						},
						estado: data.ResponseCode == '00' ? 'completado' : 'rechazado'
					}
				});


			} catch (error) {
				console.log(error)

				return ctx.redirect(`${URL_FRONT}/payment-failure?error=${error.message}`);





			}

			if (data.ResponseCode != '00') {

				return ctx.redirect(`${URL_FRONT}/payment-failure?error=${codigosDeRespuestaCardnet[data.ResponseCode]}&code=${data.ResponseCode}`);
			} else {

				return ctx.redirect(`${URL_FRONT}/payment-success/`);


			}



		},

		async checkout(ctx) {




			const sig = ctx.request.headers['stripe-signature'];

			console.log("sig", ctx.request.body[unparsed]);

			let event;

			try {

				event = stripe.webhooks.constructEvent(ctx.request.body[unparsed], sig, STRIPE_WEBHOOK_SECRET);
			} catch (err) {
				console.log(err.message);
				ctx.badRequest(`Webhook Error: ${err.message}`, { error: 'Ha ocurrido un error con el Webhook' });


				return ctx.badRequest(`Webhook Error: ${err.message}`);
			}




			switch (event.type) {
				case 'checkout.session.async_payment_failed':
					const checkoutSessionAsyncPaymentFailed = event.data.object;
					// Luego defina y llame a una función para manejar el evento checkout.session.async_payment_failed


					console.log("checkout.session.async_payment_failed", checkoutSessionAsyncPaymentFailed);

					break;
				case 'checkout.session.async_payment_succeeded':
					const checkoutSessionAsyncPaymentSucceeded = event.data.object;

					console.log("checkoutSessionAsyncPaymentSucceeded", checkoutSessionAsyncPaymentSucceeded);




					break;
				case 'checkout.session.completed':
					const checkoutSessionCompleted = event.data.object;
					// Then define and call a function to handle the event checkout.session.completed
					//console.log("checkoutSessionCompleted", checkoutSessionCompleted);


					// busco el pedido en la base de datos por el id de la sesion de stripe


					let pedido = await strapi.db.query("api::pedido.pedido").findOne({

						where: { stripe_sesion_id: checkoutSessionCompleted.id },

						populate: ['usuario', 'cursos']
					});



					// actualizo el estado del pedido a pagado

					if (checkoutSessionCompleted.payment_status === 'paid') {

						let session = await stripe.checkout.sessions.retrieve(checkoutSessionCompleted.id,
							{ expand: ['customer', 'payment_intent'] }
						);


						if (!session) {
							console.log("no se encontro la sesion");
							return ctx.badRequest(`Pago no procesado aún `, { error: 'El pago aún no es efectivo' })


						}

						session = session.payment_intent;


						let data = {

							estado: 'completado',
							raw: JSON.stringify(checkoutSessionCompleted)


						}



						await strapi.db.query("api::pedido.pedido").update(
							{
								where: { id: pedido.id },
								data: data

							});

						for (let i = 0; i < pedido.cursos.length; i++) {

							const curso = pedido.cursos[i];

							data = {

								usuario: pedido.usuario.id,

								curso: curso.id,


								progress: 0,

							}

							let misCurso = await strapi.db.query("api::").findOne({

								where: { usuario: pedido.usuario.id, curso: curso.id }

							});

							if (misCurso) {

								continue;

							}

							const curso1 = await strapi.db.query("api::curso.curso").findOne({
								where: { id: curso.id },
								populate: ['instructor']
							});

							data.instructor = curso1.instructor.id;

							await strapi.db.query("api::").create({ data: data });


							await strapi.db.query("api::curso.curso").update({
								where: { id: curso1.id },
								data: { cantidadEstudiantes: curso1.cantidadEstudiantes + 1 },
							});
						}

						if (pedido.destinatarios) {

							let destinations = JSON.parse(pedido.destinatarios);

							for (let i = 0; i < destinations.length; i++) {

								await stripe.transfers.create({

									amount: destinations[i].amount,

									currency: 'usd',

									destination: destinations[i].account,

									source_transaction: session.latest_charge



								});
							}

						}




					} else {


						console.log("cancelado", checkoutSessionCompleted);


						let data = {

							estado: 'cancelado',
							raw: JSON.stringify(checkoutSessionCompleted)


						}

						await strapi.db.query("api::pedido.pedido").update(
							{
								where: { id: pedido.id },
								data: data

							});



					}

					break;
				case 'checkout.session.expired':
					const checkoutSessionExpired = event.data.object;
					console.log("checkout.session.expired", checkoutSessionExpire);
					// Then define and call a function to handle the event checkout.session.expired
					break;
				// ... handle other event types
				default:
					console.log(`Unhandled event type ${event.type}`);
					console.log(event);
			}

			// Return a response to acknowledge receipt of the event

			return ctx.send('ok');

		},

		async webhookPaypal(ctx) {

			try {
				const sig = ctx.request.headers;

				//		console.log("sig", sig);

				const valores = ctx.request.body;

				const response = await axios({
					url: `${PAYPAL_URL}/v1/oauth2/token`,
					method: 'post',
					headers: {
						'Accept': 'application/json',
						'Accept-Language': 'en_US',
						'Authorization': `Basic ${Buffer.from(`${PAYPAL_ID_CLIENT}:${PAYPAL_SECRET_KEY}`).toString('base64')}`
					},
					data: 'grant_type=client_credentials'
				});


				let datos = {

					"auth_algo": sig['paypal-auth-algo'],
					"cert_url": sig['paypal-cert-url'],
					"transmission_id": sig['paypal-transmission-id'],
					"transmission_sig": sig['paypal-transmission-sig'],
					"transmission_time": sig['paypal-transmission-time'],
					"webhook_id": PAYPAL_WEBHOOK_ID,
					"webhook_event": {
						"event_version": valores["event_version"],
						"resource_version": valores["resource_version"],
					}

				}


				const verification = await axios({

					url: `${PAYPAL_URL}/v1/notifications/verify-webhook-signature`,
					method: 'post',
					headers: {

						'Content-Type': 'application/json',
						'Authorization': `Bearer ${response.data.access_token}`
					},

					data: datos
				});

				console.log("verification", verification.data);

				/*	if (verification.data.verification_status !== 'SUCCESS') {
	
						console.log("error de verificacion");
	
						return ctx.badRequest(`Error de verificacion `, { error: 'Error de verificacion' })
	
					}*/

				// saco el event_type para saber que tipo de evento es

				const event_type = valores.event_type;





				switch (event_type) {

					case 'CHECKOUT.ORDER.APPROVED':


						let payment_intent = valores["resource"]["id"];


						let pedido = await strapi.db.query("api::pedido.pedido").findOne({

							where: { paymentInId: payment_intent },

							populate: ['usuario', 'cursos']
						});



						// actualizo el estado del pedido a pagado

						if (valores["resource"]["status"] == "APPROVED") {

							let data = {

								estado: 'completado',
								raw: JSON.stringify(valores)


							}



							await strapi.db.query("api::pedido.pedido").update(
								{
									where: { id: pedido.id },
									data: data

								});


							for (let i = 0; i < pedido.cursos.length; i++) {

								const curso = pedido.cursos[i];

								data = {

									usuario: pedido.usuario.id,

									curso: curso.id,


									progress: 0,

								}

								// busco el isntructor del curso 



								let misCurso = await strapi.db.query("api::").findOne({

									where: { usuario: pedido.usuario.id, curso: curso.id }

								});

								if (misCurso) {

									continue;

								}

								const curso1 = await strapi.db.query("api::curso.curso").findOne({
									where: { id: curso.id },
									populate: ['instructor']
								});

								// añado el id del instructor al curso

								data.instructor = curso1.instructor.id;

								await strapi.db.query("api::").create({ data: data });


								await strapi.db.query("api::curso.curso").update({
									where: { id: curso1.id },
									data: { cantidadEstudiantes: curso1.cantidadEstudiantes + 1 },
								});
							}


						} else {





							let data = {

								estado: 'cancelado',
								raw: JSON.stringify(valores)


							}

							await strapi.db.query("api::pedido.pedido").update(
								{
									where: { id: pedido.id },
									data: data

								});



						}

						break;

				}



				return ctx.send('ok');





			} catch (error) {
				console.log(error);
			}








		},

		formatearMontos(monto) {
			// Redondea el monto a dos decimales para manejo de montos monetarios
			return Number(monto.toFixed(2));
		},



	})
);

