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

    let passwordNoCo = password;

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


    
      // variable html con el contenido del email mostrando al suusrio su contraseña y su nombre de usuario

      let html = `

      <h1>¡Bienvenido a Brane!</h1>
      
      <p>Has sido registrado en la plataforma de Brane por tu empresa.</p>

      <p>Para acceder a tu cuenta, utiliza los siguientes datos:</p>

      <p>Usuario: ${email}</p>

      <p>Contraseña: ${passwordNoCo}</p>



      <a href="https://brane-app.netlify.app/auth/login" style="background-color: #2d9cdb; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Iniciar sesión</a>

      `;


/*
      await strapi.plugins['email'].services.email.send({
        to: email,
        subject: 'Tu cuenta en Brane ha sido creada con éxito',
        text: 'Hello world!',
        html: html,
      });
*/


    return entityActualizada;
  };

  //controlador para crear un usuario desde la institucion

  plugin.controllers.user.institutionCreateUser = async (ctx) => {

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
    
        //si el usuario no es institucion retorno un error 400
    
        if (rol != 6) {
          return ctx.badRequest("El usuario no es empresa");
        }
    
        //obtengo los datos del body
    
        let {  email, password, nombre, apellidos, role } =
          ctx.request.body.data;
    
        //los campos username , email, password  name,  apellidos y role son obligatorios
    
        if (!email || !password || !role) {
          return ctx.badRequest("Faltan campos obligatorios");
        }
    
        //valido que el rol sea de instructor
    
        if (role != 3) {
          return ctx.badRequest("No puedes crear un usuario con ese rol");
        }
    
        let passwordNoCo = password;
    
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
              nombre: nombre,
              apellidos: apellidos,
              role: role,
              company: entity.id,
              provider: "local",
              confirmed: true,
              demo: entity ? entity.demo : false,
            },
          });
    
    
        
          // variable html con el contenido del email mostrando al suusrio su contraseña y su nombre de usuario
    
          let html = `
    
          <h1>¡Bienvenido a Brane!</h1>
          
          <p>Has sido registrado en la plataforma de Brane por tu empresa.</p>
    
          <p>Para acceder a tu cuenta, utiliza los siguientes datos:</p>
    
          <p>Usuario: ${email}</p>
    
          <p>Contraseña: ${passwordNoCo}</p>
    
    
    
          <a href="https://brane-app.netlify.app/auth/login" style="background-color: #2d9cdb; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Iniciar sesión</a>
    
          `;
    
    
    
    /*
         await strapi.plugins['email'].services.email.send({
            to: email,
            subject: 'Tu cuenta en Brane ha sido creada con éxito',
            text: 'Hello world!',
            html: html,
          });
    
    */
    
        return entityActualizada;

  }

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

  //controlador para eliminar un usuario desde la institucion
  plugin.controllers.user.institutionDeleteUser = async (ctx) => {
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

    //si el usuario no es institucion retorno un error 400

    if (rol != 6) {
      return ctx.badRequest("El usuario no es institucion");
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
      console.log("user", user);


    //si no existe el usuario retorno un error 404

    if (!user) {
      return ctx.notFound("No se encontró el usuario");
    }

    //si el usuario no pertenece a la institucion retorno un error 400

    if (user.company.id != entity.id) {
      return ctx.badRequest("El usuario no pertenece a la institucion");
    }

    //verifico si el usuario que quiero eliminar tiene cursos asociados
     
    const cursos = await strapi.db
      .query("api::curso.curso").findMany({
        where: { instructor: idUser },
        // populo todos los	campos de la tabla
        populate: true,
      });


    //si el usuario tiene cursos asociados elimino los cursos

    if (cursos.length > 0) {
      for (let i = 0; i < cursos.length; i++) {
        const curso = cursos[i];
        const idCurso = curso.id;
        const entityCurso = await strapi.db
          .query("api::curso.curso")
          .delete({
            where: { id: idCurso },
          });
      }
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

  //controlador para actualizar un usuario desde la institucion
  plugin.controllers.user.institutionUpdateUser = async (ctx) => {
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

    if (rol != 6) {
      return ctx.badRequest("El usuario no es institucion");
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
      return ctx.badRequest("El usuario no pertenece a la institucion");
    }

    //obtengo los datos del body

    let { email, password, nombre, apellidos, role } = ctx.request.body.data;

    //valido que el rol sea estudiante o instructor

    //verifico si se actialuzo el rol

    if (role) {
      //valido que el rol sea  instructor
      if (role != 3) {
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

    let nombre = ctx.request.query.nombre;

    let cursoFiltro = ctx.request.query.curso


    console.log("NOMBRE", nombre)

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

    let whereNombre ={}
    if(nombre){

      whereNombre ={
        company: id,
        nombre:nombre, 
      } 

    }else{
      whereNombre={
        company:id
      }
    }

    const users = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({
        where: whereNombre,
        select: ["id", "nombre", "apellidos"],
        // populo todos los	campos de la tabla

      });


    //busco si los usuario tiene un curso en mis cursos
    //console.log("users",users.length);
    for (let i = 0; i < users.length; i++) {
      let where = {}
      if (cursoFiltro) {
        where = {
          usuario: users[i].id,
          curso: cursoFiltro,
        }
      } else {
        where = {
          usuario: users[i].id,
        }
      }

      const curso = await strapi.db.query("api::mis-curso.mis-curso").findMany({
        where: where,
        // populo todos los	campos de la tabla
        populate: { curso: true },
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

  //controlador para registro de usuario de tipo institucion

  plugin.controllers.user.institutionRegister = async (ctx) => {
    //obtengo los datos del body

    let { email, password, nombre, telefono, encargado, posicion } = ctx.request.body.data;

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
          role: 6,
          demo: false,
          blocked: true,
          telefono: telefono,
          encargado: encargado,
          posicion: posicion,
        },
      });

          await strapi
            .plugin('email-designer')
            .service('email')
            .sendTemplatedEmail(
              {
                // required
                to: "pitterglendys@gmail.com",
      
                // optional if /config/plugins.js -> email.settings.defaultFrom is set
              //  from: email,
      
                // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
               // replyTo: 'reply@example.com',
      
                // optional array of files
              },
              {
                // required - Ref ID defined in the template designer (won't change on import)
                templateReferenceId: 1,
      
                // If provided here will override the template's subject.
                // Can include variables like `Thank you for your order {{= USER.firstName }}!`
                subject: `Cuenta creada satisfactoriamente`,
              },
              {
                // this object must include all variables you're using in your email template
                
                  nombre: nombre,
              
              
              }
            );

            await strapi
            .plugin('email-designer')
            .service('email')
            .sendTemplatedEmail(
              {
                // required
                to: 'pitterglendys@gmail.com',
      
                // optional if /config/plugins.js -> email.settings.defaultFrom is set
              //  from: email,
      
                // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
               // replyTo: 'reply@example.com',
      
                // optional array of files
              },
              {
                // required - Ref ID defined in the template designer (won't change on import)
                templateReferenceId: 2,
      
                // If provided here will override the template's subject.
                // Can include variables like `Thank you for your order {{= USER.firstName }}!`
                subject: `Nueva cuenta de institucion creada`,
              },
              {
                // this object must include all variables you're using in your email template
                institution:{
                  nombre: nombre,
                  email: email,
                  telefono: telefono,
                  encargado: encargado,
                  posicion: posicion,
                }
              
              }
            );
        
      
        

    //retorno el usuario

    return entity;

  };

  //controlador para ver los cursos de la empresa con un reporte 
  plugin.controllers.user.companyReport = async (ctx) => {

   //obtengo el id de la empresa

    const id  = ctx.state.user.id;

    let cursoFiltro = ctx.request.query.curso

    console.log("CURSO", cursoFiltro);
    //console.log("id", id);

    //busco si el usuario es de tipo empresa

    const company = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id, role: 4 },
        // populo todos los	campos de la tabla
        populate: true,

      });

      //console.log("company", company);

      //si no es de tipo empresa retorno un error 400


    if (!company) {
      return ctx.badRequest("El usuario no es de tipo empresa");
    }


    //busco los cursos de la empresa que estan en mis cursos
    let where = {}
    if(cursoFiltro){
      where = { usuario: id, curso: cursoFiltro }
    }else{
      where = { usuario: id }
    }
    const cursos = await strapi.db
      .query("api::mis-curso.mis-curso")
      .findMany({
        where: where,
        // populo todos los	campos de la tabla

        populate: true,
      });

      console.log("cursos", cursos);
      //si no hay cursos retorno un error 400

    if (cursos.length == 0) {
      return ctx.badRequest("No hay cursos para esta empresa");
    }

    //recorro los cursos para ver las clases finalizadas

    for (let i = 0; i < cursos.length; i++) {

    
      //busco las clases finalizadas del curso

      const clasesFinalizadas = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .findMany({
          where: { curso: cursos[i].curso.id },
          // populo todos los	campos de la tabla
          populate: true,
        });

        //si hay clases finalizadas las recorro

      

        //recorro las clases finalizadas
        let activityRatio=0
        for (let k = 0; k < clasesFinalizadas.length; k++) {

          //si duracion es null le asigno 0

          if (clasesFinalizadas[k].clase.duracion == null) {
            clasesFinalizadas[k].clase.duracion = 0;
          }

          activityRatio = activityRatio + parseFloat(clasesFinalizadas[k].clase.duracion);
          
        }

        //asigno el activityRatio al curso

        cursos[i].curso.activityRatio = activityRatio;

        delete cursos[i].curso.createdAt;
        delete cursos[i].curso.updatedAt;
        delete cursos[i].curso.publishedAt;
        delete cursos[i].curso.descripcion;
        delete cursos[i].curso.precio;
        delete cursos[i].curso.tipo;
        delete cursos[i].curso.certificado;
        delete cursos[i].curso.cupon_descuento;
        delete cursos[i].curso.slug;
        delete cursos[i].curso.averageScore;
        delete cursos[i].curso.idioma;
        delete cursos[i].curso.cantidadEstudiantes;
        delete cursos[i].curso.subTitles;
        delete cursos[i].curso.whatYouWillLearn;
        delete cursos[i].curso.requirements;
        delete cursos[i].curso.additionalResources;
        delete cursos[i].curso.status;
        delete cursos[i].curso.shortDescription;
        delete cursos[i].curso.whoIsThisCourseFor;
        delete cursos[i].curso.precioDescuento;
        delete cursos[i].id;
        delete cursos[i].updatedAt;
        delete cursos[i].completado;
        delete cursos[i].course_company;
        delete cursos[i].usuario;
        delete cursos[i].instructor;
        delete cursos[i].createdBy;
        delete cursos[i].updatedBy;
        delete cursos[i].buying_company;
        delete cursos[i].progress;
        
      
    }
  
    //elimino los campos que no quiero mostrar

     

        //retorno los cursos

      return cursos; 

  };

  //controlador para ver los usuarios de la institucion

  plugin.controllers.user.institutionUsers = async (ctx) => {

    //obtengo el id de la institucion

    const id  = ctx.state.user.id;

    //busco si el usuario es de tipo institucion

    const institution = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id, role: 6 },
        // populo todos los	campos de la tabla
        populate: true,

      });

      //si no es de tipo institucion retorno un error 400

    if (!institution) {
      return ctx.badRequest("El usuario no es de tipo institucion");
    }

    //busco los usuarios de la institucion

    const users = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({
        where: { company: id },
        // populo todos los	campos de la tabla
        populate: true,
      });

      //si no hay usuarios retorno un error 400

    if (users.length == 0) {
      return ctx.badRequest("No hay usuarios para esta institucion");
    }

    //recorro los usuarios par ver los cursos que tiene como instructor

    for (let i = 0; i < users.length; i++) {

      //busco los cursos que tiene como instructor

      const cursos = await strapi.db
        .query("api::curso.curso")
        .findMany({
          where: { instructor: users[i].id },
          // populo todos los	campos de la tabla
          populate: {cantidadEstudiantes: true},
        });

        //muestro los cursos en el usuario solo el campo id, nombre y cantidad de estudiantes

        users[i].cursos = cursos.map((curso) => {
          return {
            id: curso.id,
            nombre: curso.name,
            cantidadEstudiantes: curso.cantidadEstudiantes
          };
        })

        //hago un promedio de la cantidad de estudiantes por instructor

        let ventasProfesor = 0;
        for (let k = 0; k < cursos.length; k++) {
          ventasProfesor = ventasProfesor + cursos[k].cantidadEstudiantes;
        }

        users[i].ventasProfesor = ventasProfesor ;

        


        

    }



    //elimino los campos que no quiero mostrar

    for (let i = 0; i < users.length; i++) {

    delete users[i].createdAt;
    delete users[i].updatedAt;
    delete users[i].provider;
    delete users[i].confirmed;
    delete users[i].blocked;
    delete users[i].confirmationToken;
    delete users[i].password;
    delete users[i].resetPasswordToken;
    delete users[i].role.createdAt;
    delete users[i].role.updatedAt;
    delete users[i].company.createdAt;
    delete users[i].company.updatedAt;
    delete users[i].company.password;
    delete users[i].company.resetPasswordToken;
    delete users[i].company.confirmationToken;
    delete users[i].company.confirmed;
    delete users[i].company.blocked;
    delete users[i].company.provider;
    delete users[i].company.demo;
    delete users[i].company.demoStartDate;
    delete users[i].createdBy;
    delete users[i].updatedBy;
    delete users[i].demoStartDate;
    delete users[i].demo;
    
    }


    //retorno los usuarios

    return users;

  }
  //controlador para ver los cursos que pertenecen a la institucion

  plugin.controllers.user.institutionCurso = async (ctx) => {

    //obtengo el id de la institucion

    const id  = ctx.state.user.id;

    //busco si el usuario es de tipo institucion

    const institution = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id, role: 6 },
        // populo todos los	campos de la tabla
        populate: true,

      });

      //si no es de tipo institucion retorno un error 400

    if (!institution) {
      return ctx.badRequest("El usuario no es de tipo institucion");
    }

    //busco los usuarios de la institucion para ver los cursos que tiene como instructor

    const users = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({
        where: { company: id },
        // populo todos los	campos de la tabla
        populate: true,
      });


      //si no hay usuarios retorno un error 400

    if (users.length == 0) {
      return ctx.badRequest("No hay usuarios para esta institucion");
    }

    //recorro los usuarios par ver los cursos que tiene como instructor
