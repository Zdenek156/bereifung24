SELECT DISTINCT brand 
FROM workshop_inventory 
WHERE workshop_id = 'cml3g7rxd000ckeyn9ypqgg65'
  AND width = '245'
  AND height = '35'
  AND diameter = '21'
  AND season = 's'
ORDER BY brand
LIMIT 10;
