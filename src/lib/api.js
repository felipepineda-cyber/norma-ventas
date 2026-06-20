// src/lib/api.js
// Capa de datos: cada función reemplaza una acción que en la beta vivía en
// useState. La idea es que la UI llame a estas funciones en vez de setState.
//
// Convenciones:
// - Los productos vienen con sus variantes anidadas en `variants`.
// - El precio (price) y el precio antes (was) los calcula la base de datos
//   a partir de normal_price y offer_pct, así que NO se escriben a mano.

import { supabase } from "./supabase";

/* =========================== AUTENTICACIÓN =========================== */

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data; // data.session es null si se exige confirmar el correo
}

// Crea una tienda nueva para el usuario logueado (registro de vendedor nuevo)
export async function createMyStore(name) {
  const session = await getSession();
  if (!session) throw new Error("No hay sesión activa");
  const existing = await supabase.from("stores").select("*").eq("owner_id", session.user.id).maybeSingle();
  if (existing.data) return existing.data;
  const { data, error } = await supabase.from("stores").insert({
    owner_id: session.user.id,
    name: name && name.trim() ? name.trim() : "Mi Tienda",
    emoji: "🛍️",
  }).select().single();
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Útil para reaccionar a login/logout en React (úsalo en un useEffect)
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/* =============================== TIENDA ============================== */

// Devuelve la tienda que el vendedor logueado puede administrar:
// su propia tienda (si es dueño) o la tienda donde es miembro.
export async function getMyStore() {
  const session = await getSession();
  if (!session) return null;
  const uid = session.user.id;
  // ¿es dueño de una tienda?
  const own = await supabase.from("stores").select("*").eq("owner_id", uid).maybeSingle();
  if (own.error) throw own.error;
  if (own.data) return own.data;
  // ¿es miembro de una tienda?
  const mem = await supabase.from("store_members").select("store_id").eq("user_id", uid).maybeSingle();
  if (mem.error || !mem.data) return null;
  const st = await supabase.from("stores").select("*").eq("id", mem.data.store_id).maybeSingle();
  if (st.error) throw st.error;
  return st.data || null;
}

// Para la vista del comprador: trae una tienda por id (pública)
export async function getStore(storeId) {
  const { data, error } = await supabase.from("stores").select("*").eq("id", storeId).single();
  if (error) throw error;
  return data;
}

// Credenciales del aviso por WhatsApp (chatbot) de la tienda (privadas)
export async function getStoreNotify(storeId) {
  const { data, error } = await supabase.from("store_notify").select("phone, apikey").eq("store_id", storeId).maybeSingle();
  if (error) throw error;
  return data || { phone: "", apikey: "" };
}
export async function saveStoreNotify(storeId, { phone, apikey }) {
  const { error } = await supabase.from("store_notify").upsert({ store_id: storeId, phone, apikey }, { onConflict: "store_id" });
  if (error) throw error;
}

// Para el enlace público de comprador (sin login): una tienda por id, o la primera si no se indica id
export async function getStorePublic(storeId) {
  let q = supabase.from("stores").select("*");
  q = storeId ? q.eq("id", storeId) : q.order("created_at", { ascending: true }).limit(1);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

// Sube el logo de la tienda al bucket público y devuelve su URL
export async function uploadStoreLogo(storeId, file) {
  const path = `${storeId}/logo-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("store-logos").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("store-logos").getPublicUrl(path);
  return data.publicUrl;
}

// Crea o actualiza la tienda. Si llega con id (caso normal de edición),
// actualiza ESA tienda sin tocar el dueño (funciona para dueño y miembros).
export async function upsertStore(store) {
  const session = await getSession();
  if (!session) throw new Error("No hay sesión activa");
  if (store.id) {
    const { id, owner_id, ...patch } = store; // nunca cambiamos el dueño
    const { data, error } = await supabase.from("stores").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from("stores")
    .upsert({ ...store, owner_id: session.user.id }, { onConflict: "owner_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ============================== PRODUCTOS ============================ */

// Lista productos de una tienda con sus variantes, en orden del catálogo
export async function listProducts(storeId) {
  const { data, error } = await supabase
    .from("products")
    .select("*, variants(*)")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Crea un producto + sus variantes (la matriz color×talla de la beta)
export async function createProduct(storeId, product, variants) {
  const { data: prod, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      name: product.name,
      category: product.category,
      description: product.desc || product.description || "",
      emoji: product.emoji,
      images: product.images || [],
      benefits: product.benefits || [],
      normal_price: product.normalPrice ?? product.price,
      offer_pct: product.offerPct || 0,
      featured: !!product.featured,
      top: !!product.top,
      active: product.active !== false,
      is_new: true,
      sort_order: product.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) throw error;

  if (variants && variants.length) {
    const rows = variants.map((v) => ({
      product_id: prod.id,
      color: v.color,
      hex: v.hex,
      size: v.size,
      stock: v.stock || 0,
    }));
    const { error: ve } = await supabase.from("variants").insert(rows);
    if (ve) throw ve;
  }
  return prod;
}

// Cambia campos sueltos del producto (active, featured, top, etc.)
export async function updateProduct(productId, patch) {
  const { data, error } = await supabase.from("products").update(patch).eq("id", productId).select().single();
  if (error) throw error;
  return data;
}

// Aplica oferta: solo cambia offer_pct; la base recalcula price y was
export async function setOffer(productId, offerPct) {
  return updateProduct(productId, { offer_pct: offerPct });
}

// Reordenar el catálogo: recibe el arreglo de productos ya en el orden
// deseado y guarda su posición (sort_order).
export async function saveOrder(products) {
  const updates = products.map((p, i) =>
    supabase.from("products").update({ sort_order: i }).eq("id", p.id)
  );
  await Promise.all(updates);
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}

/* ============================== VARIANTES =========================== */

export async function updateVariantStock(variantId, stock) {
  const { data, error } = await supabase
    .from("variants")
    .update({ stock: Math.max(0, stock) })
    .eq("id", variantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Registra un cambio de stock en el historial
export async function logStockChange(storeId, { productId, productName, color, size, newStock }) {
  const { error } = await supabase.from("stock_log").insert({
    store_id: storeId, product_id: productId, product_name: productName,
    color, size, new_stock: newStock,
  });
  if (error) throw error;
}

// Lista el historial de cambios de stock (más recientes primero)
export async function listStockLog(storeId) {
  const { data, error } = await supabase
    .from("stock_log").select("*").eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/* =============================== FOTOS ============================== */

// Sube fotos de producto al bucket público y devuelve sus URLs
export async function uploadProductImages(storeId, files) {
  const urls = [];
  for (const file of files) {
    const path = `${storeId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/* =============================== PEDIDOS ============================ */

// Crea un pedido: sube el comprobante al bucket privado, inserta el pedido
// y sus ítems. `cart` son los ítems del carrito de la beta.
export async function createOrder(storeId, { buyer, cart, total, comprobanteFile, paymentMethod = "transferencia" }) {
  let comprobante_path = null;
  if (comprobanteFile) {
    const path = `${storeId}/${crypto.randomUUID()}-${comprobanteFile.name}`;
    const { error } = await supabase.storage.from("comprobantes").upload(path, comprobanteFile);
    if (error) throw error;
    comprobante_path = path;
  }

  const code = "PED-" + Math.floor(1000 + Math.random() * 9000);
  const status = paymentMethod === "efectivo" ? "Pago en efectivo" : paymentMethod === "mercadopago" ? "Pago pendiente" : "Pago en revisión";
  const items_summary = cart.map((i) => `${i.name}${i.size && i.size !== "Única" ? " " + i.size : ""} (${i.color}) x${i.qty}`).join(", ");
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      store_id: storeId,
      code,
      buyer_name: buyer.name,
      buyer_phone: buyer.phone,
      total,
      comprobante_path,
      payment_method: paymentMethod,
      items_summary,
      status,
    })
    .select()
    .single();
  if (error) throw error;

  const rows = cart.map((i) => ({
    order_id: order.id,
    product_id: i.id || null,
    name: i.name,
    color: i.color,
    size: i.size,
    qty: i.qty,
    unit_price: i.price,
  }));
  const { error: ie } = await supabase.from("order_items").insert(rows);
  if (ie) throw ie;

  return order;
}

// Lista los pedidos de la tienda con sus ítems (solo el dueño, por RLS)
export async function listOrders(storeId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select().single();
  if (error) throw error;
  return data;
}

// Inicia un pago con Mercado Pago (Checkout Pro). Llama a la Edge Function
// "crear-pago", que crea la preferencia con el Access Token (secreto) y
// devuelve la URL de pago a la que se redirige al cliente.
export async function crearPagoMP({ items, orderId, orderCode, payerName }) {
  const { data, error } = await supabase.functions.invoke("crear-pago", {
    body: { items, orderId, orderCode, payer: { name: payerName }, backUrl: window.location.origin },
  });
  if (error) throw new Error(error.message || "No se pudo iniciar el pago.");
  if (data?.error) throw new Error(data.error);
  return data; // { id, init_point, sandbox_init_point }
}

// Editar campos del pedido (cliente, teléfono, total, método, estado)
export async function updateOrder(orderId, patch) {
  const { data, error } = await supabase.from("orders").update(patch).eq("id", orderId).select().single();
  if (error) throw error;
  return data;
}

// Eliminar un pedido (sus productos se borran en cascada)
export async function deleteOrder(orderId) {
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw error;
}

// URL temporal y firmada para ver un comprobante (bucket privado)
export async function getComprobanteUrl(path, seconds = 3600) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("comprobantes").createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
