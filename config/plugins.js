module.exports = ({ env }) => ({
  slugify: {
    enabled: true,
    config: {
      slugifyWithCount: true,
      shouldUpdateSlug: true,
      contentTypes: {
        curso: {
          field: "slug",
          references: "name",
        },
        user: {
          field: "slug",
          references: ["nombre", "apellidos"],
        },
        clases: {
          field: "slug",
          references: "nombre",
        },
        categoria: {
          field: "slug",
          references: "nombre",
        },
        cupon: {
          field: "slug",
          references: "nombre",
        },
      },
    },
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.example.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        from: env('SMTP_FROM_ADDRESS'),

        tls: {
          rejectUnauthorized: true
        }
        // ... any custom nodemailer options
      },
      settings: {
        defaultFrom: env('SMTP_FROM_ADDRESS'),
        defaultReplyTo: env('SMTP_FROM_ADDRESS'),
      },
    },
  },
  'email-designer': {
    enabled: true
  },
  'google-auth': {
    enabled: true,
    clientID: env('GOOGLE_CLIENT_ID'),
    clientSecret: env('GOOGLE_CLIENT_SECRET'),
    redirectUri: env('GOOGLE_REDIRECT_URI'),
    resolve: "./node_modules/strapi-google-auth/",
  },
  'strapi-plugin-populate-deep': {
    config: {
      defaultDepth: 5, // Default is 5
    }
  }
});
