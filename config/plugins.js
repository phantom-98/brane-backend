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
});
