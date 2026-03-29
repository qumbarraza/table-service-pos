import { useEffect, useMemo, useRef, useState } from 'react'
import BillModal from '../components/BillModal.jsx'
import MenuPanel from '../components/MenuPanel.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import TableGrid from '../components/TableGrid.jsx'
import { usePosStore } from '../store/usePosStore.js'
import { printCustomerBill, printKitchenReceipt } from '../utils/print.js'

function PosPage() {
  const {
    loading,
    saving,
    error,
    floors,
    tables,
    categories,
    products,
    activeOrders,
    selectedFloorId,
    selectedTableId,
    activeOrder,
    draft,
    search,
    billOpen,
    bootstrap,
    setSelectedFloor,
    selectTable,
    setSearch,
    addProductToDraft,
    updateDraftItem,
    setDraftValue,
    saveDraft,
    printOrder,
    clearTable,
    moveTable,
    mergeTable,
    openBill,
    closeBill,
    settlePayment,
  } = usePosStore()

  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const initialLoadRef = useRef(false)

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      bootstrap()
    }
  }, [bootstrap])

  useEffect(() => {
    if (!selectedTableId || !draft.items.length) return undefined
    const timeout = setTimeout(() => {
      saveDraft()
    }, 700)
    return () => clearTimeout(timeout)
  }, [draft, saveDraft, selectedTableId])

  const selectedTable = tables.find((table) => table.id === selectedTableId)
  const availableOtherTables = useMemo(
    () => tables.filter((table) => table.id !== selectedTableId),
    [tables, selectedTableId],
  )

  const promptForTable = (actionLabel) => {
    const options = availableOtherTables.map((table) => `${table.id}: ${table.name} (${table.status})`).join('\n')
    const response = window.prompt(`${actionLabel} to which table?\n${options}`)
    return Number(response)
  }

  const handlePrint = async () => {
    const printedOrder = await printOrder()
    if (printedOrder) printKitchenReceipt(printedOrder)
  }

  const handleMove = async () => {
    const targetTableId = promptForTable('Move order')
    if (targetTableId) {
      await moveTable(targetTableId)
    }
  }

  const handleMerge = async () => {
    const targetTableId = promptForTable('Merge order')
    if (targetTableId) {
      await mergeTable(targetTableId)
    }
  }

  const handleOpenBill = async () => {
    const order = await saveDraft()
    if (order) {
      openBill()
    }
  }

  const handleMarkPaid = async () => {
    const paidOrder = await settlePayment({ paymentMethod })
    if (paidOrder) {
      printCustomerBill(paidOrder)
      setPaymentMethod('Cash')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[20px] bg-white/75 px-3 py-2 text-xs shadow-sm md:text-sm">
        <p className="font-semibold text-brand-charcoal">
          Fast offline order punching with auto-save, kitchen print, billing, move, and merge.
        </p>
        {error && <p className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">{error}</p>}
        {loading && <p className="rounded-full bg-brand-sand px-3 py-1 font-semibold text-brand-charcoal">Loading...</p>}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[0.96fr_1.12fr_0.96fr]">
        <TableGrid
          floors={floors}
          tables={tables}
          activeOrders={activeOrders}
          selectedFloorId={selectedFloorId}
          selectedTableId={selectedTableId}
          onSelectFloor={setSelectedFloor}
          onSelectTable={selectTable}
        />
        <MenuPanel
          categories={categories}
          products={products}
          search={search}
          onSearch={setSearch}
          onAddProduct={addProductToDraft}
        />
        <OrderSummary
          table={selectedTable}
          draft={draft}
          saving={saving}
          onItemChange={updateDraftItem}
          onDraftValue={setDraftValue}
          onSave={saveDraft}
          onPrint={handlePrint}
          onClear={clearTable}
          onMove={handleMove}
          onMerge={handleMerge}
          onOpenBill={handleOpenBill}
        />
      </div>

      <BillModal
        open={billOpen}
        order={activeOrder}
        paymentMethod={paymentMethod}
        onPaymentMethod={setPaymentMethod}
        onClose={closeBill}
        onPrintBill={() => activeOrder && printCustomerBill(activeOrder)}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  )
}

export default PosPage
