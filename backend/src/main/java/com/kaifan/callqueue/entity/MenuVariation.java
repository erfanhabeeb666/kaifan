package com.kaifan.callqueue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_variations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuVariation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "petpooja_variation_id", nullable = false, unique = true, length = 50)
    private String petpoojaVariationId;

    @Column(name = "variation_name", nullable = false, length = 200)
    private String variationName;

    @Column(name = "variation_group_name", length = 200)
    private String variationGroupName;

    @Column(name = "item_id", nullable = false, length = 50)
    private String itemId;

    @Builder.Default
    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "in_stock")
    private Boolean inStock = true;

    @Builder.Default
    @Column(name = "active")
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
