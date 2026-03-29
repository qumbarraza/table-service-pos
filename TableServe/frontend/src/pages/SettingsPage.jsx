import { useEffect, useState } from 'react'
import { usePosStore } from '../store/usePosStore'

function SettingsCard({ title, children }) {
  return (
    <div className="rounded-[28px] bg-white/90 p-5 shadow-[0_18px_50px_rgba(57,26,8,0.12)]">
      <h2 className="text-2xl font-black text-brand-charcoal">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function SettingsPage() {
  const {
    restaurantName,
    floors,
    categories,
    bootstrap,
    addFloor,
    addTable,
    addCategory,
    addProduct,
    updateRestaurantName,
  } = usePosStore()

  const [nameValue, setNameValue] = useState(restaurantName)
  const [floorName, setFloorName] = useState('')
  const [tableForm, setTableForm] = useState({ floorId: '', name: '' })
  const [categoryName, setCategoryName] = useState('')
  const [productForm, setProductForm] = useState({ categoryId: '', name: '', price: '', description: '' })

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    setNameValue(restaurantName)
  }, [restaurantName])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SettingsCard title="General Settings">
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            await updateRestaurantName(nameValue)
          }}
          className="space-y-3"
        >
          <input
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            className="w-full rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Restaurant name"
          />
          <button type="submit" className="rounded-2xl bg-brand-charcoal px-4 py-3 font-semibold text-white">
            Save Restaurant Name
          </button>
        </form>
      </SettingsCard>

      <SettingsCard title="Floor & Table Management">
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            await addFloor(floorName)
            setFloorName('')
          }}
          className="mb-4 flex gap-3"
        >
          <input
            value={floorName}
            onChange={(event) => setFloorName(event.target.value)}
            className="flex-1 rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Add floor name"
          />
          <button type="submit" className="rounded-2xl bg-brand-terracotta px-4 py-3 font-semibold text-white">
            Add Floor
          </button>
        </form>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            await addTable(tableForm.name, Number(tableForm.floorId))
            setTableForm({ floorId: '', name: '' })
          }}
          className="grid gap-3 md:grid-cols-3"
        >
          <select
            value={tableForm.floorId}
            onChange={(event) => setTableForm((current) => ({ ...current, floorId: event.target.value }))}
            className="rounded-2xl border border-stone-200 px-4 py-3"
          >
            <option value="">Select floor</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
          <input
            value={tableForm.name}
            onChange={(event) => setTableForm((current) => ({ ...current, name: event.target.value }))}
            className="rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Table name"
          />
          <button type="submit" className="rounded-2xl bg-brand-charcoal px-4 py-3 font-semibold text-white">
            Add Table
          </button>
        </form>
      </SettingsCard>

      <SettingsCard title="Menu Categories">
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            await addCategory(categoryName)
            setCategoryName('')
          }}
          className="flex gap-3"
        >
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            className="flex-1 rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Category name"
          />
          <button type="submit" className="rounded-2xl bg-brand-terracotta px-4 py-3 font-semibold text-white">
            Add Category
          </button>
        </form>
      </SettingsCard>

      <SettingsCard title="Products">
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            await addProduct({
              categoryId: Number(productForm.categoryId),
              name: productForm.name,
              price: Number(productForm.price),
              description: productForm.description,
            })
            setProductForm({ categoryId: '', name: '', price: '', description: '' })
          }}
          className="grid gap-3"
        >
          <select
            value={productForm.categoryId}
            onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))}
            className="rounded-2xl border border-stone-200 px-4 py-3"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            value={productForm.name}
            onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            className="rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Product name"
          />
          <input
            type="number"
            min="0"
            value={productForm.price}
            onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
            className="rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Price"
          />
          <textarea
            value={productForm.description}
            onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            className="min-h-28 rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Optional description"
          />
          <button type="submit" className="rounded-2xl bg-brand-charcoal px-4 py-3 font-semibold text-white">
            Add Product
          </button>
        </form>
      </SettingsCard>
    </div>
  )
}

export default SettingsPage
