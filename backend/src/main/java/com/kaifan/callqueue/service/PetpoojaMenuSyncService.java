package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.response.MenuResponse;
import com.kaifan.callqueue.entity.MenuItem;

import java.util.List;

public interface PetpoojaMenuSyncService {

    /**
     * Fetch latest menu from Petpooja and save it locally.
     * @param syncType scheduled or manual
     */
    void syncMenu(String syncType);

    /**
     * Get the cached menu from the local database.
     */
    MenuResponse getMenu();

    /**
     * Search menu items locally.
     */
    List<MenuItem> searchMenuItems(String query);
}
