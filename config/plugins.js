module.exports = ({ env }) => ({

	slugify: {
			enabled: true,
			config: {
					contentTypes: {
							curso: {
									field: 'slug',
									references: 'name',
							},
					},
			},
	},

});