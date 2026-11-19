# QuickKart Security Specification (Phase 0 — Payload-First Security TDD)

## 1. Data Invariants
1. **Identity Isolation (PII)**: `/users/{userId}` and `/orders/{orderId}` contain PII (`email`, `phone`, `deliveryAddress`). Only the owner (`customerId == request.auth.uid`), assigned vendor (`vendorId`), assigned delivery partner (`deliveryPartnerId`), or a verified Admin may read order PII. Non-owners cannot `get` or `list` another user's profile or orders.
2. **No Self-Assigned Privileges**: A newly registered user creating `/users/{userId}` MUST have `role == 'customer'`. Users cannot escalate their own `role` to `admin`, `vendor`, or `delivery` on update.
3. **Referential Integrity**: Every `/products/{productId}` create must reference an existing `/stores/{storeId}` document. Every `/orders/{orderId}` create must reference an existing `/stores/{storeId}` document and bind `customerId == request.auth.uid`.
4. **State Machine & Terminal Locking**: Order lifecycle transitions follow `placed -> confirmed -> packed -> out_for_delivery -> delivered` (or `cancelled` from `placed`/`confirmed`). Once an order reaches `delivered` or `cancelled`, non-admin updates are strictly rejected.
5. **Strict Key Allowlisting & Volumetric Bounds**: All writes validate required keys (`hasAll`), forbid shadow/ghost keys (`hasOnly`), validate every string's `.size()`, validate bounded `items` list size (`<= 30`), validate regex IDs (`^[a-zA-Z0-9_\-]+$`), and enforce server timestamps (`request.time`).
6. **Verified Identity**: Standard write operations require `request.auth != null && request.auth.token.email_verified == true`. Bootstrapped admin check (`sumantachoudhury768@gmail.com`) strictly mandates `email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation on Create**: Customer creates `/users/uid1` with `{ role: "admin" }`. Expected: `PERMISSION_DENIED`.
2. **Self-Role Escalation on Update**: Customer updates `/users/uid1` changing `role: "vendor"`. Expected: `PERMISSION_DENIED`.
3. **Shadow/Ghost Field Injection on Order**: Customer creates `/orders/ord1` with extra field `isFreeOverride: true`. Expected: `PERMISSION_DENIED`.
4. **PII Snooping (Cross-User Get)**: User B attempts `get` on `/users/uidA` or `/orders/ordA`. Expected: `PERMISSION_DENIED`.
5. **Blanket Order List Scraping**: User B runs unfiltered `list` on `/orders`. Expected: `PERMISSION_DENIED`.
6. **Customer Identity Spoofing**: User A creates `/orders/ord2` with `customerId: "uidB"`. Expected: `PERMISSION_DENIED`.
7. **ID Poisoning (Oversized Path ID)**: Attacker writes `/orders/${'a'.repeat(300)}`. Expected: `PERMISSION_DENIED`.
8. **Orphaned Order (Invalid Store)**: Customer creates order referencing nonexistent `storeId: "fake_store"`. Expected: `PERMISSION_DENIED`.
9. **Terminal State Tampering**: Delivery partner attempts to update an order whose status is already `delivered` back to `packed`. Expected: `PERMISSION_DENIED`.
10. **Unverified Admin Email Spoof**: Unverified token (`email_verified: false`) with admin email attempts to update `/settings/platform`. Expected: `PERMISSION_DENIED`.
11. **Value Poisoning on Update**: Vendor attempts to update `/products/p1` setting `price: -500` or a 10KB `name`. Expected: `PERMISSION_DENIED`.
12. **Client Timestamp Forgery**: Customer creates `/orders/ord3` with backdated client `createdAt` not matching `request.time`. Expected: `PERMISSION_DENIED`.
