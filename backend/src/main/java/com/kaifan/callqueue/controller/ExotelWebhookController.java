package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.request.ExotelWebhookRequest;
import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.telephony.TelephonyProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/exotel")
@RequiredArgsConstructor
@Tag(name = "Exotel Webhooks", description = "Exotel telephony webhook endpoints")
public class ExotelWebhookController {

    private final TelephonyProvider telephonyProvider;

    @PostMapping(value = "/incoming", consumes = "application/json")
    @Operation(summary = "Handle incoming call webhook from Exotel (JSON)")
    public ResponseEntity<ApiResponse<String>> handleIncomingCallJson(@RequestBody ExotelWebhookRequest request) {
        log.info("Exotel incoming JSON call webhook: CallSid={}, From={}", request.getCallSid(), request.getFrom());
        telephonyProvider.handleIncomingCall(request.getCallSid(), request.getFrom());
        return ResponseEntity.ok(ApiResponse.success("Incoming call processed"));
    }

    @RequestMapping(value = "/incoming")
    @Operation(summary = "Handle incoming call webhook from Exotel (Form/GET)")
    public ResponseEntity<ApiResponse<String>> handleIncomingCallForm(
            @RequestParam(value = "CallSid", required = false) String callSid,
            @RequestParam(value = "callSid", required = false) String callSidLower,
            @RequestParam(value = "From", required = false) String from,
            @RequestParam(value = "from", required = false) String fromLower) {
        String finalCallSid = callSid != null ? callSid : callSidLower;
        String finalFrom = from != null ? from : fromLower;
        log.info("Exotel incoming Form/GET call webhook: CallSid={}, From={}", finalCallSid, finalFrom);
        if (finalCallSid == null || finalFrom == null) {
            log.warn("Missing CallSid or From in Exotel webhook parameters");
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing CallSid or From"));
        }
        finalFrom = finalFrom.trim();
        if (finalFrom.startsWith(" ")) {
            finalFrom = "+" + finalFrom.substring(1);
        }
        finalFrom = finalFrom.replace(" ", "+");
        telephonyProvider.handleIncomingCall(finalCallSid, finalFrom);
        return ResponseEntity.ok(ApiResponse.success("Incoming call processed"));
    }

    @PostMapping(value = "/connected", consumes = "application/json")
    @Operation(summary = "Handle call connected webhook from Exotel (JSON)")
    public ResponseEntity<ApiResponse<String>> handleCallConnectedJson(@RequestBody ExotelWebhookRequest request) {
        log.info("Exotel call connected JSON webhook: CallSid={}", request.getCallSid());
        telephonyProvider.handleCallConnected(request.getCallSid());
        return ResponseEntity.ok(ApiResponse.success("Call connected processed"));
    }

    @RequestMapping(value = "/connected")
    @Operation(summary = "Handle call connected webhook from Exotel (Form/GET)")
    public ResponseEntity<ApiResponse<String>> handleCallConnectedForm(
            @RequestParam(value = "CallSid", required = false) String callSid,
            @RequestParam(value = "callSid", required = false) String callSidLower) {
        String finalCallSid = callSid != null ? callSid : callSidLower;
        log.info("Exotel call connected Form/GET webhook: CallSid={}", finalCallSid);
        if (finalCallSid == null) {
            log.warn("Missing CallSid in Exotel webhook parameters");
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing CallSid"));
        }
        telephonyProvider.handleCallConnected(finalCallSid);
        return ResponseEntity.ok(ApiResponse.success("Call connected processed"));
    }

    @PostMapping(value = "/completed", consumes = "application/json")
    @Operation(summary = "Handle call completed webhook from Exotel (JSON)")
    public ResponseEntity<ApiResponse<String>> handleCallCompletedJson(@RequestBody ExotelWebhookRequest request) {
        String recordingUrl = request.getRecordingUrl() != null ? request.getRecordingUrl() : request.getRecordingUrl();
        log.info("Exotel call completed JSON webhook: CallSid={}, recordingUrl={}", request.getCallSid(), recordingUrl);
        telephonyProvider.handleCallCompleted(request.getCallSid(), recordingUrl);
        return ResponseEntity.ok(ApiResponse.success("Call completed processed"));
    }

