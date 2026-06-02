-- Add delivery_address column to customers table
ALTER TABLE customers ADD COLUMN delivery_address VARCHAR(500) NULL AFTER name;

-- PetPooja orders table to cache fetched order data
CREATE TABLE petpooja_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    petpooja_order_id VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) NULL,
    delivery_address VARCHAR(500) NULL,
    order_status VARCHAR(50) NULL,
    order_type VARCHAR(50) NULL,
    items_json TEXT NULL,
    total_amount DECIMAL(12, 2) NULL,
    discount_amount DECIMAL(12, 2) NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) NULL DEFAULT 0,
    delivery_charge DECIMAL(12, 2) NULL DEFAULT 0,
    payment_mode VARCHAR(50) NULL,
    order_placed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_petpooja_order_id (petpooja_order_id),
    INDEX idx_petpooja_orders_phone (customer_phone),
    INDEX idx_petpooja_orders_placed_at (order_placed_at),
    INDEX idx_petpooja_orders_status (order_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
