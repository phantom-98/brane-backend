'use strict';

/**
	* meta-usuario controller
	*/

const { createCoreController } = require('@strapi/strapi').factories;


module.exports = createCoreController('api::meta-usuario.meta-usuario', ({ strapi }) => ({

	// creo medodo me devuelve la meta data del usuario logueado

	async me(ctx) {

		const user = ctx.state.user;

		// si no hay usuario 

		if (!user) {
			return ctx.badRequest(null, [
				{

					messages: [
						{
							id: 'No autorizado',
							message: 'No autorizado',
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

							id: 'No tienes una meta creada',

							message: 'No tienes una meta creada',

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
							id: 'No autorizado',
							message: 'No autorizado',
						},
					],
				},
			]);
		}

		// si hay usuario, lo agrego como parametro id

		// busco el id de la meta del usuario logueado

		const meta = await strapi.db
			.query("api::meta-usuario.meta-usuario")
			.findOne({ where: { usuario: user.id }});


		console.log(meta);

		if (!meta) {

			return ctx.notFound(null, [

				{

					messages: [

						{

							id: 'No tienes una meta creada',

							message: 'No tienes una meta creada',

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

							id: 'No autorizado',

							message: 'No autorizado',

						},

					],

				},

			]);

		}

		console.log("USER",user);


		// verifico si el usuario logueado es admin con el role 5 

		if (user.role.id != 5) {

			// si es distinto al admin, inyecto el id del usuario logueado en el campo usuario

			ctx.request.body.data.usuario = user.id;

		}

		console.log("BODY",ctx.request.body);

		// verifico quue el usuario no tenga ya una meta creada



		const meta = await strapi.db
			.query("api::meta-usuario.meta-usuario")
			.findOne({ where: { usuario: user.id }});

		console.log("META",meta);

		if (meta) {

			return ctx.badRequest(500, [

				{

					messages: [

						{

							id: 'Ya tienes una meta creada',

							message: 'Ya tienes una meta creada',

						},

					],

				},

			]);

		}




		return super.create(ctx);

	}


})
)