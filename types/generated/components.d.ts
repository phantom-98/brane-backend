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

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'course.conference': CourseConference;
      'course.tarifa-institucion': CourseTarifaInstitucion;
      'pararelas.pararelas-paises': PararelasPararelasPaises;
    }
  }
}
