#!/usr/bin/env node
/**
 * Generates premium placeholder images for the portfolio.
 *
 * Pure Node.js — no dependencies. Renders abstract "workspace / UI mockup"
 * scenes into PNG files using signed-distance-field shape drawing, so the
 * placeholders look intentional and match the site's muted, minimal palette.
 *
 * Re-run with:  node scripts/generate-images.mjs
 *
 * To replace any placeholder with a real image later, just drop the file into
 * /public/images (same path) and update the path in the matching data file.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ */
/* Minimal PNG encoder                                                 */
/* ------------------------------------------------------------------ */

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Tiny SDF renderer                                                   */
/* ------------------------------------------------------------------ */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const mix = (a, b, t) => a + (b - a) * t;
const mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const cov = (d) => clamp01(0.5 - d); // ~1px anti-aliased edge coverage

function makeCanvas(W, H) {
  const px = new Uint8ClampedArray(W * H * 4);
  return {
    px,
    W,
    H,
    fill(x0, y0, x1, y1, fn) {
      const xa = Math.max(0, Math.floor(x0));
      const xb = Math.min(W, Math.ceil(x1));
      const ya = Math.max(0, Math.floor(y0));
      const yb = Math.min(H, Math.ceil(y1));
      for (let y = ya; y < yb; y++)
        for (let x = xa; x < xb; x++) fn(x + 0.5, y + 0.5, (y * W + x) * 4);
    },
    vgrad(top, bottom) {
      const t = hex(top);
      const b = hex(bottom);
      this.fill(0, 0, W, H, (X, Y, i) => {
        const c = mixc(t, b, Y / H);
        px[i] = c[0];
        px[i + 1] = c[1];
        px[i + 2] = c[2];
        px[i + 3] = 255;
      });
    },
    rect(x, y, w, h, color, alpha = 1, r = 0) {
      const c = hex(color);
      const pad = r + 1;
      this.fill(x - pad, y - pad, x + w + pad, y + h + pad, (X, Y, i) => {
        let d;
        if (r > 0) {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const hw = w / 2 - r;
          const hh = h / 2 - r;
          const qx = Math.abs(X - cx) - hw;
          const qy = Math.abs(Y - cy) - hh;
          const ox = Math.max(qx, 0);
          const oy = Math.max(qy, 0);
          d = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
        } else {
          d = Math.max(x - X, X - (x + w), y - Y, Y - (y + h));
        }
        const a = cov(d) * alpha;
        if (a > 0.004) blend(px, i, c, a);
      });
    },
    line(x1, y1, x2, y2, t, color, alpha = 1) {
      const c = hex(color);
      const pad = t / 2 + 1;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      this.fill(
        Math.min(x1, x2) - pad,
        Math.min(y1, y2) - pad,
        Math.max(x1, x2) + pad,
        Math.max(y1, y2) + pad,
        (X, Y, i) => {
          const u = len2 === 0 ? 0 : clamp01(((X - x1) * dx + (Y - y1) * dy) / len2);
          const d = Math.hypot(X - (x1 + u * dx), Y - (y1 + u * dy)) - t / 2;
          const a = cov(d) * alpha;
          if (a > 0.004) blend(px, i, c, a);
        }
      );
    },
    circle(cx, cy, r, color, alpha = 1) {
      const c = hex(color);
      this.fill(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1, (X, Y, i) => {
        const a = cov(Math.hypot(X - cx, Y - cy) - r) * alpha;
        if (a > 0.004) blend(px, i, c, a);
      });
    },
    ring(cx, cy, r, t, color, alpha = 1) {
      const c = hex(color);
      this.fill(cx - r - t, cy - r - t, cx + r + t, cy + r + t, (X, Y, i) => {
        const a = cov(Math.abs(Math.hypot(X - cx, Y - cy) - r) - t / 2) * alpha;
        if (a > 0.004) blend(px, i, c, a);
      });
    },
    glow(cx, cy, r, color, peak = 0.3, falloff = 4) {
      const c = hex(color);
      this.fill(cx - r, cy - r, cx + r, cy + r, (X, Y, i) => {
        const d = Math.hypot(X - cx, Y - cy) / r;
        if (d > 1) return;
        const a = peak * Math.exp(-d * d * falloff);
        if (a > 0.004) blend(px, i, c, a);
      });
    },
    vignette(strength = 0.4) {
      this.fill(0, 0, W, H, (X, Y, i) => {
        const d = Math.hypot((X - W / 2) / (W / 2), (Y - H / 2) / (H / 2));
        const a = strength * Math.pow(clamp01(d), 2.2);
        if (a > 0.004) blend(px, i, [0, 0, 0], a);
      });
    },
    dotGrid(spacing, radius, color, alpha) {
      const c = hex(color);
      for (let y = spacing / 2; y < H; y += spacing) {
        for (let x = spacing / 2; x < W; x += spacing) {
          this.fill(x - 1.5, y - 1.5, x + 1.5, y + 1.5, (X, Y, i) => {
            const a = cov(Math.hypot(X - x, Y - y) - radius) * alpha;
            if (a > 0.004) blend(px, i, c, a);
          });
        }
      }
    },
  };
}

