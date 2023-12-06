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
      //editar la conferencia

      {
        method: "PUT",
        path: "/meetings/:id",
        handler: "curso.editMeeting",

      },

      //eliminar la conferencia

      {
        method: "DELETE",
        path: "/conferencia/eliminar/:id",
        handler: "curso.deleteMeeting",

      },
      {
        method: "POST",
        path: "/conferencia/verificar/acceso",
        handler: "curso.getAccessZommMeeting",


        

      }
    ]
  };