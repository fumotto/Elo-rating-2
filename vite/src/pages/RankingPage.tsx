import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorMessage } from '../components/ErrorMessage';
import { PageSection } from '../components/PageSection';
import { fetchRanking } from '../lib/api';
import type { RankingEntry } from '../types';

export function RankingPage() {
  const [rows, setRows] = useState<RankingEntry[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await fetchRanking());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ランキングの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.player_name.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <PageSection title="ランキング">
      <ErrorMessage message={error} onRetry={error ? loadRows : undefined} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          aria-label="ランキング検索"
          placeholder="名前で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '6px 8px', flex: '1 1 240px' }}
        />
        <div style={{ color: '#666' }}>{filtered.length} 件</div>
        {query ? (
          <button type="button" onClick={() => setQuery('')}>
            クリア
          </button>
        ) : null}
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : rows.length === 0 ? (
        <p>登録済みの選手がいません。</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>順位</th>
              <th>名前</th>
              <th>初期レート</th>
              <th>現レート</th>
            </tr>
          </thead>
          <tbody>
                {filtered.map((row) => (
              <tr key={row.player_id}>
                <td>{row.rank}</td>
                    <td style={{ fontWeight: row.rank <= 10 ? 600 : 400 }}>
                      {row.rank === 1 ? '🏆 ' : row.rank === 2 ? '🥈 ' : row.rank === 3 ? '🥉 ' : ''}
                      {row.player_name}
                    </td>
                <td>{row.initial_rate}</td>
                <td>{row.current_rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PageSection>
  );
}
