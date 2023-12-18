'use strict';

/**
	* credit controller
	*/

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit.credit', ({ strapi }) => ({
	async findMe(ctx) {

		const { user } = ctx.state;

		if (!user) {
			return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
		}


		const data = await strapi.db.query('api::credit.credit').findOne({
			where: {
				user: user.id,
			}
		});

		return data;

	},



}));
