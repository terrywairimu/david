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
        <input type="text" className="form-control" value={item.unit} onChange={(e) => updateItem(category, index, "unit", e.target.value, sectionGroup)} placeholder="Units" style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }} readOnly={isReadOnly} />
      </div>
      <div className="col-qty" style={{ flex: "1", marginRight: "16px" }}>
        <input
          type="number"
          value={rawQuantityValues[id] !== undefined ? rawQuantityValues[id] : (item.quantity === 1 ? "" : item.quantity)}
          onFocus={() => setRawQuantityValues(prev => ({ ...prev, [id]: prev[id] ?? (item.quantity === 1 ? "" : String(item.quantity)) }))}
          onChange={(e) => setRawQuantityValues(prev => ({ ...prev, [id]: e.target.value }))}
          onBlur={(e) => {
            const val = e.target.value
            const num = val === "" ? 1 : parseFloat(val)
            updateItem(category, index, "quantity", isNaN(num) ? 1 : num, sectionGroup)
            setRawQuantityValues(prev => { const c = { ...prev }; delete c[id]; return c })
          }}
          placeholder="1"
          style={{ width: "auto", borderRadius: "12px", height: "40px", fontSize: "13px", background: "transparent", color: "#fff", border: "none", padding: "8px 12px", boxShadow: "none", WebkitAppearance: "none", MozAppearance: "textfield", outline: "none" }}
          min={1}
          step="0.01"
          readOnly={isReadOnly}
        />
      </div>
      <div className="col-unit-price" style={{ flex: "1", marginRight: "16px" }}>
        <input
          type="number"
          className="form-control"
          value={item.unit_price || ""}
          onChange={(e) => updateItem(category, index, "unit_price", parseFloat(e.target.value) || 0, sectionGroup)}
          placeholder="Unit Price"
          style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
          min={0}
          step="0.01"
          readOnly={isReadOnly}
        />
      </div>
      <div className="item-total col-total d-flex align-items-center" style={{ flex: "1", marginRight: "16px", fontWeight: "600", color: "#ffffff" }}>
        <span className="worktop-total-currency">KES</span>
        <span className="worktop-total-value ms-1">{item.total_price.toFixed(2)}</span>
      </div>
      {!isReadOnly && (
        <div className="item-delete col-delete w-md-auto text-center text-md-left" style={{ flex: "0 0 40px", marginLeft: "auto" }}>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(category, index, sectionGroup)} style={{ borderRadius: "8px", padding: "4px 8px" }}><X size={12} /></button>
        </div>
      )}
    </div>
  )
}

// Normal section = single cabinet-style block (matches main Cabinet section exactly)
interface CustomNormalSectionProps {
  sectionId: string
  items: Record<string, QuotationItem[]>
  addItem: (cat: "cabinet", sg?: string) => void
  removeItem: (cat: "cabinet", idx: number, sg?: string) => void
  updateItem: (cat: "cabinet", idx: number, field: keyof QuotationItem, val: any, sg?: string) => void
  sectionNames: { cabinet: string }
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
  rawQuantityValues: Record<string, string>
  setRawQuantityValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  rawPriceValues: Record<string, string>
  setRawPriceValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  isReadOnly: boolean
  isMobile: boolean
  PortalDropdown: React.ComponentType<{ isVisible: boolean; triggerRef: React.RefObject<HTMLDivElement | null>; onClose: () => void; children: React.ReactNode }>
}

