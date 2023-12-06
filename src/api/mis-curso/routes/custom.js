module.exports = {
	routes: [
		{
			method: "GET",
			path: "/mis-curso/public/:slug",
			handler: "mis-curso.findCursoByUser",
		},
		{
			method: "GET",
			path: "/estudiante/certificado/:idcurso",
			handler: "mis-curso.obtenerCertificado",
		},
		{

			method: "GET",
			path: "/estudiante/profesores/me",
			handler: "mis-curso.findMyProfesores",
		},
		{

			method: "POST",
			path: "/company/course/addUser",
			handler: "mis-curso.addUserToCourse",
		},
		{

			method: "POST",
			path: "/company/course/deleteUser",
			handler: "mis-curso.deleteUserToCourse",
		},
		{

			method: "GET",
			path: "/company/course/findUser/:id",
			handler: "mis-curso.getCourseUsers",
		},
	],
};