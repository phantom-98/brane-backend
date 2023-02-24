module.exports = ({ env }) => ({

	slugify: {
			enabled: true,
			config: {
				slugifyWithCount: true,
				shouldUpdateSlug:	true,
					contentTypes: {
							curso: {
									field: 'slug',
									references: 'name',
							},
					},
			},
	},

});