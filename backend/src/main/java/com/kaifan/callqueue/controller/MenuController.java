package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.MenuResponse;
import com.kaifan.callqueue.entity.MenuItem;
import com.kaifan.callqueue.service.PetpoojaMenuSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
@Tag(name = "Menu Integration", description = "Endpoints for Petpooja menu synchronization and querying")
public class MenuController {

    private final PetpoojaMenuSyncService menuSyncService;

    @PostMapping("/sync")
    @Operation(summary = "Fetch latest menu from Petpooja and save locally")
    public ResponseEntity<ApiResponse<String>> syncMenu() {
        menuSyncService.syncMenu("MANUAL");
        return ResponseEntity.ok(ApiResponse.success("Menu synced successfully", null));
    }

    @GetMapping
    @Operation(summary = "Get the latest synced menu from the local database")
    public ResponseEntity<ApiResponse<MenuResponse>> getMenu() {
        return ResponseEntity.ok(ApiResponse.success(menuSyncService.getMenu()));
    }

    @GetMapping("/search")
    @Operation(summary = "Search menu items locally")
    public ResponseEntity<ApiResponse<List<MenuItem>>> searchMenuItems(@RequestParam String query) {
        return ResponseEntity.ok(ApiResponse.success(menuSyncService.searchMenuItems(query)));
    }
}
