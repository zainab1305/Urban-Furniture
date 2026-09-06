import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  FileText,
  Plus,
  Printer,
  X,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../services/api.js';
import { printDocument } from '../../utils/printDocument.js';

const money = value =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const blankItem = {
  productId: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
};

const blankOrder = {
  vendorId: '',
  orderDate: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [{ ...blankItem }],
};

const statusTone = status =>
  status === 'PAID'
    ? 'active'
    : status === 'PARTIALLY_PAID'
      ? 'warning'
      : '';

function printInvoice(bill) {
  return printDocument({
    kind: 'Vendor Invoice',
    number: bill.billNumber,
    partyLabel: 'Vendor',
    partyName: bill.vendor.name,
    date: new Date(bill.invoiceDate).toLocaleDateString('en-IN'),
    dueDate: bill.dueDate
      ? new Date(bill.dueDate).toLocaleDateString('en-IN')
      : '',
    lines: bill.purchaseOrder.items.map(item => ({
      product: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    subtotal: bill.subtotal,
    tax: bill.tax,
    total: bill.total,
    paid: bill.paid,
    status: bill.status,
  });
}

function BillAction({ bill, onPay }) {
  const isPaid =
    bill.status === 'PAID' || Number(bill.outstanding || 0) <= 0;

  return isPaid ? (
    <button
      className="compact-button print-button"
      onClick={() => printInvoice(bill)}
      title="Print invoice"
    >
      <Printer size={13} />
      Print
    </button>
  ) : (
    <button
      className="compact-button primary-button"
      onClick={() => onPay(bill)}
    >
      Pay
    </button>
  );
}

export function PurchasesPage({ section = 'orders' }) {
  const isBills = section === 'bills';

  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(blankOrder);
  const [modal, setModal] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        ordersResponse,
        billsResponse,
        vendorsResponse,
        productsResponse,
      ] = await Promise.all([
        api.get('/purchases/orders'),
        api.get('/purchases/bills'),
        api.get('/contacts', {
          params: {
            type: 'VENDOR',
            status: 'ACTIVE',
          },
        }),
        api.get('/products', {
          params: {
            status: 'ACTIVE',
          },
        }),
      ]);

      setOrders(ordersResponse.data.data);
      setBills(billsResponse.data.data);
      setVendors(vendorsResponse.data.data);
      setProducts(productsResponse.data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load purchase records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openOrder = () => {
    const firstProduct = products[0];

    setForm({
      ...blankOrder,
      vendorId: vendors[0]?.id || '',
      items: [
        {
          ...blankItem,
          productId: firstProduct?.id || '',
          unitPrice: Number(firstProduct?.purchasePrice || 0),
          total: Number(firstProduct?.purchasePrice || 0),
        },
      ],
    });

    setModal({ type: 'order' });
  };

  const openBill = order => {
    setForm({
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });

    setModal({
      type: 'bill',
      order,
    });
  };

  const openPayment = bill => {
    setForm({
      amount: bill.outstanding,
      method: 'BANK',
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: '',
      notes: '',
    });

    setModal({
      type: 'payment',
      bill,
    });
  };

  /*
   * Product selection:
   * Automatically gets purchasePrice from the selected product.
   *
   * Quantity:
   * Automatically recalculates line total.
   */
  const updateItem = (index, field, value) => {
    setForm(current => {
      const updatedItems = [...current.items];

      if (field === 'productId') {
        const product = products.find(
          item => String(item.id) === String(value)
        );

        const unitPrice = Number(product?.purchasePrice || 0);
        const quantity = Math.max(
          1,
          Math.round(Number(updatedItems[index].quantity) || 1)
        );

        updatedItems[index] = {
          ...updatedItems[index],
          productId: value,
          unitPrice,
          total: quantity * unitPrice,
        };
      }

      if (field === 'quantity') {
        const quantity = Math.max(
          1,
          Math.round(Number(value) || 1)
        );

        const unitPrice = Number(
          updatedItems[index].unitPrice || 0
        );

        updatedItems[index] = {
          ...updatedItems[index],
          quantity,
          total: quantity * unitPrice,
        };
      }

      return {
        ...current,
        items: updatedItems,
      };
    });
  };

  const addItem = () => {
    setForm(current => ({
      ...current,
      items: [
        ...current.items,
        {
          ...blankItem,
        },
      ],
    }));
  };

  const removeItem = index => {
    setForm(current => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      };
    });
  };

  /*
   * Live order total.
   * Updates automatically whenever:
   * - product changes
   * - quantity changes
   * - item is added
   * - item is removed
   */
  const purchaseTotal =
    modal?.type === 'order'
      ? form.items.reduce(
          (sum, item) => sum + Number(item.total || 0),
          0
        )
      : 0;

  const submit = async event => {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      if (modal.type === 'order') {
        /*
         * Recalculate everything before sending.
         * This prevents stale totals from being submitted.
         */
        const items = form.items.map(item => {
          const product = products.find(
            productItem =>
              String(productItem.id) === String(item.productId)
          );

          const quantity = Math.max(
            1,
            Math.round(Number(item.quantity) || 1)
          );

          const unitPrice = Number(
            product?.purchasePrice || 0
          );

          return {
            productId: item.productId,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
          };
        });

        await api.post('/purchases/orders', {
          ...form,
          items,
        });
      } else if (modal.type === 'bill') {
        await api.post(
          `/purchases/orders/${modal.order.id}/bill`,
          form
        );
      } else {
        await api.post(
          `/purchases/bills/${modal.bill.id}/payment`,
          form
        );
      }

      setModal(null);

      setNotice(
        modal.type === 'payment'
          ? 'Payment recorded.'
          : modal.type === 'bill'
            ? 'Vendor bill created.'
            : 'Purchase order created.'
      );

      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to save purchase record.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={`PURCHASES / ${
          isBills ? 'VENDOR BILLS' : 'PURCHASE ORDERS'
        }`}
        title={
          isBills
            ? 'Vendor bills'
            : 'Purchase orders'
        }
        description={
          isBills
            ? 'Convert received purchase orders into bills and pay vendors.'
            : 'Create purchase orders for vendors and convert them into payable bills.'
        }
        action={
          !isBills && (
            <button
              className="primary-button"
              onClick={openOrder}
            >
              <Plus size={16} />
              New purchase order
            </button>
          )
        }
      />

      {notice && (
        <div className="auth-alert success">
          {notice}

          <button onClick={() => setNotice('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="auth-alert error">
          {error}
        </div>
      )}

      <div className="purchase-tabs">
        <a
          className={!isBills ? 'active' : ''}
          href="/purchases/orders"
        >
          Purchase orders
        </a>

        <a
          className={isBills ? 'active' : ''}
          href="/purchases/bills"
        >
          Vendor bills
        </a>
      </div>

      <section className="surface users-card">
        {loading ? (
          <div className="empty-table">
            Loading purchase records...
          </div>
        ) : isBills ? (
          <BillsTable
            bills={bills}
            onPay={openPayment}
          />
        ) : (
          <OrdersTable
            orders={orders}
            onBill={openBill}
          />
        )}
      </section>

      {modal && (
        <div className="modal-backdrop">
          <section
            className={`modal ${
              modal.type === 'order'
                ? 'purchase-modal'
                : 'payment-modal'
            }`}
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
            >
              <X size={17} />
            </button>

            <div className="eyebrow">
              PURCHASES / {modal.type.toUpperCase()}
            </div>

            <h2>
              {modal.type === 'payment'
                ? 'Pay vendor bill'
                : modal.type === 'bill'
                  ? 'Convert to vendor bill'
                  : 'New purchase order'}
            </h2>

            {/* PAYMENT */}
            {modal.type === 'payment' && (
              <p>
                {modal.bill.billNumber} · Outstanding{' '}
                {money(modal.bill.outstanding)}
              </p>
            )}

            <form onSubmit={submit}>
              {/* ================= PAYMENT FORM ================= */}
              {modal.type === 'payment' && (
                <>
                  <label>
                    Amount

                    <input
                      type="number"
                      min="1"
                      max={modal.bill.outstanding}
                      step="1"
                      value={form.amount}
                      onChange={event =>
                        setForm({
                          ...form,
                          amount: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Payment method

                    <select
                      value={form.method}
                      onChange={event =>
                        setForm({
                          ...form,
                          method: event.target.value,
                        })
                      }
                    >
                      <option value="BANK">
                        Bank
                      </option>

                      <option value="CASH">
                        Cash
                      </option>
                    </select>
                  </label>

                  <label>
                    Payment date

                    <input
                      type="date"
                      value={form.paymentDate}
                      onChange={event =>
                        setForm({
                          ...form,
                          paymentDate: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Reference

                    <input
                      value={form.reference}
                      onChange={event =>
                        setForm({
                          ...form,
                          reference: event.target.value,
                        })
                      }
                    />
                  </label>

                  <div className="payment-choice">
                    <Banknote size={18} />

                    <span>
                      Payment is linked to this
                      vendor bill.
                    </span>
                  </div>
                </>
              )}

              {/* ================= BILL FORM ================= */}
              {modal.type === 'bill' && (
                <>
                  <label>
                    Invoice date

                    <input
                      type="date"
                      value={form.invoiceDate}
                      onChange={event =>
                        setForm({
                          ...form,
                          invoiceDate: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Due date

                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={event =>
                        setForm({
                          ...form,
                          dueDate: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Notes

                    <input
                      value={form.notes}
                      onChange={event =>
                        setForm({
                          ...form,
                          notes: event.target.value,
                        })
                      }
                    />
                  </label>

                  <div className="payment-choice">
                    <FileText size={18} />

                    <span>
                      The bill inherits its order
                      lines and totals.
                    </span>
                  </div>
                </>
              )}

              {/* ================= PURCHASE ORDER ================= */}
              {modal.type === 'order' && (
                <>
                  <div className="purchase-form-grid">
                    <label>
                      Vendor

                      <select
                        value={form.vendorId}
                        onChange={event =>
                          setForm({
                            ...form,
                            vendorId: event.target.value,
                          })
                        }
                        required
                      >
                        <option value="">
                          Select vendor
                        </option>

                        {vendors.map(vendor => (
                          <option
                            key={vendor.id}
                            value={vendor.id}
                          >
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Order date

                      <input
                        type="date"
                        value={form.orderDate}
                        onChange={event =>
                          setForm({
                            ...form,
                            orderDate: event.target.value,
                          })
                        }
                        required
                      />
                    </label>
                  </div>

                  <div className="purchase-items">
                    {/* COLUMN HEADINGS */}
                    <div className="purchase-item-head">
                      <span>PRODUCT</span>
                      <span>QUANTITY</span>
                      <span>UNIT PRICE</span>
                      <span>TOTAL</span>
                      <span>ACTION</span>
                    </div>

                    {/* ITEMS */}
                    {form.items.map((item, index) => (
                      <div
                        className="purchase-item-row"
                        key={index}
                      >
                        {/* PRODUCT */}
                        <select
                          value={item.productId}
                          onChange={event =>
                            updateItem(
                              index,
                              'productId',
                              event.target.value
                            )
                          }
                          required
                        >
                          <option value="">
                            Select product
                          </option>

                          {products.map(product => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.name}
                            </option>
                          ))}
                        </select>

                        {/* QUANTITY */}
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={event =>
                            updateItem(
                              index,
                              'quantity',
                              event.target.value
                            )
                          }
                          required
                        />

                        {/* UNIT PRICE */}
                        <span>
                          {money(item.unitPrice)}
                        </span>

                        {/* LINE TOTAL */}
                        <span>
                          {money(item.total)}
                        </span>

                        {/* REMOVE */}
                        <button
                          type="button"
                          className="compact-button"
                          onClick={() =>
                            removeItem(index)
                          }
                          disabled={
                            form.items.length === 1
                          }
                          title="Remove item"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={addItem}
                  >
                    <Plus size={14} />
                    Add item
                  </button>

                  {/* LIVE TOTAL */}
                  <div className="purchase-total">
                    <span>Purchase Total</span>

                    <b>{money(purchaseTotal)}</b>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : modal.type === 'payment'
                      ? 'Confirm payment'
                      : modal.type === 'bill'
                        ? 'Create vendor bill'
                        : 'Create purchase order'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function OrdersTable({ orders, onBill }) {
  return orders.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>VENDOR</th>
            <th>DATE</th>
            <th>TOTAL</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>
                <b className="ref">
                  {order.orderNumber}
                </b>
              </td>

              <td>{order.vendor.name}</td>

              <td>
                {new Date(
                  order.orderDate
                ).toLocaleDateString('en-IN')}
              </td>

              <td>
                <b>{money(order.total)}</b>
              </td>

              <td>
                {order.bill
                  ? 'Billed'
                  : order.status}
              </td>

              <td>
                {order.bill ? (
                  <span className="table-subtitle">
                    Bill created
                  </span>
                ) : (
                  <button
                    className="compact-button primary-button"
                    onClick={() => onBill(order)}
                  >
                    Create bill
                    <ArrowRight size={13} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="empty-table">
      No purchase orders found.
    </div>
  );
}

function BillsTable({ bills, onPay }) {
  return bills.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>BILL</th>
            <th>VENDOR</th>
            <th>INVOICE DATE</th>
            <th>DUE DATE</th>
            <th>TOTAL</th>
            <th>OUTSTANDING</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {bills.map(bill => (
            <tr key={bill.id}>
              <td>
                <b className="ref">
                  {bill.billNumber}
                </b>

                <small className="table-subtitle">
                  {bill.purchaseOrder.orderNumber}
                </small>
              </td>

              <td>{bill.vendor.name}</td>

              <td>
                {new Date(
                  bill.invoiceDate
                ).toLocaleDateString('en-IN')}
              </td>

              <td>
                {bill.dueDate
                  ? new Date(
                      bill.dueDate
                    ).toLocaleDateString('en-IN')
                  : '—'}
              </td>

              <td>
                <b>{money(bill.total)}</b>
              </td>

              <td>
                <b>{money(bill.outstanding)}</b>
              </td>

              <td>
                <span
                  className={`status-pill ${statusTone(
                    bill.status
                  )}`}
                >
                  <i />
                  {bill.status}
                </span>
              </td>

              <td className="sales-actions">
                <BillAction
                  bill={bill}
                  onPay={onPay}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="empty-table">
      No vendor bills found.
    </div>
  );
}