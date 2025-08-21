export enum RegistrationType {
  COURSE = 'COURSE',
  TRIAL_LESSON = 'TRIAL_LESSON',
}

export type CourseRegistrationForm = {
  type: RegistrationType.COURSE;
  courseCode: string;
  parentName?: string;
  childName?: string;
  childAge?: number;
  email?: string;
  parentPhone?: string;
  selectedLessonId?: number;
  customerId?: number;
}


export type TrialLessonRegistrationForm = {
  type: RegistrationType.TRIAL_LESSON;
  courseCode: string;
  email?: string;
  parentPhone?: string;
  parentName?: string;
  childName?: string;
  childAge?: number;
  selectedLessonId?: number;
  selectedLessonTime?: string;
  customerId?: number;
}

export type RegistrationForm = CourseRegistrationForm | TrialLessonRegistrationForm;