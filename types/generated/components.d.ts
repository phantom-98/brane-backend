import type { Schema, Attribute } from '@strapi/strapi';

export interface CourseConference extends Schema.Component {
  collectionName: 'components_course_conferences';
  info: {
    displayName: 'conference';
    description: '';
  };
  attributes: {
    ZoomMeetingID: Attribute.String;
    ZoomURL: Attribute.String;
    ZoomStart: Attribute.DateTime;
    ZoomDuration: Attribute.String;
    state: Attribute.Enumeration<
      ['scheduled', 'in_progress', 'completed', 'canceled']
    > &
      Attribute.DefaultTo<'scheduled'>;
    meetingRAW: Attribute.Text & Attribute.Private;
    ZoomPassword: Attribute.String;
  };
}

export interface CourseTarifaInstitucion extends Schema.Component {
  collectionName: 'components_course_tarifa_institucions';
  info: {
    displayName: 'tarifa_institucion';
    description: '';
  };
  attributes: {
    tarifa_brane: Attribute.Decimal &
      Attribute.Private &
      Attribute.SetMinMax<{
        min: 0;
        max: 100;
      }> &
      Attribute.DefaultTo<20>;
    tarifa_profesor: Attribute.Decimal &
      Attribute.Private &
      Attribute.SetMinMax<{
        min: 0;
        max: 100;
      }> &
      Attribute.DefaultTo<40>;
    tarifa_institucion: Attribute.Decimal &
      Attribute.SetMinMax<{
        min: 0;
        max: 100;
      }> &
      Attribute.DefaultTo<40>;
  };
}

export interface PararelasCardnetResponse extends Schema.Component {
  collectionName: 'components_pararelas_cardnet_responses';
  info: {
    displayName: 'cardnetResponse';
    description: '';
  };
  attributes: {
    AuthorizationCode: Attribute.String;
    TxToken: Attribute.String;
    ResponseCode: Attribute.String;
    CreditcardNumber: Attribute.String;
    CreditCardNumber: Attribute.String;
    RetrivalReferenceNumber: Attribute.String;
    RemoteResponseCode: Attribute.String;
    textResponse: Attribute.String;
  };
}

export interface PararelasPararelasPaises extends Schema.Component {
  collectionName: 'components_pararelas_pararelas_paises';
  info: {
    displayName: 'pararelas_paises';
    description: '';
  };
  attributes: {
    DOM: Attribute.JSON & Attribute.Private;
    US: Attribute.JSON;
  };
}

export interface SupportVideoSupport extends Schema.Component {
  collectionName: 'components_support_video_supports';
  info: {
    displayName: 'Video Support';
    description: '';
  };
  attributes: {
    curso: Attribute.Relation<
      'support.video-support',
      'oneToOne',
      'api::curso.curso'
    >;
    clase: Attribute.Relation<
      'support.video-support',
      'oneToOne',
      'api::clase.clase'
    >;
    path: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'course.conference': CourseConference;
      'course.tarifa-institucion': CourseTarifaInstitucion;
      'pararelas.cardnet-response': PararelasCardnetResponse;
      'pararelas.pararelas-paises': PararelasPararelasPaises;
      'support.video-support': SupportVideoSupport;
    }
  }
}
