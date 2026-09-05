from app.main import harmonize, validate, graph, HarmonizeRequest, TopologyRequest

# Test 1: Harmonize all 3 areas
for area_id, model in [("pune_kharadi", "tps"), ("pmrda_wagholi", "affine"), ("pcmc_hinjawadi", "tps")]:
    res = harmonize(HarmonizeRequest(area_id=area_id, model=model))
    print(f"{area_id} | {model.upper()} | Post-align RMSE: {res['rmse']} m | Max displacement: {res['max_residual']} m | Inlier: {res['inlier_ratio']}%")
    print(f"  Parcel[0] magnitude={res['residuals'][0]['magnitude_m']}m coherence={res['residuals'][0]['temporal']['coherence']} class={res['residuals'][0]['temporal']['classification']} conf={res['residuals'][0]['confidence']}")

print()

# Test 2: Topology check
harm_res = harmonize(HarmonizeRequest(area_id="pune_kharadi", model="tps"))
topo = validate(TopologyRequest(harmonized=harm_res["harmonized"]))
pass_count = sum(1 for r in topo["results"] if r["status"] == "pass")
fail_count = sum(1 for r in topo["results"] if r["status"] == "fail")
print(f"Topology: {pass_count} pass, {fail_count} fail out of {len(topo['results'])} parcels")
print(f"  Sample[0]: {topo['results'][0]['validity']}")

print()

# Test 3: Evidence graph
g = graph(area_id="pune_kharadi")
types = {}
for n in g["nodes"]:
    t = n["type_label"]
    types[t] = types.get(t, 0) + 1
print(f"Graph: {len(g['nodes'])} nodes, {len(g['links'])} edges")
for t, c in types.items():
    print(f"  {t}: {c}")
