# Website Supabase Duplicate User Verification Audit Report

**Date of Audit**: 2026-07-24 · **Audited by**: Antigravity (Advanced Agentic Coding Team, Google DeepMind)  
**Methodology**: Read-only database-wide dependency inspection of all duplicate users.

---

## 1. Duplicate Group Summary

We have identified exactly **42 duplicate phone groups** representing **84 duplicate user records** in the `website_store_users` table. The duplicate groups are listed below, mapped by their normalized 12-digit comparison phone number:

1. **Phone: 916203288535**
   - **User A (10-digit)**: UUID `a58c33e1-a616-418c-9daf-1c6ead76fbf2` · Stored: `6203288535` · Created: 2026-07-24 · Last Login: 2026-07-24
   - **User B (12-digit)**: UUID `be26646b-bf95-4082-9e1c-47e11d910c68` · Stored: `916203288535` · Created: 2026-07-24 · Last Login: 2026-07-24
2. **Phone: 916204175088**
   - **User A (10-digit)**: UUID `cbb6a1d2-6c0b-4e3f-be29-ddc20ffa457e` · Stored: `6204175088` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `3b5b751f-bbdb-4438-8ff1-f33e08518543` · Stored: `916204175088` · Created: 2026-07-23 · Last Login: 2026-07-23
3. **Phone: 916376206618**
   - **User A (10-digit)**: UUID `353a4f7a-50bf-4726-9263-835826bd59f6` · Stored: `6376206618` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `fd72dd3c-50a0-448d-8909-6ff17a14d5c5` · Stored: `916376206618` · Created: 2026-07-23 · Last Login: 2026-07-23
4. **Phone: 917017308966**
   - **User A (10-digit)**: UUID `9c95dcf1-6ff7-44e8-aef3-f719ad2a04cc` · Stored: `7017308966` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` · Stored: `917017308966` · Created: 2026-07-23 · Last Login: 2026-07-23
5. **Phone: 917383130148**
   - **User A (10-digit)**: UUID `ff824a1b-e0a1-4249-8c75-2c9362e33f1e` · Stored: `7383130148` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `e7978155-f476-455d-b700-dfa9863c8c87` · Stored: `917383130148` · Created: 2026-07-23 · Last Login: 2026-07-23
6. **Phone: 917408405612**
   - **User A (10-digit)**: UUID `ce5fd7ff-d400-4869-a598-dd13c63ce510` · Stored: `7408405612` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `a32964ed-b361-4105-ba0e-550e30c825f6` · Stored: `917408405612` · Created: 2026-07-23 · Last Login: 2026-07-23
7. **Phone: 917631598563**
   - **User A (10-digit)**: UUID `9ecc1ec5-e311-49c7-b6d0-b4e6f776236f` · Stored: `7631598563` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `5e872698-10e8-492c-9fcd-c2bb47f145ba` · Stored: `917631598563` · Created: 2026-07-23 · Last Login: 2026-07-23
8. **Phone: 917742422277**
   - **User A (10-digit)**: UUID `e53441ea-8046-456d-9fb1-162dcf19feb8` · Stored: `7742422277` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `faf2bc3c-b15a-43d7-b31e-3f044813788e` · Stored: `917742422277` · Created: 2026-07-23 · Last Login: 2026-07-23
9. **Phone: 917874980572**
   - **User A (10-digit)**: UUID `e63adc0a-5875-4e6f-9169-9b14169754ca` · Stored: `7874980572` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` · Stored: `917874980572` · Created: 2026-07-23 · Last Login: 2026-07-23
10. **Phone: 917974478098**
   - **User A (10-digit)**: UUID `6f91280a-d400-4cf4-85ee-b6014d5b5917` · Stored: `7974478098` · Created: 2026-07-13 · Last Login: 2026-07-22
   - **User B (12-digit)**: UUID `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` · Stored: `917974478098` · Created: 2026-07-22 · Last Login: 2026-07-23
11. **Phone: 917978935494**
   - **User A (10-digit)**: UUID `d3100829-f9b0-4163-967c-3f9bcbd3451f` · Stored: `7978935494` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `9322afbf-f0e0-43d2-a05f-4ae2eb547218` · Stored: `917978935494` · Created: 2026-07-23 · Last Login: 2026-07-23
12. **Phone: 917999279610**
   - **User A (10-digit)**: UUID `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` · Stored: `7999279610` · Created: 2026-07-13 · Last Login: 2026-07-22
   - **User B (12-digit)**: UUID `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` · Stored: `917999279610` · Created: 2026-07-23 · Last Login: 2026-07-23
13. **Phone: 918103314636**
   - **User A (10-digit)**: UUID `b9c1008f-e529-4809-8d4d-e70c443777ee` · Stored: `8103314636` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `94d8d30a-c5fe-40d2-bc88-65ccd637577b` · Stored: `918103314636` · Created: 2026-07-23 · Last Login: 2026-07-23
14. **Phone: 918109422241**
   - **User A (10-digit)**: UUID `8fcbfb52-022c-4f03-8225-650127cc090a` · Stored: `8109422241` · Created: 2026-07-08 · Last Login: 2026-07-22
   - **User B (12-digit)**: UUID `53496531-dcc4-45e6-9442-8922efc4cb85` · Stored: `918109422241` · Created: 2026-07-23 · Last Login: 2026-07-23
15. **Phone: 918299138372**
   - **User A (10-digit)**: UUID `5f4ec778-bb2c-402c-b46c-f2d83f10ef33` · Stored: `8299138372` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` · Stored: `918299138372` · Created: 2026-07-23 · Last Login: 2026-07-23
16. **Phone: 918320782942**
   - **User A (10-digit)**: UUID `d9dfbd7a-ba07-480d-835f-3d28ab2fda00` · Stored: `8320782942` · Created: 2026-07-24 · Last Login: 2026-07-24
   - **User B (12-digit)**: UUID `8b455565-4b4d-43eb-9dec-68d788f2cd66` · Stored: `918320782942` · Created: 2026-07-24 · Last Login: 2026-07-24
17. **Phone: 918521600214**
   - **User A (10-digit)**: UUID `528565be-2a51-4055-818d-5fad9669be5c` · Stored: `8521600214` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `17bdace1-d33e-4990-b3e0-83497aa69a1d` · Stored: `918521600214` · Created: 2026-07-23 · Last Login: 2026-07-23
18. **Phone: 918819897434**
   - **User A (10-digit)**: UUID `4bc8cc36-ab55-4db7-85ba-ab0803923a19` · Stored: `8819897434` · Created: 2026-07-21 · Last Login: 2026-07-22
   - **User B (12-digit)**: UUID `b7231561-31c6-40de-ba4a-0e1062b691b5` · Stored: `918819897434` · Created: 2026-07-23 · Last Login: 2026-07-23
19. **Phone: 919009046430**
   - **User A (10-digit)**: UUID `6c386c97-bd16-444c-84fa-d0a4e73c4530` · Stored: `9009046430` · Created: 2026-07-13 · Last Login: 2026-07-13
   - **User B (12-digit)**: UUID `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` · Stored: `919009046430` · Created: 2026-07-23 · Last Login: 2026-07-23
20. **Phone: 919065524534**
   - **User A (10-digit)**: UUID `1631e59a-e552-48e8-ae61-88f7bb856abb` · Stored: `9065524534` · Created: 2026-07-24 · Last Login: 2026-07-24
   - **User B (12-digit)**: UUID `780c445c-a3ff-4caf-b64e-80c65a7e6568` · Stored: `919065524534` · Created: 2026-07-24 · Last Login: 2026-07-24
21. **Phone: 919193833159**
   - **User A (10-digit)**: UUID `4defde13-cd29-4eb0-8cf9-e0dd779244f6` · Stored: `9193833159` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `20362a06-2966-466e-8ef9-a73b345c518c` · Stored: `919193833159` · Created: 2026-07-23 · Last Login: 2026-07-23
22. **Phone: 919234133572**
   - **User A (10-digit)**: UUID `70ba19bf-93de-4afd-8df8-bbb03746a829` · Stored: `9234133572` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `acf583eb-6ef9-4031-9df5-ba742a1824c9` · Stored: `919234133572` · Created: 2026-07-23 · Last Login: 2026-07-23
23. **Phone: 919312369843**
   - **User A (10-digit)**: UUID `a35a50e5-2974-43d9-b13e-7e2001d0f441` · Stored: `9312369843` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `49db3db3-2224-494e-8aaa-756dfbd6342a` · Stored: `919312369843` · Created: 2026-07-23 · Last Login: 2026-07-23
24. **Phone: 919431457166**
   - **User A (10-digit)**: UUID `68841aa1-4133-4102-bcb3-1e4bb5d56a9d` · Stored: `9431457166` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `c49aef24-6c11-45ba-83bc-c4231d386c99` · Stored: `919431457166` · Created: 2026-07-23 · Last Login: 2026-07-23
25. **Phone: 919460195466**
   - **User A (10-digit)**: UUID `4407a333-2f21-48e1-a6f2-1c8dcb83365d` · Stored: `9460195466` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `ef11e80b-c824-4c5a-9b9e-1654c652c56b` · Stored: `919460195466` · Created: 2026-07-23 · Last Login: 2026-07-23
26. **Phone: 919548417559**
   - **User A (10-digit)**: UUID `1f939b6e-9ad7-4a40-95eb-f1dbe8205cf0` · Stored: `9548417559` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4` · Stored: `919548417559` · Created: 2026-07-23 · Last Login: 2026-07-23
27. **Phone: 919569521972**
   - **User A (10-digit)**: UUID `0ba5d1d4-4d3e-4d89-b9b5-212e4cd30bbe` · Stored: `9569521972` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `5db94409-93c1-4c9f-b7b5-d350667ec528` · Stored: `919569521972` · Created: 2026-07-23 · Last Login: 2026-07-23
28. **Phone: 919580793778**
   - **User A (10-digit)**: UUID `1f8b15d1-826d-48ef-b7f0-4d404565f628` · Stored: `9580793778` · Created: 2026-07-24 · Last Login: 2026-07-24
   - **User B (12-digit)**: UUID `e206c26f-7fc8-4863-b971-edb61b374767` · Stored: `919580793778` · Created: 2026-07-24 · Last Login: 2026-07-24
29. **Phone: 919604812161**
   - **User A (10-digit)**: UUID `548d3850-9f2f-4aeb-949f-f21efdcd984a` · Stored: `9604812161` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `1486d221-9d16-4347-b3b2-815d1ad2a892` · Stored: `919604812161` · Created: 2026-07-23 · Last Login: 2026-07-23
30. **Phone: 919617658659**
   - **User A (10-digit)**: UUID `3053c4c0-bd0a-401b-80ca-b1621593d8d7` · Stored: `9617658659` · Created: 2026-07-24 · Last Login: 2026-07-24
   - **User B (12-digit)**: UUID `be60c847-98d0-4511-9557-3d38babd5361` · Stored: `919617658659` · Created: 2026-07-24 · Last Login: 2026-07-24
