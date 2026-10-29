import { expect, test } from '@playwright/test';

test.describe('destination', () => {
  test('shows the verdict as a boarding pass', async ({ page }) => {
    await page.goto('/vietnam?passport=GB');
    await expect(page.getByTestId('entry-status')).toContainText('Visa-free or e-Visa');
    await expect(page.getByTestId('max-stay')).toHaveText('45 days');
    await expect(page.getByRole('heading', { name: 'Two ways in' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'When to visit Vietnam' })).toBeVisible();
  });

  test('switches to another passport from the comparison list', async ({ page }) => {
    await page.goto('/philippines?passport=GB');
    await page.getByLabel('Search passports').fill('India');
    await page.locator('#pplist').getByRole('button', { name: /India/ }).click();
    await expect(page).toHaveURL(/passport=IN/);
    await expect(page.getByRole('heading', { name: 'Three ways in' })).toBeVisible();
  });

  test('builds flight searches from typed city names', async ({ page }) => {
    await page.goto('/vietnam?passport=IN');
    const search = page.locator('[data-testid="flight-search"][data-ready="true"]');
    await search.getByLabel('From', { exact: true }).fill('Mumbai');
    await search.getByLabel('To', { exact: true }).fill('Hanoi');
    const links = page.getByTestId('flight-results').getByRole('link');
    await expect(links).toHaveCount(4);
    await expect(links.first()).toHaveAttribute('href', /skyscanner\.net\/transport\/flights\/bom\/han\//);
  });

  test('highlights the trip month in the season chart', async ({ page }) => {
    await page.goto('/thailand?passport=US');
    await page.locator('[data-testid="flight-search"][data-ready="true"]').getByLabel('Depart').fill('2027-03-15');
    await expect(page.getByTestId('trip-month')).toContainText('Your trip: Mar');
  });

  test('goes on to the next destination', async ({ page }) => {
    await page.goto('/afghanistan?passport=FR');
    await page.getByRole('link', { name: /Next destination/ }).click();
    await expect(page).toHaveURL(/\/albania\?passport=FR$/);
  });
});

test.describe('platform', () => {
  test('answers unknown pages with a real 404', async ({ page }) => {
    const res = await page.goto('/atlantis');
    expect(res?.status()).toBe(404);
    await expect(page.getByText("We couldn't find that page.")).toBeVisible();
  });

  test('reports health, including the API', async ({ request }) => {
    const res = await request.get('/api/health?deep=1');
    expect(res.ok()).toBe(true);
    expect(await res.json()).toMatchObject({ status: 'ok', api: 'ok' });
  });

  test('sends security headers', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });
});
