'use strict';

/**
	* support controller
	*/

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::support.support', ({ strapi }) => ({

	async create(ctx) {

		// verifico esté logueado

		const user = ctx.state.user;

		if (!user) {
			return ctx.unauthorized();
		}



		const { type, subject, message, curso, clase, path } = ctx.request.body.data;



		// verifico ningun dato esté vacío


		if (type === '' || subject === '' || message === '' || curso === '' || clase === '' || path === '') {

			return ctx.badRequest(null, [{ messages: [{ id: 'error.empty' }] }]);

		}

		let data;

		// verifico type sea unno de los tipos video_class billing other


		if (type !== 'video_class' && type !== 'other' && type !== 'billing') {

			return ctx.badRequest(null, [{ messages: [{ id: 'error.type', message: 'type no valido' }] }]);



		}


		if (type === 'video_class') {

			data = {

				creator: user.id,

				type,

				subject,

				message,

				videoSupport: {

					path,

					curso,

					clase

				},

				date: new Date(),

				state: "open"

			}




			let misCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({

				where: { usuario: user.id, curso: curso }

			});


			if (!misCurso) {

				// retorno un error 400


				return ctx.badRequest(null, [{ messages: [{ id: 'error.curso', message: 'No has comprado este curso' }] }]);




			}


			// verifico la clase pertenezca al curso


			let claseCurso = await strapi.db.query("api::clase.clase").findOne({

				where: {

					curso: curso,

					clase: clase

				}
			})


			if (!claseCurso) {


				return ctx.badRequest(null, [{ messages: [{ id: 'error.clase', message: 'Esta clase no pertenece al curso indicado' }] }]);





			}

		}



		ctx.request.body.data = data;

		return await super.create(ctx);



	},

	async find(ctx) {

		const user = ctx.state.user;

		if (!user) {
			return ctx.unauthorized();
		}


		// verifico el rol del usuario

		if (user.role.id != 5) {


			// si es distinto a admin, solo puedo ver mis tickets de support


			ctx.query.filters = {
				...(ctx.query.filters || {}),
				creator: user.id,
			};

			//recorro las valoraciones que tiene el usuario y si tiene valoraciones las agrego en la respuesta

			let data = await super.find(ctx);

			for (let i = 0; i < data.data.length; i++) {

				delete data.data[i].attributes.createdAt;
				delete data.data[i].attributes.updatedAt;


			}


			return data;




		} else {


			return await super.find(ctx);

		}



	},

	async findOne(ctx) {

		const user = ctx.state.user;

		const id = ctx.params.id;



		if (!user) {
			return ctx.unauthorized();
		}

		if (!id) {

			return ctx.badRequest(null, [{ messages: [{ id: 'error.id', message: 'id no valido' }] }])




		}		// verifico el rol del usuario

		if (user.role.id != 5) {


			let data = await strapi.db.query("api::support.support").findOne({

				where: { creator: user.id, id: ctx.params.id }

			});

			if (!data) {
				return ctx.notFound(null, [{ messages: [{ id: 'error.support', message: 'No existe el ticket' }] }])
			}



			delete data.createdAt;
			delete data.updatedAt;

			return { data: {id:data.id, attributes:data}, meta: {} };


			 



		} else {


			return await super.findOne(ctx);

		}



	},

	

	



}));