    @RequestMapping(value = "/completed")
    @Operation(summary = "Handle call completed webhook from Exotel (Form/GET)")
    public ResponseEntity<ApiResponse<String>> handleCallCompletedForm(
            @RequestParam(value = "CallSid", required = false) String callSid,
            @RequestParam(value = "callSid", required = false) String callSidLower,
            @RequestParam(value = "RecordingUrl", required = false) String recordingUrl,
            @RequestParam(value = "recordingUrl", required = false) String recordingUrlLower) {
        String finalCallSid = callSid != null ? callSid : callSidLower;
        String finalRecordingUrl = recordingUrl != null ? recordingUrl : recordingUrlLower;
        log.info("Exotel call completed Form/GET webhook: CallSid={}, recordingUrl={}", finalCallSid, finalRecordingUrl);
        if (finalCallSid == null) {
            log.warn("Missing CallSid in Exotel webhook parameters");
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing CallSid"));
        }
        telephonyProvider.handleCallCompleted(finalCallSid, finalRecordingUrl);
        return ResponseEntity.ok(ApiResponse.success("Call completed processed"));
    }

    @PostMapping(value = "/agent-dialling", consumes = "application/json")
    @Operation(summary = "Handle currently active agent popup webhook from Exotel (JSON)")
    public ResponseEntity<ApiResponse<String>> handleAgentDiallingJson(@RequestBody ExotelWebhookRequest request) {
        log.info("Exotel agent dialling JSON webhook: CallSid={}, DialWhomNumber={}, From={}, Status={}",
                request.getCallSid(), request.getDialWhomNumber(), request.getFrom(), request.getStatus());
        telephonyProvider.handleAgentDialling(
                request.getCallSid(), request.getDialWhomNumber(), request.getFrom(), request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Agent dialling processed"));
    }

    @RequestMapping(value = "/agent-dialling")
    @Operation(summary = "Handle currently active agent popup webhook from Exotel (Form/GET)")
    public ResponseEntity<ApiResponse<String>> handleAgentDiallingForm(
            @RequestParam(value = "CallSid", required = false) String callSid,
            @RequestParam(value = "callSid", required = false) String callSidLower,
            @RequestParam(value = "DialWhomNumber", required = false) String dialWhomNumber,
            @RequestParam(value = "dialWhomNumber", required = false) String dialWhomNumberLower,
            @RequestParam(value = "From", required = false) String from,
            @RequestParam(value = "from", required = false) String fromLower,
            @RequestParam(value = "Status", required = false) String status,
            @RequestParam(value = "status", required = false) String statusLower) {
        String finalCallSid = callSid != null ? callSid : callSidLower;
        String finalDialWhomNumber = dialWhomNumber != null ? dialWhomNumber : dialWhomNumberLower;
        String finalFrom = from != null ? from : fromLower;
        String finalStatus = status != null ? status : statusLower;
        log.info("Exotel agent dialling Form/GET webhook: CallSid={}, DialWhomNumber={}, From={}, Status={}",
                finalCallSid, finalDialWhomNumber, finalFrom, finalStatus);
        if (finalCallSid == null || finalDialWhomNumber == null) {
            log.warn("Missing CallSid or DialWhomNumber in Exotel agent dialling webhook");
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing CallSid or DialWhomNumber"));
        }
        telephonyProvider.handleAgentDialling(finalCallSid, finalDialWhomNumber, finalFrom, finalStatus);
        return ResponseEntity.ok(ApiResponse.success("Agent dialling processed"));
    }

    @PostMapping(value = "/missed", consumes = "application/json")
    @Operation(summary = "Handle call missed webhook from Exotel (JSON)")
    public ResponseEntity<ApiResponse<String>> handleCallMissedJson(@RequestBody ExotelWebhookRequest request) {
        log.info("Exotel call missed JSON webhook: CallSid={}", request.getCallSid());
        telephonyProvider.handleCallMissed(request.getCallSid());
        return ResponseEntity.ok(ApiResponse.success("Call missed processed"));
    }

    @RequestMapping(value = "/missed")
    @Operation(summary = "Handle call missed webhook from Exotel (Form/GET)")
    public ResponseEntity<ApiResponse<String>> handleCallMissedForm(
            @RequestParam(value = "CallSid", required = false) String callSid,
            @RequestParam(value = "callSid", required = false) String callSidLower) {
        String finalCallSid = callSid != null ? callSid : callSidLower;
        log.info("Exotel call missed Form/GET webhook: CallSid={}", finalCallSid);
        if (finalCallSid == null) {
            log.warn("Missing CallSid in Exotel webhook parameters");
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing CallSid"));
        }
        telephonyProvider.handleCallMissed(finalCallSid);
        return ResponseEntity.ok(ApiResponse.success("Call missed processed"));
    }
}

