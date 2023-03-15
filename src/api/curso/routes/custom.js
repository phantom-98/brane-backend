// añado ruta perzonalizada 


module.exports = {
    routes: [
      {
        method: "GET",
        path: "/cursos/slug/:slug",
        handler: "curso.findBySlug",
      },
    ],
  };