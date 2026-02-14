-- Check vehicle_type values in Luxus24 inventory
SELECT 
  vehicle_type,
  COUNT(*) as count
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
GROUP BY vehicle_type;

-- Check if there are any R21 tires WITHOUT vehicle_type filter
SELECT 
  'R21 tires (no vehicle_type filter)' as info,
  width || '/' || height || ' R' || diameter as size,
  season,
  brand,
  vehicle_type,
  COUNT(*) as models,
  MIN(price) as min_price
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" = 'Luxus24'
  AND wi.diameter = '21'
GROUP BY width, height, diameter, season, brand, vehicle_type
ORDER BY COUNT(*) DESC;
