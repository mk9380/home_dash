import { useState, useMemo, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, ReferenceLine } from "recharts";

const C = { bg: "#111", sf: "#1a1a1a", cd: "#1e1e1e", bd: "#333", bl: "#0078FF", bl2: "#3399FF", gn: "#00C853", rd: "#FF5252", or: "#FFB300", pu: "#B388FF", cy: "#00BCD4", tx: "#FFF", ts: "#B0B0B0", td: "#707070" };
const ff = "'Inter',system-ui,sans-serif";

/* FORMATTERS */
const fp = (v, d = 1) => v == null || isNaN(v) ? "—" : v.toFixed(d) + "%";
const fn = (n, d = 1) => n == null || isNaN(n) ? "—" : n.toFixed(d);
const fmn = v => v == null || isNaN(v) ? "—" : (v / 1000).toFixed(1);
const fcm = n => n == null || isNaN(n) ? "—" : Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fv = n => { if (n == null || isNaN(n)) return "—"; let a = Math.abs(n); if (a >= 1e9) return (n < 0 ? "-" : "") + "$" + (n / 1e9).toFixed(1) + "B"; if (a >= 1e6) return (n < 0 ? "-" : "") + "$" + (n / 1e6).toFixed(1) + "M"; return "$" + n.toFixed(1); };
const fvc = n => { if (n == null || isNaN(n)) return "—"; if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "B"; if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(1) + "M"; return "$" + n.toFixed(0); };
const cagr = (s, e, y) => (!s || s <= 0 || !e || e <= 0 || !y) ? null : (Math.pow(e / s, 1 / y) - 1) * 100;
const yoy = (c, p) => (!p || p === 0) ? null : (c - p) / Math.abs(p) * 100;

/* HISTORICAL DATA ($K) */
const HY = [2019, 2020, 2021, 2022, 2023, 2024, 2025], HL = 6;
const H = {
  sr: [245765, 295877, 379340, 464935, 558645, 667646, 812627],
  pr: [52126, 55717, 63945, 72940, 71394, 71034, 71941],
  cs: [42881, 49503, 60551, 77711, 99193, 118697, 136645],
  cp: [42131, 40674, 43282, 52174, 55029, 53358, 53785],
  rd: [89921, 94844, 115735, 151716, 172790, 192935, 214844],
  sm: [120300, 144687, 178785, 245260, 287035, 347243, 408872],
  ga: [48064, 59688, 74287, 99778, 110519, 102981, 112863],
  ii: [4657, 3282, 1041, 4880, 25882, 39395, 34153],
  ie: [6027, 13964, 14015, 6042, 53639, 12865, 12777],
  oi: [-564, -205, 3229, 926, -1814, 563, -1350],
  tx: [139, -291, -1370, 1947, 3427, 5601, 3754],
  sb: [35784, 45771, 48633, 70660, 98765, 102150, 122945],
  ca: [381742, 322831, 300386, 240197, 256100, 301835, 338769],
  ms: [106214, 207207, 230060, 190595, 557622, 514585, 552852],
  ar: [60228, 68922, 76848, 106316, 125193, 148433, 168984],
  dr: [173617, 208990, 258023, 316263, 380843, 457608, 547919],
  dn: [32569, 35894, 34181, 38237, 36177, 29681, 37305],
  ap: [7057, 2843, 4114, 6174, 5204, 7747, 8932],
  ae: [49799, 68256, 84126, 83999, 97921, 126508, 113115],
  cn: [280601, 289490, 298661, 340257, 762455, 764891, 767335],
  co: [30918, 33243, 49844, 11334, 70875, 87706, 140070],
  cx: [3104, 1873, 3534, 3458, 2124, 1363, 2075],
  cu: [3510, 3723, 4315, 5664, 6034, 6305, 6624],
  gr: [94.7, 95, 97, 97.8, 97.9, 97.4, 97.2],
  nr: [113, 109.5, 110, 108.5, 110.3, 111.9, 112.8],
  av: [652, 847, 1121, 1345, 1631, 2055, 2507],
  em: [1580, 1718, 2106, 2447, 2526, 2828, 2860]
};

const tR = HY.map((_, i) => H.sr[i] + H.pr[i]);
const tC = HY.map((_, i) => H.cs[i] + H.cp[i]);
const GP = HY.map((_, i) => tR[i] - tC[i]);
const tO = HY.map((_, i) => H.rd[i] + H.sm[i] + H.ga[i]);
const OI = HY.map((_, i) => GP[i] - tO[i]);
const PB = HY.map((_, i) => OI[i] + H.ii[i] - H.ie[i] + H.oi[i]);
const NI = HY.map((_, i) => PB[i] - H.tx[i]);
const FC = HY.map((_, i) => H.co[i] - H.cx[i]);
const CS = HY.map((_, i) => H.ca[i] + H.ms[i]);
const tE = HY.map((_, i) => tC[i] + tO[i]);
const tD = HY.map((_, i) => H.dr[i] + H.dn[i]);
const sPC = HY.map((_, i) => H.sr[i] / H.cu[i]);

/* INTERPOLATION */
function interp(m, s, e, n) {
  let r = [];
  for (let i = 0; i < n; i++) {
    let t = n <= 1 ? 1 : i / (n - 1), v;
    if (m === "linear") v = s + (e - s) * t;
    else if (m === "accelerating") v = s + (e - s) * t * t;
    else if (m === "decaying") v = s + (e - s) * (1 - Math.pow(1 - t, 2));
    else { let k = 8, sg = 1 / (1 + Math.exp(-k * (t - .5))), s0 = 1 / (1 + Math.exp(-k * (-.5))), s1 = 1 / (1 + Math.exp(-k * .5)); v = s + (e - s) * (sg - s0) / (s1 - s0); }
    r.push(Math.round(v * 100) / 100);
  }
  return r;
}

/* PROJECTION DEFAULTS */
const PD = {
  base: { l: "Base", sg: { s: 18, e: 9, m: "decaying" }, vg: { s: 1, e: -2, m: "linear" }, sc: { s: 16.5, e: 14.3, m: "linear" }, vc: { s: 73, e: 64, m: "linear" }, rd: { s: 23.5, e: 19, m: "linear" }, sm: { s: 44.5, e: 35.5, m: "linear" }, ga: { s: 12.5, e: 10.3, m: "linear" }, sb: { s: 13, e: 8.5, m: "linear" }, cx: { s: 0.25, e: 0.25, m: "linear" }, ad: { s: 68, e: 60, m: "linear" }, dp: { s: 62, e: 51, m: "linear" }, rg: { s: 8, e: 4, m: "decaying" }, ir: 3.8, ie: 12.5, tx: 5, w: 9, tg: 1 },
  bull: { l: "Bull", sg: { s: 22, e: 13, m: "decaying" }, vg: { s: 3, e: -1, m: "linear" }, sc: { s: 16, e: 11.5, m: "linear" }, vc: { s: 72, e: 55, m: "linear" }, rd: { s: 23, e: 16.5, m: "linear" }, sm: { s: 43, e: 32, m: "linear" }, ga: { s: 12, e: 8.8, m: "linear" }, sb: { s: 12.5, e: 8, m: "linear" }, cx: { s: 0.25, e: 0.25, m: "linear" }, ad: { s: 66, e: 52, m: "linear" }, dp: { s: 61, e: 52, m: "linear" }, rg: { s: 10, e: 5, m: "decaying" }, ir: 4, ie: 12.5, tx: 4, w: 9, tg: 2 },
  bear: { l: "Bear", sg: { s: 14, e: 4, m: "decaying" }, vg: { s: -1, e: -5, m: "linear" }, sc: { s: 17, e: 18, m: "linear" }, vc: { s: 75, e: 78, m: "linear" }, rd: { s: 24.5, e: 25, m: "linear" }, sm: { s: 46, e: 44.5, m: "linear" }, ga: { s: 13.5, e: 13, m: "linear" }, sb: { s: 14, e: 14, m: "linear" }, cx: { s: 0.3, e: 0.3, m: "linear" }, ad: { s: 70, e: 72, m: "linear" }, dp: { s: 62, e: 62, m: "linear" }, rg: { s: 5, e: 2, m: "linear" }, ir: 3, ie: 12.5, tx: 7, w: 10, tg: -2 }
};

