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
      },
      //registro la fucion para ingresar a una conferencia
      {
        method: "GET",
        path: "/conferencia/ingresar/:id",
        handler: "curso.registerMeeting",
      },

    ]
  };