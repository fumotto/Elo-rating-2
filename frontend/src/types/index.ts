export type UserRole = 'admin_user' | 'normal_user' | 'guest_user';

export interface UserProfile {
  id: string;
  discord_id: string | null;
  display_name: string | null;
  role: UserRole;
}

export interface Player {
  id: string;
  name: string;
  initial_rate: number;
  current_rate: number;
  created_at: string;
  updated_at: string;
}

export interface RankingEntry {
  rank: number;
  player_id: string;
  player_name: string;
  initial_rate: number;
  current_rate: number;
}

export interface MatchParticipant {
  player_id: string;
  player_name: string;
  team: 'winner' | 'loser';
  slot: number;
  rate_before: number;
  rate_after: number;
  rate_delta: number;
}

export interface MatchHistoryEntry {
  match_id: string;
  external_match_id: string | null;
  map_name: string | null;
  played_at: string;
  k_factor: number;
  registered_by: string | null;
  participants: MatchParticipant[];
}

export interface AppSettings {
  k_factor: number;
  k_editable: boolean;
}

export interface OcrMatchJson {
  MATCH_ID?: string;
  date?: string;
  MAP?: string;
  ALPHA?: { result: 'WIN' | 'LOSE'; players: string[] };
  BETA?: { result: 'WIN' | 'LOSE'; players: string[] };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_user: '管理者',
  normal_user: '選手',
  guest_user: 'ゲスト',
};

export function canRegisterMatches(role: UserRole | null): boolean {
  return role === 'admin_user' || role === 'normal_user';
}

export function canManagePlayers(role: UserRole | null): boolean {
  return role === 'admin_user';
}

export function canRollback(role: UserRole | null): boolean {
  return role === 'admin_user';
}

export function canResetRankings(role: UserRole | null): boolean {
  return role === 'admin_user';
}

export function canViewRanking(): boolean {
  return true;
}

export function canViewHistory(): boolean {
  return true;
}
