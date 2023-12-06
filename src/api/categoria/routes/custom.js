// añado ruta perzonalizada 


module.exports = {
    routes: [
      {
        method: "GET",
        path: "/categorias/slug/:slug",
        handler: "categoria.findBySlug",
      },
    ],
  };