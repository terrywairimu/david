"use client"

import React from "react"
import { X, Plus } from "lucide-react"

interface StockItem {
  id: number
  name: string
  description?: string
  unit_price: number
  unit: string
  category: string
  sku?: string
}

interface QuotationItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
  stock_item?: StockItem
}

const ItemRow = ({
  item,
  index,
  category,
  sectionGroup,
  isMobile,
  isReadOnly,
  getItemInputRef,
  itemDropdownVisible,
  setItemDropdownVisible,
  handleItemSearch,
  selectStockItem,
  getFilteredItems,
  updateItem,
  removeItem,
  rawQuantityValues,
  setRawQuantityValues,
  rawPriceValues,
  setRawPriceValues,
  PortalDropdown
}: {
  item: QuotationItem
  index: number
  category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"
  sectionGroup: string
  isMobile: boolean
  isReadOnly: boolean
  getItemInputRef: (id: string) => React.RefObject<HTMLDivElement | null>
  itemDropdownVisible: Record<string, boolean>
  setItemDropdownVisible: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  handleItemSearch: (id: string, term: string) => void
  selectStockItem: (id: string, stock: StockItem, sg?: string) => void
  getFilteredItems: (id: string) => StockItem[]
  updateItem: (cat: typeof category, idx: number, field: keyof QuotationItem, val: any, sg?: string) => void
  removeItem: (cat: typeof category, idx: number, sg?: string) => void
  rawQuantityValues: Record<string, string>
  setRawQuantityValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  rawPriceValues: Record<string, string>
  setRawPriceValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  PortalDropdown: React.ComponentType<{
    isVisible: boolean
    triggerRef: React.RefObject<HTMLDivElement | null>
    onClose: () => void
    children: React.ReactNode
  }>
}) => {
  const id = item.id?.toString() || ""
  return (
    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center mb-3 mb-md-2 quotation-item-row worktop-row">
      <div className="w-100 w-md-auto mb-2 mb-md-0" style={{ flex: "2", marginRight: "16px" }}>
        <div className="position-relative" ref={getItemInputRef(id)}>
          <input
            type="text"
            className="form-control"
            value={item.description}
            onChange={(e) => {
              updateItem(category, index, "description", e.target.value, sectionGroup)
              handleItemSearch(id, e.target.value)
              setItemDropdownVisible(prev => ({ ...prev, [id]: true }))
            }}
            onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [id]: true }))}
            placeholder="Search and select item"
            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
            readOnly={isReadOnly}
          />
          <PortalDropdown
            isVisible={itemDropdownVisible[id] && !isReadOnly}
            triggerRef={getItemInputRef(id)}
            onClose={() => setItemDropdownVisible(prev => ({ ...prev, [id]: false }))}
          >
            {getFilteredItems(id).map(stockItem => (
              <li
                key={stockItem.id}
                style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f1f3f4", background: "#fff", color: "#212529" }}
                onClick={() => selectStockItem(id, stockItem, sectionGroup)}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#f8f9fa" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#fff" }}
              >
                <div style={{ fontWeight: "600", fontSize: "13px", color: "#212529" }}>{stockItem.name}</div>
                <div style={{ fontSize: "11px", color: "#495057" }}>Unit Price: KES {stockItem.unit_price?.toFixed(2)}</div>
              </li>
            ))}
          </PortalDropdown>
        </div>
      </div>
      <div className="col-units" style={{ flex: "1", marginRight: "16px" }}>
        <input
          type="text"
          className="form-control"
          value={item.unit}
          onChange={(e) => updateItem(category, index, "unit", e.target.value, sectionGroup)}
          placeholder="Units"
          style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
          readOnly={isReadOnly}
        />
      </div>
      <div className="col-qty" style={{ flex: "1", marginRight: "16px" }}>
        <input
          type="number"
          value={rawQuantityValues[id] !== undefined ? rawQuantityValues[id] : (item.quantity === 1 ? "" : item.quantity)}
          onFocus={() => setRawQuantityValues(prev => ({ ...prev, [id]: prev[id] ?? (item.quantity === 1 ? "" : String(item.quantity)) }))}
          onChange={(e) => {
            const v = e.target.value
            setRawQuantityValues(prev => ({ ...prev, [id]: v }))
            updateItem(category, index, "quantity", parseInt(v, 10) || 0, sectionGroup)
          }}
          onBlur={() => setRawQuantityValues(prev => ({ ...prev, [id]: "" }))}
          placeholder="1"
          style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
          min={1}
          readOnly={isReadOnly}
        />
      </div>
      <div className="col-unit-price" style={{ flex: "1", marginRight: "16px" }}>
        <input
          type="number"
          value={rawPriceValues[id] !== undefined ? rawPriceValues[id] : (item.unit_price === 0 ? "" : item.unit_price)}
          onFocus={() => setRawPriceValues(prev => ({ ...prev, [id]: prev[id] ?? (item.unit_price === 0 ? "" : String(item.unit_price)) }))}
          onChange={(e) => {
            const v = e.target.value
            setRawPriceValues(prev => ({ ...prev, [id]: v }))
            updateItem(category, index, "unit_price", parseFloat(v) || 0, sectionGroup)
          }}
          onBlur={() => setRawPriceValues(prev => ({ ...prev, [id]: "" }))}
          placeholder="0"
          style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
          min={0}
          step="0.01"
          readOnly={isReadOnly}
        />
      </div>
      <div className="col-total d-flex align-items-center" style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600 }}>
        <span className="worktop-total-value">{item.total_price.toFixed(2)}</span>
      </div>
      {!isReadOnly && (
        <div className="col-delete" style={{ flex: "0 0 40px" }}>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(category, index, sectionGroup)} style={{ borderRadius: "8px", padding: "4px 8px" }}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

interface CustomNormalSectionProps {
  sectionId: string
  items: Record<string, QuotationItem[]>
  addItem: (cat: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", sg?: string) => void
  removeItem: (cat: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", idx: number, sg?: string) => void
  updateItem: (cat: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", idx: number, field: keyof QuotationItem, val: any, sg?: string) => void
  sectionNames: { cabinet: string; worktop: string; accessories: string; appliances: string; wardrobes: string; tvunit: string }
  stockItems: StockItem[]
  getItemInputRef: (id: string) => React.RefObject<HTMLDivElement | null>
  itemDropdownVisible: Record<string, boolean>
  setItemDropdownVisible: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  handleItemSearch: (id: string, term: string) => void
  selectStockItem: (id: string, stock: StockItem, sg?: string) => void
  getFilteredItems: (id: string) => StockItem[]
  includeLabourCabinet: boolean
  setIncludeLabourCabinet: React.Dispatch<React.SetStateAction<boolean>>
  cabinetLabourPercentage: number
  setCabinetLabourPercentage: React.Dispatch<React.SetStateAction<number>>
  includeLabourAccessories: boolean
  setIncludeLabourAccessories: React.Dispatch<React.SetStateAction<boolean>>
  accessoriesLabourPercentage: number
  setAccessoriesLabourPercentage: React.Dispatch<React.SetStateAction<number>>
  includeLabourAppliances: boolean
  setIncludeLabourAppliances: React.Dispatch<React.SetStateAction<boolean>>
  appliancesLabourPercentage: number
  setAppliancesLabourPercentage: React.Dispatch<React.SetStateAction<number>>
  includeLabourWardrobes: boolean
  setIncludeLabourWardrobes: React.Dispatch<React.SetStateAction<boolean>>
  wardrobesLabourPercentage: number
  setWardrobesLabourPercentage: React.Dispatch<React.SetStateAction<number>>
  includeLabourTvUnit: boolean
  setIncludeLabourTvUnit: React.Dispatch<React.SetStateAction<boolean>>
  tvUnitLabourPercentage: number
  setTvUnitLabourPercentage: React.Dispatch<React.SetStateAction<number>>
  rawQuantityValues: Record<string, string>
  setRawQuantityValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  rawPriceValues: Record<string, string>
  setRawPriceValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  totals?: { cabinetTotal: number; cabinetLabour: number; accessoriesTotal: number; accessoriesLabour: number; appliancesTotal: number; appliancesLabour: number; wardrobesTotal: number; wardrobesLabour: number; tvUnitTotal: number; tvUnitLabour: number }
  isReadOnly: boolean
  isMobile: boolean
  PortalDropdown: React.ComponentType<{ isVisible: boolean; triggerRef: React.RefObject<HTMLDivElement | null>; onClose: () => void; children: React.ReactNode }>
}

export function CustomNormalSection(props: CustomNormalSectionProps) {
  const {
    sectionId,
    items,
    addItem,
    removeItem,
    updateItem,
    sectionNames,
    getItemInputRef,
    itemDropdownVisible,
    setItemDropdownVisible,
    handleItemSearch,
    selectStockItem,
    getFilteredItems,
    includeLabourCabinet,
    setIncludeLabourCabinet,
    cabinetLabourPercentage,
    setCabinetLabourPercentage,
    includeLabourAccessories,
    setIncludeLabourAccessories,
    accessoriesLabourPercentage,
    setAccessoriesLabourPercentage,
    includeLabourAppliances,
    setIncludeLabourAppliances,
    appliancesLabourPercentage,
    setAppliancesLabourPercentage,
    includeLabourWardrobes,
    setIncludeLabourWardrobes,
    wardrobesLabourPercentage,
    setWardrobesLabourPercentage,
    includeLabourTvUnit,
    setIncludeLabourTvUnit,
    tvUnitLabourPercentage,
    setTvUnitLabourPercentage,
    rawQuantityValues,
    setRawQuantityValues,
    rawPriceValues,
    setRawPriceValues,
    totals,
    isReadOnly,
    isMobile,
    PortalDropdown
  } = props

  const itemRowProps = {
    sectionGroup: sectionId,
    isMobile,
    isReadOnly,
    getItemInputRef,
    itemDropdownVisible,
    setItemDropdownVisible,
    handleItemSearch,
    selectStockItem,
    getFilteredItems,
    updateItem,
    removeItem,
    rawQuantityValues,
    setRawQuantityValues,
    rawPriceValues,
    setRawPriceValues,
    PortalDropdown
  }

  const categories: Array<{ key: "cabinet" | "accessories" | "appliances" | "wardrobes" | "tvunit"; label: string }> = [
    { key: "cabinet", label: sectionNames.cabinet },
    { key: "wardrobes", label: sectionNames.wardrobes },
    { key: "tvunit", label: sectionNames.tvunit },
    { key: "accessories", label: sectionNames.accessories },
    { key: "appliances", label: sectionNames.appliances }
  ]

  // Compute custom section totals from its own items (use main labour toggles/percentages)
  const cabinetTotal = (items.cabinet || []).filter(i => !i.description?.includes("Labour Charge")).reduce((s, i) => s + i.total_price, 0)
  const accessoriesTotal = (items.accessories || []).filter(i => !i.description?.includes("Labour Charge")).reduce((s, i) => s + i.total_price, 0)
  const appliancesTotal = (items.appliances || []).filter(i => !i.description?.includes("Labour Charge")).reduce((s, i) => s + i.total_price, 0)
  const wardrobesTotal = (items.wardrobes || []).filter(i => !i.description?.includes("Labour Charge")).reduce((s, i) => s + i.total_price, 0)
  const tvUnitTotal = (items.tvunit || []).filter(i => !i.description?.includes("Labour Charge")).reduce((s, i) => s + i.total_price, 0)

  const labourMap: Record<string, { include: boolean; setInclude: React.Dispatch<React.SetStateAction<boolean>>; pct: number; setPct: React.Dispatch<React.SetStateAction<number>> }> = {
    cabinet: { include: includeLabourCabinet, setInclude: setIncludeLabourCabinet, pct: cabinetLabourPercentage, setPct: setCabinetLabourPercentage },
    accessories: { include: includeLabourAccessories, setInclude: setIncludeLabourAccessories, pct: accessoriesLabourPercentage, setPct: setAccessoriesLabourPercentage },
    appliances: { include: includeLabourAppliances, setInclude: setIncludeLabourAppliances, pct: appliancesLabourPercentage, setPct: setAppliancesLabourPercentage },
    wardrobes: { include: includeLabourWardrobes, setInclude: setIncludeLabourWardrobes, pct: wardrobesLabourPercentage, setPct: setWardrobesLabourPercentage },
    tvunit: { include: includeLabourTvUnit, setInclude: setIncludeLabourTvUnit, pct: tvUnitLabourPercentage, setPct: setTvUnitLabourPercentage }
  }

  return (
    <div>
      {categories.map(({ key, label }) => {
        const arr = items[key] || []
        const labour = labourMap[key]
        const sectionTotal = arr.filter(i => !i.description?.includes("Labour Charge")).reduce((s, i) => s + i.total_price, 0)
        return (
          <div key={key} className="mb-4">
            <h6 className="mb-2" style={{ color: "#fff", fontSize: "14px" }}>{label}</h6>
            <div className="d-flex mb-2" style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>
              <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
              <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
              <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
              <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
              <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
              {!isReadOnly && <div style={{ flex: "0 0 40px" }} />}
            </div>
            {arr.map((item, idx) => (
              <ItemRow key={item.id || `${key}-${idx}`} item={item} index={idx} category={key} {...itemRowProps} />
            ))}
            {key === "cabinet" && !isReadOnly && (
              <div className="mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                <span className="me-2 small" style={{ color: "#fff" }}>Include labour as percentage</span>
                <div className="position-relative d-inline-block" style={{ width: "44px", height: "24px", borderRadius: "12px", background: labour?.include ? "#667eea" : "#e9ecef", cursor: "pointer" }} onClick={() => labour?.setInclude(!labour.include)}>
                  <div style={{ position: "absolute", top: "2px", left: labour?.include ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                </div>
              </div>
            )}
            {!isReadOnly && (
              <div className="mt-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => addItem(key, sectionId)} style={{ borderRadius: "10px", padding: "8px 16px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}>
                  <Plus size={12} className="me-1" /> Add Item
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface CustomWorktopSectionProps {
  sectionId: string
  items: QuotationItem[]
  addItem: (cat: "worktop", sg?: string) => void
  removeItem: (cat: "worktop", idx: number, sg?: string) => void
  updateItem: (cat: "worktop", idx: number, field: keyof QuotationItem, val: any, sg?: string) => void
  sectionNames: { worktop: string }
  stockItems: StockItem[]
  getItemInputRef: (id: string) => React.RefObject<HTMLDivElement | null>
  itemDropdownVisible: Record<string, boolean>
  setItemDropdownVisible: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  handleItemSearch: (id: string, term: string) => void
  selectStockItem: (id: string, stock: StockItem, sg?: string) => void
  getFilteredItems: (id: string) => StockItem[]
  worktopLaborQty: number
  setWorktopLaborQty: React.Dispatch<React.SetStateAction<number>>
  worktopLaborUnitPrice: number
  setWorktopLaborUnitPrice: React.Dispatch<React.SetStateAction<number>>
  rawQuantityValues: Record<string, string>
  setRawQuantityValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  rawPriceValues: Record<string, string>
  setRawPriceValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  isReadOnly: boolean
  isMobile: boolean
  PortalDropdown: React.ComponentType<{ isVisible: boolean; triggerRef: React.RefObject<HTMLDivElement | null>; onClose: () => void; children: React.ReactNode }>
}

export function CustomWorktopSection(props: CustomWorktopSectionProps) {
  const {
    sectionId,
    items,
    addItem,
    removeItem,
    updateItem,
    sectionNames,
    getItemInputRef,
    itemDropdownVisible,
    setItemDropdownVisible,
    handleItemSearch,
    selectStockItem,
    getFilteredItems,
    worktopLaborQty,
    setWorktopLaborQty,
    worktopLaborUnitPrice,
    setWorktopLaborUnitPrice,
    rawQuantityValues,
    setRawQuantityValues,
    rawPriceValues,
    setRawPriceValues,
    isReadOnly,
    isMobile,
    PortalDropdown
  } = props

  const itemRowProps = {
    sectionGroup: sectionId,
    isMobile,
    isReadOnly,
    getItemInputRef,
    itemDropdownVisible,
    setItemDropdownVisible,
    handleItemSearch,
    selectStockItem,
    getFilteredItems,
    updateItem,
    removeItem,
    rawQuantityValues,
    setRawQuantityValues,
    rawPriceValues,
    setRawPriceValues,
    PortalDropdown
  }

  return (
    <div>
      <div className="d-flex mb-3" style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>
        <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
        <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
        <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
        <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
        <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
        {!isReadOnly && <div style={{ flex: "0 0 40px" }} />}
      </div>
      {items.map((item, idx) => (
        <ItemRow key={item.id || `worktop-${idx}`} item={item} index={idx} category="worktop" {...itemRowProps} />
      ))}
      {!isReadOnly && (
        <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
          <span className="me-2 small" style={{ color: "#fff" }}>Labour:</span>
          <input type="number" value={worktopLaborQty} onChange={(e) => setWorktopLaborQty(parseInt(e.target.value, 10) || 1)} style={{ width: "60px", marginRight: "12px", borderRadius: "8px" }} min={1} />
          <input type="number" value={worktopLaborUnitPrice} onChange={(e) => setWorktopLaborUnitPrice(parseFloat(e.target.value) || 0)} style={{ width: "100px", borderRadius: "8px" }} min={0} step="0.01" />
        </div>
      )}
      {!isReadOnly && (
        <div className="mt-3">
          <button type="button" className="btn btn-primary" onClick={() => addItem("worktop", sectionId)} style={{ borderRadius: "12px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none", padding: "10px 20px" }}>
            <Plus size={14} className="me-1" /> Add Item
          </button>
        </div>
      )}
    </div>
  )
}