function blend(px, i, c, a) {
  const ia = 1 - a;
  px[i] = px[i] * ia + c[0] * a;
  px[i + 1] = px[i + 1] * ia + c[1] * a;
  px[i + 2] = px[i + 2] * ia + c[2] * a;
}

/** Small rounded text-like bar. */
const uiText = (cv, x, y, w, h, color, alpha = 1) =>
  cv.rect(x, y, w, h, color, alpha, h / 2);

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

/** Dark, moody developer workspace — hero background. */
function sceneHero(cv) {
  const { W, H } = cv;
  cv.vgrad("#0c0f15", "#171d27");
  cv.dotGrid(34, 1.1, "#9fb0c8", 0.1);
  cv.glow(W * 0.78, H * 0.4, W * 0.5, "#33415e", 0.16, 4);
  cv.glow(W * 0.16, H * 0.7, W * 0.34, "#232c3d", 0.3, 3.5);

  // Desk surface
  cv.rect(0, H * 0.74, W, H * 0.26, "#0a0d12", 1, 0);
  cv.line(0, H * 0.74, W, H * 0.74, 2, "#333f52", 0.9);

  // Monitor
  const mw = W * 0.4;
  const mh = H * 0.3;
  const mx = (W - mw) / 2;
  const my = H * 0.42;
  cv.rect(mx, my, mw, mh, "#1b2331", 1, 10);
  cv.rect(mx + mw * 0.02, my + mh * 0.06, mw * 0.96, mh * 0.84, "#0f141d", 1, 6);
  cv.glow(mx + mw * 0.5, my + mh * 0.5, mw * 0.5, "#a9b6cc", 0.1, 3);
  const lx = mx + mw * 0.08;
  const ly = my + mh * 0.18;
  const lw = mw * 0.84;
  const lh = mh * 0.12;
  const code = ["#3a465c", "#46536b", "#3a465c", "#2e3a4f", "#46536b"];
  code.forEach((c, k) =>
    cv.rect(lx, ly + k * lh * 1.35, lw * (0.9 - k * 0.12), lh * 0.32, c, 0.75, 2)
  );
  // Stand
  cv.rect(W * 0.5 - W * 0.012, my + mh, W * 0.024, H * 0.018, "#141b26");
  cv.rect(W * 0.5 - W * 0.05, my + mh + H * 0.018, W * 0.1, H * 0.006, "#141b26", 1, 2);

  // Keyboard
  cv.rect(W * 0.5 - W * 0.14, H * 0.745, W * 0.28, H * 0.022, "#151c27", 1, 4);

  // Lamp
  cv.line(W * 0.14, H * 0.74, W * 0.14, H * 0.46, 3, "#2c3547");
  cv.line(W * 0.14, H * 0.46, W * 0.2, H * 0.44, 3, "#2c3547");
  cv.ring(W * 0.205, H * 0.435, W * 0.014, 3, "#4a5568", 0.9);
  cv.glow(W * 0.23, H * 0.44, W * 0.16, "#c9b98a", 0.1, 3.5);

  // Plant
  const pcx = W * 0.86;
  const pcy = H * 0.7;
  cv.circle(pcx - W * 0.02, pcy - H * 0.05, W * 0.024, "#1d2a20", 0.85);
  cv.circle(pcx + W * 0.014, pcy - H * 0.045, W * 0.02, "#233026", 0.85);
  cv.circle(pcx - W * 0.004, pcy - H * 0.09, W * 0.028, "#1b271e", 0.9);
  cv.rect(pcx - W * 0.014, pcy - H * 0.012, W * 0.028, H * 0.03, "#12181f", 1, 3);

  cv.vignette(0.4);
}

