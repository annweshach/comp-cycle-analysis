import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, LabelList
} from "recharts";

// ---------- Design tokens ----------
const C = {
  bg: "#F4F5F7",
  card: "#FFFFFF",
  navy: "#16233F",
  navyLight: "#25365B",
  ink: "#1C2536",
  slate: "#5B6478",
  slateLight: "#8A93A6",
  line: "#E3E6EC",
  teal: "#0F7A6C",
  tealBg: "#E4F3F0",
  amber: "#B4790F",
  amberBg: "#FBF0DE",
  red: "#AC4038",
  redBg: "#FBEAE8",
  indigo: "#4C5FD5",
  indigoBg: "#EBEDFC",
};

// ---------- Data (computed from a synthetic 210-employee FY26 merit dataset) ----------
const RESULTS = {
  headcount: 210,
  total_base_payroll: 25451417,
  merit_pool: 890800,
  promo_pool: 150000,
  total_pool: 1040800,
  company_compa: 1.008,
  compa_female: 0.967,
  compa_male: 1.03,
  adjusted_gap_pct: 6.5,
  gap_t: 3.96,
  gap_p: 0.0001,
  red_circle: 5,
  green_circle: 23,
  outside_bands: 1,
  overlaps: 36,
  same_track_inversion: 3,
  remediation_cost: 164587,
};

const DIST = [
  { bucket: "<0.85", count: 14 },
  { bucket: "0.85–0.90", count: 5 },
  { bucket: "0.90–0.95", count: 12 },
  { bucket: "0.95–1.00", count: 38 },
  { bucket: "1.00–1.05", count: 61 },
  { bucket: "1.05–1.10", count: 39 },
  { bucket: "1.10–1.15", count: 23 },
  { bucket: ">1.15", count: 7 },
];

const BY_LEVEL = [
  { level: "IC1", compa: 1.002, n: 29 },
  { level: "IC2", compa: 1.018, n: 26 },
  { level: "IC3", compa: 0.982, n: 30 },
  { level: "IC4", compa: 1.034, n: 22 },
  { level: "IC5", compa: 1.025, n: 9 },
  { level: "M1", compa: 1.014, n: 48 },
  { level: "M2", compa: 1.003, n: 32 },
  { level: "M3", compa: 0.996, n: 14 },
];

const BY_GENDER = [
  { name: "Female", raw: 0.967 },
  { name: "Male", raw: 1.03 },
];

const BY_ETH = [
  { name: "White", raw: 1.004, n: 115 },
  { name: "Asian", raw: 0.988, n: 34 },
  { name: "Hispanic/Latino", raw: 1.015, n: 28 },
  { name: "Black/African Am.", raw: 1.038, n: 18 },
  { name: "Two or More", raw: 1.025, n: 13 },
  { name: "Native Hawaiian/PI", raw: 1.061, n: 2 },
];

const BY_DEPT = [
  { name: "Engineering", headcount: 67, compa: 1.013 },
  { name: "Sales", headcount: 32, compa: 1.014 },
  { name: "Customer Success", headcount: 30, compa: 1.005 },
  { name: "Finance", headcount: 28, compa: 1.014 },
  { name: "HR", headcount: 27, compa: 1.015 },
  { name: "Marketing", headcount: 26, compa: 0.975 },
];

const RED_CIRCLE = [
  { id: "E-1068", dept: "Marketing", level: "IC3", salary: 111948, max: 103676, compa: 1.25 },
  { id: "E-1092", dept: "Sales", level: "IC4", salary: 152742, max: 143724, compa: 1.23 },
  { id: "E-1146", dept: "Finance", level: "M1", salary: 161250, max: 158479, compa: 1.18 },
  { id: "E-1174", dept: "Sales", level: "IC3", salary: 153440, max: 142652, compa: 1.25 },
  { id: "E-1179", dept: "Engineering", level: "M1", salary: 152994, max: 150568, compa: 1.18 },
];

const OUTSIDE_BAND = { id: "E-1203", dept: "Customer Success", level: "IC2", salary: 71400 };
const SAME_TRACK = [
  { id: "E-1041", dept: "HR", level: "M2", salary: 145177, min: 149642 },
  { id: "E-1088", dept: "Engineering", level: "M2", salary: 160210, min: 164911 },
  { id: "E-1152", dept: "Sales", level: "M2", salary: 128300, min: 132880 },
];

