const { sanitize } = require("@strapi/utils");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const auth = require("@strapi/admin/server/services/auth");

module.exports = (plugin) => {
  plugin.controllers.user.getBySlug = async (ctx) => {
    const { slug } = ctx.params;

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { slug: slug },
        // populo todos los	campos de la tabla
        populate: true,
      });

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
    }

    // si hay usuario busco la meta_data del usuario

    const meta = await strapi.db
      .query("api::meta-usuario.meta-usuario")
      .findOne({
        where: { usuario: entity.id },
        // populo todos los	campos de la tabla
      });

    //añado la meta_data al usuario

    entity.metaData = meta;

    // elimino el password de la respuesta , updateBy y createBy

    let dataDelete = [
      "password",
      "updatedBy",
      "createdBy",
      "resetPasswordToken",
      "confirmationToken",
      "provider",
    ];

    // elimino los campos que no quiero que se muestren en la respuesta

    dataDelete.forEach((item) => {
      delete entity[item];
    });

    return entity;
  };

  //controlador para cambiar el rol de un usuario de estudiante a instructor
  plugin.controllers.user.roleInstructor = async (ctx) => {
    console.log("entro al controlador");
    //obtengo el id del usuario del token
    const id = ctx.state.user.id;

    console.log(id);

    //busco el usuario
    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id },
        // populo todos los	campos de la tabla
        populate: true,
      });

    let = message = [];

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
      message.push("No se encontró el usuario");
    }
    //obtengo el rol del usuario
    const role = entity.role.id;

    //si el usuario ya es instructor retorno un error 400

    if (entity.role.id == 3) {
      return ctx.badRequest("El usuario ya es instructor");
      message.push("El usuario ya es instructor");
    }

    //si el usuario no es estudiante retorno un error 400

    if (entity.role.id != 1) {
      return ctx.badRequest("El usuario no es estudiante");
      message.push("El usuario no es estudiante");
    }

    //actualizo el rol del usuario y le asigno el rol de instructor

    const entityActualizada = await strapi.db
      .query("plugin::users-permissions.user")
      .update({
        where: { id: id },
        data: {
          role: 3,
        },
      });

    console.log("Update", entityActualizada);
    //retorno el usuario actualizado

    return entityActualizada;
  };

  //controlador para crear un usuario desde la empresa
  plugin.controllers.user.companyCreateUser = async (ctx) => {
    //obtengo el id del usuario del token
    const id = ctx.state.user.id;

    //busco el usuario

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id },
        // populo todos los	campos de la tabla
        populate: true,
      });

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
    }

    //obtengo el rol del usuario
    const rol = entity.role.id;

    //si el usuario no es empresa retorno un error 400

    if (rol != 4) {
      return ctx.badRequest("El usuario no es empresa");
    }

    //obtengo los datos del body

    let { username, email, password, nombre, apellidos, role } =
      ctx.request.body.data;

    //los campos username , email, password  name,  apellidos y role son obligatorios

    if (!email || !password || !role) {
      return ctx.badRequest("Faltan campos obligatorios");
    }

    //valido que el rol sea estudiante o instructor

    if (role != 1 && role != 3) {
      return ctx.badRequest("No puedes crear un usuario con ese rol");
    }

    //valido que el usuario no exista

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { email: email },
        // populo todos los	campos de la tabla
        populate: true,
      });

    if (user) {
      return ctx.badRequest("El usuario ya existe");
    }

    //encripto la contraseña

    const hashPassword = (password) => bcrypt.hash(password, 10);
    password = await hashPassword(password);
    //password = await auth.hashPassword(password);

    //creo el usuario asignandole el campo company con el id de la empresa

    const entityActualizada = await strapi.db
      .query("plugin::users-permissions.user")
      .create({
        data: {
          username: email,
          email: email,
          password: password,
          /* nombre: nombre,
          apellidos: apellidos,*/
          role: role,
          company: entity.id,
          provider: "local",
          confirmed: true,
          demo: entity ? entity.demo : false,
        },
      });

    //retorno el usuario actualizado

    return entityActualizada;
  };
  //controlador para eliminar un usuario desde la empresa
  plugin.controllers.user.companyDeleteUser = async (ctx) => {
    console.log("entro al controlador");

    //obtengo el id del usuario del token
    const id = ctx.state.user.id;

    //busco el usuario

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id },
        // populo todos los	campos de la tabla
        populate: true,
      });

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
    }

    //obtengo el rol del usuario
    const rol = entity.role.id;

    //si el usuario no es empresa retorno un error 400

    if (rol != 4) {
      return ctx.badRequest("El usuario no es empresa");
    }

    //obtengo el id del que quiero eliminar

    const idUser = ctx.params.id;

    //busco el usuario a eliminar

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: idUser },
        // populo todos los	campos de la tabla
        populate: true,
      });

    //si no existe el usuario retorno un error 404

    if (!user) {
      return ctx.notFound("No se encontró el usuario");
    }

    //si el usuario no pertenece a la empresa retorno un error 400

    if (user.company.id != entity.id) {
      return ctx.badRequest("El usuario no pertenece a la empresa");
    }

    //elimino el usuario

    const entityActualizada = await strapi.db

      .query("plugin::users-permissions.user")
      .delete({
        where: { id: idUser },
      });

    //retorno el usuario actualizado

    return entityActualizada;
  };

  //controlador para actualizar un usuario desde la empresa
  plugin.controllers.user.companyUpdateUser = async (ctx) => {
    //obtengo el id del usuario del token
    const id = ctx.state.user.id;

    //busco el usuario

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id },
        // populo todos los	campos de la tabla
        populate: true,
      });

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
    }

    //obtengo el rol del usuario
    const rol = entity.role.id;

    //si el usuario no es empresa retorno un error 400

    if (rol != 4) {
      return ctx.badRequest("El usuario no es empresa");
    }

    //obtengo el id del que quiero actualizar

    const idUser = ctx.params.id;

    //busco el usuario a actualizar

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: idUser },
        // populo todos los	campos de la tabla
        populate: true,
      });

    //si no existe el usuario retorno un error 404

    if (!user) {
      return ctx.notFound("No se encontró el usuario");
    }

    //si el usuario no pertenece a la empresa retorno un error 400

    if (user.company.id != entity.id) {
      return ctx.badRequest("El usuario no pertenece a la empresa");
    }

    //obtengo los datos del body

    let { email, password, nombre, apellidos, role } = ctx.request.body.data;

    //valido que el rol sea estudiante o instructor

    //verifico si se actialuzo el rol

    if (role) {
      //valido que el rol sea estudiante o instructor
      if (role != 1 && role != 3) {
        return ctx.badRequest("No puedes crear un usuario con ese rol");
      }
    }

    //verifico si se actualizo la contraseña y la encripto

    if (password) {
      const hashPassword = (password) => bcrypt.hash(password, 10);
      password = await hashPassword(password);
    }

    //actualizo el usuario

    const entityActualizada = await strapi.db
      .query("plugin::users-permissions.user")
      .update({
        where: { id: idUser },

        data: {
          email: email,
          username: email,
          password: password,
          nombre: nombre,
          apellidos: apellidos,
          role: role,
        },
      });

    //retorno el usuario actualizado

    return entityActualizada;
  };

  //controlador para obtener los usuarios de una empresa y que tengan un curso en mis cursos
  plugin.controllers.user.companyUsers = async (ctx) => {
    console.log("entro al controlador");
    //obtengo el id del usuario del token
    const id = ctx.state.user.id;
    //console.log(id);
    //busco el usuario

    //saco los filtros que me vengan por query 

<<<<<<< HEAD
    let nombre = ctx.request.query.nombre ;
=======
    let { name, fecha} = ctx.request.query
>>>>>>> ef0963c93d9c2ebe9f1ac9581f98fdf3f3a9411c

   let  cursoFiltro = ctx.request.query.curso

   console.log(cuecha)

    

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id },
        // populo todos los	campos de la tabla
        populate: true,
      });

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
    }

    //obtengo el rol del usuario
    const rol = entity.role.id;

    //si el usuario no es empresa retorno un error 400

    if (rol != 4) {
      return ctx.badRequest("El usuario no es empresa");
    }

    //busco los usuarios que pertenecen a la empresa y que tengan un curso en mis cursos

    const users = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({
        where: {
          company: id,
        },
        select: ["id", "nombre", "apellidos"],
        // populo todos los	campos de la tabla
        
      });
    //busco si los usuario tiene un curso en mis cursos
    //console.log("users",users.length);
    for (let i = 0; i < users.length; i++) {
     // const user = users[i].id;
      //console.log("user",users[i].id)
      //console.log("user dentro del for",user);
      const curso = await strapi.db.query("api::mis-curso.mis-curso").findMany({
        where: {
          usuario: users[i].id,
          // si viene el curso por query filtro por el curso

          curso: cursoFiltro ? cursoFiltro : null,
          
        },
        // populo todos los	campos de la tabla
        populate: {curso:true},
      });
      //console.log("curso",curso);
      //si el usuario tiene un curso en mis cursos recorro los cursos y traigo las clases completadas que tiene del curso y el progreso del curso y lo guardo en el usuario

      if (curso.length > 0) {
        //console.log("entro al if");

        for (let j = 0; j < curso.length; j++) {

          //calculo el porcentaje de progreso del curso;

          //busco en la tabla de clases completadas las clases completadas del curso
          const clasesFinalizadas = await strapi.db
            .query("api::clases-finalizada.clases-finalizada")
            .findMany({
              where: {
                curso: curso[j].curso.id,
              },
              // populo todos los	campos de la tabla
              populate: true,
            });

          //console.log("clasesFinalizadas",clasesFinalizadas);
          //sumo la duracion de las clases completadas del curso y lo guardo en la variable activityRatio

          //clases finalizadas.length es cero activityRatio es cero


          let activityRatio = 0;
          for (let k = 0; k < clasesFinalizadas.length; k++) {

            //si duracion es null le asigno 0
            if (clasesFinalizadas[k].clase.duracion == null) {
              clasesFinalizadas[k].clase.duracion = 0;
            }

            activityRatio =
              activityRatio + parseFloat(clasesFinalizadas[k].clase.duracion);
            
            
            //console.log("activityRatio", activityRatio + " " + users[i].id);
          }
          users[i].curso = curso;
          users[i].curso[j].activityRatio = activityRatio;

          //elimilo los campos que no necesito

          delete users[i].curso[j].curso.createdAt;
          delete users[i].curso[j].curso.updatedAt;
          delete users[i].curso[j].curso.publishedAt;
          delete users[i].curso[j].curso.descripcion;
          delete users[i].curso[j].curso.precio;
          delete users[i].curso[j].curso.tipo;
          delete users[i].curso[j].curso.certificado;
          delete users[i].curso[j].curso.cupon_descuento;
          delete users[i].curso[j].curso.slug;
          delete users[i].curso[j].curso.averageScore;
          delete users[i].curso[j].curso.idioma;
          delete users[i].curso[j].curso.cantidadEstudiantes;
          delete users[i].curso[j].curso.subTitles;
          delete users[i].curso[j].curso.whatYouWillLearn;
          delete users[i].curso[j].curso.requirements;
          delete users[i].curso[j].curso.additionalResources;
          delete users[i].curso[j].curso.status;
          delete users[i].curso[j].curso.shortDescription;
          delete users[i].curso[j].curso.whoIsThisCourseFor;
          delete users[i].curso[j].curso.precioDescuento;
          //delete users[i].curso[j].createdAt;
          delete users[i].curso[j].updatedAt;
          delete users[i].curso[j].id;
          delete users[i].curso[j].completado;
          delete users[i].curso[j].course_company;
        }

      }
    }

    


    //si no hay usuarios retorno un error 400

    if (users.length == 0) {
      return ctx.badRequest("No hay usuarios para esta empresa");
    }

    //elimino los usuarios que no tienen un curso en mis cursos

    for (let i = 0; i < users.length; i++) {
      if (!users[i].curso) {
        users.splice(i, 1);
      }
    }

    //retorno los usuarios

    return users;
  };

  //controlador para registro  de usuario de tipo empresa

  plugin.controllers.user.companyRegister = async (ctx) => {
    //obtengo los datos del body

    let { email, password, nombre } = ctx.request.body.data;

    //valido que el email no este registrado

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { email: email },
        // populo todos los	campos de la tabla
        populate: true,
      });

    //si el usuario existe retorno un error 400

    if (user) {
      return ctx.badRequest("El email ya esta registrado");
    }

    //encripto la contraseña

    const hashPassword = (password) => bcrypt.hash(password, 10);
    password = await hashPassword(password);

    //creo el usuario

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .create({
        data: {
          email: email,
          username: email,
          password: password,
          nombre: nombre,
          provider: "local",
          role: 4,
          demo: true,
          demoStartDate: new Date(),
        },
      });

    //retorno el usuario

    return entity;
  };

  plugin.routes["content-api"].routes.push(
    {
      method: "GET",
      path: "/users/slug/:slug",
      handler: "user.getBySlug",
      config: {
        prefix: "",
      },
    },
    {
      method: "GET",
      path: "/users/roleInstructor/",
      handler: "user.roleInstructor",
    },
    {
      method: "POST",
      path: "/users/companyCreateUser/",
      handler: "user.companyCreateUser",
      config: {
        prefix: "",
      },
    },
    {
      method: "DELETE",
      path: "/users/companyDeleteUser/:id",
      handler: "user.companyDeleteUser",
      config: {
        prefix: "",
      },
    },
    {
      method: "PUT",
      path: "/users/companyUpdateUser/:id",
      handler: "user.companyUpdateUser",
      config: {
        prefix: "",
      },
    },
    {
      method: "GET",
      path: "/users/companyUsers/",
      handler: "user.companyUsers",
    },
    {
      method: "POST",
      path: "/users/companyRegister/",
      handler: "user.companyRegister",
    }
  );

  return plugin;
};
