-- Client Management System Database Schema
-- Version 1.0

-- Create registered entities table (for both clients and suppliers)
CREATE TABLE IF NOT EXISTS registered_entities (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'supplier')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    pin VARCHAR(50),
    location VARCHAR(500),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    email VARCHAR(255),
    address TEXT,
    company VARCHAR(255),
    contact_person VARCHAR(255),
    notes TEXT,
    last_transaction TIMESTAMP
);

-- Create stock items table
CREATE TABLE IF NOT EXISTS stock_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 1000,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    supplier_id INTEGER REFERENCES registered_entities(id),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES registered_entities(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cabinet_total DECIMAL(10,2) DEFAULT 0.00,
    worktop_total DECIMAL(10,2) DEFAULT 0.00,
    accessories_total DECIMAL(10,2) DEFAULT 0.00,
    labour_percentage DECIMAL(5,2) DEFAULT 0.00,
    labour_total DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    include_accessories BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'converted_to_order')),
    notes TEXT,
    terms_conditions TEXT,
    valid_until TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create sales orders table
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES registered_entities(id),
    quotation_id INTEGER REFERENCES quotations(id),
    original_quotation_number VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP,
    cabinet_total DECIMAL(10,2) DEFAULT 0.00,
    worktop_total DECIMAL(10,2) DEFAULT 0.00,
    accessories_total DECIMAL(10,2) DEFAULT 0.00,
    labour_percentage DECIMAL(5,2) DEFAULT 0.00,
    labour_total DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    include_accessories BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'delivered', 'converted_to_invoice')),
    notes TEXT,
    delivery_address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales order items table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES registered_entities(id),
    sales_order_id INTEGER REFERENCES sales_orders(id),
    quotation_id INTEGER REFERENCES quotations(id),
    original_quotation_number VARCHAR(50),
    original_order_number VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    cabinet_total DECIMAL(10,2) DEFAULT 0.00,
    worktop_total DECIMAL(10,2) DEFAULT 0.00,
    accessories_total DECIMAL(10,2) DEFAULT 0.00,
    labour_percentage DECIMAL(5,2) DEFAULT 0.00,
    labour_total DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    include_accessories BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partially_paid', 'converted_to_cash_sale')),
    notes TEXT,
    terms_conditions TEXT,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create cash sales table
CREATE TABLE IF NOT EXISTS cash_sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    invoice_id INTEGER REFERENCES invoices(id),
    sales_order_id INTEGER REFERENCES sales_orders(id),
    quotation_id INTEGER REFERENCES quotations(id),
    original_quotation_number VARCHAR(50),
    original_order_number VARCHAR(50),
    original_invoice_number VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    cabinet_total DECIMAL(10,2) DEFAULT 0.00,
    worktop_total DECIMAL(10,2) DEFAULT 0.00,
    accessories_total DECIMAL(10,2) DEFAULT 0.00,
    labour_percentage DECIMAL(5,2) DEFAULT 0.00,
    labour_total DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    include_accessories BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    notes TEXT,
    terms_conditions TEXT,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cash sale items table
CREATE TABLE IF NOT EXISTS cash_sale_items (
    id SERIAL PRIMARY KEY,
    cash_sale_id INTEGER NOT NULL REFERENCES cash_sales(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_order_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_date DATE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES registered_entities(id),
    payment_method VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    notes TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES registered_entities(id),
    quotation_number VARCHAR(50),
    invoice_number VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    account_paid_to VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'company')),
    client_id INTEGER REFERENCES registered_entities(id),
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    account_paid_from VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock movements table for tracking stock changes
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    stock_item_id INTEGER NOT NULL REFERENCES stock_items(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20) CHECK (reference_type IN ('purchase', 'sale', 'quotation', 'invoice', 'adjustment')),
    reference_id INTEGER,
    notes TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registered_entities_type ON registered_entities(type);
CREATE INDEX IF NOT EXISTS idx_registered_entities_name ON registered_entities(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_name ON stock_items(name);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_client ON sales_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_cash_sales_client ON cash_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_cash_sales_number ON cash_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_number ON purchases(purchase_order_number);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_number ON payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_expenses_client ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_number ON expenses(expense_number);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(stock_item_id);

-- Create function to update stock levels
CREATE OR REPLACE FUNCTION update_stock_level(
    stock_item_id INTEGER,
    quantity_change INTEGER,
    operation VARCHAR(20) -- 'increase' or 'decrease'
) RETURNS VOID AS $$
BEGIN
    IF operation = 'increase' THEN
        UPDATE stock_items 
        SET current_stock = current_stock + quantity_change,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = stock_item_id;
    ELSIF operation = 'decrease' THEN
        UPDATE stock_items 
        SET current_stock = current_stock - quantity_change,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = stock_item_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for last_modified updates
CREATE TRIGGER update_quotations_last_modified
    BEFORE UPDATE ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_sales_orders_last_modified
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_invoices_last_modified
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_cash_sales_last_modified
    BEFORE UPDATE ON cash_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_purchases_last_modified
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_expenses_last_modified
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_stock_items_last_modified
    BEFORE UPDATE ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();