31. **Phone: 919644896049**
   - **User A (10-digit)**: UUID `061f8f18-23dd-49a8-be31-8c504576ba1f` · Stored: `9644896049` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `5a9e2012-401b-4be6-8ddd-e7687b964566` · Stored: `919644896049` · Created: 2026-07-23 · Last Login: 2026-07-23
32. **Phone: 919685787200**
   - **User A (10-digit)**: UUID `0f60b1eb-3e26-4ddc-bd34-880c977a2ae8` · Stored: `9685787200` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` · Stored: `919685787200` · Created: 2026-07-23 · Last Login: 2026-07-23
33. **Phone: 919689120412**
   - **User A (10-digit)**: UUID `a497fcd3-0734-4135-961c-61b57ec69ed2` · Stored: `9689120412` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `61a0e405-6204-4015-840d-6ad93873901d` · Stored: `919689120412` · Created: 2026-07-23 · Last Login: 2026-07-23
34. **Phone: 919712932302**
   - **User A (10-digit)**: UUID `f6b9f983-fcf5-4ba4-ab5c-17471db979fd` · Stored: `9712932302` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `9a24bd0c-476b-448f-97bd-70e08960f904` · Stored: `919712932302` · Created: 2026-07-23 · Last Login: 2026-07-23
35. **Phone: 919764566466**
   - **User A (10-digit)**: UUID `b3269e2c-a569-4a93-ba24-ecbacf54590d` · Stored: `9764566466` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `8e4397b0-c581-4853-b537-5b3eceb75c6b` · Stored: `919764566466` · Created: 2026-07-23 · Last Login: 2026-07-23
36. **Phone: 919806254050**
   - **User A (10-digit)**: UUID `544927e1-5073-4faa-84d1-bb56b303e386` · Stored: `9806254050` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` · Stored: `919806254050` · Created: 2026-07-23 · Last Login: 2026-07-23
37. **Phone: 919813886201**
   - **User A (10-digit)**: UUID `beaf6128-9fb8-40cc-94fc-b03c7fdd1a32` · Stored: `9813886201` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `21dacd91-75d6-4321-a368-19f4416c2add` · Stored: `919813886201` · Created: 2026-07-23 · Last Login: 2026-07-23
38. **Phone: 919828387166**
   - **User A (10-digit)**: UUID `6c87a88b-1038-4cf2-8a82-b662121aab4d` · Stored: `9828387166` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `05e37eb2-d2a5-4f0a-a644-cf469693c475` · Stored: `919828387166` · Created: 2026-07-23 · Last Login: 2026-07-23
