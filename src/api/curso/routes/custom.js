// añado ruta perzonalizada 


module.exports = {
    routes: [
      {
        method: "GET",
        path: "/profesor/estudiantes/:slug",
        handler: "curso.miStudent",
      },
      {
        method: "GET",
        path: "/cursos/slug/:slug",
        handler: "curso.findBySlug",
      }

    ]
  };