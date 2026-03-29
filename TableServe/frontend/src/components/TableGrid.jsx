import { Armchair, Dot } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

const statusStyles = {
  Available: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Occupied: 'bg-amber-100 text-amber-900 border-amber-300',
  Printed: 'bg-sky-100 text-sky-900 border-sky-300',
  Paid: 'bg-stone-100 text-stone-900 border-stone-300',
}

function TableGrid({ floors, tables, activeOrders, selectedFloorId, selectedTableId, onSelectFloor, onSelectTable }) {
  const visibleTables = tables.filter((table) => table.floor_id === selectedFloorId)

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-white/88 p-3 shadow-[0_18px_50px_rgba(57,26,8,0.12)]">
      <div className="mb-3 flex flex-wrap gap-2">
        {floors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            onClick={() => onSelectFloor(floor.id)}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition md:text-sm ${
              selectedFloorId === floor.id ? 'bg-brand-terracotta text-white' : 'bg-brand-sand text-brand-charcoal'
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2 xl:grid-cols-3">
        {visibleTables.map((table) => {
          const order = activeOrders.find((item) => item.table_id === table.id)
          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable(table.id)}
              className={`rounded-[20px] border px-3 py-3 text-left transition ${
                selectedTableId === table.id
                  ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-xl'
                  : 'border-white/30 bg-white hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold md:text-sm">
                  <Armchair size={16} />
                  {table.name}
                </span>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold md:text-xs ${
                    selectedTableId === table.id ? 'border-white/40 bg-white/10 text-white' : statusStyles[table.status]
                  }`}
                >
                  {table.status}
                </span>
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.22em] opacity-60 md:text-xs">{table.floor_name}</p>
              <div className="mt-1.5 flex items-center justify-between text-xs md:text-sm">
                <span className="inline-flex items-center gap-1 opacity-80">
                  <Dot size={16} />
                  {order?.item_count || 0} items
                </span>
                <span className="font-bold">{formatCurrency(order?.subtotal || 0)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default TableGrid