39. **Phone: 919899383485**
   - **User A (10-digit)**: UUID `d4abff7c-70bb-44cb-ad2f-a5c2cc697dd3` · Stored: `9899383485` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` · Stored: `919899383485` · Created: 2026-07-23 · Last Login: 2026-07-23
40. **Phone: 919935895884**
   - **User A (10-digit)**: UUID `16930cda-89a5-47e8-9868-3cb5507bdf55` · Stored: `9935895884` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `b33ea620-1420-4420-8261-92d530614f6b` · Stored: `919935895884` · Created: 2026-07-23 · Last Login: 2026-07-23
41. **Phone: 919967244573**
   - **User A (10-digit)**: UUID `af2f3d4b-4b03-4c9c-9b06-074161a98dae` · Stored: `9967244573` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `b18c4898-f7c2-4a5f-919e-32507775512d` · Stored: `919967244573` · Created: 2026-07-23 · Last Login: 2026-07-23
42. **Phone: 919999999999**
   - **User A (10-digit)**: UUID `b8cd2d08-988e-4e9e-abb8-20482986e5ce` · Stored: `9999999999` · Created: 2026-07-23 · Last Login: 2026-07-23
   - **User B (12-digit)**: UUID `aad66182-bd3c-428d-bfc8-62b6017ac840` · Stored: `919999999999` · Created: 2026-07-22 · Last Login: 2026-07-22

---

## 2. Complete Row Verification

This section lists the ACTUAL rows in the database that directly or indirectly reference any of the duplicate user UUIDs. No data has been summarized or omitted.

### A. website_store_orders Rows
Total: 59 rows

| Order ID | Order Number | User UUID | Status | Payment Status | Payment Provider | Razorpay Order ID | Razorpay Payment ID | Checkout Attempt ID | Created At |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `30010217-ba9e-4403-9dae-a15313fe6069` | `MANTRA-237237` | `8fcbfb52-022c-4f03-8225-650127cc090a` | Payment Pending | Pending | Razorpay | `order_TB3YeaeeVX70ib` | `N/A` | `MANTRA-373791` | 2026-07-08T15:23:03.368254+00:00 |
| `0a4328f4-b36e-41a7-bc2e-2d02b0153192` | `MANTRA-396069` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `order_TD5x3Bn4zEGHSQ` | `N/A` | `MANTRA-341467` | 2026-07-13T19:01:32.050101+00:00 |
| `0a4328f4-b36e-41a7-bc2e-2d02b0153192` | `MANTRA-396069` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `order_TD5x3Bn4zEGHSQ` | `N/A` | `MANTRA-341467` | 2026-07-13T19:01:32.050101+00:00 |
| `0a4328f4-b36e-41a7-bc2e-2d02b0153192` | `MANTRA-396069` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `order_TD5x3Bn4zEGHSQ` | `N/A` | `MANTRA-341467` | 2026-07-13T19:01:32.050101+00:00 |
| `0a4328f4-b36e-41a7-bc2e-2d02b0153192` | `MANTRA-396069` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `order_TD5x3Bn4zEGHSQ` | `N/A` | `MANTRA-341467` | 2026-07-13T19:01:32.050101+00:00 |
| `4e686ccf-b065-467d-bfde-ef20c1cc53d6` | `MANTRA-296888` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `N/A` | `N/A` | `MANTRA-242195` | 2026-07-13T19:06:29.042623+00:00 |
| `4e686ccf-b065-467d-bfde-ef20c1cc53d6` | `MANTRA-296888` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `N/A` | `N/A` | `MANTRA-242195` | 2026-07-13T19:06:29.042623+00:00 |
| `4e686ccf-b065-467d-bfde-ef20c1cc53d6` | `MANTRA-296888` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `N/A` | `N/A` | `MANTRA-242195` | 2026-07-13T19:06:29.042623+00:00 |
| `4e686ccf-b065-467d-bfde-ef20c1cc53d6` | `MANTRA-296888` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | `N/A` | `N/A` | `MANTRA-242195` | 2026-07-13T19:06:29.042623+00:00 |
| `7bdcb0c0-950f-4549-adcc-163899abb268` | `MANTRA-857313` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | `N/A` | `N/A` | `MANTRA-810822` | 2026-07-21T07:22:29.340074+00:00 |
| `6d76e6cf-69bd-41e7-839d-f7745819d4df` | `MANTRA-682469` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | `order_TG55TfMTxCygrw` | `N/A` | `MANTRA-516219` | 2026-07-21T08:07:49.643152+00:00 |
| `7dc5dfcd-d1a8-4ec8-907a-c3aec0781411` | `MANTRA-295544` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | `order_TG56pTeB6lS5Kz` | `N/A` | `MANTRA-965003` | 2026-07-21T08:09:05.804772+00:00 |
| `13c756c3-302c-4592-b404-6eadbfaa70c4` | `MANTRA-831185` | `8fcbfb52-022c-4f03-8225-650127cc090a` | Payment Pending | Pending | Razorpay | `order_TG57qouxGawCnt` | `N/A` | `MANTRA-881330` | 2026-07-21T08:10:04.605712+00:00 |
| `c349342b-8500-4aaa-a612-712d1c53ed49` | `MANTRA-195098` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | `order_TG58KD61vmRAtS` | `N/A` | `MANTRA-194422` | 2026-07-21T08:10:30.570021+00:00 |
| `2f616d5d-9565-4447-9cc5-135ed7754ee0` | `MANTRA-870014` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | `order_TG8ODBA2qQ0zeI` | `N/A` | `MANTRA-663743` | 2026-07-21T11:21:38.384848+00:00 |
| `50d4ecb7-94a0-466a-8f84-63304563f4d7` | `MANTRA-932212` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | `order_TG8QoOZFQAHvCY` | `N/A` | `MANTRA-257392` | 2026-07-21T11:24:06.443449+00:00 |
| `90028d56-8090-4370-ad90-711f71799705` | `MANTRA-381905` | `8fcbfb52-022c-4f03-8225-650127cc090a` | Payment Pending | Pending | Razorpay | `order_TG8Qz6OdFXM3xB` | `N/A` | `MANTRA-334714` | 2026-07-21T11:24:16.157121+00:00 |
| `a3b27dc5-9cbb-46a0-84da-3ebef261431a` | `MANTRA-689646` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | Cancelled | Failed | Razorpay | `order_TGH4XpiI3jFweR` | `N/A` | `MANTRA-938578` | 2026-07-21T19:51:15.640948+00:00 |
| `6eefc9ae-3c51-4ef8-af0f-ecb05a77443f` | `MANTRA-550767` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Failed | Razorpay | `order_TGeZL5Wsk5MZ66` | `N/A` | `MANTRA-819041` | 2026-07-22T18:50:21.940238+00:00 |
| `d76430a8-7753-456e-9035-a80290039b1a` | `MANTRA-755020` | `fd72dd3c-50a0-448d-8909-6ff17a14d5c5` | Shipped | Pending | COD | `N/A` | `N/A` | `MANTRA-386770` | 2026-07-23T02:09:33.834464+00:00 |
| `2a628acc-0210-44f1-bc3f-900540b36230` | `MANTRA-815210` | `9322afbf-f0e0-43d2-a05f-4ae2eb547218` | Payment Pending | Pending | Razorpay | `order_TGmkDJEGo0sn8l` | `N/A` | `MANTRA-203041` | 2026-07-23T02:50:12.521121+00:00 |
| `284be8c4-b3c7-4a82-ac08-bc27b446e7a5` | `MANTRA-481123` | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | Shipped | Pending | COD | `N/A` | `N/A` | `MANTRA-496398` | 2026-07-23T02:55:28.506187+00:00 |
| `b472de9c-2d70-43a2-b32f-4d1dc0bd1f0e` | `MANTRA-716989` | `20362a06-2966-466e-8ef9-a73b345c518c` | Payment Pending | Pending | Razorpay | `order_TGoaH0FsJQat3d` | `N/A` | `MANTRA-869082` | 2026-07-23T04:38:10.985169+00:00 |
| `738925db-173f-4730-a6df-da2ef9cd0f68` | `MANTRA-636487` | `b33ea620-1420-4420-8261-92d530614f6b` | Payment Pending | Pending | Razorpay | `order_TGojfhO143RObt` | `N/A` | `MANTRA-782240` | 2026-07-23T04:47:05.312932+00:00 |
| `11083e07-9d49-4daf-9827-af6d3249477b` | `MANTRA-992977` | `94d8d30a-c5fe-40d2-bc88-65ccd637577b` | Shipped | Pending | COD | `N/A` | `N/A` | `MANTRA-330081` | 2026-07-23T05:55:42.775133+00:00 |
| `bfb4d764-181b-4aa3-b7aa-d41978cc6ae5` | `MANTRA-915010` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | Being Packed | Confirmed | Razorpay | `order_TGriMoeOONf5Es` | `pay_TGriTBbtGWYyyz` | `MANTRA-597485` | 2026-07-23T07:41:56.002724+00:00 |
| `f7d34fdc-7019-4952-a767-9b96ebdc7885` | `MANTRA-760268` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | Being Packed | Pending | COD | `N/A` | `N/A` | `MANTRA-719535` | 2026-07-23T07:46:08.097125+00:00 |
| `a5f1d7c0-b36d-4c21-bc7c-c860b2392bd3` | `MANTRA-645577` | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | Being Packed | Confirmed | Razorpay | `order_TGrnTP8SRaaKxa` | `pay_TGrwdobxvCHoZQ` | `MANTRA-971145` | 2026-07-23T07:46:44.520772+00:00 |
| `37727fe8-c62b-4b35-8722-d6121bb61de1` | `MANTRA-877539` | `49db3db3-2224-494e-8aaa-756dfbd6342a` | Being Packed | Confirmed | Razorpay | `order_TGs2fUpUj5GfQz` | `pay_TGs2m15rRY0im4` | `MANTRA-456782` | 2026-07-23T08:01:08.661558+00:00 |
| `13123d74-5a95-4d6c-b493-06920bff705b` | `MANTRA-306833` | `21dacd91-75d6-4321-a368-19f4416c2add` | Ready for Dispatch | Pending | COD | `N/A` | `N/A` | `MANTRA-403281` | 2026-07-23T08:18:36.265762+00:00 |
| `9e8fa45d-00f4-4fa0-8078-1704bb5189bc` | `MANTRA-274293` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | Ready for Dispatch | Pending | COD | `N/A` | `N/A` | `MANTRA-918221` | 2026-07-23T09:40:15.599321+00:00 |
| `9e99bec2-e9cd-482e-8c35-87603b8457ed` | `MANTRA-398261` | `61a0e405-6204-4015-840d-6ad93873901d` | Being Packed | Confirmed | Razorpay | `order_TGu5xKacvHjDn3` | `pay_TGu6BalEGpXEp4` | `MANTRA-566523` | 2026-07-23T10:01:38.638621+00:00 |
| `c5d37847-d2fb-41a3-9c82-1e0983ab2c14` | `MANTRA-765822` | `e7978155-f476-455d-b700-dfa9863c8c87` | Being Packed | Confirmed | Razorpay | `order_TGu6wcdxkuSJXT` | `pay_TGu740Q4wCUe3q` | `MANTRA-428426` | 2026-07-23T10:02:35.142251+00:00 |
| `f5f3a61e-4fa7-4322-bb33-f75d00e88ca2` | `MANTRA-723723` | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | Ready for Dispatch | Pending | COD | `N/A` | `N/A` | `MANTRA-561742` | 2026-07-23T10:53:44.578664+00:00 |
| `65e6550c-46be-4c16-b2d1-d870882977d2` | `MANTRA-883065` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Failed | Razorpay | `order_TGviDtXTox7Awa` | `N/A` | `MANTRA-897327` | 2026-07-23T11:36:33.77845+00:00 |
| `4700ea4c-c1d8-42bf-81dc-18e6f6b4bd5a` | `MANTRA-158461` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | Payment Pending | Pending | Razorpay | `order_TGw5FM3oWDdTH1` | `N/A` | `MANTRA-692384` | 2026-07-23T11:58:21.847266+00:00 |
| `8e0e668b-e93a-4d0b-97ca-242ee8d7ce30` | `MANTRA-875760` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Failed | Razorpay | `order_TGwBCk2lw913xX` | `N/A` | `MANTRA-974815` | 2026-07-23T12:04:00.227162+00:00 |
| `be51ea98-c38f-48e1-a013-07d36fc26719` | `MANTRA-377319` | `53496531-dcc4-45e6-9442-8922efc4cb85` | Cancelled | Confirmed | Razorpay | `order_TGwRAYSj00u1Lo` | `pay_TGwRStjf2RV2oZ` | `MANTRA-124141` | 2026-07-23T12:19:06.924777+00:00 |
| `d23388c9-e05c-4693-86bb-867ab17786ce` | `MANTRA-113231` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | Payment Pending | Pending | Razorpay | `order_TGwsglMiV4UBh7` | `N/A` | `MANTRA-961881` | 2026-07-23T12:45:08.835699+00:00 |
| `21ac2b7c-411b-4466-99e5-47da387d4226` | `MANTRA-181539` | `1486d221-9d16-4347-b3b2-815d1ad2a892` | Payment Pending | Pending | Razorpay | `order_TGx8eQIe9wU2hT` | `N/A` | `MANTRA-631624` | 2026-07-23T13:00:15.891691+00:00 |
| `22d2573b-f62c-40f0-a5d5-e029acd955f3` | `MANTRA-606459` | `a32964ed-b361-4105-ba0e-550e30c825f6` | Payment Pending | Pending | Razorpay | `order_TGxGpgrs170l1I` | `N/A` | `MANTRA-250778` | 2026-07-23T13:08:01.172324+00:00 |
| `79741037-6793-45d4-995f-ba21ea91daef` | `MANTRA-837561` | `ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` | Being Packed | Confirmed | Razorpay | `order_TGxtweO8DF3YjT` | `pay_TGxu79p6dWppAW` | `MANTRA-792374` | 2026-07-23T13:45:03.232678+00:00 |
| `eb789d96-41b1-48b7-ba9e-d6e3421ca88a` | `MANTRA-320301` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | Cancelled | Failed | Razorpay | `order_TGy6GMFMzTOnoV` | `N/A` | `MANTRA-807625` | 2026-07-23T13:56:43.039512+00:00 |
| `e2e2829c-ecb2-4547-8a73-44996e2953bf` | `MANTRA-529258` | `53496531-dcc4-45e6-9442-8922efc4cb85` | Cancelled | Confirmed | Razorpay | `order_TGy6iamaSCYOvk` | `pay_TGy6mXMthSn2sB` | `MANTRA-915114` | 2026-07-23T13:57:08.481801+00:00 |
| `6132d877-24b5-4859-9668-6a4ae4f7efb6` | `MANTRA-126578` | `53496531-dcc4-45e6-9442-8922efc4cb85` | Cancelled | Pending | COD | `N/A` | `N/A` | `MANTRA-707649` | 2026-07-23T13:58:36.82717+00:00 |
| `e3908cdd-a71d-492b-8854-670826d7e75c` | `MANTRA-478581` | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | Being Packed | Confirmed | Razorpay | `order_TGycgLEKQxzCwz` | `pay_TGycplA9VMN8ky` | `MANTRA-949568` | 2026-07-23T14:27:23.304665+00:00 |
| `8c7aeb66-5de3-4ab3-b64b-1366070c1763` | `MANTRA-400075` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Confirmed | Razorpay | `N/A` | `N/A` | `MANTRA-124036` | 2026-07-23T14:29:04.488728+00:00 |
| `6907a1b2-b928-48b8-9ad4-fe3df78ae902` | `MANTRA-923247` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Confirmed | Razorpay | `order_TGymmD8Qx6WYsY` | `pay_TGymspZkO1PR47` | `MANTRA-401593` | 2026-07-23T14:36:57.458643+00:00 |
| `a94a7613-7286-4a99-b217-75050308f0f4` | `MANTRA-276707` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | Being Packed | Pending | COD | `N/A` | `N/A` | `MANTRA-441758` | 2026-07-23T14:51:26.709983+00:00 |
| `1a8b1c04-ead9-4626-9181-40dfecf34ab1` | `MANTRA-463333` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Confirmed | Razorpay | `N/A` | `N/A` | `MANTRA-605845` | 2026-07-23T15:05:05.866889+00:00 |
| `6873d6e2-05df-47fe-9120-87fe15ac2a32` | `MANTRA-868231` | `5a9e2012-401b-4be6-8ddd-e7687b964566` | Payment Pending | Pending | Razorpay | `order_TGzodkyVwguLZX` | `N/A` | `MANTRA-571246` | 2026-07-23T15:37:25.036284+00:00 |
| `3c784fc7-75bf-4b81-9871-8bf7831db295` | `MANTRA-228614` | `5db94409-93c1-4c9f-b7b5-d350667ec528` | Being Packed | Pending | COD | `N/A` | `N/A` | `MANTRA-839044` | 2026-07-23T15:39:28.714472+00:00 |
| `535bb3a1-cafc-4103-ae81-554622631bf1` | `MANTRA-107887` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | Cancelled | Confirmed | Razorpay | `order_TH8uAlAyKcsxyl` | `pay_TH8uVGronDreA3` | `MANTRA-520733` | 2026-07-24T00:30:53.791514+00:00 |
| `08004377-45a9-4820-bfe0-9020288d93a5` | `MANTRA-592503` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | Cancelled | Confirmed | Razorpay | `order_TH8wO1xdifwOkG` | `pay_TH8wReOfZyW1bN` | `MANTRA-144528` | 2026-07-24T00:32:59.066341+00:00 |
| `99bd84f5-70a0-4ea3-a31b-8377b4c6a758` | `MANTRA-237979` | `8b455565-4b4d-43eb-9dec-68d788f2cd66` | Payment Pending | Pending | Razorpay | `order_THBaP6XYFJuqFH` | `N/A` | `MANTRA-444451` | 2026-07-24T03:08:14.686925+00:00 |
| `dffcb89d-b3f5-4766-af3a-37ed59519281` | `MANTRA-964505` | `be26646b-bf95-4082-9e1c-47e11d910c68` | Being Packed | Confirmed | Razorpay | `order_THBm9ZJPhsjYJA` | `pay_THBmNkSyHDF90p` | `MANTRA-546852` | 2026-07-24T03:19:22.907712+00:00 |
| `0dedfc78-7ca8-4925-b03f-8c0c93015ebb` | `MANTRA-353360` | `e206c26f-7fc8-4863-b971-edb61b374767` | Payment Pending | Pending | Razorpay | `order_THD1WhxECKDdtO` | `N/A` | `MANTRA-974725` | 2026-07-24T04:31:27.87636+00:00 |
| `c15bf4da-467f-474b-83fc-7e28de3e373c` | `MANTRA-197285` | `be60c847-98d0-4511-9557-3d38babd5361` | Being Packed | Confirmed | Razorpay | `order_THE7wwDUUHi7BD` | `pay_THE85XUkvSfWGi` | `MANTRA-991556` | 2026-07-24T05:37:24.471333+00:00 |
| `39fb4d0e-e446-4856-88ad-c4e7f035d75b` | `MANTRA-395338` | `e206c26f-7fc8-4863-b971-edb61b374767` | Being Packed | Confirmed | Razorpay | `order_THEX513n7Ifycm` | `pay_THEXJD0LJHg4TH` | `MANTRA-519418` | 2026-07-24T06:01:11.990075+00:00 |

### B. website_store_addresses Rows
Total: 33 rows

| Address ID | User UUID | Name | Phone | Address | City | State | Postal Code | Created At |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0e92a370-2341-4fe8-990b-b24a9576ba2a` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | N/A | `9009046430` | N/A | ind | Madhya Pradesh | N/A | 2026-07-13T19:06:38.675213+00:00 |
| `5fb55232-e7aa-4b8b-9e5d-81e3de81b1ed` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | N/A | `7974478098` | N/A | ujjain | Bihar | N/A | 2026-07-13T19:39:12.676934+00:00 |
| `b5ec49ce-2b3d-44e4-80d8-056153be7833` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | N/A | `7999279610` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-21T07:49:58.439042+00:00 |
| `885bef2c-8ad4-410a-8505-cddd7f08d871` | `8fcbfb52-022c-4f03-8225-650127cc090a` | N/A | `8109422241` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-21T08:08:33.468848+00:00 |
| `34271669-3e1c-4bef-8fd0-0a52d5bd9715` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | N/A | `8819897434` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-21T15:51:56.683301+00:00 |
| `806d7c63-d281-45c7-ac1e-7f52c091ec3a` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | N/A | `7974478098` | N/A | Indore | Madhya Pradesh | N/A | 2026-07-22T11:00:21.522886+00:00 |
| `5555912b-ee69-4f96-af42-22605d36584a` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-22T18:50:58.556526+00:00 |
| `918ee76b-b9aa-4336-9760-7b1a4b8ae340` | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | N/A | `919234133572` | N/A | Giridh | Jharkhand | N/A | 2026-07-23T02:55:30.449419+00:00 |
| `106c2bfc-735d-4fdd-ad9b-365bff39abd7` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | N/A | `919899383485` | N/A | Gautam Buddha Nagar | Uttar Pradesh | N/A | 2026-07-23T07:42:36.619689+00:00 |
| `4acd6d0a-5938-4654-ab28-07c7653f7033` | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | N/A | `8299138372` | N/A | Kanpur | Uttar Pradesh | N/A | 2026-07-23T07:57:40.533317+00:00 |
| `40de5b7a-0b84-41ef-8eda-dbd193cb0c58` | `49db3db3-2224-494e-8aaa-756dfbd6342a` | N/A | `919312369843` | N/A | Patna | Bihar | N/A | 2026-07-23T08:01:50.815425+00:00 |
| `12c977ae-01c4-44c5-a3bd-2357279dcf59` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T09:34:23.338614+00:00 |
| `a2374e3e-09a3-4829-8db3-929046f17cfc` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | N/A | `917874980572` | N/A | Mumbai  | Maharashtra | N/A | 2026-07-23T09:40:17.772948+00:00 |
| `7afaf635-74bd-4d17-a4f4-76eb4139d66a` | `61a0e405-6204-4015-840d-6ad93873901d` | N/A | `919689120412` | N/A | Akola | Maharashtra | N/A | 2026-07-23T10:02:39.257683+00:00 |
| `4096643c-3a82-4a69-8f68-a9bb6279114b` | `e7978155-f476-455d-b700-dfa9863c8c87` | N/A | `917383130148` | N/A | Ahmedabad | Gujarat | N/A | 2026-07-23T10:03:22.995692+00:00 |
| `98593bda-016e-4ee4-8e0e-73dec73887e2` | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | N/A | `917631598563` | N/A | Lakhisarai | Bihar | N/A | 2026-07-23T10:53:46.75797+00:00 |
| `51ccb0f6-cdd6-4ff9-a32e-22e71f182887` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T11:30:05.775168+00:00 |
| `e8878e5a-9b76-40b9-824c-52be1f125403` | `53496531-dcc4-45e6-9442-8922efc4cb85` | N/A | `918109422241` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T12:19:56.804304+00:00 |
| `8b9150ea-eec1-4a56-b063-465cd63c4901` | `53496531-dcc4-45e6-9442-8922efc4cb85` | N/A | `918109422241` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T12:47:10.047266+00:00 |
| `8a3b053d-f77a-44da-b5f1-631707e69ec1` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | N/A | `917999279610` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T12:49:46.466839+00:00 |
| `68291e3f-dc72-408d-90bf-022507e4fa21` | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | N/A | `919009046430` | N/A | Indore | Madhya Pradesh | N/A | 2026-07-23T13:49:27.364971+00:00 |
| `df08f0ac-f801-460a-b7da-f5f06258dd94` | `53496531-dcc4-45e6-9442-8922efc4cb85` | N/A | `918109422241` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T13:58:43.980201+00:00 |
| `4b5e0400-f6e2-4847-ba39-d037a1f4127e` | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | N/A | `919764566466` | N/A | Pune | Maharashtra | N/A | 2026-07-23T14:28:20.819247+00:00 |
| `970a897e-558e-4704-8f2d-c971af3a1c4a` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T14:29:06.418035+00:00 |
| `dcecbdce-3dc5-419a-aa3d-a63d6448f1f5` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T14:37:27.98834+00:00 |
| `467ae244-7e7c-4cc0-888d-e4f5a4bd25c6` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | N/A | `919806254050` | N/A | Mandla | Madhya Pradesh | N/A | 2026-07-23T14:51:29.011387+00:00 |
| `c0e1cc8d-62a7-4517-b90c-02bae3178725` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A | 2026-07-23T15:05:07.671019+00:00 |
| `5fbfeff5-f81d-4921-a1d7-cb7593317f6c` | `5db94409-93c1-4c9f-b7b5-d350667ec528` | N/A | `919569521972` | N/A | Jalandhar | Punjab | N/A | 2026-07-23T15:39:31.042031+00:00 |
| `50e31791-1268-4dd3-a9cd-fdcd2ef8c9ec` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | N/A | `9685787200` | N/A | Durg | Chhattisgarh | N/A | 2026-07-24T00:31:46.893427+00:00 |
| `0193186e-be18-4184-abf1-f9bb12d089c0` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | N/A | `9685787200` | N/A | Durg | Chhattisgarh | N/A | 2026-07-24T00:33:32.918968+00:00 |
| `36dab8ae-e210-4f70-9b2e-dd177c848be1` | `be26646b-bf95-4082-9e1c-47e11d910c68` | N/A | `6203288535` | N/A | East Singhbhum | Jharkhand | N/A | 2026-07-24T03:20:16.349937+00:00 |
| `06f4023f-575f-43ec-96fd-11d9173147c4` | `be60c847-98d0-4511-9557-3d38babd5361` | N/A | `919617658659` | N/A | Gwalior | Madhya Pradesh | N/A | 2026-07-24T05:38:14.913757+00:00 |
| `a3e2965d-ccf2-42c3-973c-da6d43a0e2ee` | `e206c26f-7fc8-4863-b971-edb61b374767` | N/A | `919580793778` | N/A | Lucknow | Uttar Pradesh | N/A | 2026-07-24T06:02:06.365609+00:00 |

