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

		}

	})
	)