const fmt$ = (n) => "$" + Math.round(n).toLocaleString("en-US");
const fmtK = (n) => "$" + (n / 1000).toFixed(0) + "K";

function Tag({ kind = "user", children }) {
  const map = {
    user: { bg: C.indigoBg, fg: C.indigo, label: "USER-PROVIDED" },
    modeled: { bg: C.tealBg, fg: C.teal, label: "MODELED" },
    flag: { bg: C.amberBg, fg: C.amber, label: "FLAG" },
  };
  const s = map[kind];
  return (
    <span style={{
      background: s.bg, color: s.fg, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.04em", padding: "2px 7px", borderRadius: 4,
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      {children || s.label}
    </span>
  );
}

function KPI({ label, value, tagKind, sub, accent }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 10,
      padding: "16px 18px", flex: "1 1 150px", minWidth: 150,
      borderTop: accent ? `3px solid ${accent}` : `3px solid transparent`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, color: C.slate, fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
        {value}
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.slateLight }}>{sub}</span>
        {tagKind && <Tag kind={tagKind} />}
      </div>
    </div>
  );
}

function SectionTitle({ children, note }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {children}
      </div>
      {note && <div style={{ fontSize: 12, color: C.slate, marginTop: 3, maxWidth: 640 }}>{note}</div>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 10,
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{
                textAlign: "left", padding: "8px 10px", color: C.slate,
                fontWeight: 700, fontSize: 11, textTransform: "uppercase",
                letterSpacing: "0.03em", borderBottom: `1px solid ${C.line}`,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: "9px 10px", color: C.ink, fontVariantNumeric: "tabular-nums" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS = ["Overview", "Pay Equity", "Bands & Compression", "Budget vs Plan", "Exceptions"];

export default function CompDashboard() {
  const [tab, setTab] = useState("Overview");

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, minHeight: "100vh",
      color: C.ink,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ background: C.navy, color: "#fff", padding: "22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 19 }}>
              Meridian Health Tech — FY2026 Merit Cycle
            </div>
            <div style={{ fontSize: 12.5, color: "#B7C0D6", marginTop: 4 }}>
              CHRO / Comp Committee view · Base salary only · Effective 2026-04-01 · Source of truth: FY2026 Controlled Comp Analysis Pack
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag kind="user">210 employees</Tag>
            <Tag kind="user">208 banded</Tag>
            <Tag kind="modeled">Pay equity: OLS controlled</Tag>
            <Tag kind="flag">No individual pay actions recommended</Tag>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.line}`, padding: "0 28px",
        display: "flex", gap: 4, overflowX: "auto",
      }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            border: "none", background: "none", cursor: "pointer", padding: "14px 14px",
            fontSize: 13, fontWeight: 600, color: tab === t ? C.navy : C.slateLight,
            borderBottom: tab === t ? `2.5px solid ${C.navy}` : "2.5px solid transparent",
            whiteSpace: "nowrap",
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

        {tab === "Overview" && (
          <>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
              <KPI label="Eligible headcount" value="210" sub="HRIS export" tagKind="user" />
              <KPI label="Eligible base payroll" value={fmtK(RESULTS.total_base_payroll)} sub="ties to budget file" tagKind="user" />
              <KPI label="Merit pool (3.5%)" value={fmtK(RESULTS.merit_pool)} sub={`+ ${fmtK(RESULTS.promo_pool)} promo pool`} tagKind="modeled" />
              <KPI label="Company group compa-ratio" value={RESULTS.company_compa.toFixed(2)} sub="healthy band 0.95–1.05" tagKind="modeled" />
              <KPI label="Adjusted gender pay gap" value={`−${RESULTS.adjusted_gap_pct}%`} sub="F vs M, survives controls" tagKind="modeled" accent={C.red} />
              <KPI label="Below-min remediation" value={fmtK(RESULTS.remediation_cost)} sub={`${((RESULTS.remediation_cost/RESULTS.merit_pool)*100).toFixed(1)}% of merit pool`} tagKind="modeled" accent={C.amber} />
            </div>

            <Card style={{ marginBottom: 20 }}>
              <SectionTitle>Structure health at a glance</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
                {[
                  ["Range spreads across levels", "±16%, consistent", C.teal],
                  ["Group compa-ratio by level", "0.98–1.03, in band", C.teal],
                  ["Population below midpoint", "≈45% of headcount", C.amber],
                  ["Red-circle (above max)", `${RESULTS.red_circle} employees`, C.red],
                  ["Green-circle (below min)", `${RESULTS.green_circle} employees`, C.red],
                  ["Same-track manager inversion", `${RESULTS.same_track_inversion} cases`, C.red],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 13, color: C.slate }}>{label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{val}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Three things needing a human decision first</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: C.redBg, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                  <b>Adjusted gender pay gap.</b> −{RESULTS.adjusted_gap_pct}%, statistically significant (t = {RESULTS.gap_t}, p &lt; 0.001), survives level/tenure/performance/department/location controls. Route to counsel under privilege.
                </div>
                <div style={{ background: C.amberBg, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                  <b>Funding order.</b> Below-min remediation is {fmt$(RESULTS.remediation_cost)} — {((RESULTS.remediation_cost/RESULTS.merit_pool)*100).toFixed(1)}% of the merit pool — and typically funded ahead of general merit.
                </div>
                <div style={{ background: C.amberBg, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                  <b>Same-track manager inversion.</b> {RESULTS.same_track_inversion} M2s paid below their own band minimum, distinct from the {RESULTS.overlaps} by-design overlaps where a senior IC out-earns a junior manager — a stale-pay signal worth a direct look.
                </div>
              </div>
            </Card>
          </>
        )}

        {tab === "Pay Equity" && (
          <>
            <SectionTitle note="Three layers: raw gap locates → level-controlled group compa → OLS regression concludes. Ethnicity excluded where cell sizes are too small to interpret responsibly.">
              Pay equity picture
            </SectionTitle>
            <Card style={{ marginBottom: 20, background: C.redBg, border: "none" }}>
              <div style={{ fontSize: 13.5 }}>
                <b>Headline finding.</b> A healthy company-wide compa-ratio of {RESULTS.company_compa} splits into men at {RESULTS.compa_male} and women at {RESULTS.compa_female} raw. Controlling for level, tenure, performance, department and location simultaneously, the female coefficient is <b>−{RESULTS.adjusted_gap_pct}%</b> and statistically significant (t = {RESULTS.gap_t}, p = {RESULTS.gap_p}), stable across every specification tried. <Tag kind="modeled">OLS, log-salary</Tag> Not legal advice — ethnicity shows no statistically significant adjusted gap at current sample sizes.
              </div>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Card>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.slate, marginBottom: 10 }}>RAW COMPA-RATIO BY GENDER</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={BY_GENDER} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke={C.line} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
                    <YAxis domain={[0.85, 1.05]} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={1.0} stroke={C.slateLight} strokeDasharray="3 3" />
                    <Tooltip formatter={(v) => v.toFixed(3)} />
                    <Bar dataKey="raw" radius={[5, 5, 0, 0]} barSize={60}>
                      {BY_GENDER.map((d, i) => <Cell key={i} fill={d.name === "Female" ? C.red : C.navyLight} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.slate, marginBottom: 10 }}>RAW COMPA-RATIO BY ETHNICITY (descriptive)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={BY_ETH} layout="vertical" margin={{ top: 8, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid stroke={C.line} horizontal={false} />
                    <XAxis type="number" domain={[0.9, 1.1]} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                    <ReferenceLine x={1.0} stroke={C.slateLight} strokeDasharray="3 3" />
                    <Tooltip formatter={(v) => v.toFixed(3)} />
                    <Bar dataKey="raw" fill={C.indigo} radius={[0, 5, 5, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}

        {tab === "Bands & Compression" && (
          <>
            <SectionTitle note="Group compa-ratio by level — how pay sits relative to each band's midpoint, independent of who's in the band.">
              Compa-ratio by level
            </SectionTitle>
            <Card style={{ marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={BY_LEVEL} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={C.line} vertical={false} />
                  <XAxis dataKey="level" tick={{ fontSize: 12, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
                  <YAxis domain={[0.9, 1.1]} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={1.0} stroke={C.slateLight} strokeDasharray="3 3" />
                  <Tooltip formatter={(v, n) => n === "compa" ? v.toFixed(3) : v} />
                  <Bar dataKey="compa" fill={C.navyLight} radius={[5, 5, 0, 0]}>
                    <LabelList dataKey="n" position="top" formatter={(v) => `n=${v}`} style={{ fontSize: 10, fill: C.slateLight }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <SectionTitle note="Headcount and average compa-ratio by department — useful for spotting a whole function drifting off-band.">
              By department
            </SectionTitle>
            <Card style={{ marginBottom: 20 }}>
              <Table
                columns={["Department", "Headcount", "Avg compa-ratio"]}
                rows={BY_DEPT.map((d) => [d.name, d.headcount, d.compa.toFixed(3)])}
              />
            </Card>

            <SectionTitle note="Compa-ratio distribution across the full population.">
              Distribution against bands
            </SectionTitle>
            <Card>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DIST} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={C.line} vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10.5, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={C.indigo} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {tab === "Budget vs Plan" && (
          <>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
              <KPI label="Total base payroll" value={fmtK(RESULTS.total_base_payroll)} sub="eligible population" tagKind="user" />
              <KPI label="Merit pool (3.5%)" value={fmtK(RESULTS.merit_pool)} sub="of eligible payroll" tagKind="modeled" />
              <KPI label="Promotion pool" value={fmtK(RESULTS.promo_pool)} sub="fixed allocation" tagKind="user" />
              <KPI label="Total cycle pool" value={fmtK(RESULTS.total_pool)} sub="merit + promo" tagKind="modeled" />
            </div>
            <Card>
              <SectionTitle note="If remediation is funded first, it consumes a meaningful share of the merit pool before any general increases are allocated.">
                Where the pool goes if remediation is funded first
              </SectionTitle>
              <Table
                columns={["Allocation", "Amount", "% of merit pool"]}
                rows={[
                  ["Below-min remediation", fmt$(RESULTS.remediation_cost), ((RESULTS.remediation_cost / RESULTS.merit_pool) * 100).toFixed(1) + "%"],
                  ["Remaining for general merit", fmt$(RESULTS.merit_pool - RESULTS.remediation_cost), (100 - (RESULTS.remediation_cost / RESULTS.merit_pool) * 100).toFixed(1) + "%"],
                  ["Promotion pool (separate)", fmt$(RESULTS.promo_pool), "—"],
                ]}
              />
            </Card>
          </>
        )}

        {tab === "Exceptions" && (
          <>
            <SectionTitle note="Every row here names a group or a case — never an individual's dollar recommendation. Routes to a human for the final call.">
              Exception log
            </SectionTitle>

            <Card style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Red-circle — paid above band max</span>
                <Tag kind="flag">{RESULTS.red_circle} cases</Tag>
              </div>
              <Table
                columns={["Employee", "Dept", "Level", "Salary", "Band max", "Compa"]}
                rows={RED_CIRCLE.map((r) => [r.id, r.dept, r.level, fmt$(r.salary), fmt$(r.max), r.compa.toFixed(2)])}
              />
            </Card>

            <Card style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Same-track manager inversion</span>
                <Tag kind="flag">{RESULTS.same_track_inversion} cases</Tag>
              </div>
              <Table
                columns={["Employee", "Dept", "Level", "Salary", "Band min"]}
                rows={SAME_TRACK.map((r) => [r.id, r.dept, r.level, fmt$(r.salary), fmt$(r.min)])}
              />
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Outside defined bands — data quality catch</span>
                <Tag kind="flag">1 case</Tag>
              </div>
              <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 10 }}>
                {OUTSIDE_BAND.id} ({OUTSIDE_BAND.dept}, {OUTSIDE_BAND.level}, {fmt$(OUTSIDE_BAND.salary)}) has no matching band definition — would silently drop out of every compa-ratio calculation above rather than surfacing as a gap.
              </div>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}
