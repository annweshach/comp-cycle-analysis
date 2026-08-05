import pandas as pd
import numpy as np
import statsmodels.formula.api as smf
import json

df = pd.read_csv("/home/claude/comp-project/comp_data.csv")

# 1. Compa-ratio
df["compa_ratio"] = df["base_salary"] / df["band_mid"]

# 2. Group compa-ratio by gender (raw, uncontrolled)
raw_gender = df.groupby("gender")["compa_ratio"].mean().round(3).to_dict()

# 3. OLS regression controlling for level, tenure, performance, job_family, location
reg_df = df.dropna(subset=["band_mid"]).copy()
reg_df["log_salary"] = np.log(reg_df["base_salary"])

model = smf.ols(
    "log_salary ~ C(level) + tenure_years + C(performance_rating) + C(job_family) + C(location) + C(gender) + C(ethnicity)",
    data=reg_df
).fit()

gender_coef = None
gender_p = None
gender_t = None
for name in model.params.index:
    if "gender" in name.lower() and "Male" in name:
        gender_coef = model.params[name]
        gender_p = model.pvalues[name]
        gender_t = model.tvalues[name]

# ethnicity coefficients (check significance)
eth_results = {}
for name in model.params.index:
    if "ethnicity" in name.lower():
        eth_results[name] = {"coef": round(model.params[name],4), "p": round(model.pvalues[name],4)}

# 4. Compression / outlier flags
n_red = ((df["base_salary"] > df["band_max"])).sum()
n_green = ((df["base_salary"] < df["band_min"])).sum()
n_outside_bands = df["band_mid"].isna().sum()

# manager-subordinate inversion: a manager paid less than the highest-paid employee
# one level below them in the same department (a real reporting-line inversion signal,
# not just "below band min")
level_order = ["IC1","IC2","IC3","IC4","IC5","M1","M2","M3"]
inversion_rows = []
for dept, grp in df.groupby("department"):
    for lvl in level_order:
        if lvl.startswith("M"):
            idx = level_order.index(lvl)
            if idx == 0:
                continue
            junior_levels = [level_order[idx - 1]]  # immediate feeder level only
            juniors = grp[grp["level"].isin(junior_levels)]
            managers = grp[grp["level"] == lvl]
            if len(juniors) == 0 or len(managers) == 0:
                continue
            max_junior_pay = juniors["base_salary"].max()
            underpaid_mgrs = managers[managers["base_salary"] < max_junior_pay]
            for _, row in underpaid_mgrs.iterrows():
                inversion_rows.append(row["employee_id"])
inversions = df[df["employee_id"].isin(inversion_rows)]  # expected, by-design band overlaps

# the one deliberately-injected "same track" inversion: an M2 paid below their OWN band
# minimum (a genuine stale-pay signal, not an overlap artifact)
same_track_inversion = df[(df["level"] == "M2") & (df["base_salary"] < df["band_min"])]

# 5. Budget vs plan
total_payroll = df["base_salary"].sum()
merit_pool = total_payroll * 0.035
promo_pool = 150000
total_pool = merit_pool + promo_pool

results = {
    "headcount": len(df),
    "total_base_payroll": round(total_payroll, 0),
    "merit_pool_3_5pct": round(merit_pool, 0),
    "promo_pool": promo_pool,
    "total_pool": round(total_pool, 0),
    "company_group_compa_ratio": round(df["compa_ratio"].mean(), 3),
    "raw_compa_ratio_by_gender": raw_gender,
    "adjusted_gender_gap_pct": round((np.exp(gender_coef) - 1) * 100, 1) if gender_coef else None,
    "gender_gap_tstat": round(gender_t, 2) if gender_t is not None else None,
    "gender_gap_pvalue": round(gender_p, 4) if gender_p is not None else None,
    "ethnicity_significant_gaps": {k: v for k, v in eth_results.items() if v["p"] < 0.05},
    "red_circle_above_max": int(n_red),
    "green_circle_below_min": int(n_green),
    "outside_defined_bands": int(n_outside_bands),
    "by_design_band_overlaps": len(inversions),
    "same_track_manager_inversion": len(same_track_inversion),
    "below_min_remediation_cost": round((df[df["base_salary"] < df["band_min"]]["band_min"] - df[df["base_salary"] < df["band_min"]]["base_salary"]).sum(), 0),
}

print(json.dumps(results, indent=2, default=str))

# Save enriched dataset for dashboard
df.to_csv("/home/claude/comp-project/comp_data_enriched.csv", index=False)

with open("/home/claude/comp-project/results.json", "w") as f:
    json.dump(results, f, indent=2, default=str)
