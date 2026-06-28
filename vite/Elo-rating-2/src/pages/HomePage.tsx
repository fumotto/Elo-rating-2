import { useAuth } from '../contexts/AuthContext';
import { PageSection } from '../components/PageSection';
import { ROLE_LABELS, canRegisterMatches } from '../types';

export function HomePage() {
  const { profile, signIn } = useAuth();

  return (
    <div className="stack">
      <PageSection title="概要">
        <p>
          旧版のローカル保存型イロレーティングツールを、Supabase バックエンド付きの Web
          アプリとして再構築したプロジェクトです。
        </p>
        <ul>
          <li>3対3チーム戦の Elo レート計算</li>
          <li>Discord ログインとロールベースのアクセス制御</li>
          <li>ランキング・戦績履歴の閲覧</li>
          <li>管理者向けの選手管理・ロールバック・ランクリセット</li>
        </ul>
      </PageSection>

      <PageSection title="あなたの権限">
        {profile ? (
          <p>
            現在のロール: <strong>{ROLE_LABELS[profile.role]}</strong>
          </p>
        ) : (
          <p>
            ゲストとして閲覧できます。戦績登録には Discord ログインが必要です。
            <button type="button" className="inline-button" onClick={() => void signIn()}>
              Discordでログイン
            </button>
          </p>
        )}
        <ul>
          <li>ランキング表示: 全員</li>
          <li>戦績履歴表示: 全員</li>
          <li>
            戦績登録:{' '}
            {canRegisterMatches(profile?.role ?? 'guest_user')
              ? '利用可'
              : 'ログイン後（選手/管理者）'}
          </li>
          <li>選手管理・ロールバック・ランクリセット: 管理者のみ</li>
        </ul>
      </PageSection>
    </div>
  );
}
