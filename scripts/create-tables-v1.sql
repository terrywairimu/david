-- Create registered_entities table (clients and suppliers)
CREATE TABLE registered_entities (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'supplier')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    pin VARCHAR(50),
    location VARCHAR(255),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_items table
CREATE TABLE stock_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotations table
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    notes TEXT
);

-- Create quotation_items table
CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Create sales_orders table
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    quotation_id INTEGER REFERENCES quotations(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    notes TEXT
);

-- Create sales_order_items table
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Create invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    sales_order_id INTEGER REFERENCES sales_orders(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    notes TEXT
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Create cash_sales table
CREATE TABLE cash_sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    sales_order_id INTEGER REFERENCES sales_orders(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile')),
    notes TEXT
);

-- Create cash_sale_items table
CREATE TABLE cash_sale_items (
    id SERIAL PRIMARY KEY,
    cash_sale_id INTEGER REFERENCES cash_sales(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile', 'bank_transfer')),
    date_paid TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create purchases table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES registered_entities(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    notes TEXT
);

-- Create purchase_items table
CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Create stock_movements table
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    stock_item_id INTEGER REFERENCES stock_items(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20) CHECK (reference_type IN ('purchase', 'sale', 'adjustment')),
    reference_id INTEGER,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    expense_type VARCHAR(20) DEFAULT 'company' CHECK (expense_type IN ('company', 'client')),
    client_id INTEGER REFERENCES registered_entities(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_number VARCHAR(100),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_registered_entities_type ON registered_entities(type);
CREATE INDEX idx_quotations_client_id ON quotations(client_id);
CREATE INDEX idx_sales_orders_client_id ON sales_orders(client_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_stock_movements_stock_item_id ON stock_movements(stock_item_id);
CREATE INDEX idx_expenses_client_id ON expenses(client_id);
