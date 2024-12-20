import type { Schema, Attribute } from '@strapi/strapi';

export interface ClassSubtitles extends Schema.Component {
  collectionName: 'components_class_subtitles';
  info: {
    displayName: 'subtitles';
  };
  attributes: {
    lang: Attribute.String;
    file: Attribute.Media;
  };
}

export interface CourseConference extends Schema.Component {
  collectionName: 'components_course_conferences';
  info: {
    displayName: 'conference';
    description: '';
  };
  attributes: {
    MeetingID: Attribute.String;
    MeetingURL: Attribute.String;
    MeetingStart: Attribute.DateTime;
    MeetingDuration: Attribute.String;
    state: Attribute.Enumeration<
      ['scheduled', 'in_progress', 'completed', 'canceled']
    > &
      Attribute.DefaultTo<'scheduled'>;
    meetingRAW: Attribute.Text & Attribute.Private;
    MeetingPassword: Attribute.String;
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

export interface VideoWhatYouWillLearn extends Schema.Component {
  collectionName: 'components_video_what_you_will_learns';
  info: {
    displayName: 'ArrayText';
    description: '';
  };
  attributes: {
    text: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'class.subtitles': ClassSubtitles;
      'course.conference': CourseConference;
      'course.tarifa-institucion': CourseTarifaInstitucion;
      'pararelas.cardnet-response': PararelasCardnetResponse;
      'pararelas.pararelas-paises': PararelasPararelasPaises;
      'support.video-support': SupportVideoSupport;
      'video.what-you-will-learn': VideoWhatYouWillLearn;
    }
  }
}
