import { formatCurrency } from './formatters'

function openPrintWindow(content) {
  const printWindow = window.open('', '_blank', 'width=420,height=720')
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups to print.')
  }

  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

export function printKitchenReceipt(order) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.qty} x ${item.productName}</td>
          <td style="text-align:right;">${formatCurrency(item.qty * item.price)}</td>
        </tr>
        ${item.note ? `<tr><td colspan="2" style="font-size:12px;color:#555;">Note: ${item.note}</td></tr>` : ''}
      `,
    )
    .join('')

  openPrintWindow(`
    <html>
      <head>
        <title>Kitchen Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
          h1 { margin: 0 0 8px; font-size: 22px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td { padding: 6px 0; border-bottom: 1px dashed #bbb; vertical-align: top; }
          .rule { margin: 12px 0; border-top: 1px dashed #111; }
        </style>
      </head>
      <body>
        <h1>${order.restaurantName}</h1>
        <p><strong>Table:</strong> ${order.table_name}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <div class="rule"></div>
        <table>${rows}</table>
        ${order.kitchen_note ? `<p style="margin-top: 16px;"><strong>Notes:</strong> ${order.kitchen_note}</p>` : ''}
      </body>
    </html>
  `)
}

export function printCustomerBill(order) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.productName}</td>
          <td style="text-align:center;">${item.qty}</td>
          <td style="text-align:right;">${formatCurrency(item.price)}</td>
          <td style="text-align:right;">${formatCurrency(item.qty * item.price)}</td>
        </tr>
      `,
    )
    .join('')

  openPrintWindow(`
    <html>
      <head>
        <title>Bill</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
          h1 { margin: 0 0 8px; font-size: 22px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td, th { padding: 8px 0; border-bottom: 1px solid #ddd; font-size: 14px; }
          .totals { margin-top: 18px; }
          .totals p { display: flex; justify-content: space-between; margin: 6px 0; }
        </style>
      </head>
      <body>
        <h1>${order.restaurantName}</h1>
        <p><strong>Table:</strong> ${order.table_name}</p>
        <p><strong>Bill Time:</strong> ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Price</th>
              <th align="right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <p><span>Subtotal</span><strong>${formatCurrency(order.totals.subtotal)}</strong></p>
          <p><span>Tax</span><strong>${formatCurrency(order.totals.tax)}</strong></p>
          <p><span>Discount</span><strong>${formatCurrency(order.totals.discount)}</strong></p>
          <p><span>Total</span><strong>${formatCurrency(order.totals.total)}</strong></p>
        </div>
      </body>
    </html>
  `)
}
