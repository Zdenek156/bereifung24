-- SKR04 Kontenplan Erweiterung für GmbH (Bilanzierung)
-- Zusätzliche Konten für doppelte Buchführung

-- ============================================
-- AKTIVKONTEN (Vermögen)
-- ============================================

-- Anlagevermögen (bereits teilweise vorhanden, erweitern)
INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('0100', 'Konzessionen, Schutzrechte', 'ASSET', 'Immaterielle Vermögensgegenstände'),
('0200', 'Gebäude auf fremdem Grundstück', 'ASSET', 'Bauten auf fremden Grundstücken'),
('0210', 'Betriebs- und Geschäftsausstattung', 'ASSET', 'Büromöbel, Computer, etc.'),
('0220', 'Andere Anlagen, Betriebs- u. Geschäftsausstattung', 'ASSET', 'Sonstige Ausstattung'),
('0280', 'Geleistete Anzahlungen auf Sachanlagen', 'ASSET', 'Anzahlungen für Anlagen')
ON CONFLICT ("accountNumber") DO NOTHING;

-- Umlaufvermögen
INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('1000', 'Kasse', 'ASSET', 'Bargeld in der Kasse'),
('1100', 'Postbank', 'ASSET', 'Bankguthaben Postbank'),
('1140', 'Sparkasse', 'ASSET', 'Bankguthaben Sparkasse'),
('1360', 'Forderungen aus Lieferungen und Leistungen', 'ASSET', 'Kundenforderungen'),
('1370', 'Forderungen gegenüber Gesellschaftern', 'ASSET', 'Gesellschafter-Darlehen'),
('1400', 'Sonstige Vermögensgegenstände (Forderungen)', 'ASSET', 'Sonstige Forderungen'),
('1500', 'Geleistete Anzahlungen', 'ASSET', 'Anzahlungen an Lieferanten'),
('1571', 'Abziehbare Vorsteuer 19%', 'ASSET', 'Vorsteuer aus Eingangsrechnungen'),
('1575', 'Abziehbare Vorsteuer 7%', 'ASSET', 'Vorsteuer ermäßigter Steuersatz')
ON CONFLICT ("accountNumber") DO NOTHING;

-- Rechnungsabgrenzungsposten (Aktiv)
INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('0980', 'Aktive Rechnungsabgrenzung', 'ASSET', 'Vorausgezahlte Aufwendungen (z.B. Versicherungen, Miete)'),
('0985', 'Disagio', 'ASSET', 'Damnum bei Darlehen')
ON CONFLICT ("accountNumber") DO NOTHING;

-- ============================================
-- PASSIVKONTEN (Kapital + Schulden)
-- ============================================

-- Eigenkapital
INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('2800', 'Gezeichnetes Kapital (GmbH)', 'LIABILITY', 'Stammkapital der GmbH (mind. 25.000 EUR)'),
('2801', 'Ausstehende Einlagen', 'LIABILITY', 'Noch nicht eingezahltes Stammkapital'),
('2850', 'Kapitalrücklage', 'LIABILITY', 'Kapitalrücklage aus Agio'),
('2860', 'Gewinnrücklage', 'LIABILITY', 'Thesaurierte Gewinne'),
('2870', 'Gewinnvortrag/Verlustvortrag', 'LIABILITY', 'Vorjahresergebnis'),
('2880', 'Jahresüberschuss/Jahresfehlbetrag', 'LIABILITY', 'Ergebnis des laufenden Geschäftsjahres'),
('2100', 'Privatentnahmen allgemein', 'LIABILITY', 'Entnahmen durch Gesellschafter (gegen Eigenkapital)'),
('2110', 'Privateinlagen', 'LIABILITY', 'Einlagen von Gesellschaftern')
ON CONFLICT ("accountNumber") DO NOTHING;

-- Rückstellungen
INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('3000', 'Rückstellungen für Pensionen', 'LIABILITY', 'Pensionsrückstellungen'),
('3010', 'Rückstellungen für Steuern', 'LIABILITY', 'Rückstellung für Steuernachzahlungen'),
('3020', 'Sonstige Rückstellungen', 'LIABILITY', 'Rückstellungen für ungewisse Verbindlichkeiten'),
('3030', 'Rückstellung Urlaubsverbindlichkeiten', 'LIABILITY', 'Rückstellung für nicht genommenen Urlaub'),
('3040', 'Rückstellung Garantieverpflichtungen', 'LIABILITY', 'Gewährleistungsrückstellungen')
ON CONFLICT ("accountNumber") DO NOTHING;

-- Verbindlichkeiten (erweitern)
INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('3100', 'Darlehen Kreditinstitute', 'LIABILITY', 'Bankdarlehen langfristig'),
('3110', 'Darlehen von Gesellschaftern', 'LIABILITY', 'Gesellschafter-Darlehen'),
('3150', 'Verbindlichkeiten aus Lieferungen und Leistungen', 'LIABILITY', 'Lieferantenverbindlichkeiten'),
('3200', 'Erhaltene Anzahlungen', 'LIABILITY', 'Anzahlungen von Kunden'),
('3400', 'Verbindlichkeiten gegenüber Gesellschaftern', 'LIABILITY', 'Sonstige Verbindlichkeiten Gesellschafter'),
('3500', 'Verbindlichkeiten aus Steuern', 'LIABILITY', 'Umsatzsteuer-Zahllast, Lohnsteuer'),
('3550', 'Verbindlichkeiten Sozialversicherung', 'LIABILITY', 'SV-Beiträge an Krankenkasse')
ON CONFLICT ("accountNumber") DO NOTHING;

