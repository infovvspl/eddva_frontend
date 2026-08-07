# Eddva School ERP — Live Class Platform Architecture

This document defines the live video streaming, real-time WebSockets, chat/Q&A flow, and resilience architecture for the Eddva Live Classroom system (Student Live Player, Teacher Live Dashboard, and Admin Monitoring Console).

---

## 🏗️ 1. Core Architecture Overview

```
                      +-----------------------------+
                      |   Teacher Live Dashboard    |
                      |   (Broadcaster Controls)    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    HLS Proxy & Media API    |
                      |   (schoolLive / Hls.js)     |
                      +--------------+--------------+
                                     |
                                     v
+-----------------------------+     |     +-----------------------------+
|    Socket.io Server Engine  |<----+---->|    Student Live Player      |
|    (Chat, Q&A, Reactions)   |           |    (Subscriber Canvas)      |
+-----------------------------+           +-----------------------------+
```

---

## 🔄 2. Socket Lifecycle & Stream State Machine

```
[SCHEDULED] ----(Teacher Starts Stream)----> [INITIALIZING]
                                                  |
                                                  v
                                             [BROADCASTING] <----+ (Auto-Reconnect)
                                                  |              |
                                          (Network Loss) --------+
                                                  |
                                                  v
                                             [CLASS ENDED] ----(Post-Class Summary)
```

1. **Initialization (`createLiveSocket`):** Authenticates user session with JWT token (`getLiveToken`). Joins room channel `lecture:{lectureId}`.
2. **Streaming (`Hls.js` + `hlsProxyUrl`):** Mounts video element with low-latency HLS config (`maxBufferLength: 10s`, `liveSyncDuration: 3s`).
3. **Disconnect Recovery:** Retries connection automatically with exponential backoff up to 5 attempts before displaying fallback alert banner.
4. **Class Termination:** Sends `end_lecture` event; shifts layout mode from `immersive` to `content` to render `PostClassSummary`.

---

## 💬 3. Interactive Data Flow (Chat, Q&A, Floating Reactions)

- **Chat Flow:** Real-time messages broadcast via `chat:message` Socket event. Persisted via REST API `schoolLive.getChatHistory`.
- **Q&A Threading:** Students submit questions (`question:new`). Teacher answers via `schoolLive.answerQuestion`. Answers broadcast to room and update status badges (`Answered` vs `Unanswered`).
- **Floating Reactions:** Reactions (`ReactionEmoji`) trigger `useFloatingReactions` hook, animating floating canvas elements over the video player with 0 layout shift.

---

## 🧪 4. Mandatory Live Session QA Matrix

Every Live Classroom page audit MUST verify the following 10 scenario tests:

| Scenario | Protocol & Trigger | Expected Behavior | Status |
| :--- | :--- | :--- | :---: |
| **1. Teacher Joins Stream** | Mount `/school/teacher/live/:id` | HLS video player initializes; camera controls active. | ✅ **PASS** |
| **2. Student Joins Stream** | Mount `/school/student/live/:id/watch` | Auto-subscribes to live HLS manifest. | ✅ **PASS** |
| **3. Teacher Disconnects** | Simulate network interruption | Displays non-blocking reconnection overlay. | ✅ **PASS** |
| **4. Network Loss (10s)** | Disable network adapter for 10s | Auto-reconnect banner triggers retry loop. | ✅ **PASS** |
| **5. Camera Off** | Toggle `VideoOff` control | Displays teacher avatar placeholder with active audio waveform. | ✅ **PASS** |
| **6. Microphone Muted** | Toggle `MicOff` control | Audio state badge updates to `Muted`. | ✅ **PASS** |
| **7. Screen Sharing** | Enable screen capture mode | Video container retains 16:9 aspect ratio without overflow. | ✅ **PASS** |
| **8. 100+ Participants** | Injected 100 concurrent participant rows | Participant list container scrolls smoothly (`overflow-y-auto`). | ✅ **PASS** |
| **9. Chat Flood (500+ Msgs)** | Injected 500 socket messages | Chat container maintains 60fps rendering without UI lock. | ✅ **PASS** |
| **10. Class Terminated** | Click `End Class` button | Layout switches to `content` mode and renders `PostClassSummary`. | ✅ **PASS** |
