import { Pencil, Printer, ReceiptText, Save, Trash2, Waypoints } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

function OrderSummary({
  table,
  draft,
  saving,
  onItemChange,
  onDraftValue,
  onSave,
  onPrint,
  onClear,
  onMove,
  onMerge,
  onOpenBill,
}) {
  const subtotal = draft.items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const total = subtotal + Number(draft.tax || 0) - Number(draft.discount || 0)

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-brand-charcoal p-3 text-white shadow-[0_18px_50px_rgba(57,26,8,0.2)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-brand-gold md:text-xs">Order Summary</p>
          <h2 className="mt-1 text-xl font-black md:text-2xl">{table?.name || 'Select a table'}</h2>
        </div>
        <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold md:text-xs">
          {saving ? 'Auto-saving...' : 'Offline ready'}
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        {draft.items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/20 p-4 text-center text-sm text-white/70">
            Tap menu items to start punching the order.
          </div>
        )}
        {draft.items.map((item) => (
          <div key={item.id} className="rounded-[18px] bg-white/8 p-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.productName}</p>
                <p className="mt-0.5 text-xs text-white/70 md:text-sm">{formatCurrency(item.price)} each</p>
              </div>
              <p className="text-sm font-bold md:text-base">{formatCurrency(item.qty * item.price)}</p>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onItemChange(item.id, { qty: item.qty - 1 })}
                  className="h-8 w-8 rounded-full bg-white/12 text-lg"
                >
                  -
                </button>
                <span className="min-w-6 text-center text-base font-bold md:text-lg">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => onItemChange(item.id, { qty: item.qty + 1 })}
                  className="h-8 w-8 rounded-full bg-white/12 text-lg"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const note = window.prompt('Add item note', item.note || '')
                  if (note !== null) onItemChange(item.id, { note })
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs md:text-sm"
              >
                <Pencil size={14} />
                {item.note ? 'Edit note' : 'Add note'}
              </button>
            </div>
            {item.note && <p className="mt-2 text-xs text-brand-gold">Note: {item.note}</p>}
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <textarea
          value={draft.kitchenNote}
          onChange={(event) => onDraftValue('kitchenNote', event.target.value)}
          placeholder="Kitchen note for the whole order"
          className="min-h-16 w-full rounded-3xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-3xl bg-white/8 px-3 py-2 text-sm">
            <span className="mb-1 block text-white/70">Tax</span>
            <input
              type="number"
              min="0"
              value={draft.tax}
              onChange={(event) => onDraftValue('tax', Number(event.target.value))}
              className="w-full bg-transparent text-base font-semibold outline-none md:text-lg"
            />
          </label>
          <label className="rounded-3xl bg-white/8 px-3 py-2 text-sm">
            <span className="mb-1 block text-white/70">Discount</span>
            <input
              type="number"
              min="0"
              value={draft.discount}
              onChange={(event) => onDraftValue('discount', Number(event.target.value))}
              className="w-full bg-transparent text-base font-semibold outline-none md:text-lg"
            />
          </label>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-[20px] bg-white/8 p-3">
        <div className="flex justify-between text-xs text-white/70 md:text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-white/70 md:text-sm">
          <span>Tax</span>
          <span>{formatCurrency(draft.tax)}</span>
        </div>
        <div className="flex justify-between text-xs text-white/70 md:text-sm">
          <span>Discount</span>
          <span>{formatCurrency(draft.discount)}</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2 text-base font-black md:text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onSave} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gold px-3 py-2.5 text-sm font-bold text-brand-charcoal">
          <Save size={18} />
          Save Order
        </button>
        <button type="button" onClick={onPrint} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-sm font-bold text-brand-charcoal">
          <Printer size={18} />
          Print Order
        </button>
        <button type="button" onClick={onOpenBill} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-terracotta px-3 py-2.5 text-sm font-bold">
          <ReceiptText size={18} />
          Billing
        </button>
        <button type="button" onClick={onClear} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-sm font-bold">
          <Trash2 size={18} />
          Clear Table
        </button>
        <button type="button" onClick={onMove} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-sm font-bold">
          <Waypoints size={18} />
          Move Table
        </button>
        <button type="button" onClick={onMerge} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-sm font-bold">
          <Waypoints size={18} />
          Merge Tables
        </button>
      </div>
    </section>
  )
}

export default OrderSummary
