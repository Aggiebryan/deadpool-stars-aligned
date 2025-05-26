
export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  totalScore: number;
  createdAt: string;
}

export interface CelebrityPick {
  id: string;
  userId: string;
  celebrityName: string;
  gameYear: number;
  isHit: boolean;
  pointsAwarded: number;
  createdAt: string;
}

export interface DeceasedCelebrity {
  id: string;
  canonicalName: string;
  dateOfBirth: string;
  dateOfDeath: string;
  ageAtDeath: number;
  causeOfDeathCategory: 'Natural' | 'Accidental' | 'Violent' | 'Suicide' | 'RareOrUnusual' | 'PandemicOrOutbreak';
  causeOfDeathDetails?: string;
  diedDuringPublicEvent: boolean;
  diedInExtremeSport: boolean;
  diedOnBirthday: boolean;
  diedOnMajorHoliday: boolean;
  isFirstDeathOfYear: boolean;
  isLastDeathOfYear: boolean;
  gameYear: number;
  enteredByAdminId: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  gameYear: number;
}

export interface ScoreBreakdown {
  basePoints: number;
  causeBonus: number;
  specialBonuses: {
    birthday: number;
    holiday: number;
    firstOfYear: number;
    lastOfYear: number;
    publicEvent: number;
    extremeSport: number;
    weeklyBonus: number;
  };
  totalPoints: number;
}