function calcP(s) {
  const a = {};
  ["sg", "vg", "sc", "vc", "rd", "sm", "ga", "sb", "cx", "ad", "dp", "rg"].forEach(k => {
    a[k] = interp(s[k].m, s[k].s, s[k].e, 10);
  });
  let r = [], pS = H.sr[HL], pP = H.pr[HL], pCa = CS[HL], pAr = H.ar[HL], pDr = H.dr[HL], pAp = H.ap[HL], pAe = H.ae[HL], pRpc = sPC[HL];
  for (let i = 0; i < 10; i++) {
    let sub = Math.round(pS * (1 + a.sg[i] / 100));
    let ps = Math.round(pP * (1 + a.vg[i] / 100));
    let rev = sub + ps;
    let rpc = Math.round(pRpc * (1 + a.rg[i] / 100));
    let cu = rpc > 0 ? Math.round(sub / rpc) : 0;
    let cSub = Math.round(sub * a.sc[i] / 100);
    let cPs = Math.round(ps * a.vc[i] / 100);
    let tCr = cSub + cPs, gp = rev - tCr;
    let rd = Math.round(rev * a.rd[i] / 100);
    let sm = Math.round(rev * a.sm[i] / 100);
    let ga = Math.round(rev * a.ga[i] / 100);
    let tOp = rd + sm + ga, op = gp - tOp;
    let ii = Math.round(pCa * s.ir / 100);
    let ie2 = Math.round(s.ie * 1000);
    let pb = op + ii - ie2;
    let tx = pb > 0 ? Math.round(pb * s.tx / 100) : 0;
    let ni = pb - tx;
    let sb2 = Math.round(rev * a.sb[i] / 100);
    let cx2 = Math.round(rev * a.cx[i] / 100);
    let ar = Math.round(rev * a.ad[i] / 365);
    let dr = Math.round(rev * a.dp[i] / 100);
    let ap = Math.round(tCr * 18 / 365);
    let ae = Math.round(rev * 12.5 / 100);
    let wc = (ar - pAr) - (dr - pDr) - (ap - pAp) - (ae - pAe);
    let cfo = ni + sb2 + Math.round(rev * 0.02) - wc;
    let fcf = cfo - cx2;
    let nCa = pCa + fcf;
    r.push({ y: 2026 + i, sub, ps, rev, cSub, cPs, tCr, gp, rd, sm, ga, tOp, op, ii, ie: ie2, pb, tx, ni, sb: sb2, cx: cx2, ar, dr, ap, ae, cfo, fcf, ca: nCa, cu, rpc });
    pS = sub; pP = ps; pCa = nCa; pAr = ar; pDr = dr; pAp = ap; pAe = ae; pRpc = rpc;
  }
  return r;
}

const deep = o => JSON.parse(JSON.stringify(o));

/* STYLES */
const iS = { background: C.bg, border: "1px solid " + C.bd, color: C.tx, borderRadius: 8, padding: "7px 11px", width: "100%", fontSize: 13, outline: "none", fontFamily: ff, fontWeight: 500 };
const sS = { ...iS, cursor: "pointer" };
const dC = { background: C.cd, border: "1px solid " + C.bd, borderRadius: 12, padding: 16 };
const wC = { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: 14, position: "relative" };
const cT = { fill: "#666", fontSize: 9, fontFamily: ff, fontWeight: 500 };
const cTT = { background: "#fff", border: "1px solid #ddd", fontFamily: ff, fontSize: 11, color: "#333", borderRadius: 6 };
const thS = { padding: "5px 6px", fontSize: 10, fontWeight: 700, color: "#333", textAlign: "right", borderBottom: "2px solid #bbb" };
const shS = { padding: "7px 8px", fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "2px solid #1a3a7a", borderTop: "3px solid #fff", textAlign: "left", position: "sticky", left: 0, zIndex: 1, background: "#1e3a6e" };

