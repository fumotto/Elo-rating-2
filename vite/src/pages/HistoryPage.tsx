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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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
              {rows.map((entry) => {
                const isOpen = Boolean(expanded[entry.match_id]);
                const winners = entry.participants
                  .filter((p) => p.team === 'winner')
                  .sort((a, b) => a.slot - b.slot);
                const losers = entry.participants
                  .filter((p) => p.team === 'loser')
                  .sort((a, b) => a.slot - b.slot);

                return (
                  <article key={entry.match_id} className="history-card">
                <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{new Date(entry.played_at).toLocaleString('ja-JP')}</strong>
                    {entry.map_name ? <span> / MAP: {entry.map_name}</span> : null}
                    {entry.external_match_id ? <span> / ID: {entry.external_match_id}</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <small>K={entry.k_factor}</small>
                    <button
                      type="button"
                      onClick={() => setExpanded((s) => ({ ...s, [entry.match_id]: !isOpen }))}
                    >
                      {isOpen ? '閉じる ▲' : '展開 ▼'}
                    </button>
                  </div>
                </header>

                <p style={{ marginTop: 8 }}>{formatParticipants(entry)}</p>

                {isOpen ? (
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <section>
                      <h4>勝者チーム</h4>
                      <table className="data-table small">
                        <thead>
                          <tr>
                            <th>Slot</th>
                            <th>Player</th>
                            <th>Before</th>
                            <th>After</th>
                            <th>Δ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {winners.map((p) => (
                            <tr key={String(p.player_id)}>
                              <td>{p.slot}</td>
                              <td>{p.player_name}</td>
                              <td>{p.rate_before}</td>
                              <td>{p.rate_after}</td>
                              <td style={{ color: p.rate_delta >= 0 ? 'green' : 'red' }}>{p.rate_delta >= 0 ? `+${p.rate_delta}` : p.rate_delta}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>

                    <section>
                      <h4>敗者チーム</h4>
                      <table className="data-table small">
                        <thead>
                          <tr>
                            <th>Slot</th>
                            <th>Player</th>
                            <th>Before</th>
                            <th>After</th>
                            <th>Δ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {losers.map((p) => (
                            <tr key={String(p.player_id)}>
                              <td>{p.slot}</td>
                              <td>{p.player_name}</td>
                              <td>{p.rate_before}</td>
                              <td>{p.rate_after}</td>
                              <td style={{ color: p.rate_delta >= 0 ? 'green' : 'red' }}>{p.rate_delta >= 0 ? `+${p.rate_delta}` : p.rate_delta}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}
