# Editable Section Headers Implementation Summary

## Overview
This implementation adds the ability to rename section headers in quotation forms (create new quotation and edit quotation) and ensures these custom names are saved to the database and reflected in the generated PDF.

## Database Changes

### 1. Added section_names column to quotations table
```sql
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS section_names JSONB DEFAULT '{"cabinet": "General", "worktop": "Worktop", "accessories": "Accessories", "appliances": "Appliances", "wardrobes": "Wardrobes", "tvunit": "TV Unit"}'::jsonb;
```

## Component Changes

### 1. QuotationModal Component (`components/ui/quotation-modal.tsx`)

#### Added State Management
- Added `sectionNames` state to store custom section names
- Added `editingSection` and `editingSectionName` state for inline editing
- Added `isReadOnly` prop to control editability

#### Added Functions
- `handleSectionNameEdit()` - Initiates section name editing
- `handleSectionNameSave()` - Saves the edited section name
- `handleSectionNameCancel()` - Cancels editing
- `handleSectionNameKeyPress()` - Handles keyboard events (Enter to save, Escape to cancel)

#### Added EditableSectionHeader Component
- Inline editing interface with input field
- Save/Cancel buttons
- Keyboard shortcuts (Enter/Escape)
- Visual indicators (edit icon)
- Read-only mode support

#### Updated Section Headers
- Replaced all static section headers with `EditableSectionHeader` components
- Updated sections: General (cabinet), Worktop, Accessories, Appliances, Wardrobes, TV Unit

#### Updated Data Loading
- Modified `loadQuotationData()` to load custom section names from database
- Added fallback to default names if not available

#### Updated Data Saving
- Modified `handleSave()` to include `section_names` in saved data
- Updated `generatePDF()` to use custom section names in PDF generation

#### Updated PDF Generation
- Modified data preparation to include section headers with custom names
- Added section summary rows with proper formatting
- Ensured custom names appear in generated PDF

### 2. PDF Template (`lib/pdf-template.ts`)

#### Updated Interface
- Added `section_names` field to `QuotationData` interface
- Supports custom names for all sections: cabinet, worktop, accessories, appliances, wardrobes, tvunit

#### Enhanced Data Processing
- Modified item processing to include section headers with custom names
- Added section summary rows with proper currency formatting
- Ensured section totals display with comma punctuation

### 3. Types (`lib/types.ts`)

#### Updated Quotation Interface
- Added `section_names` field to support custom section names
- Maintains backward compatibility with existing quotations

### 4. Quotations View (`app/sales/components/quotations-view.tsx`)

#### Updated Interface
- Added `section_names` field to local Quotation interface

#### Updated Database Operations
- Modified create quotation to include `section_names`
- Modified update quotation to include `section_names`
- Ensures custom names are persisted to database

## Features Implemented

### 1. Inline Section Name Editing
- Click on any section header to edit
- Real-time editing with visual feedback
- Keyboard shortcuts (Enter to save, Escape to cancel)
- Auto-save on blur

### 2. Database Persistence
- Custom section names are saved to database
- Loaded when editing existing quotations
- Maintained across quotation lifecycle

### 3. PDF Integration
- Custom section names appear in generated PDF
- Section headers use custom names instead of defaults
- Maintains proper formatting and layout

### 4. User Experience
- Visual edit indicators (pencil icon)
- Smooth editing transitions
- Read-only mode support
- Consistent styling with existing UI

## Default Section Names
- Cabinet: "General"
- Worktop: "Worktop"
- Accessories: "Accessories"
- Appliances: "Appliances"
- Wardrobes: "Wardrobes"
- TV Unit: "TV Unit"

## Usage Instructions

### Creating New Quotation
1. Open quotation modal
2. Click on any section header (e.g., "General", "Worktop")
3. Type new name and press Enter or click ✓
4. Save quotation - custom names will be stored

### Editing Existing Quotation
1. Open quotation in edit mode
2. Custom section names will be loaded from database
3. Click on section headers to modify names
4. Save changes - updated names will be stored

### PDF Generation
1. Generate PDF from quotation
2. Custom section names will appear in PDF headers
3. Section totals will display with proper comma formatting

## Technical Notes

### Database Schema
- Uses JSONB column for flexible section name storage
- Default values ensure backward compatibility
- Indexed for efficient querying

### State Management
- Local state for immediate UI updates
- Database persistence for long-term storage
- Proper loading/saving lifecycle

### PDF Generation
- Custom names integrated into PDF template
- Maintains existing formatting and layout
- Section totals properly formatted with currency

## Future Enhancements
- Section name templates for quick selection
- Bulk section name editing
- Section name validation rules
- Export/import section name configurations 