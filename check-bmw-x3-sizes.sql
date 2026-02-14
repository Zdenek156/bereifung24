-- Check for BMW X3 tire sizes specifically
-- Front: 245/35 R21
-- Rear: 275/30 R21

SELECT 
  '245/35 R21 Front Tires' as search,
  brand,
  model,
  price,
  stock
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.width = '245'
  AND wi.height = '35'
  AND wi.diameter = '21'
  AND wi.season = 's'
  AND wi.vehicle_type = 'car'
LIMIT 10;

SELECT 
  '275/30 R21 Rear Tires' as search,
  brand,
  model,
  price,
  stock
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.width = '275'
  AND wi.height = '30'
  AND wi.diameter = '21'
  AND wi.season = 's'
  AND wi.vehicle_type = 'car'
LIMIT 10;

-- Check what 21" tires they have
SELECT 
  'All R21 tires' as info,
  width || '/' || height || ' R' || diameter as size,
  season,
  brand,
  COUNT(*) as models
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.diameter = '21'
  AND wi.vehicle_type = 'car'
GROUP BY width, height, diameter, season, brand
ORDER BY COUNT(*) DESC;
