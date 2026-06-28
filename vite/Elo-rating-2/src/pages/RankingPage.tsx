import { useEffect, useState } from 'react';
import { ErrorMessage } from '../components/ErrorMessage';
import { PageSection } from '../components/PageSection';
import { fetchRanking } from '../lib/api';
import type { RankingEntry } from '../types';

export function RankingPage() {
  const [rows, setRows] = useState<RankingEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setRows(await fetchRanking());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ランキングの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <PageSection title="ランキング">
      <ErrorMessage message={error} />
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
            {rows.map((row) => (
              <tr key={row.player_id}>
                <td>{row.rank}</td>
                <td>{row.player_name}</td>
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
