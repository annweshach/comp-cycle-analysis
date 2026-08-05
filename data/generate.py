import numpy as np
import pandas as pd

rng = np.random.default_rng(42)

N = 210

departments = {
    "Engineering": ["IC1","IC2","IC3","IC4","IC5","M1","M2","M3"],
    "Sales": ["IC1","IC2","IC3","IC4","M1","M2"],
    "Marketing": ["IC1","IC2","IC3","IC4","M1","M2"],
    "HR": ["IC1","IC2","IC3","IC4","M1","M2"],
    "Finance": ["IC1","IC2","IC3","IC4","M1","M2","M3"],
    "Customer Success": ["IC1","IC2","IC3","M1","M2"],
}

# base band midpoints by level (USD, base salary) - roughly realistic SaaS company
level_mid = {
    "IC1": 62000, "IC2": 78000, "IC3": 96000, "IC4": 118000, "IC5": 145000,
    "M1": 110000, "M2": 138000, "M3": 172000,
}
level_spread = 0.16  # +/- band spread around midpoint (band width ~ +/-16%)

dept_multiplier = {
    "Engineering": 1.18, "Sales": 1.05, "Marketing": 0.98,
    "HR": 0.92, "Finance": 1.08, "Customer Success": 0.95,
}

locations = ["US-Remote","San Francisco","New York","Austin","Chicago"]
loc_multiplier = {"US-Remote":0.95,"San Francisco":1.22,"New York":1.15,"Austin":1.0,"Chicago":1.02}

genders = ["Male","Female"]
gender_p = [0.56,0.44]

ethnicities = ["White","Asian","Hispanic or Latino","Black or African American","Two or More Races","Native Hawaiian/PI"]
eth_p = [0.52,0.24,0.11,0.08,0.04,0.01]

perf_ratings = ["Below","Meets","Exceeds","Strongly Exceeds"]
perf_p = [0.08,0.55,0.28,0.09]
perf_score = {"Below":-0.04,"Meets":0.0,"Exceeds":0.045,"Strongly Exceeds":0.09}

rows = []
emp_id = 1000

# assign departments/levels proportionally
dept_list = list(departments.keys())
dept_weights = [0.32,0.20,0.12,0.10,0.14,0.12]

for i in range(N):
    dept = rng.choice(dept_list, p=dept_weights)
    level = rng.choice(departments[dept])
    is_manager = level.startswith("M")
    tenure = round(max(0.2, rng.gamma(2.2, 1.7)), 1)
    gender = rng.choice(genders, p=gender_p)
    ethnicity = rng.choice(ethnicities, p=eth_p)
    perf = rng.choice(perf_ratings, p=perf_p)
    location = rng.choice(locations, p=[0.38,0.14,0.16,0.18,0.14])

    mid = level_mid[level] * dept_multiplier[dept] * loc_multiplier[location]
    tenure_bump = min(tenure, 8) * 0.012  # tenure raises pay modestly, caps influence
    perf_bump = perf_score[perf]

    # controlled, deliberate gender penalty baked into "unexplained" residual (not through legitimate factors)
    gender_penalty = -0.065 if gender == "Female" else 0.0

    noise = rng.normal(0, 0.045)
    compa_target = 1.0 + tenure_bump + perf_bump + gender_penalty + noise
    salary = mid * compa_target

    rows.append({
        "employee_id": f"E-{emp_id}",
        "department": dept,
        "job_family": dept,
        "level": level,
        "is_manager": is_manager,
        "location": location,
        "gender": gender,
        "ethnicity": ethnicity,
        "tenure_years": tenure,
        "performance_rating": perf,
        "band_min": round(mid * (1 - level_spread), 0),
        "band_mid": round(mid, 0),
        "band_max": round(mid * (1 + level_spread), 0),
        "base_salary": round(salary, 0),
    })
    emp_id += 1

df = pd.DataFrame(rows)

# --- inject specific realistic exceptions, matching the LinkedIn post's structure ---

# 1. Red-circle: 3 employees paid above band max (legacy over-hires)
red_idx = rng.choice(df.index, 3, replace=False)
df.loc[red_idx, "base_salary"] = df.loc[red_idx, "band_max"] * rng.uniform(1.03, 1.09, 3)

# 2. Green-circle: below band min (new hires underpaid, or below-min after market shift)
green_idx = rng.choice(df.index.difference(red_idx), 22, replace=False)
df.loc[green_idx, "base_salary"] = df.loc[green_idx, "band_min"] * rng.uniform(0.85, 0.98, 22)

# 3. Manager-subordinate inversion: pick one manager paid less than one of their (simulated) reports
# simplest simulation: pick one M-level employee and force salary below an IC in same dept just above their band's IC-max analog
inv_candidates = df[df["level"] == "M2"]
if len(inv_candidates) > 0:
    inv_idx = inv_candidates.sample(1, random_state=7).index[0]
    df.loc[inv_idx, "base_salary"] = df.loc[inv_idx, "band_min"] * 0.97  # sits just under their own band min, below a senior IC

# 4. One employee sitting entirely outside defined bands (data quality / exception log catch)
outlier_idx = rng.choice(df.index.difference(red_idx.tolist() + green_idx.tolist()), 1, replace=False)
df.loc[outlier_idx, "band_min"] = np.nan
df.loc[outlier_idx, "band_mid"] = np.nan
df.loc[outlier_idx, "band_max"] = np.nan

df["base_salary"] = df["base_salary"].round(0)

df.to_csv("/home/claude/comp-project/comp_data.csv", index=False)
print(df.shape)
print(df.head(10).to_string())
