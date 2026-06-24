// src/App.jsx — App completa conectada a Supabase
// Login real + tienda + catálogo + comprador (checkout con comprobante) +
// panel vendedor completo. Todo lee/escribe en Supabase vía src/lib/api.js.

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  signIn, signUp, createMyStore, signOut, getSession, onAuthChange,
  getMyStore, getStorePublic, getStoreNotify, saveStoreNotify, getStoreMP, saveStoreMP, verifyPassword, joinWaitlist, listProducts, createProduct, updateProduct, deleteProduct, addVariants, setOffer,
  saveOrder, updateVariantStock, logStockChange, listStockLog, uploadProductImages,
  createOrder, listOrders, updateOrderStatus, updateOrder, deleteOrder, crearPagoMP, getComprobanteUrl, upsertStore, uploadStoreLogo,
} from "./lib/api";

/* ------------------------------ Estilos ----------------------------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
.av-root{--ink:#14141B;--ink2:#43434F;--muted:#8E8E9C;--line:#ECECF2;--bg:#EFEFF3;--surface:#FFFFFF;--soft:#F6F6FA;--accent:#3B2BFF;--accent-2:#7A4DFF;--accent-soft:#ECEAFF;--hot:#F0392B;--hot-soft:#FFE9E7;--gold:#FFB400;--wa:#1FB855;--ok:#15A34A;font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;-webkit-font-smoothing:antialiased;}
.av-root *{box-sizing:border-box;}
.av-stage{display:flex;flex-direction:column;align-items:center;gap:14px;padding:18px 12px 40px;}
.av-switch{display:inline-flex;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:4px;gap:4px;box-shadow:0 2px 8px rgba(20,20,40,.06);}
.av-switch button{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;border:0;background:transparent;color:var(--muted);padding:9px 20px;border-radius:999px;cursor:pointer;transition:.18s;}
.av-switch button.on{background:var(--ink);color:#fff;}
.av-hint{font-size:12px;color:var(--muted);max-width:430px;text-align:center;line-height:1.55;}
.av-phone{width:100%;max-width:418px;background:var(--shop-bg, var(--surface));border:8px solid #15151C;border-radius:42px;overflow:hidden;box-shadow:0 30px 70px -30px rgba(20,20,50,.5);display:flex;flex-direction:column;height:780px;position:relative;}
.av-notch{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:118px;height:24px;background:#15151C;border-radius:0 0 16px 16px;z-index:60;}
@media (max-width:480px){
  .av-stage{padding:0;gap:0;}
  .av-phone{max-width:none;width:100%;height:100vh;height:100dvh;border:0;border-radius:0;box-shadow:none;}
  .av-notch{display:none;}
  .av-top{padding-top:calc(env(safe-area-inset-top) + 16px);}
  .av-nav{padding-bottom:calc(env(safe-area-inset-bottom) + 10px);}
}
/* ---- Versión de escritorio (sitio web ancho, estilo Apple) ---- */
@media (min-width:1024px){
  .av-stage{padding:0;gap:0;}
  .av-phone{max-width:none;width:100%;height:100vh;height:100dvh;border:0;border-radius:0;box-shadow:none;margin:0;}
  .av-notch{display:none;}
  .av-nav{display:none;}
  .av-wafabwrap{bottom:26px;right:26px;}
  /* Encabezado tipo sitio web: logo + navegación + acciones, centrado */
  .av-top{position:sticky;top:0;padding:0 32px;height:64px;display:flex;align-items:center;gap:20px;justify-content:flex-start;}
  .av-top > .av-store{margin-right:8px;}
  .av-topnav{display:flex;gap:4px;margin-left:auto;}
  .av-storename{font-size:17px;}
  /* Contenido del comprador: ancho y aireado */
  .av-pad.av-buyerpad{max-width:1120px;margin-left:auto;margin-right:auto;width:100%;padding-left:32px;padding-right:32px;}
  .av-promo{margin:28px 0 14px;border-radius:22px;}
  .av-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;padding:8px 0 48px;}
  .av-sheadrow,.av-shead{padding-left:0;padding-right:0;}
  /* Panel de vendedor: contenido en columna legible y centrada */
  .av-pad{max-width:780px;margin-left:auto;margin-right:auto;}
  .av-tabbar{justify-content:center;}
  .av-h1{font-size:30px;letter-spacing:-0.5px;}
  .av-card:hover{transform:translateY(-3px);}
}
/* ---- Estilo vidrio (iOS) ---- */
.av-glass{background:var(--shop-bg, #EFEFF3);--ink2:#15151B;--muted:#2A2A33;}
.av-glass .av-screen{background:transparent;}
.av-glass .av-top{background:rgba(255,255,255,.55);backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border-bottom:1px solid rgba(255,255,255,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);}
.av-glass .av-nav{background:rgba(255,255,255,.5);backdrop-filter:blur(26px) saturate(180%);-webkit-backdrop-filter:blur(26px) saturate(180%);border-top:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
.av-glass .av-card{background:rgba(255,255,255,.6);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.6), 0 10px 30px -18px rgba(20,20,50,.5);}
.av-glass .av-bottombar{background:rgba(255,255,255,.58);backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border-top:1px solid rgba(255,255,255,.5);}
.av-glass .av-sheet{background:rgba(255,255,255,.72);backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);box-shadow:inset 0 1px 0 rgba(255,255,255,.7), 0 -10px 40px -10px rgba(20,20,50,.3);}
.av-glass .av-search{background:rgba(255,255,255,.5);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border:1px solid rgba(255,255,255,.55);}
.av-glass .av-chip{background:rgba(255,255,255,.5);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);border:1px solid rgba(255,255,255,.5);}
.av-glass .av-iconbtn{background:rgba(255,255,255,.55);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);border:1px solid rgba(255,255,255,.5);}
/* superficies del panel de vendedor bajo vidrio */
.av-glass .av-input,.av-glass .av-select,.av-glass .av-srow2,.av-glass .av-orderc,.av-glass .av-acc,.av-glass .av-themebox,.av-glass .av-merch,.av-glass .av-preview,.av-glass .av-prevscroll,.av-glass .av-feat{background:rgba(255,255,255,.55);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);border:1px solid rgba(255,255,255,.5);}
/* ---- Estilo: Vidrio oscuro ---- */
.av-glassdark{--ink:#F4F4F7;--ink2:#D8D8DF;--muted:#A2A2AD;--line:rgba(255,255,255,.14);--soft:rgba(255,255,255,.07);--surface:#23232B;--accent-soft:rgba(123,77,255,.26);background:var(--shop-bg, #15151B);}
.av-glassdark .av-top,.av-glassdark .av-nav,.av-glassdark .av-card,.av-glassdark .av-bottombar,.av-glassdark .av-sheet,.av-glassdark .av-search,.av-glassdark .av-chip,.av-glassdark .av-iconbtn,.av-glassdark .av-input,.av-glassdark .av-select,.av-glassdark .av-srow2,.av-glassdark .av-orderc,.av-glassdark .av-acc,.av-glassdark .av-themebox,.av-glassdark .av-merch,.av-glassdark .av-preview,.av-glassdark .av-prevscroll,.av-glassdark .av-feat{background:rgba(40,40,48,.55);border-color:rgba(255,255,255,.12);color:var(--ink);}
.av-glassdark .av-name,.av-glassdark .av-pagetitle,.av-glassdark .av-accmon,.av-glassdark h3,.av-glassdark .av-input{color:var(--ink);}
.av-glassdark .av-input::placeholder{color:var(--muted);}
/* ---- Estilo: Minimal ---- */
.av-minimal{background:var(--shop-bg, #FAFAFB);--ink2:#3A3A44;}
.av-minimal .av-card{box-shadow:none;border:1px solid #ECECEF;}
.av-minimal .av-top{background:rgba(255,255,255,.92);border-bottom:1px solid #F0F0F2;}
.av-minimal .av-nav{background:rgba(255,255,255,.96);border-top:1px solid #F0F0F2;}
.av-minimal .av-srow2,.av-minimal .av-orderc,.av-minimal .av-acc,.av-minimal .av-themebox,.av-minimal .av-merch{box-shadow:none;border:1px solid #F0F0F2;}
/* ---- Panel: pestañas, hamburguesa y menú lateral toman el estilo ---- */
.av-glass .av-tabbar{background:rgba(255,255,255,.5);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border-bottom:1px solid rgba(255,255,255,.55);}
.av-glass .av-burger{background:rgba(255,255,255,.55);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);border:1px solid rgba(255,255,255,.5);}
.av-glass .av-drawer{background:rgba(255,255,255,.72);backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);border-right:1px solid rgba(255,255,255,.6);}
.av-glassdark .av-tabbar,.av-glassdark .av-burger{background:rgba(40,40,48,.62);border-color:rgba(255,255,255,.12);color:var(--ink);}
.av-glassdark .av-drawer{background:rgba(26,26,32,.92);backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);border-right:1px solid rgba(255,255,255,.1);}
.av-glassdark .av-draweritem,.av-glassdark .av-storename,.av-glassdark .av-tab,.av-glassdark .av-burger{color:var(--ink);}
.av-glassdark .av-draweritem:hover{background:rgba(255,255,255,.08);}
.av-minimal .av-tabbar{background:rgba(255,255,255,.96);border-bottom:1px solid #F0F0F2;}
.av-minimal .av-burger{background:#fff;border:1px solid #ECECEF;}
.av-minimal .av-drawer{border-right:1px solid #F0F0F2;}
/* ---- Cobertura total: controles de formularios y botones en todas las páginas ---- */
.av-glass .av-emojibtn,.av-glass .av-stepchip,.av-glass .av-minitag,.av-glass .av-stbtn,.av-glass .av-colorchip,.av-glass .av-paybtn,.av-glass .av-size,.av-glass .av-modeswitch,.av-glass .av-copy,.av-glass .av-prevlabel,.av-glass .av-stylecard,.av-glass .av-switch,.av-glass .av-stockin,.av-glass .av-colorpick{background:rgba(255,255,255,.5);backdrop-filter:blur(12px) saturate(160%);-webkit-backdrop-filter:blur(12px) saturate(160%);border-color:rgba(255,255,255,.55);}
.av-glassdark .av-emojibtn,.av-glassdark .av-stepchip,.av-glassdark .av-minitag,.av-glassdark .av-stbtn,.av-glassdark .av-colorchip,.av-glassdark .av-paybtn,.av-glassdark .av-size,.av-glassdark .av-modeswitch,.av-glassdark .av-copy,.av-glassdark .av-prevlabel,.av-glassdark .av-stylecard,.av-glassdark .av-switch,.av-glassdark .av-stockin,.av-glassdark .av-colorpick{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:var(--ink);}
.av-glassdark .av-btn.dark{background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;border:1px solid rgba(255,255,255,.18);}
.av-glassdark .av-mcell{background:rgba(255,255,255,.16);color:var(--ink);border-color:rgba(255,255,255,.28);}
.av-glassdark .av-toast{background:rgba(15,15,20,.94);}
.av-minimal .av-emojibtn,.av-minimal .av-stepchip,.av-minimal .av-minitag,.av-minimal .av-stbtn,.av-minimal .av-colorchip,.av-minimal .av-paybtn,.av-minimal .av-size,.av-minimal .av-prevlabel,.av-minimal .av-stylecard{background:#fff;border:1px solid #ECECEF;}
/* selector de estilo en Marca */
.av-stylegrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.av-stylecard{text-align:left;border:1.5px solid var(--line);border-radius:12px;padding:11px 12px;background:var(--surface);cursor:pointer;display:flex;flex-direction:column;gap:2px;font-family:inherit;}
.av-stylecard.on{border-color:var(--accent);background:var(--accent-soft);}
.av-stylename{font-weight:700;font-size:13px;color:var(--ink);}
.av-styledesc{font-size:11px;color:var(--muted);}
.av-screen{flex:1;overflow-y:auto;overflow-x:hidden;position:relative;background:var(--shop-bg, var(--surface));}
.av-screen::-webkit-scrollbar{width:0;}
.av-pad{padding-bottom:96px;}
.av-top{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:40px 18px 12px;display:flex;align-items:center;gap:10px;}
.av-store{display:flex;align-items:center;gap:10px;min-width:0;flex:1;}
.av-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;font-size:19px;flex:none;box-shadow:0 4px 12px -4px rgba(59,43,255,.5);}
.av-storetext{min-width:0;}
.av-storename{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:16px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.av-sii{display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:600;color:var(--ok);margin-top:2px;}
.av-sii.no{color:var(--muted);}
.av-iconbtn{position:relative;width:40px;height:40px;border-radius:13px;border:1px solid var(--line);background:#fff;display:grid;place-items:center;cursor:pointer;color:var(--ink);flex:none;}
.av-modeswitch{display:inline-flex;align-items:center;gap:5px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;border:1px solid var(--line);background:#fff;color:var(--ink2);padding:8px 13px;border-radius:999px;cursor:pointer;flex:none;transition:.16s;white-space:nowrap;}
.av-modeswitch:hover{border-color:var(--accent);color:var(--accent);}
.av-colorpick{width:42px;height:32px;border:1px solid var(--line);border-radius:9px;padding:2px;background:#fff;cursor:pointer;flex:none;}
.av-themebox{border:1px solid var(--line);border-radius:14px;overflow:hidden;}
.av-themerow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);font-size:13px;color:var(--ink2);font-weight:600;}
.av-themerow input[type=range]{accent-color:var(--accent);}
.av-iconbtn .dot{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 4px;border-radius:999px;background:var(--hot);color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;font-family:'Space Grotesk';border:2px solid #fff;}
.av-promo{margin:14px 18px 4px;border-radius:20px;padding:20px;color:#fff;position:relative;overflow:hidden;}
.av-promo .eyebrow{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:.85;}
.av-promo .big{font-family:'Space Grotesk';font-weight:700;font-size:23px;line-height:1.1;margin-top:6px;}
.av-promo .sub{font-size:13px;opacity:.9;margin-top:8px;}
.av-promo .blob{position:absolute;right:-30px;top:-30px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.14);}
.av-promo .blob2{position:absolute;right:30px;bottom:-50px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.1);}
.av-dots{position:absolute;bottom:12px;right:16px;display:flex;gap:6px;z-index:2;}
.av-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.45);cursor:pointer;transition:.2s;}
.av-dot.on{background:#fff;width:18px;border-radius:4px;}
.av-shead{display:flex;align-items:baseline;justify-content:space-between;padding:22px 18px 12px;}
.av-shead h3{font-family:'Space Grotesk';font-weight:700;font-size:18px;}
.av-shead .all{font-size:12.5px;font-weight:600;color:var(--accent);background:none;border:0;cursor:pointer;display:flex;align-items:center;gap:2px;}
.av-frow{display:flex;gap:14px;overflow-x:auto;padding:0 18px 6px;scroll-snap-type:x mandatory;}
.av-frow::-webkit-scrollbar{display:none;}
.av-feat{flex:none;width:230px;border-radius:20px;overflow:hidden;background:#fff;border:1px solid var(--line);cursor:pointer;scroll-snap-align:start;box-shadow:0 6px 18px -12px rgba(20,20,50,.25);}
.av-featimg{aspect-ratio:1.25;display:grid;place-items:center;font-size:66px;position:relative;background-size:cover;background-position:center;}
.av-featbody{padding:13px 14px 15px;}
.av-chips{display:flex;gap:8px;overflow-x:auto;padding:10px 18px 4px;}
.av-chips::-webkit-scrollbar{display:none;}
.av-chip{flex:none;font-size:12.5px;font-weight:600;padding:8px 15px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink2);cursor:pointer;white-space:nowrap;transition:.14s;font-family:'Space Grotesk';}
.av-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.av-search{padding:14px 18px 2px;position:relative;}
.av-search svg{position:absolute;left:30px;top:50%;transform:translateY(-50%);color:var(--muted);}
.av-input{width:100%;border:1px solid var(--line);background:var(--soft);border-radius:14px;padding:13px 14px;font-size:14px;color:var(--ink);outline:none;font-family:inherit;}
.av-input.search{padding-left:42px;}
.av-input:focus{border-color:var(--accent);background:#fff;}
.av-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px 18px 14px;}
.av-card{border:var(--card-bw, 1px) solid var(--card-bc, var(--line));border-radius:var(--card-rad, 18px);overflow:hidden;background:#fff;cursor:pointer;transition:.16s;display:flex;flex-direction:column;box-shadow:var(--card-sh, 0 4px 14px -12px rgba(20,20,50,.3));}
.av-card:active{transform:scale(.985);}
.av-thumb{aspect-ratio:1;display:grid;place-items:center;font-size:48px;position:relative;background-size:cover;background-position:center;}
.av-badges{position:absolute;top:9px;left:9px;display:flex;flex-direction:column;gap:5px;align-items:flex-start;}
.av-badge{font-size:10px;font-weight:700;padding:4px 8px;border-radius:8px;font-family:'Space Grotesk';line-height:1;}
.av-badge.new{background:var(--ink);color:#fff;}
.av-badge.sale{background:var(--hot);color:#fff;}
.av-badge.stock{background:#fff;color:var(--hot);box-shadow:0 0 0 1px var(--hot) inset;}
.av-badge.top{background:var(--gold);color:#3a2a00;}
.av-heart{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.9);border:0;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(4px);color:var(--muted);}
.av-heart.on{color:var(--hot);}
.av-cardbody{padding:11px 12px 13px;display:flex;flex-direction:column;gap:3px;}
.av-minidots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:2;}
.av-minidots i{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.6);box-shadow:0 0 2px rgba(0,0,0,.35);transition:.2s;cursor:pointer;}
.av-minidots i.on{width:14px;border-radius:999px;background:#fff;}
.av-galnav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.82);backdrop-filter:blur(4px);display:grid;place-items:center;cursor:pointer;z-index:2;box-shadow:0 2px 8px -2px rgba(0,0,0,.3);color:var(--ink);}
.av-galnav:active{transform:translateY(-50%) scale(.92);}
.av-soldlayer{position:absolute;inset:0;z-index:1;background:rgba(116,118,130,.34);backdrop-filter:grayscale(.45);-webkit-backdrop-filter:grayscale(.45);box-shadow:inset 0 0 0 3px rgba(255,255,255,.72);border-radius:inherit;pointer-events:none;}
.av-soldlayer::before{content:"";position:absolute;inset:0;background:linear-gradient(to top right,transparent calc(50% - 1.2px),rgba(245,245,248,.85) 50%,transparent calc(50% + 1.2px));}
.av-soldlayer.sm{box-shadow:inset 0 0 0 2px rgba(255,255,255,.78);}
.av-soldchip{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);background:rgba(26,24,32,.7);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;padding:4px 12px;border-radius:999px;white-space:nowrap;backdrop-filter:blur(2px);}
.av-availmenu{background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 16px 40px -12px rgba(20,18,30,.45);padding:5px;min-width:174px;}
.av-availmenu button{display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--ink);padding:10px 11px;border-radius:8px;cursor:pointer;text-align:left;}
.av-availmenu button:active{background:var(--soft);}
.av-availmenu button.on{color:var(--accent);background:var(--accent-soft);}
.av-availmenu .dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto;}
.av-availmenu .dot.ok{background:var(--ok);}
.av-availmenu .dot.off{background:var(--muted);}
.av-thumbs{display:flex;gap:8px;overflow-x:auto;padding:12px 18px 2px;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.av-thumbs::-webkit-scrollbar{display:none;}
.av-thumbmini{flex:0 0 auto;width:54px;height:54px;border-radius:12px;background-size:cover;background-position:center;border:2px solid transparent;cursor:pointer;padding:0;transition:.15s;opacity:.62;}
.av-thumbmini.on{border-color:var(--accent);opacity:1;}
.av-cat{font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.av-name{font-size:13px;font-weight:600;line-height:1.25;}
.av-rate{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--ink2);font-weight:600;font-family:'Space Grotesk';}
.av-rate .c{color:var(--muted);font-weight:500;}
.av-priceline{display:flex;align-items:baseline;gap:7px;margin-top:3px;flex-wrap:wrap;}
.av-price{font-family:'Space Grotesk';font-weight:700;font-size:15px;}
.av-was{font-size:12px;color:var(--muted);text-decoration:line-through;}
.av-off{font-size:10px;font-weight:700;color:var(--hot);background:var(--hot-soft);padding:2px 6px;border-radius:6px;font-family:'Space Grotesk';}
.av-nav{position:absolute;bottom:0;left:0;right:0;z-index:40;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);border-top:1px solid var(--line);display:flex;padding:9px 8px 16px;}
.av-navb{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;cursor:pointer;color:var(--muted);position:relative;}
.av-topnav{display:none;}
.av-topnavb{border:0;background:none;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;color:var(--ink2);padding:8px 14px;border-radius:10px;transition:.15s;}
.av-topnavb:hover{background:var(--soft);}
.av-topnavb.on{background:var(--accent-soft);color:var(--accent);}
.av-navb span{font-size:10px;font-weight:600;font-family:'Space Grotesk';}
.av-navb.on{color:var(--accent);}
.av-navb .ndot{position:absolute;top:-3px;right:50%;margin-right:-18px;min-width:16px;height:16px;padding:0 3px;border-radius:999px;background:var(--hot);color:#fff;font-size:9px;font-weight:700;display:grid;place-items:center;border:2px solid #fff;}
.av-gallery{aspect-ratio:1.05;display:grid;place-items:center;font-size:104px;position:relative;background-size:cover;background-position:center;}
.av-back{position:absolute;top:46px;left:16px;z-index:6;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;border:0;cursor:pointer;backdrop-filter:blur(6px);box-shadow:0 4px 10px -4px rgba(0,0,0,.2);}
.av-dheart{position:absolute;top:46px;right:16px;z-index:6;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;border:0;cursor:pointer;backdrop-filter:blur(6px);color:var(--muted);box-shadow:0 4px 10px -4px rgba(0,0,0,.2);}
.av-dheart.on{color:var(--hot);}
.av-dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px;}
.av-dots i{width:6px;height:6px;border-radius:50%;background:rgba(20,20,30,.35);transition:.2s;cursor:pointer;}
.av-dots i.on{width:20px;border-radius:999px;background:#fff;}
.av-sec{padding:18px;}
.av-h1{font-family:'Space Grotesk';font-weight:700;font-size:22px;line-height:1.18;}
.av-detprice{display:flex;align-items:baseline;gap:10px;margin:12px 0 4px;flex-wrap:wrap;}
.av-detprice .av-price{font-size:26px;}
.av-vlabel{font-size:12px;font-weight:600;color:var(--ink2);margin:18px 0 9px;text-transform:uppercase;letter-spacing:.03em;}
.av-swatches{display:flex;gap:10px;flex-wrap:wrap;}
.av-swatch{width:36px;height:36px;border-radius:50%;cursor:pointer;border:2px solid #fff;box-shadow:0 0 0 1px var(--line);}
.av-swatch.on{box-shadow:0 0 0 2px var(--accent);}
.av-swatch.off{opacity:.32;cursor:not-allowed;position:relative;}
.av-swatch.off::after{content:"";position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,transparent 44%,var(--muted) 46%,var(--muted) 54%,transparent 56%);}
.av-sizes{display:flex;gap:9px;flex-wrap:wrap;}
.av-size{min-width:48px;padding:10px 13px;border:1px solid var(--line);border-radius:11px;background:#fff;font-family:'Space Grotesk';font-weight:600;font-size:13px;cursor:pointer;transition:.12s;}
.av-size.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent);}
.av-size.off{opacity:.4;text-decoration:line-through;cursor:not-allowed;}
.av-benefits{list-style:none;padding:0;margin:16px 0 0;display:flex;flex-direction:column;gap:10px;}
.av-benefits li{display:flex;gap:10px;font-size:13.5px;line-height:1.45;color:var(--ink2);}
.av-benefits svg{flex:none;margin-top:2px;color:var(--accent);}
.av-desc{font-size:13.5px;line-height:1.6;color:var(--ink2);margin-top:10px;}
.av-trust{display:flex;gap:10px;margin-top:18px;padding:15px;border-radius:16px;background:var(--soft);}
.av-trustcol{flex:1;text-align:center;font-size:11px;color:var(--ink2);line-height:1.4;}
.av-trustcol svg{color:var(--accent);margin-bottom:6px;}
.av-divider{height:8px;background:var(--bg);margin:22px 0;}
.av-revhead{display:flex;align-items:center;gap:16px;padding:0 18px;}
.av-bigrate{font-family:'Space Grotesk';font-weight:700;font-size:40px;line-height:1;}
.av-review{margin:0 18px 12px;border:1px solid var(--line);border-radius:14px;padding:13px 15px;}
.av-revname{font-weight:600;font-size:13px;display:flex;align-items:center;gap:6px;}
.av-revtext{font-size:13px;color:var(--ink2);line-height:1.5;margin-top:6px;}
.av-relrow{display:flex;gap:14px;overflow-x:auto;padding:4px 18px 16px;}
.av-relrow::-webkit-scrollbar{display:none;}
.av-relcard{flex:none;width:132px;cursor:pointer;}
.av-relthumb{aspect-ratio:1;border-radius:16px;display:grid;place-items:center;font-size:40px;background-size:cover;background-position:center;}
.av-bottombar{position:sticky;bottom:0;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-top:1px solid var(--line);padding:13px 18px;display:flex;gap:11px;z-index:20;}
.av-btn{flex:1;border:0;border-radius:14px;padding:15px;font-family:'Space Grotesk';font-weight:700;font-size:14.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:.12s;}
.av-btn:active{transform:scale(.98);}
.av-btn.primary{background:var(--accent);color:#fff;box-shadow:0 8px 20px -10px rgba(59,43,255,.7);}
.av-btn.primary:disabled{background:#CBCBD8;box-shadow:none;cursor:not-allowed;}
.av-btn.dark{background:var(--ink);color:#fff;}
.av-btn.wa{background:var(--wa);color:#fff;flex:none;width:56px;padding:15px 0;}
.av-wafab-ov{position:absolute;inset:0;z-index:45;}
.av-wafabwrap{position:absolute;right:14px;bottom:84px;z-index:46;display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
.av-wafab{display:flex;align-items:center;gap:9px;background:var(--wa, #25D366);color:#fff;text-decoration:none;padding:8px 15px 8px 8px;border-radius:999px;box-shadow:0 10px 26px -8px rgba(37,211,102,.75);font-size:11.5px;font-weight:600;line-height:1.12;animation:wapop .3s ease;border:0;cursor:pointer;font-family:inherit;}
.av-wafab:active{transform:scale(.95);}
.av-wafabic{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.22);flex:0 0 auto;}
.av-wafabtx{text-align:left;}
.av-wafabtx b{font-weight:800;font-size:12.5px;}
.av-wamenu{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 44px -12px rgba(20,20,50,.4);padding:8px;display:flex;flex-direction:column;gap:4px;width:248px;animation:wapop .22s ease;}
.av-wamenuhead{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;padding:7px 10px 5px;}
.av-waopt{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--ink);font-size:13px;font-weight:600;padding:11px 12px;border-radius:12px;background:var(--soft);}
.av-waopt:hover{background:var(--accent-soft);color:var(--accent);}
.av-waopt svg{color:var(--wa, #25D366);flex:0 0 auto;}
@keyframes wapop{from{opacity:0;transform:translateY(8px) scale(.9);}to{opacity:1;transform:none;}}
.av-btn.ghost{background:#fff;border:1px solid var(--line);color:var(--ink);}
.av-btn.block{width:100%;}
.av-pagehead{padding:40px 18px 14px;display:flex;align-items:center;gap:10px;}
.av-pagetitle{font-family:'Space Grotesk';font-weight:700;font-size:21px;}
.av-line{display:flex;gap:13px;padding:15px 18px;border-bottom:1px solid var(--line);align-items:center;}
.av-linethumb{width:62px;height:62px;border-radius:14px;display:grid;place-items:center;font-size:28px;flex:none;background-size:cover;background-position:center;}
.av-qty{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:10px;overflow:hidden;}
.av-qty button{width:30px;height:30px;border:0;background:#fff;cursor:pointer;font-size:16px;color:var(--ink2);}
.av-qty span{min-width:28px;text-align:center;font-family:'Space Grotesk';font-weight:600;font-size:13px;}
.av-summary{padding:18px;}
.av-srow{display:flex;justify-content:space-between;font-size:14px;padding:7px 0;color:var(--ink2);}
.av-srow.total{font-family:'Space Grotesk';font-weight:700;font-size:19px;color:var(--ink);border-top:1px solid var(--line);margin-top:6px;padding-top:13px;}
.av-bank{margin:12px 18px;border:1px solid var(--line);border-radius:16px;overflow:hidden;}
.av-bankhead{background:var(--ink);color:#fff;padding:13px 15px;font-family:'Space Grotesk';font-weight:600;font-size:13px;display:flex;align-items:center;gap:8px;}
.av-bankrow{display:flex;justify-content:space-between;align-items:center;padding:12px 15px;border-bottom:1px solid var(--line);font-size:13px;gap:10px;}
.av-bankrow:last-child{border-bottom:0;}
.av-bankrow .k{color:var(--muted);}
.av-bankrow .v{font-weight:600;text-align:right;}
.av-copy{border:1px solid var(--line);background:#fff;border-radius:9px;padding:6px 11px;font-size:11px;font-weight:600;cursor:pointer;color:var(--accent);font-family:'Space Grotesk';flex:none;display:grid;place-items:center;}
.av-copy.done{color:var(--ok);border-color:var(--ok);}
.av-upload{margin:12px 18px;border:2px dashed var(--line);border-radius:16px;padding:24px;text-align:center;cursor:pointer;transition:.12s;display:block;}
.av-upload:hover{border-color:var(--accent);background:var(--soft);}
.av-upload.has{border-style:solid;border-color:var(--ok);background:#F2FBF5;}
.av-upimg{width:66px;height:66px;object-fit:cover;border-radius:12px;margin:0 auto 8px;display:block;}
.av-field{padding:0 18px 13px;}
.av-field label{display:block;font-size:12px;font-weight:600;color:var(--ink2);margin-bottom:7px;}
.av-conf{padding:46px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;}
.av-confcircle{width:82px;height:82px;border-radius:50%;background:var(--accent-soft);display:grid;place-items:center;color:var(--accent);margin-bottom:8px;margin-top:20px;}
.av-pill{display:inline-flex;align-items:center;gap:6px;background:#FFF6E5;color:#B45309;font-size:12px;font-weight:600;padding:8px 14px;border-radius:999px;font-family:'Space Grotesk';margin:8px 0;}
.av-empty{padding:64px 30px;text-align:center;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:10px;}
.av-login{padding:38px 26px;display:flex;flex-direction:column;gap:14px;min-height:100vh;justify-content:center;max-width:420px;margin:0 auto;}
.av-loginlogo{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;color:#fff;font-size:28px;margin:0 auto 6px;box-shadow:0 10px 24px -10px rgba(59,43,255,.6);}
.av-tabbar{display:flex;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;z-index:10;overflow-x:auto;}
.av-burger{flex:none;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);cursor:pointer;margin-right:4px;}
.av-drawer-ov{position:absolute;inset:0;background:rgba(10,10,20,.42);z-index:80;animation:av-fade .2s ease;}
.av-drawer{position:absolute;top:0;left:0;bottom:0;width:80%;max-width:320px;background:var(--surface);z-index:81;box-shadow:2px 0 40px rgba(20,20,50,.25);padding:18px 16px;display:flex;flex-direction:column;gap:3px;overflow-y:auto;animation:av-slidein .24s cubic-bezier(.2,.8,.2,1);}
@keyframes av-slidein{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes av-fade{from{opacity:0}to{opacity:1}}
.av-draweritem{display:flex;align-items:center;gap:12px;padding:13px 12px;border-radius:12px;border:0;background:none;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;color:var(--ink);text-align:left;width:100%;}
.av-draweritem:hover{background:var(--soft);}
.av-draweritem.on{background:var(--accent-soft);color:var(--accent);}
.av-drawerchev{font-size:16px;color:var(--muted);padding:2px 6px;border-radius:8px;transition:transform .2s ease;}
.av-drawerchev.open{transform:rotate(180deg);}
.av-drawersubs{display:flex;flex-direction:column;gap:1px;margin:1px 0 4px;}
.av-drawersub{display:block;text-align:left;width:100%;border:0;background:none;cursor:pointer;font-family:inherit;font-size:13px;color:var(--muted);padding:8px 12px 8px 48px;border-radius:10px;}
.av-drawersub:hover{background:var(--soft);color:var(--ink2);}
.av-drawerhead{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin:12px 8px 4px;font-weight:700;}
.av-pagetitle2{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:20px;color:var(--ink);margin-bottom:14px;}
.av-tabbar::-webkit-scrollbar{display:none;}
.av-tab{flex:1;min-width:64px;text-align:center;padding:14px 4px;font-family:'Space Grotesk';font-weight:600;font-size:12px;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap;}
.av-tab.on{color:var(--accent);border-bottom-color:var(--accent);}
.av-srow2{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid var(--line);}
.av-toggle{margin-left:auto;width:44px;height:25px;border-radius:999px;background:var(--line);position:relative;cursor:pointer;transition:.15s;border:0;flex:none;}
.av-toggle.on{background:var(--accent);}
.av-toggle .kn{position:absolute;top:3px;left:3px;width:19px;height:19px;border-radius:50%;background:#fff;transition:.15s;}
.av-toggle.on .kn{left:22px;}
.av-tag{font-size:10px;font-weight:700;padding:3px 7px;border-radius:6px;font-family:'Space Grotesk';}
.av-tag.featured{background:var(--accent-soft);color:var(--accent);}
.av-tag.off{background:#F1F1F4;color:var(--muted);}
.av-orderc{margin:13px 18px;border:1px solid var(--line);border-radius:16px;padding:15px;}
.av-acc{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:13px 16px;cursor:pointer;font-family:inherit;}
.av-accmon{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;color:var(--ink);}
.av-acccount{font-size:12px;color:var(--muted);margin-top:2px;}
.av-accarrow{font-size:26px;line-height:1;color:var(--ink2);transition:transform .22s ease;}
.av-accarrow.open{transform:rotate(180deg);}
.av-status{font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;font-family:'Space Grotesk';}
.av-select{border:1px solid var(--line);border-radius:10px;padding:9px 11px;font-size:12px;font-family:'Space Grotesk';font-weight:600;background:#fff;width:100%;margin-top:9px;color:var(--ink);}
.av-addbtn{margin:16px 18px;width:calc(100% - 36px);}
.av-emojirow{display:flex;gap:8px;flex-wrap:wrap;}
.av-emojibtn{width:42px;height:42px;border-radius:11px;border:1px solid var(--line);background:#fff;font-size:21px;cursor:pointer;}
.av-emojibtn.on{border-color:var(--accent);background:var(--accent-soft);}
.av-preview{margin:0 18px 8px;border:1px solid var(--line);border-radius:22px;overflow:hidden;background:var(--soft);}
.av-prevlabel{font-size:11px;color:var(--muted);text-align:center;padding:9px;font-weight:600;font-family:'Space Grotesk';background:#fff;border-bottom:1px solid var(--line);}
.av-prevscroll{max-height:360px;overflow-y:auto;}
.av-prevscroll::-webkit-scrollbar{width:0;}
.av-merch{display:flex;align-items:center;gap:11px;padding:13px 18px;border-bottom:1px solid var(--line);}
.av-move{display:flex;flex-direction:column;gap:3px;flex:none;}
.av-move button{width:28px;height:21px;border:1px solid var(--line);background:#fff;border-radius:7px;cursor:pointer;display:grid;place-items:center;color:var(--ink2);font-size:11px;line-height:1;}
.av-move button:disabled{opacity:.3;cursor:not-allowed;}
.av-stepchips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;}
.av-stepchip{font-size:11px;font-weight:700;font-family:'Space Grotesk';padding:5px 9px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--ink2);cursor:pointer;}
.av-stepchip.on{background:var(--hot);border-color:var(--hot);color:#fff;}
.av-minitag{font-size:10px;font-weight:700;padding:3px 7px;border-radius:6px;font-family:'Space Grotesk';cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--muted);}
.av-minitag.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);}
.av-minitag.gold.on{background:#FFF4D6;border-color:var(--gold);color:#9A6B00;}
.av-invstat{display:flex;gap:10px;padding:16px 18px 6px;}
.av-invcard{flex:1;background:var(--soft);border-radius:16px;padding:13px 10px;text-align:center;}
.av-invcard .n{font-family:'Space Grotesk';font-weight:700;font-size:21px;}
.av-invcard .l{font-size:10.5px;color:var(--muted);margin-top:3px;line-height:1.2;}
.av-prodhdr{display:flex;align-items:center;gap:11px;padding:16px 18px 8px;}
.av-invrow{display:flex;align-items:center;gap:10px;padding:10px 18px 10px 26px;border-bottom:1px solid var(--line);}
.av-stockin{width:58px;text-align:center;border:1px solid var(--line);border-radius:10px;padding:8px 4px;font-family:'Space Grotesk';font-weight:600;font-size:13px;color:var(--ink);}
.av-stbtn{width:30px;height:34px;border:1px solid var(--line);background:#fff;border-radius:9px;cursor:pointer;font-size:16px;color:var(--ink2);flex:none;}
.av-photos{display:flex;gap:10px;flex-wrap:wrap;}
.av-photowrap{position:relative;}
.av-photo{width:70px;height:70px;border-radius:14px;object-fit:cover;border:1px solid var(--line);display:block;}
.av-photodel{position:absolute;top:-7px;right:-7px;width:22px;height:22px;border-radius:50%;background:var(--hot);color:#fff;border:2px solid #fff;font-size:12px;cursor:pointer;display:grid;place-items:center;line-height:1;}
.av-photoadd{width:70px;height:70px;border-radius:14px;border:2px dashed var(--line);display:grid;place-items:center;cursor:pointer;color:var(--muted);font-size:24px;}
.av-photoadd:hover{border-color:var(--accent);color:var(--accent);}
.av-photomove{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:3px;}
.av-photomove button{width:22px;height:22px;border-radius:7px;border:0;background:rgba(20,20,28,.72);color:#fff;font-size:14px;line-height:1;cursor:pointer;display:grid;place-items:center;}
.av-photomove button:disabled{opacity:.3;cursor:default;}
.av-photomain{position:absolute;top:4px;left:4px;background:var(--accent);color:#fff;font-size:8.5px;font-weight:700;padding:2px 5px;border-radius:6px;letter-spacing:.3px;text-transform:uppercase;}
.av-photo.soldph{filter:grayscale(.5);opacity:.62;}
.av-catgroup{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:13px 14px;margin-bottom:10px;}
.av-catgrouphead{font-weight:700;font-size:14.5px;letter-spacing:-.01em;margin-bottom:9px;}
.av-catsubs{display:flex;flex-wrap:wrap;gap:7px;}
.av-catsub{display:inline-flex;align-items:center;gap:6px;background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:600;color:var(--ink2);}
.av-catsub b{background:var(--accent-soft);color:var(--accent);font-size:11px;padding:1px 7px;border-radius:999px;}
.av-catprod{display:flex;gap:11px;align-items:flex-start;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:11px 12px;margin-bottom:8px;}
.av-photoout{position:absolute;top:4px;left:4px;background:rgba(26,24,32,.78);color:#fff;font-size:8.5px;font-weight:700;padding:2px 6px;border-radius:6px;letter-spacing:.3px;text-transform:uppercase;}
.av-colorchips{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.av-colorchip{display:inline-flex;align-items:center;gap:7px;padding:5px 9px 5px 6px;border:1px solid var(--line);border-radius:999px;font-size:12px;font-weight:600;background:#fff;}
.av-colordot{width:18px;height:18px;border-radius:50%;box-shadow:0 0 0 1px var(--line);flex:none;}
.av-colordel{border:0;background:none;color:var(--muted);cursor:pointer;font-size:15px;line-height:1;padding:0;}
.av-coloradd{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;}
.av-colorpick{width:46px;height:40px;border:1px solid var(--line);border-radius:11px;padding:3px;cursor:pointer;background:#fff;}
.av-presets{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;}
.av-presetdot{width:28px;height:28px;border-radius:50%;cursor:pointer;box-shadow:0 0 0 1px var(--line);border:2px solid #fff;}
.av-sizeadd{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;}
.av-matrix{overflow-x:auto;padding:6px 18px 2px;}
.av-matrix::-webkit-scrollbar{height:0;}
.av-mtable{border-collapse:separate;border-spacing:6px;}
.av-mtable th{font-size:11px;color:var(--muted);font-family:'Space Grotesk';font-weight:600;padding:0 2px 4px;}
.av-mcolor{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;white-space:nowrap;}
.av-mcell{width:54px;text-align:center;border:1px solid var(--ink);border-radius:9px;padding:7px 2px;font-family:'Space Grotesk';font-weight:600;font-size:12px;color:#fff;background:var(--ink);}
.av-mcell::placeholder{color:rgba(255,255,255,.5);}
.av-mcell:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft);}
@keyframes avpop{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.av-anim{animation:avpop .24s ease;}
.av-toast{position:absolute;bottom:108px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;font-size:13px;font-weight:600;padding:11px 18px;border-radius:999px;z-index:55;animation:avpop .2s ease;font-family:'Space Grotesk';white-space:nowrap;box-shadow:0 8px 20px -8px rgba(0,0,0,.4);}
.av-modal{position:absolute;inset:0;z-index:80;display:flex;align-items:flex-end;justify-content:center;background:rgba(15,15,25,.45);backdrop-filter:blur(2px);animation:avfade .2s ease;}
.av-sheet{width:100%;background:#fff;border-radius:24px 24px 0 0;padding:20px;box-shadow:0 -10px 40px -10px rgba(0,0,0,.3);animation:avslide .26s cubic-bezier(.2,.8,.2,1);}
.av-sheet .ok{display:flex;align-items:center;gap:8px;color:var(--ok);font-weight:600;font-size:14px;font-family:'Space Grotesk';}
.av-paypick{display:flex;gap:10px;margin:0 18px 6px;}
.av-paybtn{flex:1;border:1px solid var(--line);background:#fff;border-radius:14px;padding:13px 10px;cursor:pointer;text-align:center;font-family:'Space Grotesk';font-weight:600;font-size:13px;color:var(--ink2);transition:.14s;display:flex;flex-direction:column;align-items:center;gap:5px;}
.av-paybtn .ic{font-size:20px;}
.av-paybtn.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent);}
.av-cashbox{margin:12px 18px;border:1px solid var(--line);border-radius:16px;background:var(--soft);padding:15px;font-size:13px;color:var(--ink2);line-height:1.5;display:flex;gap:10px;}
@keyframes avfade{from{opacity:0;}to{opacity:1;}}
@keyframes avslide{from{transform:translateY(100%);}to{transform:none;}}
`;

/* ----------------------------- Utilidades --------------------------- */
const CLP = (n) => "$" + Math.round(n || 0).toLocaleString("es-CL");
const off = (price, was) => (was ? Math.round((1 - price / was) * 100) : 0);
const grad = (a, b) => ({ background: `linear-gradient(135deg, ${a}, ${b})` });
const imgBg = (url) => ({ backgroundImage: `url(${url})` });
const GRADS = [["#EEEAFF", "#D7CEFF"], ["#E7F0FF", "#CFE0FF"], ["#EAF7EE", "#CFEFDA"], ["#FFF0E8", "#FFD9C2"], ["#F3EAFF", "#E0CFFF"], ["#EAF6FF", "#CCE8FF"]];
const gradFor = (id) => { let s = 0; for (const c of String(id)) s += c.charCodeAt(0); return GRADS[s % GRADS.length]; };
const EMOJI_MAP = { game: "🎮", shop: "🛍️", box: "📦" };
const emojiOf = (e, fb) => (e ? (EMOJI_MAP[e] || e) : fb);
const mediaStyle = (p) => (p.images && p.images.length ? imgBg(p.images[0]) : grad(p.g[0], p.g[1]));

const POOL = [
  { name: "Camila R.", r: 5, t: "Llegó rápido y tal cual la foto. La calidad sorprende para el precio." },
  { name: "Matías O.", r: 5, t: "Excelente. El vendedor confirmó la transferencia al toque por WhatsApp." },
  { name: "Fernanda L.", r: 4, t: "Muy bueno en general, solo demoró un día más de lo esperado el despacho." },
];
const STATUSES = ["Pago pendiente", "Pago en revisión", "Pago en efectivo", "Pago confirmado", "Pago rechazado", "Preparando", "Enviado"];
const STATUS_COLOR = { "Pago pendiente": { bg: "#FFF6E5", c: "#B45309" }, "Pago en revisión": { bg: "#FFF6E5", c: "#B45309" }, "Pago en efectivo": { bg: "#E9F7EF", c: "#15803D" }, "Pago confirmado": { bg: "#E9F0FF", c: "#3B2BFF" }, "Pago rechazado": { bg: "#FDECEC", c: "#C0392B" }, Preparando: { bg: "#F3EAFF", c: "#7C3AED" }, Enviado: { bg: "#EAF7EE", c: "#15A34A" } };
const OFFER_OPTS = [0, 10, 15, 20, 25, 30, 40];
const EMOJIS = ["🎧", "🖱️", "⌨️", "🎙️", "📷", "🟪", "👕", "🧢", "👟", "🎒"];
const COLOR_PRESETS = [{ name: "Negro", hex: "#1C1C22" }, { name: "Blanco", hex: "#F2F2F2" }, { name: "Rosa", hex: "#F5A9C8" }, { name: "Azul", hex: "#3B6EF5" }, { name: "Rojo", hex: "#E5484D" }, { name: "Verde", hex: "#2FA84F" }, { name: "Gris", hex: "#9AA0A6" }, { name: "Beige", hex: "#E4D5B7" }];
const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "Única"];

/* mapea filas de Supabase al formato que usa la interfaz */
function mapProduct(row) {
  return {
    id: row.id, name: row.name, category: row.category || "General", desc: row.description || "",
    audience: row.audience || [],
    emoji: emojiOf(row.emoji, "📦"), images: row.images && row.images.length ? row.images : null,
    benefits: row.benefits || [], normalPrice: row.normal_price, offerPct: row.offer_pct || 0,
    price: row.price, was: row.was, featured: !!row.featured, top: !!row.top, active: row.active !== false,
    isNew: !!row.is_new, rating: Number(row.rating) || 0, reviews: row.reviews_count || 0, g: gradFor(row.id),
    soldOutManual: !!row.sold_out_manual,
    soldImages: row.sold_images || [],
    variants: (row.variants || []).map((v) => ({ id: v.id, color: v.color, hex: v.hex, size: v.size, stock: v.stock }))
      .sort((a, b) => a.color.localeCompare(b.color) || String(a.size).localeCompare(String(b.size))),
  };
}
function mapStore(row) {
  return {
    id: row.id, name: row.name, emoji: emojiOf(row.emoji, "🛍️"), logoA: row.logo_a || "#3B2BFF", logoB: row.logo_b || "#7A4DFF",
    logoUrl: row.logo_url || null,
    theme: { bg: "#FFFFFF", cardBorderColor: "#ECECF2", cardBorderWidth: 1, cardRadius: 18, cardShadow: true, glass: false, style: "clasico", ...(row.theme || {}) },
    sii: !!row.sii, whatsapp: row.whatsapp || "",
    promo: { eyebrow: row.promo_eyebrow || "Ofertas", title: row.promo_title || "Bienvenido", sub: row.promo_sub || "" },
    slides: Array.isArray(row.slides) && row.slides.length ? row.slides : [{ eyebrow: row.promo_eyebrow || "Ofertas", title: row.promo_title || "Bienvenido", sub: row.promo_sub || "" }],
    bank: row.bank || {},
    slug: row.slug || "", domain: row.domain || "",
  };
}

/* ------------------------------- Iconos ----------------------------- */
const I = {
  bag: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>),
  home: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/></svg>),
  search: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>),
  heart: (f) => (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill={f ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>),
  star: (f) => (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill={f ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>),
  back: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m15 18-6-6 6-6"/></svg>),
  menu: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>),
  eye: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>),
  box: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>),
  palette: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="13.5" cy="6.5" r="1.3"/><circle cx="17.5" cy="10.5" r="1.3"/><circle cx="8.5" cy="7.5" r="1.3"/><circle cx="6.5" cy="12.5" r="1.3"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.6 0 2-1.4 1-2.4-1-1 1-2.6 2-2.6h2c2.8 0 5-2.2 5-5C22 6 17.5 2 12 2z"/></svg>),
  card: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></svg>),
  store: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 9.5 5.2 4h13.6L20 9.5"/><path d="M4 9.5V20h16V9.5"/><path d="M3.5 9.5h17"/><path d="M9.5 20v-6h5v6"/></svg>),
  message: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  logout: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>),
  user: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>),
  bank: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m3 10 9-6 9 6"/><path d="M21 10H3"/><path d="M5 10v9"/><path d="M9 10v9"/><path d="M15 10v9"/><path d="M19 10v9"/><path d="M3 21h18"/></svg>),
  cash: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4"/><path d="M18 10v4"/></svg>),
  bell: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>),
  tag: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg>),
  check: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>),
  shield: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>),
  truck: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>),
  refresh: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3L3 16"/><path d="M3 21v-5h5"/></svg>),
  wa: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.087zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>),
  copy: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>),
  up: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>),
  lock: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  plus: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>),
  chev: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6"/></svg>),
};
const Stars = ({ v, size = 13 }) => (<span style={{ display: "inline-flex", gap: 1, color: "var(--gold)" }}>{[1, 2, 3, 4, 5].map((n) => I.star(n <= Math.round(v))({ key: n, width: size, height: size }))}</span>);

/* Configuración libre del encabezado (logo y título) */
function headerCfg(store) {
  const h = (store.theme && store.theme.header) || {};
  return {
    logoSize: h.logoSize || 40,
    titleSize: h.titleSize || 17,
    titleColor: h.titleColor || null,
    align: h.align || "left",
  };
}

/* Clase CSS del estilo elegido (se aplica a comprador Y vendedor) */
function styleClass(store) {
  const t = store.theme || {};
  const s = (t.style && t.style !== "clasico") ? t.style : (t.glass ? "glass" : "clasico");
  if (s === "glass") return "av-glass";
  if (s === "glassdark") return "av-glass av-glassdark";
  if (s === "minimal") return "av-minimal";
  return "";
}

/* Variables CSS del tema configurable de la tienda (fondo y bordes de tarjetas) */
function shopVars(store) {
  const t = store.theme || {};
  const v = {};
  if (t.bg) { v["--shop-bg"] = t.bg; }
  if (t.cardBorderColor) v["--card-bc"] = t.cardBorderColor;
  if (t.cardBorderWidth != null) v["--card-bw"] = `${t.cardBorderWidth}px`;
  if (t.cardRadius != null) v["--card-rad"] = `${t.cardRadius}px`;
  if (t.cardShadow != null) v["--card-sh"] = t.cardShadow ? "0 4px 14px -12px rgba(20,20,50,.3)" : "none";
  if (t.ink) { v["--ink"] = t.ink; v["--ink2"] = t.ink; v["--muted"] = `color-mix(in srgb, ${t.ink} 55%, white)`; }
  return v;
}

/* Logo de la tienda: imagen si existe, si no degradado + ícono */
function StoreLogo({ store, size = 36, radius = 11, fontSize = 19 }) {
  const base = { width: size, height: size, borderRadius: radius, fontSize };
  if (store.logoUrl) return <div className="av-logo" style={{ ...base, backgroundImage: `url(${store.logoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />;
  return <div className="av-logo" style={{ ...base, ...grad(store.logoA, store.logoB) }}>{store.emoji}</div>;
}

/* ===================================================================== */
export default function App() {
  // Página principal = tienda (comprador). El panel del vendedor también
  // se puede abrir por URL (/panel, /admin, /?admin, /?panel) en el computador.
  const path = window.location.pathname.replace(/\/+$/, "");
  const sp = new URLSearchParams(window.location.search);
  const isAdmin = path === "/panel" || path.startsWith("/panel/") || path === "/admin" || path.startsWith("/admin/") || sp.has("admin") || sp.has("panel");
  const publicStoreId = sp.get("tienda");
  if (isAdmin) return <SellerApp />;
  return <StoreFront storeId={publicStoreId} host={window.location.hostname} />;
}

/* ---- Área de vendedores: login + panel (sesión propia) ---- */
/* ---- Seguridad biométrica (WebAuthn: Face ID / Touch ID / huella) ---- */
const BIO_KEY = "nv_bio_cred";
function bioSupported() { return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create); }
async function bioPlatformAvailable() {
  try { return bioSupported() && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch { return false; }
}
function bioEnabled() { return !!localStorage.getItem(BIO_KEY); }
function bioDisable() { localStorage.removeItem(BIO_KEY); }
function _rand(n = 32) { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
function _b64u(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function _unb64u(s) { return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)); }
async function bioRegister(name = "vendedor") {
  if (!bioSupported()) throw new Error("Este dispositivo o navegador no soporta biometría.");
  const cred = await navigator.credentials.create({ publicKey: {
    challenge: _rand(), rp: { name: "norma-ventas" },
    user: { id: _rand(16), name, displayName: name },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
    timeout: 60000,
  } });
  if (!cred) throw new Error("No se pudo registrar la biometría.");
  localStorage.setItem(BIO_KEY, _b64u(cred.rawId));
  return true;
}
async function bioVerify() {
  if (!bioSupported()) throw new Error("Sin soporte de biometría.");
  const id = localStorage.getItem(BIO_KEY);
  if (!id) throw new Error("No hay biometría registrada en este dispositivo.");
  const assertion = await navigator.credentials.get({ publicKey: {
    challenge: _rand(), allowCredentials: [{ type: "public-key", id: _unb64u(id) }], userVerification: "required", timeout: 60000,
  } });
  return !!assertion;
}

function BioLock({ onUnlock, onLogout }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const tryUnlock = async () => {
    setBusy(true); setErr("");
    try { await bioVerify(); onUnlock(); }
    catch (e) { setErr(e.message || "No se pudo verificar."); setBusy(false); }
  };
  return (
    <div className="av-root"><style>{CSS}</style>
      <div className="av-empty" style={{ gap: 16, padding: "0 28px" }}>
        <div style={{ color: "var(--accent)" }}>{I.lock({ width: 44, height: 44 })}</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>Panel bloqueado</div>
        <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>Verifica tu identidad con Face ID, Touch ID o huella para entrar.</div>
        {err && <div style={{ fontSize: 12, color: "#D33" }}>{err}</div>}
        <button className="av-btn primary" style={{ maxWidth: 280 }} disabled={busy} onClick={tryUnlock}>{busy ? "Verificando…" : "🔓 Desbloquear"}</button>
        <button className="av-btn ghost" style={{ flex: "none", padding: "10px 18px" }} onClick={onLogout}>Salir e iniciar sesión de nuevo</button>
      </div>
    </div>
  );
}

function SellerApp({ onExit }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    getSession().then((s) => { setSession(s); setChecking(false); });
    const unsub = onAuthChange((s) => setSession(s));
    return unsub;
  }, []);
  if (checking) return <div className="av-root"><style>{CSS}</style><div className="av-empty">Cargando…</div></div>;
  if (!session) return <LoginScreen onDone={(s) => { setSession(s); setUnlocked(false); }} onBack={onExit} />;
  if (bioEnabled() && !unlocked) return <BioLock onUnlock={() => setUnlocked(true)} onLogout={async () => { await signOut(); setSession(null); setUnlocked(false); if (onExit) onExit(); }} />;
  return <Main onLogout={() => { setSession(null); setUnlocked(false); if (onExit) onExit(); }} />;
}

/* ---- Vitrina pública: la tienda, con acceso secreto al panel ---- */
function StoreFront({ storeId, host }) {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSeller, setShowSeller] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const s = await getStorePublic(storeId, host);
        if (!s) { setError("Tienda no encontrada."); setLoading(false); return; }
        setStore(mapStore(s));
        const rows = await listProducts(s.id);
        setProducts(rows.map(mapProduct));
      } catch (e) { setError(e.message || "No se pudo cargar la tienda"); }
      finally { setLoading(false); }
    })();
  }, [storeId]);
  const createOrderH = async ({ buyer, cart, total, comprobanteFile, paymentMethod }) =>
    await createOrder(store.id, { buyer, cart, total, comprobanteFile, paymentMethod });
  if (showSeller) return <SellerApp onExit={() => setShowSeller(false)} />;
  if (loading) return <div className="av-root"><style>{CSS}</style><div className="av-empty">Cargando tienda…</div></div>;
  if (error) return <div className="av-root"><style>{CSS}</style><div className="av-empty">{error}</div></div>;
  return (
    <div className="av-root"><style>{CSS}</style>
      <div className="av-stage">
        <div className={"av-phone " + styleClass(store)} style={shopVars(store)}>
          <div className="av-notch" />
          <Buyer store={store} products={products} onCreateOrder={createOrderH} onSecretAdmin={() => setShowSeller(true)} />
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onDone, onBack }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [shop, setShop] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError(""); setMsg(""); setLoading(true);
    try {
      if (signup) {
        const data = await signUp(email, pass);
        if (!data.session) {
          setMsg("Tu cuenta se creó. Revisa tu correo para confirmarla y luego inicia sesión.");
          setSignup(false);
        } else {
          await createMyStore(shop);
          onDone(await getSession());
        }
      } else {
        await signIn(email, pass);
        onDone(await getSession());
      }
    } catch (e) { setError(e.message || "Ocurrió un error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="av-root"><style>{CSS}</style>
      <div className="av-login">
        {onBack && <button className="av-modeswitch" style={{ alignSelf: "flex-start" }} onClick={onBack}>← Volver a la tienda</button>}
        <div className="av-loginlogo" style={grad("#3B2BFF", "#7A4DFF")}>🛍️</div>
        <div style={{ textAlign: "center" }}><div className="av-h1">{signup ? "Crear tu tienda" : "Panel del vendedor"}</div><p className="av-desc" style={{ marginTop: 4 }}>{signup ? "Regístrate y tendrás tu propia tienda, lista para cargar productos." : "Ingresa con tu correo y contraseña."}</p></div>
        {signup && <div><label className="av-cat">Nombre de tu tienda</label><input className="av-input" style={{ marginTop: 6 }} value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Ej: Mi Tienda" /></div>}
        <div><label className="av-cat">Correo</label><input className="av-input" style={{ marginTop: 6 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.cl" /></div>
        <div><label className="av-cat">Contraseña</label><input className="av-input" style={{ marginTop: 6 }} type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={signup ? "Mínimo 6 caracteres" : ""} /></div>
        {error && <div style={{ background: "var(--hot-soft)", color: "#C0291C", padding: "10px 12px", borderRadius: 10, fontSize: 13 }}>{error}</div>}
        {msg && <div style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "10px 12px", borderRadius: 10, fontSize: 13 }}>{msg}</div>}
        <button className="av-btn primary block" disabled={loading || !email || !pass} onClick={submit}>{loading ? (signup ? "Creando…" : "Ingresando…") : (signup ? "Crear cuenta y tienda" : "Ingresar")}</button>
        <button className="av-btn ghost block" onClick={() => { setSignup(!signup); setError(""); setMsg(""); }}>{signup ? "Ya tengo cuenta · Iniciar sesión" : "Crear una tienda nueva"}</button>
      </div>
    </div>
  );
}

/* --------------------- Contenedor con datos reales ------------------ */
function Main({ onLogout }) {
  const [mode, setMode] = useState("seller");
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stockLog, setStockLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const logTimers = useRef({});

  const reloadStockLog = async (storeId) => { try { setStockLog(await listStockLog(storeId)); } catch { /* noop */ } };
  const reloadProducts = async (storeId) => {
    const rows = await listProducts(storeId);
    setProducts(rows.map(mapProduct));
  };
  const reloadOrders = async (storeId) => {
    const rows = await listOrders(storeId);
    const withUrls = await Promise.all(rows.map(async (o) => {
      let url = null;
      if (o.comprobante_path) { try { url = await getComprobanteUrl(o.comprobante_path); } catch { /* noop */ } }
      return {
        dbId: o.id, id: o.code, status: o.status, total: o.total, method: o.payment_method || "transferencia",
        date: new Date(o.created_at).toLocaleDateString("es-CL"), createdAt: o.created_at,
        buyer: { name: o.buyer_name, phone: o.buyer_phone },
        comprobante: { name: (o.comprobante_path || "").split("/").pop() || "comprobante", url },
        items: (o.order_items || []).map((i) => ({ key: i.id, name: i.name, color: i.color, size: i.size, qty: i.qty, price: i.unit_price })),
      };
    }));
    setOrders(withUrls);
  };

  useEffect(() => {
    (async () => {
      try {
        let s = await getMyStore();
        if (!s) {
          // Usuario logueado sin tienda (recién registrado): se la creamos.
          try { s = await createMyStore(); } catch (e) { setError("No se pudo crear tu tienda: " + (e.message || e)); setLoading(false); return; }
        }
        if (!s) { setError("No se encontró tu tienda."); setLoading(false); return; }
        setStore(mapStore(s));
        await reloadProducts(s.id);
        await reloadOrders(s.id);
        await reloadStockLog(s.id);
      } catch (e) { setError(e.message || "Error cargando datos"); }
      finally { setLoading(false); }
    })();
  }, []);

  /* ---- handlers que escriben en Supabase ---- */
  const toggleProduct = async (id, key) => {
    const p = products.find((x) => x.id === id);
    setProducts((arr) => arr.map((x) => (x.id === id ? { ...x, [key]: !x[key] } : x)));
    try { await updateProduct(id, { [key]: !p[key] }); } catch (e) { alert(e.message); reloadProducts(store.id); }
  };
  const setSoldOutH = async (id, value) => {
    setProducts((arr) => arr.map((x) => (x.id === id ? { ...x, soldOutManual: value } : x)));
    try { await updateProduct(id, { sold_out_manual: value }); } catch (e) { alert(e.message); reloadProducts(store.id); }
  };
  const setOfferH = async (id, pct) => {
    try { const row = await setOffer(id, pct); const m = mapProduct({ ...row, variants: products.find((x) => x.id === id)?.variants.map((v) => ({ ...v })) || [] }); setProducts((arr) => arr.map((x) => (x.id === id ? { ...x, offerPct: m.offerPct, price: m.price, was: m.was } : x))); }
    catch (e) { alert(e.message); }
  };
  const editProductH = async (id, patch) => {
    try { await updateProduct(id, patch); await reloadProducts(store.id); }
    catch (e) { alert(e.message); }
  };
  const addColorH = async (productId, rows) => {
    try { await addVariants(productId, rows); await reloadProducts(store.id); }
    catch (e) { alert(e.message); }
  };
  const deleteProductH = async (id) => {
    setProducts((arr) => arr.filter((p) => p.id !== id));
    try { await deleteProduct(id); } catch (e) { alert(e.message); reloadProducts(store.id); }
  };
  const saveOrderH = async (ordered) => { setProducts(ordered); try { await saveOrder(ordered); } catch (e) { alert(e.message); } };
  const setStockH = (variantId, productId, stock) => {
    const v = Math.max(0, stock);
    const prod = products.find((p) => p.id === productId);
    const variant = prod?.variants.find((x) => x.id === variantId);
    setProducts((arr) => arr.map((p) => (p.id === productId ? { ...p, variants: p.variants.map((x) => (x.id === variantId ? { ...x, stock: v } : x)) } : p)));
    updateVariantStock(variantId, v).catch((e) => alert(e.message));
    clearTimeout(logTimers.current[variantId]);
    logTimers.current[variantId] = setTimeout(() => {
      logStockChange(store.id, { productId, productName: prod?.name, color: variant?.color, size: variant?.size, newStock: v })
        .then(() => reloadStockLog(store.id))
        .catch(() => { /* noop */ });
    }, 900);
  };
  const createProductH = async (data, variants, files) => {
    let images = [];
    if (files && files.length) images = await uploadProductImages(store.id, files);
    await createProduct(store.id, { ...data, images }, variants);
    await reloadProducts(store.id);
  };
  const updateStoreH = async (next) => {
    setStore(next);
    try {
      await upsertStore({ id: next.id, name: next.name, emoji: next.emoji, logo_a: next.logoA, logo_b: next.logoB, logo_url: next.logoUrl ?? null, theme: next.theme, slides: next.slides, sii: next.sii, whatsapp: next.whatsapp, slug: next.slug || null, domain: next.domain || null, promo_eyebrow: next.promo.eyebrow, promo_title: next.promo.title, promo_sub: next.promo.sub, bank: next.bank });
    } catch (e) { alert(e.message); }
  };
  const uploadLogoH = async (file) => {
    const url = await uploadStoreLogo(store.id, file);
    await updateStoreH({ ...store, logoUrl: url });
  };
  const createOrderH = async ({ buyer, cart, total, comprobanteFile, paymentMethod }) => {
    const order = await createOrder(store.id, { buyer, cart, total, comprobanteFile, paymentMethod });
    reloadOrders(store.id);
    return order;
  };
  const setOrderStatusH = async (dbId, status) => {
    setOrders((arr) => arr.map((o) => (o.dbId === dbId ? { ...o, status } : o)));
    try { await updateOrderStatus(dbId, status); } catch (e) { alert(e.message); }
  };
  const editOrderH = async (dbId, patch) => {
    try { await updateOrder(dbId, patch); await reloadOrders(store.id); }
    catch (e) { alert(e.message); }
  };
  const deleteOrderH = async (dbId) => {
    setOrders((arr) => arr.filter((o) => o.dbId !== dbId));
    try { await deleteOrder(dbId); } catch (e) { alert(e.message); reloadOrders(store.id); }
  };

  if (loading) return <div className="av-root"><style>{CSS}</style><div className="av-empty">Cargando tu tienda…</div></div>;
  if (error) return <div className="av-root"><style>{CSS}</style><div className="av-empty">{error}<button className="av-btn dark" style={{ flex: "none", padding: "11px 22px", marginTop: 10 }} onClick={onLogout}>Volver al login</button></div></div>;

  return (
    <div className="av-root"><style>{CSS}</style>
      <div className="av-stage">
        <div className={"av-phone " + styleClass(store)} style={shopVars(store)}>
          <div className="av-notch" />
          {mode === "buyer"
            ? <Buyer store={store} products={products} onCreateOrder={createOrderH} onSwitchMode={() => setMode("seller")} />
            : <Seller store={store} products={products} orders={orders} stockLog={stockLog}
                onLogout={onLogout} onToggle={toggleProduct} onSetSoldOut={setSoldOutH} onSetOffer={setOfferH} onSaveOrder={saveOrderH}
                onSetStock={setStockH} onCreate={createProductH} onUpdateStore={updateStoreH} onSetStatus={setOrderStatusH} onUploadLogo={uploadLogoH} onSwitchMode={() => setMode("buyer")} onDeleteProduct={deleteProductH} onEditProduct={editProductH} onAddColor={addColorH} onEditOrder={editOrderH} onDeleteOrder={deleteOrderH} />}
        </div>
      </div>
    </div>
  );
}

/* ============================ COMPRADOR ============================ */
const WA_MSGS = [
  { label: "Tengo una duda", text: "¡Hola {store}! Tengo una duda 🙂" },
  { label: "Consultar stock, tallas y colores", text: "¡Hola {store}! Quiero consultar disponibilidad, tallas o colores de un producto." },
  { label: "Estado de mi pedido / despacho", text: "¡Hola {store}! Quiero saber el estado de mi pedido o despacho." },
  { label: "Cambios y devoluciones", text: "¡Hola {store}! Tengo una consulta sobre cambios o devoluciones." },
];

function WaFab({ store }) {
  const [open, setOpen] = useState(false);
  if (!store.whatsapp) return null;
  const link = (text) => `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text.replace("{store}", store.name))}`;
  return (
    <>
      {open && <div className="av-wafab-ov" onClick={() => setOpen(false)} />}
      <div className="av-wafabwrap">
        {open && (
          <div className="av-wamenu">
            <div className="av-wamenuhead">¿En qué te ayudamos?</div>
            {WA_MSGS.map((m, i) => (
              <a key={i} href={link(m.text)} target="_blank" rel="noreferrer" className="av-waopt" onClick={() => setOpen(false)}>{I.wa({ width: 15, height: 15 })}<span>{m.label}</span></a>
            ))}
          </div>
        )}
        <button className="av-wafab" onClick={() => setOpen((o) => !o)} title="Escríbenos por WhatsApp">
          <span className="av-wafabic">{I.wa({ width: 21, height: 21 })}</span>
          <span className="av-wafabtx">¿Tienes dudas?<br /><b>Escríbenos</b></span>
        </button>
      </div>
    </>
  );
}

function Buyer({ store, products, onCreateOrder, onSwitchMode, onSecretAdmin }) {
  const [tab, setTab] = useState("home");
  const [detailId, setDetailId] = useState(null);
  const [flow, setFlow] = useState(null);
  const [cart, setCart] = useState([]);
  const [favs, setFavs] = useState([]);
  const [filters, setFilters] = useState({ q: "", cat: "Todos", color: "Todos" });
  const [toast, setToast] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [added, setAdded] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [catFilter, setCatFilter] = useState(null);
  const [exp, setExp] = useState(() => new Set());
  const toggleExp = (k) => setExp((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const pickCat = (filter) => { setCatFilter(filter); setTab("home"); setDrawer(false); document.querySelector(".av-screen")?.scrollTo(0, 0); };
  const catsFor = (auds) => Array.from(new Set(products.filter((p) => p.active && (p.audience || []).some((a) => auds.includes(a))).map((p) => p.category).filter(Boolean)));

  const visible = products.filter((p) => p.active);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 1600); };
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("pago");
    if (!p) return;
    const msg = p === "ok" ? "¡Pago recibido! Te confirmaremos por WhatsApp." : p === "pendiente" ? "Pago en proceso. Te avisaremos al confirmarse." : "El pago no se completó. Puedes intentarlo otra vez.";
    setToast(msg); setTimeout(() => setToast(null), 4000);
    const u = new URL(window.location.href); u.searchParams.delete("pago"); window.history.replaceState({}, "", u);
  }, []);
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const addToCart = (product, variant, qty) => {
    const key = `${product.id}-${variant.color}-${variant.size}`;
    setCart((c) => { const ex = c.find((i) => i.key === key); if (ex) return c.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i)); return [...c, { key, id: product.id, name: product.name, emoji: product.emoji, g: product.g, images: product.images, price: product.price, color: variant.color, size: variant.size, qty }]; });
    setAdded({ name: product.name, emoji: product.emoji, g: product.g, images: product.images, price: product.price, color: variant.color, size: variant.size });
  };
  const goCart = () => { setAdded(null); setDetailId(null); setTab("cart"); document.querySelector(".av-screen")?.scrollTo(0, 0); };
  const keepShopping = () => setAdded(null);
  const placeOrder = async (buyer, comp, paymentMethod) => {
    const order = await onCreateOrder({ buyer, cart, total: cartTotal, comprobanteFile: comp?.file, paymentMethod });
    if (paymentMethod === "mercadopago") {
      const items = cart.map((i) => ({ title: i.name + (i.size && i.size !== "Única" ? " " + i.size : "") + " (" + i.color + ")", quantity: i.qty, unit_price: i.price }));
      const pago = await crearPagoMP({ items, orderId: order.id, orderCode: order.code, payerName: buyer.name });
      const url = pago.init_point || pago.sandbox_init_point;
      if (!url) throw new Error("No se pudo iniciar el pago con Mercado Pago.");
      window.location.href = url;
      return;
    }
    setLastOrder({ id: order.code, items: cart, total: cartTotal, method: paymentMethod });
    setCart([]); setFlow("done");
  };
  const open = (id) => { setDetailId(id); document.querySelector(".av-screen")?.scrollTo(0, 0); };
  const sel = products.find((p) => p.id === detailId);

  if (flow === "done" && lastOrder) return <div className="av-screen"><Done store={store} order={lastOrder} onHome={() => { setFlow(null); setTab("home"); }} /></div>;
  if (flow === "checkout") return <div className="av-screen"><Checkout store={store} total={cartTotal} onBack={() => setFlow(null)} onPlace={placeOrder} showToast={showToast} /></div>;
  if (sel) return <div className="av-screen"><Detail store={store} product={sel} all={visible} fav={favs.includes(sel.id)} onFav={() => toggleFav(sel.id)} onBack={() => setDetailId(null)} onAdd={addToCart} openRelated={(id) => open(id)} />{added && <AddedModal item={added} count={cartCount} onGoCart={goCart} onKeep={keepShopping} />}</div>;

  return (
    <>
      <div className="av-top" style={{ justifyContent: headerCfg(store).align === "center" ? "center" : undefined }}>
        <button className="av-burger" onClick={() => setDrawer(true)} title="Categorías">{I.menu({ width: 22, height: 22 })}</button>
        <div className="av-store" style={headerCfg(store).align === "center" ? { flex: 1, justifyContent: "center" } : undefined}><StoreLogo store={store} size={headerCfg(store).logoSize} radius={Math.round(headerCfg(store).logoSize * 0.3)} fontSize={Math.round(headerCfg(store).logoSize * 0.52)} /><div className="av-storetext"><div className="av-storename" style={{ fontSize: headerCfg(store).titleSize, color: headerCfg(store).titleColor || undefined }}>{store.name}</div><span className={"av-sii" + (store.sii ? "" : " no")}>{I.shield({ width: 11, height: 11 })}{store.sii ? "Verificado en el SII" : "Vendedor independiente"}</span></div></div>
        <div className="av-topnav">{[["home", "Inicio"], ["search", "Buscar"], ["favs", "Favoritos"], ["cart", cartCount > 0 ? `Carrito (${cartCount})` : "Carrito"]].map(([k, l]) => <button key={k} className={"av-topnavb" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>
        {onSwitchMode && <button className="av-modeswitch" style={{ marginLeft: "auto" }} onClick={onSwitchMode} title="Volver al panel de vendedor">{I.user({ width: 15, height: 15 })} Vendedor</button>}
        {onSecretAdmin && <button onClick={onSecretAdmin} aria-hidden="true" tabIndex={-1} title="" style={{ position: "absolute", top: 0, right: 0, width: 52, height: 52, opacity: 0, background: "transparent", border: 0, padding: 0, margin: 0, zIndex: 50 }} />}
      </div>
      {drawer && <>
        <div className="av-drawer-ov" onClick={() => setDrawer(false)} />
        <div className="av-drawer">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><StoreLogo store={store} size={38} radius={11} fontSize={18} /><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16 }}>{store.name}</div></div>
          <div className="av-drawerhead">Categorías</div>
          <button className={"av-draweritem" + (!catFilter ? " on" : "")} onClick={() => pickCat(null)}><span style={{ width: 24, display: "inline-flex", justifyContent: "center" }}>{I.store({ width: 18, height: 18 })}</span><span style={{ flex: 1 }}>Todos los productos</span></button>
          {AUD_GROUPS.map((g) => {
            const cats = catsFor(g.auds);
            const isOpen = exp.has(g.key);
            return (
              <div key={g.key}>
                <button className="av-draweritem" onClick={() => toggleExp(g.key)}><span style={{ width: 24, display: "inline-flex", justifyContent: "center" }}>{I.user({ width: 18, height: 18 })}</span><span style={{ flex: 1 }}>{g.label}</span><span className={"av-drawerchev" + (isOpen ? " open" : "")}>▾</span></button>
                {isOpen && <div className="av-drawersubs">
                  <button className="av-drawersub" onClick={() => pickCat({ auds: g.auds, cat: "all", label: g.label })}>Ver todo</button>
                  {cats.length === 0 && <div className="av-drawersub" style={{ opacity: .6 }}>Sin productos aún</div>}
                  {cats.map((c) => <button key={c} className="av-drawersub" onClick={() => pickCat({ auds: g.auds, cat: c, label: g.label + " · " + c })}>{c}</button>)}
                </div>}
              </div>
            );
          })}
        </div>
      </>}
      <div className="av-screen">
        <div className="av-pad av-buyerpad">
          {tab === "home" && (catFilter
            ? <CatView store={store} products={visible} filter={catFilter} favs={favs} toggleFav={toggleFav} open={open} onClear={() => setCatFilter(null)} />
            : <Home store={store} products={visible} favs={favs} toggleFav={toggleFav} open={open} goSearch={() => setTab("search")} />)}
          {tab === "search" && <Search products={visible} filters={filters} setFilters={setFilters} favs={favs} toggleFav={toggleFav} open={open} />}
          {tab === "favs" && <Favs products={visible.filter((p) => favs.includes(p.id))} favs={favs} toggleFav={toggleFav} open={open} goHome={() => setTab("home")} />}
          {tab === "cart" && <Cart cart={cart} setCart={setCart} total={cartTotal} onShop={() => setTab("home")} onCheckout={() => setFlow("checkout")} />}
        </div>
        {toast && <div className="av-toast">{toast}</div>}
        {added && <AddedModal item={added} count={cartCount} onGoCart={goCart} onKeep={keepShopping} />}
      </div>
      <div className="av-nav">
        {[["home", I.home, "Inicio"], ["search", I.search, "Buscar"], ["favs", I.heart(favs.length > 0), "Favoritos"], ["cart", I.bag, "Carrito"]].map(([k, ic, l]) => (
          <button key={k} className={"av-navb" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{ic({ width: 22, height: 22 })}{k === "cart" && cartCount > 0 && <span className="ndot">{cartCount}</span>}{k === "favs" && favs.length > 0 && <span className="ndot">{favs.length}</span>}<span>{l}</span></button>
        ))}
      </div>
      {tab !== "cart" && <WaFab store={store} />}
    </>
  );
}

function AddedModal({ item, count, onGoCart, onKeep }) {
  return (
    <div className="av-modal" onClick={onKeep}>
      <div className="av-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ok">{I.check({ width: 18, height: 18 })} Agregado al carrito</div>
        {item && (
          <div className="av-line" style={{ padding: "14px 0", border: 0 }}>
            <div className="av-linethumb" style={item.images && item.images.length ? imgBg(item.images[0]) : grad(item.g[0], item.g[1])}>{!(item.images && item.images.length) && item.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}><div className="av-name">{item.name}</div><div className="av-cat" style={{ marginTop: 2 }}>{item.color}{item.size !== "Única" ? " · " + item.size : ""}</div></div>
            <div className="av-price" style={{ fontSize: 14 }}>{CLP(item.price)}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button className="av-btn ghost" style={{ flex: 1 }} onClick={onKeep}>Seguir comprando</button>
          <button className="av-btn primary" style={{ flex: 1 }} onClick={onGoCart}>{I.bag({ width: 17, height: 17 })} Ir al carrito{count ? ` (${count})` : ""}</button>
        </div>
      </div>
    </div>
  );
}

function PromoBanner({ store }) {
  const slides = (store.slides && store.slides.length) ? store.slides : [{ eyebrow: store.promo.eyebrow, title: store.promo.title, sub: store.promo.sub }];
  const n = slides.length;
  const [i, setI] = useState(0);
  const sx = useRef(0);
  useEffect(() => { if (n <= 1) return; const t = setInterval(() => setI((x) => (x + 1) % n), 4200); return () => clearInterval(t); }, [n]);
  const idx = Math.min(i, n - 1);
  const s = slides[idx];
  const a = s.a || store.logoA, b = s.b || store.logoB;
  const onTS = (e) => { sx.current = e.touches[0].clientX; };
  const onTE = (e) => { const dx = e.changedTouches[0].clientX - sx.current; if (Math.abs(dx) > 40 && n > 1) setI((x) => (x + (dx < 0 ? 1 : n - 1)) % n); };
  return (
    <div className="av-promo" style={grad(a, b)} onTouchStart={onTS} onTouchEnd={onTE}>
      <div className="blob" /><div className="blob2" />
      <div key={idx} className="av-anim" style={{ position: "relative" }}>
        <div className="eyebrow">{s.eyebrow}</div>
        <div className="big">{s.title}</div>
        {s.sub && <div className="sub">{s.sub}</div>}
      </div>
      {n > 1 && <div className="av-dots">{slides.map((_, k) => <span key={k} className={"av-dot" + (k === idx ? " on" : "")} onClick={() => setI(k)} />)}</div>}
    </div>
  );
}
function CatView({ store, products, filter, favs, toggleFav, open, onClear }) {
  const list = products.filter((p) => (!filter.auds || (p.audience || []).some((a) => filter.auds.includes(a))) && (filter.cat === "all" || p.category === filter.cat));
  return (
    <div className="av-anim">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0 6px" }}>
        <div style={{ flex: 1 }}><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17 }}>{filter.label}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{list.length} {list.length === 1 ? "producto" : "productos"}</div></div>
        <button className="av-chip" onClick={onClear}>✕ Quitar filtro</button>
      </div>
      {list.length === 0 ? <div className="av-empty">{I.box({ width: 30, height: 30 })}<div>No hay productos en esta categoría todavía.</div></div> : <div className="av-grid">{list.map((p) => <Card key={p.id} p={p} fav={favs.includes(p.id)} onFav={() => toggleFav(p.id)} onClick={() => open(p.id)} />)}</div>}
    </div>
  );
}

function Home({ store, products, favs, toggleFav, open, goSearch }) {
  const featured = products.filter((p) => p.featured);
  return (
    <div className="av-anim">
      <PromoBanner store={store} />
      {featured.length > 0 && (<>
        <div className="av-shead"><h3>Destacados</h3><button className="all" onClick={goSearch}>Ver todo {I.chev()}</button></div>
        <div className="av-frow">{featured.map((p) => { const pct = off(p.price, p.was); return (
          <div key={p.id} className="av-feat" onClick={() => open(p.id)}><div className="av-featimg" style={mediaStyle(p)}>{!(p.images && p.images.length) && <span>{p.emoji}</span>}<div className="av-badges">{p.top && <span className="av-badge top">★ Más vendido</span>}{p.was && <span className="av-badge sale">-{pct}%</span>}</div><button className={"av-heart" + (favs.includes(p.id) ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}>{I.heart(favs.includes(p.id))({ width: 17, height: 17 })}</button></div><div className="av-featbody"><span className="av-name">{p.name}</span><div className="av-rate" style={{ marginTop: 4 }}>{p.reviews > 0 ? <><Stars v={p.rating} size={12} /><span>{p.rating}</span><span className="c">({p.reviews})</span></> : <span className="c">Nuevo</span>}</div><div className="av-priceline"><span className="av-price">{CLP(p.price)}</span>{p.was && <span className="av-was">{CLP(p.was)}</span>}</div></div></div>
        ); })}</div>
      </>)}
      <div className="av-shead"><h3>Todos los productos</h3></div>
      {products.length === 0 ? <div className="av-empty">{I.bag({ width: 32, height: 32 })}<div>Aún no hay productos publicados.</div></div>
        : <div className="av-grid">{products.map((p) => <Card key={p.id} p={p} fav={favs.includes(p.id)} onFav={() => toggleFav(p.id)} onClick={() => open(p.id)} />)}</div>}
    </div>
  );
}
function Search({ products, filters, setFilters, favs, toggleFav, open }) {
  const cats = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];
  const colors = ["Todos", ...Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.color))))];
  const res = products.filter((p) => { if (filters.q && !p.name.toLowerCase().includes(filters.q.toLowerCase())) return false; if (filters.cat !== "Todos" && p.category !== filters.cat) return false; if (filters.color !== "Todos" && !p.variants.some((v) => v.color === filters.color)) return false; return true; });
  return (
    <div className="av-anim">
      <div className="av-search">{I.search()}<input className="av-input search" placeholder="¿Qué estás buscando?" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></div>
      <div className="av-chips">{cats.map((c) => <button key={c} className={"av-chip" + (filters.cat === c ? " on" : "")} onClick={() => setFilters({ ...filters, cat: c })}>{c}</button>)}</div>
      <div className="av-chips" style={{ paddingTop: 4 }}>{colors.map((c) => <button key={c} className={"av-chip" + (filters.color === c ? " on" : "")} onClick={() => setFilters({ ...filters, color: c })}>{c === "Todos" ? "Todo color" : c}</button>)}</div>
      {res.length === 0 ? <div className="av-empty">{I.search({ width: 30, height: 30 })}<div>Sin resultados.</div></div> : <div className="av-grid">{res.map((p) => <Card key={p.id} p={p} fav={favs.includes(p.id)} onFav={() => toggleFav(p.id)} onClick={() => open(p.id)} />)}</div>}
    </div>
  );
}
function Favs({ products, favs, toggleFav, open, goHome }) {
  return (<div className="av-anim"><div className="av-shead"><h3>Tus favoritos</h3></div>{products.length === 0 ? <div className="av-empty">{I.heart(false)({ width: 32, height: 32 })}<div>Aún no tienes favoritos.</div><button className="av-btn dark" style={{ flex: "none", padding: "11px 22px", marginTop: 6 }} onClick={goHome}>Explorar productos</button></div> : <div className="av-grid">{products.map((p) => <Card key={p.id} p={p} fav={favs.includes(p.id)} onFav={() => toggleFav(p.id)} onClick={() => open(p.id)} />)}</div>}</div>);
}
function Card({ p, fav, onFav, onClick, preview }) {
  const stock = p.variants.reduce((s, v) => s + v.stock, 0);
  const low = stock > 0 && stock <= 3; const pct = off(p.price, p.was);
  const out = isSoldOut(p);
  const av = availImages(p);
  const imgs = av.length ? av : (p.images && p.images.length ? [p.images[0]] : null);
  const hasImg = !!imgs;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null); const moved = useRef(false);
  useEffect(() => {
    if (paused || !imgs || imgs.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % imgs.length), 3000);
    return () => clearInterval(t);
  }, [paused, imgs]);
  const onStart = (e) => { setPaused(true); startX.current = e.touches[0].clientX; moved.current = false; };
  const onMove = (e) => { if (startX.current != null && Math.abs(e.touches[0].clientX - startX.current) > 8) moved.current = true; };
  const onEnd = (e) => {
    if (imgs && imgs.length > 1 && startX.current != null) {
      const dx = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(dx) > 30) setIdx((i) => (dx < 0 ? (i + 1) % imgs.length : (i - 1 + imgs.length) % imgs.length));
    }
    startX.current = null;
  };
  const cardClick = () => { if (moved.current) { moved.current = false; return; } onClick(); };
  const goDot = (e, i) => { e.stopPropagation(); setPaused(true); setIdx(i); };
  return (
    <div className="av-card" onClick={cardClick}>
      <div className="av-thumb" style={imgs ? imgBg(imgs[idx]) : grad(p.g[0], p.g[1])} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} aria-label={out ? "Producto agotado" : undefined}>{out && <SoldLayer />}{!hasImg && <span>{p.emoji}</span>}<div className="av-badges">{p.top && <span className="av-badge top">★ Top</span>}{p.was && !out && <span className="av-badge sale">-{pct}%</span>}{p.isNew && !p.was && !p.top && !out && <span className="av-badge new">Nuevo</span>}{!out && URGENCIA_STOCK_BAJO && low && <span className="av-badge stock">Últimas {stock}</span>}</div>{!preview && <button className={"av-heart" + (fav ? " on" : "")} onClick={(e) => { e.stopPropagation(); onFav(); }}>{I.heart(fav)({ width: 17, height: 17 })}</button>}{imgs && imgs.length > 1 && <div className="av-minidots">{imgs.map((_, i) => <i key={i} className={idx === i ? "on" : ""} onClick={(e) => goDot(e, i)} />)}</div>}</div>
      <div className="av-cardbody"><span className="av-cat">{p.category}</span><span className="av-name">{p.name}</span><div className="av-rate">{p.reviews > 0 ? <><Stars v={p.rating} size={11} /><span>{p.rating}</span><span className="c">({p.reviews})</span></> : <span className="c">Nuevo</span>}</div><div className="av-priceline"><span className="av-price">{CLP(p.price)}</span>{p.was && <span className="av-was">{CLP(p.was)}</span>}{p.was && <span className="av-off">-{pct}%</span>}</div></div>
    </div>
  );
}
function Detail({ store, product, all, fav, onFav, onBack, onAdd, openRelated }) {
  const NOCLR = (c) => !c || ["Único", "Única", "—", ""].includes(c);
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const realColors = colors.filter((c) => !NOCLR(c));
  const hasColors = realColors.length > 0;
  const colorStock = (c) => product.variants.filter((v) => v.color === c).reduce((s, v) => s + v.stock, 0);
  const [color, setColor] = useState(colors[0]);
  const sizesForColor = product.variants.filter((v) => v.color === color);
  const hasSizes = sizesForColor.some((v) => v.size && v.size !== "Única");
  const [size, setSize] = useState(sizesForColor[0]?.size);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const gx = useRef(null);
  const galStart = (e) => { setPaused(true); gx.current = e.touches[0].clientX; };
  const galEnd = (e) => { if (gx.current == null) return; const dx = e.changedTouches[0].clientX - gx.current; if (Math.abs(dx) > 35) setSlide((s) => { const n = slides.length; return dx < 0 ? (s + 1) % n : (s - 1 + n) % n; }); gx.current = null; };
  const galGo = (dir) => { setPaused(true); setSlide((s) => { const n = slides.length; return (s + dir + n) % n; }); };
  const galPick = (i) => { setPaused(true); setSlide(i); };
  useEffect(() => { const list = product.variants.filter((v) => v.color === color); if (!list.some((v) => v.size === size)) setSize(list[0]?.size); }, [color]); // eslint-disable-line
  const variant = product.variants.find((v) => v.color === color && v.size === size);
  const stock = variant?.stock ?? 0; const pct = off(product.price, product.was);
  const out = isSoldOut(product);
  const [waitOpen, setWaitOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [notified, setNotified] = useState(false);
  const submitWait = async () => { if (!contact.trim()) return; try { await joinWaitlist(product.id, contact.trim()); setNotified(true); } catch (e) { alert(e.message); } };
  const alts = (() => { const a = all.filter((p) => p.id !== product.id && !isSoldOut(p) && p.category === product.category); return (a.length ? a : all.filter((p) => p.id !== product.id && !isSoldOut(p))).slice(0, 4); })();
  const related = (() => { const r = all.filter((p) => p.id !== product.id && p.category === product.category); return r.length ? r.slice(0, 5) : all.filter((p) => p.id !== product.id).slice(0, 5); })();
  const hasImg = product.images && product.images.length;
  const avImgs = availImages(product);
  const baseImgs = avImgs.length ? avImgs : (hasImg ? [product.images[0]] : null);
  const slides = baseImgs ? baseImgs : [product.g, [product.g[1], product.g[0]], ["#F2F2F6", product.g[0]]];
  const variantLabel = [hasColors ? color : null, hasSizes && size !== "Única" ? size : null].filter(Boolean).join(" / ");
  const waMsg = `Hola ${store.name}, me interesa *${product.name}*${variantLabel ? " (" + variantLabel + ")" : ""} a ${CLP(product.price)}. ¿Está disponible?`;
  const waLink = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(waMsg)}`;
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [paused, slides.length]);
  return (
    <div className="av-anim av-pad">
      <div className="av-gallery" style={hasImg ? imgBg(slides[slide]) : grad(slides[slide][0], slides[slide][1])} onTouchStart={galStart} onTouchEnd={galEnd} aria-label={out ? "Producto agotado" : undefined}>
        {out && <SoldLayer />}
        <button className="av-back" onClick={onBack}>{I.back()}</button>
        <button className={"av-dheart" + (fav ? " on" : "")} onClick={onFav}>{I.heart(fav)({ width: 19, height: 19 })}</button>
        {!hasImg && <span>{product.emoji}</span>}
        <div className="av-badges" style={{ top: 96 }}>{product.top && <span className="av-badge top">★ Más vendido</span>}{product.was && <span className="av-badge sale">-{pct}%</span>}</div>
        {slides.length > 1 && <><button className="av-galnav" style={{ left: 12 }} onClick={() => galGo(-1)}>{I.back()}</button><button className="av-galnav" style={{ right: 12, transform: "translateY(-50%) scaleX(-1)" }} onClick={() => galGo(1)}>{I.back()}</button></>}
        {slides.length > 1 && <div className="av-dots">{slides.map((_, i) => <i key={i} className={slide === i ? "on" : ""} onClick={() => galPick(i)} />)}</div>}
      </div>
      {hasImg && baseImgs.length > 1 && (
        <div className="av-thumbs">{baseImgs.map((src, i) => (<button key={i} className={"av-thumbmini" + (slide === i ? " on" : "")} style={imgBg(src)} onClick={() => galPick(i)} aria-label={"foto " + (i + 1)} />))}</div>
      )}
      <div className="av-sec">
        <span className="av-cat">{product.category}</span><h1 className="av-h1">{product.name}</h1>
        {product.reviews > 0 && <div className="av-rate" style={{ marginTop: 8, fontSize: 13 }}><Stars v={product.rating} /><span>{product.rating}</span><span className="c">· {product.reviews} reseñas</span></div>}
        <div className="av-detprice"><span className="av-price">{CLP(product.price)}</span>{product.was && <><span className="av-was">{CLP(product.was)}</span><span className="av-off">Ahorras {CLP(product.was - product.price)}</span></>}</div>
        {hasColors && (<>
          <div className="av-vlabel">Color · {color} · {colorStock(color) === 0 ? "sin stock" : colorStock(color) + " disp."}</div>
          <div className="av-swatches">{realColors.map((c) => { const h = product.variants.find((v) => v.color === c)?.hex; const out = colorStock(c) === 0; return <div key={c} className={"av-swatch" + (color === c ? " on" : "") + (out ? " off" : "")} style={{ background: h }} onClick={() => !out && setColor(c)} title={c + (out ? " (sin stock)" : "")} />; })}</div>
        </>)}
        {hasSizes && (<><div className="av-vlabel">Talla</div><div className="av-sizes">{sizesForColor.map((v) => <button key={v.size} disabled={v.stock === 0} className={"av-size" + (size === v.size ? " on" : "") + (v.stock === 0 ? " off" : "")} onClick={() => v.stock > 0 && setSize(v.size)}>{v.size}</button>)}</div></>)}
        <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 600, color: stock === 0 ? "var(--muted)" : stock <= 3 ? "var(--hot)" : "var(--ok)" }}>{stock === 0 ? "Sin stock en esta combinación" : stock <= 3 ? `¡Solo quedan ${stock}!` : `${stock} disponibles`}</div>
        {product.benefits?.length > 0 && <ul className="av-benefits">{product.benefits.map((b, i) => <li key={i}>{I.check()}<span>{b}</span></li>)}</ul>}
        {product.desc && <p className="av-desc">{product.desc}</p>}
        {out && alts.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="av-vlabel" style={{ color: "var(--accent)" }}>Disponibles ahora</div>
            <div className="av-relrow">{alts.map((p) => (<div key={p.id} className="av-relcard" onClick={() => openRelated(p.id)}><div className="av-relthumb" style={mediaStyle(p)}>{!(p.images && p.images.length) && p.emoji}</div><div className="av-name" style={{ marginTop: 7 }}>{p.name}</div><div className="av-price" style={{ fontSize: 13, marginTop: 4 }}>{CLP(p.price)}</div></div>))}</div>
          </div>
        )}
      </div>
      <div className="av-divider" />
      <div className="av-shead" style={{ paddingBottom: 6 }}><h3>Opiniones</h3></div>
      <div className="av-revhead"><div style={{ textAlign: "center" }}><div className="av-bigrate">{product.reviews > 0 ? product.rating : "—"}</div><Stars v={product.rating} size={14} /><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{product.reviews} reseñas</div></div><div style={{ flex: 1, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>{product.reviews > 0 ? "Calificación de clientes que ya recibieron su pedido." : "Este producto aún no tiene reseñas."}</div></div>
      <div style={{ height: 14 }} />
      {product.reviews > 0 && POOL.slice(0, 3).map((rv, i) => (<div key={i} className="av-review"><div className="av-revname">{rv.name} <span style={{ marginLeft: "auto" }}><Stars v={rv.r} size={12} /></span></div><div className="av-revtext">{rv.t}</div></div>))}
      {related.length > 0 && (<><div className="av-divider" /><div className="av-shead" style={{ paddingBottom: 6 }}><h3>También te puede gustar</h3></div><div className="av-relrow">{related.map((p) => (<div key={p.id} className="av-relcard" onClick={() => openRelated(p.id)}><div className="av-relthumb" style={mediaStyle(p)}>{!(p.images && p.images.length) && p.emoji}</div><div className="av-name" style={{ marginTop: 7 }}>{p.name}</div><div className="av-price" style={{ fontSize: 13, marginTop: 4 }}>{CLP(p.price)}</div></div>))}</div></>)}
      <div style={{ height: 8 }} />
      <div className="av-bottombar">
        {!out ? (
          <button className="av-btn primary" disabled={stock === 0} onClick={() => onAdd(product, variant, 1)}>{I.bag({ width: 18, height: 18 })} {stock === 0 ? "Sin stock" : "Agregar — " + CLP(product.price)}</button>
        ) : notified ? (
          <div className="av-btn primary" style={{ background: "var(--ok)", cursor: "default" }}>{I.check()} Te avisaremos cuando vuelva</div>
        ) : waitOpen ? (
          <div style={{ display: "flex", gap: 8, flex: 1 }}><input className="av-input" autoFocus value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Tu WhatsApp o correo" /><button className="av-btn primary" style={{ flex: "none", padding: "0 18px" }} disabled={!contact.trim()} onClick={submitWait}>Avisarme</button></div>
        ) : (
          <button className="av-btn primary" onClick={() => setWaitOpen(true)}>{I.bell ? I.bell({ width: 18, height: 18 }) : null} Avísame cuando vuelva</button>
        )}
        <a href={waLink} target="_blank" rel="noreferrer" className="av-btn wa" style={{ textDecoration: "none" }}>{I.wa()}</a>
      </div>
    </div>
  );
}
function Cart({ cart, setCart, total, onShop, onCheckout }) {
  const setQty = (key, d) => setCart((c) => c.map((i) => (i.key === key ? { ...i, qty: Math.max(1, i.qty + d) } : i)));
  const remove = (key) => setCart((c) => c.filter((i) => i.key !== key));
  return (
    <div className="av-anim">
      <div className="av-pagehead" style={{ paddingTop: 18 }}><span className="av-pagetitle">Tu carrito</span></div>
      {cart.length === 0 ? (<div className="av-empty">{I.bag({ width: 36, height: 36 })}<div>Tu carrito está vacío.</div><button className="av-btn dark" style={{ flex: "none", padding: "11px 22px", marginTop: 6 }} onClick={onShop}>Ver productos</button></div>) : (<>
        {cart.map((i) => (<div key={i.key} className="av-line"><div className="av-linethumb" style={i.images && i.images.length ? imgBg(i.images[0]) : grad(i.g[0], i.g[1])}>{!(i.images && i.images.length) && i.emoji}</div><div style={{ flex: 1, minWidth: 0 }}><div className="av-name">{i.name}</div><div className="av-cat" style={{ marginTop: 2 }}>{i.color}{i.size !== "Única" ? " · " + i.size : ""}</div><div className="av-price" style={{ fontSize: 14, marginTop: 5 }}>{CLP(i.price * i.qty)}</div></div><div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}><div className="av-qty"><button onClick={() => setQty(i.key, -1)}>–</button><span>{i.qty}</span><button onClick={() => setQty(i.key, 1)}>+</button></div><button onClick={() => remove(i.key)} style={{ border: 0, background: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>Quitar</button></div></div>))}
        <div className="av-summary"><div className="av-srow"><span>Subtotal</span><span>{CLP(total)}</span></div><div className="av-srow"><span>Envío</span><span>Se coordina por WhatsApp</span></div><div className="av-srow total"><span>Total</span><span>{CLP(total)}</span></div></div>
        <div className="av-bottombar"><button className="av-btn primary block" onClick={onCheckout}>Ir a pagar — {CLP(total)}</button></div>
      </>)}
    </div>
  );
}
function Checkout({ store, total, onBack, onPlace, showToast }) {
  const [copied, setCopied] = useState(null);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [comp, setComp] = useState(null);
  const [sending, setSending] = useState(false);
  const [method, setMethod] = useState("transferencia");
  const copy = (k, v) => { if (navigator.clipboard) navigator.clipboard.writeText(v).catch(() => {}); setCopied(k); showToast("Copiado"); setTimeout(() => setCopied(null), 1400); };
  const onFile = (e) => { const f = e.target.files?.[0]; if (!f) return; setComp({ name: f.name, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null, file: f }); };
  const ready = name.trim() && phone.trim() && (method !== "transferencia" || comp) && !sending;
  const b = store.bank || {};
  const rows = [["Banco", b.banco], ["Tipo de cuenta", b.tipo], ["N° de cuenta", b.numero], ["RUT", b.rut], ["Titular", b.titular], ["Correo", b.correo]].filter(([, v]) => v);
  const submit = async () => { setSending(true); try { await onPlace({ name, phone }, comp, method); } catch (e) { alert(e.message); setSending(false); } };
  const title = method === "efectivo" ? "Pagar en efectivo" : method === "mercadopago" ? "Pagar con Mercado Pago" : "Pagar por transferencia";
  const mpOn = !!(store.sii && store.theme && store.theme.mp);
  return (
    <div className="av-anim av-pad">
      <div className="av-pagehead"><button className="av-back" style={{ position: "static" }} onClick={onBack}>{I.back()}</button><span className="av-pagetitle">{title}</span></div>
      <div className="av-summary" style={{ paddingBottom: 4 }}><div className="av-srow total" style={{ borderTop: 0, marginTop: 0, paddingTop: 0 }}><span>Total a pagar</span><span>{CLP(total)}</span></div></div>
      <div className="av-vlabel" style={{ margin: "6px 18px 0" }}>Método de pago</div>
      <div className="av-paypick">
        <button className={"av-paybtn" + (method === "transferencia" ? " on" : "")} onClick={() => setMethod("transferencia")}><span className="ic">{I.bank({ width: 18, height: 18 })}</span>Transferencia</button>
        <button className={"av-paybtn" + (method === "efectivo" ? " on" : "")} onClick={() => setMethod("efectivo")}><span className="ic">{I.cash({ width: 18, height: 18 })}</span>Efectivo</button>
        {mpOn && <button className={"av-paybtn" + (method === "mercadopago" ? " on" : "")} onClick={() => setMethod("mercadopago")}><span className="ic">{I.card({ width: 18, height: 18 })}</span>Mercado Pago</button>}
      </div>
      {method === "transferencia" && (
      <div className="av-bank"><div className="av-bankhead">{I.shield({ width: 14, height: 14 })} Datos para la transferencia</div>{rows.length === 0 ? <div style={{ padding: 14, fontSize: 13, color: "var(--muted)" }}>El vendedor aún no cargó sus datos bancarios.</div> : rows.map(([k, v]) => (<div key={k} className="av-bankrow"><span className="k">{k}</span><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="v">{v}</span><button className={"av-copy" + (copied === k ? " done" : "")} onClick={() => copy(k, v)}>{copied === k ? I.check({ width: 12, height: 12 }) : I.copy()}</button></span></div>))}</div>
      )}
      <div className="av-field"><label>Tu nombre</label><input className="av-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" /></div>
      <div className="av-field"><label>Tu WhatsApp</label><input className="av-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 ..." /></div>
      {method === "transferencia" ? (
      <label className={"av-upload" + (comp ? " has" : "")}><input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={onFile} />{comp ? (<>{comp.url ? <img src={comp.url} className="av-upimg" alt="comprobante" /> : I.check({ width: 26, height: 26 })}<div style={{ fontSize: 13, fontWeight: 600, color: "var(--ok)" }}>Comprobante adjunto</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{comp.name} · tocar para cambiar</div></>) : (<><div style={{ color: "var(--accent)", marginBottom: 6 }}>{I.up()}</div><div style={{ fontSize: 13, fontWeight: 600 }}>Adjuntar comprobante</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Foto o PDF de tu transferencia</div></>)}</label>
      ) : method === "mercadopago" ? (
      <div className="av-cashbox"><span style={{ color: "var(--accent)", flex: "none" }}>{I.lock({ width: 18, height: 18 })}</span><div>Pagarás <b>{CLP(total)}</b> de forma segura en Mercado Pago (tarjeta de crédito, débito o saldo). Al confirmar, te llevamos al pago y luego vuelves a la tienda.</div></div>
      ) : (
      <div className="av-cashbox"><span style={{ color: "var(--ok)", flex: "none" }}>{I.check({ width: 18, height: 18 })}</span><div>Pagarás <b>{CLP(total)}</b> en efectivo al momento de recibir tu pedido. {store.name} coordinará contigo la entrega por WhatsApp.</div></div>
      )}
      <div style={{ height: 8 }} />
      <p className="av-hint" style={{ textAlign: "center", margin: "0 18px 2px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>{I.lock({ width: 12, height: 12 })} Tus datos no se publican. {store.name} coordina contigo por WhatsApp.</p>
      <div className="av-bottombar"><button className="av-btn primary block" disabled={!ready} onClick={submit}>{sending ? "Procesando…" : !ready ? "Completa los datos" : method === "mercadopago" ? "Pagar con Mercado Pago" : "Confirmar pedido"}</button></div>
    </div>
  );
}
function Done({ store, order, onHome }) {
  const cash = order.method === "efectivo";
  const lines = order.items.map((i) => `• ${i.name} (${i.color}${i.size !== "Única" ? " / " + i.size : ""}) x${i.qty}`).join("\n");
  const closing = cash ? "Pagaré en efectivo al recibir. ¿Coordinamos la entrega?" : "Adjunté el comprobante de transferencia. ¿Me confirmas?";
  const msg = `Hola ${store.name}, hice mi pedido *${order.id}* por ${CLP(order.total)}.\n${lines}\n${closing}`;
  const link = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`;
  return (<div className="av-conf av-anim"><div className="av-confcircle">{I.check({ width: 36, height: 36 })}</div><div className="av-h1">¡Pedido recibido!</div><div style={{ fontFamily: "Space Grotesk", fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>{order.id}</div><span className="av-pill">{cash ? "💵 Pago en efectivo al recibir" : "⏳ Pago en revisión"}</span><p className="av-desc" style={{ textAlign: "center", maxWidth: 290 }}>{cash ? `Guardamos tu pedido. ${store.name} coordinará la entrega y el pago en efectivo por WhatsApp.` : `Recibimos tu comprobante. ${store.name} validará la transferencia y te confirmará por WhatsApp.`}</p><a href={link} target="_blank" rel="noreferrer" className="av-btn wa" style={{ textDecoration: "none", marginTop: 12, width: "auto", padding: "15px 24px", color: "#fff" }}>{I.wa()} Continuar por WhatsApp</a><button className="av-btn ghost" style={{ flex: "none", padding: "13px 24px", marginTop: 8 }} onClick={onHome}>Seguir comprando</button></div>);
}

/* ============================ VENDEDOR ============================ */
function Seller({ store, products, orders, stockLog, onLogout, onToggle, onSetSoldOut, onSetOffer, onSaveOrder, onSetStock, onCreate, onUpdateStore, onSetStatus, onUploadLogo, onSwitchMode, onDeleteProduct, onEditProduct, onAddColor, onEditOrder, onDeleteOrder }) {
  const [tab, setTab] = useState("productos");
  const [drawer, setDrawer] = useState(false);
  const [exp, setExp] = useState(() => new Set());
  const handleLogout = async () => { await signOut(); onLogout(); };
  const go = (k) => { setTab(k); setDrawer(false); };
  const toggleExp = (k) => setExp((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const tabs = [["productos", "Productos"], ["pedidos", `Pedidos${orders.length ? " (" + orders.length + ")" : ""}`]];
  const menu = [
    { k: "vista", l: "Vista previa", ic: "eye", subs: ["Vista previa del catálogo"] },
    { k: "stock", l: "Stock", ic: "box", subs: ["Existencias y cantidades"] },
    { k: "categorias", l: "Categorías del menú", ic: "tag", subs: ["Público de cada producto", "Renombrar categorías"] },
    { k: "marca", l: "Marca", ic: "palette", subs: ["Nombre y logo", "Encabezado", "Apariencia de la tienda", "Carrusel de ofertas"] },
    { k: "seguridad", l: "Seguridad", ic: "shield", subs: ["Biometría (Face ID / huella)"] },
    { k: "pagos", l: "Métodos de pago", ic: "card", subs: ["Mercado Pago", "Datos bancarios"] },
    { k: "datos", l: "Datos de la tienda", ic: "store", subs: ["Formalización (SII)", "WhatsApp Business", "Dirección web (dominio)"] },
    { k: "avisos", l: "Avisos por WhatsApp", ic: "message", subs: ["CallMeBot (número y apikey)", "Mensaje del aviso"] },
  ];
  return (
    <>
      {drawer && <>
        <div className="av-drawer-ov" onClick={() => setDrawer(false)} />
        <div className="av-drawer">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><StoreLogo store={store} size={40} radius={12} fontSize={19} /><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16 }}>{store.name}</div></div>
          <div className="av-drawerhead">Menú</div>
          {menu.map(({ k, l, ic, subs }) => {
            const multi = subs.length > 1;
            const open = exp.has(k);
            return (
              <div key={k}>
                <button className={"av-draweritem" + (tab === k ? " on" : "")} onClick={() => go(k)}>
                  <span style={{ width: 24, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{I[ic]({ width: 19, height: 19 })}</span>
                  <span style={{ flex: 1 }}>{l}</span>
                  {multi && <span className={"av-drawerchev" + (open ? " open" : "")} onClick={(e) => { e.stopPropagation(); toggleExp(k); }}>▾</span>}
                </button>
                {multi && open && <div className="av-drawersubs">{subs.map((s) => <button key={s} className="av-drawersub" onClick={() => go(k)}>{s}</button>)}</div>}
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <button className="av-draweritem" onClick={handleLogout}><span style={{ width: 24, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{I.logout({ width: 19, height: 19 })}</span>Salir</button>
        </div>
      </>}
      <div className="av-top">
        <button className="av-burger" onClick={() => setDrawer(true)} title="Menú">{I.menu({ width: 22, height: 22 })}</button>
        <div className="av-store" onClick={() => setDrawer(true)} style={{ cursor: "pointer" }}><StoreLogo store={store} size={40} radius={12} fontSize={19} /><div className="av-storetext"><div className="av-storename" style={{ fontSize: 16 }}>{store.name}</div><span className="av-sii" style={{ color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "100%" }}>Toca para el menú</span></div></div>
        {onSwitchMode && <button className="av-modeswitch" onClick={onSwitchMode} title="Ver la tienda como comprador">{I.bag({ width: 15, height: 15 })} Comprador</button>}
        <button className="av-iconbtn" onClick={handleLogout} title="Salir">{I.lock({ width: 18, height: 18 })}</button>
      </div>
      <div className="av-screen">
        <div className="av-tabbar">{tabs.map(([k, l]) => <div key={k} className={"av-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</div>)}</div>
        {tab === "vista" && <SellerShowcase store={store} products={products} onUpdateStore={onUpdateStore} onToggle={onToggle} onSetOffer={onSetOffer} onSaveOrder={onSaveOrder} />}
        {tab === "productos" && <SellerProducts products={products} onToggle={onToggle} onSetSoldOut={onSetSoldOut} onCreate={onCreate} onDelete={onDeleteProduct} onEdit={onEditProduct} onAddColor={onAddColor} onSetStock={onSetStock} storeId={store.id} />}
        {tab === "stock" && <SellerInventory products={products} onSetStock={onSetStock} />}
        {tab === "categorias" && <SellerCategories products={products} onEdit={onEditProduct} />}
        {tab === "pedidos" && <SellerOrders orders={orders} onSetStatus={onSetStatus} stockLog={stockLog} onEditOrder={onEditOrder} onDeleteOrder={onDeleteOrder} />}
        {tab === "marca" && <SellerBrand store={store} onUpdateStore={onUpdateStore} onUploadLogo={onUploadLogo} />}
        {tab === "seguridad" && <SellerStore store={store} onUpdateStore={onUpdateStore} section="seguridad" onGo={go} />}
        {tab === "pagos" && <SellerStore store={store} onUpdateStore={onUpdateStore} section="pagos" onGo={go} />}
        {tab === "datos" && <SellerStore store={store} onUpdateStore={onUpdateStore} section="datos" onGo={go} />}
        {tab === "avisos" && <SellerStore store={store} onUpdateStore={onUpdateStore} section="avisos" onGo={go} />}
      </div>
    </>
  );
}

function SellerCategories({ products, onEdit }) {
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const allCats = Array.from(new Set(products.map((p) => p.category || "General"))).sort((a, b) => a.localeCompare(b));
  const catsInGroup = (g) => Array.from(new Set(products.filter((p) => p.active && (p.audience || []).some((a) => g.auds.includes(a))).map((p) => p.category || "General"))).sort((a, b) => a.localeCompare(b));
  const countCat = (g, cat) => products.filter((p) => p.active && (p.audience || []).some((a) => g.auds.includes(a)) && (p.category || "General") === cat).length;
  const sinPublico = products.filter((p) => !(p.audience || []).length);
  const toggleAud = (p, key) => { const cur = p.audience || []; onEdit(p.id, { audience: cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key] }); };
  const doRename = async () => {
    const to = newName.trim(); if (!to || !renaming) return;
    setBusy(true);
    const ids = products.filter((p) => (p.category || "General") === renaming).map((p) => p.id);
    try { for (const id of ids) await onEdit(id, { category: to }); } catch (e) { alert(e.message); }
    setBusy(false); setRenaming(null); setNewName("");
  };
  return (
    <div className="av-anim av-pad">
      <div className="av-pagehead" style={{ paddingTop: 4 }}><span className="av-pagetitle">Categorías del menú</span></div>
      <p className="av-hint" style={{ textAlign: "left", marginTop: 0 }}>Así ven los compradores tu tienda en el menú lateral. Ajusta el público de cada producto y los nombres de las categorías.</p>
      {AUD_GROUPS.map((g) => { const cats = catsInGroup(g); return (
        <div key={g.key} className="av-catgroup">
          <div className="av-catgrouphead">{g.label}</div>
          {cats.length === 0 ? <div className="av-hint" style={{ margin: 0, textAlign: "left" }}>Sin productos aquí todavía.</div>
            : <div className="av-catsubs">{cats.map((c) => <span key={c} className="av-catsub">{c}<b>{countCat(g, c)}</b></span>)}</div>}
        </div>
      ); })}
      {sinPublico.length > 0 && <p className="av-hint" style={{ textAlign: "left" }}>⚠ {sinPublico.length} producto(s) sin público asignado no aparecen en el menú. Asígnalos más abajo.</p>}

      <div className="av-divider" />
      <div className="av-shead" style={{ paddingBottom: 6 }}><h3>Renombrar categorías</h3></div>
      <p className="av-hint" style={{ textAlign: "left", marginTop: 0 }}>Cambia el nombre de una categoría en todos sus productos a la vez.</p>
      {allCats.map((c) => (
        <div key={c} className="av-srow2" style={{ borderBottom: 0, gap: 8 }}>
          {renaming === c ? (<>
            <input className="av-input" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={c} style={{ flex: 1 }} />
            <button className="av-btn primary" style={{ flex: "none", padding: "0 15px" }} disabled={busy || !newName.trim()} onClick={doRename}>{busy ? "…" : "Guardar"}</button>
            <button className="av-btn ghost" style={{ flex: "none", padding: "0 13px" }} onClick={() => { setRenaming(null); setNewName(""); }}>Cancelar</button>
          </>) : (<>
            <div style={{ flex: 1 }}><div className="av-name">{c}</div><div className="av-cat" style={{ marginTop: 2 }}>{products.filter((p) => (p.category || "General") === c).length} producto(s)</div></div>
            <button className="av-minitag" onClick={() => { setRenaming(c); setNewName(c); }}>Renombrar</button>
          </>)}
        </div>
      ))}

      <div className="av-divider" />
      <div className="av-shead" style={{ paddingBottom: 6 }}><h3>Público de cada producto</h3></div>
      <p className="av-hint" style={{ textAlign: "left", marginTop: 0 }}>Marca para quién es cada producto: define en qué parte del menú aparece.</p>
      {products.map((p) => (
        <div key={p.id} className="av-catprod">
          <div className="av-linethumb" style={{ ...mediaStyle(p), width: 42, height: 42, fontSize: 18, flex: "none" }}>{!(p.images && p.images.length) && p.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="av-name">{p.name}</div>
            <div className="av-cat" style={{ marginTop: 1 }}>{p.category || "General"}</div>
            <div className="av-stepchips" style={{ marginTop: 7 }}>{AUDIENCES.map(([k, l]) => <button key={k} className={"av-stepchip" + ((p.audience || []).includes(k) ? " on" : "")} onClick={() => toggleAud(p, k)}>{l}</button>)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerShowcase({ store, products, onUpdateStore, onToggle, onSetOffer, onSaveOrder }) {
  const [cat, setCat] = useState("Todos");
  const cats = ["Todos", ...Array.from(new Set(products.filter((p) => p.active).map((p) => p.category)))];
  const setPromo = (k, v) => onUpdateStore({ ...store, promo: { ...store.promo, [k]: v } });
  const move = (idx, dir) => { const a = [...products]; const j = idx + dir; if (j < 0 || j >= a.length) return; [a[idx], a[j]] = [a[j], a[idx]]; onSaveOrder(a); };
  const previewProducts = products.filter((p) => p.active).filter((p) => cat === "Todos" || p.category === cat);
  return (
    <div className="av-anim av-pad">
      <div className="av-shead" style={{ paddingBottom: 8 }}><h3 style={{ fontSize: 16 }}>Así lo ve tu cliente</h3></div>
      <p className="av-hint" style={{ textAlign: "left", marginTop: -4, marginBottom: 8 }}>El carrusel de ofertas ahora se edita en la pestaña <b>Marca</b>.</p>
      <div className="av-chips" style={{ paddingTop: 0 }}>{cats.map((c) => <button key={c} className={"av-chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="av-preview"><div className="av-prevlabel">Vista previa del catálogo</div><div className={"av-prevscroll " + styleClass(store)} style={{ ...shopVars(store), background: store.theme?.bg || undefined }}><PromoBanner store={store} />{previewProducts.length === 0 ? <div className="av-empty" style={{ padding: "40px 20px" }}>Sin productos en esta categoría.</div> : <div className="av-grid" style={{ paddingBottom: 18 }}>{previewProducts.map((p) => <Card key={p.id} p={p} preview onClick={() => {}} />)}</div>}</div></div>
      <div className="av-shead" style={{ paddingBottom: 6 }}><h3 style={{ fontSize: 16 }}>Ordenar, destacar y ofertas</h3></div>
      {products.map((p, idx) => (
        <div key={p.id} className="av-merch">
          <div className="av-move"><button onClick={() => move(idx, -1)} disabled={idx === 0}>▲</button><button onClick={() => move(idx, 1)} disabled={idx === products.length - 1}>▼</button></div>
          <div className="av-linethumb" style={{ ...mediaStyle(p), width: 44, height: 44, fontSize: 20, position: "relative" }}>{isSoldOut(p) && <SoldLayer sm chip={false} />}{!(p.images && p.images.length) && p.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="av-name">{p.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}><span className="av-price" style={{ fontSize: 13 }}>{CLP(p.price)}</span>{p.was && <span className="av-was" style={{ fontSize: 11 }}>{CLP(p.was)}</span>}{isSoldOut(p) && <span className="av-tag off">Agotado</span>}{!p.active && <span className="av-tag off">Oculto</span>}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 7 }}><button className={"av-minitag" + (p.featured ? " on" : "")} onClick={() => onToggle(p.id, "featured")}>Destacado</button><button className={"av-minitag gold" + (p.top ? " on" : "")} onClick={() => onToggle(p.id, "top")}>★ Más vendido</button></div>
            <div className="av-stepchips">{OFFER_OPTS.map((o) => <button key={o} className={"av-stepchip" + ((p.offerPct || 0) === o ? " on" : "")} onClick={() => onSetOffer(p.id, o)}>{o === 0 ? "Sin oferta" : "-" + o + "%"}</button>)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerInventory({ products, onSetStock }) {
  const totalUnits = products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.stock, 0), 0);
  const lowAlerts = products.reduce((s, p) => s + p.variants.filter((v) => v.stock > 0 && v.stock <= 3).length, 0);
  const outAlerts = products.reduce((s, p) => s + p.variants.filter((v) => v.stock === 0).length, 0);
  return (
    <div className="av-anim av-pad">
      <div className="av-invstat"><div className="av-invcard"><div className="n">{totalUnits}</div><div className="l">unidades en stock</div></div><div className="av-invcard"><div className="n" style={{ color: lowAlerts ? "var(--hot)" : "var(--ink)" }}>{lowAlerts}</div><div className="l">stock bajo (≤3)</div></div><div className="av-invcard"><div className="n" style={{ color: outAlerts ? "var(--muted)" : "var(--ink)" }}>{outAlerts}</div><div className="l">agotadas</div></div></div>
      {products.length === 0 && <div className="av-empty">Aún no tienes productos.</div>}
      {products.map((p) => (
        <div key={p.id}>
          <div className="av-prodhdr"><div className="av-linethumb" style={{ ...mediaStyle(p), width: 40, height: 40, fontSize: 18 }}>{!(p.images && p.images.length) && p.emoji}</div><div style={{ flex: 1 }}><div className="av-name">{p.name}</div><div className="av-cat" style={{ marginTop: 2 }}>{p.category}{!p.active && " · oculto"}</div></div></div>
          {p.variants.map((v) => { const color = v.stock === 0 ? "var(--muted)" : v.stock <= 3 ? "var(--hot)" : "var(--ink2)"; return (
            <div key={v.id} className="av-invrow"><span className="av-colordot" style={{ background: v.hex }} /><div style={{ flex: 1, fontSize: 13, color: "var(--ink2)" }}>{v.color}{v.size !== "Única" ? " · " + v.size : ""}<span style={{ display: "block", fontSize: 11, fontWeight: 600, color, marginTop: 2 }}>{v.stock === 0 ? "Agotado" : v.stock <= 3 ? "Stock bajo" : "En stock"}</span></div><button className="av-stbtn" onClick={() => onSetStock(v.id, p.id, v.stock - 1)}>–</button><input className="av-stockin" type="number" value={v.stock} onChange={(e) => onSetStock(v.id, p.id, Number(e.target.value) || 0)} /><button className="av-stbtn" onClick={() => onSetStock(v.id, p.id, v.stock + 1)}>+</button></div>
          ); })}
        </div>
      ))}
    </div>
  );
}

function SwipeRow({ onEdit, onDelete, onTap, children }) {
  const W = 156;
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const moved = useRef(false);
  const down = (e) => { dragging.current = true; moved.current = false; startX.current = e.clientX - dx; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ } };
  const move = (e) => { if (!dragging.current) return; let nx = e.clientX - startX.current; if (Math.abs(nx - dx) > 2) moved.current = true; if (nx > 0) nx = 0; if (nx < -W) nx = -W; setDx(nx); };
  const up = () => { if (!dragging.current) return; dragging.current = false; setDx(dx < -W / 2 ? -W : 0); };
  const close = () => setDx(0);
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 8, background: "var(--surface)" }}>
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: W, display: "flex" }}>
        <button onClick={() => { close(); onEdit(); }} style={{ flex: 1, border: 0, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" }}>Editar</button>
        <button onClick={() => { close(); onDelete(); }} style={{ flex: 1, border: 0, background: "var(--hot)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" }}>Eliminar</button>
      </div>
      <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={() => { if (moved.current) return; if (dx !== 0) { close(); } else if (onTap) { onTap(); } }}
        style={{ transform: `translateX(${dx}px)`, transition: dragging.current ? "none" : "transform .22s ease", touchAction: "pan-y", position: "relative", zIndex: 1, background: "var(--surface)", cursor: onTap ? "pointer" : "default" }}>
        {children}
      </div>
    </div>
  );
}

function SellerProducts({ products, onToggle, onSetSoldOut, onCreate, onDelete, onEdit, onAddColor, onSetStock, storeId }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  if (adding) return <AddProduct onCancel={() => setAdding(false)} onCreate={onCreate} />;
  if (editing) { const live = products.find((p) => p.id === editing.id) || editing; return <EditProduct product={live} storeId={storeId} onCancel={() => setEditing(null)} onSave={onEdit} onSetStock={onSetStock} onAddColor={onAddColor} />; }
  return (
    <div className="av-anim av-pad">
      <button className="av-btn dark av-addbtn" onClick={() => setAdding(true)}>{I.plus()} Agregar producto</button>
      {products.length === 0 && <div className="av-empty">Aún no tienes productos. Toca “Agregar producto”.</div>}
      {products.length > 0 && <p className="av-hint" style={{ textAlign: "left", margin: "0 0 10px" }}>Toca un producto para editarlo, o deslízalo hacia la izquierda para editar o eliminar.</p>}
      {products.map((p) => { const stock = p.variants.reduce((s, v) => s + v.stock, 0); return (
        <SwipeRow key={p.id} onEdit={() => setEditing(p)} onTap={() => setEditing(p)} onDelete={() => { if (window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) onDelete(p.id); }}>
          <div className="av-srow2" style={{ borderBottom: 0 }}><div className="av-linethumb" style={{ ...mediaStyle(p), width: 48, height: 48, fontSize: 21, position: "relative" }}>{isSoldOut(p) && <SoldLayer sm chip={false} />}{!(p.images && p.images.length) && p.emoji}</div><div style={{ flex: 1, minWidth: 0 }}><div className="av-name">{p.name}</div><div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}><span className="av-price" style={{ fontSize: 13 }}>{CLP(p.price)}</span><span className="av-cat">· {stock} stock</span>{isSoldOut(p) && <span className="av-tag off">Agotado</span>}{p.offerPct > 0 && <span className="av-off">-{p.offerPct}%</span>}{p.featured && <span className="av-tag featured">Destacado</span>}{!p.active && <span className="av-tag off">Oculto</span>}</div></div><div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}><button className={"av-toggle" + (p.active ? " on" : "")} onClick={() => onToggle(p.id, "active")}><span className="kn" /></button><button onClick={() => onToggle(p.id, "featured")} style={{ border: 0, background: "none", fontSize: 11, color: p.featured ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontWeight: 600 }}>{p.featured ? "★ Destacado" : "☆ Destacar"}</button></div></div>
        </SwipeRow>
      ); })}
    </div>
  );
}

function ProdMeta({ aud, setAud, cat, setCat }) {
  const toggle = (k) => setAud(aud.includes(k) ? aud.filter((x) => x !== k) : [...aud, k]);
  return (
    <>
      <div className="av-field"><label>¿Para quién es? <span style={{ color: "var(--muted)", fontWeight: 400 }}>(elige uno o varios)</span></label>
        <div className="av-stepchips">{AUDIENCES.map(([k, l]) => <button key={k} className={"av-stepchip" + (aud.includes(k) ? " on" : "")} onClick={() => toggle(k)}>{l}</button>)}</div>
      </div>
      <div className="av-field"><label>Categoría</label>
        <input className="av-input" value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Ej: Calcetines" />
        <div className="av-stepchips" style={{ marginTop: 8 }}>{CAT_PRESETS.map((c) => <button key={c} className={"av-stepchip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}</div>
      </div>
    </>
  );
}

function EditProduct({ product, storeId, onCancel, onSave, onSetStock, onAddColor }) {
  const MAXP = 8;
  const [f, setF] = useState({
    name: product.name || "",
    category: product.category === "General" ? "" : (product.category || ""),
    price: String(product.normalPrice ?? product.price ?? ""),
    emoji: product.emoji || "👕",
    benefits: (product.benefits || []).join("\n"),
    desc: product.desc || "",
    soldOut: !!product.soldOutManual,
  });
  const up = (k, v) => setF({ ...f, [k]: v });
  // fotos: existentes (url) + nuevas (file). Máx. 6, reordenables.
  const [aud, setAud] = useState(product.audience || []);
  const [newColor, setNewColor] = useState({ name: "", hex: "#F5A9C8" });
  const [photos, setPhotos] = useState(() => (product.images || []).map((url) => ({ url, file: null, sold: (product.soldImages || []).includes(url) })));
  const [photoMenu, setPhotoMenu] = useState(null); // { i, x, y } o null
  const onPhotos = (e) => { const fs = [...(e.target.files || [])]; setPhotos((ps) => [...ps, ...fs.map((file) => ({ url: URL.createObjectURL(file), file, sold: false }))].slice(0, MAXP)); e.target.value = ""; };
  const delPhoto = (i) => setPhotos((ps) => ps.filter((_, x) => x !== i));
  const setPhotoSold = (i, sold) => setPhotos((ps) => ps.map((p, x) => (x === i ? { ...p, sold } : p)));
  const movePhoto = (i, dir) => setPhotos((ps) => { const j = i + dir; if (j < 0 || j >= ps.length) return ps; const a = [...ps]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  // copia editable del stock por variante
  const [stocks, setStocks] = useState(() => Object.fromEntries(product.variants.map((v) => [v.id, v.stock])));
  const setStk = (id, val) => setStocks((s) => ({ ...s, [id]: Math.max(0, Number(val) || 0) }));
  const [saving, setSaving] = useState(false);
  const valid = f.name.trim() && f.price && !saving;
  const addColor = async () => {
    const name = newColor.name.trim();
    if (!name) return;
    if (product.variants.some((v) => (v.color || "").toLowerCase() === name.toLowerCase())) { alert("Ese color ya existe en el producto."); return; }
    const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
    const rows = (sizes.length ? sizes : ["Única"]).map((size) => ({ color: name, hex: newColor.hex, size, stock: 0 }));
    try { await onAddColor(product.id, rows); setNewColor({ name: "", hex: "#F5A9C8" }); }
    catch (e) { alert(e.message); }
  };
  const save = async () => {
    setSaving(true);
    try {
      const newFiles = photos.filter((p) => p.file).map((p) => p.file);
      let uploaded = [];
      if (newFiles.length) uploaded = await uploadProductImages(storeId, newFiles);
      let ui = 0;
      const finalImages = photos.map((p) => (p.file ? uploaded[ui++] : p.url));
      const soldImages = finalImages.filter((_, i) => photos[i].sold);
      await onSave(product.id, {
        name: f.name.trim(),
        category: f.category.trim() || "General",
        audience: aud,
        emoji: f.emoji,
        description: f.desc,
        benefits: f.benefits.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3),
        sold_out_manual: f.soldOut,
        normal_price: Number(f.price),
        images: finalImages,
        sold_images: soldImages,
      });
      // aplica los cambios de stock que hayan variado
      product.variants.forEach((v) => { if (stocks[v.id] !== v.stock && onSetStock) onSetStock(v.id, product.id, stocks[v.id]); });
      onCancel();
    } catch (e) { alert(e.message); setSaving(false); }
  };
  return (
    <div className="av-anim av-pad" style={{ paddingTop: 14 }}>
      <div className="av-pagehead" style={{ paddingTop: 0 }}><button className="av-back" style={{ position: "static" }} onClick={onCancel}>{I.back()}</button><span className="av-pagetitle">Editar producto</span></div>
      <div className="av-field"><label>Fotos del producto (máx. 8)</label>
        <p className="av-hint" style={{ textAlign: "left", margin: "0 0 8px" }}>Toca una foto para marcarla <b>Disponible</b> o <b>No disponible</b>. Las no disponibles no se muestran en la tienda.</p>
        <div className="av-photos">
          {photos.map((im, i) => (
            <div key={i} className="av-photowrap">
              <img src={im.url} className={"av-photo" + (im.sold ? " soldph" : "")} alt={(im.sold ? "no disponible · " : "") + "foto " + (i + 1)} style={{ cursor: "pointer" }} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPhotoMenu(photoMenu && photoMenu.i === i ? null : { i, x: Math.min(r.left, window.innerWidth - 184), y: r.bottom + 6 }); }} />
              {im.sold && <span className="av-photoout">No disp.</span>}
              {i === 0 && !im.sold && <span className="av-photomain">Principal</span>}
              <button className="av-photodel" onClick={() => delPhoto(i)}>×</button>
              <div className="av-photomove"><button disabled={i === 0} onClick={() => movePhoto(i, -1)}>‹</button><button disabled={i === photos.length - 1} onClick={() => movePhoto(i, 1)}>›</button></div>
            </div>
          ))}
          {photos.length < MAXP && <label className="av-photoadd">{I.plus({ width: 22, height: 22 })}<input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotos} /></label>}
        </div>
        <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>La primera foto es la principal. Usa ‹ › para reordenar y × para borrar. Si no dejas ninguna, se usa el ícono de respaldo.</p>
      </div>
      {photoMenu && photos[photoMenu.i] && (<>
        <div onClick={() => setPhotoMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
        <div className="av-availmenu" style={{ position: "fixed", left: photoMenu.x, top: photoMenu.y, zIndex: 61 }} onClick={(e) => e.stopPropagation()}>
          <button className={!photos[photoMenu.i].sold ? "on" : ""} onClick={() => { setPhotoSold(photoMenu.i, false); setPhotoMenu(null); }}><span className="dot ok" />Disponible</button>
          <button className={photos[photoMenu.i].sold ? "on" : ""} onClick={() => { setPhotoSold(photoMenu.i, true); setPhotoMenu(null); }}><span className="dot off" />No disponible</button>
        </div>
      </>)}
      <div className="av-field"><label>Ícono de respaldo</label><div className="av-emojirow">{EMOJIS.map((e) => <button key={e} className={"av-emojibtn" + (f.emoji === e ? " on" : "")} onClick={() => up("emoji", e)}>{e}</button>)}</div></div>
      <div className="av-field"><label>Nombre *</label><input className="av-input" value={f.name} onChange={(e) => up("name", e.target.value)} placeholder="Ej: Camiseta Bamboo" /></div>
      <ProdMeta aud={aud} setAud={setAud} cat={f.category} setCat={(v) => up("category", v)} />
      <div className="av-field"><label>Precio (CLP) *</label><input className="av-input" type="number" value={f.price} onChange={(e) => up("price", e.target.value)} placeholder="14990" /></div>
      <div className="av-field"><label>Cantidad por color y talla</label>
        {product.variants.map((v) => (
          <div key={v.id} className="av-invrow" style={{ borderBottom: 0 }}><span className="av-colordot" style={{ background: v.hex }} /><div style={{ flex: 1, fontSize: 13, color: "var(--ink2)" }}>{v.color}{v.size !== "Única" ? " · " + v.size : ""}</div><button className="av-stbtn" onClick={() => setStk(v.id, (stocks[v.id] || 0) - 1)}>–</button><input className="av-stockin" type="number" min="0" value={stocks[v.id] ?? 0} onChange={(e) => setStk(v.id, e.target.value)} /><button className="av-stbtn" onClick={() => setStk(v.id, (stocks[v.id] || 0) + 1)}>+</button></div>
        ))}
        <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Cada cambio de cantidad queda registrado en el historial de stock.</p>
      </div>
      <div className="av-field" style={{ paddingTop: 0 }}><label>Agregar un color nuevo</label>
        <div className="av-coloradd">
          <input className="av-colorpick" type="color" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} title="Elegir color" />
          <input className="av-input" style={{ flex: 1, minWidth: 120 }} placeholder="Nombre del color" value={newColor.name} onChange={(e) => setNewColor({ ...newColor, name: e.target.value })} />
          <button className="av-btn dark" style={{ flex: "none", padding: "11px 16px" }} disabled={!newColor.name.trim()} onClick={addColor}>Añadir</button>
        </div>
        <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Se agrega en todas las tallas del producto (con stock 0; ajústalo arriba). Se guarda al instante.</p>
      </div>
      <div className="av-field"><label>Beneficios (uno por línea, máx. 3)</label><textarea className="av-input" rows={3} value={f.benefits} onChange={(e) => up("benefits", e.target.value)} style={{ resize: "none", fontFamily: "inherit" }} /></div>
      <div className="av-field"><label>Descripción</label><textarea className="av-input" rows={3} value={f.desc} onChange={(e) => up("desc", e.target.value)} placeholder="Describe el producto…" style={{ resize: "none", fontFamily: "inherit" }} /></div>
      <div className="av-srow2" style={{ borderTop: "1px solid var(--line)", borderBottom: 0, marginTop: 4 }}>
        <div style={{ flex: 1 }}><div className="av-name">Marcar como agotado</div><div className="av-cat" style={{ marginTop: 2 }}>{f.soldOut ? "Se muestra agotado aunque tengas stock" : "Se agota solo cuando el stock llega a 0"}</div></div>
        <button className={"av-toggle" + (f.soldOut ? " on" : "")} onClick={() => up("soldOut", !f.soldOut)}><span className="kn" /></button>
      </div>
      <div className="av-bottombar"><button className="av-btn ghost" style={{ flex: "none", padding: "15px 18px" }} onClick={onCancel}>Cancelar</button><button className="av-btn primary" disabled={!valid} onClick={save}>{saving ? "Guardando…" : "Guardar cambios"}</button></div>
    </div>
  );
}

function AddProduct({ onCancel, onCreate }) {
  const MAXP = 8;
  const [f, setF] = useState({ name: "", category: "", price: "", desc: "", emoji: "👕", benefits: "" });
  const up = (k, v) => setF({ ...f, [k]: v });
  const [images, setImages] = useState([]); // {url, file}
  const [aud, setAud] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [baseStock, setBaseStock] = useState("");
  const [pickHex, setPickHex] = useState("#F5A9C8");
  const [pickName, setPickName] = useState("");
  const [newSize, setNewSize] = useState("");
  const [saving, setSaving] = useState(false);

  const onPhotos = (e) => { const fs = [...(e.target.files || [])]; setImages((im) => [...im, ...fs.map((file) => ({ url: URL.createObjectURL(file), file }))].slice(0, MAXP)); e.target.value = ""; };
  const delPhoto = (i) => setImages((im) => im.filter((_, x) => x !== i));
  const movePhoto = (i, dir) => setImages((im) => { const j = i + dir; if (j < 0 || j >= im.length) return im; const a = [...im]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const addColor = (c) => { if (colors.some((x) => x.name.toLowerCase() === c.name.toLowerCase())) return; setColors((cs) => [...cs, c]); };
  const addCustomColor = () => { addColor({ name: pickName.trim() || `Color ${colors.length + 1}`, hex: pickHex }); setPickName(""); };
  const delColor = (name) => setColors((cs) => cs.filter((x) => x.name !== name));
  const addSize = (s) => { const v = (s || "").trim(); if (!v || sizes.includes(v)) return; setSizes((ss) => [...ss, v]); };
  const delSize = (s) => setSizes((ss) => ss.filter((x) => x !== s));
  const setCell = (key, val) => setMatrix((m) => ({ ...m, [key]: Math.max(0, Number(val) || 0) }));

  const cs = colors.length ? colors : [{ name: "Único", hex: "#6B6B78" }];
  const ss = sizes.length ? sizes : ["Única"];
  const hasVariants = colors.length > 0 || sizes.length > 0;
  const variantStock = hasVariants ? cs.reduce((s, c) => s + ss.reduce((a, sz) => a + (Number(matrix[c.name + "||" + sz]) || 0), 0), 0) : Number(baseStock) || 0;
  const valid = f.name && f.price && variantStock > 0 && !saving;

  const save = async () => {
    setSaving(true);
    try {
      let variants = [];
      if (hasVariants) cs.forEach((c) => ss.forEach((sz) => { const st = Number(matrix[c.name + "||" + sz]) || 0; if (st > 0) variants.push({ color: c.name, hex: c.hex, size: sz, stock: st }); }));
      else variants = [{ color: "Único", hex: "#6B6B78", size: "Única", stock: Number(baseStock) || 0 }];
      const data = { name: f.name, category: f.category || "General", audience: aud, emoji: f.emoji, desc: f.desc, benefits: f.benefits.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3), normalPrice: Number(f.price), offerPct: 0, active: true, featured: false, top: false };
      await onCreate(data, variants, images.map((i) => i.file));
      onCancel();
    } catch (e) { alert(e.message); setSaving(false); }
  };

  return (
    <div className="av-anim av-pad" style={{ paddingTop: 14 }}>
      <div className="av-pagehead" style={{ paddingTop: 0 }}><button className="av-back" style={{ position: "static" }} onClick={onCancel}>{I.back()}</button><span className="av-pagetitle">Nuevo producto</span></div>
      <div className="av-field"><label>Fotos del producto (máx. 8)</label>
        <div className="av-photos">
          {images.map((im, i) => (
            <div key={i} className="av-photowrap">
              <img src={im.url} className="av-photo" alt={"foto " + (i + 1)} />
              {i === 0 && <span className="av-photomain">Principal</span>}
              <button className="av-photodel" onClick={() => delPhoto(i)}>×</button>
              <div className="av-photomove"><button disabled={i === 0} onClick={() => movePhoto(i, -1)}>‹</button><button disabled={i === images.length - 1} onClick={() => movePhoto(i, 1)}>›</button></div>
            </div>
          ))}
          {images.length < MAXP && <label className="av-photoadd">{I.plus({ width: 22, height: 22 })}<input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotos} /></label>}
        </div>
        <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>La primera foto es la principal. Usa ‹ › para reordenar y × para borrar. Si no subes ninguna, se usa el ícono de respaldo.</p>
      </div>
      <div className="av-field"><label>Ícono de respaldo</label><div className="av-emojirow">{EMOJIS.map((e) => <button key={e} className={"av-emojibtn" + (f.emoji === e ? " on" : "")} onClick={() => up("emoji", e)}>{e}</button>)}</div></div>
      <div className="av-field"><label>Nombre *</label><input className="av-input" value={f.name} onChange={(e) => up("name", e.target.value)} placeholder="Ej: Camiseta Bamboo" /></div>
      <ProdMeta aud={aud} setAud={setAud} cat={f.category} setCat={(v) => up("category", v)} />
      <div className="av-field"><label>Precio (CLP) *</label><input className="av-input" type="number" value={f.price} onChange={(e) => up("price", e.target.value)} placeholder="14990" /></div>
      <div className="av-field"><label>Colores <span style={{ color: "var(--muted)", fontWeight: 400 }}>(opcional)</span></label>{colors.length > 0 && <div className="av-colorchips" style={{ marginBottom: 4 }}>{colors.map((c) => (<span key={c.name} className="av-colorchip"><span className="av-colordot" style={{ background: c.hex }} />{c.name}<button className="av-colordel" onClick={() => delColor(c.name)}>×</button></span>))}</div>}<div className="av-presets">{COLOR_PRESETS.map((c) => <span key={c.name} className="av-presetdot" style={{ background: c.hex }} title={c.name} onClick={() => addColor(c)} />)}</div><div className="av-coloradd"><input className="av-colorpick" type="color" value={pickHex} onChange={(e) => setPickHex(e.target.value)} title="Rueda cromática" /><input className="av-input" style={{ flex: 1, minWidth: 120 }} placeholder="Nombre del color" value={pickName} onChange={(e) => setPickName(e.target.value)} /><button className="av-btn dark" style={{ flex: "none", padding: "11px 16px" }} onClick={addCustomColor}>Añadir</button></div><p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Déjalo vacío si el producto no tiene color (ej: electrónica, libros).</p></div>
      <div className="av-field"><label>Tallas <span style={{ color: "var(--muted)", fontWeight: 400 }}>(opcional)</span></label>{sizes.length > 0 && <div className="av-colorchips" style={{ marginBottom: 4 }}>{sizes.map((s) => (<span key={s} className="av-colorchip">{s}<button className="av-colordel" onClick={() => delSize(s)}>×</button></span>))}</div>}<div className="av-sizeadd">{SIZE_PRESETS.map((s) => <button key={s} className="av-stepchip" onClick={() => addSize(s)}>+ {s}</button>)}</div><div className="av-coloradd"><input className="av-input" style={{ flex: 1 }} placeholder="Talla personalizada" value={newSize} onChange={(e) => setNewSize(e.target.value)} /><button className="av-btn dark" style={{ flex: "none", padding: "11px 16px" }} onClick={() => { addSize(newSize); setNewSize(""); }}>Añadir</button></div><p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Déjalo vacío si el producto no tiene talla (ej: bufandas, accesorios).</p></div>
      {hasVariants ? (
        <div className="av-field"><label>Stock por color y talla</label><div className="av-matrix"><table className="av-mtable"><thead><tr><th></th>{ss.map((s) => <th key={s}>{s}</th>)}</tr></thead><tbody>{cs.map((c) => (<tr key={c.name}><td><span className="av-mcolor"><span className="av-colordot" style={{ background: c.hex }} />{c.name}</span></td>{ss.map((s) => { const key = c.name + "||" + s; return (<td key={s}><input className="av-mcell" type="number" min="0" value={matrix[key] ?? ""} placeholder="0" onChange={(e) => setCell(key, e.target.value)} /></td>); })}</tr>))}</tbody></table></div><p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Escribe la cantidad en cada celda. Solo se guardan las combinaciones con stock mayor a 0.</p></div>
      ) : (
        <div className="av-field"><label>Stock total *</label><input className="av-input" type="number" value={baseStock} onChange={(e) => setBaseStock(e.target.value)} placeholder="10" /><p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Agrega colores y/o tallas para gestionar stock por variante.</p></div>
      )}
      <div className="av-field"><label>Beneficios (uno por línea, máx. 3)</label><textarea className="av-input" rows={3} value={f.benefits} onChange={(e) => up("benefits", e.target.value)} placeholder={"Tela de bambú suave\nNo destiñe\nIdeal para clima cálido"} style={{ resize: "none", fontFamily: "inherit" }} /></div>
      <div className="av-field"><label>Descripción</label><textarea className="av-input" rows={3} value={f.desc} onChange={(e) => up("desc", e.target.value)} placeholder="Describe el producto…" style={{ resize: "none", fontFamily: "inherit" }} /></div>
      <div className="av-bottombar"><button className="av-btn ghost" style={{ flex: "none", padding: "15px 18px" }} onClick={onCancel}>Cancelar</button><button className="av-btn primary" disabled={!valid} onClick={save}>{saving ? "Guardando…" : valid ? "Guardar producto" : "Falta nombre, precio o stock"}</button></div>
    </div>
  );
}

function ordersToCSV(orders) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Código", "Fecha", "Cliente", "Teléfono", "Método", "Estado", "Total", "Productos"];
  const lines = orders.map((o) => [
    o.id, o.date, o.buyer.name, o.buyer.phone,
    o.method === "efectivo" ? "Efectivo" : "Transferencia",
    o.status, o.total,
    o.items.map((i) => `${i.name}${i.size !== "Única" ? " " + i.size : ""} (${i.color}) x${i.qty}`).join(" | "),
  ].map(esc).join(";"));
  return "\uFEFF" + [head.map(esc).join(";"), ...lines].join("\r\n");
}

function downloadOrders(orders) {
  const blob = new Blob([ordersToCSV(orders)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function stockLogToCSV(log) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Fecha y hora", "Producto", "Color", "Talla", "Stock nuevo"];
  const lines = (log || []).map((r) => [
    new Date(r.created_at).toLocaleString("es-CL"),
    r.product_name, r.color, r.size, r.new_stock,
  ].map(esc).join(";"));
  return "\uFEFF" + [head.map(esc).join(";"), ...lines].join("\r\n");
}

function downloadCSV(text, nombre) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function OrderCard({ o, onSetStatus }) {
  const sc = STATUS_COLOR[o.status] || STATUS_COLOR["Pago en revisión"];
  return (
    <div className="av-orderc" style={{ margin: 0 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontFamily: "Space Grotesk", fontWeight: 700 }}>{o.id}</div><span className="av-status" style={{ background: sc.bg, color: sc.c }}>{o.status}</span></div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{o.date} · {o.buyer.name} · {o.buyer.phone}</div><div style={{ marginTop: 6 }}><span className="av-tag" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: o.method === "efectivo" ? "#E9F7EF" : "var(--accent-soft)", color: o.method === "efectivo" ? "#15803D" : "var(--accent)" }}>{o.method === "efectivo" ? I.cash({ width: 14, height: 14 }) : I.bank({ width: 14, height: 14 })}{o.method === "efectivo" ? "Efectivo" : "Transferencia"}</span></div><div style={{ margin: "10px 0", display: "flex", flexDirection: "column", gap: 4 }}>{o.items.map((i) => <div key={i.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--ink2)" }}>{i.name} {i.size !== "Única" ? "· " + i.size : ""} ({i.color}) ×{i.qty}</span><span style={{ fontWeight: 600 }}>{CLP(i.price * i.qty)}</span></div>)}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 10 }}><span style={{ fontSize: 12, color: "var(--muted)" }}>{o.method === "efectivo" ? "Total a cobrar" : "Comprobante"}</span><span className="av-price" style={{ fontSize: 15 }}>{CLP(o.total)}</span></div>{o.comprobante?.url && <a href={o.comprobante.url} target="_blank" rel="noreferrer"><img src={o.comprobante.url} alt="comprobante" style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 180, objectFit: "cover" }} /></a>}<select className="av-select" value={o.status} onChange={(e) => onSetStatus(o.dbId, e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
  );
}

function EditOrder({ order, onCancel, onSave }) {
  const [f, setF] = useState({ name: order.buyer.name || "", phone: order.buyer.phone || "", total: String(order.total ?? ""), method: order.method || "transferencia", status: order.status });
  const up = (k, v) => setF({ ...f, [k]: v });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await onSave(order.dbId, { buyer_name: f.name.trim(), buyer_phone: f.phone.trim(), total: Number(f.total) || 0, payment_method: f.method, status: f.status });
      onCancel();
    } catch (e) { alert(e.message); setSaving(false); }
  };
  return (
    <div className="av-anim av-pad" style={{ paddingTop: 14 }}>
      <div className="av-pagehead" style={{ paddingTop: 0 }}><button className="av-back" style={{ position: "static" }} onClick={onCancel}>{I.back()}</button><span className="av-pagetitle">Editar pedido {order.id}</span></div>
      <div className="av-field"><label>Cliente</label><input className="av-input" value={f.name} onChange={(e) => up("name", e.target.value)} /></div>
      <div className="av-field"><label>WhatsApp del cliente</label><input className="av-input" value={f.phone} onChange={(e) => up("phone", e.target.value)} /></div>
      <div className="av-field"><label>Total (CLP)</label><input className="av-input" type="number" value={f.total} onChange={(e) => up("total", e.target.value)} /></div>
      <div className="av-field"><label>Método de pago</label><select className="av-input" value={f.method} onChange={(e) => up("method", e.target.value)}><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option></select></div>
      <div className="av-field"><label>Estado</label><select className="av-input" value={f.status} onChange={(e) => up("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      <p className="av-hint" style={{ textAlign: "left" }}>Los productos del pedido no se editan aquí (puedes cambiar el total a mano si hace falta).</p>
      <div className="av-bottombar"><button className="av-btn ghost" style={{ flex: "none", padding: "15px 18px" }} onClick={onCancel}>Cancelar</button><button className="av-btn primary" disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar cambios"}</button></div>
    </div>
  );
}

function SellerOrders({ orders, onSetStatus, stockLog, onEditOrder, onDeleteOrder }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [editing, setEditing] = useState(null);
  const groups = useMemo(() => {
    const m = new Map();
    for (const o of orders) {
      const d = new Date(o.createdAt || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(o);
    }
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [orders]);
  const [open, setOpen] = useState(() => new Set());
  useEffect(() => { setOpen((s) => (s.size === 0 && groups[0] ? new Set([groups[0][0]]) : s)); }, [groups]);
  const toggle = (key) => setOpen((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const monthLabel = (key) => { const [y, mo] = key.split("-"); const d = new Date(Number(y), Number(mo) - 1, 1); const t = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" }); return t.charAt(0).toUpperCase() + t.slice(1); };

  if (editing) return <EditOrder order={editing} onCancel={() => setEditing(null)} onSave={onEditOrder} />;

  return (
    <div className="av-anim av-pad" style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button className="av-btn dark" style={{ flex: "none", padding: "11px 14px" }} onClick={() => downloadCSV(ordersToCSV(orders), `pedidos-${hoy}.csv`)}>{I.up({ width: 16, height: 16 })} Pedidos (Excel)</button>
        <button className="av-btn dark" style={{ flex: "none", padding: "11px 14px" }} onClick={() => downloadCSV(stockLogToCSV(stockLog), `historial-stock-${hoy}.csv`)}>{I.up({ width: 16, height: 16 })} Historial de stock</button>
      </div>
      {orders.length === 0 && <div className="av-empty" style={{ paddingTop: 40 }}>{I.bag({ width: 32, height: 32 })}<div>Aún no hay pedidos.</div><div style={{ fontSize: 12 }}>Haz una compra desde la tienda y aparecerá aquí.</div></div>}
      {orders.length > 0 && <p className="av-hint" style={{ textAlign: "left", margin: "0 0 10px" }}>Toca un mes para desplegarlo. Desliza un pedido a la izquierda para editar o eliminar.</p>}
      {groups.map(([key, list]) => {
        const isOpen = open.has(key);
        const total = list.reduce((s, o) => s + (o.total || 0), 0);
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <button className="av-acc" onClick={() => toggle(key)}>
              <div style={{ textAlign: "left" }}><div className="av-accmon">{monthLabel(key)}</div><div className="av-acccount">{list.length} pedido{list.length !== 1 ? "s" : ""} · {CLP(total)}</div></div>
              <span className={"av-accarrow" + (isOpen ? " open" : "")}>▾</span>
            </button>
            {isOpen && <div style={{ marginTop: 8 }}>{list.map((o) => (
              <SwipeRow key={o.dbId} onEdit={() => setEditing(o)} onDelete={() => { if (window.confirm(`¿Eliminar el pedido ${o.id}? Esta acción no se puede deshacer.`)) onDeleteOrder(o.dbId); }}>
                <OrderCard o={o} onSetStatus={onSetStatus} />
              </SwipeRow>
            ))}</div>}
          </div>
        );
      })}
    </div>
  );
}

function BrandSection({ id, title, openSet, setOpenSet, children }) {
  const open = openSet.has(id);
  const toggle = () => setOpenSet((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div style={{ marginBottom: 10 }}>
      <button className="av-acc" onClick={toggle}><div style={{ textAlign: "left" }}><div className="av-accmon">{title}</div></div><span className={"av-accarrow" + (open ? " open" : "")}>▾</span></button>
      {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

function SellerBrand({ store, onUpdateStore, onUploadLogo }) {
  const [busy, setBusy] = useState(false);
  const [openSet, setOpenSet] = useState(() => new Set(["nombre"]));
  const up = (k, v) => onUpdateStore({ ...store, [k]: v });
  const t = store.theme || {};
  const upT = (k, v) => onUpdateStore({ ...store, theme: { ...t, [k]: v } });
  const slides = (store.slides && store.slides.length) ? store.slides : [{ eyebrow: store.promo.eyebrow, title: store.promo.title, sub: store.promo.sub }];
  const hc = headerCfg(store);
  const upH = (k, v) => onUpdateStore({ ...store, theme: { ...t, header: { ...(t.header || {}), [k]: v } } });
  const setSlides = (arr) => onUpdateStore({ ...store, slides: arr });
  const upSlide = (idx, k, v) => setSlides(slides.map((s, i) => (i === idx ? { ...s, [k]: v } : s)));
  const addSlide = () => setSlides([...slides, { eyebrow: "Novedad", title: "Nuevo banner", sub: "" }]);
  const delSlide = (idx) => setSlides(slides.filter((_, i) => i !== idx));
  const LOGO_GRADS = [["#3B2BFF", "#7A4DFF"], ["#F0392B", "#FF7A59"], ["#15A34A", "#7AD67A"], ["#FFB400", "#FF7A00"], ["#1C1C22", "#43434F"], ["#0EA5E9", "#6366F1"]];
  const LOGO_EMOJIS = ["🛍️", "🎮", "📦", "👕", "🧢", "👟", "🎧", "💄", "🍰", "🌿"];
  const onLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try { await onUploadLogo(file); } catch (err) { alert(err.message); }
    finally { setBusy(false); e.target.value = ""; }
  };
  return (
    <div className="av-anim av-pad" style={{ paddingTop: 14 }}>
      <p className="av-hint" style={{ textAlign: "left", margin: "0 0 12px" }}>Toca cada sección para desplegarla.</p>

      <BrandSection id="nombre" title="Nombre y logo" openSet={openSet} setOpenSet={setOpenSet}>
        <div className="av-field"><label>Nombre de la tienda</label><input className="av-input" value={store.name} onChange={(e) => up("name", e.target.value)} placeholder="Ej: GamerStock CL" /></div>
        <div className="av-field"><label>Logo de la tienda</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <StoreLogo store={store} size={64} radius={18} fontSize={30} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="av-btn dark" style={{ flex: "none", padding: "11px 16px", cursor: "pointer" }}>{busy ? "Subiendo…" : store.logoUrl ? "Cambiar imagen" : "Subir imagen"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={onLogo} /></label>
              {store.logoUrl && <button className="av-btn ghost" style={{ flex: "none", padding: "9px 16px" }} onClick={() => up("logoUrl", null)}>Quitar imagen</button>}
            </div>
          </div>
          <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Usa una imagen cuadrada (PNG o JPG). Si no subes ninguna, se usa el color e ícono de abajo.</p>
        </div>
        {!store.logoUrl && (<>
          <div className="av-field"><label>Color del logo</label><div className="av-presets">{LOGO_GRADS.map(([a, b]) => <span key={a} className={"av-presetdot" + (store.logoA === a ? " " : "")} style={{ ...grad(a, b), boxShadow: store.logoA === a ? "0 0 0 2px var(--accent)" : undefined }} onClick={() => onUpdateStore({ ...store, logoA: a, logoB: b })} />)}</div></div>
          <div className="av-field"><label>Ícono del logo</label><div className="av-emojirow">{LOGO_EMOJIS.map((e) => <button key={e} className={"av-emojibtn" + (store.emoji === e ? " on" : "")} onClick={() => up("emoji", e)}>{e}</button>)}</div></div>
        </>)}
      </BrandSection>

      <BrandSection id="encabezado" title="Encabezado (logo y título)" openSet={openSet} setOpenSet={setOpenSet}>
        <div className="av-themebox">
          <div className="av-themerow"><span>Tamaño del logo</span><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="range" min="28" max="80" step="2" value={hc.logoSize} onChange={(e) => upH("logoSize", Number(e.target.value))} /><span style={{ width: 38, textAlign: "right", fontSize: 12, color: "var(--ink2)" }}>{hc.logoSize}px</span></div></div>
          <div className="av-themerow"><span>Tamaño del título</span><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="range" min="13" max="34" step="1" value={hc.titleSize} onChange={(e) => upH("titleSize", Number(e.target.value))} /><span style={{ width: 38, textAlign: "right", fontSize: 12, color: "var(--ink2)" }}>{hc.titleSize}px</span></div></div>
          <div className="av-themerow"><span>Color del título</span><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{hc.titleColor && <button className="av-btn ghost" style={{ flex: "none", padding: "5px 9px", fontSize: 11 }} onClick={() => upH("titleColor", null)}>Auto</button>}<input type="color" className="av-colorpick" value={hc.titleColor || "#14141B"} onChange={(e) => upH("titleColor", e.target.value)} /></div></div>
          <div className="av-themerow" style={{ borderBottom: 0 }}><span>Posición</span><div style={{ display: "flex", gap: 6 }}>{[["left", "Izquierda"], ["center", "Centrado"]].map(([v, l]) => <button key={v} className={"av-stylecard" + (hc.align === v ? " on" : "")} style={{ padding: "6px 12px" }} onClick={() => upH("align", v)}><span className="av-stylename" style={{ fontSize: 12 }}>{l}</span></button>)}</div></div>
        </div>
        <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Cambia cómo se ve el logo y el nombre arriba, en la tienda y en el panel.</p>
      </BrandSection>

      <BrandSection id="apariencia" title="Apariencia de la tienda" openSet={openSet} setOpenSet={setOpenSet}>
        <div className="av-field"><label>Estilo de la tienda y el panel</label>
          <div className="av-stylegrid">
            {[["clasico", "Clásico", "Limpio y blanco"], ["glass", "Vidrio (iOS)", "Translúcido claro"], ["glassdark", "Vidrio oscuro", "Translúcido oscuro"], ["minimal", "Minimal", "Plano y elegante"]].map(([v, l, d]) => {
              const cur = (t.style && t.style !== "clasico") ? t.style : (t.glass ? "glass" : "clasico");
              return <button key={v} className={"av-stylecard" + (cur === v ? " on" : "")} onClick={() => onUpdateStore({ ...store, theme: { ...t, style: v, glass: v === "glass" } })}><span className="av-stylename">{l}</span><span className="av-styledesc">{d}</span></button>;
            })}
          </div>
        </div>
        <div className="av-field"><label>Color de fondo de la tienda</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="color" className="av-colorpick" value={t.bg || "#FFFFFF"} onChange={(e) => upT("bg", e.target.value)} />
            <span style={{ fontSize: 13, color: "var(--ink2)", fontFamily: "'Space Grotesk',sans-serif" }}>{(t.bg || "#FFFFFF").toUpperCase()}</span>
            <button className="av-btn ghost" style={{ flex: "none", marginLeft: "auto", padding: "7px 12px", fontSize: 12 }} onClick={() => upT("bg", "#FFFFFF")}>Restablecer</button>
          </div>
        </div>
        <div className="av-field"><label>Color de letra</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="color" className="av-colorpick" value={t.ink || "#000000"} onChange={(e) => upT("ink", e.target.value)} />
            <span style={{ fontSize: 13, color: "var(--ink2)", fontFamily: "'Space Grotesk',sans-serif" }}>{t.ink ? t.ink.toUpperCase() : "Automático"}</span>
            <button className="av-btn ghost" style={{ flex: "none", marginLeft: "auto", padding: "7px 12px", fontSize: 12 }} onClick={() => upT("ink", null)}>Por defecto</button>
          </div>
          <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Recomendado: <b>negro</b> (#000000) para máxima legibilidad, sobre todo con el estilo vidrio. “Por defecto” vuelve al gris original.</p>
        </div>
        <div className="av-field"><label>Borde de las tarjetas de producto</label>
          <div className="av-themebox">
            <div className="av-themerow"><span>Color del borde</span><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, color: "var(--muted)" }}>{(t.cardBorderColor || "#ECECF2").toUpperCase()}</span><input type="color" className="av-colorpick" value={t.cardBorderColor || "#ECECF2"} onChange={(e) => upT("cardBorderColor", e.target.value)} /></div></div>
            <div className="av-themerow"><span>Grosor del borde</span><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="range" min="0" max="6" step="1" value={t.cardBorderWidth ?? 1} onChange={(e) => upT("cardBorderWidth", Number(e.target.value))} /><span style={{ width: 34, textAlign: "right", fontSize: 12, color: "var(--ink2)" }}>{t.cardBorderWidth ?? 1}px</span></div></div>
            <div className="av-themerow"><span>Redondeo de esquinas</span><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="range" min="0" max="32" step="1" value={t.cardRadius ?? 18} onChange={(e) => upT("cardRadius", Number(e.target.value))} /><span style={{ width: 34, textAlign: "right", fontSize: 12, color: "var(--ink2)" }}>{t.cardRadius ?? 18}px</span></div></div>
            <div className="av-themerow" style={{ borderBottom: 0 }}><span>Sombra</span><button className={"av-toggle" + ((t.cardShadow ?? true) ? " on" : "")} onClick={() => upT("cardShadow", !(t.cardShadow ?? true))}><span className="kn" /></button></div>
          </div>
        </div>
      </BrandSection>

      <BrandSection id="carrusel" title="Carrusel de ofertas" openSet={openSet} setOpenSet={setOpenSet}>
        <p className="av-hint" style={{ textAlign: "left", marginBottom: 12 }}>Banners que rotan en la portada de tu tienda. Agrega varios para que vayan cambiando solos.</p>
        {slides.map((sl, i) => (
          <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="av-promo" style={{ ...grad(sl.a || store.logoA, sl.b || store.logoB), margin: 0, padding: 12, borderRadius: 12, minWidth: 0, flex: 1 }}><div style={{ position: "relative" }}><div className="eyebrow" style={{ fontSize: 9 }}>{sl.eyebrow || " "}</div><div className="big" style={{ fontSize: 15 }}>{sl.title || " "}</div></div></div>
              {slides.length > 1 && <button className="av-btn ghost" style={{ flex: "none", marginLeft: 8, padding: "8px 12px", fontSize: 12 }} onClick={() => delSlide(i)}>Quitar</button>}
            </div>
            <div className="av-field" style={{ paddingBottom: 8 }}><label>Texto pequeño</label><input className="av-input" value={sl.eyebrow || ""} onChange={(e) => upSlide(i, "eyebrow", e.target.value)} placeholder="OFERTAS" /></div>
            <div className="av-field" style={{ paddingBottom: 8 }}><label>Título</label><input className="av-input" value={sl.title || ""} onChange={(e) => upSlide(i, "title", e.target.value)} placeholder="Bienvenido" /></div>
            <div className="av-field" style={{ paddingBottom: 8 }}><label>Subtítulo (opcional)</label><input className="av-input" value={sl.sub || ""} onChange={(e) => upSlide(i, "sub", e.target.value)} placeholder="Hasta 30% de descuento" /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 12, color: "var(--muted)" }}>Colores:</span><input type="color" className="av-colorpick" value={sl.a || store.logoA} onChange={(e) => upSlide(i, "a", e.target.value)} /><input type="color" className="av-colorpick" value={sl.b || store.logoB} onChange={(e) => upSlide(i, "b", e.target.value)} /></div>
          </div>
        ))}
        <button className="av-btn dark block" onClick={addSlide}>{I.plus()} Agregar banner</button>
      </BrandSection>
    </div>
  );
}

function SellerNotify({ store }) {
  const [phone, setPhone] = useState("");
  const [apikey, setApikey] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    (async () => {
      try { const n = await getStoreNotify(store.id); setPhone(n.phone || ""); setApikey(n.apikey || ""); setMensaje(n.template || ""); } catch { /* noop */ }
      finally { setLoaded(true); }
    })();
  }, [store.id]);
  const save = async () => {
    setSaving(true); setSaved(false);
    try { await saveStoreNotify(store.id, { phone: phone.replace(/\D/g, ""), apikey: apikey.trim(), template: mensaje.trim() }); setSaved(true); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };
  return (
    <>
      <p className="av-hint" style={{ textAlign: "left", margin: "0 0 10px" }}>Recibe un WhatsApp automático cada vez que entra un pedido. Necesitas activar CallMeBot (gratis) y pegar aquí tu número y tu apikey.</p>
      <button className="av-btn ghost block" style={{ marginBottom: 12 }} onClick={() => setOpen(!open)}>{open ? "Ocultar instrucciones" : "📖 Ver cómo activar el chatbot"}</button>
      {open && (
        <div style={{ background: "var(--soft)", border: "1px solid var(--line)", borderRadius: 14, padding: 14, marginBottom: 14, fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>
          <b>Paso 1.</b> En el teléfono donde quieres recibir los avisos, abre <b>callmebot.com/blog/free-api-whatsapp-messages</b>. Ahí aparece el número actual del bot (cambia seguido).<br />
          <b>Paso 2.</b> Agrega ese número a tus contactos y, por WhatsApp, mándale: <i>I allow callmebot to send me messages</i><br />
          <b>Paso 3.</b> El bot te responde con tu <b>APIKEY</b> (un número).<br />
          <b>Paso 4.</b> Escribe abajo tu número (con código de país, sin “+”) y ese apikey, y guarda. ¡Listo!
        </div>
      )}
      <div className="av-field"><label>Tu número de WhatsApp (sin + ni espacios)</label><input className="av-input" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setSaved(false); }} placeholder="56912345678" /></div>
      <div className="av-field"><label>Tu APIKEY de CallMeBot</label><input className="av-input" value={apikey} onChange={(e) => { setApikey(e.target.value); setSaved(false); }} placeholder="1234567" /></div>
      <div className="av-field"><label>Mensaje del aviso (opcional)</label>
        <textarea className="av-input" rows={3} style={{ resize: "vertical", lineHeight: 1.5 }} value={mensaje} onChange={(e) => { setMensaje(e.target.value); setSaved(false); }} placeholder="Ej: ¡Nueva venta en mi tienda! 🎉 Revisa el pedido." />
        <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Este texto va al inicio del aviso, antes del detalle del pedido. Si lo dejas vacío, se usa el aviso estándar.</p>
      </div>
      <button className="av-btn primary block" disabled={!loaded || saving} onClick={save}>{saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar avisos"}</button>
    </>
  );
}

function SellerPayments({ store, onUpdateStore, onGo }) {
  const t = store.theme || {};
  const on = !!t.mp;
  const sii = !!store.sii;
  const toggle = () => onUpdateStore({ ...store, theme: { ...t, mp: !on } });
  if (!sii) return (
    <div className="av-field" style={{ paddingTop: 4 }}>
      <label>Pagos con Mercado Pago</label>
      <div style={{ background: "var(--soft)", border: "1px solid var(--line)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ color: "var(--muted)" }}>{I.lock({ width: 22, height: 22 })}</span><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15 }}>Se habilita al verificarte en el SII</div></div>
        <p className="av-hint" style={{ textAlign: "left", margin: 0 }}>Para cobrar con tarjeta por Mercado Pago necesitas estar verificado en el SII y poder emitir boletas (el comprobante de Mercado Pago sirve como boleta). Actívalo en Datos de la tienda.</p>
        {onGo && <button className="av-btn dark block" onClick={() => onGo("datos")}>{I.store({ width: 16, height: 16 })} Ir a Datos de la tienda</button>}
      </div>
    </div>
  );
  return (
    <div className="av-field" style={{ paddingTop: 4 }}>
      <label>Pagos con Mercado Pago</label>
      <div className="av-srow2" style={{ borderTop: 0 }}>
        <div style={{ color: "var(--accent)" }}>{I.card({ width: 22, height: 22 })}</div>
        <div style={{ flex: 1 }}>
          <div className="av-name">Cobrar con Mercado Pago</div>
          <div className="av-cat" style={{ marginTop: 2 }}>{on ? "Activado: tus clientes verán el botón de Mercado Pago" : "Desactivado"}</div>
        </div>
        <button className={"av-toggle" + (on ? " on" : "")} onClick={toggle}><span className="kn" /></button>
      </div>
      {onGo && <button className="av-btn dark block" style={{ marginTop: 12 }} onClick={() => onGo("seguridad")}>{I.lock({ width: 16, height: 16 })} Configurar credenciales (zona segura)</button>}
      <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>El dinero llega a tu cuenta de Mercado Pago. Las credenciales se ingresan en la zona segura (con tu contraseña y biometría).</p>
    </div>
  );
}

function SellerSecurity({ store }) {
  const [on, setOn] = useState(bioEnabled());
  const [can, setCan] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { bioPlatformAvailable().then(setCan); }, []);
  const toggle = async () => {
    if (on) { bioDisable(); setOn(false); return; }
    setBusy(true);
    try { await bioRegister(store?.name || "vendedor"); setOn(true); alert("Listo. La próxima vez que entres al panel te pedirá Face ID / Touch ID / huella."); }
    catch (e) { alert(e.message || "No se pudo activar."); }
    finally { setBusy(false); }
  };
  return (
    <div className="av-field" style={{ paddingTop: 4 }}>
      <label>Seguridad biométrica (este dispositivo)</label>
      <div className="av-srow2" style={{ borderTop: 0 }}>
        <div>{I.lock({ width: 20, height: 20 })}</div>
        <div style={{ flex: 1 }}>
          <div className="av-name">Desbloquear con Face ID / huella</div>
          <div className="av-cat" style={{ marginTop: 2 }}>{can ? (on ? "Activado en este dispositivo" : "Pide tu rostro o huella al abrir el panel") : "No disponible en este dispositivo o navegador"}</div>
        </div>
        <button className={"av-toggle" + (on ? " on" : "")} disabled={!can || busy} onClick={toggle}><span className="kn" /></button>
      </div>
      <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Segunda barrera además de tu contraseña. Se configura por dispositivo: si cambias de teléfono, actívalo de nuevo allí.</p>
    </div>
  );
}

function SecureArea({ store, children }) {
  const [pwOK, setPwOK] = useState(false);
  const [bioOK, setBioOK] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const checkPw = async () => {
    if (!pw) return;
    setBusy(true); setErr("");
    try { await verifyPassword(pw); setPwOK(true); setPw(""); }
    catch (e) { setErr(e.message || "No se pudo verificar."); }
    finally { setBusy(false); }
  };
  const checkBio = async () => {
    setErr("");
    try { if (!bioEnabled()) { await bioRegister(store?.name || "vendedor"); } await bioVerify(); setBioOK(true); }
    catch (e) { setErr(e.message || "No se pudo verificar la biometría."); }
  };
  if (pwOK && bioOK) return children;
  return (
    <div>
      <div style={{ background: "var(--soft)", border: "1px solid var(--line)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ color: "var(--accent)" }}>{I.lock({ width: 22, height: 22 })}</span><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15 }}>Zona segura</div></div>
        <p className="av-hint" style={{ textAlign: "left", margin: 0 }}>Para ver o cambiar datos sensibles necesitas dos verificaciones: tu contraseña y tu biometría.</p>
        <div className="av-field" style={{ paddingBottom: 0 }}>
          <label>1. Tu contraseña {pwOK ? "✓" : ""}</label>
          {!pwOK && <div style={{ display: "flex", gap: 8 }}><input className="av-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /><button className="av-btn dark" style={{ flex: "none", padding: "0 16px" }} disabled={busy || !pw} onClick={checkPw}>{busy ? "…" : "Verificar"}</button></div>}
        </div>
        <div className="av-field" style={{ paddingBottom: 0 }}>
          <label>2. Biometría {bioOK ? "✓" : ""}</label>
          {!bioOK && <button className="av-btn primary block" disabled={!pwOK} onClick={checkBio}>{I.lock({ width: 16, height: 16 })} Verificar con Face ID / huella</button>}
          {!pwOK && <p className="av-hint" style={{ textAlign: "left", marginTop: 6 }}>Primero verifica tu contraseña.</p>}
        </div>
        {err && <div style={{ fontSize: 12, color: "#D33" }}>{err}</div>}
      </div>
    </div>
  );
}

function MPCredentials({ store }) {
  const [tok, setTok] = useState("");
  const [pk, setPk] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const sii = !!store.sii;
  useEffect(() => {
    if (!sii) { setLoaded(true); return; }
    (async () => {
      try { const m = await getStoreMP(store.id); setTok(m.access_token || ""); setPk(m.public_key || ""); } catch { /* noop */ }
      finally { setLoaded(true); }
    })();
  }, [store.id, sii]);
  const save = async () => {
    setSaving(true); setSaved(false);
    try { await saveStoreMP(store.id, { access_token: tok.trim(), public_key: pk.trim() }); setSaved(true); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };
  if (!sii) return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><span style={{ color: "var(--muted)" }}>{I.lock({ width: 20, height: 20 })}</span><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15 }}>Credenciales de Mercado Pago</div></div>
      <p className="av-hint" style={{ textAlign: "left", margin: 0 }}>Esta sección se habilita cuando tu tienda está verificada en el SII (Datos de la tienda). Mientras tanto, conectar Mercado Pago no está disponible.</p>
    </div>
  );
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><span style={{ color: "var(--accent)" }}>{I.card({ width: 20, height: 20 })}</span><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15 }}>Credenciales de Mercado Pago</div></div>
      <p className="av-hint" style={{ textAlign: "left", margin: "0 0 12px" }}>Pega aquí las credenciales de tu cuenta de Mercado Pago (las obtienes en mercadopago.cl/developers → Tus integraciones). El dinero llega a TU cuenta. Empieza con las de prueba.</p>
      <div className="av-field"><label>Access Token</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="av-input" type={show ? "text" : "password"} value={tok} onChange={(e) => { setTok(e.target.value); setSaved(false); }} placeholder="APP_USR-… o TEST-…" />
          <button className="av-btn ghost" style={{ flex: "none", padding: "0 14px" }} onClick={() => setShow(!show)}>{show ? "Ocultar" : "Ver"}</button>
        </div>
      </div>
      <div className="av-field"><label>Public Key (opcional)</label><input className="av-input" value={pk} onChange={(e) => { setPk(e.target.value); setSaved(false); }} placeholder="APP_USR-… o TEST-…" /></div>
      <button className="av-btn primary block" disabled={!loaded || saving} onClick={save}>{saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar credenciales"}</button>
      <p className="av-hint" style={{ textAlign: "left", marginTop: 10 }}>Se guardan de forma privada (solo tu tienda puede verlas). Quedan en el servidor para poder crear los cobros automáticamente.</p>
    </div>
  );
}

const BANCOS_CL = ["BancoEstado", "Banco de Chile / Edwards", "Banco Santander", "Banco BCI", "Banco Itaú", "Scotiabank", "Banco Falabella", "Banco Ripley", "Banco Security", "Banco BICE", "Banco Consorcio", "Banco Internacional", "Coopeuch", "Banco BTG Pactual", "HSBC Chile", "Mercado Pago", "Tenpo", "MACH (BCI)", "Otro"];
const AUDIENCES = [["mujer", "Mujer"], ["hombre", "Hombre"], ["nina", "Niña"], ["nino", "Niño"]];
const AUD_GROUPS = [
  { key: "f", label: "Mujer y niña", auds: ["mujer", "nina"] },
  { key: "m", label: "Hombre y niño", auds: ["hombre", "nino"] },
];
const audName = (a) => (AUDIENCES.find(([k]) => k === a) || [a, a])[1];
const CAT_PRESETS = ["Camisetas", "Calcetines", "Pantys", "Bufandas", "Pantalones", "Ropa interior", "Pijamas", "Abrigos", "Accesorios"];

// ----- Estado "Agotado" -----
const URGENCIA_STOCK_BAJO = true; // muestra "Últimas unidades" cuando el stock es bajo (≤3)
const totalStock = (p) => p.variants.reduce((s, v) => s + v.stock, 0);
const availImages = (p) => (p.images || []).filter((u) => !(p.soldImages || []).includes(u));
const isSoldOut = (p) => !!p.soldOutManual || totalStock(p) === 0 || ((p.images?.length > 0) && availImages(p).length === 0);
function SoldLayer({ sm, chip = true }) {
  return (
    <div className={"av-soldlayer" + (sm ? " sm" : "")} role="img" aria-label="Producto agotado">
      {chip && <span className="av-soldchip">Agotado</span>}
    </div>
  );
}
const TIPOS_CUENTA = ["Cuenta Corriente", "Cuenta Vista", "Cuenta RUT", "Chequera Electrónica", "Cuenta de Ahorro"];

function PageWrap({ title, children }) {
  return (
    <div className="av-anim av-pad" style={{ paddingTop: 14 }}>
      <div className="av-pagetitle2">{title}</div>
      {children}
    </div>
  );
}

function SellerStore({ store, onUpdateStore, section = "datos", onGo }) {
  const up = (k, v) => onUpdateStore({ ...store, [k]: v });
  const upBank = (k, v) => onUpdateStore({ ...store, bank: { ...store.bank, [k]: v } });
  const b = store.bank || {};

  if (section === "seguridad") return (
    <PageWrap title="Seguridad">
      <SecureArea store={store}>
        <SellerSecurity store={store} />
        <div style={{ height: 1, background: "var(--line)", margin: "18px 0" }} />
        <MPCredentials store={store} />
      </SecureArea>
    </PageWrap>
  );

  if (section === "pagos") return (
    <PageWrap title="Métodos de pago">
      <SellerPayments store={store} onUpdateStore={onUpdateStore} onGo={onGo} />
      <div style={{ height: 1, background: "var(--line)", margin: "18px 0" }} />
      <div className="av-field" style={{ paddingTop: 0 }}><label>Datos bancarios (para transferencia)</label></div>
      <div className="av-field"><label>Banco</label>
        <select className="av-input" value={b.banco || ""} onChange={(e) => upBank("banco", e.target.value)}>
          <option value="">Selecciona tu banco…</option>
          {BANCOS_CL.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="av-field"><label>Tipo de cuenta</label>
        <select className="av-input" value={b.tipo || ""} onChange={(e) => upBank("tipo", e.target.value)}>
          <option value="">Selecciona el tipo…</option>
          {TIPOS_CUENTA.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="av-field"><label>N° de cuenta</label><input className="av-input" inputMode="numeric" value={b.numero || ""} onChange={(e) => upBank("numero", e.target.value.replace(/\D/g, ""))} placeholder="00012345678" /></div>
      <div className="av-field"><label>RUT del titular</label><input className="av-input" value={b.rut || ""} onChange={(e) => upBank("rut", e.target.value)} placeholder="12.345.678-9" /></div>
      <div className="av-field"><label>Titular</label><input className="av-input" value={b.titular || ""} onChange={(e) => upBank("titular", e.target.value)} placeholder="Nombre y apellido" /></div>
      <div className="av-field"><label>Correo</label><input className="av-input" type="email" value={b.correo || ""} onChange={(e) => upBank("correo", e.target.value)} placeholder="correo@ejemplo.cl" /></div>
    </PageWrap>
  );

  if (section === "avisos") return <PageWrap title="Avisos por WhatsApp"><SellerNotify store={store} /></PageWrap>;

  return (
    <PageWrap title="Datos de la tienda">
      <div className="av-srow2" style={{ borderTop: 0 }}><div>{I.shield({ width: 20, height: 20, style: { color: store.sii ? "var(--ok)" : "var(--muted)" } })}</div><div style={{ flex: 1 }}><div className="av-name">Verificado en el SII (puedo emitir boletas)</div><div className="av-cat" style={{ marginTop: 2 }}>{store.sii ? "Sello “Verificado en el SII” + habilita Mercado Pago" : "Muestra “Vendedor independiente”"}</div></div><button className={"av-toggle" + (store.sii ? " on" : "")} onClick={() => up("sii", !store.sii)}><span className="kn" /></button></div>
      <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Actívalo solo si hiciste “inicio de actividades” en el SII y puedes emitir boletas. Al activarlo se habilita el cobro con <b>Mercado Pago</b> (su comprobante sirve como boleta). Si no estás verificado, Mercado Pago permanece oculto para ti y para tus clientes.</p>
      <div className="av-field" style={{ paddingTop: 14 }}><label>WhatsApp Business (sin + ni espacios)</label><input className="av-input" value={store.whatsapp} onChange={(e) => up("whatsapp", e.target.value.replace(/\D/g, ""))} placeholder="56912345678" /></div>
      <div style={{ height: 1, background: "var(--line)", margin: "18px 0" }} />
      <div className="av-field" style={{ paddingTop: 0 }}><label>Dirección web — nombre corto (enlace gratis)</label>
        <input className="av-input" value={store.slug || ""} onChange={(e) => up("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))} placeholder="gamerstock" />
        {store.slug
          ? <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Tu enlace gratis para compartir:<br /><b style={{ wordBreak: "break-all" }}>{window.location.origin}/?tienda={store.slug}</b></p>
          : <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Elige un nombre corto (solo minúsculas, números y guiones) para tener un enlace gratis para compartir.</p>}
      </div>
      <div className="av-field"><label>Dominio propio (opcional)</label>
        <input className="av-input" value={store.domain || ""} onChange={(e) => up("domain", e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""))} placeholder="mitienda.cl" />
        <p className="av-hint" style={{ textAlign: "left", marginTop: 8 }}>Si tienes un dominio propio, escríbelo aquí y luego conéctalo en Vercel. Mientras no esté conectado apuntando a esta app, no funcionará. (Un dominio se paga por año.)</p>
      </div>
      <div className="av-field" style={{ paddingTop: 0 }}><label>¿No tienes dominio? Cómpralo aquí</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <a className="av-btn ghost" style={{ flex: "none", padding: "10px 14px", textDecoration: "none" }} href="https://www.nic.cl" target="_blank" rel="noreferrer">NIC Chile (.cl)</a>
          <a className="av-btn ghost" style={{ flex: "none", padding: "10px 14px", textDecoration: "none" }} href="https://dash.cloudflare.com/?to=/:account/domains/register" target="_blank" rel="noreferrer">Cloudflare</a>
          <a className="av-btn ghost" style={{ flex: "none", padding: "10px 14px", textDecoration: "none" }} href="https://www.namecheap.com/domains/" target="_blank" rel="noreferrer">Namecheap</a>
        </div>
        <p className="av-hint" style={{ textAlign: "left", marginTop: 10 }}>Cómo funciona: <b>1)</b> compras tu dominio (para <b>.cl</b> usa NIC Chile). <b>2)</b> lo conectas en Vercel (Settings → Domains → Add Domain). <b>3)</b> lo escribes arriba. El dominio es tuyo aunque la app esté en Vercel.</p>
      </div>
    </PageWrap>
  );
}
