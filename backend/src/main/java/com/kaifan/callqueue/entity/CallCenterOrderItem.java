package com.kaifan.callqueue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_center_order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallCenterOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private CallCenterOrder order;

    @Column(name = "petpooja_item_id", nullable = false, length = 50)
    private String petpoojaItemId;

    @Column(name = "item_name", nullable = false, length = 300)
    private String itemName;

    @Builder.Default
    @Column(name = "quantity")
    private Integer quantity = 1;

    @Builder.Default
    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "final_price", precision = 12, scale = 2)
    private BigDecimal finalPrice = BigDecimal.ZERO;

    @Column(name = "variation_id", length = 50)
    private String variationId;

    @Column(name = "variation_name", length = 200)
    private String variationName;

    @Builder.Default
    @Column(name = "variation_price", precision = 12, scale = 2)
    private BigDecimal variationPrice = BigDecimal.ZERO;

    @Column(name = "addons_json", columnDefinition = "TEXT")
    private String addonsJson;

    @Builder.Default
    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "item_notes", columnDefinition = "TEXT")
    private String itemNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
