-- Find workshops with winter tire inventory for BMW X3
SELECT 
  w.id, 
  w.name, 
  COUNT(DISTINCT wi.id) as tire_count,
  COUNT(DISTINCT CASE WHEN wi.width = '245' AND wi.height = '35' THEN wi.id END) as front_tires,
  COUNT(DISTINCT CASE WHEN wi.width = '275' AND wi.height = '30' THEN wi.id END) as rear_tires
FROM "Workshop" w 
LEFT JOIN workshop_inventory wi ON w.id = wi.workshop_id 
WHERE 
  wi.season = 'w' 
  AND wi.width IN ('245', '275') 
  AND wi.height IN ('35', '30') 
  AND wi.diameter = '21'
GROUP BY w.id, w.name
ORDER BY tire_count DESC;
