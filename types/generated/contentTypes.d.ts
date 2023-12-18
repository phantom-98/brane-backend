import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<{
        min: 1;
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
      }>;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginSlugifySlug extends Schema.CollectionType {
  collectionName: 'slugs';
  info: {
    singularName: 'slug';
    pluralName: 'slugs';
    displayName: 'slug';
  };
  options: {
    draftAndPublish: false;
    comment: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    slug: Attribute.Text;
    count: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::slugify.slug',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::slugify.slug',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginEmailDesignerEmailTemplate
  extends Schema.CollectionType {
  collectionName: 'email_templates';
  info: {
    singularName: 'email-template';
    pluralName: 'email-templates';
    displayName: 'Email-template';
    name: 'email-template';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
    increments: true;
    comment: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    templateReferenceId: Attribute.Integer & Attribute.Unique;
    design: Attribute.JSON;
    name: Attribute.String;
    subject: Attribute.String;
    bodyHtml: Attribute.Text;
    bodyText: Attribute.Text;
    enabled: Attribute.Boolean & Attribute.DefaultTo<true>;
    tags: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::email-designer.email-template',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::email-designer.email-template',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginStrapiGoogleAuthGoogleCredential
  extends Schema.SingleType {
  collectionName: 'strapi-google-auth_google-credential';
  info: {
    displayName: 'Google Credentials';
    singularName: 'google-credential';
    pluralName: 'google-credentials';
    description: 'Stores google project credentials';
    tableName: 'google_auth_creds';
  };
  options: {
    privateAttributes: ['id', 'created_at'];
    populateCreatorFields: true;
    draftAndPublish: true;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    google_client_id: Attribute.String & Attribute.Required;
    google_client_secret: Attribute.String & Attribute.Required;
    google_redirect_url: Attribute.String & Attribute.Required;
    google_scopes: Attribute.JSON & Attribute.Required;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::strapi-google-auth.google-credential',
      'oneToOne',
      'admin::user'
    >;
    updatedBy: Attribute.Relation<
      'plugin::strapi-google-auth.google-credential',
      'oneToOne',
      'admin::user'
    >;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    nombre: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 2;
        maxLength: 100;
      }>;
    apellidos: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 3;
        maxLength: 250;
      }>;
    avatar: Attribute.Media;
    slug: Attribute.UID;
    averageScore: Attribute.Decimal &
      Attribute.SetMinMax<{
        max: 5;
      }> &
      Attribute.DefaultTo<0>;
    headline: Attribute.String;
    company: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    demo: Attribute.Boolean & Attribute.DefaultTo<false>;
    demoStartDate: Attribute.DateTime;
    encargado: Attribute.String;
    posicion: Attribute.String;
    telefono: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCategoriaCategoria extends Schema.CollectionType {
  collectionName: 'categorias';
  info: {
    singularName: 'categoria';
    pluralName: 'categorias';
    displayName: 'Categoria';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    nombre: Attribute.String & Attribute.Required;
    descripcion: Attribute.Text;
    orden: Attribute.Integer &
      Attribute.SetMinMax<{
        min: 0;
        max: 99;
      }> &
      Attribute.DefaultTo<0>;
    categoria_padre: Attribute.Relation<
      'api::categoria.categoria',
      'oneToOne',
      'api::categoria.categoria'
    >;
    slug: Attribute.UID<'api::categoria.categoria', 'nombre'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::categoria.categoria',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::categoria.categoria',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiClaseClase extends Schema.CollectionType {
  collectionName: 'clases';
  info: {
    singularName: 'clase';
    pluralName: 'clases';
    displayName: 'clase';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    curso: Attribute.Relation<
      'api::clase.clase',
      'oneToOne',
      'api::curso.curso'
    >;
    clase: Attribute.Media;
    descripcion: Attribute.Text;
    nombre: Attribute.String & Attribute.Required;
    uuid: Attribute.UID;
    publico: Attribute.Boolean & Attribute.DefaultTo<false>;
    duracion: Attribute.String;
    additionalResources: Attribute.Text;
    subtitles: Attribute.Component<'class.subtitles', true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::clase.clase',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::clase.clase',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiClasesFinalizadaClasesFinalizada
  extends Schema.CollectionType {
  collectionName: 'clases_finalizadas';
  info: {
    singularName: 'clases-finalizada';
    pluralName: 'clases-finalizadas';
    displayName: 'Clases finalizada';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    clase: Attribute.Relation<
      'api::clases-finalizada.clases-finalizada',
      'oneToOne',
      'api::clase.clase'
    >;
    curso: Attribute.Relation<
      'api::clases-finalizada.clases-finalizada',
      'oneToOne',
      'api::curso.curso'
    >;
    usuario: Attribute.Relation<
      'api::clases-finalizada.clases-finalizada',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    status: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::clases-finalizada.clases-finalizada',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::clases-finalizada.clases-finalizada',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiComentarioComentario extends Schema.CollectionType {
  collectionName: 'comentarios';
  info: {
    singularName: 'comentario';
    pluralName: 'comentarios';
    displayName: 'comentario';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    comentario: Attribute.Text & Attribute.Required;
    autor: Attribute.Relation<
      'api::comentario.comentario',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    clase: Attribute.Relation<
      'api::comentario.comentario',
      'oneToOne',
      'api::clase.clase'
    >;
    fecha_de_publicacion: Attribute.DateTime;
    lecturas: Attribute.Integer;
    curso: Attribute.Relation<
      'api::comentario.comentario',
      'oneToOne',
      'api::curso.curso'
    >;
    uuid: Attribute.UID;
    tipo: Attribute.Enumeration<['comentario', 'mensaje']> &
      Attribute.DefaultTo<'comentario'>;
    destinatario: Attribute.Relation<
      'api::comentario.comentario',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::comentario.comentario',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::comentario.comentario',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCompanyUserCompanyUser extends Schema.CollectionType {
  collectionName: 'company_users';
  info: {
    singularName: 'company-user';
    pluralName: 'company-users';
    displayName: 'company-user';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    user: Attribute.Relation<
      'api::company-user.company-user',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    company: Attribute.Relation<
      'api::company-user.company-user',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    role: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::company-user.company-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::company-user.company-user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConfigConfig extends Schema.SingleType {
  collectionName: 'configs';
  info: {
    singularName: 'config';
    pluralName: 'configs';
    displayName: 'config';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    tarifa_instructor_default: Attribute.Decimal &
      Attribute.Private &
      Attribute.SetMinMax<{
        min: 0;
        max: 100;
      }> &
      Attribute.DefaultTo<40>;
    tarifa_marketing_instructor: Attribute.Decimal &
      Attribute.Private &
      Attribute.SetMinMax<{
        min: 0;
        max: 100;
      }> &
      Attribute.DefaultTo<20>;
    tarifa_institucion: Attribute.Component<'course.tarifa-institucion'>;
    pasarela_paises: Attribute.Component<'pararelas.pararelas-paises'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::config.config',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::config.config',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCreditCredit extends Schema.CollectionType {
  collectionName: 'credits';
  info: {
    singularName: 'credit';
    pluralName: 'credits';
    displayName: 'Creditos';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    user: Attribute.Relation<
      'api::credit.credit',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    quantity: Attribute.Float &
      Attribute.SetMinMax<{
        min: 0;
      }> &
      Attribute.DefaultTo<0>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::credit.credit',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::credit.credit',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCuponCupon extends Schema.CollectionType {
  collectionName: 'cupons';
  info: {
    singularName: 'cupon';
    pluralName: 'cupons';
    displayName: 'cupon';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    nombre: Attribute.String & Attribute.Required;
    user: Attribute.Relation<
      'api::cupon.cupon',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    cursos: Attribute.Relation<
      'api::cupon.cupon',
      'oneToMany',
      'api::curso.curso'
    >;
    descripcion: Attribute.Text;
    uuid: Attribute.UID;
    slug: Attribute.UID<'api::cupon.cupon', 'nombre'>;
    tipo: Attribute.Enumeration<['porcentaje', 'monto']> &
      Attribute.DefaultTo<'monto'>;
    valor: Attribute.Decimal;
    estado: Attribute.Boolean & Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::cupon.cupon',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::cupon.cupon',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCursoCurso extends Schema.CollectionType {
  collectionName: 'cursos';
  info: {
    singularName: 'curso';
    pluralName: 'cursos';
    displayName: 'Curso';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 2;
        maxLength: 500;
      }>;
    precio: Attribute.Decimal & Attribute.Required;
    imagen: Attribute.Media;
    cupon_descuento: Attribute.String;
    instructor: Attribute.Relation<
      'api::curso.curso',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    tipo: Attribute.Enumeration<['curso', 'conferencia']> &
      Attribute.Required &
      Attribute.DefaultTo<'curso'>;
    certificado: Attribute.Boolean & Attribute.DefaultTo<false>;
    slug: Attribute.String & Attribute.Unique;
    averageScore: Attribute.Decimal;
    categoria: Attribute.Relation<
      'api::curso.curso',
      'oneToOne',
      'api::categoria.categoria'
    >;
    idioma: Attribute.String;
    cantidadEstudiantes: Attribute.Integer & Attribute.DefaultTo<0>;
    subTitles: Attribute.String;
    whatYouWillLearn: Attribute.Text;
    requirements: Attribute.Text;
    descripcion: Attribute.RichText;
    shortDescription: Attribute.RichText;
    precioDescuento: Attribute.Decimal;
    whoIsThisCourseFor: Attribute.Text;
    status: Attribute.Enumeration<['published', 'draft']> &
      Attribute.DefaultTo<'draft'>;
    additionalResources: Attribute.Integer & Attribute.DefaultTo<0>;
    nombre_institucion: Attribute.String;
    logo_institucion: Attribute.String;
    conference: Attribute.Component<'course.conference'> & Attribute.Private;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::curso.curso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::curso.curso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFaQFaQ extends Schema.CollectionType {
  collectionName: 'fa_qs';
  info: {
    singularName: 'fa-q';
    pluralName: 'fa-qs';
    displayName: 'FaQ';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    curso: Attribute.Relation<'api::fa-q.fa-q', 'oneToOne', 'api::curso.curso'>;
    user: Attribute.Relation<
      'api::fa-q.fa-q',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    title: Attribute.String & Attribute.Required;
    description: Attribute.Text;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::fa-q.fa-q', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::fa-q.fa-q', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiListWishlistListWishlist extends Schema.CollectionType {
  collectionName: 'list_wishlists';
  info: {
    singularName: 'list-wishlist';
    pluralName: 'list-wishlists';
    displayName: 'list_wishlist';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String;
    user: Attribute.Relation<
      'api::list-wishlist.list-wishlist',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    imagen: Attribute.Media;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::list-wishlist.list-wishlist',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::list-wishlist.list-wishlist',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMetaCompanyMetaCompany extends Schema.CollectionType {
  collectionName: 'meta_companies';
  info: {
    singularName: 'meta-company';
    pluralName: 'meta-companies';
    displayName: 'Meta-company';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    description: Attribute.Text;
    user: Attribute.Relation<
      'api::meta-company.meta-company',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    numberOfWorkers: Attribute.Integer;
    foundationDate: Attribute.Date;
    address: Attribute.String;
    facebook: Attribute.String;
    instagram: Attribute.String;
    linkedin: Attribute.String;
    notificacion_mensajes: Attribute.Boolean & Attribute.DefaultTo<false>;
    notificacion_promocion: Attribute.Boolean & Attribute.DefaultTo<false>;
    notificacion_anuncios_instructores: Attribute.Boolean &
      Attribute.DefaultTo<false>;
    stripe_account_id: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::meta-company.meta-company',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::meta-company.meta-company',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMetaInstitutionMetaInstitution
  extends Schema.CollectionType {
  collectionName: 'meta_institutions';
  info: {
    singularName: 'meta-institution';
    pluralName: 'meta-institutions';
    displayName: 'meta-institution';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    description: Attribute.Text;
    user: Attribute.Relation<
      'api::meta-institution.meta-institution',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    foundationDate: Attribute.Date;
    address: Attribute.String;
    facebook: Attribute.String;
    linkedin: Attribute.String;
    instagram: Attribute.String;
    stripe_account_id: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::meta-institution.meta-institution',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::meta-institution.meta-institution',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMetaUsuarioMetaUsuario extends Schema.CollectionType {
  collectionName: 'meta_usuarios';
  info: {
    singularName: 'meta-usuario';
    pluralName: 'meta-usuarios';
    displayName: 'meta-usuario';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    usuario: Attribute.Relation<
      'api::meta-usuario.meta-usuario',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    notificacion_promocion: Attribute.Boolean & Attribute.DefaultTo<false>;
    notificacion_mensajes: Attribute.Boolean & Attribute.DefaultTo<false>;
    notificacion_anuncios_instructores: Attribute.Boolean &
      Attribute.DefaultTo<false>;
    profesion: Attribute.String & Attribute.Required;
    biografia: Attribute.Text & Attribute.Required;
    birthday: Attribute.Date;
    address: Attribute.Text;
    stripe_account_id: Attribute.String & Attribute.Private;
    facebook: Attribute.String;
    instagram: Attribute.String;
    linkedin: Attribute.String;
    paypal_account_id: Attribute.String;
    stripe_account_id_state: Attribute.Enumeration<
      ['none', 'pending', 'completed']
    > &
      Attribute.DefaultTo<'none'>;
    session_stripe_id: Attribute.String & Attribute.Private;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::meta-usuario.meta-usuario',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::meta-usuario.meta-usuario',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMisCursoMisCurso extends Schema.CollectionType {
  collectionName: 'mis_cursos';
  info: {
    singularName: 'mis-curso';
    pluralName: 'mis-cursos';
    displayName: 'mis_curso';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    curso: Attribute.Relation<
      'api::mis-curso.mis-curso',
      'oneToOne',
      'api::curso.curso'
    >;
    usuario: Attribute.Relation<
      'api::mis-curso.mis-curso',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    completado: Attribute.Boolean & Attribute.DefaultTo<false>;
    progress: Attribute.Decimal;
    instructor: Attribute.Relation<
      'api::mis-curso.mis-curso',
      'oneToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Private;
    buying_company: Attribute.Relation<
      'api::mis-curso.mis-curso',
      'oneToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Private;
    course_company: Attribute.Boolean;
    certificado: Attribute.Media;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::mis-curso.mis-curso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::mis-curso.mis-curso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNotificacionNotificacion extends Schema.CollectionType {
  collectionName: 'notificacions';
  info: {
    singularName: 'notificacion';
    pluralName: 'notificacions';
    displayName: 'Notificacion';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    user: Attribute.Relation<
      'api::notificacion.notificacion',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    fecha: Attribute.DateTime;
    estado: Attribute.Boolean & Attribute.DefaultTo<false>;
    tipo: Attribute.Enumeration<
      ['curso', 'mensaje', 'pago', 'descuento', 'aviso']
    >;
    descripcion: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    url: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::notificacion.notificacion',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::notificacion.notificacion',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPedidoPedido extends Schema.CollectionType {
  collectionName: 'pedidos';
  info: {
    singularName: 'pedido';
    pluralName: 'pedidos';
    displayName: 'pedido';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    cursos: Attribute.Relation<
      'api::pedido.pedido',
      'oneToMany',
      'api::curso.curso'
    >;
    cantidad: Attribute.Integer;
    total: Attribute.Decimal & Attribute.DefaultTo<0>;
    sub_total: Attribute.Decimal & Attribute.DefaultTo<0>;
    descuento: Attribute.Decimal;
    usuario: Attribute.Relation<
      'api::pedido.pedido',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    metodo_de_pago: Attribute.String;
    monto_comision: Attribute.String;
    raw: Attribute.Text;
    destinatarios: Attribute.Text;
    estado: Attribute.Enumeration<
      ['creado', 'cancelado', 'rechazado', 'completado']
    > &
      Attribute.DefaultTo<'creado'>;
    stripe_sesion_id: Attribute.String;
    fee: Attribute.String;
    fee_comision: Attribute.String;
    paymentInId: Attribute.String;
    cargo_raw: Attribute.Text;
    cargo_id: Attribute.String;
    paypal_sesion_id: Attribute.String;
    cardnetSession: Attribute.String;
    cardnetSk: Attribute.String;
    cardNetDataResponse: Attribute.Component<'pararelas.cardnet-response'> &
      Attribute.Private;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pedido.pedido',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::pedido.pedido',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProductoProducto extends Schema.CollectionType {
  collectionName: 'productos';
  info: {
    singularName: 'producto';
    pluralName: 'productos';
    displayName: 'producto';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    nombre: Attribute.String & Attribute.Required;
    precio: Attribute.String;
    descripcion: Attribute.Text;
    uuid: Attribute.UID;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::producto.producto',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::producto.producto',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProjectProject extends Schema.CollectionType {
  collectionName: 'projects';
  info: {
    singularName: 'project';
    pluralName: 'projects';
    displayName: 'Project';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    curso: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'api::curso.curso'
    >;
    media: Attribute.Media &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    description: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    final: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::project.project',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiReferralLinkReferralLink extends Schema.CollectionType {
  collectionName: 'referral_links';
  info: {
    singularName: 'referral-link';
    pluralName: 'referral-links';
    displayName: 'Referral links';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    link: Attribute.String & Attribute.Required & Attribute.Unique;
    curso: Attribute.Relation<
      'api::referral-link.referral-link',
      'oneToOne',
      'api::curso.curso'
    >;
    instructor: Attribute.Relation<
      'api::referral-link.referral-link',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::referral-link.referral-link',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::referral-link.referral-link',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSupportSupport extends Schema.CollectionType {
  collectionName: 'supports';
  info: {
    singularName: 'support';
    pluralName: 'supports';
    displayName: 'Support';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    type: Attribute.Enumeration<['video_class', 'billing', 'other']> &
      Attribute.DefaultTo<'video_class'>;
    subject: Attribute.String;
    message: Attribute.Text;
    creator: Attribute.Relation<
      'api::support.support',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    date: Attribute.DateTime;
    state: Attribute.Enumeration<['open', 'canceled', 'closed']>;
    videoSupport: Attribute.Component<'support.video-support'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::support.support',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::support.support',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiValoracionCursoValoracionCurso
  extends Schema.CollectionType {
  collectionName: 'valoracion_cursos';
  info: {
    singularName: 'valoracion-curso';
    pluralName: 'valoracion-cursos';
    displayName: 'valoracion_curso';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    curso: Attribute.Relation<
      'api::valoracion-curso.valoracion-curso',
      'oneToOne',
      'api::curso.curso'
    >;
    usuario: Attribute.Relation<
      'api::valoracion-curso.valoracion-curso',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    asunto: Attribute.String & Attribute.Required;
    comentario: Attribute.Text & Attribute.Required;
    valoracion: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
        max: 5;
      }>;
    uuid: Attribute.UID;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::valoracion-curso.valoracion-curso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::valoracion-curso.valoracion-curso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiWishlistWishlist extends Schema.CollectionType {
  collectionName: 'wishlists';
  info: {
    singularName: 'wishlist';
    pluralName: 'wishlists';
    displayName: 'Wishlist';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    user: Attribute.Relation<
      'api::wishlist.wishlist',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    curso: Attribute.Relation<
      'api::wishlist.wishlist',
      'oneToOne',
      'api::curso.curso'
    >;
    list_wishlist: Attribute.Relation<
      'api::wishlist.wishlist',
      'oneToOne',
      'api::list-wishlist.list-wishlist'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::wishlist.wishlist',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::wishlist.wishlist',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::slugify.slug': PluginSlugifySlug;
      'plugin::email-designer.email-template': PluginEmailDesignerEmailTemplate;
      'plugin::strapi-google-auth.google-credential': PluginStrapiGoogleAuthGoogleCredential;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'api::categoria.categoria': ApiCategoriaCategoria;
      'api::clase.clase': ApiClaseClase;
      'api::clases-finalizada.clases-finalizada': ApiClasesFinalizadaClasesFinalizada;
      'api::comentario.comentario': ApiComentarioComentario;
      'api::company-user.company-user': ApiCompanyUserCompanyUser;
      'api::config.config': ApiConfigConfig;
      'api::credit.credit': ApiCreditCredit;
      'api::cupon.cupon': ApiCuponCupon;
      'api::curso.curso': ApiCursoCurso;
      'api::fa-q.fa-q': ApiFaQFaQ;
      'api::list-wishlist.list-wishlist': ApiListWishlistListWishlist;
      'api::meta-company.meta-company': ApiMetaCompanyMetaCompany;
      'api::meta-institution.meta-institution': ApiMetaInstitutionMetaInstitution;
      'api::meta-usuario.meta-usuario': ApiMetaUsuarioMetaUsuario;
      'api::mis-curso.mis-curso': ApiMisCursoMisCurso;
      'api::notificacion.notificacion': ApiNotificacionNotificacion;
      'api::pedido.pedido': ApiPedidoPedido;
      'api::producto.producto': ApiProductoProducto;
      'api::project.project': ApiProjectProject;
      'api::referral-link.referral-link': ApiReferralLinkReferralLink;
      'api::support.support': ApiSupportSupport;
      'api::valoracion-curso.valoracion-curso': ApiValoracionCursoValoracionCurso;
      'api::wishlist.wishlist': ApiWishlistWishlist;
    }
  }
}