/** Vertical, moody workspace — About profile image. */
function sceneProfile(cv) {
  const { W, H } = cv;
  cv.vgrad("#141922", "#1d2531");
  cv.dotGrid(30, 1.0, "#93a0b8", 0.08);
  cv.glow(W * 0.62, H * 0.42, W * 0.5, "#a9b6cc", 0.12, 3.5);
  cv.glow(W * 0.3, H * 0.82, W * 0.35, "#242e3e", 0.35, 3);

  // Desk
  cv.rect(0, H * 0.66, W, H * 0.34, "#0b0e14", 1, 0);
  cv.line(0, H * 0.66, W, H * 0.66, 2, "#333f52", 0.9);

  // Monitor
  const mw = W * 0.62;
  const mh = H * 0.34;
  const mx = (W - mw) / 2;
  const my = H * 0.3;
  cv.rect(mx, my, mw, mh, "#1b2331", 1, 12);
  cv.rect(mx + mw * 0.02, my + mh * 0.06, mw * 0.96, mh * 0.84, "#0f141d", 1, 8);
  cv.glow(mx + mw * 0.5, my + mh * 0.5, mw * 0.5, "#a9b6cc", 0.1, 3);
  const lx = mx + mw * 0.08;
  const ly = my + mh * 0.18;
  const lw = mw * 0.84;
  const lh = mh * 0.12;
  const code = ["#3a465c", "#46536b", "#3a465c", "#2e3a4f", "#46536b"];
  code.forEach((c, k) =>
    cv.rect(lx, ly + k * lh * 1.35, lw * (0.92 - k * 0.12), lh * 0.3, c, 0.75, 2)
  );
  cv.rect(W * 0.5 - W * 0.014, my + mh, W * 0.028, H * 0.02, "#141b26");
  cv.rect(W * 0.5 - W * 0.06, my + mh + H * 0.02, W * 0.12, H * 0.006, "#141b26", 1, 3);

  // Keyboard + mouse
  cv.rect(W * 0.5 - W * 0.17, H * 0.672, W * 0.34, H * 0.018, "#151c27", 1, 5);
  cv.rect(W * 0.68, H * 0.662, W * 0.05, H * 0.02, "#161d28", 1, 4);

  // Lamp (right)
  cv.line(W * 0.86, H * 0.66, W * 0.86, H * 0.42, 3, "#2c3547");
  cv.line(W * 0.86, H * 0.42, W * 0.8, H * 0.4, 3, "#2c3547");
  cv.ring(W * 0.795, H * 0.395, W * 0.016, 3, "#4a5568", 0.9);
  cv.glow(W * 0.77, H * 0.4, W * 0.18, "#c9b98a", 0.09, 3.5);

  // Plant (left)
  const pcx = W * 0.13;
  const pcy = H * 0.62;
  cv.circle(pcx - W * 0.02, pcy - H * 0.05, W * 0.026, "#1d2a20", 0.85);
  cv.circle(pcx + W * 0.016, pcy - H * 0.045, W * 0.022, "#233026", 0.85);
  cv.circle(pcx - W * 0.004, pcy - H * 0.09, W * 0.03, "#1b271e", 0.9);
  cv.rect(pcx - W * 0.015, pcy - H * 0.012, W * 0.03, H * 0.032, "#12181f", 1, 3);

  cv.vignette(0.42);
}

