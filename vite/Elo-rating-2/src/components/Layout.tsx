import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../types';
import { appEnv } from '../lib/supabase';

export function Layout() {
  const { profile, loading, signIn, signOutUser } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top">
          <div>
            <h1>イロレーティング管理</h1>
            <p className="subtitle">3対3チーム戦マッチ管理（AC6向け）</p>
          </div>
          <div className="header-actions">
            <span className="env-badge">{appEnv}</span>
            {loading ? (
              <span>読み込み中...</span>
            ) : profile ? (
              <>
                <span className="user-badge">
                  {profile.display_name ?? 'Discord User'} / {ROLE_LABELS[profile.role]}
                </span>
                <button type="button" onClick={() => void signOutUser()}>
                  ログアウト
                </button>
              </>
            ) : (
              <button type="button" onClick={() => void signIn()}>
                Discordでログイン
              </button>
            )}
          </div>
        </div>
        <nav className="app-nav">
          <NavLink to="/" end>
            ホーム
          </NavLink>
          <NavLink to="/ranking">ランキング</NavLink>
          <NavLink to="/history">戦績履歴</NavLink>
          {profile && (profile.role === 'admin_user' || profile.role === 'normal_user') && (
            <NavLink to="/matches/register">戦績登録</NavLink>
          )}
          {profile?.role === 'admin_user' && <NavLink to="/admin">管理</NavLink>}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <Link to="/">GitHub Pages 公開版</Link>
      </footer>
    </div>
  );
}