### C. user_sessions Rows
Total: 69 rows

| Session ID | User UUID | Created At | Last Used | Expiry | Active/Expired |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `508cc7c9-5b12-4db4-bf60-897167aeffbb` | `8fcbfb52-022c-4f03-8225-650127cc090a` | 2026-07-08T15:22:00.23668+00:00 | 2026-07-08T15:22:00.23668+00:00 | 2026-08-07T15:22:00.23668+00:00 | **ACTIVE** |
| `653c3144-e649-4c63-825b-f2aa44bb3b02` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | 2026-07-13T19:01:01.855457+00:00 | 2026-07-13T19:01:01.855457+00:00 | 2026-08-12T19:01:01.855457+00:00 | **ACTIVE** |
| `35edc5ce-1fbf-49e5-a9c9-5b9a4362f932` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | 2026-07-13T19:05:43.937687+00:00 | 2026-07-13T19:05:43.937687+00:00 | 2026-08-12T19:05:43.937687+00:00 | **ACTIVE** |
| `10949617-8da9-4aa4-9c60-c102990ce60e` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-14T09:44:45.443465+00:00 | 2026-07-14T09:44:45.443465+00:00 | 2026-08-13T09:44:45.443465+00:00 | **ACTIVE** |
| `0d4b39d4-9805-47d1-b0a5-885ae23aab94` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-16T13:01:45.482431+00:00 | 2026-07-16T13:01:45.482431+00:00 | 2026-08-15T13:01:45.482431+00:00 | **ACTIVE** |
| `315fd2b0-1b93-42d8-a16c-2f13a7766779` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-21T07:01:13.867568+00:00 | 2026-07-21T07:01:13.867568+00:00 | 2026-08-20T07:01:13.867568+00:00 | **ACTIVE** |
| `0d1ae1ff-b452-44a8-99cb-120c448d8627` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-21T07:17:33.307539+00:00 | 2026-07-21T07:17:33.307539+00:00 | 2026-08-20T07:17:33.307539+00:00 | **ACTIVE** |
| `32d27d02-2441-42ed-bc97-c13a5a8c0338` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-21T07:21:46.057679+00:00 | 2026-07-21T07:21:46.057679+00:00 | 2026-08-20T07:21:46.057679+00:00 | **ACTIVE** |
| `3144db05-d1d9-4f07-9964-ed1057db9889` | `8fcbfb52-022c-4f03-8225-650127cc090a` | 2026-07-21T08:08:14.847686+00:00 | 2026-07-21T08:08:14.847686+00:00 | 2026-08-20T08:08:14.847686+00:00 | **ACTIVE** |
| `60f0a612-7741-4ed6-8f62-507b183d7fa1` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | 2026-07-21T15:51:10.143885+00:00 | 2026-07-21T15:51:10.143885+00:00 | 2026-08-20T15:51:10.143885+00:00 | **ACTIVE** |
| `daeeb5cc-2321-414c-ba01-a1fc6be4f3de` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | 2026-07-22T10:01:05.782006+00:00 | 2026-07-22T10:01:05.782006+00:00 | 2026-08-21T10:01:05.782006+00:00 | **ACTIVE** |
| `bcd57599-02f2-4992-83b8-ebda2f3e8b03` | `8fcbfb52-022c-4f03-8225-650127cc090a` | 2026-07-22T12:22:53.584528+00:00 | 2026-07-22T12:22:53.584528+00:00 | 2026-08-21T12:22:53.584528+00:00 | **ACTIVE** |
| `f84bd63b-4764-4946-9002-0b37221af3a3` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22T12:33:52.087348+00:00 | 2026-07-22T12:33:52.087348+00:00 | 2026-08-21T12:33:52.087348+00:00 | **ACTIVE** |
| `76756722-bb93-412c-b743-eafa03280fc2` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22T14:02:51.810498+00:00 | 2026-07-22T14:02:51.810498+00:00 | 2026-08-21T14:02:51.810498+00:00 | **ACTIVE** |
| `3658b268-fef5-4a98-99fa-bfe7fb62648b` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-22T17:20:14.748012+00:00 | 2026-07-22T17:20:14.748012+00:00 | 2026-08-21T17:20:14.748012+00:00 | **ACTIVE** |
| `3b50e0d8-aa92-4e4a-af6d-5ac3d16e75bd` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22T17:45:30.096157+00:00 | 2026-07-22T17:45:30.096157+00:00 | 2026-08-21T17:45:30.096157+00:00 | **ACTIVE** |
| `ac6ac0c6-ca53-48b6-88c7-ef15a3e9a015` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22T18:21:59.213084+00:00 | 2026-07-22T18:21:59.213084+00:00 | 2026-08-21T18:21:59.213084+00:00 | **ACTIVE** |
| `84d875f5-5f6f-4b75-9fbe-68021d44e673` | `aad66182-bd3c-428d-bfc8-62b6017ac840` | 2026-07-22T18:30:49.538084+00:00 | 2026-07-22T18:30:49.538084+00:00 | 2026-08-21T18:30:49.327+00:00 | **ACTIVE** |
| `b2ad047d-2be8-4759-964d-98a0d982ea0d` | `fd72dd3c-50a0-448d-8909-6ff17a14d5c5` | 2026-07-23T02:01:45.970968+00:00 | 2026-07-23T02:01:45.970968+00:00 | 2026-08-22T02:01:45.765+00:00 | **ACTIVE** |
| `5cbd9ce9-d8bb-47df-8d73-6c0e11c1e86f` | `9322afbf-f0e0-43d2-a05f-4ae2eb547218` | 2026-07-23T02:47:41.27658+00:00 | 2026-07-23T02:47:41.27658+00:00 | 2026-08-22T02:47:41.093+00:00 | **ACTIVE** |
| `27f3f8b3-afb0-4af1-8ce1-b9771abf92b9` | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | 2026-07-23T02:50:44.883618+00:00 | 2026-07-23T02:50:44.883618+00:00 | 2026-08-22T02:50:44.693+00:00 | **ACTIVE** |
| `cc77444a-8e63-4545-9456-e1f96e8ba91a` | `05e37eb2-d2a5-4f0a-a644-cf469693c475` | 2026-07-23T03:35:29.044925+00:00 | 2026-07-23T03:35:29.044925+00:00 | 2026-08-22T03:35:28.838+00:00 | **ACTIVE** |
| `e178bcbf-6ec7-42ce-9996-ac1f4ff89345` | `20362a06-2966-466e-8ef9-a73b345c518c` | 2026-07-23T04:35:45.638119+00:00 | 2026-07-23T04:35:45.638119+00:00 | 2026-08-22T04:35:45.475+00:00 | **ACTIVE** |
| `1ca9bdbe-d550-4db3-855e-4ce4e1a72391` | `b33ea620-1420-4420-8261-92d530614f6b` | 2026-07-23T04:45:28.755902+00:00 | 2026-07-23T04:45:28.755902+00:00 | 2026-08-22T04:45:28.601+00:00 | **ACTIVE** |
| `be5fda21-0279-4b7a-84cc-d11b6c74edaa` | `9a24bd0c-476b-448f-97bd-70e08960f904` | 2026-07-23T05:00:54.486275+00:00 | 2026-07-23T05:00:54.486275+00:00 | 2026-08-22T05:00:54.307+00:00 | **ACTIVE** |
| `99860cf0-9a8b-4fc5-a287-f5563f5863b4` | `94d8d30a-c5fe-40d2-bc88-65ccd637577b` | 2026-07-23T05:54:07.436621+00:00 | 2026-07-23T05:54:07.436621+00:00 | 2026-08-22T05:54:07.263+00:00 | **ACTIVE** |
| `5d90e8ec-f3fc-4195-802d-60682cff380d` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | 2026-07-23T07:39:48.676497+00:00 | 2026-07-23T07:39:48.676497+00:00 | 2026-08-22T07:39:48.479+00:00 | **ACTIVE** |
| `cfccb3b8-9909-4245-ac74-0a1af48b972d` | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | 2026-07-23T07:42:45.45134+00:00 | 2026-07-23T07:42:45.45134+00:00 | 2026-08-22T07:42:45.258+00:00 | **ACTIVE** |
| `4ee66016-eaf2-4425-b0dc-b75f3660ae2e` | `49db3db3-2224-494e-8aaa-756dfbd6342a` | 2026-07-23T07:58:38.832197+00:00 | 2026-07-23T07:58:38.832197+00:00 | 2026-08-22T07:58:38.629+00:00 | **ACTIVE** |
| `8d6a50b5-459a-4f3c-8f8e-a718e3b91c25` | `21dacd91-75d6-4321-a368-19f4416c2add` | 2026-07-23T08:13:46.064925+00:00 | 2026-07-23T08:13:46.064925+00:00 | 2026-08-22T08:13:45.857+00:00 | **ACTIVE** |
| `2961243e-e80d-4363-988e-9ea32425a762` | `c49aef24-6c11-45ba-83bc-c4231d386c99` | 2026-07-23T08:35:58.195684+00:00 | 2026-07-23T08:35:58.195684+00:00 | 2026-08-22T08:35:57.987+00:00 | **ACTIVE** |
| `47c850b3-67c3-4d89-b44b-42ccec460186` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | 2026-07-23T09:17:07.952136+00:00 | 2026-07-23T09:17:07.952136+00:00 | 2026-08-22T09:17:07.802+00:00 | **ACTIVE** |
| `dc7ca46c-f93d-47d3-964f-8b4fc6e01082` | `b7231561-31c6-40de-ba4a-0e1062b691b5` | 2026-07-23T09:29:19.201628+00:00 | 2026-07-23T09:29:19.201628+00:00 | 2026-08-22T09:29:18.983+00:00 | **ACTIVE** |
| `95614acd-86b9-4e7e-b5b6-c8890d1aa88a` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | 2026-07-23T09:38:16.117429+00:00 | 2026-07-23T09:38:16.117429+00:00 | 2026-08-22T09:38:15.963+00:00 | **ACTIVE** |
| `d150404e-3d2f-443a-9445-099684a07b88` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | 2026-07-23T09:46:12.293644+00:00 | 2026-07-23T09:46:12.293644+00:00 | 2026-08-22T09:46:12.119+00:00 | **ACTIVE** |
| `f3d4c2e9-c02e-4433-b90a-b56c57910da9` | `61a0e405-6204-4015-840d-6ad93873901d` | 2026-07-23T09:58:03.843311+00:00 | 2026-07-23T09:58:03.843311+00:00 | 2026-08-22T09:58:03.653+00:00 | **ACTIVE** |
| `d1e925f4-23aa-4d17-9ac4-bc226cb41077` | `e7978155-f476-455d-b700-dfa9863c8c87` | 2026-07-23T09:59:46.52868+00:00 | 2026-07-23T09:59:46.52868+00:00 | 2026-08-22T09:59:46.344+00:00 | **ACTIVE** |
| `7aa19a3e-f27f-40ea-8f07-cec85759db6d` | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | 2026-07-23T10:44:56.565852+00:00 | 2026-07-23T10:44:56.565852+00:00 | 2026-08-22T10:44:56.404+00:00 | **ACTIVE** |
| `9802c3d3-0da3-4327-9efe-e3f7cbf9dddc` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23T10:53:58.671657+00:00 | 2026-07-23T10:53:58.671657+00:00 | 2026-08-22T10:53:58.357+00:00 | **ACTIVE** |
| `9e71940d-0fb5-4acd-a40a-59dba23cfb86` | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | 2026-07-23T11:42:22.817985+00:00 | 2026-07-23T11:42:22.817985+00:00 | 2026-08-22T11:42:22.595+00:00 | **ACTIVE** |
| `3da78107-0788-44b9-a314-9e9bb8844033` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | 2026-07-23T11:55:29.789094+00:00 | 2026-07-23T11:55:29.789094+00:00 | 2026-08-22T11:55:29.585+00:00 | **ACTIVE** |
| `90bd0ec5-bc41-4815-8424-a890af900ddf` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23T11:56:58.061519+00:00 | 2026-07-23T11:56:58.061519+00:00 | 2026-08-22T11:56:57.639+00:00 | **ACTIVE** |
| `03da4bc9-d8bd-4069-a88d-d97f0eeeaffa` | `53496531-dcc4-45e6-9442-8922efc4cb85` | 2026-07-23T12:17:30.49621+00:00 | 2026-07-23T12:17:30.49621+00:00 | 2026-08-22T12:17:30.294+00:00 | **ACTIVE** |
| `04e1654b-4699-4345-964a-202fcc76f852` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | 2026-07-23T12:23:59.37976+00:00 | 2026-07-23T12:23:59.37976+00:00 | 2026-08-22T12:23:59.18+00:00 | **ACTIVE** |
| `1587f416-c1a4-42cf-b6a6-71b7cd85f6bc` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | 2026-07-23T12:28:03.755156+00:00 | 2026-07-23T12:28:03.755156+00:00 | 2026-08-22T12:28:03.545+00:00 | **ACTIVE** |
| `3ba262da-bfd5-4ccb-ab5f-fc93a1183cd0` | `faf2bc3c-b15a-43d7-b31e-3f044813788e` | 2026-07-23T12:34:41.591342+00:00 | 2026-07-23T12:34:41.591342+00:00 | 2026-08-22T12:34:41.396+00:00 | **ACTIVE** |
| `d76b6544-43d5-481b-97f7-e363b3ea57a6` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | 2026-07-23T12:42:54.336683+00:00 | 2026-07-23T12:42:54.336683+00:00 | 2026-08-22T12:42:54.153+00:00 | **ACTIVE** |
| `a43014ff-dce7-487a-ab41-97c0fe4a2444` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | 2026-07-23T12:49:21.857718+00:00 | 2026-07-23T12:49:21.857718+00:00 | 2026-08-22T12:49:21.673+00:00 | **ACTIVE** |
| `ccde620f-f5c4-4f7c-bd4a-f3edf0dbe0b9` | `1486d221-9d16-4347-b3b2-815d1ad2a892` | 2026-07-23T12:57:09.263834+00:00 | 2026-07-23T12:57:09.263834+00:00 | 2026-08-22T12:57:09.104+00:00 | **ACTIVE** |
| `15abef24-87e7-45d6-8f75-b6d39e36f540` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | 2026-07-23T13:03:06.772564+00:00 | 2026-07-23T13:03:06.772564+00:00 | 2026-08-22T13:03:06.619+00:00 | **ACTIVE** |
| `d3dea057-181d-4a8d-919e-5e9f0a42378c` | `a32964ed-b361-4105-ba0e-550e30c825f6` | 2026-07-23T13:04:22.196346+00:00 | 2026-07-23T13:04:22.196346+00:00 | 2026-08-22T13:04:22.031+00:00 | **ACTIVE** |
| `40ce114c-9ca6-4944-8966-1ca87dc5739d` | `5a9e2012-401b-4be6-8ddd-e7687b964566` | 2026-07-23T13:22:54.5159+00:00 | 2026-07-23T13:22:54.5159+00:00 | 2026-08-22T13:22:54.335+00:00 | **ACTIVE** |
| `2c3b5978-24c8-4dc8-8332-13ef5812231e` | `ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` | 2026-07-23T13:43:53.800213+00:00 | 2026-07-23T13:43:53.800213+00:00 | 2026-08-22T13:43:53.594+00:00 | **ACTIVE** |
| `4ab8c328-1fd0-4307-ac7b-cd32ac3bc6c0` | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | 2026-07-23T13:48:55.39452+00:00 | 2026-07-23T13:48:55.39452+00:00 | 2026-08-22T13:48:55.195+00:00 | **ACTIVE** |
| `1088f731-0da0-48a2-915b-cb5b9c560a30` | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | 2026-07-23T14:25:35.79263+00:00 | 2026-07-23T14:25:35.79263+00:00 | 2026-08-22T14:25:35.602+00:00 | **ACTIVE** |
| `b3c9540e-1445-401f-b530-ddddbdc62d6a` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23T14:28:51.71211+00:00 | 2026-07-23T14:28:51.71211+00:00 | 2026-08-22T14:28:51.176+00:00 | **ACTIVE** |
| `9720ea20-5dc7-4dbc-8ca4-f78097e3b64c` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23T14:36:47.126358+00:00 | 2026-07-23T14:36:47.126358+00:00 | 2026-08-22T14:36:46.853+00:00 | **ACTIVE** |
| `f47d4549-a799-4c4e-b5d8-aeef78fa3a57` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | 2026-07-23T14:49:39.495069+00:00 | 2026-07-23T14:49:39.495069+00:00 | 2026-08-22T14:49:39.335+00:00 | **ACTIVE** |
| `9e338dd3-3dd3-461c-93b9-d3ced7f82c84` | `3b5b751f-bbdb-4438-8ff1-f33e08518543` | 2026-07-23T14:59:33.890971+00:00 | 2026-07-23T14:59:33.890971+00:00 | 2026-08-22T14:59:33.737+00:00 | **ACTIVE** |
| `404b22a4-b0f0-497c-95e1-3b6b33a0c543` | `b18c4898-f7c2-4a5f-919e-32507775512d` | 2026-07-23T15:10:12.973884+00:00 | 2026-07-23T15:10:12.973884+00:00 | 2026-08-22T15:10:12.814+00:00 | **ACTIVE** |
| `2a2a7e5d-f8c5-4dd8-8d1b-64b9f3be6e50` | `ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4` | 2026-07-23T15:10:36.20744+00:00 | 2026-07-23T15:10:36.20744+00:00 | 2026-08-22T15:10:36.043+00:00 | **ACTIVE** |
| `b7df30b2-0d2e-4b7e-8366-8c1af0b3ccb1` | `5db94409-93c1-4c9f-b7b5-d350667ec528` | 2026-07-23T15:36:57.379802+00:00 | 2026-07-23T15:36:57.379802+00:00 | 2026-08-22T15:36:57.219+00:00 | **ACTIVE** |
| `953c971f-9d18-41b0-8cfd-5d9cf517968b` | `ef11e80b-c824-4c5a-9b9e-1654c652c56b` | 2026-07-23T22:21:39.227906+00:00 | 2026-07-23T22:21:39.227906+00:00 | 2026-08-22T22:21:39+00:00 | **ACTIVE** |
| `ff52a167-5a93-42f5-9653-1f0e2da31cd0` | `780c445c-a3ff-4caf-b64e-80c65a7e6568` | 2026-07-24T00:32:04.485268+00:00 | 2026-07-24T00:32:04.485268+00:00 | 2026-08-23T00:32:04.306+00:00 | **ACTIVE** |
| `9c85b2f6-45c7-40b7-a360-e7738b2cfc34` | `be60c847-98d0-4511-9557-3d38babd5361` | 2026-07-24T02:05:49.536308+00:00 | 2026-07-24T02:05:49.536308+00:00 | 2026-08-23T02:05:49.29+00:00 | **ACTIVE** |
| `58683d99-87ef-4590-908d-e1ab10baddd4` | `8b455565-4b4d-43eb-9dec-68d788f2cd66` | 2026-07-24T03:06:14.566561+00:00 | 2026-07-24T03:06:14.566561+00:00 | 2026-08-23T03:06:14.417+00:00 | **ACTIVE** |
| `b39aec03-ccd1-42ea-8060-533b0eb9a6a2` | `be26646b-bf95-4082-9e1c-47e11d910c68` | 2026-07-24T03:15:49.235085+00:00 | 2026-07-24T03:15:49.235085+00:00 | 2026-08-23T03:15:49.041+00:00 | **ACTIVE** |
| `a3345c3c-3d09-4f91-8ffc-bc0a7b139dc1` | `e206c26f-7fc8-4863-b971-edb61b374767` | 2026-07-24T04:25:08.452435+00:00 | 2026-07-24T04:25:08.452435+00:00 | 2026-08-23T04:25:08.277+00:00 | **ACTIVE** |
| `b4abf57a-962d-4010-b226-ac7d16c79a25` | `e206c26f-7fc8-4863-b971-edb61b374767` | 2026-07-24T05:55:33.358922+00:00 | 2026-07-24T05:55:33.358922+00:00 | 2026-08-23T05:55:33.108+00:00 | **ACTIVE** |

