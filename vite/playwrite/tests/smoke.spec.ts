import { expect, test } from '@playwright/test';

test.describe('E2E smoke tests', () => {
  test('guest user can open home, ranking, and history pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ゲストとして閲覧できます')).toBeVisible();

    await page.getByRole('link', { name: 'ランキング' }).click();
    await expect(page.getByRole('heading', { name: 'ランキング' })).toBeVisible();

    await page.getByRole('link', { name: '戦績履歴' }).click();
    await expect(page.getByRole('heading', { name: '戦績履歴' })).toBeVisible();
  });

  test('guest user cannot access admin page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('このページは管理者のみ利用できます。')).toBeVisible();
  });

  test('invalid route redirects to home', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page).toHaveURL(/\/$/);
  });

  test('guest can search ranking by name', async ({ page }) => {
    await page.goto('/ranking');
    await page.fill('input[placeholder="Search by name"]', 'John Doe');
    await expect(page.getByRole('listitem', { name: 'John Doe' })).toBeVisible();
  });

  test('player can log in via Discord and confirm role', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login with Discord' }).click();
    await page.waitForNavigation();
    await expect(page.getByText('選手')).toBeVisible();
  });

  test('player can submit match registration form', async ({ page }) => {
    await page.goto('/match-register');
    await page.locator('input[type="checkbox"]').nth(0).check();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator('input[type="checkbox"]').nth(2).check();
    await page.locator('input[type="checkbox"]').nth(3).check();
    await page.locator('input[type="checkbox"]').nth(4).check();
    await page.locator('input[type="checkbox"]').nth(5).check();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('登録成功')).toBeVisible();
  });

  test('guest cannot access match registration page', async ({ page }) => {
    await page.goto('/match-register');
    await expect(page.getByText('戦績登録に必要な権限のメッセージ')).toBeVisible();
  });

  test('player cannot submit empty match registration form', async ({ page }) => {
    await page.goto('/match-register');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('入力不足')).toBeVisible();
  });
});

