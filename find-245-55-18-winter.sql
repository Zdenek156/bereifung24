SELECT brand, model, width, height, diameter, season, load_index, speed_index, price, stock 
FROM workshop_inventory 
WHERE width = '245' 
  AND height = '55' 
  AND diameter = '18' 
  AND season = 'w' 
ORDER BY price ASC
LIMIT 10;
