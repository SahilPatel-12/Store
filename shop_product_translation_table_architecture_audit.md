# Shop Product Translation Table Architecture Audit

## 1. Existing Puja Localization Pattern

Puja Base Table: `public.website_pooja_products`

Puja Translation Table: `None (historically stored inline inside translations JSONB column)`

Translation Primary Key: `N/A`

Parent Foreign Key: `N/A`

Locale Column: `N/A`

Status Column: `N/A`

Unique Constraint: `N/A`

Foreign Key Delete Behavior: `N/A`

RLS: `N/A`

Localized View: `None`

Language Resolution: `Client-side locale parsing (App reads translations[locale])`

English Fallback: `Client-side fallback (if translations[locale]?.name is missing, uses base table name)`

## 2. Current Product Architecture

Product Base Table: `public.website_pooja_products`

Product Primary Key: `id (UUID)`

Translations JSONB Column: `translations (JSONB DEFAULT '{}'::JSONB)`

Current Product Query Strategy: `Reads public.website_pooja_products directly, including translations column`

Current Website Strategy: `Client-side locale mapping from translations.hi`

Current Mobile Strategy: `Client-side locale mapping from translations.hi`

## 3. Product Field Classification

| Field | Base Technical | Translatable | Translation Table | Preserve English Base |
| ----- | -------------- | ------------ | ----------------- | --------------------- |
| id | YES | NO | NO | YES |
| slug | YES | NO | NO | YES |
| price | YES | NO | NO | YES |
| original_price | YES | NO | NO | YES |
| rating | YES | NO | NO | YES |
| reviews_count | YES | NO | NO | YES |
| canonical_url | YES | NO | NO | YES |
| schema_markup | YES | NO | NO | YES |
| is_featured | YES | NO | NO | YES |
| is_trending | YES | NO | NO | YES |
| in_stock | YES | NO | NO | YES |
| recommendation_logic | YES | NO | NO | YES |
| related_products | YES | NO | NO | YES |
| video_url | YES | NO | NO | YES |
| created_at | YES | NO | NO | YES |
| updated_at | YES | NO | NO | YES |
| published_at | YES | NO | NO | YES |
| is_published | YES | NO | NO | YES |
| image | YES | NO | NO | YES |
| banner_image | YES | NO | NO | YES |
| ritual_images | YES | NO | NO | YES |
| priest_image | YES | NO | NO | YES |
| icon_image | YES | NO | NO | YES |
| promo_creatives | YES | NO | NO | YES |
| custom_icons | YES | NO | NO | YES |
| name | NO | YES | YES | YES |
| sanskrit_name | NO | YES | YES | YES |
| short_name | NO | YES | YES | YES |
| category | NO | YES | YES | YES |
| tags | NO | YES | YES | YES |
| subtitle | NO | YES | YES | YES |
| short_description | NO | YES | YES | YES |
| description | NO | YES | YES | YES |
| spiritual_significance | NO | YES | YES | YES |
| benefits | NO | YES | YES | YES |
| rituals_included | NO | YES | YES | YES |
| samagri_list | NO | YES | YES | YES |
| priest_details | NO | YES | YES | YES |
| duration | NO | YES | YES | YES |
| ideal_occasions | NO | YES | YES | YES |
| temple_association | NO | YES | YES | YES |
| who_should_perform | NO | YES | YES | YES |
| offers | NO | YES | YES | YES |
| badges | NO | YES | YES | YES |
| testimonials | NO | YES | YES | YES |
| faqs | NO | YES | YES | YES |
| booking_instructions | NO | YES | YES | YES |
| cta_labels | NO | YES | YES | YES |
| seo_title | NO | YES | YES | YES |
| seo_description | NO | YES | YES | YES |
| og_data | NO | YES | YES | YES |
| image_alt | NO | YES | YES | YES |
| image_caption | NO | YES | YES | YES |
| gallery_images | NO | YES | YES | YES |
| certificates | NO | YES | YES | YES |
| material | NO | YES | YES | YES |
| weight | NO | YES | YES | YES |
| dimensions | NO | YES | YES | YES |
| origin | NO | YES | YES | YES |

## 4. Proposed Product Translation Table

Table Name: `public.website_pooja_product_translations`

Primary Key: `id UUID PRIMARY KEY (auto-generated via gen_random_uuid())`

Parent Foreign Key: `product_id UUID REFERENCES public.website_pooja_products(id) ON DELETE CASCADE`

Locale: `locale TEXT NOT NULL`

Status: `status TEXT NOT NULL DEFAULT 'published'`

Unique Constraint: `CONSTRAINT website_pooja_product_translations_product_locale_unique UNIQUE(product_id, locale)`

