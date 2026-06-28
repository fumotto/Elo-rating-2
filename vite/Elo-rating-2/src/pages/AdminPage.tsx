import { useEffect, useState } from 'react';
import { ErrorMessage } from '../components/ErrorMessage';
import { PageSection } from '../components/PageSection';
import { useAuth } from '../contexts/AuthContext';
import {
  createPlayer,
  fetchAllProfiles,
  fetchAppSettings,
  fetchPlayers,
  renamePlayer,
  resetRankings,
  rollbackLastMatch,
  updateKFactor,
  updateUserRole,
} from '../lib/api';
import { ROLE_LABELS, type Player, type UserProfile, type UserRole } from '../types';

export function AdminPage() {
  const { profile } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [kFactor, setKFactor] = useState(32);
  const [kEditable, setKEditable] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRate, setNewPlayerRate] = useState(1500);
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [playerRows, profileRows, settings] = await Promise.all([
        fetchPlayers(),
        fetchAllProfiles(),
        fetchAppSettings(),
      ]);
      setPlayers(playerRows);
      setProfiles(profileRows);
      setKFactor(settings.k_factor);
      setKEditable(settings.k_editable);
      setRenameMap(Object.fromEntries(playerRows.map((player) => [player.id, player.name])));
    } catch (err) {
      setError(err instanceof Error ? err.message : '管理データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作に失敗しました');
    }
  };

  if (!profile || profile.role !== 'admin_user') {
    return (
      <PageSection title="管理">
        <p>このページは管理者のみ利用できます。</p>
      </PageSection>
    );
  }

  return (
    <div className="stack">
      <PageSection title="Supabase / サーバー">
        <p>
          本番・開発環境の Supabase プロジェクトは GitHub Actions と環境変数で切り替えます。
          初回は Supabase CLI で `supabase db push` を実行してマイグレーションを適用してください。
        </p>
      </PageSection>

      <PageSection title="K 係数">
        <ErrorMessage message={error} />
        {message ? <div className="success-banner">{message}</div> : null}
        <div className="inline-form">
          <input
            type="number"
            value={kFactor}
            disabled={!kEditable}
            onChange={(e) => setKFactor(Number(e.target.value))}
          />
          <label>
            <input
              type="checkbox"
              checked={kEditable}
              onChange={(e) => setKEditable(e.target.checked)}
            />
            編集を許可
          </label>
          <button
            type="button"
            onClick={() =>
              void runAction(
                () => updateKFactor(kFactor, kEditable),
                'K 係数を更新しました',
              )
            }
          >
            K 係数を保存
          </button>
        </div>
      </PageSection>

      <PageSection title="選手登録">
        <div className="inline-form">
          <input
            placeholder="名前(SteamID)"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
          />
          <input
            type="number"
            value={newPlayerRate}
            onChange={(e) => setNewPlayerRate(Number(e.target.value))}
          />
          <button
            type="button"
            onClick={() =>
              void runAction(async () => {
                await createPlayer(newPlayerName, newPlayerRate);
                setNewPlayerName('');
                setNewPlayerRate(1500);
              }, '選手を追加しました')
            }
          >
            選手追加
          </button>
        </div>
      </PageSection>

      <PageSection title="選手一覧 / 名前変更">
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>初期レート</th>
                <th>現レート</th>
                <th>変更</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>
                    <input
                      value={renameMap[player.id] ?? player.name}
                      onChange={(e) =>
                        setRenameMap((prev) => ({ ...prev, [player.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td>{player.initial_rate}</td>
                  <td>{player.current_rate}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        void runAction(
                          () => renamePlayer(player.id, renameMap[player.id] ?? player.name),
                          `${player.name} の名前を更新しました`,
                        )
                      }
                    >
                      保存
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageSection>

      <PageSection title="戦績操作">
        <div className="inline-form">
          <button
            type="button"
            onClick={() =>
              void runAction(
                rollbackLastMatch,
                '最新の戦績をロールバックしました',
              )
            }
          >
            最新戦績をロールバック
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (window.confirm('全選手のレートを初期値に戻し、戦績を全削除します。よろしいですか？')) {
                void runAction(resetRankings, 'ランキングをリセットしました');
              }
            }}
          >
            ランクリセット
          </button>
        </div>
      </PageSection>

      <PageSection title="ユーザロール">
        <table className="data-table">
          <thead>
            <tr>
              <th>表示名</th>
              <th>Discord ID</th>
              <th>ロール</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((user) => (
              <tr key={user.id}>
                <td>{user.display_name ?? '-'}</td>
                <td>{user.discord_id ?? '-'}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      void runAction(
                        () => updateUserRole(user.id, e.target.value as UserRole),
                        `${user.display_name ?? user.id} のロールを更新しました`,
                      )
                    }
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>
    </div>
  );
}