/* COMPONENTS */
const SH = (t, c, light) => { const d = light ? "#444" : "#e0e0e0"; return <div style={{ color: c || d, fontSize: 12, fontFamily: ff, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid " + (c || d) + "55" }}>{t}</div>; };

const Sl = ({ l, v, mn, mx, st, u, on }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
      <span style={{ color: C.ts, fontSize: 9, fontWeight: 600 }}>{l}</span>
      <span style={{ color: C.bl, fontSize: 11, fontWeight: 700 }}>{v}{u || "%"}</span>
    </div>
    <input type="range" min={mn} max={mx} step={st || 0.5} value={v} onChange={e => on(+e.target.value)} style={{ width: "100%", accentColor: C.bl, height: 3, cursor: "pointer" }} />
  </div>
);

const KP = ({ l, v, s, c }) => (
  <div style={{ background: C.cd, border: "1px solid " + C.bd, borderRadius: 10, padding: "10px 12px", borderTop: "3px solid " + (c || C.bl), flex: 1, minWidth: 0 }}>
    <div style={{ color: C.ts, fontSize: 8, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{l}</div>
    <div style={{ color: c || C.bl, fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>{v}</div>
    {s && <div style={{ color: C.td, fontSize: 9, fontWeight: 600, marginTop: 1 }}>{s}</div>}
  </div>
);

const AIB = ({ on }) => (
  <button onClick={on} style={{ position: "absolute", top: 8, right: 8, background: "transparent", border: "1px solid #ccc", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }} title="AI Insights">
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <path d="M12 1C12 1 13.2 7.2 13.5 8.5C14.8 9 21 10 21 10C21 10 14.8 11 13.5 11.5C13.2 12.8 12 19 12 19C12 19 10.8 12.8 10.5 11.5C9.2 11 3 10 3 10C3 10 9.2 9 10.5 8.5C10.8 7.2 12 1 12 1Z" fill="#4ADE80" />
      <path d="M19.5 14C19.5 14 20 15.8 20.2 16.3C20.7 16.5 22.5 17 22.5 17C22.5 17 20.7 17.5 20.2 17.7C20 18.2 19.5 20 19.5 20C19.5 20 19 18.2 18.8 17.7C18.3 17.5 16.5 17 16.5 17C16.5 17 18.3 16.5 18.8 16.3C19 15.8 19.5 14 19.5 14Z" fill="#4ADE80" opacity={0.7} />
    </svg>
  </button>
);

const AIM = ({ o, cl, t, b }) => {
  if (!o) return null;
  return <div onClick={cl} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 520, width: "90%", maxHeight: "80vh", overflow: "auto" }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", fontFamily: ff, margin: "0 0 14px" }}>{t}</h3>
      <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7, fontFamily: ff }}>{b}</div>
      <button onClick={cl} style={{ marginTop: 16, background: "#f0f0f0", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontFamily: ff, fontSize: 12, fontWeight: 700 }}>Close</button>
    </div>
  </div>;
};

const CW = ({ children, t, at, ab }) => {
  const [o, sO] = useState(false);
  return <div style={wC}>{SH(t, null, true)}<AIB on={() => sO(true)} />{children}<AIM o={o} cl={() => sO(false)} t={at || t} b={ab || ""} /></div>;
};

const AC = ({ l, o, on, mn, mx, st, u, h }) => (
  <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 8, border: "1px solid " + C.bd }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
      <span style={{ color: C.cy, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{l}</span>
      {h && <span style={{ color: C.td, fontSize: 8 }}>H:{h}</span>}
    </div>
    <select value={o.m} onChange={e => on({ ...o, m: e.target.value })} style={{ ...sS, padding: "3px 6px", fontSize: 10, width: "100%", marginBottom: 3 }}>
      <option value="linear">Linear</option><option value="accelerating">Accel</option><option value="decaying">Decay</option><option value="s-curve">S-Curve</option>
    </select>
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: 1 }}><Sl l="Y1" v={o.s} mn={mn} mx={mx} st={st || 0.5} u={u || "%"} on={v => on({ ...o, s: v })} /></div>
      <div style={{ flex: 1 }}><Sl l="Y10" v={o.e} mn={mn} mx={mx} st={st || 0.5} u={u || "%"} on={v => on({ ...o, e: v })} /></div>
    </div>
  </div>
);

/* INSIGHTS */
const IN = {
  rb: { t: "Revenue Momentum Accelerating", b: "Total revenue grew from $298M to $885M over 6 years (CAGR ~20%), with S&S now representing 92% of the mix vs 83% in 2019. Services revenue has flatlined, signaling a successful platform-led delivery model." },
  gr: { t: "Growth Decelerating but Healthy", b: "Revenue growth moderated from 28% in 2021 to 16% in 2025, following a natural maturation curve. S&S growth has remained consistently above total revenue growth." },
  ex: { t: "Operating Leverage Emerging", b: "Total expenses as % of revenue dropped from 121% in 2019 to 105% in 2025. S&M remains the largest expense at 46% but is trending down. The path to sustained profitability hinges on continued S&M efficiency gains." },
  mg: { t: "Path to Profitability Clear", b: "Op margin improved from -15% to -5%, a 10pp improvement. FCF margin accelerated faster, reaching 15.6% in FY2025 driven by strong working capital dynamics from the deferred revenue model." },
  fc: { t: "FCF Inflection Achieved", b: "FCF surged from $28M to $138M, a nearly 5x increase. FCF margin expanded from 9.3% to 15.6%, with the most dramatic improvement in FY2023-2025 as scale benefits kicked in." },
  hc: { t: "Productivity Gains Accelerating", b: "Revenue per employee grew from $188K to $309K (+64%). Headcount growth slowed to just 1% in FY2025 vs 23% in 2021, while revenue continues mid-teens growth." },
  cu: { t: "Land & Expand Working", b: "Customer count grew from 3,510 to 6,624 (89% increase), while revenue per customer nearly doubled. Net retention rates consistently above 110% indicate strong upsell and cross-sell." },
  rt: { t: "Best-in-Class Retention", b: "NRR consistently above 110% with GRR above 97% represents elite SaaS metrics. The slight GRR softening from 97.9% to 97.2% bears monitoring but remains well above the 90%+ enterprise benchmark." },
  r4: { t: "Rule of 40 Breakout", b: "Rule of 40 score improved from 22 in 2020 to 32 in 2025, approaching the critical 40 threshold that signals elite SaaS performance." },
  pR: { t: "Revenue Scale Trajectory", b: "Based on current assumptions, revenue is projected to grow from $885M to over $2B+ within the projection period." },
  pM: { t: "Margin Expansion Runway", b: "The model projects significant margin expansion as operating leverage compounds. FCF margins should lead operating margins given the working capital dynamics." },
  pE: { t: "Expense Discipline Driving Leverage", b: "All major expense categories projected to decline as % of revenue, with S&M showing the largest absolute decline." }
};

/* TABLE ROWS */
const HR = ({ l, d, b, sub, pct, nf, u, sec }) => {
  if (sec) return <tr><td colSpan={16} style={shS}>{l}</td></tr>;
  const v = d || [];
  const yy = v.map((x, i) => i >= 2 ? yoy(x, v[i - 1]) : null);
  const c6 = v[0] > 0 && v[6] > 0 ? cagr(v[0], v[6], 6) : null;
  const c4 = v[2] > 0 && v[6] > 0 ? cagr(v[2], v[6], 4) : null;
  const c2 = v[4] > 0 && v[6] > 0 ? cagr(v[4], v[6], 2) : null;
  const f2 = x => { if (nf) return x == null ? "—" : fcm(x); if (pct) return x == null ? "—" : fp(x); return x == null ? "—" : fmn(x); };
  const bg = b ? "#ebeef3" : sub ? "#f2f4f8" : "#fff";
  const fw = b ? 700 : sub ? 600 : 400;
  const bc = b ? "2px solid #c8ccd5" : "1px solid " + (sub ? "#dde" : "#eef0f3");
  const yc = x => x == null ? "#ccc" : x < 0 ? "#c33" : "#222";
  return <tr style={{ background: bg }}>
    <td style={{ position: "sticky", left: 0, background: bg, zIndex: 1, padding: "5px 8px", fontSize: 11, fontWeight: fw, color: "#222", borderBottom: bc, textAlign: "left", whiteSpace: "nowrap", minWidth: 180 }}>{l}{u && <span style={{ color: "#999" }}> {u}</span>}</td>
    {v.map((x, i) => <td key={i} style={{ padding: "5px 6px", fontSize: 11, fontWeight: b ? 600 : 400, color: "#222", borderBottom: bc, textAlign: "right", borderRight: i === 6 ? "3px solid #fff" : "none" }}>{f2(x)}</td>)}
    {[yy[2], yy[3], yy[4], yy[5], yy[6]].map((x, i) => <td key={"y" + i} style={{ padding: "5px 6px", fontSize: 10, color: yc(x), borderBottom: bc, textAlign: "right", background: bg === "#fff" ? "#fafbfe" : bg, borderRight: i === 4 ? "3px solid #fff" : "none" }}>{x == null ? "—" : fp(x)}</td>)}
    {[c6, c4, c2].map((x, i) => <td key={"c" + i} style={{ padding: "5px 6px", fontSize: 10, color: x == null ? "#ccc" : "#222", borderBottom: bc, textAlign: "right", background: bg === "#fff" ? "#f5f6fb" : bg }}>{x == null ? "—" : fp(x)}</td>)}
  </tr>;
};

const PT = ({ l, hv, pv, b, sub, sec, nf }) => {
  if (sec) return <tr><td colSpan={14} style={shS}>{l}</td></tr>;
  const bg = b ? "#ebeef3" : sub ? "#f2f4f8" : "#fff";
  const fw = b ? 700 : sub ? 600 : 400;
  const bc = b ? "2px solid #c8ccd5" : "1px solid " + (sub ? "#dde" : "#eef0f3");
  const hcV = hv ? fp(cagr(hv[0], hv[HL], 6)) : "—";
  const pcV = (hv && pv) ? fp(cagr(hv[HL], pv[9], 10)) : "—";
  const f3 = nf ? fcm : fmn;
  return <tr style={{ background: bg }}>
    <td style={{ position: "sticky", left: 0, background: bg, zIndex: 1, padding: "4px 8px", fontSize: 11, fontWeight: fw, color: "#222", borderBottom: bc, textAlign: "left", whiteSpace: "nowrap", minWidth: 165 }}>{l}</td>
    <td style={{ padding: "4px 6px", fontSize: 11, fontWeight: fw, color: "#1a5a1a", borderBottom: bc, textAlign: "right", background: bg === "#fff" ? "#f4faf4" : bg, borderRight: "3px solid #fff" }}>{hv ? f3(hv[HL]) : "—"}</td>
    {(pv || []).map((x, i) => <td key={i} style={{ padding: "4px 6px", fontSize: 11, fontWeight: fw, color: "#222", borderBottom: bc, textAlign: "right", borderRight: i === 9 ? "3px solid #fff" : "none" }}>{f3(x)}</td>)}
    <td style={{ padding: "4px 6px", fontSize: 10, color: "#222", borderBottom: bc, textAlign: "right", background: bg === "#fff" ? "#f8f9ff" : bg }}>{hcV}</td>
    <td style={{ padding: "4px 6px", fontSize: 10, color: "#222", borderBottom: bc, textAlign: "right", background: bg === "#fff" ? "#f8f9ff" : bg }}>{pcV}</td>
  </tr>;
};

const PP = ({ l, hv, pv, b }) => {
  const bg = b ? "#ebeef3" : "#fff";
  const bc = b ? "1px solid #ccd" : "1px solid #eef0f3";
  const yc = x => x == null ? "#ccc" : x < 0 ? "#c33" : "#222";
  return <tr style={{ background: bg }}>
    <td style={{ position: "sticky", left: 0, background: bg, zIndex: 1, padding: "3px 8px", fontSize: 10, color: "#888", borderBottom: bc, textAlign: "left" }}>{l}</td>
    <td style={{ padding: "3px 6px", fontSize: 10, color: yc(hv), borderBottom: bc, textAlign: "right", background: bg === "#fff" ? "#f4faf4" : bg, borderRight: "3px solid #fff" }}>{hv != null ? fp(hv) : "—"}</td>
    {(pv || []).map((x, i) => <td key={i} style={{ padding: "3px 6px", fontSize: 10, color: yc(x), borderBottom: bc, textAlign: "right", borderRight: i === 9 ? "3px solid #fff" : "none" }}>{fp(x)}</td>)}
    <td colSpan={2} style={{ borderBottom: bc }}></td>
  </tr>;
};

/* APP */
export default function App() {
  const [tab, sTab] = useState("home");
  const [hfy, sHfy] = useState(HL);
  const [psc, sPsc] = useState("base");
  const [pa, sPa] = useState({ base: deep(PD.base), bull: deep(PD.bull), bear: deep(PD.bear) });
  const cp = 60, sh = 58.3, nc = 100;

  const upa = useCallback((k, v) => { sPa(p => { let n = deep(p); n[psc][k] = v; return n; }); }, [psc]);
  const rp = useCallback(() => { sPa(p => { let n = deep(p); n[psc] = deep(PD[psc]); return n; }); }, [psc]);
  const pA = pa[psc];
  const pd = useMemo(() => calcP(pA), [pA]);
  const pAll = useMemo(() => ({ base: calcP(pa.base), bull: calcP(pa.bull), bear: calcP(pa.bear) }), [pa]);

  const pVal = useMemo(() => {
    let out = {};
    Object.entries(pAll).forEach(([k, arr]) => {
      const pa2 = pa[k];
      if (pa2.w / 100 <= pa2.tg / 100) { out[k] = { pps: 0, ev: 0, cagr2: 0, tvp: 0 }; return; }
      const d = arr.map((p3, i) => p3.fcf / Math.pow(1 + pa2.w / 100, i + 1));
      const tv = arr[9].fcf * (1 + pa2.tg / 100) / (pa2.w / 100 - pa2.tg / 100);
      const pvt = tv / Math.pow(1 + pa2.w / 100, 10);
      const pvf = d.reduce((a, b2) => a + b2, 0);
      const ev = pvf + pvt, eq = ev + nc * 1000;
      out[k] = { pps: eq / (sh * 1000), ev, cagr2: (Math.pow(arr[9].rev / tR[HL], 1 / 10) - 1) * 100, tvp: ev > 0 ? pvt / ev * 100 : 0 };
    });
    return out;
  }, [pAll, pa]);

  const hd = useMemo(() => HY.map((yr, i) => ({
    year: String(yr), ssR: +(H.sr[i] / 1000).toFixed(1), svR: +(H.pr[i] / 1000).toFixed(1),
    gm: +(GP[i] / tR[i] * 100).toFixed(1), oM: +(OI[i] / tR[i] * 100).toFixed(1), nM: +(NI[i] / tR[i] * 100).toFixed(1),
    fcf: +(FC[i] / 1000).toFixed(1), fM: +(FC[i] / tR[i] * 100).toFixed(1),
    crP: +(tC[i] / tR[i] * 100).toFixed(1), rdP: +(H.rd[i] / tR[i] * 100).toFixed(1),
    smP: +(H.sm[i] / tR[i] * 100).toFixed(1), gaP: +(H.ga[i] / tR[i] * 100).toFixed(1),
    toP: +(tO[i] / tR[i] * 100).toFixed(1), teP: +(tE[i] / tR[i] * 100).toFixed(1),
    sbP: +(H.sb[i] / tR[i] * 100).toFixed(1),
    cu: H.cu[i], rpc: Math.round(tR[i] / H.cu[i]), em: H.em[i], rpe: Math.round(tR[i] / H.em[i]),
    nr: H.nr[i], gr2: H.gr[i],
    r40: i > 0 ? +(yoy(tR[i], tR[i - 1]) + FC[i] / tR[i] * 100).toFixed(1) : null,
    rG: i > 0 ? +yoy(tR[i], tR[i - 1]).toFixed(1) : null,
    sG: i > 0 ? +yoy(H.sr[i], H.sr[i - 1]).toFixed(1) : null
  })), []);

  const cbd = useMemo(() => {
    let all = [];
    HY.forEach((yr, i) => {
      all.push({ year: String(yr), t: "h", rev: +(tR[i] / 1000).toFixed(1), gm: +(GP[i] / tR[i] * 100).toFixed(1), oM: +(OI[i] / tR[i] * 100).toFixed(1), fM: +(FC[i] / tR[i] * 100).toFixed(1), fcf: +(FC[i] / 1000).toFixed(1), rdP: +(H.rd[i] / tR[i] * 100).toFixed(1), smP: +(H.sm[i] / tR[i] * 100).toFixed(1), gaP: +(H.ga[i] / tR[i] * 100).toFixed(1), toP: +(tO[i] / tR[i] * 100).toFixed(1), teP: +(tE[i] / tR[i] * 100).toFixed(1), crP: +(tC[i] / tR[i] * 100).toFixed(1), cu: H.cu[i], rpc: Math.round(sPC[i]) });
    });
    pd.forEach(d => {
      all.push({ year: String(d.y), t: "p", rev: +(d.rev / 1000).toFixed(1), gm: +(d.gp / d.rev * 100).toFixed(1), oM: +(d.op / d.rev * 100).toFixed(1), fM: +(d.fcf / d.rev * 100).toFixed(1), fcf: +(d.fcf / 1000).toFixed(1), rdP: +(d.rd / d.rev * 100).toFixed(1), smP: +(d.sm / d.rev * 100).toFixed(1), gaP: +(d.ga / d.rev * 100).toFixed(1), toP: +(d.tOp / d.rev * 100).toFixed(1), teP: +((d.tCr + d.tOp) / d.rev * 100).toFixed(1), crP: +(d.tCr / d.rev * 100).toFixed(1), cu: d.cu, rpc: d.rpc });
    });
    return all;
  }, [pd]);

  const tabs = ["home", "historical", "projections"];
  const tl = { home: "Home", historical: "Historical", projections: "Projections" };

  const globalCSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    input[type=range]{-webkit-appearance:none;background:${C.bd};height:3px;border-radius:2px}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:${C.bl};cursor:pointer}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:${C.bg}}
    ::-webkit-scrollbar-thumb{background:#444;border-radius:3px}
    .sc-btn{background:none;border:2px solid ${C.bd};cursor:pointer;font-family:${ff};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 16px;border-radius:6px}
  `;

  return <div style={{ background: C.bg, minHeight: "100vh", fontFamily: ff, color: C.tx }}>
    <style>{globalCSS}</style>

    {/* HEADER */}
    <div style={{ background: "linear-gradient(135deg,#1a1a1a,#222)", borderBottom: "1px solid #333", padding: "0 28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg," + C.bl + ",#00AAFF)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>W</span></div>
            <span style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase" }}>Valuation Engine</span>
          </div>
          <span style={{ color: C.tx, fontSize: 18, fontWeight: 800 }}>Workiva</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "projections" && Object.entries(PD).map(([k, v]) => {
            const c = k === "bear" ? C.rd : k === "bull" ? C.gn : C.cy;
            return <button key={k} className="sc-btn" style={{ borderColor: psc === k ? c : C.bd, color: psc === k ? c : C.td }} onClick={() => sPsc(k)}>{v.l}</button>;
          })}
        </div>
      </div>
      <div style={{ display: "flex" }}>{tabs.map(t => <button key={t} onClick={() => sTab(t)} style={{ background: "none", border: "none", color: tab === t ? C.bl : C.td, fontFamily: ff, fontSize: 11, fontWeight: tab === t ? 700 : 600, letterSpacing: ".06em", textTransform: "uppercase", padding: "8px 16px", borderBottom: tab === t ? "3px solid " + C.bl : "3px solid transparent", cursor: "pointer", whiteSpace: "nowrap" }}>{tl[t]}</button>)}</div>
    </div>

    {/* HOME */}
    {tab === "home" && <div style={{ height: "calc(100vh - 90px)", overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", background: "linear-gradient(160deg,#1a1a1a,#111,#0a0a0a)", position: "relative" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle at 30% 40%," + C.bl + "44,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ marginTop: 100, marginBottom: 60, textAlign: "left", maxWidth: 800, width: "100%", padding: "0 60px", position: "relative", zIndex: 1 }}>
        <div style={{ color: "#666", fontSize: 16, fontWeight: 700, letterSpacing: ".25em", textTransform: "uppercase", marginBottom: 24 }}>workiva inc.</div>
        <h1 style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.05, color: "#fff", marginBottom: 24 }}>Valuation<br />Engine</h1>
        <p style={{ color: "#666", fontSize: 20, fontWeight: 400, marginBottom: 70, maxWidth: 550 }}>Interactive Historical Analysis & Full P&L / Balance Sheet / Cash Flow Projections with Scenario Modeling</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 700, width: "100%", padding: "0 60px", position: "relative", zIndex: 1 }}>
        {[{ t: "Historical Performance", tb: "historical", d: "Complete 7-year financial analysis with 9 interactive charts, AI-powered insights, KPI dashboard and detailed data tables." }, { t: "Projections Model", tb: "projections", d: "10-year P&L, BS & CF projections with curve-based Bear/Base/Bull scenario controls, customer modeling, and integrated DCF valuation." }].map((x, i) =>
          <div key={i} onClick={() => sTab(x.tb)} style={{ background: C.cd, border: "1px solid " + C.bd, borderRadius: 16, padding: 28, cursor: "pointer", borderTop: "4px solid " + C.bl + "55" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><span style={{ color: "#e0e0e0", fontSize: 18, fontWeight: 700 }}>{x.t}</span><span style={{ color: C.bl, fontSize: 22 }}>→</span></div>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7 }}>{x.d}</p>
          </div>
        )}
      </div>
    </div>}

    {/* MAIN LAYOUT */}
    {tab !== "home" && <div style={{ display: "flex", height: "calc(100vh - 90px)", overflow: "hidden" }}>

      {/* LEFT SIDEBAR */}
      {tab === "projections" && <div style={{ width: 300, flexShrink: 0, background: C.sf, borderRight: "1px solid " + C.bd, overflowY: "auto", padding: 10 }}>
        <div style={{ ...dC, padding: 8, marginBottom: 8 }}>{SH("Historical Reference")}
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            {[{ l: "S&S Gr%", v: fp(yoy(H.sr[HL], H.sr[HL - 1])) }, { l: "Rev/Cust Gr%", v: fp(yoy(sPC[HL], sPC[HL - 1])) }, { l: "S&S CoS%", v: fp(H.cs[HL] / H.sr[HL] * 100) }, { l: "R&D%", v: fp(H.rd[HL] / tR[HL] * 100) }, { l: "S&M%", v: fp(H.sm[HL] / tR[HL] * 100) }, { l: "G&A%", v: fp(H.ga[HL] / tR[HL] * 100) }, { l: "FCF Mg%", v: fp(FC[HL] / tR[HL] * 100) }].map((r, i) => <tr key={i}><td style={{ fontSize: 9, color: C.ts, padding: "2px 3px" }}>{r.l}</td><td style={{ fontSize: 9, color: C.tx, padding: "2px 3px", textAlign: "right", fontWeight: 600 }}>{r.v}</td></tr>)}
          </tbody></table>
        </div>
        <div style={{ ...dC, padding: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            {SH(PD[psc].l + " Assumptions", psc === "bear" ? C.rd : psc === "bull" ? C.gn : C.cy)}
            <button onClick={rp} style={{ background: C.rd + "22", border: "1px solid " + C.rd, color: C.rd, borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 9, fontWeight: 700 }}>Reset</button>
          </div>
          <AC l="S&S Rev Growth" o={pA.sg} on={v => upa("sg", v)} mn={-5} mx={40} st={1} h={fp(yoy(H.sr[HL], H.sr[HL - 1]))} />
          <AC l="S&S Rev/Cust Gr" o={pA.rg} on={v => upa("rg", v)} mn={-5} mx={25} st={1} h={fp(yoy(sPC[HL], sPC[HL - 1]))} />
          <AC l="Services Rev Gr" o={pA.vg} on={v => upa("vg", v)} mn={-20} mx={20} st={1} />
          <AC l="S&S CoS %" o={pA.sc} on={v => upa("sc", v)} mn={5} mx={30} />
          <AC l="Svc CoS %" o={pA.vc} on={v => upa("vc", v)} mn={40} mx={95} />
          <AC l="R&D %" o={pA.rd} on={v => upa("rd", v)} mn={10} mx={35} />
          <AC l="S&M %" o={pA.sm} on={v => upa("sm", v)} mn={20} mx={55} />
          <AC l="G&A %" o={pA.ga} on={v => upa("ga", v)} mn={5} mx={20} />
          <AC l="SBC %" o={pA.sb} on={v => upa("sb", v)} mn={3} mx={20} />
          <AC l="CapEx %" o={pA.cx} on={v => upa("cx", v)} mn={0} mx={3} st={0.05} />
          <AC l="AR Days" o={pA.ad} on={v => upa("ad", v)} mn={30} mx={100} st={1} u="d" />
          <AC l="Def Rev %" o={pA.dp} on={v => upa("dp", v)} mn={30} mx={80} />
          <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", border: "1px solid " + C.bd }}>
            <div style={{ color: C.or, fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Valuation</div>
            <Sl l="WACC" v={pA.w} mn={5} mx={18} st={0.5} on={v => upa("w", v)} />
            <Sl l="TGR" v={pA.tg} mn={-5} mx={5} st={0.25} on={v => upa("tg", v)} />
            <Sl l="Int Rate" v={pA.ir} mn={0} mx={8} st={0.1} on={v => upa("ir", v)} />
            <Sl l="Tax" v={pA.tx} mn={0} mx={25} st={0.5} on={v => upa("tx", v)} />
          </div>
        </div>
      </div>}

      {/* RIGHT CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18, background: C.bg }}>

        {/* HISTORICAL */}
        {tab === "historical" && <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "stretch", flexWrap: "wrap" }}>
            <div style={{ background: C.cd, border: "1px solid " + C.bd, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 70 }}>
              <div style={{ color: C.ts, fontSize: 8, fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>FY</div>
              <select value={hfy} onChange={e => sHfy(+e.target.value)} style={{ ...sS, width: 72, textAlign: "center", fontSize: 13, fontWeight: 800, padding: "5px 6px" }}>
                {HY.map((y, i) => <option key={i} value={i}>{y}</option>)}
              </select>
            </div>
            <KP l="Revenue ($M)" v={"$" + fmn(tR[hfy]) + "M"} s={hfy > 0 ? fp(yoy(tR[hfy], tR[hfy - 1])) + " YoY" : ""} c={C.bl} />
            <KP l="Gross Margin" v={fp(GP[hfy] / tR[hfy] * 100)} s={fp((GP[hfy] / tR[hfy] - GP[0] / tR[0]) * 100) + "pp vs '19"} c={C.gn} />
            <KP l="Op Margin" v={fp(OI[hfy] / tR[hfy] * 100)} s={hfy > 0 ? fp((OI[hfy] / tR[hfy] - OI[hfy - 1] / tR[hfy - 1]) * 100) + "pp YoY" : ""} c={OI[hfy] > 0 ? C.gn : C.rd} />
            <KP l="FCF ($M)" v={"$" + fmn(FC[hfy]) + "M"} s={fp(FC[hfy] / tR[hfy] * 100) + " mg"} c={C.cy} />
            <KP l="NRR" v={H.nr[hfy] + "%"} s={hfy > 0 ? "vs " + H.nr[hfy - 1] + "% PY" : ""} c={C.or} />
            <KP l="Customers" v={fcm(H.cu[hfy])} s={hfy > 0 ? fp(yoy(H.cu[hfy], H.cu[hfy - 1])) + " YoY" : ""} c={C.bl} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
            <CW t="Revenue Breakdown ($M)" at={IN.rb.t} ab={IN.rb.b}><ResponsiveContainer width="100%" height={200}><ComposedChart data={hd} margin={{ top: 12, right: 35, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis yAxisId="l" tick={cT} width={45} /><YAxis yAxisId="r" orientation="right" tick={cT} width={35} unit="%" domain={[60, 85]} /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Bar dataKey="ssR" name="S&S" yAxisId="l" stackId="a" fill={C.bl} /><Bar dataKey="svR" name="Services" yAxisId="l" stackId="a" fill={C.or} radius={[3, 3, 0, 0]} /><Line dataKey="gm" name="GM%" yAxisId="r" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ fill: C.gn, r: 2.5 }} /></ComposedChart></ResponsiveContainer></CW>
            <CW t="Growth Rates" at={IN.gr.t} ab={IN.gr.b}><ResponsiveContainer width="100%" height={200}><LineChart data={hd.slice(1)} margin={{ top: 12, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis tick={cT} width={35} unit="%" /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Line dataKey="rG" name="Total Rev" type="monotone" stroke={C.bl} strokeWidth={1.5} dot={{ fill: C.bl, r: 2.5 }} /><Line dataKey="sG" name="S&S" type="monotone" stroke={C.gn} strokeWidth={1.2} dot={{ fill: C.gn, r: 2 }} strokeDasharray="4 2" /></LineChart></ResponsiveContainer></CW>
            <CW t="Expenses % Revenue" at={IN.ex.t} ab={IN.ex.b}><ResponsiveContainer width="100%" height={200}><LineChart data={hd} margin={{ top: 12, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis tick={cT} width={35} unit="%" domain={[0, 120]} /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 8, fontWeight: 600 }} /><Line dataKey="crP" name="CoR" type="monotone" stroke="#999" strokeWidth={1.2} dot={{ r: 1.5 }} /><Line dataKey="rdP" name="R&D" type="monotone" stroke={C.bl} strokeWidth={1} dot={{ r: 1.5 }} strokeDasharray="4 2" /><Line dataKey="smP" name="S&M" type="monotone" stroke={C.or} strokeWidth={1} dot={{ r: 1.5 }} strokeDasharray="4 2" /><Line dataKey="gaP" name="G&A" type="monotone" stroke={C.pu} strokeWidth={1} dot={{ r: 1.5 }} strokeDasharray="4 2" /><Line dataKey="toP" name="OpEx" type="monotone" stroke={C.rd} strokeWidth={1.3} dot={{ r: 2 }} /><Line dataKey="teP" name="Total" type="monotone" stroke="#333" strokeWidth={1.5} dot={{ r: 2.5 }} /></LineChart></ResponsiveContainer></CW>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
            <CW t="Margin Trends (%)" at={IN.mg.t} ab={IN.mg.b}><ResponsiveContainer width="100%" height={200}><LineChart data={hd} margin={{ top: 12, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis tick={cT} width={35} unit="%" /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Line dataKey="oM" name="Operating" type="monotone" stroke={C.bl} strokeWidth={1.5} dot={{ fill: C.bl, r: 2.5 }} /><Line dataKey="nM" name="Net" type="monotone" stroke={C.pu} strokeWidth={1.2} dot={{ fill: C.pu, r: 2 }} /><Line dataKey="fM" name="FCF" type="monotone" stroke={C.cy} strokeWidth={1.2} dot={{ fill: C.cy, r: 2 }} strokeDasharray="4 2" /><ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" /></LineChart></ResponsiveContainer></CW>
            <CW t="Free Cash Flow ($M)" at={IN.fc.t} ab={IN.fc.b}><ResponsiveContainer width="100%" height={200}><ComposedChart data={hd} margin={{ top: 12, right: 35, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis yAxisId="l" tick={cT} width={45} /><YAxis yAxisId="r" orientation="right" tick={cT} width={35} unit="%" /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Bar dataKey="fcf" name="FCF" yAxisId="l" fill={C.cy + "88"} radius={[3, 3, 0, 0]} /><Line dataKey="fM" name="FCF%" yAxisId="r" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ fill: C.gn, r: 2.5 }} /></ComposedChart></ResponsiveContainer></CW>
            <CW t="Customers & Rev/Cust" at={IN.cu.t} ab={IN.cu.b}><ResponsiveContainer width="100%" height={200}><ComposedChart data={hd} margin={{ top: 12, right: 35, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis yAxisId="l" tick={cT} width={45} /><YAxis yAxisId="r" orientation="right" tick={cT} width={50} /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Bar dataKey="cu" name="Customers" yAxisId="l" fill={C.bl + "88"} radius={[3, 3, 0, 0]} /><Line dataKey="rpc" name="Rev/Cust($K)" yAxisId="r" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ fill: C.gn, r: 2.5 }} /></ComposedChart></ResponsiveContainer></CW>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
            <CW t="Headcount & Productivity" at={IN.hc.t} ab={IN.hc.b}><ResponsiveContainer width="100%" height={200}><ComposedChart data={hd} margin={{ top: 12, right: 35, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis yAxisId="l" tick={cT} width={45} /><YAxis yAxisId="r" orientation="right" tick={cT} width={45} /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Bar dataKey="em" name="Employees" yAxisId="l" fill={C.bl + "66"} radius={[3, 3, 0, 0]} /><Line dataKey="rpe" name="Rev/Emp($K)" yAxisId="r" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ fill: C.gn, r: 2.5 }} /></ComposedChart></ResponsiveContainer></CW>
            <CW t="Retention Rates (%)" at={IN.rt.t} ab={IN.rt.b}><ResponsiveContainer width="100%" height={200}><LineChart data={hd} margin={{ top: 12, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis tick={cT} width={35} domain={[90, 120]} /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Line dataKey="nr" name="NRR" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ fill: C.gn, r: 2.5 }} /><Line dataKey="gr2" name="GRR" type="monotone" stroke={C.bl} strokeWidth={1.2} dot={{ fill: C.bl, r: 2 }} /><ReferenceLine y={100} stroke="#ccc" strokeDasharray="3 3" /></LineChart></ResponsiveContainer></CW>
            <CW t="Rule of 40 & SBC" at={IN.r4.t} ab={IN.r4.b}><ResponsiveContainer width="100%" height={200}><ComposedChart data={hd.slice(1)} margin={{ top: 12, right: 35, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} /><YAxis tick={cT} width={35} /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} /><Bar dataKey="r40" name="R40" fill={C.bl + "88"} radius={[3, 3, 0, 0]} /><Line dataKey="sbP" name="SBC%" type="monotone" stroke={C.rd} strokeWidth={1.2} dot={{ fill: C.rd, r: 2 }} /><ReferenceLine y={40} stroke={C.gn} strokeDasharray="3 3" /></ComposedChart></ResponsiveContainer></CW>
          </div>

          {/* HISTORICAL DATA TABLE */}
          <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            {SH("Complete Historical Data (FY2019–FY2025)", null, true)}
            <div style={{ overflowX: "auto", maxHeight: 900 }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ background: "#dde0e8" }}><th style={{ ...thS, position: "sticky", left: 0, background: "#dde0e8", zIndex: 11, textAlign: "left", minWidth: 180 }}></th><th colSpan={7} style={{ ...thS, textAlign: "center", borderBottom: "3px solid #99a", borderRight: "3px solid #fff" }}>Actuals</th><th colSpan={5} style={{ ...thS, textAlign: "center", borderBottom: "3px solid #99a", background: "#e4e6f0", borderRight: "3px solid #fff" }}>YoY %</th><th colSpan={3} style={{ ...thS, textAlign: "center", borderBottom: "3px solid #99a", background: "#e0e2ed" }}>CAGR</th></tr>
                  <tr style={{ background: "#eef0f4" }}><th style={{ ...thS, position: "sticky", left: 0, background: "#eef0f4", zIndex: 11, textAlign: "left", minWidth: 180 }}>Metric</th>{HY.map((y, i) => <th key={y} style={{ ...thS, ...(i === 6 ? { borderRight: "3px solid #fff" } : {}) }}>{y}</th>)}{["'21", "'22", "'23", "'24", "'25"].map((y, i) => <th key={y} style={{ ...thS, fontSize: 9, background: "#f2f3f9", ...(i === 4 ? { borderRight: "3px solid #fff" } : {}) }}>{y}</th>)}{["6Y", "4Y", "2Y"].map(y => <th key={y} style={{ ...thS, fontSize: 9, background: "#edeef7" }}>{y}</th>)}</tr>
                </thead>
                <tbody>
                  <HR l="Income Statement" sec />
                  <HR l="S&S Revenue" d={H.sr} u="($M)" /><HR l="Services Revenue" d={H.pr} u="($M)" /><HR l="Total Revenue" d={tR} b u="($M)" />
                  <HR l="S&S CoS" d={H.cs} u="($M)" /><HR l="Services CoS" d={H.cp} u="($M)" /><HR l="Total CoR" d={tC} sub u="($M)" /><HR l="Gross Profit" d={GP} b u="($M)" />
                  <HR l="R&D" d={H.rd} u="($M)" /><HR l="S&M" d={H.sm} u="($M)" /><HR l="G&A" d={H.ga} u="($M)" /><HR l="Total OpEx" d={tO} sub u="($M)" /><HR l="Operating Income" d={OI} b u="($M)" />
                  <HR l="Interest Income" d={H.ii} u="($M)" /><HR l="Interest Expense" d={H.ie.map(v => -v)} u="($M)" /><HR l="Other Income" d={H.oi} u="($M)" /><HR l="Pre-Tax Income" d={PB} sub u="($M)" /><HR l="Tax Provision" d={H.tx} u="($M)" /><HR l="Net Income" d={NI} b u="($M)" />
                  <HR l="Cash Flow" sec />
                  <HR l="SBC" d={H.sb} u="($M)" /><HR l="CFO" d={H.co} b u="($M)" /><HR l="CapEx" d={H.cx} u="($M)" /><HR l="Free Cash Flow" d={FC} b u="($M)" />
                  <HR l="Balance Sheet" sec />
                  <HR l="Cash + Securities" d={CS} u="($M)" /><HR l="Total Debt" d={H.cn} u="($M)" /><HR l="Deferred Revenue" d={tD} u="($M)" /><HR l="Accounts Receivable" d={H.ar} u="($M)" />
                  <HR l="KPIs" sec />
                  <HR l="Customers" d={H.cu} nf /><HR l="S&S Rev / Customer" d={sPC} u="($K)" nf /><HR l="NRR %" d={H.nr} nf /><HR l="GRR %" d={H.gr} nf /><HR l="Employees" d={H.em} nf /><HR l="ACV > $100K" d={H.av} nf />
                  <HR l="Common Sizing (% of Revenue)" sec />
                  <HR l="S&S Revenue" d={H.sr.map((v, i) => v / tR[i] * 100)} pct /><HR l="Services Revenue" d={H.pr.map((v, i) => v / tR[i] * 100)} pct /><HR l="Gross Margin" d={GP.map((v, i) => v / tR[i] * 100)} pct b /><HR l="R&D" d={H.rd.map((v, i) => v / tR[i] * 100)} pct /><HR l="S&M" d={H.sm.map((v, i) => v / tR[i] * 100)} pct /><HR l="G&A" d={H.ga.map((v, i) => v / tR[i] * 100)} pct /><HR l="Operating Margin" d={OI.map((v, i) => v / tR[i] * 100)} pct b /><HR l="Net Margin" d={NI.map((v, i) => v / tR[i] * 100)} pct /><HR l="SBC" d={H.sb.map((v, i) => v / tR[i] * 100)} pct /><HR l="FCF Margin" d={FC.map((v, i) => v / tR[i] * 100)} pct b />
                </tbody>
              </table>
            </div>
          </div>
        </div>}

        {/* PROJECTIONS */}
        {tab === "projections" && <div>
          {/* VALUATION CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ ...dC, padding: 10, borderTop: "3px solid #555" }}>
              <div style={{ color: "#ccc", fontSize: 9, fontWeight: 800 }}>CURRENT</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>${fn(cp, 2)}</div>
              <div style={{ color: C.ts, fontSize: 11 }}>{fv(cp * sh * 1e6)}</div>
            </div>
            {Object.entries(pVal).map(([k, v]) => {
              const c = k === "bear" ? C.rd : k === "bull" ? C.gn : C.cy;
              const pv2 = ((v.pps - cp) / cp * 100);
              return <div key={k} style={{ ...dC, borderTop: "3px solid " + c, cursor: "pointer", padding: 10 }} onClick={() => sPsc(k)}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: c, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{PD[k].l}</span>
                  {psc === k && <span style={{ color: c, fontSize: 7, fontWeight: 800, background: c + "20", padding: "2px 6px", borderRadius: 4 }}>ACTIVE</span>}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <div><div style={{ color: C.td, fontSize: 8 }}>Price</div><div style={{ color: c, fontSize: 18, fontWeight: 800 }}>${fn(v.pps, 2)}</div></div>
                  <div><div style={{ color: C.td, fontSize: 8 }}>vs Cur</div><div style={{ color: pv2 >= 0 ? C.gn : C.rd, fontSize: 18, fontWeight: 800 }}>{(pv2 >= 0 ? "+" : "") + fn(pv2, 1)}%</div></div>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 9, marginTop: 3 }}>
                  <span style={{ color: C.td }}>EV </span><span style={{ color: c, fontWeight: 700 }}>{fvc(v.ev)}</span>
                  <span style={{ color: C.td }}> CAGR </span><span>{fn(v.cagr2, 1)}%</span>
                </div>
              </div>;
            })}
          </div>

          {/* PROJ CHART ROW 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
            <CW t={"Revenue ($M) — " + PD[psc].l} at={IN.pR.t} ab={IN.pR.b}><ResponsiveContainer width="100%" height={190}><BarChart data={cbd} margin={{ top: 12, right: 15, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} interval={2} /><YAxis tick={cT} width={45} /><Tooltip contentStyle={cTT} /><ReferenceLine x="2025" stroke="#999" strokeDasharray="3 3" /><Bar dataKey="rev" name="Revenue" radius={[3, 3, 0, 0]}>{cbd.map((d, i) => <Cell key={i} fill={d.t === "h" ? C.bl : C.bl + "66"} />)}</Bar></BarChart></ResponsiveContainer></CW>
            <CW t="Margin Evolution (%)" at={IN.pM.t} ab={IN.pM.b}><ResponsiveContainer width="100%" height={190}><LineChart data={cbd} margin={{ top: 12, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} interval={2} /><YAxis tick={cT} width={35} unit="%" /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} payload={[{ value: "Gross", type: "line", color: C.gn }, { value: "Op", type: "line", color: C.bl }, { value: "FCF", type: "line", color: C.cy }]} /><ReferenceLine x="2025" stroke="#999" strokeDasharray="3 3" /><Line dataKey="gm" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ r: 2 }} legendType="none" /><Line dataKey="oM" type="monotone" stroke={C.bl} strokeWidth={1.5} dot={{ r: 2 }} legendType="none" /><Line dataKey="fM" type="monotone" stroke={C.cy} strokeWidth={1.5} dot={{ r: 2 }} legendType="none" /><ReferenceLine y={0} stroke="#ccc" strokeDasharray="3 3" /></LineChart></ResponsiveContainer></CW>
            <CW t="Expenses % Revenue" at={IN.pE.t} ab={IN.pE.b}><ResponsiveContainer width="100%" height={190}><LineChart data={cbd} margin={{ top: 12, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} interval={2} /><YAxis tick={cT} width={35} unit="%" domain={[0, 120]} /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 8, fontWeight: 600 }} payload={[{ value: "CoR", type: "line", color: "#999" }, { value: "OpEx", type: "line", color: C.rd }, { value: "Total", type: "line", color: "#333" }]} /><ReferenceLine x="2025" stroke="#999" strokeDasharray="3 3" /><Line dataKey="crP" type="monotone" stroke="#999" strokeWidth={1.2} dot={{ r: 1.5 }} legendType="none" /><Line dataKey="toP" type="monotone" stroke={C.rd} strokeWidth={1.3} dot={{ r: 2 }} legendType="none" /><Line dataKey="teP" type="monotone" stroke="#333" strokeWidth={1.5} dot={{ r: 2.5 }} legendType="none" /></LineChart></ResponsiveContainer></CW>
          </div>

          {/* PROJ CHART ROW 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
            <CW t="OpEx Categories (% Rev)" at="OpEx Composition" ab="R&D, S&M, and G&A are all projected to decline as % of revenue, reflecting operating leverage."><ResponsiveContainer width="100%" height={190}><LineChart data={cbd} margin={{ top: 12, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} interval={2} /><YAxis tick={cT} width={35} unit="%" /><Tooltip contentStyle={cTT} /><Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} payload={[{ value: "R&D", type: "line", color: C.bl }, { value: "S&M", type: "line", color: C.or }, { value: "G&A", type: "line", color: C.pu }]} /><ReferenceLine x="2025" stroke="#999" strokeDasharray="3 3" /><Line dataKey="rdP" type="monotone" stroke={C.bl} strokeWidth={1.3} dot={{ r: 2 }} legendType="none" /><Line dataKey="smP" type="monotone" stroke={C.or} strokeWidth={1.3} dot={{ r: 2 }} legendType="none" /><Line dataKey="gaP" type="monotone" stroke={C.pu} strokeWidth={1.3} dot={{ r: 2 }} legendType="none" /></LineChart></ResponsiveContainer></CW>
            <CW t="Free Cash Flow ($M)" at="FCF Trajectory" ab="FCF projected to scale as operating leverage compounds."><ResponsiveContainer width="100%" height={190}><ComposedChart data={cbd} margin={{ top: 12, right: 35, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} interval={2} /><YAxis yAxisId="l" tick={cT} width={45} /><YAxis yAxisId="r" orientation="right" tick={cT} width={35} unit="%" /><Tooltip contentStyle={cTT} /><ReferenceLine x="2025" stroke="#999" strokeDasharray="3 3" yAxisId="l" /><Bar dataKey="fcf" yAxisId="l" radius={[3, 3, 0, 0]}>{cbd.map((d, i) => <Cell key={i} fill={d.t === "h" ? C.cy + "cc" : C.cy + "55"} />)}</Bar><Line dataKey="fM" yAxisId="r" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ r: 2.5 }} /></ComposedChart></ResponsiveContainer></CW>
            <CW t="Customers & S&S Rev/Cust" at="Customer Economics" ab="Customer count derived from S&S revenue / revenue per customer."><ResponsiveContainer width="100%" height={190}><ComposedChart data={cbd} margin={{ top: 12, right: 35, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" /><XAxis dataKey="year" tick={cT} interval={2} /><YAxis yAxisId="l" tick={cT} width={45} /><YAxis yAxisId="r" orientation="right" tick={cT} width={50} /><Tooltip contentStyle={cTT} /><ReferenceLine x="2025" stroke="#999" strokeDasharray="3 3" yAxisId="l" /><Bar dataKey="cu" yAxisId="l" radius={[3, 3, 0, 0]}>{cbd.map((d, i) => <Cell key={i} fill={d.t === "h" ? C.bl + "cc" : C.bl + "55"} />)}</Bar><Line dataKey="rpc" yAxisId="r" type="monotone" stroke={C.gn} strokeWidth={1.5} dot={{ fill: C.gn, r: 2.5 }} /></ComposedChart></ResponsiveContainer></CW>
          </div>

          {/* PROJECTION TABLE */}
          <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            {SH("Full Financial Projections — " + PD[psc].l, null, true)}
            <div style={{ overflowX: "auto", maxHeight: 900 }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ background: "#dde0e8" }}><th style={{ ...thS, position: "sticky", left: 0, background: "#dde0e8", zIndex: 11, textAlign: "left", minWidth: 165 }}></th><th style={{ ...thS, textAlign: "center", background: "#d8e6d8", borderRight: "3px solid #fff" }}>Actual</th><th colSpan={10} style={{ ...thS, textAlign: "center", borderBottom: "3px solid #99a", borderRight: "3px solid #fff" }}>Projected</th><th colSpan={2} style={{ ...thS, textAlign: "center", borderBottom: "3px solid #99a", background: "#e0e2ed" }}>CAGR</th></tr>
                  <tr style={{ background: "#eef0f4" }}><th style={{ ...thS, position: "sticky", left: 0, background: "#eef0f4", zIndex: 11, textAlign: "left", minWidth: 165 }}>Metric</th><th style={{ ...thS, background: "#e8f2e8", borderRight: "3px solid #fff" }}>2025A</th>{pd.map(p2 => <th key={p2.y} style={{ ...thS, ...(p2.y === 2035 ? { borderRight: "3px solid #fff" } : {}) }}>{p2.y}E</th>)}<th style={{ ...thS, fontSize: 9, background: "#edeef7" }}>Hist</th><th style={{ ...thS, fontSize: 9, background: "#edeef7" }}>Proj</th></tr>
                </thead>
                <tbody>
                  <PT l="Income Statement" sec />
                  <PT l="S&S Revenue ($M)" hv={H.sr} pv={pd.map(p2 => p2.sub)} /><PP l="  S&S Growth %" hv={yoy(H.sr[HL], H.sr[HL - 1])} pv={pd.map((p2, i) => yoy(p2.sub, i === 0 ? H.sr[HL] : pd[i - 1].sub))} /><PT l="Services Revenue ($M)" hv={H.pr} pv={pd.map(p2 => p2.ps)} /><PT l="Total Revenue ($M)" hv={tR} pv={pd.map(p2 => p2.rev)} b /><PP l="  Rev Growth %" hv={yoy(tR[HL], tR[HL - 1])} pv={pd.map((p2, i) => yoy(p2.rev, i === 0 ? tR[HL] : pd[i - 1].rev))} b />
                  <PT l="Cost of Revenue ($M)" hv={tC} pv={pd.map(p2 => p2.tCr)} sub /><PT l="Gross Profit ($M)" hv={GP} pv={pd.map(p2 => p2.gp)} b /><PP l="  Gross Margin %" hv={GP[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.gp / p2.rev * 100)} b />
                  <PT l="R&D ($M)" hv={H.rd} pv={pd.map(p2 => p2.rd)} /><PT l="S&M ($M)" hv={H.sm} pv={pd.map(p2 => p2.sm)} /><PT l="G&A ($M)" hv={H.ga} pv={pd.map(p2 => p2.ga)} /><PT l="Total OpEx ($M)" hv={tO} pv={pd.map(p2 => p2.tOp)} sub /><PT l="Op Income ($M)" hv={OI} pv={pd.map(p2 => p2.op)} b /><PP l="  Op Margin %" hv={OI[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.op / p2.rev * 100)} b />
                  <PT l="Interest Income ($M)" hv={H.ii} pv={pd.map(p2 => p2.ii)} /><PT l="Interest Expense ($M)" hv={H.ie.map(v => -v)} pv={pd.map(p2 => -p2.ie)} /><PT l="Pre-Tax Income ($M)" hv={PB} pv={pd.map(p2 => p2.pb)} sub /><PT l="Tax ($M)" hv={H.tx} pv={pd.map(p2 => p2.tx)} /><PT l="Net Income ($M)" hv={NI} pv={pd.map(p2 => p2.ni)} b /><PP l="  Net Margin %" hv={NI[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.ni / p2.rev * 100)} />
                  <PT l="Cash Flow" sec />
                  <PT l="SBC ($M)" hv={H.sb} pv={pd.map(p2 => p2.sb)} /><PT l="CFO ($M)" hv={H.co} pv={pd.map(p2 => p2.cfo)} b /><PT l="CapEx ($M)" hv={H.cx} pv={pd.map(p2 => p2.cx)} /><PT l="FCF ($M)" hv={FC} pv={pd.map(p2 => p2.fcf)} b /><PP l="  FCF Margin %" hv={FC[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.fcf / p2.rev * 100)} b />
                  <PT l="Balance Sheet" sec />
                  <PT l="AR ($M)" hv={H.ar} pv={pd.map(p2 => p2.ar)} /><PT l="Deferred Rev ($M)" hv={H.dr} pv={pd.map(p2 => p2.dr)} /><PT l="Cash + Sec ($M)" hv={CS} pv={pd.map(p2 => p2.ca)} b />
                  <PT l="Customers" hv={H.cu} pv={pd.map(p2 => p2.cu)} nf /><PT l="S&S Rev/Cust ($K)" hv={sPC.map(v => Math.round(v))} pv={pd.map(p2 => p2.rpc)} nf />
                  <PT l="Common Sizing (% of Revenue)" sec />
                  <PP l="S&S %" hv={H.sr[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.sub / p2.rev * 100)} /><PP l="Services %" hv={H.pr[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.ps / p2.rev * 100)} /><PP l="CoR %" hv={tC[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.tCr / p2.rev * 100)} /><PP l="R&D %" hv={H.rd[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.rd / p2.rev * 100)} /><PP l="S&M %" hv={H.sm[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.sm / p2.rev * 100)} /><PP l="G&A %" hv={H.ga[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.ga / p2.rev * 100)} /><PP l="Op Margin %" hv={OI[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.op / p2.rev * 100)} b /><PP l="SBC %" hv={H.sb[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.sb / p2.rev * 100)} /><PP l="FCF Margin %" hv={FC[HL] / tR[HL] * 100} pv={pd.map(p2 => p2.fcf / p2.rev * 100)} b />
                  <PT l="YoY Growth (%)" sec />
                  <PP l="Revenue" hv={yoy(tR[HL], tR[HL - 1])} pv={pd.map((p2, i) => yoy(p2.rev, i === 0 ? tR[HL] : pd[i - 1].rev))} /><PP l="Gross Profit" hv={yoy(GP[HL], GP[HL - 1])} pv={pd.map((p2, i) => yoy(p2.gp, i === 0 ? GP[HL] : pd[i - 1].gp))} /><PP l="OpEx" hv={yoy(tO[HL], tO[HL - 1])} pv={pd.map((p2, i) => yoy(p2.tOp, i === 0 ? tO[HL] : pd[i - 1].tOp))} /><PP l="FCF" hv={FC[HL] > 0 && FC[HL - 1] > 0 ? yoy(FC[HL], FC[HL - 1]) : null} pv={pd.map((p2, i) => { const pv2 = i === 0 ? FC[HL] : pd[i - 1].fcf; return pv2 > 0 ? yoy(p2.fcf, pv2) : null; })} />
                </tbody>
              </table>
            </div>
          </div>
        </div>}

      </div>
    </div>}
  </div>;
}
