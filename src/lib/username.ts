/**
 * Client-side copy of the backend's username rules, for instant feedback while
 * typing. The server stays authoritative: it also rejects reserved handles
 * (admin, quza, support…) and checks availability.
 */
export const USERNAME_MIN = 3
export const USERNAME_MAX = 30

/** Lowercase and drop a leading "@", the same way the server stores it. */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase()
}

/** A human-readable reason the username can't be used, or null. */
export function usernameProblem(username: string): string | null {
  if (username.length < USERNAME_MIN) return `Usernames need at least ${USERNAME_MIN} characters`
  if (username.length > USERNAME_MAX) return `Usernames can be at most ${USERNAME_MAX} characters`
  if (/[^a-z0-9._]/.test(username)) return 'Use only letters, numbers, periods and underscores'
  if (!/^[a-z0-9]/.test(username)) return 'Usernames must start with a letter or number'
  if (username.endsWith('.')) return 'Usernames can’t end with a period'
  if (username.includes('..')) return 'Usernames can’t have two periods in a row'
  return null
}
