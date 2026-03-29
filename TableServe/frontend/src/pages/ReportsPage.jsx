import { useEffect, useState } from 'react'
import { Download, TrendingUp } from 'lucide-react'
import { usePosStore } from '../store/usePosStore'
import { formatCurrency, formatDateTime } from '../utils/formatters'

function ReportsPage() {
  const { report, loadReport, exportReport } = usePosStore()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    loadReport(date)
  }, [date, loadReport])

  return (
    <section className="rounded-[30px] bg-white/88 p-5 shadow-[0_18px_50px_rgba(57,26,8,0.14)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-terracotta">Daily Summary</p>
          <h2 className="mt-2 text-3xl font-black text-brand-charcoal">Offline reports and CSV export</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
          />
          <button
            type="button"
            onClick={() => exportReport(date)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-charcoal px-4 py-3 font-semibold text-white"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] bg-brand-charcoal p-4 text-white">
          <p className="text-sm text-white/70">Total Orders</p>
          <p className="mt-3 text-4xl font-black">{report?.totalOrders || 0}</p>
        </div>
        <div className="rounded-[24px] bg-brand-sand p-4">
          <p className="text-sm text-brand-charcoal/70">Total Sales</p>
          <p className="mt-3 text-4xl font-black text-brand-charcoal">{formatCurrency(report?.totalSales || 0)}</p>
        </div>
        <div className="rounded-[24px] bg-white p-4 ring-1 ring-stone-200">
          <p className="text-sm text-stone-500">Most Sold Item</p>
          <p className="mt-3 text-2xl font-black text-brand-charcoal">{report?.mostSoldItem?.name || '-'}</p>
          <p className="mt-1 text-sm text-stone-500">{report?.mostSoldItem?.quantity || 0} qty sold</p>
        </div>
        <div className="rounded-[24px] bg-brand-green p-4 text-white">
          <p className="text-sm text-white/70">Payment Summary</p>
          <div className="mt-3 space-y-2 text-sm">
            {report?.paymentSummary?.length ? (
              report.paymentSummary.map((item) => (
                <div key={item.method} className="flex justify-between">
                  <span>{item.method}</span>
                  <strong>{formatCurrency(item.total)}</strong>
                </div>
              ))
            ) : (
              <p>No payments for this date.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-stone-200">
        <div className="flex items-center gap-2 bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-700">
          <TrendingUp size={16} />
          Order history
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {report?.lineItems?.map((item) => (
                <tr key={item.orderId} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-semibold">#{item.orderId}</td>
                  <td className="px-4 py-3">{item.tableName}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{item.paymentMethod}</td>
                  <td className="px-4 py-3">{formatCurrency(item.total)}</td>
                  <td className="px-4 py-3">{formatDateTime(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
