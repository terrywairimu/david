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
    valid_until DATE,
    cabinet_total DECIMAL(10,2) DEFAULT 0,
    worktop_total DECIMAL(10,2) DEFAULT 0,
    accessories_total DECIMAL(10,2) DEFAULT 0,
    labour_percentage DECIMAL(5,2) DEFAULT 0,
    labour_total DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    include_accessories BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'converted_to_sales_order', 'converted_to_cash_sale')),
    notes TEXT,
    terms_conditions TEXT
);

-- Create quotation_items table with categories
CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create sales_orders table
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    quotation_id INTEGER REFERENCES quotations(id),
    original_quotation_number VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cabinet_total DECIMAL(10,2) DEFAULT 0,
    worktop_total DECIMAL(10,2) DEFAULT 0,
    accessories_total DECIMAL(10,2) DEFAULT 0,
    labour_percentage DECIMAL(5,2) DEFAULT 0,
    labour_total DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    include_accessories BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'converted_to_invoice', 'converted_to_cash_sale')),
    notes TEXT,
    terms_conditions TEXT
);

-- Create sales_order_items table
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    sales_order_id INTEGER REFERENCES sales_orders(id),
    original_quotation_number VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    cabinet_total DECIMAL(10,2) DEFAULT 0,
    worktop_total DECIMAL(10,2) DEFAULT 0,
    accessories_total DECIMAL(10,2) DEFAULT 0,
    labour_percentage DECIMAL(5,2) DEFAULT 0,
    labour_total DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    include_accessories BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    terms_conditions TEXT
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create cash_sales table
CREATE TABLE cash_sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    sales_order_id INTEGER REFERENCES sales_orders(id),
    original_quotation_number VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cabinet_total DECIMAL(10,2) DEFAULT 0,
    worktop_total DECIMAL(10,2) DEFAULT 0,
    accessories_total DECIMAL(10,2) DEFAULT 0,
    labour_percentage DECIMAL(5,2) DEFAULT 0,
    labour_total DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    include_accessories BOOLEAN DEFAULT false,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
    notes TEXT,
    terms_conditions TEXT
);

-- Create cash_sale_items table
CREATE TABLE cash_sale_items (
    id SERIAL PRIMARY KEY,
    cash_sale_id INTEGER REFERENCES cash_sales(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('cabinet', 'worktop', 'accessories')),
    description TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_item_id INTEGER REFERENCES stock_items(id)
);

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES registered_entities(id),
    quotation_number VARCHAR(50),
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile', 'bank_transfer')),
    account_paid_to VARCHAR(100),
    date_paid TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded'))
);

-- Create purchases table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES registered_entities(id),
    quotation_id INTEGER REFERENCES quotations(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'paid', 'cancelled')),
    notes TEXT
);

-- Create purchase_items table
CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Create expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER REFERENCES quotations(id),
    supplier_id INTEGER REFERENCES registered_entities(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile', 'bank_transfer')),
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'approved', 'rejected'))
);

-- Create indexes for better performance
CREATE INDEX idx_quotations_client_id ON quotations(client_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_date_created ON quotations(date_created);
CREATE INDEX idx_sales_orders_client_id ON sales_orders(client_id);
CREATE INDEX idx_sales_orders_quotation_id ON sales_orders(quotation_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_sales_order_id ON invoices(sales_order_id);
CREATE INDEX idx_cash_sales_client_id ON cash_sales(client_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_quotation_number ON payments(quotation_number);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_expenses_quotation_id ON expenses(quotation_id);
