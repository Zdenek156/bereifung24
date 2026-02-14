-- Check available tire brands for FRONT (245/35 R21)
SELECT 
  'FRONT 245/35 R21' as position,
  t.brand, 
  COUNT(*) as tire_models, 
  MIN(wt.price_per_tire) as min_price,
  MAX(wt.price_per_tire) as max_price
FROM tire t
JOIN workshop_tire wt ON t.id = wt.tire_id
JOIN workshop w ON wt.workshop_id = w.id
WHERE w.company_name = 'Luxus24'
  AND t.width = 245
  AND t.aspect_ratio = 35
  AND t.diameter = 21
  AND t.season = 's'
GROUP BY t.brand
ORDER BY min_price;

-- Check available tire brands for REAR (275/30 R21)
SELECT 
  'REAR 275/30 R21' as position,
  t.brand, 
  COUNT(*) as tire_models, 
  MIN(wt.price_per_tire) as min_price,
  MAX(wt.price_per_tire) as max_price
FROM tire t
JOIN workshop_tire wt ON t.id = wt.tire_id
JOIN workshop w ON wt.workshop_id = w.id
WHERE w.company_name = 'Luxus24'
  AND t.width = 275
  AND t.aspect_ratio = 30
  AND t.diameter = 21
  AND t.season = 's'
GROUP BY t.brand
ORDER BY min_price;

-- Check for MATCHING BRANDS (available in both sizes)
SELECT 
  'MATCHING BRANDS' as info,
  front.brand as matching_brand,
  front.tire_models as front_models,
  front.min_price as front_min_price,
  rear.tire_models as rear_models,
  rear.min_price as rear_min_price,
  (front.min_price * 2 + rear.min_price * 2) as total_4_tires_min
FROM (
  SELECT t.brand, COUNT(*) as tire_models, MIN(wt.price_per_tire) as min_price
  FROM tire t
  JOIN workshop_tire wt ON t.id = wt.tire_id
  JOIN workshop w ON wt.workshop_id = w.id
  WHERE w.company_name = 'Luxus24'
    AND t.width = 245 AND t.aspect_ratio = 35 AND t.diameter = 21 AND t.season = 's'
  GROUP BY t.brand
) front
INNER JOIN (
  SELECT t.brand, COUNT(*) as tire_models, MIN(wt.price_per_tire) as min_price
  FROM tire t
  JOIN workshop_tire wt ON t.id = wt.tire_id
  JOIN workshop w ON wt.workshop_id = w.id
  WHERE w.company_name = 'Luxus24'
    AND t.width = 275 AND t.aspect_ratio = 30 AND t.diameter = 21 AND t.season = 's'
  GROUP BY t.brand
) rear ON front.brand = rear.brand
ORDER BY total_4_tires_min;
