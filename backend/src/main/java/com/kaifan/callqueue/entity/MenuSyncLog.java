package com.kaifan.callqueue.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "menu_sync_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuSyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sync_type", nullable = false, length = 20)
    private String syncType;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "SUCCESS";

    @Column(name = "categories_count")
    private Integer categoriesCount;

    @Column(name = "items_count")
    private Integer itemsCount;

    @Column(name = "variations_count")
    private Integer variationsCount;

    @Column(name = "addons_count")
    private Integer addonsCount;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
