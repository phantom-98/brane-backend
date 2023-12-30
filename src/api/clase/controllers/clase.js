"use strict";
const { Readable } = require("stream");
const path = require('path');
const { v4: uuid } = require('uuid');
const Promise = require('bluebird'); 
const os = require('os');
const fse = require('fs-extra');
const fs = require('fs');


/**
 * clase controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::clase.clase", ({ strapi }) => ({
  //modificamos el update para que solo las clases puedan ser actualizadas por el usuario que lo creó y por el adminisrador

  async update(ctx) {
    //obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //obtengo el id de la clase que se quiere actualizar

    const { id } = ctx.params;

    //si el usuario que está haciendo la petición no está logueado, no puede actualizar la clase

    if (!user) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    //obtengo la clase que se quiere actualizar

    const clase = await strapi.db.query("api::clase.clase").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { id },

      populate: { curso: true },
    });
    console.log(clase);
    //si la clase no existe, no puede actualizar la clase

    if (!clase) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    //busco el curso al cua pertenece la clase y obtengo el instructor

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { id: clase.curso.id },

      populate: { instructor: true },
    });
    console.log(curso);

    //si el usuario que está haciendo la petición no es el instructor de la clase ni es administrador, no puede actualizar la clase

    if (user.id != curso.instructor.id && user.role.type != "administrador") {
      return ctx.unauthorized(`You can't update this entry`);
    }

    //si el usuario que está haciendo la petición es el instructor de la clase o es administrador, puede actualizar la clase

    return await super.update(ctx);
  },

  //modifico el create para que solo usuarios tipo isntructor y administrador puedan crear clases

  async create(ctx) {
    //obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //si el usuario que está haciendo la petición no está logueado, no puede crear la clase

    if (!user) {
      return ctx.unauthorized(`No has iniciado sesión`);
    }
    // verifico que la clase tiene el campo curso lleno, sino doy mensaje de error de validacion de campo curso vacio y no se crea la clase

    if (!ctx.request.body.data.curso) {
      return ctx.badRequest(null, [
        {
          messages: [
            {
              id: "Curso is required",
              message: "Curso is required",
            },
          ],
        },
      ]);
    }
    //obtengo el instructor del curso al que se quiere crear la clase

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { id: ctx.request.body.data.curso },

      populate: { instructor: true },
    });

    //si el curso no existe, no puede crear la clase

    if (!curso) {
      return ctx.unauthorized(`El curso no existe`);
    }
    //si el usuario que está haciendo la petición no es el instructor del curso ni es administrador, no puede crear la clase
    console.log("usuario", user.id);
    console.log("curso", curso);
    console.log("instructor", curso.instructor);
    if (user.id != curso.instructor.id && user.role.type != "administrador") {
      return ctx.unauthorized(`No tienes permisos para crear clases`);
    }

    const { additionalResources } = ctx.request.body.data;

    if (additionalResources) {

      if (!Array.isArray(additionalResources)) {

        return ctx.badRequest("Tipo de dato invalido", { error: "El campo recursos adicionales debe ser un array" });

      }

      if (additionalResources.length) {

        ctx.request.body.data.additionalResources = convertArrayToObjects(additionalResources);

      }

    }

    //si el usuario que está haciendo la petición es instructor o es administrador, puede crear la clase

    return await super.create(ctx);
  },


  async addOrUpdateSubtitles(ctx) {
    const user = this.validateUser(ctx);
    if (!user) return;
  
    const { clase, subtitlesBody, subtitlesFiles } = this.validateRequestBody(ctx);
    if (!subtitlesBody || !clase || !subtitlesFiles) return;
  
    const subtitles = this.extractSubtitles(subtitlesBody, subtitlesFiles);
    const claseData = await this.getClaseData(clase);
    if (!claseData) return ctx.unauthorized(`La clase no existe`);
  
    const curso = await this.getCursoData(claseData, user);
    if (!curso) return ctx.unauthorized(`No tienes permisos para realizar esta acción`);


    console.log(subtitles, claseData);
  
    await this.processSubtitles(subtitles, claseData);
  
    return await this.getUpdatedClass(clase);
  },
  
  validateUser(ctx) {
    const user = ctx.state.user;
    if (!user) {
      ctx.unauthorized(`No has iniciado sesión`);
      return null;
    }
    if (user.role.id != 3 && user.role.id != 5) {
      ctx.unauthorized(`No tienes permisos para realizar esta acción`);
      return null;
    }
    return user;
  },
  
  validateRequestBody(ctx) {
    const subtitlesBody = ctx.request.body;
    const { clase } = subtitlesBody;
    const subtitlesFiles = ctx.request.files;
  
    if (!subtitlesBody) {
      ctx.badRequest("Tipo de dato invalido", { error: "El campo body es requerido" });
      return {};
    }
    if (!clase) {
      ctx.badRequest("Tipo de dato invalido", { error: "El campo clase es requerido" });
      return {};
    }
    if (!subtitlesFiles) {
      ctx.badRequest("Tipo de dato invalido", { error: "El campo files es requerido" });
      return {};
    }
  
    return { clase, subtitlesBody, subtitlesFiles };
  },
  
  extractSubtitles(subtitlesBody, subtitlesFiles) {
    const subtitles = [];
    const keys = Object.keys(subtitlesBody);
    for (const key of keys) {
      const index = key.match(/\[(\d+)\]/);
      if (index) {
        const idx = parseInt(index[1], 10);
        const langData = subtitlesBody[`subtitles[${idx}][lang]`];
        const fileData = subtitlesFiles[`subtitles[${idx}][file]`];
  
        subtitles.push({ file: fileData, lang: langData });
      }
    }
    return subtitles;
  },
  
  async getClaseData(clase) {
    return await strapi.db.query("api::clase.clase").findOne({
      where: { id: clase },
      populate: ['curso','subtitles', 'subtitles.file']
    });
  },
  
  async getCursoData(claseData, user) {
    return await strapi.db.query("api::curso.curso").findOne({
      where: { id: claseData.curso.id, instructor: user.id },
    });
  },
  
  async processSubtitles(subtitles, claseData) {
    const { subtitles: currentSubtitles } = claseData;
  
    // Crear un mapa de subt?tulos existentes para facilitar la b?squeda
    const currentSubtitlesMap = new Map(currentSubtitles.map((subtitle) => [subtitle.lang, subtitle]));
  
    // Recorremos los subt?tulos proporcionados
    for (const subtitle of subtitles) {
      const { file, lang } = subtitle;
  
      const createAndAssignTmpWorkingDirectoryToFiles = () =>
        fse.mkdtemp(path.join(os.tmpdir(), 'strapi-upload-'));
  
      let buffer = await fs.promises.readFile(file.path);
  
      const entity = {
        name: `${file.name}`,
        hash: uuid() + '_' + file.name,
        ext: path.extname(file.name),
        mime: file.type,
        size: file.size / 1024,
        provider: 'local',
        tmpWorkingDirectory: await createAndAssignTmpWorkingDirectoryToFiles(),
        getStream: () => Readable.from(buffer),
        folderPath: '/1',
      };
  
      // Subir y persistir el archivo
      let [fileUpload] = await Promise.all([
        strapi.plugin('upload').service('upload').uploadFileAndPersist(entity),
        strapi.query('plugin::upload.file').create({ data: entity }),
      ]);
  
      // Actualizar o agregar el subt?tulo en el mapa
      currentSubtitlesMap.set(lang, {
        lang,
        file: fileUpload.id,
      });
    }
  
    // Identificar subt?tulos que deben eliminarse
    const languagesToRemove = [];
    for (const [lang, subtitle] of currentSubtitlesMap.entries()) {
      if (!subtitles.find((s) => s.lang === lang)) {
        languagesToRemove.push(lang);
      }
    }
  
    // Eliminar subt?tulos que no se incluyen en la lista subtitles
    for (const langToRemove of languagesToRemove) {
      currentSubtitlesMap.delete(langToRemove);
    }
  
    // Convertir el mapa nuevamente en una lista de subt?tulos
    const updatedSubtitles = Array.from(currentSubtitlesMap.values());
  
    // Actualizar los subt?tulos en la clase
    await strapi.entityService.update('api::clase.clase', claseData.id, {
      data: {
        subtitles: updatedSubtitles,
      },
    });
  },
  
  
  
  
  async getUpdatedClass(clase) {
    return await strapi.db.query("api::clase.clase").findOne({
      where: { id: clase },
      populate: ['subtitles', 'subtitles.file']
    });
  },
  

  //modifico el delete para que solo usuarios tipo isntructor y administrador puedan eliminar clases

  async delete(ctx) {
    //obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //obtengo el id de la clase que se quiere eliminar

    const { id } = ctx.params;

    //si el usuario que está haciendo la petición no está logueado, no puede eliminar la clase

    if (!user) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    //obtengo la clase que se quiere eliminar

    const clase = await strapi.db.query("api::clase.clase").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { id },

      populate: { curso: true },
    });

    //si la clase no existe, no puede eliminar la clase

    if (!clase) {
      return ctx.unauthorized(`la clase no existe`);
    }

    //busco el curso al cua pertenece la clase y obtengo el instructor

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { id: clase.curso.id },

      populate: { instructor: true },
    });

    //si el usuario que está haciendo la petición no es el instructor de la clase ni es administrador, no puede eliminar la clase

    if (user.id != curso.instructor.id && user.role.type != "administrador") {
      return ctx.unauthorized(`no tiene permisos para eliminar la clase`);
    }

    //si el usuario que está haciendo la petición es el instructor de la clase o es administrador, puede eliminar la clase

    return await super.delete(ctx);
  },

  //modifico el findOne para que solo usuarios que tengan el curso al que pertenece la clase, el instructor dueño del curso y el administrador puedan ver la clase

  async findOne(ctx) {
    //obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //obtengo el id de la clase que se quiere ver

    const { id } = ctx.params;

    //si el usuario que está haciendo la petición no está logueado, no puede ver la clase

    if (!user) {
      return ctx.unauthorized(`No has iniciado sesión`);
    }

    //obtengo la clase que se quiere ver

    const clase = await strapi.db.query("api::clase.clase").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { id },

      populate: ['curso', 'subtitles', "subtitles.file", "additionalResources"],
    });



    //si la clase no existe, no puede ver la clase

    if (!clase) {
      return ctx.unauthorized(`la clase no existe`);
    }

    //busco el curso al cua pertenece la clase y obtengo el instructor

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { id: clase.curso.id },

      populate: { instructor: true },
    });
    //busco si el usuario que está haciendo la petición tiene el curso en miscursos

    const misCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'

      where: { usuario: user.id, curso: curso.id },
    });

    //si el usuario que está haciendo la petición no tiene el curso en miscursos, no es el instructor de la clase ni es administrador, no puede ver la clase

    if (
      !misCurso &&
      user.id != curso.instructor.id &&
      user.role.type != "administrador"
    ) {
      return ctx.unauthorized(`No tienes permisos para ver la clase`);
    }

    //si el si el usuario que esta haciendo la peticion tiene el curso en mis cursos verifico si la clase esta finalizada y le asigno el status de finalizada a la clase

    if (misCurso) {
      //verifico si la clase esta finalizada

      const claseFinalizada = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .findOne({
          // uid syntax: 'api::api-name.content-type-name'

          where: { clase: clase.id, usuario: user.id, curso: curso.id },
        });


      //si la clase esta finalizada le asigno el status de finalizada a la clase

      if (claseFinalizada) {
        clase.status = "finalizada";
        //ingreso el status de la clase a la respuesta

      } else {
        clase.status = "no finalizada";
      }
    }

    if(clase.addOrUpdateSubtitles){
      clase.addOrUpdateSubtitles = convertObjectsToArray(clase.addOrUpdateSubtitles)
    }

    if(clase.subtitles){

        clase.subtitles = extractSubtitleUrls(clase.subtitles);
    }
    


    return  ctx.send ({
      data : clase
    })

  },


}));
function convertArrayToObjects(array) {
  // Mapea cada elemento del array a un objeto con la propiedad 'text'
  return array.map(item => ({ text: item }));
}

function convertObjectsToArray(objects) {
// Mapea cada objeto del array extrayendo el valor de la propiedad 'text'
return objects.map(obj => obj.text);
}

function extractSubtitleUrls(subtitles) {
  return subtitles.map((subtitle) => {
    const { lang, file } = subtitle;
    const url = file ? file.url : null;
    

    return {
      lang,
      url,
    };
  });
}