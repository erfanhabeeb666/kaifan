package com.kaifan.callqueue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "call_center_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallCenterOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true, length = 100)
    private String orderId;

    @Column(name = "petpooja_order_id", length = 100)
    private String petpoojaOrderId;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Builder.Default
    @Column(name = "order_type", nullable = false, length = 10)
    private String orderType = "H";

    @Builder.Default
    @Column(name = "payment_type", nullable = false, length = 20)
    private String paymentType = "COD";

    @Builder.Default
    @Column(name = "order_status", nullable = false, length = 50)
    private String orderStatus = "PENDING";

    @Builder.Default
    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "packing_charges", precision = 12, scale = 2)
    private BigDecimal packingCharges = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "delivery_charges", precision = 12, scale = 2)
    private BigDecimal deliveryCharges = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "preorder_date", length = 20)
    private String preorderDate;

    @Column(name = "preorder_time", length = 20)
    private String preorderTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "petpooja_response_json", columnDefinition = "TEXT")
    private String petpoojaResponseJson;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CallCenterOrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addItem(CallCenterOrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
