const { sanitize } = require('@strapi/utils');

module.exports = (plugin) => {

	plugin.controllers.user.getBySlug = async (ctx) => {

		const { slug } = ctx.params;




		const entity = await strapi.db.query('plugin::users-permissions.user').findOne({
			where: { slug: slug },
			// populo todos los	campos de la tabla
			populate: true
	})

		// si no hay usuario retorno un error 404 

		if (!entity) {
			return ctx.notFound('No se encontró el usuario');
		}

		// si hay usuario busco la meta_data del usuario

		const meta = await strapi.db.query('api::meta-usuario.meta-usuario').findOne({
			where: { usuario: entity.id },
			// populo todos los	campos de la tabla
		})

		//añado la meta_data al usuario 

		entity.metaData = meta;



	// elimino el password de la respuesta , updateBy y createBy

	let dataDelete = ['password', 'updatedBy', 'createdBy', 'resetPasswordToken', 'confirmationToken', 'provider'];

	// elimino los campos que no quiero que se muestren en la respuesta

	dataDelete.forEach((item) => {
		delete entity[item];
	});
	



		return entity;
	}

	plugin.routes['content-api'].routes.push({
		"method": "GET",
		"path": "/users/slug/:slug",
		"handler": "user.getBySlug",
		"config": {
			prefix: ''
		}

	})

	return plugin
}