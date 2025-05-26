
import { User, CelebrityPick, DeceasedCelebrity } from "@/types";

// Storage keys
const USERS_KEY = 'deadpool_users';
const PICKS_KEY = 'deadpool_picks';
const DECEASED_KEY = 'deadpool_deceased';
const CURRENT_USER_KEY = 'currentUser';

// Users
export function getUsers(): User[] {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Celebrity Picks
export function getPicks(): CelebrityPick[] {
  const picks = localStorage.getItem(PICKS_KEY);
  return picks ? JSON.parse(picks) : [];
}

export function savePicks(picks: CelebrityPick[]): void {
  localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
}

export function getUserPicks(userId: string, gameYear: number = 2025): CelebrityPick[] {
  const allPicks = getPicks();
  return allPicks.filter(pick => pick.userId === userId && pick.gameYear === gameYear);
}

// Deceased Celebrities
export function getDeceasedCelebrities(): DeceasedCelebrity[] {
  const deceased = localStorage.getItem(DECEASED_KEY);
  return deceased ? JSON.parse(deceased) : [];
}

export function saveDeceasedCelebrities(deceased: DeceasedCelebrity[]): void {
  localStorage.setItem(DECEASED_KEY, JSON.stringify(deceased));
}

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function updateUserScore(userId: string, newScore: number): void {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].totalScore = newScore;
    saveUsers(users);
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(users[userIndex]);
    }
  }
}

// Initialize with some sample data if empty
export function initializeSampleData(): void {
  const users = getUsers();
  if (users.length === 0) {
    const sampleUsers: User[] = [
      {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@deadpool.com',
        isAdmin: true,
        totalScore: 0,
        createdAt: new Date().toISOString()
      }
    ];
    saveUsers(sampleUsers);
  }
}
