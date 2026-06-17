package com.kaifan.callqueue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "petpooja_item_id", nullable = false, unique = true, length = 50)
    private String petpoojaItemId;

    @Column(name = "item_name", nullable = false, length = 300)
    private String itemName;

    @Column(name = "item_description", columnDefinition = "TEXT")
    private String itemDescription;

    @Builder.Default
    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "category_id", length = 50)
    private String categoryId;

    @Builder.Default
    @Column(name = "item_tax", precision = 8, scale = 2)
    private BigDecimal itemTax = BigDecimal.ZERO;

    @Column(name = "tax_type")
    private Integer taxType;

    @Builder.Default
    @Column(name = "item_type", length = 20)
    private String itemType = "veg";

    @Column(name = "item_order_type", length = 50)
    private String itemOrderType;

    @Builder.Default
    @Column(name = "in_stock")
    private Boolean inStock = true;

    @Builder.Default
    @Column(name = "active")
    private Boolean active = true;

    @Column(name = "variation_group_name", length = 200)
    private String variationGroupName;

    @Column(name = "item_image_url", length = 1000)
    private String itemImageUrl;

    @Column(name = "item_allow_addon")
    private Integer itemAllowAddon;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
