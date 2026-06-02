package com.kaifan.callqueue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketEvent {

    private String type;
    private Object payload;

    public static WebSocketEvent of(String type, Object payload) {
        return WebSocketEvent.builder()
                .type(type)
                .payload(payload)
                .build();
    }
}
