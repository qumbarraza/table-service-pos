import { create } from 'zustand'
import { apiRequest, downloadBlob } from '../utils/api'

const emptyDraft = {
  orderId: null,
  tableId: null,
  items: [],
  tax: 0,
  discount: 0,
  kitchenNote: '',
}

const asDraft = (order, tableId) => ({
  orderId: order?.id || null,
  tableId,
  items: order?.items?.map((item) => ({ ...item })) || [],
  tax: order?.tax || 0,
  discount: order?.discount || 0,
  kitchenNote: order?.kitchen_note || '',
})

export const usePosStore = create((set, get) => ({
  loading: false,
  saving: false,
  error: '',
  report: null,
  selectedFloorId: null,
  selectedTableId: null,
  activeOrder: null,
  draft: emptyDraft,
  restaurantName: 'TableServe Bistro',
  floors: [],
  tables: [],
  categories: [],
  products: [],
  activeOrders: [],
  search: '',
  billOpen: false,

  setSearch: (search) => set({ search }),
  openBill: () => set({ billOpen: true }),
  closeBill: () => set({ billOpen: false }),
  setSelectedFloor: (selectedFloorId) => set({ selectedFloorId }),

  bootstrap: async () => {
    set({ loading: true, error: '' })
    try {
      const data = await apiRequest('/bootstrap')
      set({
        ...data,
        loading: false,
        selectedFloorId: data.floors[0]?.id || null,
      })
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },

  refreshBootstrap: async () => {
    const currentFloorId = get().selectedFloorId
    const data = await apiRequest('/bootstrap')
    set({
      restaurantName: data.restaurantName,
      floors: data.floors,
      tables: data.tables,
      categories: data.categories,
      products: data.products,
      activeOrders: data.activeOrders,
      selectedFloorId: currentFloorId || data.floors[0]?.id || null,
    })
  },

  selectTable: async (tableId) => {
    set({ selectedTableId: tableId, loading: true, error: '' })
    try {
      const data = await apiRequest(`/orders/table/${tableId}`)
      set({
        activeOrder: data.order,
        draft: asDraft(data.order, tableId),
        loading: false,
      })
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },

  clearDraft: () => {
    const tableId = get().selectedTableId
    set({
      activeOrder: null,
      draft: { ...emptyDraft, tableId },
    })
  },

  addProductToDraft: (product) =>
    set((state) => {
      const existing = state.draft.items.find((item) => item.productId === product.id && !item.note)
      const items = existing
        ? state.draft.items.map((item) => (item === existing ? { ...item, qty: item.qty + 1 } : item))
        : state.draft.items.concat({
            id: `draft-${product.id}-${Date.now()}`,
            productId: product.id,
            productName: product.name,
            qty: 1,
            note: '',
            price: product.price,
          })
      return { draft: { ...state.draft, items } }
    }),

  updateDraftItem: (itemId, updates) =>
    set((state) => ({
      draft: {
        ...state.draft,
        items: state.draft.items
          .map((item) => (item.id === itemId ? { ...item, ...updates } : item))
          .filter((item) => item.qty > 0),
      },
    })),

  setDraftValue: (field, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [field]: value,
      },
    })),

  saveDraft: async () => {
    const { draft } = get()
    if (!draft.tableId) return null

    set({ saving: true, error: '' })
    try {
      const response = await apiRequest('/orders/save', {
        method: 'POST',
        body: JSON.stringify(draft),
      })
      set({
        saving: false,
        activeOrder: response.order,
        draft: asDraft(response.order, draft.tableId),
      })
      await get().refreshBootstrap()
      return response.order
    } catch (error) {
      set({ saving: false, error: error.message })
      return null
    }
  },

  printOrder: async () => {
    const order = await get().saveDraft()
    if (!order?.id) return null
    const response = await apiRequest(`/orders/${order.id}/print`, { method: 'POST' })
    set({
      activeOrder: response.order,
      draft: asDraft(response.order, response.order.table_id),
    })
    await get().refreshBootstrap()
    return response.order
  },

  clearTable: async () => {
    const { activeOrder } = get()
    if (!activeOrder?.id) return
    await apiRequest(`/orders/${activeOrder.id}/clear`, { method: 'POST' })
    await get().refreshBootstrap()
    get().clearDraft()
  },

  moveTable: async (targetTableId) => {
    const { activeOrder } = get()
    if (!activeOrder?.id) return null
    const response = await apiRequest(`/orders/${activeOrder.id}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetTableId }),
    })
    await get().refreshBootstrap()
    set({
      selectedTableId: response.order.table_id,
      activeOrder: response.order,
      draft: asDraft(response.order, response.order.table_id),
    })
    return response.order
  },

  mergeTable: async (targetTableId) => {
    const { activeOrder } = get()
    if (!activeOrder?.id) return null
    const response = await apiRequest(`/orders/${activeOrder.id}/merge`, {
      method: 'POST',
      body: JSON.stringify({ targetTableId }),
    })
    await get().refreshBootstrap()
    set({
      selectedTableId: response.order.table_id,
      activeOrder: response.order,
      draft: asDraft(response.order, response.order.table_id),
    })
    return response.order
  },

  settlePayment: async (payload) => {
    const { activeOrder } = get()
    if (!activeOrder?.id) return null
    const response = await apiRequest(`/orders/${activeOrder.id}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await get().refreshBootstrap()
    set({
      activeOrder: response.order,
      billOpen: false,
      draft: { ...emptyDraft, tableId: null },
      selectedTableId: null,
    })
    return response.order
  },

  loadReport: async (date) => {
    const report = await apiRequest(`/reports/daily?date=${date}`)
    set({ report })
  },

  exportReport: async (date) => {
    const csv = await apiRequest(`/reports/daily/export?date=${date}`)
    downloadBlob(csv, `daily-report-${date}.csv`, 'text/csv;charset=utf-8')
  },

  addFloor: async (name) => {
    await apiRequest('/floors', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    await get().refreshBootstrap()
  },

  addTable: async (name, floorId) => {
    await apiRequest('/tables', {
      method: 'POST',
      body: JSON.stringify({ name, floorId }),
    })
    await get().refreshBootstrap()
  },

  addCategory: async (name) => {
    await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    await get().refreshBootstrap()
  },

  addProduct: async (payload) => {
    await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await get().refreshBootstrap()
  },

  updateRestaurantName: async (restaurantName) => {
    await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify({ restaurantName }),
    })
    await get().refreshBootstrap()
  },
}))
