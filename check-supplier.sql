SELECT supplier, "connectionType", "autoOrder", "isActive" 
FROM workshop_suppliers 
WHERE "workshopId" = 'cml3g7rxd000ckeyn9ypqgg65';

SELECT COUNT(*) as inventory_count 
FROM workshop_inventory 
WHERE "workshopId" = 'cml3g7rxd000ckeyn9ypqgg65';

SELECT COUNT(*) as catalog_total 
FROM tire_catalog 
WHERE supplier = 'TYRESYSTEM';

SELECT COUNT(*) as catalog_235_35_19 
FROM tire_catalog 
WHERE supplier = 'TYRESYSTEM' AND width = '235' AND height = '35' AND diameter = '19';

SELECT COUNT(*) as inv_235_35_19 
FROM workshop_inventory 
WHERE "workshopId" = 'cml3g7rxd000ckeyn9ypqgg65' AND width = '235' AND height = '35' AND diameter = '19';

SELECT season, COUNT(*) 
FROM tire_catalog 
WHERE supplier = 'TYRESYSTEM' AND width = '235' AND height = '35' AND diameter = '19'
GROUP BY season;

SELECT run_flat, COUNT(*) FROM workshop_inventory 
WHERE workshop_id = 'cml3g7rxd000ckeyn9ypqgg65' 
AND width = '225' AND height = '45' AND diameter = '17' 
AND season = 's' AND stock >= 4 
GROUP BY run_flat;

SELECT COUNT(*) as total_225_45_17_summer FROM workshop_inventory 
WHERE workshop_id = 'cml3g7rxd000ckeyn9ypqgg65' 
AND width = '225' AND height = '45' AND diameter = '17' 
AND season = 's' AND stock >= 4;
