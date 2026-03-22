#!/bin/bash
curl -s -X POST http://localhost:3000/api/customer/direct-booking/search \
  -H "Content-Type: application/json" \
  -d '{"postalCode":"59955","customerLat":51.195,"customerLon":8.531,"serviceType":"TIRE_CHANGE","packageTypes":["with_tire_purchase","four_tires","with_disposal"],"tireDimensions":{"width":"225","height":"45","diameter":"17"},"includeTires":true,"tireFilters":{"seasons":["s"]}}' \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
ws = d.get('workshops', [])
if ws:
    w = ws[0]
    print('name:', w.get('name'))
    print('tireAvailable:', w.get('tireAvailable'))
    print('tireBrand:', w.get('tireBrand'))
    print('tirePrice:', w.get('tirePrice'))
    print('totalPrice:', w.get('totalPrice'))
    print('recsCount:', len(w.get('tireRecommendations',[])))
else:
    print('NO WORKSHOPS FOUND')
    print(json.dumps(d, indent=2)[:500])
"
