# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Exclusive Recipient Gate**: Only an authenticated user with a verified email matching `atrayeede0025@gmail.com` (`isAuthorizedSister()`) can read or write any document in `/wishes/{wishId}`.
2. **Identity Integrity**: `incoming().authorUid == request.auth.uid` and `incoming().authorEmail == 'atrayeede0025@gmail.com'`.
3. **Strict Keys & Volumetric Bounds**: `WishEntry` documents must contain only `['authorUid', 'authorEmail', 'wishText', 'createdAt']`, with `wishText` between 1 and 300 characters and `wishId` matching `^[a-zA-Z0-9_\-]+$` (`<= 128` chars).
4. **Temporal & Immutability Integrity**: `createdAt == request.time` on creation; updates are disallowed (`allow update: if false;`).

## 2. The "Dirty Dozen" Payloads
1. Unauthenticated read/write attempt (`auth == null`).
2. Authenticated read/write with a different email (`arpitaghosh2167@gmail.com` or `stranger@gmail.com`).
3. Authenticated write where `email == 'atrayeede0025@gmail.com'` but `email_verified == false`.
4. Spoofed `authorUid` (`authorUid != request.auth.uid`).
5. Spoofed `authorEmail` (`authorEmail != 'atrayeede0025@gmail.com'`).
6. Shadow field injection (`{ ..., isAdmin: true }`).
7. Empty `wishText` (`""`).
8. Oversized `wishText` (`> 300` characters).
9. Forged client timestamp (`createdAt != request.time`).
10. Invalid document ID path poisoning (`wishId` > 128 chars or special characters).
11. Unauthorized update attempt on an existing wish.
12. Blanket list query by a non-authorized email.
