package com.kaifan.callqueue.telephony;

/**
 * Abstraction layer for telephony providers.
 * Business logic must never depend directly on any specific telephony provider.
 */
public interface TelephonyProvider {

    void handleIncomingCall(String callSid, String phoneNumber);

    void handleCallConnected(String callSid);

    void handleCallCompleted(String callSid);

    void handleCallMissed(String callSid);

    void connectNextQueuedCaller();

    void makeOutboundCall(String fromNumber, String toNumber);
}
