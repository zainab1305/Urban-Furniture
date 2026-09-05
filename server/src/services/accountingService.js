/**
 * Accounting boundary for the future transaction engine.
 * Keep posting logic here so controllers do not own double-entry rules.
 */
export async function postSale(_transaction, _client) {
  // Future implementation: debit Accounts Receivable; credit Sales Income and Tax Payable.
  return { status: 'not_implemented', transactionType: 'SALE' };
}

export async function postCustomerPayment(_transaction, _client) {
  // Future implementation: debit Cash/Bank; credit Accounts Receivable.
  return { status: 'not_implemented', transactionType: 'CUSTOMER_PAYMENT' };
}

export async function postPurchase(_transaction, _client) {
  // Future implementation: debit Purchase Expense and Input Tax; credit Accounts Payable.
  return { status: 'not_implemented', transactionType: 'PURCHASE' };
}

export async function postVendorPayment(_transaction, _client) {
  // Future implementation: debit Accounts Payable; credit Cash/Bank.
  return { status: 'not_implemented', transactionType: 'VENDOR_PAYMENT' };
}