Created At: `created_at TIMESTAMP WITH TIME ZONE DEFAULT now()`

Updated At: `updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()`

Complete Column List: `id, product_id, locale, status, name, sanskrit_name, short_name, category, tags, subtitle, short_description, description, spiritual_significance, benefits, rituals_included, samagri_list, priest_details, duration, ideal_occasions, temple_association, who_should_perform, offers, badges, testimonials, faqs, booking_instructions, cta_labels, seo_title, seo_description, og_data, image_alt, image_caption, gallery_images, certificates, material, weight, dimensions, origin, created_at, updated_at`

Complete SQL Type Matrix:
* `id`: UUID
* `product_id`: UUID
* `locale`: TEXT
* `status`: TEXT
* `name`, `sanskrit_name`, `short_name`, `category`, `subtitle`, `short_description`, `description`, `spiritual_significance`, `duration`, `temple_association`, `who_should_perform`, `booking_instructions`, `seo_title`, `seo_description`, `image_alt`, `image_caption`, `material`, `weight`, `dimensions`, `origin`: TEXT
* `tags`, `benefits`, `ideal_occasions`, `offers`, `badges`: TEXT[]
* `rituals_included`, `samagri_list`, `priest_details`, `testimonials`, `faqs`, `cta_labels`, `og_data`, `gallery_images`, `certificates`: JSONB

## 5. RLS Architecture

RLS Enabled: `YES`

Anon SELECT: `Allow select where status = 'published'`

Authenticated SELECT: `Allow select where status = 'published'`

Anon INSERT: `NO (Blocked)`

Anon UPDATE: `NO (Blocked)`

Anon DELETE: `NO (Blocked)`

Authenticated Normal User Writes: `NO (Blocked)`

Admin Writes: `YES (Bypassed via service_role / allowed via superuser)`

## 6. Localized Product Resolution

Localized View Required: `YES`

View Name: `public.localized_website_pooja_products`

Language Header: `N/A (Resolved dynamically by filtering the locale column in SQL select)`

Hindi Resolution: `Uses COALESCE(t.field, p.field) to resolve Hindi field if translation row exists and status is published`

English Fallback: `Uses COALESCE(t.field, p.field) which falls back to the English base field from public.website_pooja_products if translation is missing`

Technical Field Source: `Always mapped directly from public.website_pooja_products (e.g. price, stock, slug, image urls)`

Translated Field Source: `Mapped from public.website_pooja_product_translations (or falling back to base table)`

## 7. Gallery and Certificate Architecture

Gallery Storage: `JSONB (containing translated alt text, index alignment, video links preserved)`

Gallery Technical URL Preservation: `YES (URLs mapped exactly from approved JSON, preserving video/image CDN sources)`

Gallery Alt Localization: `YES (gallery alt strings translated into Devanagari in translation table row)`

Video Preservation: `YES (Video URL and metadata preserved on Vidya Rudraksh at index 2)`

Certificate Storage: `JSONB (names and issuers translated into Devanagari, retaining default URL '📜')`

Certificate Localization: `YES (certificate names and issuers translated in translation table record)`

## 8. Existing JSONB Translation Column

Column Retained: `YES (Leave untouched to avoid breaking current application code during migration)`

Column Modified: `NO`

Existing Data Modified: `NO`

Deprecation Recommendation: `Deprecate and remove after application queries have been fully updated to select from the localized_website_pooja_products view and verified in production.`

## 9. Hindi Source Mapping

Hindi Source ID: `Mapped to parent product_id in translation table`

Translation Parent Key: `product_id`

Translation Row ID: `Auto-generated UUID`

Locale Injection: `hi`

Status Injection: `published`

## 10. Application Query Impact

Website Files: `src/seo/api/sitemap.ts, src/seo/api/seo-render.ts, src/App.tsx, src/components/ShopPage.tsx, src/components/ProductDetailPage.tsx`

Mobile Files: `None in this repository (if active in mobile repo, queries website_pooja_products)`

Admin Files: `src/components/AdminPanelPage.tsx`

Queries Requiring Future Migration: `All Supabase .from('website_pooja_products') selectors that require localized Hindi data`

Implementation Required Now: `None (Database-only migration phase; application code is not modified)`

## 11. Database Safety

Live Supabase Writes: `NO`

SQL Executed: `NO`

Rows Inserted: `0`

Rows Updated: `0`

Rows Deleted: `0`

Base Product Modified: `NO`

English Content Modified: `NO`

## 12. Final Architecture Decision

SEPARATE PRODUCT TRANSLATION TABLE ARCHITECTURE VERIFIED — SAFE TO GENERATE SCHEMA AND SIX HINDI DATA MIGRATIONS
