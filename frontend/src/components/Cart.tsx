import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, type CartItem } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const roundCurrency = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
const getQuantityDrafts = (items: CartItem[]): Record<number, string> =>
  items.reduce<Record<number, string>>((drafts, { product, quantity }) => {
    drafts[product.productId] = String(quantity);
    return drafts;
  }, {});

export default function Cart() {
  const { items, removeFromCart, setItemQuantity } = useCart();
  const { darkMode } = useTheme();
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>(() =>
    getQuantityDrafts(items),
  );
  const [message, setMessage] = useState('');

  const subtotal = roundCurrency(
    items.reduce((total, { product, quantity }) => {
      const unitPrice = roundCurrency(
        product.price * (1 - (product.discount && product.discount > 0 ? product.discount : 0)),
      );
      return total + unitPrice * quantity;
    }, 0),
  );
  const discount = roundCurrency(subtotal * 0.05);
  const shipping = items.length > 0 ? 10 : 0;
  const grandTotal = roundCurrency(subtotal - discount + shipping);
  const surface = darkMode ? 'bg-gray-800 text-light' : 'bg-white text-gray-800';
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-600';
  const border = darkMode ? 'border-gray-700' : 'border-gray-200';

  const updateCart = () => {
    const updates = items.map(({ product }) => {
      const nextQuantity = Number(quantityDrafts[product.productId]);
      return { productId: product.productId, quantity: nextQuantity };
    });

    if (updates.some(({ quantity }) => !Number.isInteger(quantity) || quantity < 1)) {
      setMessage('Enter a whole-number quantity of at least 1 for each item.');
      return;
    }

    updates.forEach(({ productId, quantity }) => setItemQuantity(productId, quantity));
    setQuantityDrafts(
      updates.reduce<Record<number, string>>((drafts, { productId, quantity }) => {
        drafts[productId] = String(quantity);
        return drafts;
      }, {}),
    );
    setMessage('Cart updated.');
  };

  return (
    <section
      className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-24 pb-16 px-4 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className={`${surface} rounded-xl border ${border} p-10 text-center shadow-lg`}>
            <p className="text-xl font-semibold mb-2">Your cart is empty</p>
            <p className={`${mutedText} mb-6`}>Browse our products and add something you love.</p>
            <Link
              to="/products"
              className="inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-accent"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className={`${surface} overflow-hidden rounded-xl border ${border} shadow-lg`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-center">
                  <thead className={darkMode ? 'bg-gray-900/70' : 'bg-gray-100'}>
                    <tr>
                      {['S. No.', 'Product Image', 'Product Name', 'Unit Price', 'Quantity', 'Total', 'Remove'].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className={`border-b ${border} px-3 py-3 text-sm font-bold md:text-base`}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(({ product, quantity }, index) => {
                      const unitPrice = roundCurrency(
                        product.price *
                          (1 - (product.discount && product.discount > 0 ? product.discount : 0)),
                      );

                      return (
                        <tr key={product.productId}>
                          <td className={`border-b ${border} px-3 py-3 font-semibold`}>
                            {index + 1}
                          </td>
                          <td className={`border-b ${border} px-3 py-2`}>
                            <img
                              src={`/${product.imgName}`}
                              alt={product.name}
                              className="mx-auto h-20 w-24 object-contain"
                            />
                          </td>
                          <th
                            scope="row"
                            className={`border-b ${border} px-3 py-3 font-semibold`}
                          >
                            {product.name}
                          </th>
                          <td className={`border-b ${border} px-3 py-3 font-semibold`}>
                            {formatCurrency(unitPrice)}
                          </td>
                          <td className={`border-b ${border} px-3 py-3`}>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={quantityDrafts[product.productId] ?? quantity}
                              onChange={(event) => {
                                setQuantityDrafts((drafts) => ({
                                  ...drafts,
                                  [product.productId]: event.target.value,
                                }));
                                setMessage('');
                              }}
                              aria-label={`Quantity of ${product.name}`}
                              className={`w-16 rounded-lg border ${border} ${darkMode ? 'bg-gray-900 text-light' : 'bg-white text-gray-800'} px-2 py-2 text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40`}
                            />
                          </td>
                          <td className={`border-b ${border} px-3 py-3 font-semibold`}>
                            {formatCurrency(roundCurrency(unitPrice * quantity))}
                          </td>
                          <td className={`border-b ${border} px-3 py-3`}>
                            <button
                              type="button"
                              onClick={() => {
                                removeFromCart(product.productId);
                                setQuantityDrafts((drafts) => {
                                  const nextDrafts = { ...drafts };
                                  delete nextDrafts[product.productId];
                                  return nextDrafts;
                                });
                                setMessage(`${product.name} removed from your cart.`);
                              }}
                              className="rounded p-2 text-primary transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label={`Remove ${product.name} from cart`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7} className="px-2 py-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex w-full max-w-md">
                            <input
                              type="text"
                              placeholder="Coupon Code"
                              aria-label="Coupon code"
                              disabled
                              className={`min-w-0 flex-1 rounded-l-full border ${border} ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} px-4 py-3 text-sm opacity-70`}
                            />
                            <button
                              type="button"
                              disabled
                              aria-describedby="coupon-unavailable"
                              className="rounded-r-full bg-primary px-4 py-3 text-sm font-semibold text-white opacity-70"
                            >
                              Apply Coupon
                            </button>
                            <span id="coupon-unavailable" className="sr-only">
                              Coupon discounts are not available yet.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={updateCart}
                            className="shrink-0 rounded-full bg-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            Update Cart
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <aside className={`${surface} overflow-hidden rounded-xl border ${border} shadow-lg`}>
              <h2 className={`border-b ${border} px-5 py-4 text-center text-2xl font-bold`}>
                Order Summary
              </h2>
              <dl>
                {[
                  ['Subtotal', formatCurrency(subtotal)],
                  ['Discount (5%)', `-${formatCurrency(discount)}`],
                  ['Shipping', formatCurrency(shipping)],
                  ['Grand Total', formatCurrency(grandTotal)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={`grid grid-cols-[1fr_auto] border-b ${border} px-5 py-2.5 text-sm`}
                  >
                    <dt className="font-semibold">{label}</dt>
                    <dd className="pl-6">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setMessage('Checkout is not available yet.')}
                  className="w-full rounded-full bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Proceed To Checkout
                </button>
              </div>
            </aside>
          </div>
        )}
        {message && (
          <p className="mt-4 text-center text-sm text-primary" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
