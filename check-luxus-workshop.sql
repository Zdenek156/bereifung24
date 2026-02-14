-- 1. Find Luxus24 workshop exact name and inventory count
SELECT 
  w.id,
  w."companyName",
  COUNT(wi.id) as inventory_count
FROM workshops w
LEFT JOIN workshop_inventory wi ON w.id = wi.workshop_id
WHERE w."companyName" ILIKE '%luxus%'
GROUP BY w.id, w."companyName";

-- 2. Check data types and sample values for dimensions
SELECT 
  width, height, diameter, season, brand,
  COUNT(*) as count
FROM workshop_inventory wi
JOIN workshops w ON wi.workshop_id = w.id
WHERE w."companyName" ILIKE '%luxus%'
GROUP BY width, height, diameter, season, brand
ORDER BY count DESC
LIMIT 20;

-- 3. Check if dimensions are integers or strings
SELECT 
  pg_typeof(width) as width_type,
  pg_typeof(height) as height_type,
  pg_typeof(diameter) as diameter_type,
  pg_typeof(season) as season_type
FROM workshop_inventory
LIMIT 1;
