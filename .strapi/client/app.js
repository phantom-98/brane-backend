/**
 * This file was automatically generated by Strapi.
 * Any modifications made will be discarded.
 */
import usersPermissions from "@strapi/plugin-users-permissions/strapi-admin";
import emailDesigner from "strapi-plugin-email-designer/strapi-admin";
import restCache from "strapi-plugin-rest-cache/strapi-admin";
import { renderAdmin } from "@strapi/strapi/admin";

renderAdmin(document.getElementById("strapi"), {
  plugins: {
    "users-permissions": usersPermissions,
    "email-designer": emailDesigner,
    "rest-cache": restCache,
  },
});
