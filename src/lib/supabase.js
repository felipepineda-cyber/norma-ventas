// src/lib/supabase.js
// Cliente único de Supabase para toda la app.
// Requiere las variables de entorno definidas en .env (ver .env.example).

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Mensaje claro en consola si faltan las variables
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en tu archivo .env");
}

export const supabase = createClient(url, anonKey);