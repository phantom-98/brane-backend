'use strict';

/**
	* mis-curso controller
	*/

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::mis-curso.mis-curso', ({ strapi }) => ({

	//modifico el metodo find para que me traiga los cursos que estan en el usuario logueado
	async find(ctx) {

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

		// si hay usuario, le agrego el filtro de usuario


		ctx.query.filters = {
			...(ctx.query.filters || {}),
			usuario: user.id,
		};
		return super.find(ctx);

	}
})
)