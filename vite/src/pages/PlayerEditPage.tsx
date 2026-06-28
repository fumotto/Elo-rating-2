import { useEffect, useState } from 'react';
import { PageSection } from '../components/PageSection';
import { useAuth } from '../hooks/useAuth';
import { fetchPlayers, updatePlayer, deletePlayer } from '../lib/api';
import type { Player } from '../types';
import { ErrorMessage } from '../components/ErrorMessage';

export default function PlayerEditPage() {
    const { profile } = useAuth();
    const [players, setPlayers] = useState<Player[]>([]);
    const [localMap, setLocalMap] = useState<Record<string, Partial<Player>>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await fetchPlayers();
            setPlayers(rows);
            setLocalMap(Object.fromEntries(rows.map((r) => [r.id, { ...r }])));
        } catch (e) {
            setError(e instanceof Error ? e.message : '選手一覧の取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    if (!profile || profile.role !== 'admin_user') {
        return (
            <PageSection title="選手編集">
                <p>管理者のみアクセスできます。</p>
            </PageSection>
        );
    }

    return (
        <div className="stack">
            <PageSection title="選手編集">
                <ErrorMessage message={error} />
                {loading ? (
                    <p>読み込み中...</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>名前</th>
                                    <th>SteamID</th>
                                    <th>PSN ID</th>
                                <th>初期レート</th>
                                <th>現レート</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((p) => {
                                const local = localMap[p.id] ?? {};
                                const name = (local.name as string) ?? p.name;
                                const steamId = (local.steam_id as string) ?? p.steam_id ?? '';
                                const psnId = (local.psn_id as string) ?? p.psn_id ?? '';
                                const initial = (local.initial_rate as number) ?? p.initial_rate;
                                const current = (local.current_rate as number) ?? p.current_rate;
                                const rowErrors: string[] = [];
                                if (!name || name.trim().length === 0) rowErrors.push('名前は必須です');
                                if (!Number.isFinite(initial) || initial < 0) rowErrors.push('初期レートは0以上の数値である必要があります');
                                if (!Number.isFinite(current) || current < 0) rowErrors.push('現レートは0以上の数値である必要があります');
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <input
                                                value={name}
                                                onChange={(e) =>
                                                    setLocalMap((prev) => ({
                                                        ...prev,
                                                        [p.id]: { ...(prev[p.id] ?? {}), name: e.target.value },
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                value={steamId}
                                                onChange={(e) =>
                                                    setLocalMap((prev) => ({
                                                        ...prev,
                                                        [p.id]: { ...(prev[p.id] ?? {}), steam_id: e.target.value },
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                value={psnId}
                                                onChange={(e) =>
                                                    setLocalMap((prev) => ({
                                                        ...prev,
                                                        [p.id]: { ...(prev[p.id] ?? {}), psn_id: e.target.value },
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={initial}
                                                onChange={(e) =>
                                                    setLocalMap((prev) => ({
                                                        ...prev,
                                                        [p.id]: { ...(prev[p.id] ?? {}), initial_rate: Number(e.target.value) },
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={current}
                                                onChange={(e) =>
                                                    setLocalMap((prev) => ({
                                                        ...prev,
                                                        [p.id]: { ...(prev[p.id] ?? {}), current_rate: Number(e.target.value) },
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    setError('');
                                                    if (rowErrors.length > 0) {
                                                        setError(rowErrors.join('; '));
                                                        return;
                                                    }
                                                    try {
                                                        const updates = localMap[p.id] ?? {};
                                                        await updatePlayer(p.id, {
                                                            name: updates.name as string | undefined,
                                                            steam_id: updates.steam_id as string | undefined,
                                                            psn_id: updates.psn_id as string | undefined,
                                                            initial_rate: updates.initial_rate as number | undefined,
                                                            current_rate: updates.current_rate as number | undefined,
                                                        });
                                                        await load();
                                                    } catch (e) {
                                                        setError(e instanceof Error ? e.message : '更新に失敗しました');
                                                    }
                                                }}
                                            >
                                                保存
                                            </button>
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={async () => {
                                                    if (!window.confirm('この選手を削除しますか？ 戻せません。')) return;
                                                    setError('');
                                                    try {
                                                        await deletePlayer(p.id);
                                                        await load();
                                                    } catch (e) {
                                                        setError(e instanceof Error ? e.message : '削除に失敗しました');
                                                    }
                                                }}
                                            >
                                                削除
                                            </button>
                                            {rowErrors.length > 0 ? (
                                                <div style={{ color: 'var(--color-danger)', marginTop: 6 }}>{rowErrors.join(' / ')}</div>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </PageSection>
        </div>
    );
}