/** CourseSite — light e-learning UI mockup. */
function sceneProject1(cv) {
  const { W, H } = cv;
  cv.vgrad("#f4f5f7", "#e8eaee");

  // Top nav
  cv.rect(0, 0, W, H * 0.08, "#ffffff", 0.92);
  cv.rect(W * 0.04, H * 0.024, W * 0.09, H * 0.032, "#111827", 1, H * 0.004);
  cv.line(W * 0.04, H * 0.05, W * 0.2, H * 0.05, 4, "#d3d7de");
  cv.rect(W * 0.86, H * 0.022, W * 0.1, H * 0.036, "#111827", 1, H * 0.004);

  // Hero band
  cv.rect(W * 0.05, H * 0.13, W * 0.52, H * 0.32, "#ffffff", 1, 10);
  uiText(cv, W * 0.08, H * 0.18, W * 0.3, H * 0.045, "#111827", 0.9);
  uiText(cv, W * 0.08, H * 0.245, W * 0.42, H * 0.026, "#b9bfc9");
  uiText(cv, W * 0.08, H * 0.285, W * 0.36, H * 0.026, "#b9bfc9");
  cv.rect(W * 0.08, H * 0.35, W * 0.12, H * 0.055, "#111827", 1, H * 0.007);
  cv.rect(W * 0.215, H * 0.35, W * 0.12, H * 0.055, "#e9ebef", 1, H * 0.007);

  // Dark visual card
  cv.rect(W * 0.63, H * 0.13, W * 0.32, H * 0.32, "#141a24", 1, 10);
  cv.glow(W * 0.79, H * 0.29, W * 0.12, "#5b6b84", 0.35, 3);
  cv.rect(W * 0.67, H * 0.18, W * 0.24, H * 0.1, "#212a3a", 1, 6);
  uiText(cv, W * 0.67, H * 0.33, W * 0.2, H * 0.018, "#55637c");
  uiText(cv, W * 0.67, H * 0.37, W * 0.16, H * 0.018, "#3d4a60");

  // Course cards
  const xs = [0.05, 0.37, 0.69];
  xs.forEach((cx, k) => {
    const x = W * cx;
    const y = H * 0.52;
    const w = W * 0.26;
    const h = H * 0.4;
    cv.rect(x, y, w, h, "#ffffff", 1, 10);
    cv.rect(x + w * 0.06, y + h * 0.06, w * 0.88, h * 0.34, k === 1 ? "#5b6b84" : "#dfe3e8", 0.9, 8);
    uiText(cv, x + w * 0.08, y + h * 0.5, w * 0.6, h * 0.035, "#2a3040", 0.85);
    uiText(cv, x + w * 0.08, y + h * 0.6, w * 0.7, h * 0.024, "#c3c9d2");
    uiText(cv, x + w * 0.08, y + h * 0.68, w * 0.5, h * 0.024, "#c3c9d2");
    cv.rect(x + w * 0.08, y + h * 0.8, w * 0.3, h * 0.07, "#111827", 1, h * 0.012);
  });
  cv.vignette(0.1);
}

/** Empire Gym — dark fitness dashboard mockup. */
function sceneProject2(cv) {
  const { W, H } = cv;
  cv.vgrad("#12151b", "#1b2028");
  cv.dotGrid(40, 1.1, "#9aa3b3", 0.07);

  // Headline bars
  cv.rect(W * 0.06, H * 0.1, W * 0.4, H * 0.06, "#2a3140", 1, 6);
  cv.rect(W * 0.06, H * 0.19, W * 0.28, H * 0.045, "#2a3140", 1, 5);

  // Big ring
  cv.ring(W * 0.5, H * 0.55, W * 0.11, 6, "#a88d5f", 0.9);
  cv.ring(W * 0.5, H * 0.55, W * 0.075, 3, "#a88d5f", 0.5);
  cv.glow(W * 0.5, H * 0.55, W * 0.14, "#a88d5f", 0.14, 3);

  // Stat cards
  const xs = [0.06, 0.27, 0.48, 0.69];
  xs.forEach((cx, k) => {
    const x = W * cx;
    const y = H * 0.72;
    const w = W * 0.16;
    const h = H * 0.16;
    cv.rect(x, y, w, h, "#1d222b", 1, 8);
    uiText(cv, x + w * 0.12, y + h * 0.16, w * 0.6, h * 0.1, "#39404e", 0.9);
    cv.rect(x + w * 0.12, y + h * 0.55, w * (0.55 + (k % 3) * 0.12), h * 0.09, "#a88d5f", 0.9, 3);
    uiText(cv, x + w * 0.12, y + h * 0.76, w * 0.4, h * 0.06, "#39404e", 0.8);
  });
  cv.vignette(0.32);
}