export function CustomNormalSection(props: CustomNormalSectionProps) {
  const { sectionId, items, addItem, removeItem, updateItem, getItemInputRef, itemDropdownVisible, setItemDropdownVisible, handleItemSearch, selectStockItem, getFilteredItems, includeLabourCabinet, setIncludeLabourCabinet, cabinetLabourPercentage, setCabinetLabourPercentage, rawQuantityValues, setRawQuantityValues, rawPriceValues, setRawPriceValues, isReadOnly, isMobile, PortalDropdown } = props
  const arr = items.cabinet || []

  return (
    <div className="mb-3">
      <div className="d-flex mb-3" style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>
        <div className="d-none d-md-block" style={{ flex: "2", marginRight: "16px" }}>Item</div>
        <div className="d-none d-md-block" style={{ flex: "1", marginRight: "16px" }}>Units</div>
        <div className="d-none d-md-block" style={{ flex: "1", marginRight: "16px" }}>Qty</div>
        <div className="d-none d-md-block" style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
        <div className="d-none d-md-block" style={{ flex: "1", marginRight: "16px" }}>Total</div>
        {!isReadOnly && <div className="d-none d-md-block" style={{ flex: "0 0 40px" }} />}
      </div>
      {arr.map((item, idx) => (
        <ItemRow key={item.id || `cabinet-${idx}`} item={item} index={idx} category="cabinet" sectionGroup={sectionId} isMobile={isMobile} isReadOnly={isReadOnly} getItemInputRef={getItemInputRef} itemDropdownVisible={itemDropdownVisible} setItemDropdownVisible={setItemDropdownVisible} handleItemSearch={handleItemSearch} selectStockItem={selectStockItem} getFilteredItems={getFilteredItems} updateItem={updateItem} removeItem={removeItem} rawQuantityValues={rawQuantityValues} setRawQuantityValues={setRawQuantityValues} rawPriceValues={rawPriceValues} setRawPriceValues={setRawPriceValues} PortalDropdown={PortalDropdown} />
      ))}
      {!isReadOnly && (
        <>
          <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
            <span className="me-2 small" style={{ color: "#fff" }}>Include labour as percentage</span>
            <div className="position-relative" style={{ width: "44px", height: "24px", borderRadius: "12px", background: includeLabourCabinet ? "#667eea" : "#e9ecef", cursor: "pointer" }} onClick={() => setIncludeLabourCabinet(!includeLabourCabinet)}>
              <div style={{ position: "absolute", top: "2px", left: includeLabourCabinet ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </div>
          </div>
          <div className="mt-3">
            <button type="button" className="btn btn-primary" onClick={() => addItem("cabinet", sectionId)} style={{ borderRadius: "12px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none", padding: "10px 20px" }}>
              <Plus size={14} className="me-1" /> Add Item
            </button>
          </div>
        </>
      )}
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
  const { sectionId, items, addItem, removeItem, updateItem, getItemInputRef, itemDropdownVisible, setItemDropdownVisible, handleItemSearch, selectStockItem, getFilteredItems, worktopLaborQty, setWorktopLaborQty, worktopLaborUnitPrice, setWorktopLaborUnitPrice, rawQuantityValues, setRawQuantityValues, rawPriceValues, setRawPriceValues, isReadOnly, isMobile, PortalDropdown } = props

  const itemRowProps = { sectionGroup: sectionId, isMobile, isReadOnly, getItemInputRef, itemDropdownVisible, setItemDropdownVisible, handleItemSearch, selectStockItem, getFilteredItems, updateItem, removeItem, rawQuantityValues, setRawQuantityValues, rawPriceValues, setRawPriceValues, PortalDropdown }

  return (
    <div>
      <div className="d-flex mb-3 worktop-headers" style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>
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
        <>
          <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
            <span className="me-2 small" style={{ color: "#fff" }}>Labour:</span>
            <input type="number" value={worktopLaborQty} onChange={(e) => setWorktopLaborQty(parseInt(e.target.value, 10) || 1)} style={{ width: "60px", marginRight: "12px", borderRadius: "8px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }} min={1} />
            <input type="number" value={worktopLaborUnitPrice} onChange={(e) => setWorktopLaborUnitPrice(parseFloat(e.target.value) || 0)} style={{ width: "100px", borderRadius: "8px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }} min={0} step="0.01" />
          </div>
          <div className="mt-3">
            <button type="button" className="btn btn-primary" onClick={() => addItem("worktop", sectionId)} style={{ borderRadius: "12px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none", padding: "10px 20px" }}>
              <Plus size={14} className="me-1" /> Add Item
            </button>
          </div>
        </>
      )}
    </div>
  )
}
