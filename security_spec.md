# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Exclusive Recipient Gate**: Only an authenticated user with a verified email matching `atrayeede0025@gmail.com` or `arpitaghosh2167@gmail.com` (`isAuthorizedSister()`) can read or write any document in `/wishes/{wishId}` or create a permanent chat record in `/chatLogs/{logId}`.
2. **Permanent Inaccessible Chat Archive (`/chatLogs/{logId}`)**:
   - Both authorized users (`atrayeede0025@gmail.com` and `arpitaghosh2167@gmail.com`) can `create` a `ChatLogEntry` document when sending a chat message.
   - `atrayeede0025@gmail.com` is strictly forbidden from reading (`get`, `list`), updating, or deleting `/chatLogs/{logId}`. Only `arpitaghosh2167@gmail.com` (`isAnikAdmin()`) can read (`get`, `list`) the permanent chat database.
   - Updates and deletes on `/chatLogs/{logId}` are permanently disabled (`allow update, delete: if false;`) so chat history in the database can never be erased or tampered with.
3. **Identity Integrity**: `incoming().authorUid == request.auth.uid` and `incoming().authorEmail == request.auth.token.email`.
4. **Strict Keys & Volumetric Bounds**:
   - `WishEntry`: `['authorUid', 'authorEmail', 'wishText', 'createdAt']`, `wishText` 1..300 chars.
   - `ChatLogEntry`: `['authorUid', 'authorEmail', 'userMessage', 'anikReply', 'createdAt']`, `userMessage` 1..2000 chars, `anikReply` 1..4000 chars, and IDs matching `^[a-zA-Z0-9_\-]+$` (`<= 128` chars).
5. **Temporal & Immutability Integrity**: `createdAt == request.time` on creation; updates are disallowed (`allow update: if false;`).

## 2. The "Dirty Dozen" Payloads
1. Unauthenticated read/write attempt (`auth == null`).
2. Authenticated read/write with a stranger email (`stranger@gmail.com`).
3. Authenticated write where `email == 'atrayeede0025@gmail.com'` but `email_verified == false`.
4. Spoofed `authorUid` (`authorUid != request.auth.uid`).
5. Spoofed `authorEmail` (`authorEmail != request.auth.token.email`).
6. Shadow field injection (`{ ..., isAdmin: true }`).
7. Empty `wishText` or empty `userMessage` (`""`).
8. Oversized `wishText` (`> 300` chars) or oversized `userMessage` (`> 2000` chars).
9. Forged client timestamp (`createdAt != request.time`).
10. Invalid document ID path poisoning (`logId` > 128 chars or special characters).
11. Unauthorized read/list attempt on `/chatLogs` by `atrayeede0025@gmail.com`.
12. Unauthorized delete or update attempt on `/chatLogs/{logId}` by any user.
