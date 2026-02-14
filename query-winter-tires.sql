-- Find winter tires for BMW X3 245/35 R21 (front) and 275/30 R21 (rear)
SELECT 
  id, brand, model, width, height, diameter, season, 
  load_index, speed_index, price, stock
FROM workshop_inventory
WHERE 
  season = 'w' 
  AND (
    (width = '245' AND height = '35' AND diameter = '21')
    OR
    (width = '275' AND height = '30' AND diameter = '21')
  )
ORDER BY price ASC
LIMIT 10;
