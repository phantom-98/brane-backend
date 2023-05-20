module.exports = [
  'strapi::errors',
  //'strapi::security',
  {
         name: "strapi::security",
         config: {
           contentSecurityPolicy: {
             directives: {
               "script-src": ["'self'", "editor.unlayer.com"],
               "frame-src": ["'self'", "editor.unlayer.com"],
               "img-src": [
                 "'self'",
                 "data:",
                 "cdn.jsdelivr.net",
                 "strapi.io",
                 "s3.amazonaws.com",
               ],
             },
           },
         },
       },
  // ...
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      patchKoa: true,
      multipart: true,
      includeUnparsed: true,
    },
  },
 // 'global::stripe-webhook',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  
];