/** Todo PWA — light task app mockup. */
function sceneProject3(cv) {
  const { W, H } = cv;
  cv.vgrad("#f5f6f4", "#ebede9");

  // Search pill
  cv.rect(W * 0.3, H * 0.08, W * 0.4, H * 0.05, "#ffffff", 0.95, H * 0.01);

  // Main column card
  const cw = W * 0.36;
  const ch = H * 0.68;
  const cx = (W - cw) / 2;
  const cy = H * 0.18;
  cv.rect(cx, cy, cw, ch, "#ffffff", 1, 14);
  cv.rect(cx + cw * 0.06, cy + ch * 0.05, cw * 0.4, ch * 0.045, "#2a3040", 0.85, 8);
  cv.rect(cx + cw * 0.52, cy + ch * 0.055, cw * 0.24, ch * 0.035, "#e8ece8", 1, 8);

  // Todo rows
  for (let k = 0; k < 5; k++) {
    const ry = cy + ch * (0.16 + k * 0.15);
    const done = k < 2;
    cv.ring(cx + cw * 0.1, ry, cw * 0.022, 3, done ? "#7d947a" : "#b9c2ba", done ? 0.9 : 0.8);
    if (done) cv.circle(cx + cw * 0.1, ry, cw * 0.011, "#7d947a", 0.9);
    uiText(cv, cx + cw * 0.17, ry - ch * 0.012, cw * (done ? 0.45 : 0.55), ch * 0.024, done ? "#b9c2ba" : "#4a5363", done ? 0.8 : 0.85);
    uiText(cv, cx + cw * 0.17, ry + ch * 0.018, cw * 0.32, ch * 0.016, "#c8cdc8");
  }

  // Floating accents
  cv.circle(W * 0.82, H * 0.22, W * 0.045, "#7d947a", 0.16);
  cv.ring(W * 0.82, H * 0.22, W * 0.045, 3, "#7d947a", 0.5);
  cv.rect(W * 0.13, H * 0.68, W * 0.13, H * 0.18, "#ffffff", 0.95, 10);
  uiText(cv, W * 0.145, H * 0.71, W * 0.07, H * 0.022, "#4a5363", 0.85);
  uiText(cv, W * 0.145, H * 0.75, W * 0.1, H * 0.018, "#c8cdc8");
  uiText(cv, W * 0.145, H * 0.79, W * 0.08, H * 0.018, "#c8cdc8");
  cv.vignette(0.1);
}

