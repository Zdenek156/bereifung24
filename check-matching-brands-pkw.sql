-- Check matching brands for BMW X3 mixed tires
-- Front: 245/35 R21 | Rear: 275/30 R21 | Season: Summer (s)

-- Front brands
SELECT 
  'FRONT 245/35 R21' as position,
  brand,
  COUNT(*) as models,
  MIN(price) as min_price,
  ARRAY_AGG(DISTINCT model ORDER BY model) as models_available
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.width = '245'
  AND wi.height = '35'
  AND wi.diameter = '21'
  AND wi.season = 's'
  AND wi.vehicle_type = 'PKW'
GROUP BY brand
ORDER BY brand;

-- Rear brands
SELECT 
  'REAR 275/30 R21' as position,
  brand,
  COUNT(*) as models,
  MIN(price) as min_price,
  ARRAY_AGG(DISTINCT model ORDER BY model) as models_available
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.width = '275'
  AND wi.height = '30'
  AND wi.diameter = '21'
  AND wi.season = 's'
  AND wi.vehicle_type = 'PKW'
GROUP BY brand
ORDER BY brand;

-- MATCHING BRANDS
SELECT 
  'MATCHING' as status,
  front.brand
FROM (
  SELECT DISTINCT brand
  FROM workshop_inventory wi
  JOIN workshops w ON wi.workshop_id = w.id
  WHERE w."companyName" = 'Luxus24'
    AND wi.width = '245' AND wi.height = '35' AND wi.diameter = '21'
    AND wi.season = 's' AND wi.vehicle_type = 'PKW'
) front
INNER JOIN (
  SELECT DISTINCT brand
  FROM workshop_inventory wi
  JOIN workshops w ON wi.workshop_id = w.id
  WHERE w."companyName" = 'Luxus24'
    AND wi.width = '275' AND wi.height = '30' AND wi.diameter = '21'
    AND wi.season = 's' AND wi.vehicle_type = 'PKW'
) rear ON front.brand = rear.brand
ORDER BY front.brand;
