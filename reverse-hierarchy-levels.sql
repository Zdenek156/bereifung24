-- Kehrt hierarchyLevel-Werte um: alt(0-3) -> neu(3-0)
-- Alt: 0=Mitarbeiter, 1=Teamleiter, 2=Manager, 3=Geschäftsführung
-- Neu: 0=Geschäftsführung, 1=Manager, 2=Teamleiter, 3=Mitarbeiter

-- Temporäre Spalte für die Umrechnung
ALTER TABLE B24Employee ADD COLUMN hierarchyLevel_temp INT;

-- Umkehrung: 3 - alter_wert = neuer_wert
UPDATE B24Employee SET hierarchyLevel_temp = 3 - hierarchyLevel;

-- Werte übertragen
UPDATE B24Employee SET hierarchyLevel = hierarchyLevel_temp;

-- Temporäre Spalte löschen
ALTER TABLE B24Employee DROP COLUMN hierarchyLevel_temp;

-- Verifizierung (optional - zeigt die aktualisierten Werte)
SELECT firstName, lastName, position, hierarchyLevel,
  CASE hierarchyLevel
    WHEN 0 THEN 'Geschäftsführung'
    WHEN 1 THEN 'Manager'
    WHEN 2 THEN 'Teamleiter'
    WHEN 3 THEN 'Mitarbeiter'
    ELSE 'Unbekannt'
  END as hierarchyLabel
FROM B24Employee
WHERE isActive = 1
ORDER BY hierarchyLevel ASC;
