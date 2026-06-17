package com.kaifan.callqueue.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.kaifan.callqueue.config.PetpoojaConfig;
import com.kaifan.callqueue.dto.response.MenuResponse;
import com.kaifan.callqueue.entity.*;
import com.kaifan.callqueue.repository.*;
import com.kaifan.callqueue.service.PetpoojaApiClient;
import com.kaifan.callqueue.service.PetpoojaMenuSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PetpoojaMenuSyncServiceImpl implements PetpoojaMenuSyncService {

    private final PetpoojaApiClient apiClient;
    private final PetpoojaConfig petpoojaConfig;

    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final MenuVariationRepository variationRepository;
    private final AddonGroupRepository addonGroupRepository;
    private final AddonItemRepository addonItemRepository;
    private final ItemAddonGroupRepository itemAddonGroupRepository;
    private final MenuSyncLogRepository syncLogRepository;

    @Scheduled(fixedDelayString = "${app.petpooja.menu-sync-interval-ms:1800000}", initialDelay = 10000)
    public void syncScheduled() {
        log.info("Starting scheduled Petpooja menu sync...");
        syncMenu("SCHEDULED");
    }

    @Override
    @Transactional
    public void syncMenu(String syncType) {
        LocalDateTime startedAt = LocalDateTime.now();
        MenuSyncLog syncLog = MenuSyncLog.builder()
                .syncType(syncType)
                .status("RUNNING")
                .startedAt(startedAt)
                .build();
        syncLog = syncLogRepository.save(syncLog);

        try {
            if (!petpoojaConfig.isEnabled()) {
                log.info("Petpooja is disabled. Populating local DB with mock menu data.");
                populateMockMenu();
                
                syncLog.setStatus("SUCCESS");
                syncLog.setCategoriesCount(4);
                syncLog.setItemsCount(12);
                syncLog.setVariationsCount(8);
                syncLog.setAddonsCount(5);
                syncLog.setCompletedAt(LocalDateTime.now());
                syncLogRepository.save(syncLog);
                return;
            }

            // Call WebClient to fetch menu
            JsonNode menuNode = apiClient.fetchMenu().block();
            if (menuNode == null || !menuNode.has("success") || !menuNode.get("success").asText().equals("1")) {
                String errorMsg = menuNode != null ? menuNode.path("message").asText() : "No response from Petpooja API";
                throw new RuntimeException("Petpooja API error: " + errorMsg);
            }

            JsonNode dataNode = menuNode.path("data");
            
            // Clear existing tables
            clearMenuTables();

            int categoriesCount = saveCategories(dataNode.path("categories"));
            int itemsCount = saveItems(dataNode.path("items"));
            int variationsCount = saveVariations(dataNode.path("variations"));
            int addonGroupsCount = saveAddonGroups(dataNode.path("addon_groups"));
            int addonItemsCount = saveAddonItems(dataNode.path("addon_items"));
            saveItemAddonMappings(dataNode.path("items"));

            syncLog.setStatus("SUCCESS");
            syncLog.setCategoriesCount(categoriesCount);
            syncLog.setItemsCount(itemsCount);
            syncLog.setVariationsCount(variationsCount);
            syncLog.setAddonsCount(addonGroupsCount + addonItemsCount);
            syncLog.setCompletedAt(LocalDateTime.now());
            syncLogRepository.save(syncLog);

            log.info("Menu sync completed successfully. Categories: {}, Items: {}, Variations: {}, Addons: {}",
                    categoriesCount, itemsCount, variationsCount, addonGroupsCount + addonItemsCount);

        } catch (Exception e) {
            log.error("Failed to sync Petpooja menu: {}", e.getMessage(), e);
            syncLog.setStatus("FAILED");
            syncLog.setErrorMessage(e.getMessage());
            syncLog.setCompletedAt(LocalDateTime.now());
            syncLogRepository.save(syncLog);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MenuResponse getMenu() {
        List<MenuCategory> categories = categoryRepository.findByActiveTrueOrderByCategoryRankAsc();
        List<MenuItem> items = itemRepository.findByActiveTrueAndInStockTrueOrderByItemNameAsc();
        List<MenuVariation> variations = variationRepository.findAll();
        List<AddonGroup> addonGroups = addonGroupRepository.findByActiveTrueOrderByAddonGroupRankAsc();
        List<AddonItem> addonItems = addonItemRepository.findAll();
        List<ItemAddonGroup> mappings = itemAddonGroupRepository.findAll();
        
        Optional<MenuSyncLog> latestSync = syncLogRepository.findTopByStatusOrderByCompletedAtDesc("SUCCESS");
        LocalDateTime lastSyncedAt = latestSync.map(MenuSyncLog::getCompletedAt).orElse(null);

        return MenuResponse.builder()
                .categories(categories.stream().map(c -> MenuResponse.CategoryDto.builder()
                        .id(c.getId())
                        .categoryId(c.getPetpoojaCategoryId())
                        .categoryName(c.getCategoryName())
                        .rank(c.getCategoryRank() != null ? c.getCategoryRank() : 0)
                        .parentCategoryId(c.getParentCategoryId())
                        .build()).toList())
                .items(items.stream().map(i -> MenuResponse.MenuItemDto.builder()
                        .id(i.getId())
                        .itemId(i.getPetpoojaItemId())
                        .itemName(i.getItemName())
                        .itemDescription(i.getItemDescription())
                        .price(i.getPrice())
                        .categoryId(i.getCategoryId())
                        .itemTax(i.getItemTax())
                        .taxType(i.getTaxType() != null ? i.getTaxType() : 0)
                        .itemType(i.getItemType())
                        .inStock(i.getInStock())
                        .variationGroupName(i.getVariationGroupName())
                        .itemImageUrl(i.getItemImageUrl())
                        .itemAllowAddon(i.getItemAllowAddon() != null ? i.getItemAllowAddon() : 0)
                        .build()).toList())
                .variations(variations.stream().map(v -> MenuResponse.VariationDto.builder()
                        .id(v.getId())
                        .variationId(v.getPetpoojaVariationId())
                        .variationName(v.getVariationName())
                        .variationGroupName(v.getVariationGroupName())
                        .itemId(v.getItemId())
                        .price(v.getPrice())
                        .inStock(v.getInStock())
                        .build()).toList())
                .addonGroups(addonGroups.stream().map(ag -> MenuResponse.AddonGroupDto.builder()
                        .id(ag.getId())
                        .addonGroupId(ag.getPetpoojaAddonGroupId())
                        .addonGroupName(ag.getAddonGroupName())
                        .rank(ag.getAddonGroupRank() != null ? ag.getAddonGroupRank() : 0)
                        .minQuantity(ag.getMinQuantity() != null ? ag.getMinQuantity() : 0)
                        .maxQuantity(ag.getMaxQuantity() != null ? ag.getMaxQuantity() : 0)
                        .build()).toList())
                .addonItems(addonItems.stream().map(ai -> MenuResponse.AddonItemDto.builder()
                        .id(ai.getId())
                        .addonItemId(ai.getPetpoojaAddonItemId())
                        .addonItemName(ai.getAddonItemName())
                        .addonGroupId(ai.getAddonGroupId())
                        .price(ai.getPrice())
                        .inStock(ai.getInStock())
                        .build()).toList())
                .itemAddonMappings(mappings.stream().map(m -> MenuResponse.ItemAddonMappingDto.builder()
                        .itemId(m.getItemId())
                        .addonGroupId(m.getAddonGroupId())
                        .build()).toList())
                .lastSyncedAt(lastSyncedAt)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItem> searchMenuItems(String query) {
        if (query == null || query.isBlank()) {
            return itemRepository.findByActiveTrueAndInStockTrueOrderByItemNameAsc();
        }
        return itemRepository.searchByName(query);
    }

    private void clearMenuTables() {
        itemAddonGroupRepository.deleteAllInBatch();
        addonItemRepository.deleteAllInBatch();
        addonGroupRepository.deleteAllInBatch();
        variationRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
    }

    private int saveCategories(JsonNode categoriesNode) {
        if (categoriesNode.isMissingNode() || !categoriesNode.isArray()) return 0;
        int count = 0;
        for (JsonNode node : categoriesNode) {
            MenuCategory category = MenuCategory.builder()
                    .petpoojaCategoryId(node.path("categoryid").asText())
                    .categoryName(node.path("categoryname").asText())
                    .categoryRank(node.path("rank").asInt(0))
                    .parentCategoryId(node.path("parent_category_id").asText("0"))
                    .active(node.path("active").asText("1").equals("1"))
                    .build();
            categoryRepository.save(category);
            count++;
        }
        return count;
    }

    private int saveItems(JsonNode itemsNode) {
        if (itemsNode.isMissingNode() || !itemsNode.isArray()) return 0;
        int count = 0;
        for (JsonNode node : itemsNode) {
            MenuItem item = MenuItem.builder()
                    .petpoojaItemId(node.path("itemid").asText())
                    .itemName(node.path("itemname").asText())
                    .itemDescription(node.path("itemdescription").asText(null))
                    .price(new BigDecimal(node.path("price").asText("0.00")))
                    .categoryId(node.path("categoryid").asText(null))
                    .itemTax(new BigDecimal(node.path("tax").asText("0.00")))
                    .taxType(node.path("tax_type").asInt(0))
                    .itemType(node.path("item_type").asText("veg"))
                    .itemOrderType(node.path("item_order_type").asText(null))
                    .inStock(node.path("in_stock").asText("1").equals("1"))
                    .active(node.path("active").asText("1").equals("1"))
                    .variationGroupName(node.path("variation_group_name").asText(null))
                    .itemImageUrl(node.path("item_image_url").asText(null))
                    .itemAllowAddon(node.path("item_allow_addon").asInt(0))
                    .build();
            itemRepository.save(item);
            count++;
        }
        return count;
    }

    private int saveVariations(JsonNode variationsNode) {
        if (variationsNode.isMissingNode() || !variationsNode.isArray()) return 0;
        int count = 0;
        for (JsonNode node : variationsNode) {
            MenuVariation variation = MenuVariation.builder()
                    .petpoojaVariationId(node.path("variationid").asText())
                    .variationName(node.path("variationname").asText())
                    .variationGroupName(node.path("variation_group_name").asText(null))
                    .itemId(node.path("itemid").asText())
                    .price(new BigDecimal(node.path("price").asText("0.00")))
                    .inStock(node.path("in_stock").asText("1").equals("1"))
                    .active(node.path("active").asText("1").equals("1"))
                    .build();
            variationRepository.save(variation);
            count++;
        }
        return count;
    }

    private int saveAddonGroups(JsonNode groupsNode) {
        if (groupsNode.isMissingNode() || !groupsNode.isArray()) return 0;
        int count = 0;
        for (JsonNode node : groupsNode) {
            AddonGroup group = AddonGroup.builder()
                    .petpoojaAddonGroupId(node.path("addon_group_id").asText())
                    .addonGroupName(node.path("addon_group_name").asText())
                    .addonGroupRank(node.path("rank").asInt(0))
                    .minQuantity(node.path("min_quantity").asInt(0))
                    .maxQuantity(node.path("max_quantity").asInt(0))
                    .active(node.path("active").asText("1").equals("1"))
                    .build();
            addonGroupRepository.save(group);
            count++;
        }
        return count;
    }

    private int saveAddonItems(JsonNode itemsNode) {
        if (itemsNode.isMissingNode() || !itemsNode.isArray()) return 0;
        int count = 0;
        for (JsonNode node : itemsNode) {
            AddonItem item = AddonItem.builder()
                    .petpoojaAddonItemId(node.path("addon_item_id").asText())
                    .addonItemName(node.path("addon_item_name").asText())
                    .addonGroupId(node.path("addon_group_id").asText())
                    .price(new BigDecimal(node.path("price").asText("0.00")))
                    .inStock(node.path("in_stock").asText("1").equals("1"))
                    .active(node.path("active").asText("1").equals("1"))
                    .build();
            addonItemRepository.save(item);
            count++;
        }
        return count;
    }

    private void saveItemAddonMappings(JsonNode itemsNode) {
        if (itemsNode.isMissingNode() || !itemsNode.isArray()) return;
        for (JsonNode itemNode : itemsNode) {
            String itemId = itemNode.path("itemid").asText();
            JsonNode addonsNode = itemNode.path("addon");
            if (addonsNode.isArray()) {
                for (JsonNode addonNode : addonsNode) {
                    String addonGroupId = addonNode.path("addon_group_id").asText();
                    if (!addonGroupId.isBlank()) {
                        ItemAddonGroup mapping = ItemAddonGroup.builder()
                                .itemId(itemId)
                                .addonGroupId(addonGroupId)
                                .build();
                        itemAddonGroupRepository.save(mapping);
                    }
                }
            }
        }
    }

    private void populateMockMenu() {
        clearMenuTables();

        // 1. Categories
        String[][] categories = {
                {"CAT1", "Biryani & Mandhi", "1"},
                {"CAT2", "Alfahm & Kebsa", "2"},
                {"CAT3", "Appetizers & Soups", "3"},
                {"CAT4", "Beverages & Desserts", "4"}
        };
        for (String[] cat : categories) {
            categoryRepository.save(MenuCategory.builder()
                    .petpoojaCategoryId(cat[0])
                    .categoryName(cat[1])
                    .categoryRank(Integer.parseInt(cat[2]))
                    .active(true)
                    .build());
        }

        // 2. Items
        Object[][] items = {
                {"ITM101", "Chicken Mandhi", "Traditional Yemen Mandhi with tender chicken and aromatic basmati rice.", "250.00", "CAT1", "12.50", "Portion", 1},
                {"ITM102", "Mutton Mandhi", "Slow cooked mutton served on a bed of seasoned basmati rice.", "350.00", "CAT1", "17.50", "Portion", 1},
                {"ITM201", "Chicken Alfahm", "Charcoal grilled Arabian alfahm chicken seasoned with special spices.", "220.00", "CAT2", "11.00", "Portion", 1},
                {"ITM202", "Chicken Kabsa", "Spiced rice dish with chicken, raisins, and almonds.", "260.00", "CAT2", "13.00", "Portion", 0},
                {"ITM301", "Hummus with Pita", "Creamy hummus served with freshly baked warm pita bread.", "90.00", "CAT3", "4.50", null, 0},
                {"ITM302", "Mandhi Soup", "Fragrant clear soup cooked with chicken bones and mandhi spices.", "50.00", "CAT3", "2.50", null, 0},
                {"ITM401", "Mint Lime Juice", "Refreshing lime juice with crushed fresh mint leaves.", "60.00", "CAT4", "3.00", null, 0},
                {"ITM402", "Kunafa", "Warm cheese pastry soaked in sweet sugar syrup.", "180.00", "CAT4", "9.00", null, 0}
        };

        for (Object[] itm : items) {
            itemRepository.save(MenuItem.builder()
                    .petpoojaItemId((String) itm[0])
                    .itemName((String) itm[1])
                    .itemDescription((String) itm[2])
                    .price(new BigDecimal((String) itm[3]))
                    .categoryId((String) itm[4])
                    .itemTax(new BigDecimal((String) itm[5]))
                    .taxType(1)
                    .itemType("non-veg")
                    .inStock(true)
                    .active(true)
                    .variationGroupName((String) itm[6])
                    .itemAllowAddon((Integer) itm[7])
                    .build());
        }

        // 3. Variations (for portion items)
        Object[][] variations = {
                {"VAR101H", "Half", "Portion", "ITM101", "250.00"},
                {"VAR101F", "Full", "Portion", "ITM101", "480.00"},
                {"VAR102H", "Half", "Portion", "ITM102", "350.00"},
                {"VAR102F", "Full", "Portion", "ITM102", "680.00"},
                {"VAR201Q", "Quarter", "Portion", "ITM201", "120.00"},
                {"VAR201H", "Half", "Portion", "ITM201", "220.00"},
                {"VAR201F", "Full", "Portion", "ITM201", "420.00"}
        };
        for (Object[] var : variations) {
            variationRepository.save(MenuVariation.builder()
                    .petpoojaVariationId((String) var[0])
                    .variationName((String) var[1])
                    .variationGroupName((String) var[2])
                    .itemId((String) var[3])
                    .price(new BigDecimal((String) var[4]))
                    .active(true)
                    .inStock(true)
                    .build());
        }

        // 4. Addon Groups
        Object[][] groups = {
                {"AG1", "Sauces & Extras", 1, 0, 3},
                {"AG2", "Rice portion", 2, 0, 1}
        };
        for (Object[] gp : groups) {
            addonGroupRepository.save(AddonGroup.builder()
                    .petpoojaAddonGroupId((String) gp[0])
                    .addonGroupName((String) gp[1])
                    .addonGroupRank((Integer) gp[2])
                    .minQuantity((Integer) gp[3])
                    .maxQuantity((Integer) gp[4])
                    .active(true)
                    .build());
        }

        // 5. Addon Items
        Object[][] addonItems = {
                {"AI101", "Extra Garlic Sauce", "AG1", "15.00"},
                {"AI102", "Extra Salad", "AG1", "20.00"},
                {"AI103", "Extra Spicy Chutney", "AG1", "10.00"},
                {"AI201", "Extra Mandhi Rice", "AG2", "80.00"},
                {"AI202", "Extra Kabsa Rice", "AG2", "90.00"}
        };
        for (Object[] ai : addonItems) {
            addonItemRepository.save(AddonItem.builder()
                    .petpoojaAddonItemId((String) ai[0])
                    .addonItemName((String) ai[1])
                    .addonGroupId((String) ai[2])
                    .price(new BigDecimal((String) ai[3]))
                    .active(true)
                    .inStock(true)
                    .build());
        }

        // 6. Item Addon mappings
        String[][] mappings = {
                {"ITM101", "AG1"},
                {"ITM101", "AG2"},
                {"ITM102", "AG1"},
                {"ITM102", "AG2"},
                {"ITM201", "AG1"}
        };
        for (String[] map : mappings) {
            itemAddonGroupRepository.save(ItemAddonGroup.builder()
                    .itemId(map[0])
                    .addonGroupId(map[1])
                    .build());
        }
    }
}
