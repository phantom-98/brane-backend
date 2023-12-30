"use strict";

/**
 * curso controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const crypto = require('crypto')
const qs = require('qs');
const axios = require("axios");
const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_SECRET_TOKEN, ZOOM_VERIFICATION_TOKEN, ZOOM_URL, ZOOM_MEETING_SDK_SECRET, ZOOM_MEETING_SDK_KEY } = process.env;
const KJUR = require('jsrsasign')
module.exports = createCoreController("api::curso.curso", ({ strapi }) => ({
  // Method 2: Wrapping a core action (leaves core logic in place)
  async find(ctx) {
    // some custom logic here
    ctx.query = { ...ctx.query, local: "en", populate: '*' };
    console.log("ctx.query", ctx.query);
    // Calling the default core action
    const { data, meta } = await super.find(ctx);

    // recorro los cursos y anexo el instructor
    //console.log("DATA", data);
    for (let i = 0; i < data.length; i++) {
      const curso = data[i];
      // console.log("CURSO", data[i]);
      curso.attributes.instructor = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          // uid syntax: 'api::api-name.content-type-name'
          where: {
            id: curso.attributes.instructor.data.id
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
        "createdAt",
        "updatedAt",
        "publishedAt",
      ];
      arrayEliminar.forEach((element) => {
        delete curso.attributes.instructor[element];
      });
    }
    console.log("DATA");
    // some more custom logic
    meta.date = Date.now();

    return { data, meta };
  },

  // modifico el update para que solo los cursos puedan ser actualizados por el usuario que lo creó y por el adminisrador

  async update(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    // obtengo el id del curso que se quiere actualizar

    console.log(user);

    const { id } = ctx.params;

    //	si el usuario que está haciendo la petición no está logueado, no puede actualizar el curso

    if (!user) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    //	obtengo el curso que se quiere actualizarº

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true },
    });

    // si el curso no existe, no puede actualizar el curso

    if (!curso) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    // verifico que el curso tiene instructor

    // si el usuario que está haciendo la petición no es el instructor del curso ni es administrador, no puede actualizar el curso

    if (user.id != curso.instructor.id && user.role.type != "administrador") {
      return ctx.unauthorized(`You can't update this entry`);
    }
    const { subTitles, whatYouWillLearn, requeriments, whoIsThisCourseFor } =
      ctx.request.body.data;


    if (subTitles) {
      ctx.request.body.data.subTitles = JSON.stringify(subTitles);
    }

    if (whatYouWillLearn) {
      ctx.request.body.data.whatYouWillLearn = JSON.stringify(whatYouWillLearn);
    }

    if (requeriments) {
      ctx.request.body.data.requeriments = JSON.stringify(requeriments);
    }

    if (whoIsThisCourseFor) {
      ctx.request.body.data.whoIsThisCourseFor =
        JSON.stringify(whoIsThisCourseFor);
    }










    let data = [];

    const { cupon_descuento } = ctx.request.body.data;

    if (cupon_descuento) {


      const cupon = await strapi.db
        .query("api::cupon.cupon")
        .findOne({ where: { slug: cupon_descuento }, populate: true });


      // si el cupom_descuento no existe en la tabla cupon no se puede asignar el cupom_descuento al curso

      if (!cupon) {
        return ctx.badRequest("El cupom no existe", {
          messages: [
            {
              id: "Curso.validation.cupom_descuento.required",
              message: "El cupom no existe",
            },
          ],
        },);
      }


      // si el cupom_descuento existe en la tabla cupon verifico el instructor del cupon

      // si el instructor del cupon es diferente al instructor del curso no se puede asignar el cupom_descuento al curso

      if (cupon.user.id != curso.instructor.id) {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: "Curso.validation.cupom_descuento.required",
                message: "El cupom no pertenece al instructor",
              },
            ],
          },
        ]);
      }

      // si el cupom_descuento existe en la tabla cupon y el instructor del cupon es igual al instructor del curso se puede asignar el cupom_descuento al curso y en la tabla cupon se actualiza el campo curso con el id del curso creado


      data = await super.update(ctx);

      let cursos_cupon = [id, ...cupon.cursos.map((curso) => curso.id)]



      await strapi.db
        .query("api::cupon.cupon")
        .update(
          {
            where: { slug: cupon_descuento },
            data: { cursos: cursos_cupon }
          }
        );


    } else {


      data = await super.update(ctx);

    }


    return data;

  },

  verificarConstraseña(codigo) {
    const regex = /^[a-zA-Z0-9@\-_.]{1,10}$/;
    return regex.test(codigo);
  },// modifico el delete para que solo los cursos puedan ser eliminados por el usuario que lo creó y por el adminisrador

  async delete(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    // obtengo el id del curso que se quiere eliminar

    const { id } = ctx.params;

    //	si el usuario que está haciendo la petición no está logueado, no puede eliminar el curso

    if (!user) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    //	obtengo el curso que se quiere eliminar

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true },
    });

    // si el curso no existe, no puede eliminar el curso

    if (!curso) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    // verifico que el curso tiene instructor

    // si el usuario que está haciendo la petición no es el instructor del curso ni es administrador, no puede eliminar el curso

    if (user.id != curso.instructor.id && user.role.type != "administrador") {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    // si el usuario que está haciendo la petición es el instructor del curso o es administrador, puede eliminar el curso

    return await super.delete(ctx);
  },

  //	modifico el create para que solo los cursos puedan ser creados por usuariostipo instructor y por el adminisrador

  async create(ctx) {


    try {

      const user = ctx.state.user;

      //	si el usuario que está haciendo la petición no está logueado, no puede crear el curso

      if (!user) {
        return ctx.unauthorized(`You can't create this entry`);
      }

      // si el usuario que está haciendo la petición no es instructor ni es administrador, no puede crear el curso

      if (user.role.type != "instructor" && user.role.type != "administrador") {
        return ctx.unauthorized(`You can't create this entry`);
      }

      // si el usuario que esta haciendo la peticion es de tipo instructor le asigno el instructor al curso

      if (user.role.type == "instructor") {
        ctx.request.body.data.instructor = user.id;
      }


      if (!ctx.request.body.data.instructor && user.role.type != "instructor") {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: "Curso.validation.instructor.required",
                message: "El campo instructor es requerido",
              },
            ],
          },
        ]);
      }




      // extraigo los campos subTitles , whatYouWillLearn y requeriments

      const { subTitles, whatYouWillLearn, requeriments, whoIsThisCourseFor } = ctx.request.body.data;

      console.log("subTitles", requeriments);



      if (subTitles) {
        // verifico sea un array  sino retorno un error
        if (!Array.isArray(subTitles)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo subtitulos debe ser un array",
          });
        }

        ctx.request.body.data.subTitles =  convertArrayToObjects(subTitles);




      }

      if (whatYouWillLearn) {
        if (!Array.isArray(whatYouWillLearn)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo que whatYouWillLearn debe ser un array",
          });
        }

        ctx.request.body.data.whatYouWillLearn =  convertArrayToObjects(whatYouWillLearn);



      }

      if (requeriments) {
        if (!Array.isArray(requeriments)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo requeriments debe ser un array",
          });
        }

        ctx.request.body.data.requeriments =  convertArrayToObjects(requeriments);
      }

      console.log ("whoIsThisCourseFor",requeriments);

      if (whoIsThisCourseFor) {
        if (!Array.isArray(whoIsThisCourseFor)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo whoIsThisCourseFor debe ser un array",
          });
        }

        ctx.request.body.data.whoIsThisCourseFor =  convertArrayToObjects(whoIsThisCourseFor);

      }

      const userPopulate = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { id: user.id }, populate: true });


      //si el instructor tiene company asignado reviso si la company es un usuario de tipo institucion

      if (userPopulate.company) {
        const company = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({ where: { id: userPopulate.company.id }, populate: true });

        // si la company es de tipo institucion creo campos nuevo al curso: logo de la institucion y nombre de la institucion

        if (company.role.id == 6) {
          //console.log("hola")
          ctx.request.body.data.logo_institucion = company.avatar ? company.avatar.url : "";
          ctx.request.body.data.nombre_institucion = company.nombre;
        }

      }







      let data = [];

      const { cupon_descuento } = ctx.request.body.data;

      if (cupon_descuento) {


        const cupon = await strapi.db
          .query("api::cupon.cupon")
          .findOne({ where: { slug: cupon_descuento }, populate: true });


        // si el cupom_descuento no existe en la tabla cupon no se puede asignar el cupom_descuento al curso

        if (!cupon) {
          return ctx.badRequest("El cupom no existe", {
            messages: [
              {
                id: "Curso.validation.cupom_descuento.required",
                message: "El cupom no existe",
              },
            ],
          },);
        }

        if (cupon.user.id != ctx.request.body.data.instructor) {
          return ctx.badRequest(null, [
            {
              messages: [
                {
                  id: "Curso.validation.cupom_descuento.required",
                  message: "El cupom no pertenece al instructor",
                },
              ],
            },
          ]);
        }

        
        data = await super.create(ctx);

        let cursos_cupon = [data.data.id, ...cupon.cursos.map((curso) => curso.id)]



        await strapi.db
          .query("api::cupon.cupon")
          .update(
            {
              where: { slug: cupon_descuento },
              data: { cursos: cursos_cupon }
            }
          );


      } else {



        // SI tipo = conferencia, creo la conferencia en zoom
        if (ctx.request.body.data.tipo == "conferencia") {



          let accessToken = await this.getZoomAccessTokenSofS();

          if (!this.verificarConstraseña(ctx.request.body.data.password)) {

            return ctx.badRequest("La contraseña debe tener entre 1 y 10 caracteres y solo puede contener letras, números y los siguientes caracteres especiales @ - _ .", {
              error: "La contraseña debe tener entre 1 y 10 caracteres y solo puede contener letras, números y los siguientes caracteres especiales @ - _ ."
            });

          };

          const response = await axios.post(`${ZOOM_URL}/users/me/meetings`, {
            topic: ctx.request.body.data.name,
            type: 2,
            start_time: ctx.request.body.data.fecha,
            duration: ctx.request.body.data.duracion,

            timezone: ctx.request.body.data.timezone,
            password: ctx.request.body.data.password,
            agenda: ctx.request.body.data.shortDescription,



            /* recurrence: {
               type: 2,  // Semanal
               repeat_interval: 1,  // Cada semana
 
             },*/

            settings: {

              host_video: true,

              participant_video: true,

              cn_meeting: false,

              in_meeting: false,

              join_before_host: false,

              mute_upon_entry: false,

              watermark: false,

              use_pmi: false,

              approval_type: 2,

              audio: "both",

              auto_recording: "none",

              enforce_login: false,

              registrants_email_notification: false,

              waiting_room: true,

              registrants_confirmation_email: false,


              global_dial_in_countries: [],

              registrants_restrict_number: 0,

              contact_name: "",

              contact_email: "",

              registrants_restrict_email: 0,

              meeting_authentication: true,

              show_share_button: false,

              allow_multiple_devices: false,
              registration_type: 2,

              encryption_type: "enhanced_encryption",

            },

          }, {

            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }

          });


          let conference = {

            "ZoomMeetingID": response.data.id.toString(),
            "ZoomURL": response.data.join_url,
            "ZoomPassword": response.data.password,
            "ZoomStart": response.data.start_time,
            "ZoomDuration": response.data.duration.toString(),
            "state": "scheduled",
            "meetingRAW": JSON.stringify(response.data),


          }

          ctx.request.body.data.conference = conference;



        }


        data = await super.create(ctx);

      }


  
      return ctx.send(data);
    } catch (error) {
      console.log(error);
      

      return ctx.badRequest("Error al crear el curso", {

        ...error 
      });
  


      

    }




  },
  async registerMeeting(ctx) {

    try {

      let { user } = ctx.state;

      console.log("user", user)

      if (!user) {
        return ctx.unauthorized(`Not authorized`);
      }


      const { id } = ctx.params;

      if (!id) {
        return ctx.unauthorized(`Not id provided`);
      }


      const curso = await strapi.entityService.findOne("api::curso.curso", id, {

        populate: ["conference", "instructor"],
        fields: ["id", "tipo"]



      });

      console.log("curso", curso);

      if (!curso || curso.tipo != "conferencia" || !curso.conference) {

        return ctx.notFound(`Conference not found`);

      }

       const misCursos = await strapi.db
       .query("api::mis-curso.mis-curso")
       .findOne({ where: { curso: id, usuario: user.id } });
 
 
       console.log("misCursos",misCursos);
 
       if (!misCursos && user.id != curso.instructor.id && user.role.type != "administrador") {
         return ctx.unauthorized(`You can't create this entry`);
       }

       // verifico si el usuario es el instructor del curso

       let roleMetting = 0;
      if (user.id == curso.instructor.id) {

        roleMetting = 1;

      }


       
        const signature = await this.getZoomAccessTokenMSDK({ meetingId: curso.conference.ZoomMeetingID, role: roleMetting })




      const { ZoomMeetingID, ZoomPassword } = curso.conference;


      /*const accessToken = await this.getZoomAccessTokenSofS();



       await axios.post(`${ZOOM_URL}/meetings/${ZoomMeetingID}/registrants`, {

        email: user.email,

        first_name: "Daniel",

        last_name: "Gonzalez",

      }, {

        headers: {

          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }

      });*/


       return {
        role: roleMetting == 0 ? "participante" : "instructor",
        userId: user.id,
        userName: user.nombre + " " + user.apellidos,
        userEmail: user.email,
        signature: signature,
        meetingNumber: curso.conference.ZoomMeetingID,
        meetingPassword: curso.conference.ZoomPassword,
        meetingTopic: curso.name,
        meetingStartTime: curso.conference.ZoomStart,
        meetingDuration: curso.conference.ZoomDuration,
        meetingTimeZone: curso.timezone,
        sdkKey : ZOOM_MEETING_SDK_KEY,
     } ;



    } catch (error) {
      console.log(error);
    }











  },
  async getZoomAccessTokenSofS() {
    try {
      const response = await axios.post('https://zoom.us/oauth/token', qs.stringify({
        grant_type: 'account_credentials',
        account_id: ZOOM_ACCOUNT_ID,
      }), {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
        }
      });
      //ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_SECRET_TOKEN, ZOOM_VERIFICATION_TOKEN,ZOOM_UR

      return response.data.access_token;
    } catch (error) {
      console.log('Error al obtener el token de acceso de Zoom:', error);


      return ctx.badRequest("Error al obtener el token de acceso de Zoom", {
        error: "Error al obtener el token de acceso de Zoom"
      });
    }
  },
  async getZoomAccessTokenMSDK(data) {
    try {
      const iat = Math.round(new Date().getTime() / 1000) - 30;
      const exp = iat + 60 * 60 * 2
    
      const oHeader = { alg: 'HS256', typ: 'JWT' }
    
      const oPayload = {
        sdkKey: ZOOM_MEETING_SDK_KEY,
        mn: data.meetingId,
        role: data.role,
        iat: iat,
        exp: exp,
        appKey: ZOOM_MEETING_SDK_KEY,
        tokenExp:exp
      }

      console.log("oPayload",oPayload);
    
      const sHeader = JSON.stringify(oHeader)
      const sPayload = JSON.stringify(oPayload)
      const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, ZOOM_MEETING_SDK_SECRET)

      // Firmar el token
      return signature;
    } catch (error) {
      console.log('Error al obtener el token de acceso de Zoom:', error);


      return ctx.badRequest("Error al obtener el token de acceso de Zoom", {
        error: "Error al obtener el token de acceso de Zoom"
      });
    }
  },

  async findOne(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    // obtengo el id del curso que se quiere consultar

    const { id } = ctx.params;

    // consulto si el curso que se quiere consultar existe traigo solo id y titulo

    const curso_id = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      select: ["id"],
    });

    // si el curso no existe, retorno error 404 not found

    if (!curso_id) {
      return ctx.notFound();
    }

    let data = {};

    // verifico si el usuario esta logueado o no

    if (user) {
      if (user.role.type != "administrador" && user.role.type != "instructor") {
        // verifico en la tabla mis cursos si el usuario que está haciendo la petición tiene el curso que se quiere consultar

        const misCursos = await strapi.db
          .query("api::mis-curso.mis-curso")
          .findOne({ where: { curso: id, usuario: user.id } });

        // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

        if (!misCursos) {
          // obtengo el curso que se quiere consultar

          const curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: { instructor: true } });

          // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

          const clases = await strapi.db.query("api::clase.clase").findMany({
            where: { curso: id },
            select: ["nombre", "duracion", "descripcion"],
          });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con los datos publicos del curso

          data = { curso, clases, valoraciones };
        } else {
          // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

          // obtengo el curso que se quiere consultar

          const curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: { instructor: true } });

          // busco las clases del curso que se quiere consultar

          const clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

          for (let i = 0; i < clases.length; i++) {
            const clase = clases[i];
            const clase_id = clase.id;
            const clase_finalizada = await strapi.db
              .query("api::clases-finalizada.clases-finalizada")
              .findOne({
                where: { clase: clase_id, usuario: user.id, curso: curso.id },
              });
            if (clase_finalizada) {
              clases[i].status = "finalizada";
            } else {
              clases[i].status = "no finalizada";
            }
          }

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };
        }
      } else if (user.role.type == "administrador") {
        // si es administrador le devulevo todos los datos del curso

        // obtengo el curso que se quiere consultar

        const curso = await strapi.db
          .query("api::curso.curso")
          .findOne({ where: { id }, populate: { instructor: true } });

        // busco las clases del curso que se quiere consultar

        const clases = await strapi.db
          .query("api::clase.clase")
          .findMany({ where: { curso: id } });

        // busco las valoraciones del curso que se quiere consultar

        const valoraciones = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findMany({ where: { curso: id } });

        // armo la respuesta con todos los datos del curso

        data = { curso, clases, valoraciones };

        // hago el return de la respuesta
      } else if (user.role.type == "instructor") {
        // verifico si el instructor es dueño del curso o es instructor de dicho curso

        const curso = await strapi.db.query("api::curso.curso").findOne({
          where: { id, instructor: user.id },
          populate: { instructor: true },
        });

        // si el instructor es dueño del curso o es instructor de dicho curso, envio todos los datos del curso

        if (curso) {
          // busco las clases del curso que se quiere consultar

          const clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };

          // hago el return de la respuesta
        } else {
          // verifico si tiene el curso en mis cursos

          const misCursos = await strapi.db
            .query("api::mis-curso.mis-curso")
            .findOne({ where: { curso: id, usuario: user.id } });

          // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

          if (!misCursos) {
            // obtengo el curso que se quiere consultar

            const curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: { instructor: true } });

            // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

            const clases = await strapi.db.query("api::clase.clase").findMany({
              where: { curso: id },
              select: ["nombre", "duracion", "descripcion"],
            });

            // busco las valoraciones del curso que se quiere consultar

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con los datos publicos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          } else {
            // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

            // obtengo el curso que se quiere consultar

            const curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: { instructor: true } });

            // busco las clases del curso que se quiere consultar

            const clases = await strapi.db
              .query("api::clase.clase")
              .findMany({ where: { curso: id } });

            //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

            for (let i = 0; i < clases.length; i++) {
              const clase = clases[i];
              const clase_id = clase.id;
              const clase_finalizada = await strapi.db
                .query("api::clases-finalizada.clases-finalizada")
                .findOne({
                  where: { clase: clase_id, usuario: user.id, curso: curso.id },
                });
              if (clase_finalizada) {
                clases[i].status = "finalizada";
              } else {
                clases[i].status = "no finalizada";
              }
            }

            // busco las valoraciones del curso que se quiere consultar

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con todos los datos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          }
        }
      }
    } else {
      // si no está logueado, envio solo datos publicos

      // obtengo el curso que se quiere consultar

      const curso = await strapi.db
        .query("api::curso.curso")
        .findOne({ where: { id }, populate: { instructor: true } });

      // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, duracion

      const clases = await strapi.db.query("api::clase.clase").findMany({
        where: { curso: id },
        select: ["nombre", "duracion", "descripcion"],
      });

      // busco las valoraciones del curso que se quiere consultar

      const valoraciones = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findMany({ where: { curso: id } });

      // armo la respuesta con los datos publicos del curso

      data = { curso, clases, valoraciones };
    }

    const meta = {};

    // some more custom logic
    meta.date = Date.now();

    // elimino el campo password, confirmationToken, resetPasswordToken,  del instructor si posee el campo isntructor

    if (data.curso.instructor) {
      delete data.curso.instructor.password;
      delete data.curso.instructor.confirmationToken;
      delete data.curso.instructor.resetPasswordToken;
    }

    delete data.curso.createdBy;

    delete data.curso.updatedBy;

    if (data.curso.subTitles) {
      data.curso.subTitles = JSON.parse(data.curso.subTitles);
    } else {
      data.curso.subTitles = [];
    }

    if (data.curso.whatYouWillLearn) {
      data.curso.whatYouWillLearn = JSON.parse(data.curso.whatYouWillLearn);
    } else {
      data.curso.whatYouWillLearn = [];
    }

    if (data.curso.requeriments) {
      data.curso.requeriments = JSON.parse(data.curso.requeriments);
    } else {
      data.curso.requeriments = [];
    }

    if (data.curso.additionalResources) {
      data.curso.additionalResources = JSON.parse(
        data.curso.additionalResources
      );
    } else {
      data.curso.additionalResources = [];
    }

    // para el campo data.curso.summary, necesito cantidad de clases (sus duraciones), cantidad de projects y si tiene project final

    // uso las clases en data.clases para obtener la cantidad de clases y sus duraciones

    data.clases.forEach((clase) => {
      // verifico no sea undefined

      if (data.curso.duracionTotal === undefined) {
        data.curso.duracionTotal = 0;
      }
      // sumo las duraciones de las clases conviertiendo a numero

      data.curso.duracionTotal += parseFloat(clase.duracion);
    });

    // busco los projects del curso

    const projects = await strapi.db
      .query("api::project.project")
      .findMany({ where: { curso: id }, populate: { media: true } });
    let cantidadProjects = 0;
    // cantidad de projects
    if (projects) {
      cantidadProjects = projects.length;
    }

    // recorro los projects para ver si tiene project final

    let projectFinal = false;

    projects.forEach((project) => {
      if (project.projectFinal) {
        projectFinal = true;
      }
    });

    data.curso.summary = [
      {
        cantidadClases: data.clases.length,
        duracionTotal: data.curso.duracionTotal,
        cantidadProjects,
        projectFinal,
        additionalResources: data.curso.additionalResources,
      },
    ];

    data.projects = projects;

    return { data, meta };
  },

  async findBySlug(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.db.query("api::curso.curso").findOne({
      where: { slug: slug },
      populate: true,
    });

    if (!entity) {
      return ctx.notFound();
    }

    // saco el id del curso

    const id = entity.id;

    const user = ctx.state.user;

    let clases = "";
    let curso = "";

    let data = {};

    // verifico si el usuario esta logueado o no

    if (user) {
      if (user.role.type != "administrador" && user.role.type != "instructor") {
        // verifico en la tabla mis cursos si el usuario que está haciendo la petición tiene el curso que se quiere consultar

        const misCursos = await strapi.db
          .query("api::mis-curso.mis-curso")
          .findOne({ where: { curso: id, usuario: user.id } });

        // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

        if (!misCursos) {
          // obtengo el curso que se quiere consultar

          curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: true });

          // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

          clases = await strapi.db.query("api::clase.clase").findMany({
            where: { curso: id },
            select: ["nombre", "duracion", "descripcion"],
          });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con los datos publicos del curso

          data = { curso, clases, valoraciones };
        } else {
          // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

          // obtengo el curso que se quiere consultar

          curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: true });

          // busco las clases del curso que se quiere consultar

          clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

          for (let i = 0; i < clases.length; i++) {
            const clase = clases[i];
            const clase_id = clase.id;
            const clase_finalizada = await strapi.db
              .query("api::clases-finalizada.clases-finalizada")
              .findOne({
                where: { clase: clase_id, usuario: user.id, curso: curso.id },
              });
            if (clase_finalizada) {
              clases[i].status = "finalizada";
            } else {
              clases[i].status = "no finalizada";
            }
          }

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };
        }
      } else if (user.role.type == "administrador") {
        // si es administrador le devulevo todos los datos del curso

        // obtengo el curso que se quiere consultar

        curso = await strapi.db
          .query("api::curso.curso")
          .findOne({ where: { id }, populate: true });

        // busco las clases del curso que se quiere consultar

        clases = await strapi.db
          .query("api::clase.clase")
          .findMany({ where: { curso: id } });

        // busco las valoraciones del curso que se quiere consultar

        const valoraciones = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findMany({ where: { curso: id } });

        // armo la respuesta con todos los datos del curso

        data = { curso, clases, valoraciones };

        // hago el return de la respuesta
      } else if (user.role.type == "instructor") {
        // verifico si el instructor es dueño del curso o es instructor de dicho curso

        curso = await strapi.db.query("api::curso.curso").findOne({
          where: { id, instructor: user.id },
          populate: true,
        });

        // si el instructor es dueño del curso o es instructor de dicho curso, envio todos los datos del curso

        if (curso) {
          // busco las clases del curso que se quiere consultar

          clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };

          // hago el return de la respuesta
        } else {
          // verifico si tiene el curso en mis cursos

          const misCursos = await strapi.db
            .query("api::mis-curso.mis-curso")
            .findOne({ where: { curso: id, usuario: user.id } });

          // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

          if (!misCursos) {
            // obtengo el curso que se quiere consultar

            curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: true });

            // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

            clases = await strapi.db.query("api::clase.clase").findMany({
              where: { curso: id },
              select: ["nombre", "duracion", "descripcion"],
            });

            // busco las valoraciones del curso que se quiere consultar

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con los datos publicos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          } else {
            // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

            // obtengo el curso que se quiere consultar

            curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: true });

            // busco las clases del curso que se quiere consultar

            clases = await strapi.db
              .query("api::clase.clase")
              .findMany({ where: { curso: id } });

            //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

            for (let i = 0; i < clases.length; i++) {
              const clase = clases[i];
              const clase_id = clase.id;
              const clase_finalizada = await strapi.db
                .query("api::clases-finalizada.clases-finalizada")
                .findOne({
                  where: { clase: clase_id, usuario: user.id, curso: curso.id },
                });
              if (clase_finalizada) {
                clases[i].status = "finalizada";
              } else {
                clases[i].status = "no finalizada";
              }
            }

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con todos los datos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          }
        }
      }
    } else {
      // si no está logueado, envio solo datos publicos

      // obtengo el curso que se quiere consultar

      curso = await strapi.db
        .query("api::curso.curso")
        .findOne({ where: { id }, populate: true });

      // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, duracion

      clases = await strapi.db.query("api::clase.clase").findMany({
        where: { curso: id },
        select: ["nombre", "duracion", "descripcion"],
      });

      // busco las valoraciones del curso que se quiere consultar

      const valoraciones = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findMany({ where: { curso: id } });

      // armo la respuesta con los datos publicos del curso

      data = { curso, clases, valoraciones };
    }

    const meta = {};

    // some more custom logic
    meta.date = Date.now();

    // elimino el campo password, confirmationToken, resetPasswordToken,  del instructor si posee el campo isntructor

    if (data.curso.instructor) {
      delete data.curso.instructor.password;
      delete data.curso.instructor.confirmationToken;
      delete data.curso.instructor.resetPasswordToken;
    }

    delete data.curso.createdBy;

    delete data.curso.updatedBy;

    if (data.curso.subTitles) {
      data.curso.subTitles = JSON.parse(data.curso.subTitles);
    } else {
      data.curso.subTitles = [];
    }

    if (data.curso.whatYouWillLearn) {
      console.log("data.curso.whatYouWillLearn", data.curso.whatYouWillLearn);

      if (typeof data.curso.whatYouWillLearn == "string") {
        data.curso.whatYouWillLearn = JSON.parse(data.curso.whatYouWillLearn);
      }else{
        data.curso.whatYouWillLearn = data.curso.whatYouWillLearn;
      }


    } else {
      data.curso.whatYouWillLearn = [];
    }

    if (data.curso.requeriments) {
      data.curso.requeriments = JSON.parse(data.curso.requeriments);
    } else {
      data.curso.requeriments = [];
    }

    if (data.curso.additionalResources) {
      data.curso.additionalResources = JSON.parse(
        data.curso.additionalResources
      );
    } else {
      data.curso.additionalResources = [];
    }

    // para el campo data.curso.summary, necesito cantidad de clases (sus duraciones), cantidad de projects y si tiene project final

    // uso las clases en data.clases para obtener la cantidad de clases y sus duraciones

    data.clases.forEach((clase) => {
      // verifico no sea undefined

      if (data.curso.duracionTotal === undefined) {
        data.curso.duracionTotal = 0;
      }
      // sumo las duraciones de las clases conviertiendo a numero

      data.curso.duracionTotal += parseFloat(clase.duracion);
    });

    //

    //verfico las clases del curso que contengan el campo additionalResources y cuento los recursos e inserto en el campo additionalResources del curso la cantidad de recursos
    // obtengo las clases del curso

    clases = await strapi.db
      .query("api::clase.clase")
      .findMany({ where: { curso: id } });

    let cantidadRecursos = 0;
    for (let i = 0; i < clases.length; i++) {
      const clase = clases[i];
      if (clase.additionalResources) {
        //convierto additionalResources que es un string a un array

        clase.additionalResources = JSON.parse(clase.additionalResources);
        cantidadRecursos += clase.additionalResources.length;
      }
    }
    data.curso.additionalResources = cantidadRecursos;
    console.log("curso", curso);

    // busco los projects del curso

    const projects = await strapi.db
      .query("api::project.project")
      .findMany({ where: { curso: id }, populate: { media: true } });
    let cantidadProjects = 0;
    // cantidad de projects
    if (projects) {
      cantidadProjects = projects.length;
    }

    // recorro los projects para ver si tiene project final

    let projectFinal = false;

    projects.forEach((project) => {
      if (project.projectFinal) {
        projectFinal = true;
      }
    });

    data.curso.summary = [
      {
        cantidadClases: data.clases.length,
        duracionTotal: data.curso.duracionTotal,
        cantidadProjects,
        projectFinal,
        additionalResources: data.curso.additionalResources,
      },
    ];

    data.projects = projects;

    return { data, meta };
  },

  async miStudent(ctx) {
    // recibo el slug

    const { slug } = ctx.params;

    // busco al profesor por el slug

    const instructor = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { slug: slug },
        select: ["id"],
      });

    if (!instructor) {
      return ctx.badRequest(null, "No se encontró el instructor");
    }

    // busco los cursos del instructor

    const cursos = await strapi.db.query("api::curso.curso").findMany({
      where: { instructor: instructor.id },

      select: ["id"],
    });

    if (!cursos) {
      return ctx.badRequest(null, "No se encontraron cursos");
    }

    // busco los estudiantes de los cursos del instructor

    const cursosComprados = await strapi.db
      .query("api::mis-curso.mis-curso")
      .findMany({
        where: {
          curso: {
            id: {
              $in: cursos.map((curso) => curso.id),
            },
          },
        },

        populate: true,
      });

    if (!cursosComprados) {
      return ctx.badRequest(null, "No se encontraron estudiantes");
    }

    // extraigo los estudiantes de los cursosComprados del instructor  evitando duplicados revisando por el id del usuario. El usuario se encuentra en cursosComprados.usuario

    const estudiantesUnicos = cursosComprados.reduce((acc, current) => {
      console.log(current);
      // si current.usuario no es null prosigo con el proceso , sino salto el proceso y sigo con el siguiente item del array

      if (!current.usuario) {
        return acc;
      }

      const x = acc.find((item) => item.id === current.usuario.id);

      if (!x) {
        return acc.concat([current.usuario]);
      } else {
        return acc;
      }
    }, []);

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({
        where: {
          id: {
            $in: estudiantesUnicos.map((estudiante) => estudiante.id),
          },
        },

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

    entity.forEach((estudiante) => {
      arrayEliminar.forEach((element) => {
        delete estudiante[element];
      });
    });

    return { data: entity, meta: {} };
  },

  //modifico el controlador para editar la conferencia 
  async editMeeting(ctx) {

    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //verifico que el usuario este logueado  

    if (!user) {
      return ctx.unauthorized(`You can't edit this entry`);
    }

    //verifico que el usuario sea administrador o instructor

    if (user.role.type != "administrador" && user.role.type != "instructor") {

      return ctx.unauthorized(`You can't edit this entry`);

    }

    // obtengo el id del curso que se quiere consultar

    const { id } = ctx.params;

    // consulto si el curso que se quiere consultar existe traigo solo id el titulo y el instructor

    const conferencia = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true, id: true, titulo: true },
    });

    // si el curso no existe, retorno error 404 not found

    if (!conferencia) {

      return ctx.notFound();

    }

    //verifico que el usuario sea el instructor del curso

    if (user.id != conferencia.instructor.id) {

      return ctx.unauthorized(`You can't edit this entry`);

    }

    let accessToken = await this.getZoomAccessTokenSofS();

    //obtengo el ZoomMeetingId de la conferencia 

    let conferenceId = await strapi.entityService.findOne('api::curso.curso', id, {

      populate: { conference: true }


    });


    let zoomMeetingId = conferenceId.conference.ZoomMeetingID;

    //console.log("ZoomMeetingId", conferenceId.conference.ZoomMeetingID);

    //console.log(ctx.request.body.data);

    const response = await axios.patch(`${ZOOM_URL}/meetings/${zoomMeetingId}`, {
      topic: ctx.request.body.data.name,
      start_time: ctx.request.body.data.fecha,
      duration: ctx.request.body.data.duracion,
      timezone: "America/Argentina/Buenos_Aires",
      //password: ctx.request.body.data.password,
      agenda: ctx.request.body.data.shortDescription,




    }, {

      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }

    });

    // busco la conferencia en zoom para actualizar en mi base de datos



    let conference = {

      //"ZoomPassword": response.data.password,
      "ZoomStart": ctx.request.body.data.fecha,
      "ZoomDuration": ctx.request.body.data.duracion,
      "state": "scheduled",



    }

    ctx.request.body.data.conference = conference;


    //retorno la conferencia editada en zoom 


    return ctx.send({ message: "Conferencia editada con éxito" });



  },

  async deleteMeeting(ctx) {

    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //verifico que el usuario este logueado  

    if (!user) {
      return ctx.unauthorized(`You can't edit this entry`);
    }

    //verifico que el usuario sea administrador o instructor

    if (user.role.type != "administrador" && user.role.type != "instructor") {

      return ctx.unauthorized(`You can't edit this entry`);

    }

    // obtengo el id del curso que se quiere consultar

    const { id } = ctx.params;

    // consulto si el curso que se quiere consultar existe traigo solo id el titulo y el instructor

    const conferencia = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true, id: true, titulo: true },
    });

    // si el curso no existe, retorno error 404 not found

    if (!conferencia) {

      return ctx.notFound();

    }

    //verifico que el usuario sea el instructor del curso

    if (user.id != conferencia.instructor.id) {

      return ctx.unauthorized(`You can't edit this entry`);

    }

    let accessToken = await this.getZoomAccessTokenSofS();

    let conferenceId = await strapi.entityService.findOne('api::curso.curso', id, {

      populate: { conference: true }


    });

    let zoomMeetingId = conferenceId.conference.ZoomMeetingID;
    console.log(zoomMeetingId);

    //elimino la conferencia en zoom

    await axios.delete(`${ZOOM_URL}/meetings/${zoomMeetingId}`, {

      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }

    });

    //elimino el curso de la base de datos

    await strapi.db.query("api::curso.curso").delete({
      where: {
        id: id
      }

    })


    return ctx.send({ message: "Conferencia eliminada con éxito" });
  },

  async getAccessZommMeeting(ctx) {

    const message = `v0:${ctx.request.headers['x-zm-request-timestamp']}:${JSON.stringify(ctx.request.body)}`

    const hashForVerify = crypto.createHmac('sha256', ZOOM_SECRET_TOKEN).update(message).digest('hex')

    const signature = `v0=${hashForVerify}`;

    if (ctx.request.headers['x-zm-signature'] !== signature) {

      // lanzo error 401 unauthorized

      return ctx.unauthorized(`You can't edit this entry`);
    }

    let { event, payload } = ctx.request.body;



    if (event === 'endpoint.url_validation') {

      const { plainToken } = payload.plainToken;



      const hashForValidate = crypto.createHmac('sha256', ZOOM_SECRET_TOKEN).update(plainToken).digest('hex')
      ctx.send({
        "plainToken": plainToken,
        "encryptedToken": hashForValidate
      })
    } else if (event === 'meeting.started') {

      console.log("meeting.started");


      try {
        const { object } = ctx.request.body.payload;

        // consulto el curso por el id de la conferencia usando strapi entity manager

        let entry = await strapi.entityService.findMany("api::curso.curso",

          {
            filters: {
              conference: {

                ZoomMeetingID: {
                  $eq: object.id
                }
              }
            },
            fields: ['status', 'name', 'slug']
          }


        );

        // llega un  array uso el primer elemento

        entry = entry[0];


        //

        if (!entry) {

          return ctx.notFound();

        }

        // busco todas las personas que estan inscritas en el curso y les creo una notificacion

        const misCursos = await strapi.db.query("api::mis-curso.mis-curso").findMany({

          where: { curso: entry.id },

          populate: true

        });

        if (!misCursos) {

          return ctx.notFound();

        }


        // le cambio el estado al curso

        await strapi.entityService.update("api::curso.curso", entry.id, {



          data: { conference: { state: "in_progress" } }

        });


        misCursos.forEach(async (misCurso) => {

          await strapi.db.query("api::notificacion.notificacion").create({

            data: {
              user: misCurso.usuario.id,
              tipo: "aviso",
              descripcion: `La conferencia ${entry.name} ha comenzado`,

              estado: false,
              fecha: new Date(),

              url: `/curso/${misCurso.curso.id}/clase/${entry.id}`
            }

          });

        });



        return ctx.send({

          "data": entry
        });

      } catch (error) {
        console.log(error);

        // retorno error 500

        return ctx.badRequest('Ha ocurrido un error', { message: error });

      }









    } else if (event === 'meeting.participant_joined_waiting_room') {


      console.log("meeting.participant_joined_waiting_room");

      console.log(payload);



    } else if (event === 'meeting.participant_joined') {


      console.log("meeting.participant_joined");


      console.log(payload);


    } else {

      console.log("otro evento", event);

      console.log(payload);

    }



    return ctx.send({
      "data": "ok"
    });

  }



}));
function convertArrayToObjects(array) {
    // Mapea cada elemento del array a un objeto con la propiedad 'text'
    return array.map(item => ({ text: item }));
}