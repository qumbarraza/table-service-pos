import { X } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

function BillModal({ open, order, paymentMethod, onPaymentMethod, onClose, onPrintBill, onMarkPaid }) {
  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-terracotta">Settlement</p>
            <h2 className="mt-2 text-3xl font-black text-brand-charcoal">{order.table_name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-stone-100 p-2">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-[28px] bg-stone-50 p-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-stone-200 py-3 text-sm">
                <div>
                  <p className="font-semibold">{item.productName}</p>
                  {item.note && <p className="text-xs text-stone-500">Note: {item.note}</p>}
                </div>
                <p>
                  {item.qty} x {formatCurrency(item.price)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-[28px] bg-brand-charcoal p-5 text-white">
            <div className="flex justify-between text-sm text-white/70">
              <span>Subtotal</span>
              <span>{formatCurrency(order.totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/70">
              <span>Tax</span>
              <span>{formatCurrency(order.totals.tax)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/70">
              <span>Discount</span>
              <span>{formatCurrency(order.totals.discount)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-black">
              <span>Total</span>
              <span>{formatCurrency(order.totals.total)}</span>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Payment method</span>
              <select
                value={paymentMethod}
                onChange={(event) => onPaymentMethod(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none"
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Split Payment</option>
              </select>
            </label>

            <button type="button" onClick={onPrintBill} className="w-full rounded-2xl bg-white px-4 py-3 font-bold text-brand-charcoal">
              Print Bill
            </button>
            <button type="button" onClick={onMarkPaid} className="w-full rounded-2xl bg-brand-gold px-4 py-3 font-bold text-brand-charcoal">
              Mark Paid & Close Table
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillModal
