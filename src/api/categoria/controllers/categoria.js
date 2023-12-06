'use strict';

/**
 * categoria controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::categoria.categoria', ({ strapi }) => ({

    async findBySlug(ctx) {
        const {slug} = ctx.params;
       
        console.log(ctx.params)
        const entity = await strapi.db.query("api::categoria.categoria").findOne({where: { slug: slug },
        populate: true });
    
        
        const sanitizedResults = await this.sanitizeOutput(entity, ctx);
    
        return this.transformResponse(sanitizedResults);
      },
}));
