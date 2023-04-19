module.exports = {
	routes: [
			{
					method: "GET",
					path: "/mis-curso/public/:slug",
					handler: "mis-curso.findCursoByUser",
			},
			{

				method: "GET",
				path: "/estudiante/profesores/me",
				handler: "mis-curso.findMyProfesores",
		},

	],
};