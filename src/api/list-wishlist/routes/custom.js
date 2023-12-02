// añado ruta perzonalizada 


module.exports = {
    routes: [
      {
        method: "GET",
        path: "/list-wishlist/me/",
        handler: "list-wishlist.findMe",
      },
    ],
  };