module.exports = ({ env }) => ({

	slugify: {
		enabled: true,
		config: {
			slugifyWithCount: true,
			shouldUpdateSlug: true,
			contentTypes: {
				curso: {
					field: 'slug',
					references: 'name',
				},
			},
		},
	},
	// añado condicional para que solo se ejecute en producción

	/*upload: env('NODE_ENV') === 'production' ? {
		config: {
			provider: 'cloudinary',
			providerOptions: {
				cloud_name: env('CLOUDINARY_NAME'),
				api_key: env('CLOUDINARY_KEY'),
				api_secret: env('CLOUDINARY_SECRET'),
			},
			actionOptions: {
				upload: {},
				delete: {},
			},
		},
	} : {},*/

});