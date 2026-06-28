import type {
  AppSettings,
  MatchHistoryEntry,
  Player,
  RankingEntry,
  UserProfile,
  UserRole,
} from '../types';
import { supabase } from './supabase';

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, discord_id, display_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as UserProfile | null;
}

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Player[];
}

export async function fetchRanking(): Promise<RankingEntry[]> {
  const { data, error } = await supabase.rpc('get_ranking');
  if (error) {
    throw error;
  }
  return (data ?? []) as RankingEntry[];
}

export async function fetchMatchHistory(limit = 50): Promise<MatchHistoryEntry[]> {
  const { data, error } = await supabase.rpc('get_match_history', { p_limit: limit });
  if (error) {
    throw error;
  }
  return (data ?? []) as MatchHistoryEntry[];
}

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'k_factor')
    .maybeSingle();

  if (error) {
    throw error;
  }

  const value = (data?.value ?? { value: 32, editable: false }) as {
    value: number;
    editable?: boolean;
  };

  return {
    k_factor: value.value ?? 32,
    k_editable: value.editable ?? false,
  };
}

export async function createPlayer(name: string, initialRate: number): Promise<void> {
  const { error } = await supabase.from('players').insert({
    name: name.trim(),
    initial_rate: initialRate,
    current_rate: initialRate,
  });

  if (error) {
    throw error;
  }
}

export async function renamePlayer(playerId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ name: name.trim() })
    .eq('id', playerId);

  if (error) {
    throw error;
  }
}

export async function registerMatch(params: {
  winnerPlayerIds: string[];
  loserPlayerIds: string[];
  externalMatchId?: string;
  mapName?: string;
  playedAt?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('register_match', {
    p_winner_player_ids: params.winnerPlayerIds,
    p_loser_player_ids: params.loserPlayerIds,
    p_external_match_id: params.externalMatchId ?? null,
    p_map_name: params.mapName ?? null,
    p_played_at: params.playedAt ?? new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function rollbackLastMatch(): Promise<string> {
  const { data, error } = await supabase.rpc('rollback_last_match');
  if (error) {
    throw error;
  }
  return data as string;
}

export async function resetRankings(): Promise<number> {
  const { data, error } = await supabase.rpc('reset_rankings');
  if (error) {
    throw error;
  }
  return data as number;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from('user_profiles').update({ role }).eq('id', userId);
  if (error) {
    throw error;
  }
}

export async function updateKFactor(kFactor: number, editable?: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_k_factor', {
    p_k_factor: kFactor,
    p_editable: editable ?? null,
  });
  if (error) {
    throw error;
  }
}

export async function signInWithDiscord(): Promise<void> {
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo },
  });
  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, discord_id, display_name, role')
    .order('display_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as UserProfile[];
}
