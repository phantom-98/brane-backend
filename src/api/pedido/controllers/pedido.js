'use strict';

/**
	* pedido controller
	*/

const { createCoreController } = require('@strapi/strapi').factories;
const { STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_URL, STRIPE_ID_CLIENT, STRIPE_WEBHOOK_SECRET, REMOTE_URL } = process.env;
const stripe = require('stripe')(STRIPE_SECRET_KEY);
const unparsed = require("koa-body/unparsed.js");
const oauth = stripe.oauth;

// uuid 

const { v4: uuidv4 } = require('uuid');

module.exports = createCoreController(
	"api::pedido.pedido",
	({ strapi }) => ({
		//modifico el metodo create para que cuando se cree mis curso se agregue el campo progress con valor 0
		async create(ctx) {
			const user = ctx.state.user;








			if (!user) {

				return ctx.unauthorized("No tienes permiso",{ error: 'No autorizado' });
			}


			let { cursos, redirect } = ctx.request.body.data;




			// si no hay cursos

			if (!cursos) {

				return ctx.notFound("Revisa la información enviada",{ error: 'No hay cursos' });

			}

			// verifico que el usuario no tiene el curso comprado

			for (let i = 0; i < cursos.length; i++) {

				let mis_curso = await strapi.db.query("api::mis-curso.mis-curso").findOne({

					where: { usuario: user.id, curso: cursos[i].curso }

				});

				if (mis_curso) {

					return ctx.badRequest(`Curso ya comprado previamente `, { error: 'Uno o más cursos ya se encuentran en tu biblioteca'  })

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

					return ctx.notFound(`No existe el curso`, { error: 'No existe el curso'  });
				}

				// verfico si tiene cupon asociado y si tiene cupon asociado verifico si el cupon es valido
console.log("cursos[i].cupon", cursos[i].cupon);
				if (cursos[i].cupon) {

					console.log("CUPON");

					// busco cupon en la base de datos por nombre y  curso


					let cupon = await strapi.db.query("api::cupon.cupon").findOne({

						where: { slug: cursos[i].cupon, cursos: cursos[i].curso }
					});



					if (!cupon) {

						return  	ctx.notFound(`No existe el cupon`, { error: 'No existe el cupon'  });
					}

					if (cupon.estado !== true) {

						return ctx.badRequest("Cupón no disponible",{ error: 'El cupon no esta activo' });

					}



					if (cupon.tipo == 'porcentaje') {

						// calculo el monto del curso	con el descuento del cupon

						monto_curso = this.formatearMontos(curso.precio);

						// calculo el descuento del curso con el cupon porcentual


						cupon.valor = monto_curso * (cupon.valor/100);

					
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

				console.log("monto_curso_antes",  monto_curso);
				monto_curso = monto_curso * 100;

				console.log("monto_curso_antesx100",  monto_curso);
				monto_curso_descuento_porcentual = monto_curso_descuento_porcentual * 100;

				monto_curso_descuento_fijo = monto_curso_descuento_fijo * 100;


				// defino una variable de descuento para enviar a stripe	donde esté cuañlqueira de los 3 descuentos disponibles. 




				discount = discount * 100;

				// sumo el descuento total


				discount_total += discount;




				monto_centimos += monto_curso;

				monto_centimos	= this.formatearMontos(monto_centimos) ;


				console.log("monto_curso",  monto_curso);
				console.log("monto_centimos",  monto_centimos);


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

						unit_amount : monto_curso,

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

					account: stripe_account_id.stripe_account_id,

				});



			}


			const session = await stripe.checkout.sessions.create({
				success_url: 'https://brane-app.netlify.app/successful-purchase/',
				cancel_url: 'https://brane-app.netlify.app/payment-failure/',
				line_items: line_items,
				mode: 'payment',
				customer_email: user.email,
				payment_method_types: ['card'],

			}

			);


			// si destinatarios tiene datos los serializo para enviarlos a la base de datos como un string



			if (destinations.length > 0) {

				destinations = JSON.stringify(destinations);

			} else {

				destinations = null;

			}


			// convierto la sesion en un string para enviarla a la base de datos llamda raw


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
				// monto_comision : monto_centimos - Math.round(monto_centimos * 0.2) , lo paso a string	para que no me de error en la base de datos

				monto_comision: JSON.stringify((monto_centimos - Math.round(monto_centimos * 0.2)) / 100),


				fee_comision: "20%",


				raw: raw,

				paymentInId: session.payment_intent





			}


			await super.create(ctx);


			// redirecciono	al usuario a la pagina de pago de stripe
			if (redirect) {

				return ctx.response.redirect(session.url);
			}


			return ctx.send({ url: session.url });





		},

		async checkout(ctx) {




			const sig = ctx.request.headers['stripe-signature'];



			let event;

			try {

				event = stripe.webhooks.constructEvent(ctx.request.body[unparsed], sig, STRIPE_WEBHOOK_SECRET);
			} catch (err) {
				console.log(err.message);
				ctx.badRequest(`Webhook Error: ${err.message}`, { error: 'Ha ocurrido un error con el Webhook'  });


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

							console.log("session", session);
						if(!session){
							console.log("no se encontro la sesion");
							return ctx.badRequest(`Pago no procesado aún `, { error: 'El pago aún no es efectivo'  })


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


						// ASIGNO LOS CURSOS AL USUARIO  USANDO EL CONTROLADOR CREATED DE api::mis-curso.mis-curso

						// busco el usuario que realizo el pedido



						// busco los cursos que se compraron en el pedido

						// recorro pedidos.cursos  y añado cada curso


						for (let i = 0; i < pedido.cursos.length; i++) {

							const curso = pedido.cursos[i];

							data = {

								usuario: pedido.usuario.id,

								curso: curso.id,


								progress: 0,

							}

							// verifico si el usuario ya tiene el curso

							let misCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({

								where: { usuario: pedido.usuario.id, curso: curso.id }

							});

							if (misCurso) {

								continue;

							}



							await strapi.db.query("api::mis-curso.mis-curso").create({ data: data });

							const curso1 = await strapi.db.query("api::curso.curso").findOne({
								where: { id: curso.id },
							});
							await strapi.db.query("api::curso.curso").update({
								where: { id: curso1.id },
								data: { cantidadEstudiantes: curso1.cantidadEstudiantes + 1 },
							});
						}
					console.log("================PASO!!!!!!!!!!!============================");
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


						console.log("cancelado",checkoutSessionCompleted);


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

		formatearMontos(monto){

			// recibo el monto, si es decimal retorno solo dos decimales, si es entero retorno el monto


			if(monto % 1 === 0){

				return monto;

			}else{

				return monto.toFixed(0);

			}


		}


	})
);

