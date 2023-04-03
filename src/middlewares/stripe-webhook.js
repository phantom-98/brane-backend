'use strict';
const unparsed = require("koa-body/unparsed.js");
const { Buffer } = require('buffer');
/**
 * `stripe-webhook` middleware
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    console.log(ctx.request.url);
    if (ctx.request.method === 'POST' && ctx.request.url === '/api/pedido/checkout/') {

      let body = ctx.request.rawBody;

      console.log(ctx.request.body[unparsed]);

      ctx.request.body = ctx.request.body[unparsed]

     

      

    }

    await next();
  };
};
