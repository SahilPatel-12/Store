# Website Supabase Duplicate User Dependency Audit Report

**Date of Audit**: 2026-07-24 · **Audited by**: Antigravity (Advanced Agentic Coding Team, Google DeepMind)  
**Methodology**: Read-only database-wide dependency inspection of all duplicate users.

---

## 1. Executive Summary & Audit Statistics

This report presents a complete map of duplicate user identities in the website database, their dependencies, and the exact records affected.

### Audit Summary Statistics:
- **Total website users (website_store_users)**: 152
- **Total duplicate phone groups**: 42
- **Total duplicate user records**: 84
- **Duplicate groups with no references**: 0 (all groups have at least a session or self-referential link)
- **Duplicate groups with only non-financial data**: 38
- **Duplicate groups with orders**: 32
- **Duplicate groups with addresses**: 20
- **Duplicate groups with affiliate/financial data**: 2
- **Duplicate groups requiring manual review**: 4 (2 due to active orders/addresses on both UUIDs, 2 due to active affiliate/financial data)

---

## 2. Duplicate User Master List

Below is the master list of all 42 duplicate phone groups, including the user UUIDs, raw phone numbers, full names, emails, creation times, and last login times.

| Normalized Phone | Duplicate Count | User ID | Stored Phone | Full Name | Email | Created At | Last Login |
| :--- | ---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **916203288535** | 2 | `a58c33e1-a616-418c-9daf-1c6ead76fbf2` | `6203288535` | N/A | N/A | 2026-07-24 | 2026-07-24 |
|  |  | `be26646b-bf95-4082-9e1c-47e11d910c68` | `916203288535` | N/A | pritamrajak16@gmail.com | 2026-07-24 | 2026-07-24 |
| **916204175088** | 2 | `cbb6a1d2-6c0b-4e3f-be29-ddc20ffa457e` | `6204175088` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `3b5b751f-bbdb-4438-8ff1-f33e08518543` | `916204175088` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **916376206618** | 2 | `353a4f7a-50bf-4726-9263-835826bd59f6` | `6376206618` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `fd72dd3c-50a0-448d-8909-6ff17a14d5c5` | `916376206618` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **917017308966** | 2 | `9c95dcf1-6ff7-44e8-aef3-f719ad2a04cc` | `7017308966` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` | `917017308966` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **917383130148** | 2 | `ff824a1b-e0a1-4249-8c75-2c9362e33f1e` | `7383130148` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `e7978155-f476-455d-b700-dfa9863c8c87` | `917383130148` | N/A | heena1234567890789@gmail.com | 2026-07-23 | 2026-07-23 |
| **917408405612** | 2 | `ce5fd7ff-d400-4869-a598-dd13c63ce510` | `7408405612` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `a32964ed-b361-4105-ba0e-550e30c825f6` | `917408405612` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **917631598563** | 2 | `9ecc1ec5-e311-49c7-b6d0-b4e6f776236f` | `7631598563` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | `917631598563` | N/A | kumar5687899@gmail.com | 2026-07-23 | 2026-07-23 |
| **917742422277** | 2 | `e53441ea-8046-456d-9fb1-162dcf19feb8` | `7742422277` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `faf2bc3c-b15a-43d7-b31e-3f044813788e` | `917742422277` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **917874980572** | 2 | `e63adc0a-5875-4e6f-9169-9b14169754ca` | `7874980572` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | `917874980572` | N/A | ektab1991@gmail.com | 2026-07-23 | 2026-07-23 |
| **917974478098** | 2 | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | `7974478098` | N/A | patelsahil797447@gmail.com | 2026-07-13 | 2026-07-22 |
|  |  | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | `917974478098` | N/A | N/A | 2026-07-22 | 2026-07-23 |
| **917978935494** | 2 | `d3100829-f9b0-4163-967c-3f9bcbd3451f` | `7978935494` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `9322afbf-f0e0-43d2-a05f-4ae2eb547218` | `917978935494` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **917999279610** | 2 | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `7999279610` | Navneet | tradinghack3@gmail.com | 2026-07-13 | 2026-07-22 |
|  |  | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | `917999279610` | N/A | udaipurmountabu8@gmail.com | 2026-07-23 | 2026-07-23 |
| **918103314636** | 2 | `b9c1008f-e529-4809-8d4d-e70c443777ee` | `8103314636` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `94d8d30a-c5fe-40d2-bc88-65ccd637577b` | `918103314636` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **918109422241** | 2 | `8fcbfb52-022c-4f03-8225-650127cc090a` | `8109422241` | N/A | purab.sharma@avantika.ed.in | 2026-07-08 | 2026-07-22 |
|  |  | `53496531-dcc4-45e6-9442-8922efc4cb85` | `918109422241` | N/A | purabs640@gmail.com | 2026-07-23 | 2026-07-23 |
| **918299138372** | 2 | `5f4ec778-bb2c-402c-b46c-f2d83f10ef33` | `8299138372` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | `918299138372` | N/A | gdolly863@gmail.com | 2026-07-23 | 2026-07-23 |
| **918320782942** | 2 | `d9dfbd7a-ba07-480d-835f-3d28ab2fda00` | `8320782942` | N/A | N/A | 2026-07-24 | 2026-07-24 |
|  |  | `8b455565-4b4d-43eb-9dec-68d788f2cd66` | `918320782942` | N/A | N/A | 2026-07-24 | 2026-07-24 |
| **918521600214** | 2 | `528565be-2a51-4055-818d-5fad9669be5c` | `8521600214` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | `918521600214` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **918819897434** | 2 | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | `8819897434` | N/A | sahilInstitute@gmail.com | 2026-07-21 | 2026-07-22 |
|  |  | `b7231561-31c6-40de-ba4a-0e1062b691b5` | `918819897434` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919009046430** | 2 | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `9009046430` | N/A | udaipurtrip333@gmail.com | 2026-07-13 | 2026-07-13 |
|  |  | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | `919009046430` | N/A | mantrapuja7@gmail.com | 2026-07-23 | 2026-07-23 |
| **919065524534** | 2 | `1631e59a-e552-48e8-ae61-88f7bb856abb` | `9065524534` | N/A | N/A | 2026-07-24 | 2026-07-24 |
|  |  | `780c445c-a3ff-4caf-b64e-80c65a7e6568` | `919065524534` | N/A | N/A | 2026-07-24 | 2026-07-24 |
| **919193833159** | 2 | `4defde13-cd29-4eb0-8cf9-e0dd779244f6` | `9193833159` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `20362a06-2966-466e-8ef9-a73b345c518c` | `919193833159` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919234133572** | 2 | `70ba19bf-93de-4afd-8df8-bbb03746a829` | `9234133572` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | `919234133572` | N/A | pihusharma2501@gmail.com | 2026-07-23 | 2026-07-23 |
| **919312369843** | 2 | `a35a50e5-2974-43d9-b13e-7e2001d0f441` | `9312369843` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `49db3db3-2224-494e-8aaa-756dfbd6342a` | `919312369843` | N/A | padmajalawassociates@gmail.com | 2026-07-23 | 2026-07-23 |
| **919431457166** | 2 | `68841aa1-4133-4102-bcb3-1e4bb5d56a9d` | `9431457166` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `c49aef24-6c11-45ba-83bc-c4231d386c99` | `919431457166` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919460195466** | 2 | `4407a333-2f21-48e1-a6f2-1c8dcb83365d` | `9460195466` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `ef11e80b-c824-4c5a-9b9e-1654c652c56b` | `919460195466` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919548417559** | 2 | `1f939b6e-9ad7-4a40-95eb-f1dbe8205cf0` | `9548417559` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4` | `919548417559` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919569521972** | 2 | `0ba5d1d4-4d3e-4d89-b9b5-212e4cd30bbe` | `9569521972` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `5db94409-93c1-4c9f-b7b5-d350667ec528` | `919569521972` | N/A | harishhema023@gmail.com | 2026-07-23 | 2026-07-23 |
| **919580793778** | 2 | `1f8b15d1-826d-48ef-b7f0-4d404565f628` | `9580793778` | N/A | N/A | 2026-07-24 | 2026-07-24 |
|  |  | `e206c26f-7fc8-4863-b971-edb61b374767` | `919580793778` | N/A | neharastogi953@gmail.com | 2026-07-24 | 2026-07-24 |
| **919604812161** | 2 | `548d3850-9f2f-4aeb-949f-f21efdcd984a` | `9604812161` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `1486d221-9d16-4347-b3b2-815d1ad2a892` | `919604812161` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919617658659** | 2 | `3053c4c0-bd0a-401b-80ca-b1621593d8d7` | `9617658659` | N/A | N/A | 2026-07-24 | 2026-07-24 |
|  |  | `be60c847-98d0-4511-9557-3d38babd5361` | `919617658659` | N/A | prajapatirenu779@gmail.com | 2026-07-24 | 2026-07-24 |
| **919644896049** | 2 | `061f8f18-23dd-49a8-be31-8c504576ba1f` | `9644896049` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `5a9e2012-401b-4be6-8ddd-e7687b964566` | `919644896049` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919685787200** | 2 | `0f60b1eb-3e26-4ddc-bd34-880c977a2ae8` | `9685787200` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | `919685787200` | N/A | ravindranathyogi@1988gmail.com | 2026-07-23 | 2026-07-23 |
| **919689120412** | 2 | `a497fcd3-0734-4135-961c-61b57ec69ed2` | `9689120412` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `61a0e405-6204-4015-840d-6ad93873901d` | `919689120412` | N/A | ramtirthkaramol12@gmail.com | 2026-07-23 | 2026-07-23 |
| **919712932302** | 2 | `f6b9f983-fcf5-4ba4-ab5c-17471db979fd` | `9712932302` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `9a24bd0c-476b-448f-97bd-70e08960f904` | `919712932302` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919764566466** | 2 | `b3269e2c-a569-4a93-ba24-ecbacf54590d` | `9764566466` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | `919764566466` | N/A | vishalmakhamale84@gmail.com | 2026-07-23 | 2026-07-23 |
| **919806254050** | 2 | `544927e1-5073-4faa-84d1-bb56b303e386` | `9806254050` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | `919806254050` | N/A | dpadwar@gmail.com | 2026-07-23 | 2026-07-23 |
| **919813886201** | 2 | `beaf6128-9fb8-40cc-94fc-b03c7fdd1a32` | `9813886201` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `21dacd91-75d6-4321-a368-19f4416c2add` | `919813886201` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919828387166** | 2 | `6c87a88b-1038-4cf2-8a82-b662121aab4d` | `9828387166` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `05e37eb2-d2a5-4f0a-a644-cf469693c475` | `919828387166` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919899383485** | 2 | `d4abff7c-70bb-44cb-ad2f-a5c2cc697dd3` | `9899383485` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | `919899383485` | N/A | parveenpanwar1986@gmail.com | 2026-07-23 | 2026-07-23 |
| **919935895884** | 2 | `16930cda-89a5-47e8-9868-3cb5507bdf55` | `9935895884` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `b33ea620-1420-4420-8261-92d530614f6b` | `919935895884` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919967244573** | 2 | `af2f3d4b-4b03-4c9c-9b06-074161a98dae` | `9967244573` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `b18c4898-f7c2-4a5f-919e-32507775512d` | `919967244573` | N/A | N/A | 2026-07-23 | 2026-07-23 |
| **919999999999** | 2 | `b8cd2d08-988e-4e9e-abb8-20482986e5ce` | `9999999999` | N/A | N/A | 2026-07-23 | 2026-07-23 |
|  |  | `aad66182-bd3c-428d-bfc8-62b6017ac840` | `919999999999` | N/A | N/A | 2026-07-22 | 2026-07-22 |

