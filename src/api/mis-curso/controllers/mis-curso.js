"use strict";

/**
 * mis-curso controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const puppeteer = require('puppeteer');
const path = require('path');
const { promises } = require("dns");

module.exports = createCoreController(
  "api::mis-curso.mis-curso",
  ({ strapi }) => ({
    //modifico el metodo find para que me traiga los cursos que estan en el usuario logueado
    async find(ctx) {
      const user = ctx.state.user;

      // si no hay usuario

      if (!user) {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: "No autorizado",
                message: "No autorizado",
              },
            ],
          },
        ]);
      }

      // si hay usuario, le agrego el filtro de usuario

      ctx.query.filters = {
        ...(ctx.query.filters || {}),
        usuario: user.id,
      };

      //recorro las valoraciones que tiene el usuario y si tiene valoraciones las agrego en la respuesta

      let data = await super.find(ctx);



      for (let i = 0; i < data.data.length; i++) {

        console.log("usuario", user.id)
        let valoracion = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findOne({
            where: { usuario: user.id, curso: data.data[i].attributes.curso.data.id },
          });

        if (valoracion) {
          data.data[i].attributes.valoracion = valoracion.valoracion;
        }
      }


      return data;
    },


    //modifico el metodo create para que cuando se cree mis curso se agregue el campo progress con valor 0
    async create(ctx) {
      const user = ctx.state.user;

      // si no hay usuario

      if (!user) {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: "No autorizado",
                message: "No autorizado",
              },
            ],
          },
        ]);
      }

      // si hay usuario, le agrego el filtro de usuario

      ctx.request.body.data.usuario = user.id;
      ctx.request.body.data.progress = 0;

      //obtengo el curso que se quiere agregar

      const curso = await strapi.db.query("api::curso.curso").findOne({
        where: { id: ctx.request.body.data.curso },
        //populo el instructor
        populate: {instructor: true},
      });

      //si no hay curso

      if (!curso) {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: "No se encontró el curso",
                message: "No se encontró el curso",
              },
            ],
          },
        ]);
      }

     // console.log("curso", ctx.request.body.data.curso);
      //actualizo el numero de usuarios que tiene el curso
      console.log("curso", curso.instructor)
      await strapi.db.query("api::curso.curso").update({
        where: { id: curso.id },
        data: { cantidadEstudiantes: curso.cantidadEstudiantes + 1 },
      });

      //creo una notificacion para el instructor
      
      await strapi.db.query("api::notificacion.notificacion").create({
        data: {
          user: curso.instructor.id,
          tipo: "curso",
          descripcion: `El usuario ${user.nombre} ${user.apellidos} se ha inscrito en tu curso ${curso.nombre}`,
          estado: false,
          fecha: Date.now(),
          url: `/curso/${curso.slug}`,
        },
      });

      return super.create(ctx);
    },
    async findCursoByUser(ctx) {
      ctx.query = { ...ctx.query, local: "en" };

      const slug = ctx.params.slug;

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { slug: slug },
          select: ["id"],
        });

      if (!user) return ctx.notFound("No se encontró el usuario");

      // si hay busco todos los cursos que tiene el usuario

      ctx.query.filters = {
        ...(ctx.query.filters || {}),

        usuario: user.id,
      };

      // añado el parametro populate=curso para que me traiga el curso

      ctx.query.populate = "curso";

      const { data, meta } = await super.find(ctx);

      if (!data) return ctx.notFound("No se encontraron cursos");

      // recorro los cursos y anexo el instructor

      for (let i = 0; i < data.length; i++) {
        let curso = data[i];

        curso = await strapi.db
          .query("api::curso.curso")
          .findOne({
            where: { id: curso.attributes.curso.data.id },
            populate: true,
          });

        let instructor = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: {
              id: curso.instructor.id,
            },
            //selecciono solo el instructor
            populate: true,
          });

        let arrayEliminar = [
          "password",
          "provider",
          "resetPasswordToken",
          "confirmationToken",
          "confirmed",
          "blocked",
          "username",
          "createdBy",
          "updatedBy",
          "publishedAt",
        ];
        arrayEliminar.forEach((element) => {
          delete instructor[element];
        });

        // borro curso de data[i]
        if (data[i].attributes.curso) {
          delete data[i].attributes.curso;
        }

        if (curso) {
          delete curso.instructor;
        }

        if (curso.createdBy) {
          delete curso.createdBy;
        }

        if (curso.updatedBy) {
          delete curso.updatedBy;
        }

        data[i] = { ...data[i], curso: curso, instructor: instructor };
      }

      //recorro las valoraciones que tiene el usuario por curso y si tiene valoraciones las agrego en la respuesta

      meta.date = Date.now();

      return { data, meta };

    },
    async findMyProfesores(ctx) {


      // recibo el usuario logueado

      const user = ctx.state.user;

      // verifico que sea usuario y tenga role instructor

      if (!user) {
        //ctx.response.status	= 401;
        return ctx.response.unauthorized([

          {
            id: "No autorizado",

            message: "No autorizado",
          },

        ]);
      }



      // busco mis cursos populando el campo instructor

      const cursos = await strapi.db.query("api::mis-curso.mis-curso").findMany({ where: { usuario: user.id }, populate: ['instructor', 'instructor.avatar'] });


      // recorro cursos y creo un array  que tenga profesores unicos con los sigueintes campos id, nombre, apellido, slug, avatar

      let profesores = [];

      // uso for para poder usar async await

      for (let i = 0; i < cursos.length; i++) {

        let profesor = cursos[i].instructor;

        //let profesor = curso.instructor;

        let existe = profesores.find((profe) => profe.id === profesor.id);

        if (!existe) {



          if (profesor.avatar) {

            if (profesor.avatar.formats) {

              if (profesor.avatar.formats.thumbnail) {

                profesor.avatar = profesor.avatar.formats.thumbnail.url;

              }

            }

          } else {
            profesor.avatar = false;
          }


          profesores.push({ id: profesor.id, nombre: profesor.nombre + " " + profesor.apellidos, slug: profesor.slug, avatar: profesor.avatar });

        }
      }

      return ctx.send({ data: profesores });




    },

    async addUserToCourse(ctx) {


      console.log("addUserToCourse");

      const empresa = ctx.state.user;

      if (!empresa) {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No esta logueado",
          },

        );
      }

      
      //verifico sea tipo empresa

      if (empresa.role.type !== "empresa") {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No es una empresa",
          },

        );
      }



      // recibo los datos del body

      const { curso, usuario } = ctx.request.body.data;


      
      if (!curso || !usuario) {

        return ctx.response.badRequest("Faltan datos", {"message": "Alguno de los datos no se ha recibido"});
      }


      const userEmpresa = await strapi.db.query("plugin::users-permissions.user").findOne({ where: { id: usuario, company: empresa.id } });


      if (!userEmpresa) {

        return ctx.response.badRequest("No autorizado", {"message": "No autorizado, el usuario no pertenece a la empresa"});
      }


      // verifico que el curso haya sido comprado por la empresa, es decir esté en la tabla mis-cursos


      const cursoEmpresa = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: empresa.id }, populate: ['instructor'] });


      if (!cursoEmpresa) {

        return ctx.response.unauthorized("No autorizado", {"message": "El curso no ha sido comprado por la empresa"});
      }


      // verifico que el usuario no este ya en el curso


      const usuarioCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: usuario } });


      if (usuarioCurso) {

        return ctx.response.badRequest("Ya esta en el curso", {"message": "El usuario ya esta en el curso"});



        
      }


      // creo el registro en la tabla mis-cursos


      const registro = await strapi.db.query("api::mis-curso.mis-curso").create(
        {data:{
           curso: curso, usuario: usuario, buying_company: empresa.id, course_company:true, instructor : cursoEmpresa.instructor.id 
        }}
      );




      return registro;







    },
    async deleteUserToCourse(ctx) {


      // verifico que el usuario este logueado

      const empresa = ctx.state.user;

      if (!empresa) {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No esta logueado",
          },

        );
      }

      
      //verifico sea tipo empresa

      if (empresa.role.type !== "empresa") {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No es una empresa",
          },

        );
      }



      // recibo los datos del body

      const { curso, usuario } = ctx.request.body.data;


      
      if (!curso || !usuario) {

        return ctx.response.badRequest("Faltan datos", {"message": "Alguno de los datos no se ha recibido"});
      }


      const userEmpresa = await strapi.db.query("plugin::users-permissions.user").findOne({ where: { id: usuario, company: empresa.id } });


      if (!userEmpresa) {

        return ctx.response.badRequest("No autorizado", {"message": "No autorizado, el usuario no pertenece a la empresa"});
      }


      // verifico que el curso haya sido comprado por la empresa, es decir esté en la tabla mis-cursos


      const cursoEmpresa = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: empresa.id }, populate: ['instructor'] });


      if (!cursoEmpresa) {

        return ctx.response.unauthorized("No autorizado", {"message": "El curso no ha sido comprado por la empresa"});
      }


      // verifico que el usuario no este ya en el curso


      const usuarioCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: usuario } });


      if (!usuarioCurso) {

        return ctx.response.badRequest("El usuario no está en el curso", {"message": "El usuario no está en el curso"});



        
      }


      // elimino el registro en la tabla mis-cursos


      const registro = await strapi.db.query("api::mis-curso.mis-curso").delete(

        {where: {curso: curso, usuario: usuario}}

      );


      // busco todas las clases finalizadas del usuario en el curso 


      const clasesFinalizadas = await strapi.db.query("api::clases-finalizada.clases-finalizada").findMany({ where: { curso: curso, usuario: usuario } });


      // elimino todas las clases finalizadas del usuario en el curso

      if (clasesFinalizadas.length > 0) {

        // recorro con for  porque no me funciona con forEach y las elimino

        for (let i = 0; i < clasesFinalizadas.length; i++) {

          const clase = clasesFinalizadas[i];

          await strapi.db.query("api::clases-finalizada.clases-finalizada").delete(

            {where: {id: clase.id}}

          );

        }
      }



      return registro;







    },
    async getCourseUsers(ctx) {

      // esta fucion devuleve los usuarios de la empresa, y de acuerdo al curso mandado verifica si los usaurias estan en el curso o no

      // verifico que el usuario este logueado

      const empresa = ctx.state.user;

      if (!empresa) {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No esta logueado",
          },

        );
      }


      //verifico sea tipo empresa


      if (empresa.role.type !== "empresa") {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No es una empresa",
          },

        );
      }



      // SACO EL ID DEL CURSO del params


      const { id } = ctx.params;

      if (!id) {

        return ctx.response.badRequest("Faltan datos", {"message": "No se ha recibido el id del curso"});
      }


      // verifico que el curso haya sido comprado por la empresa, es decir esté en la tabla mis-cursos


      const cursoEmpresa = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: id, usuario: empresa.id }});



      if (!cursoEmpresa) {

        return ctx.response.unauthorized("No autorizado", {"message": "El curso no ha sido comprado por la empresa"});
      }


      // busco todos los usuarios de la empresa


      const usuariosEmpresa = await strapi.db.query("plugin::users-permissions.user").findMany({ where: { company: empresa.id }, select: ['id', 'nombre', 'apellidos'] });


      // busco todos los usuarios del curso


      //RECORRO LOS USUARIOS DE LA EMPRESA Y VERIFICO SI ESTAN EN EL CURSO


  

      for (let i = 0; i < usuariosEmpresa.length; i++) {

        const usuario = usuariosEmpresa[i];

        const usuarioCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: id, usuario: usuario.id } });


        if (usuarioCurso) {

          usuario.inCourse = true;

        } else {

          usuario.inCourse = false;
        }
      }


      return usuariosEmpresa;






    },
    async obtenerCertificado(ctx) {
      


      const usuario = ctx.state.user;
      //console.log(usuario);

      if (!usuario) {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No esta logueado",
          },

        );
      }

      //obtengo el curso del params

      let {idcurso}  = ctx.params;

      if (!idcurso) {

        return ctx.response.badRequest("Faltan datos", {"message": "No se ha recibido el id del curso"});
      }

      //verifico que el curso tenga certificado y populado el instructor y el company

      const curso = await strapi.db.query("api::curso.curso").findOne({ where: { id: idcurso }, populate: ['instructor'] });
      //console.log("CURSO",curso);

     
      if (!curso.certificado) {

        return ctx.response.unauthorized("No autorizado", {"message": "El curso no tiene certificado"});
      }

      // verifico que el usuario este en el curso 

      const usuarioCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: idcurso, usuario: usuario.id }, populate: ['buying_company', 'curso', 'buying_company.avatar'] });
      let datoCompany = null;
      if(usuarioCurso.buying_company && usuarioCurso.buying_company.avatar){
        datoCompany = process.env.URL_WEB + usuarioCurso.buying_company.avatar.url;
      }
      let datos = {
        nombre: usuario.nombre + " " + usuario.apellidos,
        nombreCurso: curso.name,
        instructor: curso.instructor.nombre + " " + curso.instructor.apellidos + " | Instructor",
        logoCompany:  datoCompany,
        logoInstitucion: curso.logo_institucion? curso.logo_institucion : null,

      } 

      console.log("DATOS",datos.logoCompany);
      if (!usuarioCurso) {

        return ctx.response.unauthorized("No autorizado", {"message": "El usuario no está en el curso"});

      }

      //verifico que el curso este completado

      if(!usuarioCurso.completado){

        return ctx.response.unauthorized("No autorizado", {"message": "El usuario no ha completado el curso"});

      }

      //verifico si el curso pertece a un instructor de una institucion y fue comprado por una empresa e imprimo el certificado
      let rutaDestino = "";

      // creo una varibale filename para darle un nombre unico al certificado nombre persona + curso + fecha  

      let filename = usuario.slug +'-'+ curso.name;

      filename = filename.substring(0, 30);

      filename = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      filename = filename.replace(/ /g, "-");

      filename = filename.toLowerCase();

      // corto para que no sea tan largo

      

      filename = filename + ".pdf";



      if(usuarioCurso.curso.nombre_institucion && usuarioCurso.course_company){

        let filePath = path.join(process.cwd(), 'certificados_html', 'certificado-institucion-empresa.html');

        rutaDestino = path.join(process.cwd(), 'public/uploads/certificados', filename);
  
        rutaDestino = await this.launchPuppeteer(filePath,rutaDestino,datos);


      } else if(usuarioCurso.curso.nombre_institucion){

        let filePath = path.join(process.cwd(), 'certificados_html', 'certificado-institucion.html');

        rutaDestino = path.join(process.cwd(), 'public/uploads/certificados',   filename);
  
        rutaDestino = await this.launchPuppeteer(filePath,rutaDestino,datos);

      } else if(usuarioCurso.course_company){

        let filePath = path.join(process.cwd(), 'certificados_html', 'certificado-empresa.html');

        rutaDestino = path.join(process.cwd(), 'public/uploads/certificados', filename);
  
        rutaDestino = await this.launchPuppeteer(filePath,rutaDestino,datos);

      } else {

        let filePath = path.join(process.cwd(), 'certificados_html', 'certificado.html');

        rutaDestino = path.join(process.cwd(), 'public/uploads/certificados', filename);
  
        rutaDestino = await this.launchPuppeteer(filePath,rutaDestino,datos);

        

      }

      return ctx.response.send({url: rutaDestino});

    },

    async launchPuppeteer(urlubicacion,urldestino,datos) {
      
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();



      urlubicacion = path.join('file:///', urlubicacion);

      // Navegar a la url

      await page.goto(urlubicacion, { waitUntil: 'networkidle0' });
      /*await page.addStyleTag({
        content: `
          @media print {
            body {
              font-size: 12px;
              margin: 10px;
            }
          }
        `,
      });*/

      await page.evaluate((data) => {
        // Aquí puedes acceder y modificar el contenido del HTML
        // Puedes asignar los valores de las variables a elementos del HTML
        // Por ejemplo, puedes seleccionar un elemento por su ID y asignarle un nuevo valor
        document.getElementById('nombre').textContent = data.nombre;
        document.getElementById('nombre-curso').textContent = data.nombreCurso;
        document.getElementById('instructor').textContent = data.instructor;
       if (data.logoInstitucion){
          document.querySelector('.logo-institucion img').src = data.logoInstitucion;
        }else{
          document.querySelector('.logo-institucion img').style.display = 'none';
        }

        if(data.logoCompany){
          document.querySelector('.logo-empresa img').src = data.logoCompany;
        }else{
          document.querySelector('.logo-empresa img').style.display = 'none';
        }
      }, datos);
      console.log("DATOS",datos);
      let promesas = [];
      if(datos.logoInstitucion){
      let imagen1 = page.waitForFunction(() => {
        const img = document.querySelector('.logo-institucion img');

        return img && img.complete && img.naturalWidth > 0;

      });
      promesas.push(imagen1);
    }
    if(datos.logoCompany){
        let imagen2 = page.waitForFunction(() => {
        const img2 = document.querySelector('.logo-empresa img');
        
        return img2 && img2.complete && img2.naturalWidth > 0;
      });
      promesas.push(imagen2);
    }
    if(promesas.length > 0){
      await Promise.all(promesas);
    }
      await page.emulateMediaType('screen');
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.setViewport({ width: 1366, height: 667, deviceScaleFactor: 1 });

      await page.pdf({ path: urldestino , format: 'A4', printBackground: true , landscape: true, pageRanges: '1' , margin : {top: 0, bottom: 0, left: 0, right: 0}, scale: 0.69});
    
      await browser.close();


      return urldestino;

    }
      

  })
);
