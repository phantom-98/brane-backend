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

		let  data = await super.find(ctx);

		// recorro los cursos y elimino el campo usuario

console.log(data);
		if (data.data) {
			data.data.forEach((element) => {

				console.log(element.attributes);

				delete element.attributes.usuario;

			});
		}

		return data

	},
	//modifico el metodo create para que cuando se cree mis curso se agregue el campo progress con valor 0
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

		// si hay usuario, le agrego el filtro de usuario		

		ctx.request.body.data.usuario = user.id;
		ctx.request.body.data.progress = 0;

		return super.create(ctx);
	},
})
)