/** Developer Dashboard — dark admin UI mockup. */
function sceneProject4(cv) {
  const { W, H } = cv;
  cv.vgrad("#0f1219", "#171d28");

  // Sidebar
  cv.rect(0, 0, W * 0.16, H, "#0b0e14", 1);
  cv.rect(W * 0.035, H * 0.045, W * 0.05, H * 0.02, "#6d7fa8", 1, 3);
  for (let k = 0; k < 6; k++) {
    uiText(cv, W * 0.035, H * (0.14 + k * 0.05), W * (k === 1 ? 0.085 : 0.1), H * 0.014, k === 1 ? "#6d7fa8" : "#39435a", k === 1 ? 0.9 : 0.8);
  }

  // Top bar
  cv.line(W * 0.16, H * 0.09, W, H * 0.09, 2, "#232c3c");

  // KPI cards
  const kx = [0.18, 0.36, 0.54];
  kx.forEach((cx, k) => {
    const x = W * cx;
    const y = H * 0.13;
    const w = W * 0.15;
    const h = H * 0.13;
    cv.rect(x, y, w, h, "#1b2130", 1, 8);
    uiText(cv, x + w * 0.1, y + h * 0.16, w * 0.5, h * 0.07, "#39435a", 0.8);
    uiText(cv, x + w * 0.1, y + h * 0.45, w * (0.35 + k * 0.12), h * 0.1, "#6d7fa8", 0.9);
    uiText(cv, x + w * 0.1, y + h * 0.72, w * 0.4, h * 0.06, "#39435a", 0.7);
  });

  // Main chart card
  cv.rect(W * 0.18, H * 0.31, W * 0.5, H * 0.56, "#1b2130", 1, 10);
  uiText(cv, W * 0.205, H * 0.35, W * 0.18, H * 0.03, "#9aa4bb", 0.9);
  const bx0 = W * 0.2;
  const by0 = H * 0.4;
  const bhMax = H * 0.42;
  const bw = W * 0.026;
  const gap = W * 0.013;
  for (let k = 0; k < 11; k++) {
    const bh = bhMax * (0.3 + 0.65 * Math.abs(Math.sin(k * 1.7 + 0.6)));
    const x = bx0 + k * (bw + gap);
    cv.rect(x, by0 + bhMax - bh, bw, bh, k === 6 ? "#8fa0c4" : "#6d7fa8", k === 6 ? 0.95 : 0.55, 2);
  }
  // Sparkline
  const pts = [];
  for (let k = 0; k < 9; k++) {
    const x = W * 0.205 + (k / 8) * W * 0.42;
    const y = H * 0.47 - Math.abs(Math.sin(k * 1.3 + 0.3)) * H * 0.18;
    pts.push([x, y]);
  }
  for (let k = 0; k < pts.length - 1; k++)
    cv.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 2.5, "#8fa0c4", 0.9);
  const last = pts[pts.length - 1];
  cv.ring(last[0], last[1], 4, 2, "#a7b6d8", 0.95);
  cv.glow(last[0], last[1], 12, "#8fa0c4", 0.5, 3);

  // Right panel
  cv.rect(W * 0.72, H * 0.31, W * 0.24, H * 0.56, "#1b2130", 1, 10);
  uiText(cv, W * 0.745, H * 0.35, W * 0.14, H * 0.03, "#9aa4bb", 0.9);
  for (let k = 0; k < 5; k++) {
    const ry = H * 0.42 + k * H * 0.08;
    cv.circle(W * 0.75, ry, 4, "#6d7fa8", 0.8);
    uiText(cv, W * 0.775, ry - H * 0.008, W * 0.14, H * 0.018, "#5b6680", 0.85);
    uiText(cv, W * 0.775, ry + H * 0.014, W * 0.1, H * 0.014, "#39435a", 0.7);
  }
  cv.vignette(0.32);
}

/** Shopline — light e-commerce mockup. */
function sceneProject5(cv) {
  const { W, H } = cv;
  cv.vgrad("#f6f4f5", "#eeeaec");

  // Top bar
  cv.rect(0, 0, W, H * 0.08, "#ffffff", 0.92);
  cv.rect(W * 0.04, H * 0.024, W * 0.3, H * 0.032, "#f0eef0", 1, 8);
  cv.rect(W * 0.87, H * 0.024, W * 0.09, H * 0.032, "#111827", 1, 8);

  // Filter chips
  cv.rect(W * 0.04, H * 0.115, W * 0.07, H * 0.03, "#111827", 1, 6);
  cv.rect(W * 0.125, H * 0.115, W * 0.07, H * 0.03, "#ffffff", 1, 6);
  cv.rect(W * 0.21, H * 0.115, W * 0.07, H * 0.03, "#ffffff", 1, 6);

  // Product grid 2x2
  const gx = [0.05, 0.52];
  const gy = [0.18, 0.56];
  gx.forEach((g, i) =>
    gy.forEach((g2, j) => {
      const x = W * g;
      const y = H * g2;
      const w = W * 0.43;
      const h = H * 0.35;
      cv.rect(x, y, w, h, "#ffffff", 1, 10);
      cv.rect(x + w * 0.05, y + h * 0.05, w * 0.9, h * 0.52, i === j ? "#c9a7a7" : "#e2d8d8", 0.95, 8);
      uiText(cv, x + w * 0.06, y + h * 0.64, w * 0.4, h * 0.04, "#333a45", 0.85);
      uiText(cv, x + w * 0.06, y + h * 0.72, w * 0.55, h * 0.028, "#c6c0c3");
      cv.rect(x + w * 0.06, y + h * 0.83, w * 0.16, h * 0.07, "#b98d8d", 1, h * 0.015);
      cv.rect(x + w * 0.24, y + h * 0.83, w * 0.16, h * 0.07, "#f0eef0", 1, h * 0.015);
    })
  );
  cv.vignette(0.1);
}

