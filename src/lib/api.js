import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env");
}

export const supabase = createClient(url, anon);

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
export async function signOut() { await supabase.auth.signOut(); }
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function getMyStore() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase.from("stores").select("*").eq("owner_id", session.user.id).maybeSingle();
  if (error) throw error;
  return data;
}
export async function getStore(storeId) {
  const { data, error } = await supabase.from("stores").select("*").eq("id", storeId).single();
  if (error) throw error;
  return data;
}
export async function getStorePublic(storeId) {
  let q = supabase.from("stores").select("*");
  q = storeId ? q.eq("id", storeId) : q.order("created_at", { ascending: true }).limit(1);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}
export async function uploadStoreLogo(storeId, file) {
  const path = `${storeId}/logo-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("store-logos").upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("store-logos").getPublicUrl(path);
  return data.publicUrl;
}
export async function upsertStore(store) {
  const session = await getSession();
  if (!session) throw new Error("No hay sesión activa");
  const payload = { ...store, owner_id: session.user.id };
  const { data, error } = await supabase.from("stores").upsert(payload, { onConflict: "owner_id" }).select().single();
  if (error) throw error;
  return data;
}

export async function listProducts(storeId) {
  const { data, error } = await supabase.from("products").select("*, variants(*)").eq("store_id", storeId).order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function createProduct(storeId, product, variants) {
  const { data: prod, error } = await supabase.from("products").insert({
    store_id: storeId, name: product.name, category: product.category, price: product.price,
    description: product.description || "", images: product.images || [], active: true, offer_pct: 0,
  }).select().single();
  if (error) throw error;
  const rows = variants.map((v) => ({ product_id: prod.id, color: v.color, size: v.size, stock: v.stock }));
  const { error: ve } = await supabase.from("variants").insert(rows);
  if (ve) throw ve;
  return prod;
}
export async function updateProduct(id, patch) {
  const { data, error } = await supabase.from("products").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function setOffer(id, pct) {
  const { data, error } = await supabase.from("products").update({ offer_pct: pct }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function saveOrder(orderedProducts) {
  const updates = orderedProducts.map((p, i) => supabase.from("products").update({ sort_order: i }).eq("id", p.id));
  await Promise.all(updates);
}
export async function updateVariantStock(variantId, stock) {
  const { error } = await supabase.from("variants").update({ stock }).eq("id", variantId);
  if (error) throw error;
}

export async function uploadProductImages(storeId, files) {
  const urls = [];
  for (const file of files) {
    const path = `${storeId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function createOrder(storeId, { buyer, cart, total, comprobanteFile, paymentMethod = "transferencia" }) {
  let comprobante_path = null;
  if (comprobanteFile) {
    const path = `${storeId}/${crypto.randomUUID()}-${comprobanteFile.name}`;
    const { error } = await supabase.storage.from("comprobantes").upload(path, comprobanteFile);
    if (error) throw error;
    comprobante_path = path;
  }
  const code = "PED-" + Math.floor(1000 + Math.random() * 9000);
  const status = paymentMethod === "efectivo" ? "Pago en efectivo" : "Pago en revisión";
  const { data: order, error } = await supabase.from("orders").insert({
    store_id: storeId, code, buyer_name: buyer.name, buyer_phone: buyer.phone, total,
    comprobante_path, payment_method: paymentMethod, status,
  }).select().single();
  if (error) throw error;
  const rows = cart.map((i) => ({
    order_id: order.id, product_id: i.id || null, name: i.name, color: i.color, size: i.size, qty: i.qty, unit_price: i.price,
  }));
  const { error: ie } = await supabase.from("order_items").insert(rows);
  if (ie) throw ie;
  return order;
}

export async function listOrders(storeId) {
  const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("store_id", storeId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select().single();
  if (error) throw error;
  return data;
}
export async function getComprobanteUrl(path, seconds = 3600) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("comprobantes").createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
