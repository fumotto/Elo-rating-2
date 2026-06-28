import { useEffect, useMemo, useState } from 'react';
import { ErrorMessage } from '../components/ErrorMessage';
import { PageSection } from '../components/PageSection';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchAppSettings,
  fetchPlayers,
  registerMatch,
} from '../lib/api';
import type { OcrMatchJson, Player } from '../types';

const OCR_PROMPT = `この『ARMORED CORE VI』の対戦結果画面のスクリーンショットを分析してください。
これは3対3のチーム戦の画像です
画像から以下の要素を抽出してください
* PlayerName(各プレイヤー表示の一番上の文字列)
* AssemblyName(各プレイヤー表示の中段の文字列)
* SteamID(各プレイヤー表示の一番下の文字列)
* Score(各プレイヤー表示の右側のPT)
* 勝敗
* MATCH ID
* 日時
* MAP(日時の右側の文字列)
返答はjson形式のみで、出力形式は下記とします、余分なテキストや説明は一切含めないでください
また、日時は2022-12-31T12:34:56のような形式に変換してください
{MATCH_ID, date, MAP, ALPHA:{result:WIN/LOSE, players:[SteamID,SteamID,SteamID]}, BETA:{result:WIN/LOSE, players:[SteamID,SteamID,SteamID]}}`;

function findPlayerIdByName(players: Player[], name: string): string | null {
  const normalized = name.trim();
  const exact = players.find((p) => p.name === normalized);
  if (exact) {
    return exact.id;
  }
  return players.find((p) => p.name.includes(normalized) || normalized.includes(p.name))?.id ?? null;
}

export function MatchRegisterPage() {
  const { profile } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [kFactor, setKFactor] = useState(32);
  const [winnerIds, setWinnerIds] = useState<string[]>(['', '', '']);
  const [loserIds, setLoserIds] = useState<string[]>(['', '', '']);
  const [ocrJson, setOcrJson] = useState('');
  const [externalMatchId, setExternalMatchId] = useState('');
  const [mapName, setMapName] = useState('');
  const [playedAt, setPlayedAt] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [playerRows, settings] = await Promise.all([fetchPlayers(), fetchAppSettings()]);
        setPlayers(playerRows);
        setKFactor(settings.k_factor);
      } catch (err) {
        setError(err instanceof Error ? err.message : '初期データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const playerOptions = useMemo(
    () =>
      players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.name} ({player.current_rate})
        </option>
      )),
    [players],
  );

  const updateSlot = (
    team: 'winner' | 'loser',
    index: number,
    value: string,
  ) => {
    if (team === 'winner') {
      setWinnerIds((prev) => prev.map((id, i) => (i === index ? value : id)));
    } else {
      setLoserIds((prev) => prev.map((id, i) => (i === index ? value : id)));
    }
  };

  const applyOcrJson = () => {
    try {
      if (!ocrJson.trim()) {
        return;
      }
      const json = JSON.parse(ocrJson) as OcrMatchJson;
      const nextWinners = ['', '', ''];
      const nextLosers = ['', '', ''];

      [json.ALPHA, json.BETA].forEach((team) => {
        if (!team) {
          return;
        }
        const ids = team.players.map((name) => findPlayerIdByName(players, name));
        if (team.result === 'WIN') {
          ids.forEach((id, index) => {
            nextWinners[index] = id ?? '';
          });
        } else {
          ids.forEach((id, index) => {
            nextLosers[index] = id ?? '';
          });
        }
      });

      setWinnerIds(nextWinners);
      setLoserIds(nextLosers);
      setExternalMatchId(json.MATCH_ID ?? '');
      setMapName(json.MAP ?? '');
      setPlayedAt(json.date ?? '');
      setMessage('OCR JSON を反映しました。未登録の選手名がないか確認してください。');
    } catch {
      setError('OCR JSON の解析に失敗しました。入力内容を確認してください。');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    const allIds = [...winnerIds, ...loserIds];
    if (allIds.some((id) => !id) || new Set(allIds).size < 6) {
      setError('6人の異なる選手を選択してください。');
      setSubmitting(false);
      return;
    }

    try {
      await registerMatch({
        winnerPlayerIds: winnerIds,
        loserPlayerIds: loserIds,
        externalMatchId: externalMatchId || undefined,
        mapName: mapName || undefined,
        playedAt: playedAt || undefined,
      });
      setMessage('戦績を登録しました。レート変動！');
      setWinnerIds(['', '', '']);
      setLoserIds(['', '', '']);
      setOcrJson('');
      setExternalMatchId('');
      setMapName('');
      setPlayedAt('');
      setPlayers(await fetchPlayers());
    } catch (err) {
      setError(err instanceof Error ? err.message : '戦績登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile || (profile.role !== 'admin_user' && profile.role !== 'normal_user')) {
    return (
      <PageSection title="戦績登録">
        <p>戦績登録には Discord ログイン後、選手または管理者ロールが必要です。</p>
      </PageSection>
    );
  }

  return (
    <div className="stack">
      <PageSection title="戦績登録">
        <p>現在の K 係数: {kFactor}</p>
        <ErrorMessage message={error} />
        {message ? <div className="success-banner">{message}</div> : null}
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
            {[0, 1, 2].map((index) => (
              <label key={`winner-${index}`}>
                勝者 {index + 1}
                <select
                  value={winnerIds[index]}
                  onChange={(event) => updateSlot('winner', index, event.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {playerOptions}
                </select>
              </label>
            ))}
            {[0, 1, 2].map((index) => (
              <label key={`loser-${index}`}>
                敗者 {index + 1}
                <select
                  value={loserIds[index]}
                  onChange={(event) => updateSlot('loser', index, event.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {playerOptions}
                </select>
              </label>
            ))}
            <label>
              MATCH ID
              <input value={externalMatchId} onChange={(e) => setExternalMatchId(e.target.value)} />
            </label>
            <label>
              MAP
              <input value={mapName} onChange={(e) => setMapName(e.target.value)} />
            </label>
            <label>
              日時
              <input
                type="datetime-local"
                value={playedAt ? playedAt.slice(0, 16) : ''}
                onChange={(e) => setPlayedAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </label>
            <div className="full-width">
              <label>
                OCR JSON
                <textarea
                  rows={6}
                  value={ocrJson}
                  onChange={(e) => setOcrJson(e.target.value)}
                  onBlur={applyOcrJson}
                />
              </label>
              <details>
                <summary>AI 解析用プロンプト</summary>
                <pre>{OCR_PROMPT}</pre>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(OCR_PROMPT)}
                >
                  プロンプトをコピー
                </button>
              </details>
            </div>
            <div className="full-width">
              <button type="submit" disabled={submitting}>
                {submitting ? '登録中...' : '戦績を登録'}
              </button>
            </div>
          </form>
        )}
      </PageSection>
    </div>
  );
}
