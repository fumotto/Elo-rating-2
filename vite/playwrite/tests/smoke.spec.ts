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
});