---

## 3. Table Dependency Matrix

Below is the dependency matrix summarizing how many direct and indirect rows in each active table reference the duplicate users.

| Table Name | Column Name | User A (10-digit) Refs | User B (12-digit) Refs | User A Records | User B Records |
| :--- | :--- | ---: | ---: | :--- | :--- |
| `user_sessions` | `user_id` | 17 | 52 | 0d1ae1ff..., 0d4b39d4..., 10949617..., 315fd2b0..., 3658b268..., f84bd63b..., 32d27d02..., ac6ac0c6..., 76756722..., 3b50e0d8..., 508cc7c9..., 3144db05..., bcd57599..., daeeb5cc..., 60f0a612..., 653c3144..., 35edc5ce... | b39aec03..., 9e338dd3..., b2ad047d..., 2c3b5978..., d1e925f4..., d3dea057..., 7aa19a3e..., 3ba262da..., 47c850b3..., 95614acd..., 9802c3d3..., 90bd0ec5..., b3c9540e..., 9720ea20..., 5cbd9ce9..., 04e1654b..., 1587f416..., a43014ff..., 99860cf0..., 03da4bc9..., cfccb3b8..., 58683d99..., 3da78107..., d76b6544..., dc7ca46c..., 9e71940d..., 4ab8c328..., ff52a167..., e178bcbf..., 27f3f8b3..., 4ee66016..., 2961243e..., 953c971f..., 2a2a7e5d..., b7df30b2..., a3345c3c..., b4abf57a..., ccde620f..., 9c85b2f6..., 40ce114c..., d150404e..., f3d4c2e9..., be5fda21..., 1088f731..., 15abef24..., f47d4549..., 8d6a50b5..., cc77444a..., 5d90e8ec..., 1ca9bdbe..., 404b22a4..., 84d875f5... |
| `website_store_addresses` | `user_id` | 6 | 27 | 5fb55232..., 806d7c63..., b5ec49ce..., 885bef2c..., 34271669..., 0e92a370... | 36dab8ae..., 4096643c..., 98593bda..., a2374e3e..., 5555912b..., 12c977ae..., 51ccb0f6..., 970a897e..., dcecbdce..., c0e1cc8d..., 8a3b053d..., e8878e5a..., 8b9150ea..., df08f0ac..., 4acd6d0a..., 68291e3f..., 918ee76b..., 40de5b7a..., 5fbfeff5..., a3e2965d..., 06f4023f..., 50e31791..., 0193186e..., 7afaf635..., 4b5e0400..., 467ae244..., 106c2bfc... |
| `website_store_orders` | `user_id` | 12 | 41 | 2f616d5d..., 6d76e6cf..., 7dc5dfcd..., c349342b..., 50d4ecb7..., 7bdcb0c0..., 90028d56..., 30010217..., 13c756c3..., a3b27dc5..., 4e686ccf..., 0a4328f4... | dffcb89d..., d76430a8..., 79741037..., c5d37847..., 22d2573b..., f5f3a61e..., 9e8fa45d..., 6eefc9ae..., 65e6550c..., 8e0e668b..., 8c7aeb66..., 6907a1b2..., 1a8b1c04..., 2a628acc..., 11083e07..., 6132d877..., e2e2829c..., be51ea98..., a5f1d7c0..., 99bd84f5..., 4700ea4c..., d23388c9..., eb789d96..., b472de9c..., 284be8c4..., 37727fe8..., 3c784fc7..., 0dedfc78..., 39fb4d0e..., 21ac2b7c..., c15bf4da..., 6873d6e2..., 08004377..., 535bb3a1..., 9e99bec2..., e3908cdd..., a94a7613..., 13123d74..., bfb4d764..., f7d34fdc..., 738925db... |
| `website_store_users` | `id` | 42 | 42 | a58c33e1..., cbb6a1d2..., 353a4f7a..., 9c95dcf1..., ff824a1b..., ce5fd7ff..., 9ecc1ec5..., e53441ea..., e63adc0a..., 6f91280a..., d3100829..., 2d2aa0e1..., b9c1008f..., 8fcbfb52..., 5f4ec778..., d9dfbd7a..., 528565be..., 4bc8cc36..., 6c386c97..., 1631e59a..., 4defde13..., 70ba19bf..., a35a50e5..., 68841aa1..., 4407a333..., 1f939b6e..., 0ba5d1d4..., 1f8b15d1..., 548d3850..., 3053c4c0..., 061f8f18..., 0f60b1eb..., a497fcd3..., f6b9f983..., b3269e2c..., 544927e1..., beaf6128..., 6c87a88b..., d4abff7c..., 16930cda..., af2f3d4b..., b8cd2d08... | be26646b..., 3b5b751f..., fd72dd3c..., ffacfb93..., e7978155..., a32964ed..., 5e872698..., faf2bc3c..., a604fbb9..., d9d433bc..., 9322afbf..., 4d2a11ad..., 94d8d30a..., 53496531..., 1274ce5d..., 8b455565..., 17bdace1..., b7231561..., bb82366c..., 780c445c..., 20362a06..., acf583eb..., 49db3db3..., c49aef24..., ef11e80b..., ce8a070c..., 5db94409..., e206c26f..., 1486d221..., be60c847..., 5a9e2012..., 77aef8fd..., 61a0e405..., 9a24bd0c..., 8e4397b0..., ca6f6e3a..., 21dacd91..., 05e37eb2..., 07197577..., b33ea620..., b18c4898..., aad66182... |
| `affiliate_audit_logs` | `target_id` | 3 | 0 | 58, 59, 60 | N/A |
| `affiliate_audit_logs` | `payload` | 1 | 0 | 60 | N/A |
| `affiliate_clicks` | `referrer_id` | 4 | 0 | 7d083e14..., 05289c6c..., 70628c6e..., 0d501cce... | N/A |
| `affiliate_commissions` | `referrer_id` | 2 | 0 | 9a017b51..., 3d7ff6e6... | N/A |
| `affiliate_relationships` | `referrer_id` | 1 | 0 | 7ad6f9a5... | N/A |
| `affiliate_wallets` | `user_id` | 1 | 0 | {"user_i... | N/A |
| `website_store_orders` | `referrer_id` | 2 | 0 | 4e686ccf..., 0a4328f4... | N/A |
| `website_store_orders` | `affiliate_snapshot` | 4 | 0 | 4e686ccf..., 0a4328f4... | N/A |
| `website_store_users` | `referred_by` | 1 | 0 | 6c386c97... | N/A |
| `affiliate_commissions` | `buyer_id` | 2 | 0 | 9a017b51..., 3d7ff6e6... | N/A |
| `affiliate_relationships` | `referred_id` | 1 | 0 | 7ad6f9a5... | N/A |

---

## 4. Self-Referencing User Relationships

This section identifies connections inside `website_store_users.referred_by` or within active affiliate relationships.

| User UUID | Referral Role | Connected User/Affiliate ID | Affiliate Code | Referred By UUID |
| :--- | :--- | :--- | :--- | :--- |
| `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Referrer of | `6c386c97-bd16-444c-84fa-d0a4e73c4530` (9009046430) | MPER73US | `N/A` |
| `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Referred By | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | N/A | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` |

---

## 5. Exact Affected Record List

### A. Affected Orders (website_store_orders)
Total: 59 records referencing duplicate users.

| Normalized Phone | Order ID | User UUID | Status | Payment Status | Payment Method | Total | Created At | Razorpay IDs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 916203288535 | `MANTRA-964505` | `be26646b-bf95-4082-9e1c-47e11d910c68` | Being Packed | Confirmed | Razorpay | ₹101 | 2026-07-24 | Order: `order_THBm9ZJPhsjYJA`<br>Pay: `pay_THBmNkSyHDF90p` |
| 916376206618 | `MANTRA-755020` | `fd72dd3c-50a0-448d-8909-6ff17a14d5c5` | Shipped | Pending | COD | ₹302 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 917017308966 | `MANTRA-837561` | `ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` | Being Packed | Confirmed | Razorpay | ₹202 | 2026-07-23 | Order: `order_TGxtweO8DF3YjT`<br>Pay: `pay_TGxu79p6dWppAW` |
| 917383130148 | `MANTRA-765822` | `e7978155-f476-455d-b700-dfa9863c8c87` | Being Packed | Confirmed | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGu6wcdxkuSJXT`<br>Pay: `pay_TGu740Q4wCUe3q` |
| 917408405612 | `MANTRA-606459` | `a32964ed-b361-4105-ba0e-550e30c825f6` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGxGpgrs170l1I`<br>Pay: `N/A` |
| 917631598563 | `MANTRA-723723` | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | Ready for Dispatch | Pending | COD | ₹151 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 917874980572 | `MANTRA-274293` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | Ready for Dispatch | Pending | COD | ₹151 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-870014` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | ₹401 | 2026-07-21 | Order: `order_TG8ODBA2qQ0zeI`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-682469` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | ₹401 | 2026-07-21 | Order: `order_TG55TfMTxCygrw`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-550767` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Failed | Razorpay | ₹601 | 2026-07-22 | Order: `order_TGeZL5Wsk5MZ66`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-295544` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | ₹1001 | 2026-07-21 | Order: `order_TG56pTeB6lS5Kz`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-195098` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-21 | Order: `order_TG58KD61vmRAtS`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-883065` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Failed | Razorpay | ₹601 | 2026-07-23 | Order: `order_TGviDtXTox7Awa`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-875760` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Failed | Razorpay | ₹1 | 2026-07-23 | Order: `order_TGwBCk2lw913xX`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-400075` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Confirmed | Razorpay | ₹1 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 917974478098 | `MANTRA-923247` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Confirmed | Razorpay | ₹1 | 2026-07-23 | Order: `order_TGymmD8Qx6WYsY`<br>Pay: `pay_TGymspZkO1PR47` |
| 917974478098 | `MANTRA-463333` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | Cancelled | Confirmed | Razorpay | ₹1 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 917978935494 | `MANTRA-815210` | `9322afbf-f0e0-43d2-a05f-4ae2eb547218` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGmkDJEGo0sn8l`<br>Pay: `N/A` |
| 917999279610 | `MANTRA-296888` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `N/A`<br>Pay: `N/A` |
| 917999279610 | `MANTRA-296888` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `N/A`<br>Pay: `N/A` |
| 917999279610 | `MANTRA-932212` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-21 | Order: `order_TG8QoOZFQAHvCY`<br>Pay: `N/A` |
| 917999279610 | `MANTRA-857313` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-21 | Order: `N/A`<br>Pay: `N/A` |
| 917999279610 | `MANTRA-396069` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `order_TD5x3Bn4zEGHSQ`<br>Pay: `N/A` |
| 917999279610 | `MANTRA-396069` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `order_TD5x3Bn4zEGHSQ`<br>Pay: `N/A` |
| 918103314636 | `MANTRA-992977` | `94d8d30a-c5fe-40d2-bc88-65ccd637577b` | Shipped | Pending | COD | ₹151 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 918109422241 | `MANTRA-381905` | `8fcbfb52-022c-4f03-8225-650127cc090a` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-21 | Order: `order_TG8Qz6OdFXM3xB`<br>Pay: `N/A` |
| 918109422241 | `MANTRA-237237` | `8fcbfb52-022c-4f03-8225-650127cc090a` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-08 | Order: `order_TB3YeaeeVX70ib`<br>Pay: `N/A` |
| 918109422241 | `MANTRA-831185` | `8fcbfb52-022c-4f03-8225-650127cc090a` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-21 | Order: `order_TG57qouxGawCnt`<br>Pay: `N/A` |
| 918109422241 | `MANTRA-126578` | `53496531-dcc4-45e6-9442-8922efc4cb85` | Cancelled | Pending | COD | ₹51 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 918109422241 | `MANTRA-529258` | `53496531-dcc4-45e6-9442-8922efc4cb85` | Cancelled | Confirmed | Razorpay | ₹1 | 2026-07-23 | Order: `order_TGy6iamaSCYOvk`<br>Pay: `pay_TGy6mXMthSn2sB` |
| 918109422241 | `MANTRA-377319` | `53496531-dcc4-45e6-9442-8922efc4cb85` | Cancelled | Confirmed | Razorpay | ₹1 | 2026-07-23 | Order: `order_TGwRAYSj00u1Lo`<br>Pay: `pay_TGwRStjf2RV2oZ` |
| 918299138372 | `MANTRA-645577` | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | Being Packed | Confirmed | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGrnTP8SRaaKxa`<br>Pay: `pay_TGrwdobxvCHoZQ` |
| 918320782942 | `MANTRA-237979` | `8b455565-4b4d-43eb-9dec-68d788f2cd66` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-24 | Order: `order_THBaP6XYFJuqFH`<br>Pay: `N/A` |
| 918521600214 | `MANTRA-158461` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | Payment Pending | Pending | Razorpay | ₹202 | 2026-07-23 | Order: `order_TGw5FM3oWDdTH1`<br>Pay: `N/A` |
| 918521600214 | `MANTRA-113231` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | Payment Pending | Pending | Razorpay | ₹202 | 2026-07-23 | Order: `order_TGwsglMiV4UBh7`<br>Pay: `N/A` |
| 918521600214 | `MANTRA-320301` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | Cancelled | Failed | Razorpay | ₹202 | 2026-07-23 | Order: `order_TGy6GMFMzTOnoV`<br>Pay: `N/A` |
| 918819897434 | `MANTRA-689646` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | Cancelled | Failed | Razorpay | ₹1 | 2026-07-21 | Order: `order_TGH4XpiI3jFweR`<br>Pay: `N/A` |
| 919009046430 | `MANTRA-296888` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `N/A`<br>Pay: `N/A` |
| 919009046430 | `MANTRA-296888` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `N/A`<br>Pay: `N/A` |
| 919009046430 | `MANTRA-396069` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `order_TD5x3Bn4zEGHSQ`<br>Pay: `N/A` |
| 919009046430 | `MANTRA-396069` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-13 | Order: `order_TD5x3Bn4zEGHSQ`<br>Pay: `N/A` |
| 919193833159 | `MANTRA-716989` | `20362a06-2966-466e-8ef9-a73b345c518c` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGoaH0FsJQat3d`<br>Pay: `N/A` |
| 919234133572 | `MANTRA-481123` | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | Shipped | Pending | COD | ₹302 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 919312369843 | `MANTRA-877539` | `49db3db3-2224-494e-8aaa-756dfbd6342a` | Being Packed | Confirmed | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGs2fUpUj5GfQz`<br>Pay: `pay_TGs2m15rRY0im4` |
| 919569521972 | `MANTRA-228614` | `5db94409-93c1-4c9f-b7b5-d350667ec528` | Being Packed | Pending | COD | ₹302 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 919580793778 | `MANTRA-353360` | `e206c26f-7fc8-4863-b971-edb61b374767` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-24 | Order: `order_THD1WhxECKDdtO`<br>Pay: `N/A` |
| 919580793778 | `MANTRA-395338` | `e206c26f-7fc8-4863-b971-edb61b374767` | Being Packed | Confirmed | Razorpay | ₹101 | 2026-07-24 | Order: `order_THEX513n7Ifycm`<br>Pay: `pay_THEXJD0LJHg4TH` |
| 919604812161 | `MANTRA-181539` | `1486d221-9d16-4347-b3b2-815d1ad2a892` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGx8eQIe9wU2hT`<br>Pay: `N/A` |
| 919617658659 | `MANTRA-197285` | `be60c847-98d0-4511-9557-3d38babd5361` | Being Packed | Confirmed | Razorpay | ₹202 | 2026-07-24 | Order: `order_THE7wwDUUHi7BD`<br>Pay: `pay_THE85XUkvSfWGi` |
| 919644896049 | `MANTRA-868231` | `5a9e2012-401b-4be6-8ddd-e7687b964566` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGzodkyVwguLZX`<br>Pay: `N/A` |
| 919685787200 | `MANTRA-592503` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | Cancelled | Confirmed | Razorpay | ₹1 | 2026-07-24 | Order: `order_TH8wO1xdifwOkG`<br>Pay: `pay_TH8wReOfZyW1bN` |
| 919685787200 | `MANTRA-107887` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | Cancelled | Confirmed | Razorpay | ₹1 | 2026-07-24 | Order: `order_TH8uAlAyKcsxyl`<br>Pay: `pay_TH8uVGronDreA3` |
| 919689120412 | `MANTRA-398261` | `61a0e405-6204-4015-840d-6ad93873901d` | Being Packed | Confirmed | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGu5xKacvHjDn3`<br>Pay: `pay_TGu6BalEGpXEp4` |
| 919764566466 | `MANTRA-478581` | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | Being Packed | Confirmed | Razorpay | ₹202 | 2026-07-23 | Order: `order_TGycgLEKQxzCwz`<br>Pay: `pay_TGycplA9VMN8ky` |
| 919806254050 | `MANTRA-276707` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | Being Packed | Pending | COD | ₹302 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 919813886201 | `MANTRA-306833` | `21dacd91-75d6-4321-a368-19f4416c2add` | Ready for Dispatch | Pending | COD | ₹302 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 919899383485 | `MANTRA-915010` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | Being Packed | Confirmed | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGriMoeOONf5Es`<br>Pay: `pay_TGriTBbtGWYyyz` |
| 919899383485 | `MANTRA-760268` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | Being Packed | Pending | COD | ₹1351 | 2026-07-23 | Order: `N/A`<br>Pay: `N/A` |
| 919935895884 | `MANTRA-636487` | `b33ea620-1420-4420-8261-92d530614f6b` | Payment Pending | Pending | Razorpay | ₹101 | 2026-07-23 | Order: `order_TGojfhO143RObt`<br>Pay: `N/A` |

### B. Affected Addresses (website_store_addresses)
Total: 33 addresses referencing duplicate users.

| Normalized Phone | Address ID | User UUID | Name | Phone | Address | City | State | Pincode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 916203288535 | `36dab8ae-e210-4f70-9b2e-dd177c848be1` | `be26646b-bf95-4082-9e1c-47e11d910c68` | N/A | `6203288535` | N/A | East Singhbhum | Jharkhand | N/A |
| 917383130148 | `4096643c-3a82-4a69-8f68-a9bb6279114b` | `e7978155-f476-455d-b700-dfa9863c8c87` | N/A | `917383130148` | N/A | Ahmedabad | Gujarat | N/A |
| 917631598563 | `98593bda-016e-4ee4-8e0e-73dec73887e2` | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | N/A | `917631598563` | N/A | Lakhisarai | Bihar | N/A |
| 917874980572 | `a2374e3e-09a3-4829-8db3-929046f17cfc` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | N/A | `917874980572` | N/A | Mumbai  | Maharashtra | N/A |
| 917974478098 | `5fb55232-e7aa-4b8b-9e5d-81e3de81b1ed` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | N/A | `7974478098` | N/A | ujjain | Bihar | N/A |
| 917974478098 | `806d7c63-d281-45c7-ac1e-7f52c091ec3a` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | N/A | `7974478098` | N/A | Indore | Madhya Pradesh | N/A |
| 917974478098 | `5555912b-ee69-4f96-af42-22605d36584a` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A |
| 917974478098 | `12c977ae-01c4-44c5-a3bd-2357279dcf59` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A |
| 917974478098 | `51ccb0f6-cdd6-4ff9-a32e-22e71f182887` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A |
| 917974478098 | `970a897e-558e-4704-8f2d-c971af3a1c4a` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A |
| 917974478098 | `dcecbdce-3dc5-419a-aa3d-a63d6448f1f5` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A |
| 917974478098 | `c0e1cc8d-62a7-4517-b90c-02bae3178725` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | N/A | `917974478098` | N/A | Ujjain | Madhya Pradesh | N/A |
| 917999279610 | `b5ec49ce-2b3d-44e4-80d8-056153be7833` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | N/A | `7999279610` | N/A | Ujjain | Madhya Pradesh | N/A |
| 917999279610 | `8a3b053d-f77a-44da-b5f1-631707e69ec1` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | N/A | `917999279610` | N/A | Ujjain | Madhya Pradesh | N/A |
| 918109422241 | `885bef2c-8ad4-410a-8505-cddd7f08d871` | `8fcbfb52-022c-4f03-8225-650127cc090a` | N/A | `8109422241` | N/A | Ujjain | Madhya Pradesh | N/A |
| 918109422241 | `e8878e5a-9b76-40b9-824c-52be1f125403` | `53496531-dcc4-45e6-9442-8922efc4cb85` | N/A | `918109422241` | N/A | Ujjain | Madhya Pradesh | N/A |
| 918109422241 | `8b9150ea-eec1-4a56-b063-465cd63c4901` | `53496531-dcc4-45e6-9442-8922efc4cb85` | N/A | `918109422241` | N/A | Ujjain | Madhya Pradesh | N/A |
| 918109422241 | `df08f0ac-f801-460a-b7da-f5f06258dd94` | `53496531-dcc4-45e6-9442-8922efc4cb85` | N/A | `918109422241` | N/A | Ujjain | Madhya Pradesh | N/A |
| 918299138372 | `4acd6d0a-5938-4654-ab28-07c7653f7033` | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | N/A | `8299138372` | N/A | Kanpur | Uttar Pradesh | N/A |
| 918819897434 | `34271669-3e1c-4bef-8fd0-0a52d5bd9715` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | N/A | `8819897434` | N/A | Ujjain | Madhya Pradesh | N/A |
| 919009046430 | `0e92a370-2341-4fe8-990b-b24a9576ba2a` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | N/A | `9009046430` | N/A | ind | Madhya Pradesh | N/A |
| 919009046430 | `68291e3f-dc72-408d-90bf-022507e4fa21` | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | N/A | `919009046430` | N/A | Indore | Madhya Pradesh | N/A |
| 919234133572 | `918ee76b-b9aa-4336-9760-7b1a4b8ae340` | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | N/A | `919234133572` | N/A | Giridh | Jharkhand | N/A |
| 919312369843 | `40de5b7a-0b84-41ef-8eda-dbd193cb0c58` | `49db3db3-2224-494e-8aaa-756dfbd6342a` | N/A | `919312369843` | N/A | Patna | Bihar | N/A |
| 919569521972 | `5fbfeff5-f81d-4921-a1d7-cb7593317f6c` | `5db94409-93c1-4c9f-b7b5-d350667ec528` | N/A | `919569521972` | N/A | Jalandhar | Punjab | N/A |
| 919580793778 | `a3e2965d-ccf2-42c3-973c-da6d43a0e2ee` | `e206c26f-7fc8-4863-b971-edb61b374767` | N/A | `919580793778` | N/A | Lucknow | Uttar Pradesh | N/A |
| 919617658659 | `06f4023f-575f-43ec-96fd-11d9173147c4` | `be60c847-98d0-4511-9557-3d38babd5361` | N/A | `919617658659` | N/A | Gwalior | Madhya Pradesh | N/A |
| 919685787200 | `50e31791-1268-4dd3-a9cd-fdcd2ef8c9ec` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | N/A | `9685787200` | N/A | Durg | Chhattisgarh | N/A |
| 919685787200 | `0193186e-be18-4184-abf1-f9bb12d089c0` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | N/A | `9685787200` | N/A | Durg | Chhattisgarh | N/A |
| 919689120412 | `7afaf635-74bd-4d17-a4f4-76eb4139d66a` | `61a0e405-6204-4015-840d-6ad93873901d` | N/A | `919689120412` | N/A | Akola | Maharashtra | N/A |
| 919764566466 | `4b5e0400-f6e2-4847-ba39-d037a1f4127e` | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | N/A | `919764566466` | N/A | Pune | Maharashtra | N/A |
| 919806254050 | `467ae244-7e7c-4cc0-888d-e4f5a4bd25c6` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | N/A | `919806254050` | N/A | Mandla | Madhya Pradesh | N/A |
| 919899383485 | `106c2bfc-735d-4fdd-ad9b-365bff39abd7` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | N/A | `919899383485` | N/A | Gautam Buddha Nagar | Uttar Pradesh | N/A |

### C. Affected Sessions (user_sessions)
Total: 69 sessions referencing duplicate users.

| Normalized Phone | Session ID | User UUID | Created At | Expires At | Last Used At | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 916203288535 | `b39aec03...` | `be26646b-bf95-4082-9e1c-47e11d910c68` | 2026-07-24 | 2026-08-23 | 2026-07-24 | **ACTIVE** |
| 916204175088 | `9e338dd3...` | `3b5b751f-bbdb-4438-8ff1-f33e08518543` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 916376206618 | `b2ad047d...` | `fd72dd3c-50a0-448d-8909-6ff17a14d5c5` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917017308966 | `2c3b5978...` | `ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917383130148 | `d1e925f4...` | `e7978155-f476-455d-b700-dfa9863c8c87` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917408405612 | `d3dea057...` | `a32964ed-b361-4105-ba0e-550e30c825f6` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917631598563 | `7aa19a3e...` | `5e872698-10e8-492c-9fcd-c2bb47f145ba` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917742422277 | `3ba262da...` | `faf2bc3c-b15a-43d7-b31e-3f044813788e` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917874980572 | `47c850b3...` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917874980572 | `95614acd...` | `a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917974478098 | `0d1ae1ff...` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-21 | 2026-08-20 | 2026-07-21 | **ACTIVE** |
| 917974478098 | `0d4b39d4...` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-16 | 2026-08-15 | 2026-07-16 | **ACTIVE** |
| 917974478098 | `10949617...` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-14 | 2026-08-13 | 2026-07-14 | **ACTIVE** |
| 917974478098 | `315fd2b0...` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-21 | 2026-08-20 | 2026-07-21 | **ACTIVE** |
| 917974478098 | `3658b268...` | `6f91280a-d400-4cf4-85ee-b6014d5b5917` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |
| 917974478098 | `9802c3d3...` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917974478098 | `90bd0ec5...` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917974478098 | `b3c9540e...` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917974478098 | `9720ea20...` | `d9d433bc-dd57-4563-8e78-9a0fbd37b59d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917978935494 | `5cbd9ce9...` | `9322afbf-f0e0-43d2-a05f-4ae2eb547218` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917999279610 | `f84bd63b...` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |
| 917999279610 | `32d27d02...` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-21 | 2026-08-20 | 2026-07-21 | **ACTIVE** |
| 917999279610 | `ac6ac0c6...` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |
| 917999279610 | `76756722...` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |
| 917999279610 | `3b50e0d8...` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |
| 917999279610 | `04e1654b...` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917999279610 | `1587f416...` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 917999279610 | `a43014ff...` | `4d2a11ad-e7c0-4af7-af7a-af5789fa267d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 918103314636 | `99860cf0...` | `94d8d30a-c5fe-40d2-bc88-65ccd637577b` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 918109422241 | `508cc7c9...` | `8fcbfb52-022c-4f03-8225-650127cc090a` | 2026-07-08 | 2026-08-07 | 2026-07-08 | **ACTIVE** |
| 918109422241 | `3144db05...` | `8fcbfb52-022c-4f03-8225-650127cc090a` | 2026-07-21 | 2026-08-20 | 2026-07-21 | **ACTIVE** |
| 918109422241 | `bcd57599...` | `8fcbfb52-022c-4f03-8225-650127cc090a` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |
| 918109422241 | `03da4bc9...` | `53496531-dcc4-45e6-9442-8922efc4cb85` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 918299138372 | `cfccb3b8...` | `1274ce5d-6fe7-4663-902e-ff6a2f54f80c` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 918320782942 | `58683d99...` | `8b455565-4b4d-43eb-9dec-68d788f2cd66` | 2026-07-24 | 2026-08-23 | 2026-07-24 | **ACTIVE** |
| 918521600214 | `3da78107...` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 918521600214 | `d76b6544...` | `17bdace1-d33e-4990-b3e0-83497aa69a1d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 918819897434 | `daeeb5cc...` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |
| 918819897434 | `60f0a612...` | `4bc8cc36-ab55-4db7-85ba-ab0803923a19` | 2026-07-21 | 2026-08-20 | 2026-07-21 | **ACTIVE** |
| 918819897434 | `dc7ca46c...` | `b7231561-31c6-40de-ba4a-0e1062b691b5` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919009046430 | `653c3144...` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | 2026-07-13 | 2026-08-12 | 2026-07-13 | **ACTIVE** |
| 919009046430 | `35edc5ce...` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | 2026-07-13 | 2026-08-12 | 2026-07-13 | **ACTIVE** |
| 919009046430 | `9e71940d...` | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919009046430 | `4ab8c328...` | `bb82366c-ee99-4c4f-a6e7-9a1612479aa1` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919065524534 | `ff52a167...` | `780c445c-a3ff-4caf-b64e-80c65a7e6568` | 2026-07-24 | 2026-08-23 | 2026-07-24 | **ACTIVE** |
| 919193833159 | `e178bcbf...` | `20362a06-2966-466e-8ef9-a73b345c518c` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919234133572 | `27f3f8b3...` | `acf583eb-6ef9-4031-9df5-ba742a1824c9` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919312369843 | `4ee66016...` | `49db3db3-2224-494e-8aaa-756dfbd6342a` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919431457166 | `2961243e...` | `c49aef24-6c11-45ba-83bc-c4231d386c99` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919460195466 | `953c971f...` | `ef11e80b-c824-4c5a-9b9e-1654c652c56b` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919548417559 | `2a2a7e5d...` | `ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919569521972 | `b7df30b2...` | `5db94409-93c1-4c9f-b7b5-d350667ec528` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919580793778 | `a3345c3c...` | `e206c26f-7fc8-4863-b971-edb61b374767` | 2026-07-24 | 2026-08-23 | 2026-07-24 | **ACTIVE** |
| 919580793778 | `b4abf57a...` | `e206c26f-7fc8-4863-b971-edb61b374767` | 2026-07-24 | 2026-08-23 | 2026-07-24 | **ACTIVE** |
| 919604812161 | `ccde620f...` | `1486d221-9d16-4347-b3b2-815d1ad2a892` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919617658659 | `9c85b2f6...` | `be60c847-98d0-4511-9557-3d38babd5361` | 2026-07-24 | 2026-08-23 | 2026-07-24 | **ACTIVE** |
| 919644896049 | `40ce114c...` | `5a9e2012-401b-4be6-8ddd-e7687b964566` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919685787200 | `d150404e...` | `77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919689120412 | `f3d4c2e9...` | `61a0e405-6204-4015-840d-6ad93873901d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919712932302 | `be5fda21...` | `9a24bd0c-476b-448f-97bd-70e08960f904` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919764566466 | `1088f731...` | `8e4397b0-c581-4853-b537-5b3eceb75c6b` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919806254050 | `15abef24...` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919806254050 | `f47d4549...` | `ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919813886201 | `8d6a50b5...` | `21dacd91-75d6-4321-a368-19f4416c2add` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919828387166 | `cc77444a...` | `05e37eb2-d2a5-4f0a-a644-cf469693c475` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919899383485 | `5d90e8ec...` | `07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919935895884 | `1ca9bdbe...` | `b33ea620-1420-4420-8261-92d530614f6b` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919967244573 | `404b22a4...` | `b18c4898-f7c2-4a5f-919e-32507775512d` | 2026-07-23 | 2026-08-22 | 2026-07-23 | **ACTIVE** |
| 919999999999 | `84d875f5...` | `aad66182-bd3c-428d-bfc8-62b6017ac840` | 2026-07-22 | 2026-08-21 | 2026-07-22 | **ACTIVE** |

### D. Affected Affiliate & Financial Records
Total: 15 records connected to duplicate users in affiliate tables.

| Table Name | Column Name | User ID | Record ID | Earned / Click Info | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `affiliate_audit_logs` | `target_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `58` | N/A | N/A |
| `affiliate_audit_logs` | `target_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `59` | N/A | N/A |
| `affiliate_audit_logs` | `payload` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `60` | N/A | N/A |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `7d083e14...` | Landing: /?ref=MPER73US | Code: MPER73US | N/A |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `05289c6c...` | Landing: /?ref=MPER73US | Code: MPER73US | N/A |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `70628c6e...` | Landing: /?ref=MPER73US | Code: MPER73US | N/A |
| `affiliate_clicks` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `0d501cce...` | Landing: /?ref=MPER73US | Code: MPER73US | N/A |
| `affiliate_commissions` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `9a017b51...` | Amount: ₹10.1 (Order: MANTRA-396069) | pending |
| `affiliate_commissions` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `3d7ff6e6...` | Amount: ₹10.1 (Order: MANTRA-296888) | pending |
| `affiliate_relationships` | `referrer_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `7ad6f9a5...` | Referrer: 2d2aa0e1-dca2-4928-8ed4-cc92506d80b8 | Referred: 6c386c97-bd16-444c-84fa-d0a4e73c4530 | N/A |
| `affiliate_wallets` | `user_id` | `2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` | `{"user_i...` | Earned: ₹0 | Available: ₹0 | N/A |
| `affiliate_audit_logs` | `target_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `60` | N/A | N/A |
| `affiliate_commissions` | `buyer_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `9a017b51...` | Amount: ₹10.1 (Order: MANTRA-396069) | pending |
| `affiliate_commissions` | `buyer_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `3d7ff6e6...` | Amount: ₹10.1 (Order: MANTRA-296888) | pending |
| `affiliate_relationships` | `referred_id` | `6c386c97-bd16-444c-84fa-d0a4e73c4530` | `7ad6f9a5...` | Referrer: 2d2aa0e1-dca2-4928-8ed4-cc92506d80b8 | Referred: 6c386c97-bd16-444c-84fa-d0a4e73c4530 | N/A |

---

## 6. Safe vs Unsafe Classification

Below is the classification of the 42 duplicate phone groups:

### Potentially Safe After Verification (38 Groups)
These groups have only one user with orders/addresses (usually the 12-digit User B) while the duplicate (the 10-digit User A) contains no business data. Only active sessions or self-referential user records need to be deleted or re-linked to the 12-digit profile.
- **916203288535**:
- User A (`a58c33e1-a616-418c-9daf-1c6ead76fbf2` / `6203288535`): 0 orders, 0 addresses
- User B (`be26646b-bf95-4082-9e1c-47e11d910c68` / `916203288535`): 1 orders, 1 addresses
- **916204175088**:
- User A (`cbb6a1d2-6c0b-4e3f-be29-ddc20ffa457e` / `6204175088`): 0 orders, 0 addresses
- User B (`3b5b751f-bbdb-4438-8ff1-f33e08518543` / `916204175088`): 0 orders, 0 addresses
- **916376206618**:
- User A (`353a4f7a-50bf-4726-9263-835826bd59f6` / `6376206618`): 0 orders, 0 addresses
- User B (`fd72dd3c-50a0-448d-8909-6ff17a14d5c5` / `916376206618`): 1 orders, 0 addresses
- **917017308966**:
- User A (`9c95dcf1-6ff7-44e8-aef3-f719ad2a04cc` / `7017308966`): 0 orders, 0 addresses
- User B (`ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7` / `917017308966`): 1 orders, 0 addresses
- **917383130148**:
- User A (`ff824a1b-e0a1-4249-8c75-2c9362e33f1e` / `7383130148`): 0 orders, 0 addresses
- User B (`e7978155-f476-455d-b700-dfa9863c8c87` / `917383130148`): 1 orders, 1 addresses
- **917408405612**:
- User A (`ce5fd7ff-d400-4869-a598-dd13c63ce510` / `7408405612`): 0 orders, 0 addresses
- User B (`a32964ed-b361-4105-ba0e-550e30c825f6` / `917408405612`): 1 orders, 0 addresses
- **917631598563**:
- User A (`9ecc1ec5-e311-49c7-b6d0-b4e6f776236f` / `7631598563`): 0 orders, 0 addresses
- User B (`5e872698-10e8-492c-9fcd-c2bb47f145ba` / `917631598563`): 1 orders, 1 addresses
- **917742422277**:
- User A (`e53441ea-8046-456d-9fb1-162dcf19feb8` / `7742422277`): 0 orders, 0 addresses
- User B (`faf2bc3c-b15a-43d7-b31e-3f044813788e` / `917742422277`): 0 orders, 0 addresses
- **917874980572**:
- User A (`e63adc0a-5875-4e6f-9169-9b14169754ca` / `7874980572`): 0 orders, 0 addresses
- User B (`a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e` / `917874980572`): 1 orders, 1 addresses
- **917978935494**:
- User A (`d3100829-f9b0-4163-967c-3f9bcbd3451f` / `7978935494`): 0 orders, 0 addresses
- User B (`9322afbf-f0e0-43d2-a05f-4ae2eb547218` / `917978935494`): 1 orders, 0 addresses
- **918103314636**:
- User A (`b9c1008f-e529-4809-8d4d-e70c443777ee` / `8103314636`): 0 orders, 0 addresses
- User B (`94d8d30a-c5fe-40d2-bc88-65ccd637577b` / `918103314636`): 1 orders, 0 addresses
- **918299138372**:
- User A (`5f4ec778-bb2c-402c-b46c-f2d83f10ef33` / `8299138372`): 0 orders, 0 addresses
- User B (`1274ce5d-6fe7-4663-902e-ff6a2f54f80c` / `918299138372`): 1 orders, 1 addresses
- **918320782942**:
- User A (`d9dfbd7a-ba07-480d-835f-3d28ab2fda00` / `8320782942`): 0 orders, 0 addresses
- User B (`8b455565-4b4d-43eb-9dec-68d788f2cd66` / `918320782942`): 1 orders, 0 addresses
- **918521600214**:
- User A (`528565be-2a51-4055-818d-5fad9669be5c` / `8521600214`): 0 orders, 0 addresses
- User B (`17bdace1-d33e-4990-b3e0-83497aa69a1d` / `918521600214`): 3 orders, 0 addresses
- **918819897434**:
- User A (`4bc8cc36-ab55-4db7-85ba-ab0803923a19` / `8819897434`): 1 orders, 1 addresses
- User B (`b7231561-31c6-40de-ba4a-0e1062b691b5` / `918819897434`): 0 orders, 0 addresses
- **919065524534**:
- User A (`1631e59a-e552-48e8-ae61-88f7bb856abb` / `9065524534`): 0 orders, 0 addresses
- User B (`780c445c-a3ff-4caf-b64e-80c65a7e6568` / `919065524534`): 0 orders, 0 addresses
- **919193833159**:
- User A (`4defde13-cd29-4eb0-8cf9-e0dd779244f6` / `9193833159`): 0 orders, 0 addresses
- User B (`20362a06-2966-466e-8ef9-a73b345c518c` / `919193833159`): 1 orders, 0 addresses
- **919234133572**:
- User A (`70ba19bf-93de-4afd-8df8-bbb03746a829` / `9234133572`): 0 orders, 0 addresses
- User B (`acf583eb-6ef9-4031-9df5-ba742a1824c9` / `919234133572`): 1 orders, 1 addresses
- **919312369843**:
- User A (`a35a50e5-2974-43d9-b13e-7e2001d0f441` / `9312369843`): 0 orders, 0 addresses
- User B (`49db3db3-2224-494e-8aaa-756dfbd6342a` / `919312369843`): 1 orders, 1 addresses
- **919431457166**:
- User A (`68841aa1-4133-4102-bcb3-1e4bb5d56a9d` / `9431457166`): 0 orders, 0 addresses
- User B (`c49aef24-6c11-45ba-83bc-c4231d386c99` / `919431457166`): 0 orders, 0 addresses
- **919460195466**:
- User A (`4407a333-2f21-48e1-a6f2-1c8dcb83365d` / `9460195466`): 0 orders, 0 addresses
- User B (`ef11e80b-c824-4c5a-9b9e-1654c652c56b` / `919460195466`): 0 orders, 0 addresses
- **919548417559**:
- User A (`1f939b6e-9ad7-4a40-95eb-f1dbe8205cf0` / `9548417559`): 0 orders, 0 addresses
- User B (`ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4` / `919548417559`): 0 orders, 0 addresses
- **919569521972**:
- User A (`0ba5d1d4-4d3e-4d89-b9b5-212e4cd30bbe` / `9569521972`): 0 orders, 0 addresses
- User B (`5db94409-93c1-4c9f-b7b5-d350667ec528` / `919569521972`): 1 orders, 1 addresses
- **919580793778**:
- User A (`1f8b15d1-826d-48ef-b7f0-4d404565f628` / `9580793778`): 0 orders, 0 addresses
- User B (`e206c26f-7fc8-4863-b971-edb61b374767` / `919580793778`): 2 orders, 1 addresses
- **919604812161**:
- User A (`548d3850-9f2f-4aeb-949f-f21efdcd984a` / `9604812161`): 0 orders, 0 addresses
- User B (`1486d221-9d16-4347-b3b2-815d1ad2a892` / `919604812161`): 1 orders, 0 addresses
- **919617658659**:
- User A (`3053c4c0-bd0a-401b-80ca-b1621593d8d7` / `9617658659`): 0 orders, 0 addresses
- User B (`be60c847-98d0-4511-9557-3d38babd5361` / `919617658659`): 1 orders, 1 addresses
- **919644896049**:
- User A (`061f8f18-23dd-49a8-be31-8c504576ba1f` / `9644896049`): 0 orders, 0 addresses
- User B (`5a9e2012-401b-4be6-8ddd-e7687b964566` / `919644896049`): 1 orders, 0 addresses
- **919685787200**:
- User A (`0f60b1eb-3e26-4ddc-bd34-880c977a2ae8` / `9685787200`): 0 orders, 0 addresses
- User B (`77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0` / `919685787200`): 2 orders, 2 addresses
- **919689120412**:
- User A (`a497fcd3-0734-4135-961c-61b57ec69ed2` / `9689120412`): 0 orders, 0 addresses
- User B (`61a0e405-6204-4015-840d-6ad93873901d` / `919689120412`): 1 orders, 1 addresses
- **919712932302**:
- User A (`f6b9f983-fcf5-4ba4-ab5c-17471db979fd` / `9712932302`): 0 orders, 0 addresses
- User B (`9a24bd0c-476b-448f-97bd-70e08960f904` / `919712932302`): 0 orders, 0 addresses
- **919764566466**:
- User A (`b3269e2c-a569-4a93-ba24-ecbacf54590d` / `9764566466`): 0 orders, 0 addresses
- User B (`8e4397b0-c581-4853-b537-5b3eceb75c6b` / `919764566466`): 1 orders, 1 addresses
- **919806254050**:
- User A (`544927e1-5073-4faa-84d1-bb56b303e386` / `9806254050`): 0 orders, 0 addresses
- User B (`ca6f6e3a-8a2d-4fcb-a876-7835cc1da692` / `919806254050`): 1 orders, 1 addresses
- **919813886201**:
- User A (`beaf6128-9fb8-40cc-94fc-b03c7fdd1a32` / `9813886201`): 0 orders, 0 addresses
- User B (`21dacd91-75d6-4321-a368-19f4416c2add` / `919813886201`): 1 orders, 0 addresses
- **919828387166**:
- User A (`6c87a88b-1038-4cf2-8a82-b662121aab4d` / `9828387166`): 0 orders, 0 addresses
- User B (`05e37eb2-d2a5-4f0a-a644-cf469693c475` / `919828387166`): 0 orders, 0 addresses
- **919899383485**:
- User A (`d4abff7c-70bb-44cb-ad2f-a5c2cc697dd3` / `9899383485`): 0 orders, 0 addresses
- User B (`07197577-6d3e-4cf8-a55d-8a8ca5ad37ef` / `919899383485`): 2 orders, 1 addresses
- **919935895884**:
- User A (`16930cda-89a5-47e8-9868-3cb5507bdf55` / `9935895884`): 0 orders, 0 addresses
- User B (`b33ea620-1420-4420-8261-92d530614f6b` / `919935895884`): 1 orders, 0 addresses
- **919967244573**:
- User A (`af2f3d4b-4b03-4c9c-9b06-074161a98dae` / `9967244573`): 0 orders, 0 addresses
- User B (`b18c4898-f7c2-4a5f-919e-32507775512d` / `919967244573`): 0 orders, 0 addresses
- **919999999999**:
- User A (`b8cd2d08-988e-4e9e-abb8-20482986e5ce` / `9999999999`): 0 orders, 0 addresses
- User B (`aad66182-bd3c-428d-bfc8-62b6017ac840` / `919999999999`): 0 orders, 0 addresses

### Requires Manual Review (2 Groups)
These groups contain active e-commerce data (orders or addresses) on BOTH user records. Merging these profiles requires moving User A's orders and addresses to the canonical User B ID.
- **917974478098**:
- User A (`6f91280a-d400-4cf4-85ee-b6014d5b5917` / `7974478098`): 4 orders, 2 addresses
- User B (`d9d433bc-dd57-4563-8e78-9a0fbd37b59d` / `917974478098`): 6 orders, 6 addresses
- **918109422241**:
- User A (`8fcbfb52-022c-4f03-8225-650127cc090a` / `8109422241`): 3 orders, 1 addresses
- User B (`53496531-dcc4-45e6-9442-8922efc4cb85` / `918109422241`): 3 orders, 3 addresses

### High-Risk Financial/Affiliate Data (2 Groups)
These groups have active referral logs, wallet listings, or commission values associated with User A. Auto-merging or deleting is highly discouraged until commission percentages and affiliate payouts are verified.
- **917999279610**:
- User A (`2d2aa0e1-dca2-4928-8ed4-cc92506d80b8` / `7999279610`): 6 orders, 1 addresses
- User B (`4d2a11ad-e7c0-4af7-af7a-af5789fa267d` / `917999279610`): 0 orders, 1 addresses
- **919009046430**:
- User A (`6c386c97-bd16-444c-84fa-d0a4e73c4530` / `9009046430`): 4 orders, 1 addresses
- User B (`bb82366c-ee99-4c4f-a6e7-9a1612479aa1` / `919009046430`): 0 orders, 1 addresses

---

## 7. Complete Group-by-Group Dependency Map (Phase 11 format)

Below is the verification breakdown for all 42 groups.

### Group 1: Phone 916203288535
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
916203288535

USER A
UUID: a58c33e1-a616-418c-9daf-1c6ead76fbf2
Stored Phone: 6203288535
Name: N/A
Email: N/A
Created: 2026-07-24T03:15:48.056661+00:00
Last Login: 2026-07-24T03:15:48.44+00:00

USER B
UUID: be26646b-bf95-4082-9e1c-47e11d910c68
Stored Phone: 916203288535
Name: N/A
Email: pritamrajak16@gmail.com
Created: 2026-07-24T03:15:48.978458+00:00
Last Login: 2026-07-24T03:15:49.302+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 2: Phone 916204175088
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
916204175088

USER A
UUID: cbb6a1d2-6c0b-4e3f-be29-ddc20ffa457e
Stored Phone: 6204175088
Name: N/A
Email: N/A
Created: 2026-07-23T14:56:18.84586+00:00
Last Login: 2026-07-23T14:56:18.466+00:00

USER B
UUID: 3b5b751f-bbdb-4438-8ff1-f33e08518543
Stored Phone: 916204175088
Name: N/A
Email: N/A
Created: 2026-07-23T14:59:33.661209+00:00
Last Login: 2026-07-23T14:59:33.986+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 3: Phone 916376206618
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
916376206618

USER A
UUID: 353a4f7a-50bf-4726-9263-835826bd59f6
Stored Phone: 6376206618
Name: N/A
Email: N/A
Created: 2026-07-23T02:01:44.864608+00:00
Last Login: 2026-07-23T02:01:43.627+00:00

USER B
UUID: fd72dd3c-50a0-448d-8909-6ff17a14d5c5
Stored Phone: 916376206618
Name: N/A
Email: N/A
Created: 2026-07-23T02:01:45.720167+00:00
Last Login: 2026-07-23T02:01:46.021+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 4: Phone 917017308966
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917017308966

USER A
UUID: 9c95dcf1-6ff7-44e8-aef3-f719ad2a04cc
Stored Phone: 7017308966
Name: N/A
Email: N/A
Created: 2026-07-23T13:43:51.789812+00:00
Last Login: 2026-07-23T13:43:48.943+00:00

USER B
UUID: ffacfb93-fa3a-4e10-9a0f-4cb6ddaf13e7
Stored Phone: 917017308966
Name: N/A
Email: N/A
Created: 2026-07-23T13:43:53.576185+00:00
Last Login: 2026-07-23T13:43:53.831+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 5: Phone 917383130148
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917383130148

USER A
UUID: ff824a1b-e0a1-4249-8c75-2c9362e33f1e
Stored Phone: 7383130148
Name: N/A
Email: N/A
Created: 2026-07-23T09:59:45.475991+00:00
Last Login: 2026-07-23T09:59:44.5+00:00

USER B
UUID: e7978155-f476-455d-b700-dfa9863c8c87
Stored Phone: 917383130148
Name: N/A
Email: heena1234567890789@gmail.com
Created: 2026-07-23T09:59:46.317221+00:00
Last Login: 2026-07-23T09:59:46.557+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 6: Phone 917408405612
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917408405612

USER A
UUID: ce5fd7ff-d400-4869-a598-dd13c63ce510
Stored Phone: 7408405612
Name: N/A
Email: N/A
Created: 2026-07-23T13:04:19.959888+00:00
Last Login: 2026-07-23T13:04:18.659+00:00

USER B
UUID: a32964ed-b361-4105-ba0e-550e30c825f6
Stored Phone: 917408405612
Name: N/A
Email: N/A
Created: 2026-07-23T13:04:21.949903+00:00
Last Login: 2026-07-23T13:04:22.28+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 7: Phone 917631598563
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917631598563

USER A
UUID: 9ecc1ec5-e311-49c7-b6d0-b4e6f776236f
Stored Phone: 7631598563
Name: N/A
Email: N/A
Created: 2026-07-23T10:44:55.653657+00:00
Last Login: 2026-07-23T10:44:55.023+00:00

USER B
UUID: 5e872698-10e8-492c-9fcd-c2bb47f145ba
Stored Phone: 917631598563
Name: N/A
Email: kumar5687899@gmail.com
Created: 2026-07-23T10:44:56.349543+00:00
Last Login: 2026-07-23T10:44:56.626+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 8: Phone 917742422277
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917742422277

USER A
UUID: e53441ea-8046-456d-9fb1-162dcf19feb8
Stored Phone: 7742422277
Name: N/A
Email: N/A
Created: 2026-07-23T12:34:40.590638+00:00
Last Login: 2026-07-23T12:34:39.987+00:00

USER B
UUID: faf2bc3c-b15a-43d7-b31e-3f044813788e
Stored Phone: 917742422277
Name: N/A
Email: N/A
Created: 2026-07-23T12:34:41.384964+00:00
Last Login: 2026-07-23T12:34:41.606+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 9: Phone 917874980572
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917874980572

USER A
UUID: e63adc0a-5875-4e6f-9169-9b14169754ca
Stored Phone: 7874980572
Name: N/A
Email: N/A
Created: 2026-07-23T09:17:06.335126+00:00
Last Login: 2026-07-23T09:17:04.905+00:00

USER B
UUID: a604fbb9-6c3f-4d04-8e5f-1fc79a5b314e
Stored Phone: 917874980572
Name: N/A
Email: ektab1991@gmail.com
Created: 2026-07-23T09:17:07.727303+00:00
Last Login: 2026-07-23T09:38:16.184+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          2
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 10: Phone 917974478098
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917974478098

USER A
UUID: 6f91280a-d400-4cf4-85ee-b6014d5b5917
Stored Phone: 7974478098
Name: N/A
Email: patelsahil797447@gmail.com
Created: 2026-07-13T19:38:20.381452+00:00
Last Login: 2026-07-22T17:20:14.748012+00:00

USER B
UUID: d9d433bc-dd57-4563-8e78-9a0fbd37b59d
Stored Phone: 917974478098
Name: N/A
Email: N/A
Created: 2026-07-22T18:35:03.302985+00:00
Last Login: 2026-07-23T14:36:47.179+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         5          4
website_store_orders                  4          6
website_store_addresses               2          6
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[HAS DATA]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NEEDS MANUAL REVIEW]

Reason:
Both User A and User B have active orders/addresses in the database. Deleting User A will orphan business data unless records are updated to point to User B.
```

### Group 11: Phone 917978935494
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917978935494

USER A
UUID: d3100829-f9b0-4163-967c-3f9bcbd3451f
Stored Phone: 7978935494
Name: N/A
Email: N/A
Created: 2026-07-23T02:47:40.291604+00:00
Last Login: 2026-07-23T02:47:38.681+00:00

USER B
UUID: 9322afbf-f0e0-43d2-a05f-4ae2eb547218
Stored Phone: 917978935494
Name: N/A
Email: N/A
Created: 2026-07-23T02:47:41.077771+00:00
Last Login: 2026-07-23T02:47:41.296+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 12: Phone 917999279610
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
917999279610

USER A
UUID: 2d2aa0e1-dca2-4928-8ed4-cc92506d80b8
Stored Phone: 7999279610
Name: Navneet
Email: tradinghack3@gmail.com
Created: 2026-07-13T18:57:59.012638+00:00
Last Login: 2026-07-22T18:21:59.213084+00:00

USER B
UUID: 4d2a11ad-e7c0-4af7-af7a-af5789fa267d
Stored Phone: 917999279610
Name: N/A
Email: udaipurmountabu8@gmail.com
Created: 2026-07-23T12:23:59.153188+00:00
Last Login: 2026-07-23T12:49:21.907+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         5          3
website_store_orders                  6          0
website_store_addresses               1          1
affiliate_wallets                     1          0
affiliate_relationships               1          0
affiliate_commissions                2          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[HAS DATA]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[HIGH-RISK FINANCIAL/AFFILIATE]

Reason:
User A has references in affiliate commissions or clicks. Affiliate relationships must be reconciled manually.
```

### Group 13: Phone 918103314636
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
918103314636

USER A
UUID: b9c1008f-e529-4809-8d4d-e70c443777ee
Stored Phone: 8103314636
Name: N/A
Email: N/A
Created: 2026-07-23T05:54:06.166002+00:00
Last Login: 2026-07-23T05:54:02.049+00:00

USER B
UUID: 94d8d30a-c5fe-40d2-bc88-65ccd637577b
Stored Phone: 918103314636
Name: N/A
Email: N/A
Created: 2026-07-23T05:54:07.206642+00:00
Last Login: 2026-07-23T05:54:07.492+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 14: Phone 918109422241
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
918109422241

USER A
UUID: 8fcbfb52-022c-4f03-8225-650127cc090a
Stored Phone: 8109422241
Name: N/A
Email: purab.sharma@avantika.ed.in
Created: 2026-07-08T15:22:00.016195+00:00
Last Login: 2026-07-22T12:22:53.584528+00:00

USER B
UUID: 53496531-dcc4-45e6-9442-8922efc4cb85
Stored Phone: 918109422241
Name: N/A
Email: purabs640@gmail.com
Created: 2026-07-23T12:17:30.277627+00:00
Last Login: 2026-07-23T12:17:30.517+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         3          1
website_store_orders                  3          3
website_store_addresses               1          3
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[HAS DATA]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NEEDS MANUAL REVIEW]

Reason:
Both User A and User B have active orders/addresses in the database. Deleting User A will orphan business data unless records are updated to point to User B.
```

### Group 15: Phone 918299138372
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
918299138372

USER A
UUID: 5f4ec778-bb2c-402c-b46c-f2d83f10ef33
Stored Phone: 8299138372
Name: N/A
Email: N/A
Created: 2026-07-23T07:42:42.874687+00:00
Last Login: 2026-07-23T07:42:35.113+00:00

USER B
UUID: 1274ce5d-6fe7-4663-902e-ff6a2f54f80c
Stored Phone: 918299138372
Name: N/A
Email: gdolly863@gmail.com
Created: 2026-07-23T07:42:45.231571+00:00
Last Login: 2026-07-23T07:42:45.462+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 16: Phone 918320782942
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
918320782942

USER A
UUID: d9dfbd7a-ba07-480d-835f-3d28ab2fda00
Stored Phone: 8320782942
Name: N/A
Email: N/A
Created: 2026-07-24T03:06:13.480794+00:00
Last Login: 2026-07-24T03:06:11.782+00:00

USER B
UUID: 8b455565-4b4d-43eb-9dec-68d788f2cd66
Stored Phone: 918320782942
Name: N/A
Email: N/A
Created: 2026-07-24T03:06:14.341652+00:00
Last Login: 2026-07-24T03:06:14.634+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 17: Phone 918521600214
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
918521600214

USER A
UUID: 528565be-2a51-4055-818d-5fad9669be5c
Stored Phone: 8521600214
Name: N/A
Email: N/A
Created: 2026-07-23T11:55:28.61074+00:00
Last Login: 2026-07-23T11:55:27.269+00:00

USER B
UUID: 17bdace1-d33e-4990-b3e0-83497aa69a1d
Stored Phone: 918521600214
Name: N/A
Email: N/A
Created: 2026-07-23T11:55:29.575259+00:00
Last Login: 2026-07-23T12:42:54.358+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          2
website_store_orders                  0          3
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 18: Phone 918819897434
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
918819897434

USER A
UUID: 4bc8cc36-ab55-4db7-85ba-ab0803923a19
Stored Phone: 8819897434
Name: N/A
Email: sahilInstitute@gmail.com
Created: 2026-07-21T15:51:09.865636+00:00
Last Login: 2026-07-22T10:01:05.782006+00:00

USER B
UUID: b7231561-31c6-40de-ba4a-0e1062b691b5
Stored Phone: 918819897434
Name: N/A
Email: N/A
Created: 2026-07-23T09:29:18.90359+00:00
Last Login: 2026-07-23T09:29:19.276+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         2          1
website_store_orders                  1          0
website_store_addresses               1          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[HAS DATA]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 19: Phone 919009046430
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919009046430

USER A
UUID: 6c386c97-bd16-444c-84fa-d0a4e73c4530
Stored Phone: 9009046430
Name: N/A
Email: udaipurtrip333@gmail.com
Created: 2026-07-13T19:01:01.279225+00:00
Last Login: 2026-07-13T19:05:43.937687+00:00

USER B
UUID: bb82366c-ee99-4c4f-a6e7-9a1612479aa1
Stored Phone: 919009046430
Name: N/A
Email: mantrapuja7@gmail.com
Created: 2026-07-23T11:42:22.548668+00:00
Last Login: 2026-07-23T13:48:55.412+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         2          2
website_store_orders                  4          0
website_store_addresses               1          1
affiliate_wallets                     0          0
affiliate_relationships               1          0
affiliate_commissions                2          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[HAS DATA]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[HIGH-RISK FINANCIAL/AFFILIATE]

Reason:
User A has references in affiliate commissions or clicks. Affiliate relationships must be reconciled manually.
```

### Group 20: Phone 919065524534
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919065524534

USER A
UUID: 1631e59a-e552-48e8-ae61-88f7bb856abb
Stored Phone: 9065524534
Name: N/A
Email: N/A
Created: 2026-07-24T00:32:03.493517+00:00
Last Login: 2026-07-24T00:32:02.766+00:00

USER B
UUID: 780c445c-a3ff-4caf-b64e-80c65a7e6568
Stored Phone: 919065524534
Name: N/A
Email: N/A
Created: 2026-07-24T00:32:04.280708+00:00
Last Login: 2026-07-24T00:32:04.513+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 21: Phone 919193833159
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919193833159

USER A
UUID: 4defde13-cd29-4eb0-8cf9-e0dd779244f6
Stored Phone: 9193833159
Name: N/A
Email: N/A
Created: 2026-07-23T04:35:44.593617+00:00
Last Login: 2026-07-23T04:35:44.228+00:00

USER B
UUID: 20362a06-2966-466e-8ef9-a73b345c518c
Stored Phone: 919193833159
Name: N/A
Email: N/A
Created: 2026-07-23T04:35:45.415978+00:00
Last Login: 2026-07-23T04:35:45.701+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 22: Phone 919234133572
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919234133572

USER A
UUID: 70ba19bf-93de-4afd-8df8-bbb03746a829
Stored Phone: 9234133572
Name: N/A
Email: N/A
Created: 2026-07-23T02:48:10.909174+00:00
Last Login: 2026-07-23T02:48:10.015+00:00

USER B
UUID: acf583eb-6ef9-4031-9df5-ba742a1824c9
Stored Phone: 919234133572
Name: N/A
Email: pihusharma2501@gmail.com
Created: 2026-07-23T02:50:44.678427+00:00
Last Login: 2026-07-23T02:50:44.897+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 23: Phone 919312369843
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919312369843

USER A
UUID: a35a50e5-2974-43d9-b13e-7e2001d0f441
Stored Phone: 9312369843
Name: N/A
Email: N/A
Created: 2026-07-23T07:58:37.836869+00:00
Last Login: 2026-07-23T07:58:36.133+00:00

USER B
UUID: 49db3db3-2224-494e-8aaa-756dfbd6342a
Stored Phone: 919312369843
Name: N/A
Email: padmajalawassociates@gmail.com
Created: 2026-07-23T07:58:38.618576+00:00
Last Login: 2026-07-23T07:58:38.844+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 24: Phone 919431457166
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919431457166

USER A
UUID: 68841aa1-4133-4102-bcb3-1e4bb5d56a9d
Stored Phone: 9431457166
Name: N/A
Email: N/A
Created: 2026-07-23T08:35:57.05847+00:00
Last Login: 2026-07-23T08:35:56.221+00:00

USER B
UUID: c49aef24-6c11-45ba-83bc-c4231d386c99
Stored Phone: 919431457166
Name: N/A
Email: N/A
Created: 2026-07-23T08:35:57.97377+00:00
Last Login: 2026-07-23T08:35:58.204+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 25: Phone 919460195466
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919460195466

USER A
UUID: 4407a333-2f21-48e1-a6f2-1c8dcb83365d
Stored Phone: 9460195466
Name: N/A
Email: N/A
Created: 2026-07-23T22:21:36.0743+00:00
Last Login: 2026-07-23T22:21:31.712+00:00

USER B
UUID: ef11e80b-c824-4c5a-9b9e-1654c652c56b
Stored Phone: 919460195466
Name: N/A
Email: N/A
Created: 2026-07-23T22:21:39.005568+00:00
Last Login: 2026-07-23T22:21:39.226+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 26: Phone 919548417559
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919548417559

USER A
UUID: 1f939b6e-9ad7-4a40-95eb-f1dbe8205cf0
Stored Phone: 9548417559
Name: N/A
Email: N/A
Created: 2026-07-23T15:10:35.154634+00:00
Last Login: 2026-07-23T15:10:34.491+00:00

USER B
UUID: ce8a070c-ce3e-46e2-8a73-ecdbdc1845a4
Stored Phone: 919548417559
Name: N/A
Email: N/A
Created: 2026-07-23T15:10:35.980458+00:00
Last Login: 2026-07-23T15:10:36.283+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 27: Phone 919569521972
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919569521972

USER A
UUID: 0ba5d1d4-4d3e-4d89-b9b5-212e4cd30bbe
Stored Phone: 9569521972
Name: N/A
Email: N/A
Created: 2026-07-23T15:36:56.182695+00:00
Last Login: 2026-07-23T15:36:55.048+00:00

USER B
UUID: 5db94409-93c1-4c9f-b7b5-d350667ec528
Stored Phone: 919569521972
Name: N/A
Email: harishhema023@gmail.com
Created: 2026-07-23T15:36:57.160775+00:00
Last Login: 2026-07-23T15:36:57.438+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 28: Phone 919580793778
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919580793778

USER A
UUID: 1f8b15d1-826d-48ef-b7f0-4d404565f628
Stored Phone: 9580793778
Name: N/A
Email: N/A
Created: 2026-07-24T04:25:07.603833+00:00
Last Login: 2026-07-24T04:25:06.225+00:00

USER B
UUID: e206c26f-7fc8-4863-b971-edb61b374767
Stored Phone: 919580793778
Name: N/A
Email: neharastogi953@gmail.com
Created: 2026-07-24T04:25:08.246527+00:00
Last Login: 2026-07-24T05:55:33.4+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          2
website_store_orders                  0          2
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 29: Phone 919604812161
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919604812161

USER A
UUID: 548d3850-9f2f-4aeb-949f-f21efdcd984a
Stored Phone: 9604812161
Name: N/A
Email: N/A
Created: 2026-07-23T11:37:50.655309+00:00
Last Login: 2026-07-23T11:37:50.147+00:00

USER B
UUID: 1486d221-9d16-4347-b3b2-815d1ad2a892
Stored Phone: 919604812161
Name: N/A
Email: N/A
Created: 2026-07-23T12:57:09.042761+00:00
Last Login: 2026-07-23T12:57:09.32+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 30: Phone 919617658659
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919617658659

USER A
UUID: 3053c4c0-bd0a-401b-80ca-b1621593d8d7
Stored Phone: 9617658659
Name: N/A
Email: N/A
Created: 2026-07-24T02:05:48.123441+00:00
Last Login: 2026-07-24T02:05:46.296+00:00

USER B
UUID: be60c847-98d0-4511-9557-3d38babd5361
Stored Phone: 919617658659
Name: N/A
Email: prajapatirenu779@gmail.com
Created: 2026-07-24T02:05:49.279324+00:00
Last Login: 2026-07-24T02:05:49.555+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 31: Phone 919644896049
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919644896049

USER A
UUID: 061f8f18-23dd-49a8-be31-8c504576ba1f
Stored Phone: 9644896049
Name: N/A
Email: N/A
Created: 2026-07-23T11:37:57.246741+00:00
Last Login: 2026-07-23T11:37:56.661+00:00

USER B
UUID: 5a9e2012-401b-4be6-8ddd-e7687b964566
Stored Phone: 919644896049
Name: N/A
Email: N/A
Created: 2026-07-23T13:22:54.291971+00:00
Last Login: 2026-07-23T13:22:54.554+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 32: Phone 919685787200
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919685787200

USER A
UUID: 0f60b1eb-3e26-4ddc-bd34-880c977a2ae8
Stored Phone: 9685787200
Name: N/A
Email: N/A
Created: 2026-07-23T09:46:10.190636+00:00
Last Login: 2026-07-23T09:46:09.441+00:00

USER B
UUID: 77aef8fd-1f35-4f98-b8a4-c2d16ab5d5e0
Stored Phone: 919685787200
Name: N/A
Email: ravindranathyogi@1988gmail.com
Created: 2026-07-23T09:46:12.049095+00:00
Last Login: 2026-07-23T09:46:12.366+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          2
website_store_addresses               0          2
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 33: Phone 919689120412
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919689120412

USER A
UUID: a497fcd3-0734-4135-961c-61b57ec69ed2
Stored Phone: 9689120412
Name: N/A
Email: N/A
Created: 2026-07-23T09:58:02.623865+00:00
Last Login: 2026-07-23T09:58:00.143+00:00

USER B
UUID: 61a0e405-6204-4015-840d-6ad93873901d
Stored Phone: 919689120412
Name: N/A
Email: ramtirthkaramol12@gmail.com
Created: 2026-07-23T09:58:03.622564+00:00
Last Login: 2026-07-23T09:58:03.875+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 34: Phone 919712932302
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919712932302

USER A
UUID: f6b9f983-fcf5-4ba4-ab5c-17471db979fd
Stored Phone: 9712932302
Name: N/A
Email: N/A
Created: 2026-07-23T05:00:52.983031+00:00
Last Login: 2026-07-23T05:00:52.47+00:00

USER B
UUID: 9a24bd0c-476b-448f-97bd-70e08960f904
Stored Phone: 919712932302
Name: N/A
Email: N/A
Created: 2026-07-23T05:00:54.255105+00:00
Last Login: 2026-07-23T05:00:54.536+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 35: Phone 919764566466
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919764566466

USER A
UUID: b3269e2c-a569-4a93-ba24-ecbacf54590d
Stored Phone: 9764566466
Name: N/A
Email: N/A
Created: 2026-07-23T14:24:54.335835+00:00
Last Login: 2026-07-23T14:24:51.899+00:00

USER B
UUID: 8e4397b0-c581-4853-b537-5b3eceb75c6b
Stored Phone: 919764566466
Name: N/A
Email: vishalmakhamale84@gmail.com
Created: 2026-07-23T14:25:35.575702+00:00
Last Login: 2026-07-23T14:25:35.819+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 36: Phone 919806254050
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919806254050

USER A
UUID: 544927e1-5073-4faa-84d1-bb56b303e386
Stored Phone: 9806254050
Name: N/A
Email: N/A
Created: 2026-07-23T13:03:05.784244+00:00
Last Login: 2026-07-23T13:03:04.189+00:00

USER B
UUID: ca6f6e3a-8a2d-4fcb-a876-7835cc1da692
Stored Phone: 919806254050
Name: N/A
Email: dpadwar@gmail.com
Created: 2026-07-23T13:03:06.564657+00:00
Last Login: 2026-07-23T14:49:39.583+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          2
website_store_orders                  0          1
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 37: Phone 919813886201
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919813886201

USER A
UUID: beaf6128-9fb8-40cc-94fc-b03c7fdd1a32
Stored Phone: 9813886201
Name: N/A
Email: N/A
Created: 2026-07-23T08:13:44.134887+00:00
Last Login: 2026-07-23T08:13:14.765+00:00

USER B
UUID: 21dacd91-75d6-4321-a368-19f4416c2add
Stored Phone: 919813886201
Name: N/A
Email: N/A
Created: 2026-07-23T08:13:45.844182+00:00
Last Login: 2026-07-23T08:13:46.086+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 38: Phone 919828387166
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919828387166

USER A
UUID: 6c87a88b-1038-4cf2-8a82-b662121aab4d
Stored Phone: 9828387166
Name: N/A
Email: N/A
Created: 2026-07-23T03:35:27.997898+00:00
Last Login: 2026-07-23T03:35:24.778+00:00

USER B
UUID: 05e37eb2-d2a5-4f0a-a644-cf469693c475
Stored Phone: 919828387166
Name: N/A
Email: N/A
Created: 2026-07-23T03:35:28.818808+00:00
Last Login: 2026-07-23T03:35:29.066+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 39: Phone 919899383485
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919899383485

USER A
UUID: d4abff7c-70bb-44cb-ad2f-a5c2cc697dd3
Stored Phone: 9899383485
Name: N/A
Email: N/A
Created: 2026-07-23T07:39:47.829622+00:00
Last Login: 2026-07-23T07:39:47.921+00:00

USER B
UUID: 07197577-6d3e-4cf8-a55d-8a8ca5ad37ef
Stored Phone: 919899383485
Name: N/A
Email: parveenpanwar1986@gmail.com
Created: 2026-07-23T07:39:48.466296+00:00
Last Login: 2026-07-23T07:39:48.689+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          2
website_store_addresses               0          1
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 40: Phone 919935895884
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919935895884

USER A
UUID: 16930cda-89a5-47e8-9868-3cb5507bdf55
Stored Phone: 9935895884
Name: N/A
Email: N/A
Created: 2026-07-23T04:45:27.848363+00:00
Last Login: 2026-07-23T04:45:27.109+00:00

USER B
UUID: b33ea620-1420-4420-8261-92d530614f6b
Stored Phone: 919935895884
Name: N/A
Email: N/A
Created: 2026-07-23T04:45:28.545826+00:00
Last Login: 2026-07-23T04:45:28.813+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          1
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[HAS DATA]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 41: Phone 919967244573
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919967244573

USER A
UUID: af2f3d4b-4b03-4c9c-9b06-074161a98dae
Stored Phone: 9967244573
Name: N/A
Email: N/A
Created: 2026-07-23T15:10:04.909113+00:00
Last Login: 2026-07-23T15:09:53.388+00:00

USER B
UUID: b18c4898-f7c2-4a5f-919e-32507775512d
Stored Phone: 919967244573
Name: N/A
Email: N/A
Created: 2026-07-23T15:10:12.74955+00:00
Last Login: 2026-07-23T15:10:13.041+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

### Group 42: Phone 919999999999
```text
==================================================
DUPLICATE GROUP
==================================================

Normalized Phone:
919999999999

USER A
UUID: b8cd2d08-988e-4e9e-abb8-20482986e5ce
Stored Phone: 9999999999
Name: N/A
Email: N/A
Created: 2026-07-23T09:07:25.849606+00:00
Last Login: 2026-07-23T09:07:25.691+00:00

USER B
UUID: aad66182-bd3c-428d-bfc8-62b6017ac840
Stored Phone: 919999999999
Name: N/A
Email: N/A
Created: 2026-07-22T18:30:49.286298+00:00
Last Login: 2026-07-22T18:30:49.574+00:00

==================================================
DEPENDENCY SUMMARY
==================================================

Table                              User A     User B
----------------------------------------------------
user_sessions                         0          1
website_store_orders                  0          0
website_store_addresses               0          0
affiliate_wallets                     0          0
affiliate_relationships               0          0
affiliate_commissions                0          0
coupon_redemptions                    0          0
pundit records                        0          0

==================================================
BUSINESS DATA STATUS
==================================================

User A:
[EMPTY]

User B:
[EMPTY]

==================================================
POTENTIAL CONFLICT
==================================================

[NO CONFLICT]

Reason:
User A has no active e-commerce data (orders or addresses). It is safe to merge User A into User B after re-linking sessions.
```

---

## 8. Explicit No Changes Confirmation

We confirm that this audit was performed strictly as a read-only introspection:
- **No INSERT operations were executed.**
- **No UPDATE operations were executed.**
- **No DELETE operations were executed.**
- **No user data was modified.**
- **No orders were modified.**
- **No payments were modified.**
- **No addresses were modified.**
- **No affiliate or wallet data was modified.**

This report represents a complete and manually verifiable map of the database duplication states.
