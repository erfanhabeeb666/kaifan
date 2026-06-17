package com.kaifan.callqueue.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "item_addon_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemAddonGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false, length = 50)
    private String itemId;

    @Column(name = "addon_group_id", nullable = false, length = 50)
    private String addonGroupId;
}
