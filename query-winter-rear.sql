-- Find winter tires for BMW X3 275/30 R21 (rear)
SELECT 
  id, brand, model, width, height, diameter, season, 
  load_index, speed_index, price, stock
FROM workshop_inventory
WHERE 
  season = 'w' 
  AND width = '275'
  AND height = '30'
  AND diameter = '21'
ORDER BY price ASC
LIMIT 10;
