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

		// metodo findOne para traer la meta del usuario logueado



		// si hay usuario, lo agrego como parametro id

		ctx.params.id = user.id;
		return super.findOne(ctx);
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

		ctx.params.id = user.id;



		return super.update(ctx);

	},

	//modifico el metodo create para inyectar el id del usuario logueado en el campo usuario, al menos que quien envie	la peticion sea un admin


	async create(ctx) {

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

		// verifico si el usuario logueado es admin con el role 5 

		if (user.role.id != 5) {

			// si es distinto al admin, inyecto el id del usuario logueado en el campo usuario

			ctx.request.body.usuario = user.id;

		}
		

		return super.create(ctx);

	}


})
)