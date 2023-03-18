// añado ruta perzonalizada 


module.exports = {
    routes: [
      {
        method: "POST",
        path: "/wishlist/add-delete/",
        handler: "wishlist.addDelete",
      },
    ],
  };