-- Rechnungsabgrenzungsposten (Passiv)
INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('3900', 'Passive Rechnungsabgrenzung', 'LIABILITY', 'Im Voraus erhaltene Erlöse (z.B. Vorauszahlungen Kunden)')
ON CONFLICT ("accountNumber") DO NOTHING;

-- ============================================
-- AUFWANDSKONTEN (Erweitern für GmbH)
-- ============================================

INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
-- Personalkosten
('4100', 'Löhne und Gehälter GmbH', 'EXPENSE', 'Bruttogehälter aller Mitarbeiter'),
('4110', 'Geschäftsführergehälter', 'EXPENSE', 'Gehalt Geschäftsführer'),
('4138', 'Gesetzliche Sozialaufwendungen', 'EXPENSE', 'Arbeitgeberanteile SV'),
('4140', 'Freiwillige soziale Aufwendungen', 'EXPENSE', 'Vermögenswirksame Leistungen, etc.'),

-- Abschreibungen
('6220', 'Abschreibungen auf Sachanlagen', 'EXPENSE', 'Planmäßige Abschreibungen'),
('6230', 'Abschreibungen auf immaterielle Vermögensgegenstände', 'EXPENSE', 'Abschreibung Software, Lizenzen'),
('6260', 'Abschreibungen auf Finanzanlagen', 'EXPENSE', 'Abschreibung Beteiligungen'),

-- Zinsen und Finanzaufwendungen
('6500', 'Zinsaufwendungen für Kredite', 'EXPENSE', 'Darlehenszinsen'),
('6510', 'Zinsaufwendungen sonstige', 'EXPENSE', 'Sonstige Zinsen'),
('6600', 'Verluste aus Abgang Anlagevermögen', 'EXPENSE', 'Buchverluste bei Verkauf/Verschrottung'),

-- Steuern (nicht Ertragsteuern)
('6640', 'Grundsteuer', 'EXPENSE', 'Grundsteuer Betriebsgrundstück'),
('6645', 'Kfz-Steuer', 'EXPENSE', 'Kraftfahrzeugsteuer'),
('6650', 'Sonstige Steuern', 'EXPENSE', 'Gewerbesteuer, etc.'),

-- Rückstellungen
('6850', 'Zuführung zu Rückstellungen', 'EXPENSE', 'Bildung von Rückstellungen'),

-- Außerordentliche Aufwendungen
('6960', 'Periodenfremde Aufwendungen', 'EXPENSE', 'Nachträgliche Rechnungen Vorjahr'),
('6970', 'Außerordentliche Aufwendungen', 'EXPENSE', 'Einmalige außerordentliche Kosten')

ON CONFLICT ("accountNumber") DO NOTHING;

-- ============================================
-- ERTRAGSKONTEN (Erweitern für GmbH)
-- ============================================

INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
-- Erlöse (bereits vorhanden, ergänzen)
('8100', 'Erlöse 19% USt', 'REVENUE', 'Umsatzerlöse Normalsteuersatz'),
('8125', 'Erlöse 7% USt', 'REVENUE', 'Umsatzerlöse ermäßigter Steuersatz'),
('8150', 'Erlöse steuerfrei', 'REVENUE', 'Steuerfreie Umsätze'),

-- Bestandsveränderungen
('8200', 'Bestandsveränderungen unfertige Leistungen', 'REVENUE', 'Wertänderung halbfertige Arbeiten'),
('8210', 'Bestandsveränderungen fertige Erzeugnisse', 'REVENUE', 'Wertänderung Lagerbestand'),

-- Sonstige betriebliche Erträge
('8600', 'Erlöse aus Anlageabgang', 'REVENUE', 'Gewinne aus Verkauf Anlagevermögen'),
('8610', 'Erträge aus Auflösung von Rückstellungen', 'REVENUE', 'Nicht benötigte Rückstellungen'),
('8620', 'Zinserträge', 'REVENUE', 'Bankzinsen'),
('8630', 'Mieterträge', 'REVENUE', 'Mieteinnahmen'),
('8640', 'Versicherungserst attungen', 'REVENUE', 'Erstattungen Versicherungen'),
('8650', 'Erträge aus Zuschreibungen', 'REVENUE', 'Wertaufholungen'),

-- Außerordentliche Erträge
('8960', 'Periodenfremde Erträge', 'REVENUE', 'Nachträgliche Gutschriften Vorjahr'),
('8970', 'Außerordentliche Erträge', 'REVENUE', 'Einmalige außerordentliche Einnahmen')

ON CONFLICT ("accountNumber") DO NOTHING;

-- ============================================
-- ABSCHLUSSKONTEN (Neu für GmbH)
-- ============================================

INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('9000', 'Saldenvortragskonten', 'REVENUE', 'Eröffnungsbilanzkonten'),
('9008', 'Gewinn- und Verlustkonto', 'REVENUE', 'GuV-Konto zum Abschließen der Erfolgskonten'),
('9009', 'Schlussbilanzkonto', 'REVENUE', 'Schlussbilanz zum Jahresende')
ON CONFLICT ("accountNumber") DO NOTHING;

-- ============================================
-- ERTRAGSTEUERN (Nur für Information, wird nicht in EÜR benötigt, aber in GuV)
-- ============================================

INSERT INTO "chart_of_accounts" ("accountNumber", "accountName", "accountType", "description") VALUES
('7300', 'Körperschaftsteuer', 'EXPENSE', 'KSt für GmbH (15%)'),
('7310', 'Solidaritätszuschlag', 'EXPENSE', 'SolZ auf Körperschaftsteuer (5,5%)'),
('7320', 'Gewerbesteuer', 'EXPENSE', 'Gewerbesteuer (abhängig von Hebesatz)')
ON CONFLICT ("accountNumber") DO NOTHING;
