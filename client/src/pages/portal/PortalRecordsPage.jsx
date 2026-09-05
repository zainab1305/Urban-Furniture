import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { api } from "../../services/api.js";
import { Banknote, CreditCard, Printer, X } from "lucide-react";
import { printDocument } from "../../utils/printDocument.js";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export function PortalRecordsPage({ kind }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    method: "BANK",
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: "",
  });
  useEffect(() => {
    api
      .get("/portal/dashboard")
      .then((response) =>
        setRecords(
          kind === "invoices"
            ? response.data.data.invoices
            : response.data.data.bills,
        ),
      )
      .catch((errorResponse) =>
        setError(
          errorResponse.response?.data?.message || "Unable to load records.",
        ),
      )
      .finally(() => setLoading(false));
  }, [kind]);
  const openPayment = (record) => {
    setError("");
    setForm({
      amount: String(record.outstanding),
      method: "BANK",
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: "",
    });
    setPayment(record);
  };
  const pay = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/portal/payments", {
        ...form,
        ...(kind === "invoices"
          ? { salesInvoiceId: payment.id }
          : { vendorBillId: payment.id }),
      });
      setPayment(null);
      setMessage("Payment recorded successfully.");
      const response = await api.get("/portal/dashboard");
      setRecords(
        kind === "invoices"
          ? response.data.data.invoices
          : response.data.data.bills,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to record payment.",
      );
    } finally {
      setSaving(false);
    }
  };
const downloadRecord = record => {
  const isInvoice = kind === 'invoices';
  const source = isInvoice ? record.salesOrder : record.purchaseOrder;
  const party = isInvoice ? record.customer : record.vendor;
  printDocument({
    kind: isInvoice ? 'Customer Invoice' : 'Vendor Bill',
    number: isInvoice ? record.invoiceNumber : record.billNumber,
    partyLabel: isInvoice ? 'Customer' : 'Vendor',
    partyName: party?.name || '',
    date: new Date(record.invoiceDate).toLocaleDateString('en-IN'),
    dueDate: record.dueDate ? new Date(record.dueDate).toLocaleDateString('en-IN') : '',
    lines: (source?.items || []).map(item => ({ product: item.product?.name, quantity: item.quantity, unitPrice: item.unitPrice, total: item.total })),
    subtotal: record.subtotal,
    tax: record.tax,
    total: record.total,
    paid: record.paid,
    status: record.status
  });
};
  const title = kind === "invoices" ? "My invoices" : "My bills";
  return (
    <>
      <PageHeader
        eyebrow={`MY PORTAL / ${kind.toUpperCase()}`}
        title={title}
        description="Only records linked to your Contact account are shown."
      />
      {message && <div className="auth-alert success">{message}</div>}
      {error && <div className="auth-alert error">{error}</div>}
      <section className="surface users-card portal-records-card">
        {loading ? (
          <div className="empty-table">Loading records...</div>
        ) : !records.length ? (
          <div className="empty-table">No records found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>NUMBER</th>
                  <th>DATE</th>
                  <th>TOTAL</th>
                  <th>PAID</th>
                  <th>OUTSTANDING</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <b className="ref">
                        {kind === "invoices"
                          ? record.invoiceNumber
                          : record.billNumber}
                      </b>
                    </td>
                    <td>
                      {new Date(record.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td>{money(record.total)}</td>
                    <td>{money(record.paid)}</td>
                    <td>
                      <b>{money(record.outstanding)}</b>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${record.outstanding ? "inactive" : "active"}`}
                      >
                        <i />
                        {record.outstanding ? "Unpaid" : "Paid"}
                      </span>
                    </td>
                    <td>
                      {record.outstanding > 0 ? (
                        <button
                          className="primary-button compact-button"
                          onClick={() => openPayment(record)}
                        >
                          Pay
                        </button>
                      ) : (
                        <button
                          className="compact-button print-button"
                          onClick={() => downloadRecord(record)}
                          title="Print invoice"
                        >
                          <Printer size={13} /> Print
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {payment && (
        <div className="modal-backdrop">
          <section
            className="modal portal-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-payment-title"
          >
            <button
              className="modal-close"
              onClick={() => setPayment(null)}
              aria-label="Close"
            >
              <X size={17} />
            </button>
            <div className="eyebrow">MY PORTAL / PAYMENT</div>
            <h2 id="portal-payment-title">
              Pay {kind === "invoices" ? "invoice" : "bill"}
            </h2>
            <p>
              {kind === "invoices" ? payment.invoiceNumber : payment.billNumber}{" "}
              · Outstanding {money(payment.outstanding)}
            </p>
            <form onSubmit={pay}>
              <label>
                Amount
                <input
                  type="number"
                  min="0.01"
                  max={payment.outstanding}
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Payment method
                <select
                  value={form.method}
                  onChange={(event) =>
                    setForm({ ...form, method: event.target.value })
                  }
                >
                  <option value="BANK">Bank</option>
                  <option value="CASH">Cash</option>
                </select>
              </label>
              <label>
                Payment date
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) =>
                    setForm({ ...form, paymentDate: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Reference
                <input
                  value={form.reference}
                  onChange={(event) =>
                    setForm({ ...form, reference: event.target.value })
                  }
                  placeholder="Optional reference"
                />
              </label>
              <div className="portal-payment-note">
                {form.method === "BANK" ? (
                  <CreditCard size={17} />
                ) : (
                  <Banknote size={17} />
                )}
                <span>
                  Payment will be linked to this{" "}
                  {kind === "invoices" ? "invoice" : "bill"}.
                </span>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPayment(null)}
                >
                  Cancel
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Processing..." : "Confirm payment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