let cursos = [];
    for (let i = 0; i < users.length; i++) {

      //busco los cursos que tiene como instructor

      let cursoAux = await strapi.db
        .query("api::curso.curso")
        .findMany({
          where: { instructor: users[i].id },
          populate:{instructor: true},
        });
        //elimino los campos que no quiero mostrar

        for (let j = 0; j < cursoAux.length; j++) {

          delete cursoAux[j].createdAt;
          delete cursoAux[j].updatedAt;
          delete cursoAux[j].publishedAt;
          delete cursoAux[j].cupon_descuento;
          delete cursoAux[j].instructor.demo;
          delete cursoAux[j].instructor.demoStartDate;
          delete cursoAux[j].instructor.createdAt;
          delete cursoAux[j].instructor.updatedAt;
          delete cursoAux[j].instructor.provider;
          delete cursoAux[j].instructor.confirmed;
          delete cursoAux[j].instructor.blocked;
          delete cursoAux[j].instructor.confirmationToken;
          delete cursoAux[j].instructor.password;
          delete cursoAux[j].instructor.resetPasswordToken;
          delete cursoAux[j].instructor.role;
          delete cursoAux[j].instructor.company;
          delete cursoAux[j].instructor.createdBy;
          delete cursoAux[j].instructor.updatedBy;
          delete cursoAux[j].instructor.averageScore;
          delete cursoAux[j].instructor.headline;
          delete cursoAux[j].certificado;
          delete cursoAux[j].urlConferencia;
          delete cursoAux[j].precio;
          delete cursoAux[j].precioDescuento;
          delete cursoAux[j].additionalResources;
          delete cursoAux[j].requirements;

        }
       
      cursos.push(cursoAux);

    }

    //retorno los cursos

    return cursos;
    
  }



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
      method: "POST",
      path: "/users/institutionCreateUser/",
      handler: "user.institutionCreateUser",
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
      method: "DELETE",
      path: "/users/institutionDeleteUser/:id",
      handler: "user.institutionDeleteUser",
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
      method: "PUT",
      path: "/users/institutionUpdateUser/:id",
      handler: "user.institutionUpdateUser",
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
    method: "GET",
    path: "/users/institutionUsers/",
    handler: "user.institutionUsers",
  },
  { 
    method: "GET",
    path: "/users/institutionCurso/",
    handler: "user.institutionCurso",
  },
    {
      method: "POST",
      path: "/users/companyRegister/",
      handler: "user.companyRegister",
    },
    {
      method: "POST",
      path: "/users/institutionRegister/",
      handler: "user.institutionRegister",
    },
    {
      method: "GET",
      path: "/users/companyReport/",
      handler: "user.companyReport",
    },
  );

  return plugin;
};
