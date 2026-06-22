# Pandit Ji Information Sheet (MantraPuja Platform)

This document contains a comprehensive collection of all the data fields, UI elements, inputs, and database columns associated with Pandit Ji (Vedic Acharyas) across the **MantraPuja Mobile Application** and **Admin/Registration Platform**.

---

## 1. App UI Display Fields (Vedic Pandits Directory)
These are the fields currently displayed to users on the **Vedic Pandits Directory Screen** (`app/(tabs)/astro.tsx`):

| UI Field Name | Data Type | Description / Example |
| :--- | :--- | :--- |
| **Name** | `string` | Full name of the priest (e.g., `Acharya Guru Ji`) |
| **Avatar / Profile Photo** | `image / url` | Display picture of Pandit Ji (e.g., custom uploaded URL or avatar path) |
| **Title** | `string` | A brief spiritual title or lineage designation (e.g., `Senior Ritualist & Yajmana Specialist`) |
| **Base Location / Temple** | `string` | Temple and city where Pandit Ji conducts rituals (e.g., `Kashi Vishwanath Temple, Varanasi`) |
| **Experience** | `number` | Total years of Vedic practice (e.g., `15+ Years`) |
| **Rituals Performed** | `number` | Total number of Pujas/Sankalps completed on the platform (e.g., `1500+ Pujas`) |
| **Rating** | `number` | Average review rating out of 5 (e.g., `4.9`) |
| **Languages Spoken** | `array of strings` | Languages in which Pandit Ji can chant or communicate (e.g., `["Hindi", "Sanskrit", "English"]`) |
| **Specialities** | `array of strings` | Specific Pujas and Homas Pandit Ji is certified in (e.g., `["Griha Pravesh", "Navgrah Homa", "Rudrabhishek"]`) |
| **Bio / Description** | `string` | Detailed biography of their spiritual training, traditional Gurukul roots, and style of invocation. |

---

## 2. Devotee Booking Details (When a User Books a Pandit)
When a user books a Pandit Ji on the booking screen (`app/book_pandit_puja.tsx`), these fields are captured and passed:

| Input Field Name | Component / Data Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| **Devotee Full Name** | TextInput (`string`) | Name to be chanted by Pandit Ji during Sankalp | **Yes** |
| **Gotra** | TextInput (`string`) | Traditional Vedic family lineage / Gotra | No (Optional) |
| **Contact Phone** | TextInput (`string`) | 10-digit devotee contact number | **Yes** |
| **Preferred Date** | TextInput/Picker (`YYYY-MM-DD`) | Selected date for the ritual | **Yes** |
| **Preferred Time Slot** | TextInput/Picker (`string`) | Chosen time window (e.g., `06:00 PM`) | **Yes** |
| **Puja Venue Type** | Switch/Pills (`"home" \| "temple" \| "online"`) | Where the puja will be conducted | **Yes** |
| **Venue Address** | TextInput (`string`) | Travel address (for Home/Temple venue types) | **Yes** (If Home/Temple) |
| **Special Wish / Request**| TextInput (`string`) | Devotee's personal prayer or sankalp wish | No (Optional) |
| **Pandit Dakshina** | Selection grid (`number`) | Token of appreciation offering (e.g. `₹21`, `₹51`, `₹101`, `₹251`, or `Custom`) | **Yes** |

---

## 3. Database Schema (`public.pandits` Table)
The relational schema structure defined in the PostgreSQL database migrations (`migrations/20260529000000_unified_puja_store.sql`):

```sql
CREATE TABLE public.pandits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gotra TEXT NOT NULL,                   -- Pandit Ji's spiritual gotra
    experience_years INT DEFAULT 0,
    profile_picture TEXT,                  -- Cloudflare R2 bucket image link
    base_temple_id UUID REFERENCES public.temples(id) ON DELETE SET NULL,
    languages_spoken TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 4. Suggested Registration Fields (Vedic Platform Portal)
To implement a robust self-service registration process for Pandit Ji, we recommend collecting the following fields in the registration form:

### A. Contact & Personal Verification
1. **Full Name** (`name`) — *Required*
2. **Spiritual Gotra** (`gotra`) — *Required*
3. **Contact Phone Number** (`phone`) — *Required for SMS/Verification*
4. **Email Address** (`email`) — *Optional*

### B. Professional Spiritual Profile
5. **Vedic Title** (`title`) — *Required* (e.g., `Acharya / Shastri / Swami`)
6. **Years of Active Experience** (`experience_years`) — *Required*
7. **Base Temple/City Location** (`location`) — *Required*
8. **Languages Spoken** (`languages_spoken`) — *Multi-select checkboxes* (Hindi, Sanskrit, English, Marathi, Gujarati, Telugu, Tamil, Kannada, Bengali)

### C. Details & Uploads
9. **Speciality Rituals** (`specialities`) — *Multi-select checkboxes* (Homa/Havan, Griha Pravesh, Shanti Path, Mahalakshmi Puja, Ganesha Sankalp, Rudrabhishek, Vastu Shanti)
10. **Profile Picture File** (`profile_picture`) — *Image Upload* (Directly processed to Cloudflare R2 bucket)
11. **Vedic Bio & Training Background** (`bio`) — *Textarea* (Description of Vedic education, traditional Gurukul training, style of chanting)

### D. Registration Status (For Admin Dashboard)
- **Status** (`status`): Set to `'pending'` by default, can be toggled by the admin to `'approved'` or `'rejected'` to control visibility inside the mobile app.