/** Nova Finance — dark finance dashboard mockup. */
function sceneProject6(cv) {
  const { W, H } = cv;
  cv.vgrad("#0f1416", "#162124");
  cv.dotGrid(42, 1, "#8fa3a3", 0.06);

  // Headline bars
  cv.rect(W * 0.06, H * 0.09, W * 0.22, H * 0.05, "#2c3a3d", 1, 6);
  cv.rect(W * 0.06, H * 0.17, W * 0.15, H * 0.035, "#2c3a3d", 1, 5);

  // Bar chart card
  cv.rect(W * 0.06, H * 0.28, W * 0.52, H * 0.58, "#1a2327", 1, 10);
  const bx0 = W * 0.09;
  const by0 = H * 0.34;
  const bhMax = H * 0.44;
  const bw = W * 0.028;
  const gap = W * 0.011;
  for (let k = 0; k < 12; k++) {
    const bh = bhMax * (0.28 + 0.65 * Math.abs(Math.sin(k * 1.9 + 1)));
    const x = bx0 + k * (bw + gap);
    cv.rect(x, by0 + bhMax - bh, bw, bh, k === 7 ? "#8fb3a8" : "#6f9a9a", k === 7 ? 0.95 : 0.5, 2);
  }
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const x = W * 0.095 + (k / 9) * W * 0.45;
    const y = H * 0.42 - Math.abs(Math.sin(k * 1.2 + 0.4)) * H * 0.16;
    pts.push([x, y]);
  }
  for (let k = 0; k < pts.length - 1; k++)
    cv.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 2.5, "#8fb3a8", 0.9);
  const last = pts[pts.length - 1];
  cv.ring(last[0], last[1], 4, 2, "#a4c4ba", 0.95);
  cv.glow(last[0], last[1], 12, "#8fb3a8", 0.5, 3);

  // Summary card
  cv.rect(W * 0.62, H * 0.28, W * 0.32, H * 0.27, "#1a2327", 1, 10);
  uiText(cv, W * 0.65, H * 0.32, W * 0.12, H * 0.02, "#3d4d50", 0.8);
  uiText(cv, W * 0.65, H * 0.375, W * 0.22, H * 0.045, "#a4c4ba", 0.9);
  cv.ring(W * 0.86, H * 0.39, W * 0.032, 3, "#6f9a9a", 0.6);

  // List card
  cv.rect(W * 0.62, H * 0.59, W * 0.32, H * 0.27, "#1a2327", 1, 10);
  for (let k = 0; k < 3; k++) {
    const ry = H * 0.64 + k * H * 0.07;
    cv.circle(W * 0.65, ry, 4, k === 1 ? "#8fb3a8" : "#4c5d60", k === 1 ? 0.9 : 0.8);
    uiText(cv, W * 0.675, ry - H * 0.008, W * 0.18, H * 0.018, "#5b6d70", 0.85);
    uiText(cv, W * 0.85, ry - H * 0.008, W * 0.06, H * 0.018, "#6f9a9a", 0.8);
  }
  cv.vignette(0.3);
}

/** Social-card sized OG image. */
function sceneOg(cv) {
  const { W, H } = cv;
  cv.vgrad("#0c0f15", "#161c26");
  cv.dotGrid(30, 1, "#9fb0c8", 0.1);
  cv.glow(W * 0.22, H * 0.45, W * 0.4, "#33415e", 0.2, 3.5);
  cv.glow(W * 0.8, H * 0.7, W * 0.3, "#232c3d", 0.32, 3);
  cv.rect(W * 0.12, H * 0.62, W * 0.76, H * 0.02, "#2a3446", 0.7, H * 0.005);
  cv.rect(W * 0.12, H * 0.68, W * 0.5, H * 0.02, "#2a3446", 0.5, H * 0.005);
  cv.line(W * 0.12, H * 0.76, W * 0.88, H * 0.76, 1.5, "#39435a", 0.6);
  cv.vignette(0.35);
}

