import { expect, test } from '@playwright/test';

test.describe('home', () => {
  test('shows the passport summary and the full departures board', async ({ page }) => {
    await page.goto('/?passport=IN');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Know the entry rules before you book.');
    await expect(page.getByTestId('mobility-score')).toHaveText(/^\d+$/);
    await expect(page.getByTestId('board').getByRole('link')).toHaveCount(199);
  });

  test('filters the board by entry type and by name', async ({ page }) => {
    await page.goto('/?passport=GB');
    const board = page.getByTestId('board');
    const visaFree = page.getByRole('button', { name: /^Visa-free \d+$/ });
    const count = Number((await visaFree.locator('b').textContent()) ?? 0);
    await visaFree.click();
    await expect(board.locator('a.drow:visible')).toHaveCount(count);

    await page.getByRole('button', { name: /^All/ }).click();
    await page.getByLabel('Search destinations').fill('viet');
    await expect(board.locator('a.drow:visible')).toHaveCount(1);
    await expect(board.getByRole('link', { name: /Vietnam/ })).toBeVisible();
  });

  test('switches passport from the header and remembers it', async ({ page }) => {
    await page.goto('/?passport=IN');
    await page.getByLabel('Passport', { exact: true }).first().selectOption('DE');
    await expect(page).toHaveURL(/passport=DE/);
    await expect(page.locator('#hpp')).toHaveValue('DE');
    await expect(page.locator('.dp-name')).toHaveText('Germany');

    await page.goto('/');
    await expect(page.locator('.dp-name')).toHaveText('Germany');
  });

  test('opens a destination from the board', async ({ page }) => {
    await page.goto('/?passport=GB');
    await page.getByLabel('Search destinations').fill('Vietnam');
    await page
      .getByTestId('board')
      .getByRole('link', { name: /Vietnam/ })
      .click();
    await expect(page).toHaveURL(/\/vietnam\?passport=GB$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vietnam');
  });
});
