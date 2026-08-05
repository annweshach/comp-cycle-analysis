# Comp Cycle Analysis & Governance Dashboard

A merit-cycle compensation analysis and dashboard for a simulated 210-employee company (FY2026), built to mirror how a CHRO / comp committee actually reviews a merit cycle: compa-ratios, pay equity, band compression, budget vs. plan, and an exception log — with every number tagged by provenance and no individual pay recommendations.

## Why this exists

Comp decisions are usually defended with "that's what the survey said" instead of a model someone can open and walk through. This project runs that model: it takes raw employee-level data and produces the same governance artifacts a real comp committee would expect — a controlled pay equity regression, red/green-circle detection, and a funding order for remediation — rather than a single "average salary by department" chart.

## What's inside

```
comp-cycle-analysis/
├── data/
│   ├── generate_data.py         # synthetic dataset generator (210 employees, 6 depts, 8 levels)
│   ├── comp_data.csv            # raw generated dataset
│   └── comp_data_enriched.csv   # dataset with compa-ratio column added
├── analysis/
│   ├── analysis.py              # compa-ratio, OLS pay equity regression, compression/exception flags
│   ├── prep_dashboard_data.py   # aggregates the analysis into dashboard-ready JSON
│   ├── results.json             # headline metrics output
│   └── dashboard_data.json      # full aggregated data feeding the dashboard
├── dashboard/
│   └── comp-cycle-dashboard.jsx # React dashboard (5 tabs: Overview, Pay Equity, Bands & Compression, Budget vs Plan, Exceptions)
└── requirements.txt
```

## How it works

1. **`data/generate_data.py`** creates a synthetic HR dataset — department, level, tenure, performance rating, gender, ethnicity, location, base salary, and band min/mid/max — with a deliberate, controlled gender pay gap and a handful of realistic edge cases (red-circle, green-circle, one manager paid below their own band minimum, one employee outside any defined band).
2. **`analysis/analysis.py`** computes:
   - Compa-ratio (salary ÷ band midpoint) per employee and by level/department/gender/ethnicity
   - A pay equity regression (`log(salary) ~ level + tenure + performance + department + location + gender + ethnicity`) using OLS, so the gender/ethnicity coefficients are read *after* controlling for the legitimate drivers of pay — not a raw, uncontrolled gap
   - Compression flags: red-circle (above band max), green-circle (below band min), and same-track manager inversions, distinguished from the wider set of expected by-design band overlaps
   - Budget vs. plan: merit pool, promotion pool, and remediation cost as a share of the pool
3. **`analysis/prep_dashboard_data.py`** rolls all of the above into a single JSON payload for the dashboard.
4. **`dashboard/comp-cycle-dashboard.jsx`** renders it as a tabbed React dashboard. Every KPI is tagged `USER-PROVIDED` (came straight from the input data) or `MODELED` (derived — e.g., regression output), and the exception log names groups and cases, never an individual's recommended number.

## Running it

```bash
pip install -r requirements.txt
python data/generate_data.py          # regenerate the dataset (optional — comp_data.csv is already included)
python analysis/analysis.py           # run the pay equity + compression analysis
python analysis/prep_dashboard_data.py # produce dashboard_data.json
```

The dashboard (`dashboard/comp-cycle-dashboard.jsx`) is a self-contained React component — drop it into any React app, or open it directly as a Claude/CodeSandbox artifact. Data is currently embedded as constants derived from `dashboard_data.json`; swapping in a live data source means replacing those constants with a fetch/props call.

## Key finding (on the synthetic data)

The company-wide compa-ratio looks healthy at 1.008. But controlling for level, tenure, performance, department, and location, women earn **6.5% less** than men in equivalent roles — a gap that's statistically significant (t = 3.96, p < 0.001) and invisible in the raw, uncontrolled numbers. This is the core point of the project: the raw average hides the finding; the regression is what surfaces it.

## Notes on the data

All employee data is synthetically generated for demonstration purposes — no real company or individual is represented. The pay gap and edge cases (red/green-circle, band inversion, out-of-band employee) are deliberately injected so the analysis has something real to detect.
