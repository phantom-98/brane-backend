module.exports = {
	routes: [
			{
					method: "GET",
					path: "/mis-curso/public/:slug",
					handler: "mis-curso.findCursoByUser",
			},
	],
};