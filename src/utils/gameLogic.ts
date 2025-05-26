
import { DeceasedCelebrity, ScoreBreakdown } from "@/types";

export function calculateScore(deceased: DeceasedCelebrity, weeklyDeaths: number = 0): ScoreBreakdown {
  const basePoints = 100 - deceased.ageAtDeath;
  let causeBonus = 0;
  
  // Cause of death bonuses
  switch (deceased.causeOfDeathCategory) {
    case 'Natural':
      causeBonus = deceased.ageAtDeath >= 80 ? 5 : 10;
      break;
    case 'Accidental':
      causeBonus = deceased.ageAtDeath >= 80 ? 15 : 25;
      break;
    case 'Violent':
      causeBonus = deceased.ageAtDeath >= 80 ? 30 : 50;
      break;
    case 'Suicide':
      causeBonus = deceased.ageAtDeath >= 80 ? 20 : 40;
      break;
    case 'RareOrUnusual':
      causeBonus = 50;
      break;
    case 'PandemicOrOutbreak':
      causeBonus = deceased.ageAtDeath >= 80 ? 20 : 35;
      break;
  }

  // Special circumstance bonuses
  const specialBonuses = {
    birthday: deceased.diedOnBirthday ? 15 : 0,
    holiday: deceased.diedOnMajorHoliday ? 10 : 0,
    firstOfYear: deceased.isFirstDeathOfYear ? 10 : 0,
    lastOfYear: deceased.isLastDeathOfYear ? 10 : 0,
    publicEvent: deceased.diedDuringPublicEvent ? 25 : 0,
    extremeSport: deceased.diedInExtremeSport ? 30 : 0,
    weeklyBonus: weeklyDeaths > 0 ? weeklyDeaths * 5 : 0
  };

  const totalSpecialBonus = Object.values(specialBonuses).reduce((sum, bonus) => sum + bonus, 0);
  const totalPoints = basePoints + causeBonus + totalSpecialBonus;

  return {
    basePoints,
    causeBonus,
    specialBonuses,
    totalPoints
  };
}

export function checkIfBirthday(dateOfBirth: string, dateOfDeath: string): boolean {
  const birth = new Date(dateOfBirth);
  const death = new Date(dateOfDeath);
  
  return birth.getMonth() === death.getMonth() && birth.getDate() === death.getDate();
}

export function checkIfMajorHoliday(dateOfDeath: string, holidays: Array<{date: string}>): boolean {
  const death = new Date(dateOfDeath);
  const deathMonthDay = `${String(death.getMonth() + 1).padStart(2, '0')}-${String(death.getDate()).padStart(2, '0')}`;
  
  return holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    const holidayMonthDay = `${String(holidayDate.getMonth() + 1).padStart(2, '0')}-${String(holidayDate.getDate()).padStart(2, '0')}`;
    return holidayMonthDay === deathMonthDay;
  });
}

export function getWeekNumber(date: string): number {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + yearStart.getDay() + 1) / 7);
  return weekNumber;
}

export function calculateAge(dateOfBirth: string, dateOfDeath: string): number {
  const birth = new Date(dateOfBirth);
  const death = new Date(dateOfDeath);
  
  let age = death.getFullYear() - birth.getFullYear();
  const monthDiff = death.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Default major holidays for 2025
export const MAJOR_HOLIDAYS_2025 = [
  { name: "New Year's Day", date: "2025-01-01" },
  { name: "Martin Luther King Jr. Day", date: "2025-01-20" },
  { name: "Presidents' Day", date: "2025-02-17" },
  { name: "Memorial Day", date: "2025-05-26" },
  { name: "Independence Day", date: "2025-07-04" },
  { name: "Labor Day", date: "2025-09-01" },
  { name: "Columbus Day", date: "2025-10-13" },
  { name: "Veterans Day", date: "2025-11-11" },
  { name: "Thanksgiving", date: "2025-11-27" },
  { name: "Christmas Day", date: "2025-12-25" },
  { name: "Valentine's Day", date: "2025-02-14" },
  { name: "Easter", date: "2025-04-20" },
  { name: "Mother's Day", date: "2025-05-11" },
  { name: "Father's Day", date: "2025-06-15" },
  { name: "Halloween", date: "2025-10-31" }
];