/* ------------------------------------------------------------------ */
/* PDF (Download CV placeholder)                                        */
/* ------------------------------------------------------------------ */

function buildCvPdf() {
  const lines = [
    { text: "SHAYAN", size: 26, font: "F2", gap: 28 },
    { text: "Full-Stack Web Developer", size: 13, font: "F1", gap: 26 },
    { text: "hello@shayan.dev    |    github.com/shayan    |    linkedin.com/in/shayan", size: 10, font: "F1", gap: 34 },
    { text: "Profile", size: 13, font: "F2", gap: 15 },
    { text: "Passionate Full-Stack Web Developer focused on building modern, scalable and", size: 11, font: "F1", gap: 15 },
    { text: "high-performance web applications with clean code and modern best practices.", size: 11, font: "F1", gap: 26 },
    { text: "Skills", size: 13, font: "F2", gap: 15 },
    { text: "JavaScript  TypeScript  React  Next.js  Node.js  Express  MongoDB  PostgreSQL  MySQL", size: 11, font: "F1", gap: 15 },
    { text: "Tailwind CSS  Bootstrap  Git  GitHub  Docker  REST APIs  UI/UX", size: 11, font: "F1", gap: 26 },
    { text: "Experience", size: 13, font: "F2", gap: 15 },
    { text: "Senior Full-Stack Developer - TechNova Solutions (2023 - Present)", size: 11, font: "F1", gap: 15 },
    { text: "Full-Stack Developer - CodeCraft Studio (2021 - 2023)", size: 11, font: "F1", gap: 15 },
    { text: "Frontend Developer - PixelForge Agency (2019 - 2021)", size: 11, font: "F1", gap: 15 },
    { text: "Freelance Web Developer (2018 - 2019)", size: 11, font: "F1", gap: 26 },
    { text: "Projects", size: 13, font: "F2", gap: 15 },
    { text: "CourseSite, Empire Gym, Todo PWA, Developer Dashboard, Shopline, Nova Finance", size: 11, font: "F1", gap: 26 },
    { text: "References available upon request.", size: 10, font: "F1", gap: 0 },
  ];
  let content = "";
  let y = 790;
  for (const l of lines) {
    content += `BT /${l.font} ${l.size} Tf 56 ${y} Td (${l.text}) Tj ET\n`;
    y -= l.gap;
  }
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++)
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

function render(W, H, scene, rel) {
  const cv = makeCanvas(W, H);
  scene(cv);
  const buf = encodePng(W, H, cv.px);
  const out = join(ROOT, "public", "images", rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log(`  wrote ${rel}  (${W}x${H}, ${(buf.length / 1024).toFixed(0)} KB)`);
}

const started = Date.now();
console.log("Generating placeholder images...");
render(1920, 1080, sceneHero, "hero-bg.png");
render(900, 1100, sceneProfile, "profile.png");
render(1200, 630, sceneOg, "og.png");
render(1200, 800, sceneProject1, "projects/project-1.png");
render(1200, 800, sceneProject2, "projects/project-2.png");
render(1200, 800, sceneProject3, "projects/project-3.png");
render(1200, 800, sceneProject4, "projects/project-4.png");
render(1200, 800, sceneProject5, "projects/project-5.png");
render(1200, 800, sceneProject6, "projects/project-6.png");

const cvDir = join(ROOT, "public", "cv");
mkdirSync(cvDir, { recursive: true });
const cvPath = join(cvDir, "Shayan-CV.pdf");
writeFileSync(cvPath, buildCvPdf());
console.log(`  wrote cv/shayan-cv2.pdf  (${(Buffer.byteLength(buildCvPdf()) / 1024).toFixed(0)} KB)`);

console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);