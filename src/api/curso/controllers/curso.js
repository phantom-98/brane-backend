'use strict';

/**
 * curso controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

//module.exports = createCoreController('api::curso.curso');

module.exports = createCoreController('api::curso.curso', ({ strapi }) =>  ({

	// Method 2: Wrapping a core action (leaves core logic in place)
	async find(ctx) {
			// some custom logic here
			ctx.query = { ...ctx.query, local: 'en' }

	
			// Calling the default core action
			const { data, meta } = await super.find(ctx);

			console.log(data);

			// recorro los cursos y anexo el profesor

			for (let i = 0; i < data.length; i++) {
				const curso = data[i];
				curso.profesor =		await strapi.db.query('api::curso.curso').findOne({ // uid syntax: 'api::api-name.content-type-name'
					where: {
							id:	curso.id,
					},
					populate: { instructor: true },
			});

			}



			// some more custom logic
			meta.date = Date.now()

			return { data, meta };
	},




}));