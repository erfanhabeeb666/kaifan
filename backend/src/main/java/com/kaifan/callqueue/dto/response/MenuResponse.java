package com.kaifan.callqueue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuResponse {

    private List<CategoryDto> categories;
    private List<MenuItemDto> items;
    private List<VariationDto> variations;
    private List<AddonGroupDto> addonGroups;
    private List<AddonItemDto> addonItems;
    private List<ItemAddonMappingDto> itemAddonMappings;
    private LocalDateTime lastSyncedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDto {
        private Long id;
        private String categoryId;
        private String categoryName;
        private int rank;
        private String parentCategoryId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuItemDto {
        private Long id;
        private String itemId;
        private String itemName;
        private String itemDescription;
        private BigDecimal price;
        private String categoryId;
        private BigDecimal itemTax;
        private int taxType;
        private String itemType;  // veg, non-veg, egg
        private boolean inStock;
        private String variationGroupName;
        private String itemImageUrl;
        private int itemAllowAddon;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariationDto {
        private Long id;
        private String variationId;
        private String variationName;
        private String variationGroupName;
        private String itemId;
        private BigDecimal price;
        private boolean inStock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddonGroupDto {
        private Long id;
        private String addonGroupId;
        private String addonGroupName;
        private int rank;
        private int minQuantity;
        private int maxQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddonItemDto {
        private Long id;
        private String addonItemId;
        private String addonItemName;
        private String addonGroupId;
        private BigDecimal price;
        private boolean inStock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemAddonMappingDto {
        private String itemId;
        private String addonGroupId;
    }
}
