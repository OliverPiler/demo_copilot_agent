import { expect, test, type Locator, type Page } from '@playwright/test';

const cartStorageKey = 'octocat-shopping-cart';

async function addProduct(
  page: Page,
  productId: number,
  productName: string,
  quantity = 1,
  expectedCartCount = quantity,
) {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  await expect(page.getByRole('heading', { name: productName, exact: true })).toBeVisible();

  for (let item = 0; item < quantity; item += 1) {
    await page.locator(`#increase-qty-${productId}`).click();
  }
  await page.locator(`#add-to-cart-${productId}`).click();
  await expect(
    page.getByRole('link', {
      name: `Shopping cart, ${expectedCartCount} ${expectedCartCount === 1 ? 'item' : 'items'}`,
    }),
  ).toBeVisible();
}

async function expectSummaryValue(summary: Locator, label: string, value: string) {
  const row = summary.getByText(label, { exact: true }).locator('..');
  await expect(row.getByText(value, { exact: true })).toBeVisible();
}

test.describe('Shopping cart management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => window.localStorage.removeItem(key), cartStorageKey);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Smart Cat Tech' })).toBeVisible();
  });

  test('shows the empty state and a link to browse products', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Products' })).toHaveAttribute('href', '/products');
    await expect(page.getByRole('complementary')).toHaveCount(0);
  });

  test('adds a product and opens the cart from navigation', async ({ page }) => {
    await addProduct(page, 6, 'ThermoNest Deluxe', 2);
    await page.getByRole('link', { name: 'Shopping cart, 2 items' }).click();

    await expect(page).toHaveURL(/\/cart$/);
    const row = page.getByRole('row', { name: /ThermoNest Deluxe/ });
    await expect(row).toBeVisible();
    await expect(row.getByRole('spinbutton', { name: 'Quantity of ThermoNest Deluxe' })).toHaveValue('2');
    await expect(row.getByRole('img', { name: 'ThermoNest Deluxe' })).toBeVisible();
    await expect(page.getByRole('complementary').getByRole('heading', { name: 'Order Summary' })).toBeVisible();
  });

  test('combines repeated additions of the same product', async ({ page }) => {
    await addProduct(page, 6, 'ThermoNest Deluxe');
    await addProduct(page, 6, 'ThermoNest Deluxe', 2, 3);
    await page.goto('/cart');

    await expect(page.getByRole('row', { name: /ThermoNest Deluxe/ })).toHaveCount(1);
    await expect(page.getByRole('spinbutton', { name: 'Quantity of ThermoNest Deluxe' })).toHaveValue('3');
    await expect(page.getByRole('link', { name: 'Shopping cart, 3 items' })).toBeVisible();
  });

  test('updates the quantity and recalculates totals', async ({ page }) => {
    await addProduct(page, 6, 'ThermoNest Deluxe');
    await page.goto('/cart');

    await page.getByRole('spinbutton', { name: 'Quantity of ThermoNest Deluxe' }).fill('2');
    await page.getByRole('button', { name: 'Update Cart' }).click();

    const summary = page.getByRole('complementary');
    await expect(page.getByRole('status')).toHaveText('Cart updated.');
    await expect(page.getByRole('spinbutton', { name: 'Quantity of ThermoNest Deluxe' })).toHaveValue('2');
    await expect(page.getByRole('row', { name: /ThermoNest Deluxe/ })).toContainText('$199.98');
    await expectSummaryValue(summary, 'Subtotal', '$199.98');
    await expectSummaryValue(summary, 'Discount (5%)', '-$10.00');
    await expectSummaryValue(summary, 'Shipping', '$0.00');
    await expectSummaryValue(summary, 'Grand Total', '$189.98');
    await expect(page.getByRole('link', { name: 'Shopping cart, 2 items' })).toBeVisible();
  });

  for (const quantity of ['0', '1.5', '']) {
    test(`rejects invalid quantity "${quantity || 'blank'}" without changing the cart`, async ({ page }) => {
      await addProduct(page, 6, 'ThermoNest Deluxe');
      await page.goto('/cart');

      await page.getByRole('spinbutton', { name: 'Quantity of ThermoNest Deluxe' }).fill(quantity);
      await page.getByRole('button', { name: 'Update Cart' }).click();

      await expect(page.getByRole('status')).toHaveText(
        'Enter a whole-number quantity of at least 1 for each item.',
      );
      await expect(page.getByRole('spinbutton', { name: 'Quantity of ThermoNest Deluxe' })).toHaveValue(quantity);
      await expect(page.getByRole('link', { name: 'Shopping cart, 1 item' })).toBeVisible();
    });
  }

  test('removes a product and returns to the empty state', async ({ page }) => {
    await addProduct(page, 6, 'ThermoNest Deluxe');
    await page.goto('/cart');

    await page.getByRole('button', { name: 'Remove ThermoNest Deluxe from cart' }).click();

    await expect(page.getByRole('status')).toHaveText('ThermoNest Deluxe removed from your cart.');
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shopping cart, 0 items' })).toBeVisible();
  });

  test('persists the cart across a page reload', async ({ page }) => {
    await addProduct(page, 6, 'ThermoNest Deluxe', 2);
    await page.goto('/cart');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Quantity of ThermoNest Deluxe' })).toHaveValue('2');
    await expect(page.getByRole('link', { name: 'Shopping cart, 2 items' })).toBeVisible();
  });

  for (const { subtotal, shipping } of [
    { subtotal: 100, shipping: '$25.00' },
    { subtotal: 100.01, shipping: '$0.00' },
  ]) {
    test(`charges ${shipping} for a $${subtotal.toFixed(2)} cart subtotal`, async ({ page }) => {
      await page.evaluate(
        ({ key, amount }) => {
          window.localStorage.setItem(
            key,
            JSON.stringify([
              {
                product: {
                  productId: 999,
                  name: 'Threshold Test Product',
                  price: amount,
                  imgName: 'feeder.png',
                },
                quantity: 1,
              },
            ]),
          );
        },
        { key: cartStorageKey, amount: subtotal },
      );
      await page.reload();
      await page.goto('/cart');

      await expectSummaryValue(page.getByRole('complementary'), 'Shipping', shipping);
    });
  }

  test('opens the cart with the keyboard', async ({ page }) => {
    const cartLink = page.getByRole('link', { name: 'Shopping cart, 0 items' });
    await cartLink.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
  });
});
