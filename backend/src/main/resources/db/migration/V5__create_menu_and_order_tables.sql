-- ============================================
-- V5: Menu tables + Call Center Orders
-- ============================================

-- Menu Categories
CREATE TABLE menu_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    petpooja_category_id VARCHAR(50) NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    category_rank INT DEFAULT 0,
    parent_category_id VARCHAR(50) NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pp_category_id (petpooja_category_id),
    INDEX idx_category_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Items
CREATE TABLE menu_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    petpooja_item_id VARCHAR(50) NOT NULL,
    item_name VARCHAR(300) NOT NULL,
    item_description TEXT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    category_id VARCHAR(50) NULL,
    item_tax DECIMAL(8,2) DEFAULT 0,
    tax_type TINYINT DEFAULT 0,
    item_type VARCHAR(20) DEFAULT 'veg',
    item_order_type VARCHAR(50) NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    variation_group_name VARCHAR(200) NULL,
    item_image_url VARCHAR(1000) NULL,
    item_allow_addon TINYINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pp_item_id (petpooja_item_id),
    INDEX idx_item_category (category_id),
    INDEX idx_item_active (active, in_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Variations
CREATE TABLE menu_variations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    petpooja_variation_id VARCHAR(50) NOT NULL,
    variation_name VARCHAR(200) NOT NULL,
    variation_group_name VARCHAR(200) NULL,
    item_id VARCHAR(50) NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pp_variation_id (petpooja_variation_id),
    INDEX idx_variation_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addon Groups
CREATE TABLE addon_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    petpooja_addon_group_id VARCHAR(50) NOT NULL,
    addon_group_name VARCHAR(200) NOT NULL,
    addon_group_rank INT DEFAULT 0,
    min_quantity INT DEFAULT 0,
    max_quantity INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pp_addon_group_id (petpooja_addon_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addon Items
CREATE TABLE addon_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    petpooja_addon_item_id VARCHAR(50) NOT NULL,
    addon_item_name VARCHAR(200) NOT NULL,
    addon_group_id VARCHAR(50) NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pp_addon_item_id (petpooja_addon_item_id),
    INDEX idx_addon_item_group (addon_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item to Addon Group mapping
CREATE TABLE item_addon_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL,
    addon_group_id VARCHAR(50) NOT NULL,
    INDEX idx_iag_item (item_id),
    INDEX idx_iag_group (addon_group_id),
    UNIQUE KEY uk_item_addon (item_id, addon_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call Center Orders (created from this system)
CREATE TABLE call_center_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL COMMENT 'CALL-{timestamp} format',
    petpooja_order_id VARCHAR(100) NULL COMMENT 'Returned by Petpooja after save',
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) NULL,
    delivery_address VARCHAR(500) NULL,
    order_type VARCHAR(10) NOT NULL DEFAULT 'H' COMMENT 'H=Home Delivery, P=Parcel, D=Dine In',
    payment_type VARCHAR(20) NOT NULL DEFAULT 'COD',
    order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    packing_charges DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_charges DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    preorder_date VARCHAR(20) NULL,
    preorder_time VARCHAR(20) NULL,
    notes TEXT NULL,
    created_by VARCHAR(100) NULL,
    petpooja_response_json TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_order_id (order_id),
    INDEX idx_cco_phone (customer_phone),
    INDEX idx_cco_status (order_status),
    INDEX idx_cco_petpooja (petpooja_order_id),
    INDEX idx_cco_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call Center Order Items
CREATE TABLE call_center_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    petpooja_item_id VARCHAR(50) NOT NULL,
    item_name VARCHAR(300) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    final_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    variation_id VARCHAR(50) NULL,
    variation_name VARCHAR(200) NULL,
    variation_price DECIMAL(12,2) DEFAULT 0,
    addons_json TEXT NULL COMMENT 'JSON array of {addonId, addonName, price}',
    tax_amount DECIMAL(12,2) DEFAULT 0,
    item_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ccoi_order FOREIGN KEY (order_id) REFERENCES call_center_orders(id) ON DELETE CASCADE,
    INDEX idx_ccoi_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu sync tracking
CREATE TABLE menu_sync_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sync_type VARCHAR(20) NOT NULL COMMENT 'SCHEDULED or MANUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    categories_count INT DEFAULT 0,
    items_count INT DEFAULT 0,
    variations_count INT DEFAULT 0,
    addons_count INT DEFAULT 0,
    error_message TEXT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
