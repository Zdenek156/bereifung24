-- Welche Winterreifen-Dimensionen sind verfügbar?
SELECT DISTINCT width, height, diameter, COUNT(*) as anzahl_reifen, MIN(price) as guenstigster_preis
FROM workshop_inventory 
WHERE season = 'w' 
GROUP BY width, height, diameter
ORDER BY COUNT(*) DESC
LIMIT 20;
