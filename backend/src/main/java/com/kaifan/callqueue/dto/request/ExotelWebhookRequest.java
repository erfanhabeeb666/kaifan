package com.kaifan.callqueue.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExotelWebhookRequest {

    private String CallSid;
    private String From;
    private String To;
    private String CallType;
    private String Status;
    private String Direction;
    private String Duration;
    private String RecordingUrl;
    private String recordingUrl;
    private String DialWhomNumber;
    private String dialWhomNumber;
}
