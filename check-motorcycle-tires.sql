-- Check motorcycle tire inventory
SELECT 
  COUNT(*) as total_motorcycle_tires,
  COUNT(DISTINCT workshop_id) as workshops_with_moto_tires
FROM "WorkshopInventory" 
WHERE vehicle_type = 'Motorrad';

-- Check specific dimensions from database
SELECT 
  width, 
  height, 
  diameter,
  COUNT(*) as count,
  MIN(stock_quantity) as min_stock,
  MAX(stock_quantity) as max_stock
FROM "WorkshopInventory" 
WHERE vehicle_type = 'Motorrad'
GROUP BY width, height, diameter
ORDER BY count DESC
LIMIT 20;
