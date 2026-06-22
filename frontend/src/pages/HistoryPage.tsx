import { useEffect, useState } from 'react';
import { ErrorMessage } from '../components/ErrorMessage';
import { PageSection } from '../components/PageSection';
import { fetchMatchHistory } from '../lib/api';
import type { MatchHistoryEntry } from '../types';

function formatParticipants(entry: MatchHistoryEntry): string {
  const winners = entry.participants
    .filter((p) => p.team === 'winner')
    .map((p) => `${p.player_name}(${p.rate_delta >= 0 ? '+' : ''}${p.rate_delta})`)
    .join(', ');
  const losers = entry.participants
    .filter((p) => p.team === 'loser')
    .map((p) => `${p.player_name}(${p.rate_delta >= 0 ? '+' : ''}${p.rate_delta})`)
    .join(', ');
  return `勝: ${winners} / 敗: ${losers}`;
}

export function HistoryPage() {
  const [rows, setRows] = useState<MatchHistoryEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setRows(await fetchMatchHistory());
      } catch (err) {
        setError(err instanceof Error ? err.message : '戦績履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <PageSection title="戦績履歴">
      <ErrorMessage message={error} />
      {loading ? (
        <p>読み込み中...</p>
      ) : rows.length === 0 ? (
        <p>登録された戦績はありません。</p>
      ) : (
        <div className="history-list">
          {rows.map((entry) => (
            <article key={entry.match_id} className="history-card">
              <header>
                <strong>{new Date(entry.played_at).toLocaleString('ja-JP')}</strong>
                {entry.map_name ? <span> / MAP: {entry.map_name}</span> : null}
                {entry.external_match_id ? <span> / ID: {entry.external_match_id}</span> : null}
              </header>
              <p>{formatParticipants(entry)}</p>
              <small>K={entry.k_factor}</small>
            </article>
          ))}
        </div>
      )}
    </PageSection>
  );
}
