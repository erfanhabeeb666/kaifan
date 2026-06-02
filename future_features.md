# Kaifan Call Queue: Future Roadmap & Features

This document outlines premium, high-impact features that can be integrated into the Call Management System to transition it into a full-scale restaurant CRM and telephony suite.

---

## 1. 💬 WhatsApp Business Platform Integration
Currently, the customer grouping and messaging features are simulated. Integrating a real WhatsApp Gateway will enable automated, rich media messaging.

### Implementation Details:
* **API Integration:** Connect with Meta's Graph API (Cloud API) or Twilio WhatsApp API.
* **Message Templates:** Register and pre-approve templates with WhatsApp (e.g., for promotions, order updates, and queue status) to satisfy WhatsApp policies.
* **Group Management:** Add a `customer_groups` junction table in the DB to map customer IDs to custom marketing groups.
* **Webhook Handler:** Set up an endpoint `/api/whatsapp/webhook` to handle user replies, mapping inbound text responses back to customer profiles on the dashboard for a unified chat interface.

---

## 2. 📞 Enhanced Telephony & Call Flow Controls
Expanding the Exotel integration to leverage advanced voice capabilities.

### Implementation Details:
* **Call Recording & Playback:**
  * Configure Exotel to automatically record calls and push them to a secure Amazon S3 bucket.
  * Save the recording URL on the backend `CallLog` entity.
  * In the React UI, embed HTML5 `<audio>` elements inside the **Call History** detail row to play recordings.
* **Interactive Voice Response (IVR) Applet Builder:**
  * Configure Exotel's Passthru Applet to point to `/api/exotel/ivr` on our server.
  * Return custom Exoml XML responses directing callers based on keypresses (e.g., `1` for Home Delivery, `2` for Table Booking).
* **Scheduled Auto-Callback Queue:**
  * Store dropped or abandoned calls in a `callback_requests` table.
  * Create a background cron job using Spring Boot's `@Scheduled` annotation that monitors agent availability.
  * When an employee transitions to `AVAILABLE`, automatically invoke Exotel's `connect` API to dial the employee, then dial the customer.

---

## 3. 👤 Customer CRM & Order History Integration
Linking the customer directory to POS/ordering databases for immediate profile context.

### Implementation Details:
* **Database Mapping:** Map the `customers` table to order tables via a foreign key or through a microservice API call.
* **Agent Panel Integration:** When a call comes in, the backend sends a WebSocket payload containing the caller's last 5 orders, average order value, and favorite dishes.
* **VIP Priority Queue Routing:** 
  * Add a `vip_level` column to the `customers` table.
  * Modify `ExotelTelephonyProvider.handleIncomingCall` to inspect the caller's VIP status.
  * If the caller is a VIP, place them at position `1` in the `QueueEntry` table, bypassing standard queue order.

---

## 4. 🧠 AI Call Analytics & Sentiment Analysis
Integrate artificial intelligence to gauge customer satisfaction and agent performance.

### Implementation Details:
* **Transcription Pipeline:** Configure a Spring Boot integration with OpenAI's Whisper API to transcribe the Exotel S3 call recording after completion.
* **Sentiment Classification:** Send the transcript to a GPT-4 model with a system prompt that returns:
  * Customer sentiment score (-1.0 to +1.0).
  * Main reason for call (e.g., Complaint, Order Placement, Inquiry).
* **Search & Indexing:** Store transcripts and sentiment in Elasticsearch or use PostgreSQL pg_trgm indexes to search logs by keywords (e.g., "cold food", "delayed").

---

## 5. 📊 Advanced Reporting & Business Intelligence (BI)
Provide deep operational insights for managers.

### Implementation Details:
* **PDF/Excel Export Service:** Add an endpoint using Apache POI (for Excel) and OpenPDF (for PDF) to stream database reports directly to the user's browser.
* **Live Analytics Charts:** Integrate Chart.js or Recharts into the dashboard to display:
  * Wait time distributions.
  * Peak calling hours (heatmap).
  * Employee call duration histograms.
* **Agent Utilization Metric:** Track times between employee state changes to calculate total active hour ratios (Time Busy / Total Logged-in Hours).

---

## 6. 🔔 Real-time Alerts & Notification Integrations
Keep the restaurant team informed on active channels.

### Implementation Details:
* **Slack/Discord Webhook:** Create a `SlackNotificationService` that executes a webhook payload to a channel whenever a queue overflow occurs or a callback request remains unaddressed for over 15 minutes.
* **HTML5 Push Notification API:** Trigger browser-level notifications inside the React frontend using the `Notification` Web API. If the tab is running in the background, a desktop banner and ring sound alert the agent of new calls.
* **Wallboard Display Mode:** A optimized full-screen, high-contrast dashboard layout (using standard Grid styling) to run on wall-mounted monitors in the restaurant kitchen.

---

## 7. 🔀 Dynamic Queue Overflow Routing
Handling periods of high traffic automatically.

### Implementation Details:
* **Threshold Monitor:** In `handleIncomingCall`, check if `currentQueueLength > 10` or if the average wait time is greater than 5 minutes.
* **Voicemail Applet:** If thresholds are exceeded, return Exoml directing Exotel to record a voicemail instead of queuing the caller.
* **Visual Queue Alert:** Flag the overflow on the frontend dashboard by changing the queue length indicator to a flashing red warning theme.
