-- Check tire brands available for BMW X3 mixed sizes at Luxus24
-- Front: 245/35 R21 | Rear: 275/30 R21 | Season: Summer

-- 1. Brands available for FRONT tires (245/35 R21)
SELECT 
  'FRONT TIRES (245/35 R21)' as info,
  wi.brand,
  COUNT(*) as tire_models,
  MIN(wi.price) as min_price,
  MAX(wi.price) as max_price,
  AVG(wi.price)::numeric(10,2) as avg_price
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.width = '245'
  AND wi.height = '35'
  AND wi.diameter = '21'
  AND wi.season = 's'
  AND wi.vehicle_type = 'car'
GROUP BY wi.brand
ORDER BY min_price;

-- 2. Brands available for REAR tires (275/30 R21)
SELECT 
  'REAR TIRES (275/30 R21)' as info,
  wi.brand,
  COUNT(*) as tire_models,
  MIN(wi.price) as min_price,
  MAX(wi.price) as max_price,
  AVG(wi.price)::numeric(10,2) as avg_price
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.width = '275'
  AND wi.height = '30'
  AND wi.diameter = '21'
  AND wi.season = 's'
  AND wi.vehicle_type = 'car'
GROUP BY wi.brand
ORDER BY min_price;

-- 3. MATCHING BRANDS (available in BOTH sizes)
SELECT 
  'MATCHING BRANDS' as info,
  front.brand as matching_brand,
  front.tire_models as front_models,
  front.min_price as front_min_price,
  rear.tire_models as rear_models,
  rear.min_price as rear_min_price,
  (front.min_price * 2 + rear.min_price * 2) as total_4_tires_min
FROM (
  SELECT wi.brand, COUNT(*) as tire_models, MIN(wi.price) as min_price
  FROM workshop_inventory wi
  JOIN workshops w ON wi.workshop_id = w.id
  WHERE w."companyName" = 'Luxus24'
    AND wi.width = '245' AND wi.height = '35' AND wi.diameter = '21'
    AND wi.season = 's' AND wi.vehicle_type = 'car'
  GROUP BY wi.brand
) front
INNER JOIN (
  SELECT wi.brand, COUNT(*) as tire_models, MIN(wi.price) as min_price
  FROM workshop_inventory wi
  JOIN workshops w ON wi.workshop_id = w.id
  WHERE w."companyName" = 'Luxus24'
    AND wi.width = '275' AND wi.height = '30' AND wi.diameter = '21'
    AND wi.season = 's' AND wi.vehicle_type = 'car'
  GROUP BY wi.brand
) rear ON front.brand = rear.brand
ORDER BY total_4_tires_min;
