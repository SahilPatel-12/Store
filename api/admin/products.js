import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction } from '../_lib/admin/auth.js';

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Enforce CSRF protection
  if (!verifyCsrf(req)) {
    return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
  }

  const { action, product, productId } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter.' });
  }

  try {
    if (action === 'save') {
      if (!product) {
        return res.status(400).json({ error: 'Missing product payload.' });
      }

      const { data, error } = await supabaseAdmin
        .from('website_pooja_products')
        .upsert(product)
        .select('*')
        .single();

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PRODUCT_SAVE', { productId: data.id, name: data.name_en });
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete') {
      if (!productId) {
        return res.status(400).json({ error: 'Missing productId parameter.' });
      }

      const { error } = await supabaseAdmin
        .from('website_pooja_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PRODUCT_DELETE', { productId });
      return res.status(200).json({ success: true });
    }

    if (action === 'update-category') {
      const { oldCategory, newCategory } = req.body;
      if (!oldCategory || !newCategory) {
        return res.status(400).json({ error: 'Missing oldCategory or newCategory parameters.' });
      }

      const { error } = await supabaseAdmin
        .from('website_pooja_products')
        .update({ category: newCategory })
        .eq('category', oldCategory);

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PRODUCT_BULK_CATEGORY_RENAME', { oldCategory, newCategory });
      return res.status(200).json({ success: true });
    }

    if (action === 'bulk-update') {
      const { ids, payload } = req.body;
      if (!ids || !Array.isArray(ids) || !payload) {
        return res.status(400).json({ error: 'Missing ids array or payload.' });
      }

      const { error } = await supabaseAdmin
        .from('website_pooja_products')
        .update(payload)
        .in('id', ids);

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PRODUCT_BULK_UPDATE', { count: ids.length });
      return res.status(200).json({ success: true });
    }

    if (action === 'bulk-update-all') {
      const { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ error: 'Missing payload.' });
      }

      const { error } = await supabaseAdmin
        .from('website_pooja_products')
        .update(payload)
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      await logAdminAction(adminSession.admin_id, req, 'PRODUCT_BULK_UPDATE_ALL', { payload });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Invalid action "${action}"` });
  } catch (err) {
    console.error('[Admin Products API Error]:', err);
    return res.status(500).json({ error: 'Products operation failed: ' + err.message });
  }
}
