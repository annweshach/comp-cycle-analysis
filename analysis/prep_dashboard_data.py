import pandas as pd
import numpy as np
import json

df = pd.read_csv("/home/claude/comp-project/comp_data_enriched.csv")
with open("/home/claude/comp-project/results.json") as f:
    results = json.load(f)

# Distribution: compa-ratio histogram bins
bins = [0.75,0.85,0.9,0.95,1.0,1.05,1.1,1.15,1.25]
labels = ["<0.85","0.85-0.90","0.90-0.95","0.95-1.00","1.00-1.05","1.05-1.10","1.10-1.15",">1.15"]
df["bin"] = pd.cut(df["compa_ratio"], bins=bins, labels=labels)
dist = df["bin"].value_counts().reindex(labels).fillna(0).astype(int).to_dict()

# compa ratio by level
level_order = ["IC1","IC2","IC3","IC4","IC5","M1","M2","M3"]
by_level = df.groupby("level")["compa_ratio"].mean().reindex(level_order).dropna().round(3).to_dict()
count_by_level = df.groupby("level").size().reindex(level_order).dropna().astype(int).to_dict()

# compa ratio by gender (raw)
by_gender = df.groupby("gender")["compa_ratio"].mean().round(3).to_dict()

# compa ratio by ethnicity (raw, descriptive only -- not adjusted)
by_eth = df.groupby("ethnicity")["compa_ratio"].mean().round(3).to_dict()
eth_counts = df.groupby("ethnicity").size().to_dict()

# department headcount + avg compa
by_dept = df.groupby("department").agg(headcount=("employee_id","count"), avg_compa=("compa_ratio","mean")).round(3)
by_dept_dict = by_dept.to_dict(orient="index")

# Exceptions tables
red_circle = df[df["base_salary"] > df["band_max"]][["employee_id","department","level","base_salary","band_max","compa_ratio"]].round(2)
green_circle = df[df["base_salary"] < df["band_min"]][["employee_id","department","level","base_salary","band_min","compa_ratio"]].round(2)
outside_bands = df[df["band_mid"].isna()][["employee_id","department","level","base_salary"]]
same_track = df[(df["level"]=="M2") & (df["base_salary"] < df["band_min"])][["employee_id","department","level","base_salary","band_min"]]

output = {
    "results": results,
    "distribution": dist,
    "compa_by_level": by_level,
    "count_by_level": count_by_level,
    "compa_by_gender": by_gender,
    "compa_by_ethnicity": by_eth,
    "eth_counts": eth_counts,
    "by_dept": by_dept_dict,
    "red_circle": red_circle.to_dict(orient="records"),
    "green_circle": green_circle.to_dict(orient="records"),
    "outside_bands": outside_bands.to_dict(orient="records"),
    "same_track_inversion": same_track.to_dict(orient="records"),
}

with open("/home/claude/comp-project/dashboard_data.json", "w") as f:
    json.dump(output, f, indent=2, default=str)

print(json.dumps(output, indent=2, default=str)[:3000])
