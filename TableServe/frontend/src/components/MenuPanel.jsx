import { Search } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

function MenuPanel({ categories, products, search, onSearch, onAddProduct }) {
  const query = search.toLowerCase()
  const filteredProducts = products.filter((product) => {
    if (!query) return true
    return (
      product.name.toLowerCase().includes(query) ||
      product.category_name.toLowerCase().includes(query) ||
      (product.description || '').toLowerCase().includes(query)
    )
  })

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-white/90 p-3 shadow-[0_18px_50px_rgba(57,26,8,0.12)]">
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5">
        <Search size={16} className="text-stone-500" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search menu items"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category.id}
            className="rounded-full bg-brand-sand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-charcoal md:text-xs"
          >
            {category.name}
          </span>
        ))}
      </div>

      <div className="mt-3 grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2 md:grid-cols-3">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onAddProduct(product)}
            className="rounded-[20px] border border-white/30 bg-linear-to-br from-brand-charcoal to-[#5e4539] px-3 py-3 text-left text-white shadow-md transition hover:-translate-y-0.5"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold md:text-xs">{product.category_name}</p>
            <h3 className="mt-2 text-sm font-bold leading-tight md:text-base">{product.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-8 text-xs text-white/70 md:text-sm">
              {product.description || 'Quick order item'}
            </p>
            <p className="mt-2 text-lg font-black md:text-xl">{formatCurrency(product.price)}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

export default MenuPanel
