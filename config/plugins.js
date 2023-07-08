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
        tls: {
          rejectUnauthorized: false
        }
        // ... any custom nodemailer options
      }
    },
  },
  'email-designer': {
    enabled: true
  },
  'strapi-plugin-populate-deep': {
    config: {
      defaultDepth: 5, // Default is 5
    }
  }
});