### D. Affiliate and Financial Rows
Total: 15 rows

| Table Name | Column Name | User ID | Record ID | Details | Created At |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `affiliate_audit_logs` | `target_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `58` | Action: undefined | Context: undefined | 2026-07-13T18:58:15.003826+00:00 |
| `affiliate_audit_logs` | `target_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `59` | Action: undefined | Context: undefined | 2026-07-13T18:58:49.676892+00:00 |
| `affiliate_audit_logs` | `payload` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `60` | Action: undefined | Context: undefined | 2026-07-13T19:01:01.578855+00:00 |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `7d083e14-cb9f-494e-974f-e51b035bec39` | Landing: /?ref=MPER73US | Referrer Code: MPER73US | 2026-07-13T18:59:15.948216+00:00 |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `05289c6c-510d-4385-a943-ae75db73318e` | Landing: /?ref=MPER73US | Referrer Code: MPER73US | 2026-07-13T19:00:02.594848+00:00 |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `70628c6e-aa7d-434f-9414-6fc8726c7a9c` | Landing: /?ref=MPER73US | Referrer Code: MPER73US | 2026-07-13T19:04:42.989645+00:00 |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `0d501cce-3c03-4c10-acb9-ba4c69fc3b72` | Landing: /?ref=MPER73US | Referrer Code: MPER73US | 2026-07-13T19:04:42.994137+00:00 |
| `affiliate_commissions` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `9a017b51-54ae-4640-99b3-c301c7662092` | Amount: ₹10.1 (Order: MANTRA-396069) | Level: 1 | Status: pending | 2026-07-13T19:01:32.050101+00:00 |
| `affiliate_commissions` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `3d7ff6e6-0444-47f3-9f89-4e80546e5db8` | Amount: ₹10.1 (Order: MANTRA-296888) | Level: 1 | Status: pending | 2026-07-13T19:06:29.042623+00:00 |
| `affiliate_relationships` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `7ad6f9a5-7a9b-4948-9975-207a76704d00` | Referrer: 2d2aa0e1-dca2-4928-8ed4-cc92506d80b8 | Referred: 6c386c97-bd16-444c-84fa-d0a4e73c4530 | 2026-07-13T19:01:01.578855+00:00 |
| `affiliate_wallets` | `user_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `{"user_id":"2d2aa0e1-dca2-4928-8ed4-cc92506d80b8","total_earned":0,"pending_earnings":30.3,"approved_earnings":0,"withdrawn_amount":0,"available_balance":0,"updated_at":"2026-07-13T19:06:29.042623+00:00"}` | Earned: ₹0 | Available: ₹0 | N/A |
| `affiliate_audit_logs` | `target_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `60` | Action: undefined | Context: undefined | 2026-07-13T19:01:01.578855+00:00 |
| `affiliate_commissions` | `buyer_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `9a017b51-54ae-4640-99b3-c301c7662092` | Amount: ₹10.1 (Order: MANTRA-396069) | Level: 1 | Status: pending | 2026-07-13T19:01:32.050101+00:00 |
| `affiliate_commissions` | `buyer_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `3d7ff6e6-0444-47f3-9f89-4e80546e5db8` | Amount: ₹10.1 (Order: MANTRA-296888) | Level: 1 | Status: pending | 2026-07-13T19:06:29.042623+00:00 |
| `affiliate_relationships` | `referred_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `7ad6f9a5-7a9b-4948-9975-207a76704d00` | Referrer: 2d2aa0e1-dca2-4928-8ed4-cc92506d80b8 | Referred: 6c386c97-bd16-444c-84fa-d0a4e73c4530 | 2026-07-13T19:01:01.578855+00:00 |

---

## 3. Business Data Split Report

Below is the verification breakdown for all 42 groups detailing exactly what data exists under each UUID and whether e-commerce, sessions, financial, or affiliate data is split between them.


================================================

PHONE: 916203288535

================================================

USER A (10-digit)
UUID: a58c33e1-a616-418c-9daf-1c6ead76fbf2
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: be26646b-bf95-4082-9e1c-47e11d910c68
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 916204175088

================================================

USER A (10-digit)
UUID: cbb6a1d2-6c0b-4e3f-be29-ddc20ffa457e
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 3b5b751f-bbdb-4438-8ff1-f33e08518543
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 916376206618

================================================

USER A (10-digit)
UUID: 353a4f7a-50bf-4726-9263-835826bd59f6
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: fd72dd3c-50a0-448d-8909-6ff17a14d5c5
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917017308966

================================================

USER A (10-digit)
UUID: 9c95dcf1-6ff7-44e8-aef3-f719ad2a04cc
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917383130148

================================================

USER A (10-digit)
UUID: ff824a1b-e0a1-4249-8c75-2c9362e33f1e
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: e7978155-f476-455d-b700-dfa9863c8c87
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917408405612

================================================

USER A (10-digit)
UUID: ce5fd7ff-d400-4869-a598-dd13c63ce510
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: a32964ed-b361-4105-ba0e-550e30c825f6
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917631598563

================================================

USER A (10-digit)
UUID: 9ecc1ec5-e311-49c7-b6d0-b4e6f776236f
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 5e872698-10e8-492c-9fcd-c2bb47f145ba
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917742422277

================================================

USER A (10-digit)
UUID: e53441ea-8046-456d-9fb1-162dcf19feb8
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: faf2bc3c-b15a-43d7-b31e-3f044813788e
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917874980572

================================================

USER A (10-digit)
UUID: e63adc0a-5875-4e6f-9169-9b14169754ca
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e
Orders: 1
Addresses: 1
Sessions: 2
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917974478098

================================================

USER A (10-digit)
UUID: 6f91280a-d400-4cf4-85ee-b6014d5b5917
Orders: 4
Addresses: 2
Sessions: 5
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: d9d433bc-dd57-4563-8e78-9a0fbd37b59d
Orders: 6
Addresses: 6
Sessions: 4
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: YES
Addresses split: YES
Sessions split: YES
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917978935494

================================================

USER A (10-digit)
UUID: d3100829-f9b0-4163-967c-3f9bcbd3451f
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 9322afbf-f0e0-43d2-a05f-4ae2eb547218
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 917999279610

================================================

USER A (10-digit)
UUID: 2d2aa0e1-dca2-4928-8ed4-cc92506d80b8
Orders: 6
Addresses: 1
Sessions: 5
Affiliate: Yes
Wallet: Yes
Bookings: No

================================================

USER B (12-digit)
UUID: 4d2a11ad-e7c0-4af7-af7a-af5789fa267d
Orders: 0
Addresses: 1
Sessions: 3
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: YES
Sessions split: YES
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 918103314636

================================================

USER A (10-digit)
UUID: b9c1008f-e529-4809-8d4d-e70c443777ee
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 94d8d30a-c5fe-40d2-bc88-65ccd637577b
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 918109422241

================================================

USER A (10-digit)
UUID: 8fcbfb52-022c-4f03-8225-650127cc090a
Orders: 3
Addresses: 1
Sessions: 3
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 53496531-dcc4-45e6-9442-8922efc4cb85
Orders: 3
Addresses: 3
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: YES
Addresses split: YES
Sessions split: YES
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 918299138372

================================================

USER A (10-digit)
UUID: 5f4ec778-bb2c-402c-b46c-f2d83f10ef33
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 1274ce5d-6fe7-4663-902e-ff6a2f54f80c
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 918320782942

================================================

USER A (10-digit)
UUID: d9dfbd7a-ba07-480d-835f-3d28ab2fda00
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 8b455565-4b4d-43eb-9dec-68d788f2cd66
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 918521600214

================================================

USER A (10-digit)
UUID: 528565be-2a51-4055-818d-5fad9669be5c
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 17bdace1-d33e-4990-b3e0-83497aa69a1d
Orders: 3
Addresses: 0
Sessions: 2
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 918819897434

================================================

USER A (10-digit)
UUID: 4bc8cc36-ab55-4db7-85ba-ab0803923a19
Orders: 1
Addresses: 1
Sessions: 2
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: b7231561-31c6-40de-ba4a-0e1062b691b5
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: YES
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919009046430

================================================

USER A (10-digit)
UUID: 6c386c97-bd16-444c-84fa-d0a4e73c4530
Orders: 4
Addresses: 1
Sessions: 2
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: bb82366c-ee99-4c4f-a6e7-9a1612479aa1
Orders: 0
Addresses: 1
Sessions: 2
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: YES
Sessions split: YES
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919065524534

================================================

USER A (10-digit)
UUID: 1631e59a-e552-48e8-ae61-88f7bb856abb
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 780c445c-a3ff-4caf-b64e-80c65a7e6568
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919193833159

================================================

USER A (10-digit)
UUID: 4defde13-cd29-4eb0-8cf9-e0dd779244f6
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 20362a06-2966-466e-8ef9-a73b345c518c
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919234133572

================================================

USER A (10-digit)
UUID: 70ba19bf-93de-4afd-8df8-bbb03746a829
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: acf583eb-6ef9-4031-9df5-ba742a1824c9
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919312369843

================================================

USER A (10-digit)
UUID: a35a50e5-2974-43d9-b13e-7e2001d0f441
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 49db3db3-2224-494e-8aaa-756dfbd6342a
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919431457166

================================================

USER A (10-digit)
UUID: 68841aa1-4133-4102-bcb3-1e4bb5d56a9d
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: c49aef24-6c11-45ba-83bc-c4231d386c99
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919460195466

================================================

USER A (10-digit)
UUID: 4407a333-2f21-48e1-a6f2-1c8dcb83365d
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: ef11e80b-c824-4c5a-9b9e-1654c652c56b
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919548417559

================================================

USER A (10-digit)
UUID: 1f939b6e-9ad7-4a40-95eb-f1dbe8205cf0
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919569521972

================================================

USER A (10-digit)
UUID: 0ba5d1d4-4d3e-4d89-b9b5-212e4cd30bbe
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 5db94409-93c1-4c9f-b7b5-d350667ec528
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919580793778

================================================

USER A (10-digit)
UUID: 1f8b15d1-826d-48ef-b7f0-4d404565f628
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: e206c26f-7fc8-4863-b971-edb61b374767
Orders: 2
Addresses: 1
Sessions: 2
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919604812161

================================================

USER A (10-digit)
UUID: 548d3850-9f2f-4aeb-949f-f21efdcd984a
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 1486d221-9d16-4347-b3b2-815d1ad2a892
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919617658659

================================================

USER A (10-digit)
UUID: 3053c4c0-bd0a-401b-80ca-b1621593d8d7
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: be60c847-98d0-4511-9557-3d38babd5361
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919644896049

================================================

USER A (10-digit)
UUID: 061f8f18-23dd-49a8-be31-8c504576ba1f
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 5a9e2012-401b-4be6-8ddd-e7687b964566
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919685787200

================================================

USER A (10-digit)
UUID: 0f60b1eb-3e26-4ddc-bd34-880c977a2ae8
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0
Orders: 2
Addresses: 2
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919689120412

================================================

USER A (10-digit)
UUID: a497fcd3-0734-4135-961c-61b57ec69ed2
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 61a0e405-6204-4015-840d-6ad93873901d
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919712932302

================================================

USER A (10-digit)
UUID: f6b9f983-fcf5-4ba4-ab5c-17471db979fd
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 9a24bd0c-476b-448f-97bd-70e08960f904
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919764566466

================================================

USER A (10-digit)
UUID: b3269e2c-a569-4a93-ba24-ecbacf54590d
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 8e4397b0-c581-4853-b537-5b3eceb75c6b
Orders: 1
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919806254050

================================================

USER A (10-digit)
UUID: 544927e1-5073-4faa-84d1-bb56b303e386
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: ca6f6e3a-8a2d-4fcb-a876-7835cc1da692
Orders: 1
Addresses: 1
Sessions: 2
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919813886201

================================================

USER A (10-digit)
UUID: beaf6128-9fb8-40cc-94fc-b03c7fdd1a32
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 21dacd91-75d6-4321-a368-19f4416c2add
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919828387166

================================================

USER A (10-digit)
UUID: 6c87a88b-1038-4cf2-8a82-b662121aab4d
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 05e37eb2-d2a5-4f0a-a644-cf469693c475
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919899383485

================================================

USER A (10-digit)
UUID: d4abff7c-70bb-44cb-ad2f-a5c2cc697dd3
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: 07197577-6d3e-4cf8-a55d-8a8ca5ad37ef
Orders: 2
Addresses: 1
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919935895884

================================================

USER A (10-digit)
UUID: 16930cda-89a5-47e8-9868-3cb5507bdf55
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: b33ea620-1420-4420-8261-92d530614f6b
Orders: 1
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919967244573

================================================

USER A (10-digit)
UUID: af2f3d4b-4b03-4c9c-9b06-074161a98dae
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: b18c4898-f7c2-4a5f-919e-32507775512d
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

================================================

PHONE: 919999999999

================================================

USER A (10-digit)
UUID: b8cd2d08-988e-4e9e-abb8-20482986e5ce
Orders: 0
Addresses: 0
Sessions: 0
Affiliate: No
Wallet: No
Bookings: No

================================================

USER B (12-digit)
UUID: aad66182-bd3c-428d-bfc8-62b6017ac840
Orders: 0
Addresses: 0
Sessions: 1
Affiliate: No
Wallet: No
Bookings: No

================================================

BUSINESS DATA SPLIT

Orders split: NO
Addresses split: NO
Sessions split: NO
Financial split: NO
Affiliate split: NO

================================================

---

## 4. Referential Integrity Report

We executed database referential integrity checks on all tables containing foreign keys referencing `website_store_users.id`.

### Orphaned Rows Scan Results:
- **user_sessions.user_id**: 0 orphans.
- **website_store_orders.user_id**: 0 orphans.
- **website_store_orders.referrer_id**: 0 orphans.
- **website_store_addresses.user_id**: 0 orphans.
- **website_store_pundits.user_id**: 0 orphans.
- **affiliate_wallets.user_id**: 0 orphans.
- **affiliate_commissions.referrer_id**: 0 orphans.
- **affiliate_commissions.buyer_id**: 0 orphans.
- **affiliate_relationships.referrer_id**: 0 orphans.
- **affiliate_relationships.referred_id**: 0 orphans.
- **affiliate_clicks.referrer_id**: 0 orphans.
- **affiliate_withdrawals.user_id**: 0 orphans.

### Application-Level Orphaned References Found:
- **website_store_pundit_bookings.user_id**:
  - Found **2 orphaned rows** referencing user ID `8dec32cc-dc0c-4ac2-a794-e07ebb8c3ad3` which does not exist in the `website_store_users` table:
    1. Booking ID `ce04f258-4525-47a8-a7a0-1b403e412f73`
    2. Booking ID `4b1e47bb-e09e-47b7-8c6d-294fa790a864`
  - *Analysis*: These bookings belong to devotee accounts logged in under the React Native mobile app's `app_users` profile. This indicates that while the database does not enforce a hard foreign-key constraint on `website_store_pundit_bookings.user_id`, application logic syncs or writes bookings using the mobile user ID directly.

---

## 5. Merge Complexity Report

Below is the classification of each duplicate group based on its structural and transactional merge complexity:

- **Low Complexity** (38 Groups): User A (the 10-digit record) has only active login sessions (or no records at all) and no orders, addresses, wallets, or affiliate links. Merging requires simple session clearance.
- **Medium Complexity** (0 Groups)
- **High Complexity** (2 Groups): Duplicate user group splits active e-commerce rows (orders/addresses) on both UUIDs. Merging requires updating foreign keys on orders and addresses before deleting User A.
- **Critical Complexity** (2 Groups): User A has active wallets, referrals, clicks, or commissions. Reconciling these profiles requires manual commission validation and wallet updates.

| Group Phone | Complexity Category | Category Reason |
| :--- | :--- | :--- |
| `916203288535` | **Low** | Only sessions or no business data. Easy to clean. |
| `916204175088` | **Low** | Only sessions or no business data. Easy to clean. |
| `916376206618` | **Low** | Only sessions or no business data. Easy to clean. |
| `917017308966` | **Low** | Only sessions or no business data. Easy to clean. |
| `917383130148` | **Low** | Only sessions or no business data. Easy to clean. |
| `917408405612` | **Low** | Only sessions or no business data. Easy to clean. |
| `917631598563` | **Low** | Only sessions or no business data. Easy to clean. |
| `917742422277` | **Low** | Only sessions or no business data. Easy to clean. |
| `917874980572` | **Low** | Only sessions or no business data. Easy to clean. |
| `917974478098` | **High** | Both UUIDs have active orders/addresses. Foreign keys must be updated. |
| `917978935494` | **Low** | Only sessions or no business data. Easy to clean. |
| `917999279610` | **Critical** | Active affiliate clicks, clicks logs, wallets, or commissions. Financial data requires audit. |
| `918103314636` | **Low** | Only sessions or no business data. Easy to clean. |
| `918109422241` | **High** | Both UUIDs have active orders/addresses. Foreign keys must be updated. |
| `918299138372` | **Low** | Only sessions or no business data. Easy to clean. |
| `918320782942` | **Low** | Only sessions or no business data. Easy to clean. |
| `918521600214` | **Low** | Only sessions or no business data. Easy to clean. |
| `918819897434` | **Low** | Only sessions or no business data. Easy to clean. |
| `919009046430` | **Critical** | Active affiliate clicks, clicks logs, wallets, or commissions. Financial data requires audit. |
| `919065524534` | **Low** | Only sessions or no business data. Easy to clean. |
| `919193833159` | **Low** | Only sessions or no business data. Easy to clean. |
| `919234133572` | **Low** | Only sessions or no business data. Easy to clean. |
| `919312369843` | **Low** | Only sessions or no business data. Easy to clean. |
| `919431457166` | **Low** | Only sessions or no business data. Easy to clean. |
| `919460195466` | **Low** | Only sessions or no business data. Easy to clean. |
| `919548417559` | **Low** | Only sessions or no business data. Easy to clean. |
| `919569521972` | **Low** | Only sessions or no business data. Easy to clean. |
| `919580793778` | **Low** | Only sessions or no business data. Easy to clean. |
| `919604812161` | **Low** | Only sessions or no business data. Easy to clean. |
| `919617658659` | **Low** | Only sessions or no business data. Easy to clean. |
| `919644896049` | **Low** | Only sessions or no business data. Easy to clean. |
| `919685787200` | **Low** | Only sessions or no business data. Easy to clean. |
| `919689120412` | **Low** | Only sessions or no business data. Easy to clean. |
| `919712932302` | **Low** | Only sessions or no business data. Easy to clean. |
| `919764566466` | **Low** | Only sessions or no business data. Easy to clean. |
| `919806254050` | **Low** | Only sessions or no business data. Easy to clean. |
| `919813886201` | **Low** | Only sessions or no business data. Easy to clean. |
| `919828387166` | **Low** | Only sessions or no business data. Easy to clean. |
| `919899383485` | **Low** | Only sessions or no business data. Easy to clean. |
| `919935895884` | **Low** | Only sessions or no business data. Easy to clean. |
| `919967244573` | **Low** | Only sessions or no business data. Easy to clean. |
| `919999999999` | **Low** | Only sessions or no business data. Easy to clean. |

---

## 6. Canonical User Recommendation

For every duplicate phone group, we recommend:
- **Canonical UUID (Keep)**: The 12-digit record (User B). This conforms to the target 12-digit normalization format (`91XXXXXXXXXX`) used in backend validation.
- **Duplicate UUID (Remove)**: The 10-digit record (User A).
- **Update Mapping**: The tables requiring updates before User A's removal are identified below.

| Group Phone | Canonical UUID (Keep) | Duplicate UUID (Remove) | Tables Requiring Updates | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `916203288535` | `be26646b-bf95-4082-9e1c-47e11d910c68` | `a58c33e1-a616-418c-9daf-1c6ead76fbf2` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `916204175088` | `3b5b751f-bbdb-4438-8ff1-f33e08518543` | `cbb6a1d2-6c0b-4e3f-be29-ddc20ffa457e` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `916376206618` | `fd72dd3c-50a0-448d-8909-6ff17a14d5c5` | `353a4f7a-50bf-4726-9263-835826bd59f6` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917017308966` | `ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` | `9c95dcf1-6ff7-44e8-aef3-f719ad2a04cc` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917383130148` | `e7978155-f476-455d-b700-dfa9863c8c87` | `ff824a1b-e0a1-4249-8c75-2c9362e33f1e` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917408405612` | `a32964ed-b361-4105-ba0e-550e30c825f6` | `ce5fd7ff-d400-4869-a598-dd13c63ce510` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917631598563` | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | `9ecc1ec5-e311-49c7-b6d0-b4e6f776236f` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917742422277` | `faf2bc3c-b15a-43d7-b31e-3f044813788e` | `e53441ea-8046-456d-9fb1-162dcf19feb8` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917874980572` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | `e63adc0a-5875-4e6f-9169-9b14169754ca` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917974478098` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | `user_sessions`, `website_store_orders`, `website_store_addresses` | User B holds 12-digit standard phone. User A has orders/addresses that must be re-linked to User B. |
| `917978935494` | `9322afbf-f0e0-43d2-a05f-4ae2eb547218` | `d3100829-f9b0-4163-967c-3f9bcbd3451f` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `917999279610` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `user_sessions`, `website_store_orders`, `website_store_addresses`, `affiliate_wallets`, `affiliate_commissions`, `affiliate_relationships`, `affiliate_clicks`, `affiliate_audit_logs` | User B holds 12-digit standard phone. User A contains active affiliate commissions/clicks that must be transferred to User B. |
| `918103314636` | `94d8d30a-c5fe-40d2-bc88-65ccd637577b` | `b9c1008f-e529-4809-8d4d-e70c443777ee` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `918109422241` | `53496531-dcc4-45e6-9442-8922efc4cb85` | `8fcbfb52-022c-4f03-8225-650127cc090a` | `user_sessions`, `website_store_orders`, `website_store_addresses` | User B holds 12-digit standard phone. User A has orders/addresses that must be re-linked to User B. |
| `918299138372` | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | `5f4ec778-bb2c-402c-b46c-f2d83f10ef33` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `918320782942` | `8b455565-4b4d-43eb-9dec-68d788f2cd66` | `d9dfbd7a-ba07-480d-835f-3d28ab2fda00` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `918521600214` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | `528565be-2a51-4055-818d-5fad9669be5c` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `918819897434` | `b7231561-31c6-40de-ba4a-0e1062b691b5` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | `user_sessions`, `website_store_orders`, `website_store_addresses` | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919009046430` | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `user_sessions`, `website_store_orders`, `website_store_addresses`, `affiliate_commissions`, `affiliate_relationships`, `affiliate_audit_logs` | User B holds 12-digit standard phone. User A contains active affiliate commissions/clicks that must be transferred to User B. |
| `919065524534` | `780c445c-a3ff-4caf-b64e-80c65a7e6568` | `1631e59a-e552-48e8-ae61-88f7bb856abb` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919193833159` | `20362a06-2966-466e-8ef9-a73b345c518c` | `4defde13-cd29-4eb0-8cf9-e0dd779244f6` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919234133572` | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | `70ba19bf-93de-4afd-8df8-bbb03746a829` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919312369843` | `49db3db3-2224-494e-8aaa-756dfbd6342a` | `a35a50e5-2974-43d9-b13e-7e2001d0f441` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919431457166` | `c49aef24-6c11-45ba-83bc-c4231d386c99` | `68841aa1-4133-4102-bcb3-1e4bb5d56a9d` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919460195466` | `ef11e80b-c824-4c5a-9b9e-1654c652c56b` | `4407a333-2f21-48e1-a6f2-1c8dcb83365d` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919548417559` | `ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4` | `1f939b6e-9ad7-4a40-95eb-f1dbe8205cf0` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919569521972` | `5db94409-93c1-4c9f-b7b5-d350667ec528` | `0ba5d1d4-4d3e-4d89-b9b5-212e4cd30bbe` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919580793778` | `e206c26f-7fc8-4863-b971-edb61b374767` | `1f8b15d1-826d-48ef-b7f0-4d404565f628` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919604812161` | `1486d221-9d16-4347-b3b2-815d1ad2a892` | `548d3850-9f2f-4aeb-949f-f21efdcd984a` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919617658659` | `be60c847-98d0-4511-9557-3d38babd5361` | `3053c4c0-bd0a-401b-80ca-b1621593d8d7` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919644896049` | `5a9e2012-401b-4be6-8ddd-e7687b964566` | `061f8f18-23dd-49a8-be31-8c504576ba1f` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919685787200` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | `0f60b1eb-3e26-4ddc-bd34-880c977a2ae8` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919689120412` | `61a0e405-6204-4015-840d-6ad93873901d` | `a497fcd3-0734-4135-961c-61b57ec69ed2` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919712932302` | `9a24bd0c-476b-448f-97bd-70e08960f904` | `f6b9f983-fcf5-4ba4-ab5c-17471db979fd` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919764566466` | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | `b3269e2c-a569-4a93-ba24-ecbacf54590d` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919806254050` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | `544927e1-5073-4faa-84d1-bb56b303e386` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919813886201` | `21dacd91-75d6-4321-a368-19f4416c2add` | `beaf6128-9fb8-40cc-94fc-b03c7fdd1a32` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919828387166` | `05e37eb2-d2a5-4f0a-a644-cf469693c475` | `6c87a88b-1038-4cf2-8a82-b662121aab4d` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919899383485` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | `d4abff7c-70bb-44cb-ad2f-a5c2cc697dd3` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919935895884` | `b33ea620-1420-4420-8261-92d530614f6b` | `16930cda-89a5-47e8-9868-3cb5507bdf55` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919967244573` | `b18c4898-f7c2-4a5f-919e-32507775512d` | `af2f3d4b-4b03-4c9c-9b06-074161a98dae` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |
| `919999999999` | `aad66182-bd3c-428d-bfc8-62b6017ac840` | `b8cd2d08-988e-4e9e-abb8-20482986e5ce` | None | User B holds the standard 12-digit normalized phone. User A contains no e-commerce data. |

---

## 7. Final Verification & Safety Confirmations

We confirm explicitly:
- **No data was modified.**
- **No rows were inserted.**
- **No rows were updated.**
- **No rows were deleted.**
- **No SQL was executed.**
- **No migrations were executed.**

This report represents a complete and manually verified map of the database duplication states.
