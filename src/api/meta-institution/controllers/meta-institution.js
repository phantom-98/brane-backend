'use strict';

/**
 * meta-institution controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::meta-institution.meta-institution', ({ strapi }) => ({

        // creo medodo me devuelve la meta data del usuario logueado

        async me(ctx) {
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
    
            const meta = await strapi.db
                .query("api::meta-institution.meta-institution")
                .findOne({ where: { user: user.id } });
    
            console.log(meta);
    
            if (!meta) {
                return ctx.notFound(null, [
                    {
                        messages: [
                            {
                                id: "No tienes una meta creada",
    
                                message: "No tienes una meta creada",
                            },
                        ],
                    },
                ]);
            }
    
            // si hay meta data, la retorno dentro de un objeto data {id:meta.id, attributes : meta}
    
            return ctx.send({ data: { id: meta.id, attributes: meta } });
        },
    
        async updateMe(ctx) {
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
    
            // si hay usuario, lo agrego como parametro id
    
            // busco el id de la meta del usuario logueado
    
            const meta = await strapi.db
                .query("api::meta-institution.meta-institution")
                .findOne({ where: { user: user.id } });
    
            console.log(meta);
    
            if (!meta) {
                return ctx.notFound(null, [
                    {
                        messages: [
                            {
                                id: "No tienes una meta creada",
    
                                message: "No tienes una meta creada",
                            },
                        ],
                    },
                ]);
            }
    
            ctx.params.id = meta.id;
    
            return super.update(ctx);
        },
    
        //modifico el metodo create para inyectar el id del usuario logueado en el campo usuario, al menos que quien envie	la peticion sea un admin
    
        async createMe(ctx) {
            const user = ctx.state.user;
    
            // si no hay usuario
    
            if (!user) {
                return ctx.badRequest(401, [
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
    
            console.log("USER", user);
            console.log("respuesta", ctx.request.body)
    
            // verifico si el usuario logueado es admin con el role 5
    
            if (user.role.id != 5) {
                // si es distinto al admin, inyecto el id del usuario logueado en el campo usuario
    
                ctx.request.body.data.usuario = user.id;
            }
    
            console.log("BODY", ctx.request.body);
    
            // verifico quue el usuario no tenga ya una meta creada
    
            const meta = await strapi.db
                .query("api::meta-institution.meta-institution")
                .findOne({ where: { user: user.id } });
    
            console.log("META", meta);
    
            if (meta) {
                return ctx.badRequest(500, [
                    {
                        messages: [
                            {
                                id: "Ya tienes una meta creada",
    
                                message: "Ya tienes una meta creada",
                            },
                        ],
                    },
                ]);
            }

            //le asigno el usuario logueado al campo user de la meta
            
            ctx.request.body.data.user = user.id;
            
    
            return super.create(ctx);
        },
    
        async stripeConnect(ctx) {
            // recibo el usuario logueado
    
            const user = ctx.state.user;
    
            // verifico que sea usuario y tenga role instructor
    
            if (!user || user.role.id != 3) {
                //ctx.response.status	= 401;
                return ctx.response.unauthorized([
                    
                            {
                                id: "No autorizado",
    
                                message: "No autorizado",
                            },
                        
                ]);
            }
    
            // verifico que el usuario no tenga ya una cuenta creada
    
            const meta = await strapi.db.query("api::meta-institution.meta-institution").findOne({ where: { usuario: user.id } });
    
            if (!meta) {
    
                // le creamos	una meta
    
                const meta = await strapi.db.query("api::meta-institution.meta-institution").create({ data: { usuario: user.id } });
    
    
    
            }
    
            // verifico que no tenga ya una cuenta creada con el campo stripe_account_id
    
            if (meta.stripe_account_id) {
    
                return ctx.badRequest("Ya tienes una cuenta creada", {message: "Ya tienes una cuenta creada"});
            }
    
            //	si no tiene cuenta creada, creo la cuenta
    
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: user.email,
                capabilities: {
                        transfers: {requested: true},
                },
                //tos_acceptance: {service_agreement: 'recipient'},
                business_type: 'individual',
                individual: {
                    first_name: user.nombre,
                    last_name: user.apellidos
                }
        });
    
    
            console.log(account);
    
            const link  = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'https://example.com/reauth',
                return_url: 'https://example.com/return',
                type: 'account_onboarding',
        });
    
            return ctx.send({link});
    
    
    
    
        },
    
        async paypalConnect(ctx) {
    
            const user = ctx.state.user;
    
            // verifico que sea usuario y tenga role instructor
    
            if (!user || user.role.id != 3) {
                //ctx.response.status	= 401;
                return ctx.response.unauthorized([
                    
                            {
                                id: "No autorizado",
    
                                message: "No autorizado",
                            },
                        
                ]);
            }
    
            // verifico que el usuario no tenga ya una cuenta creada
    
            const meta = await strapi.db.query("api::meta-institution.meta-institution").findOne({ where: { usuario: user.id } });
    
            if (!meta) {
    
                // le creamos	una meta
    
                const meta = await strapi.db.query("api::meta-institution.meta-institution").create({ data: { usuario: user.id } });
            }
            
    
    
    
        }


}));
