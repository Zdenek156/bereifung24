-- Create Blog Posts for Bereifung24
-- Categories: Reifenwissen, Werkstätten, Regional (Stuttgart)
-- Target Audiences: CUSTOMER, WORKSHOP, BOTH

DO $$
DECLARE
  admin_id TEXT;
  cat_reifenwissen_id TEXT;
  cat_werkstatt_id TEXT;
  cat_regional_id TEXT;
  tag_winterreifen_id TEXT;
  tag_stuttgart_id TEXT;
  tag_sicherheit_id TEXT;
  tag_werkstatt_id TEXT;
  tag_tipps_id TEXT;
  tag_gesetzgebung_id TEXT;
  post_1_id TEXT;
  post_2_id TEXT;
  post_3_id TEXT;
  post_4_id TEXT;
  post_5_id TEXT;
BEGIN
  -- Get first employee for author
  SELECT id INTO admin_id FROM b24_employees WHERE "isActive" = true LIMIT 1;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No active employee found!';
  END IF;

  -- Create Categories
  INSERT INTO blog_categories (id, name, slug, description, icon, color, "sortOrder", "createdAt", "updatedAt")
  VALUES 
    (gen_random_uuid()::text, 'Reifenwissen', 'reifenwissen', 'Alles rund um Reifen, Pflege und Wartung', '🛞', '#3B82F6', 1, NOW(), NOW()),
    (gen_random_uuid()::text, 'Für Werkstätten', 'werkstatten', 'Tipps und Informationen für Werkstattbetreiber', '🔧', '#10B981', 2, NOW(), NOW()),
    (gen_random_uuid()::text, 'Regional', 'regional', 'Regionale Informationen und Tipps', '📍', '#F59E0B', 3, NOW(), NOW())
  ON CONFLICT (slug) DO NOTHING;

  -- Get category IDs
  SELECT id INTO cat_reifenwissen_id FROM blog_categories WHERE slug = 'reifenwissen';
  SELECT id INTO cat_werkstatt_id FROM blog_categories WHERE slug = 'werkstatten';
  SELECT id INTO cat_regional_id FROM blog_categories WHERE slug = 'regional';

  -- Create Tags
  INSERT INTO blog_tags (id, name, slug, "usageCount", "createdAt")
  VALUES 
    (gen_random_uuid()::text, 'Winterreifen', 'winterreifen', 0, NOW()),
    (gen_random_uuid()::text, 'Stuttgart', 'stuttgart', 0, NOW()),
    (gen_random_uuid()::text, 'Sicherheit', 'sicherheit', 0, NOW()),
    (gen_random_uuid()::text, 'Werkstatt-Tipps', 'werkstatt-tipps', 0, NOW()),
    (gen_random_uuid()::text, 'Ratgeber', 'ratgeber', 0, NOW()),
    (gen_random_uuid()::text, 'Gesetzgebung', 'gesetzgebung', 0, NOW())
  ON CONFLICT (slug) DO NOTHING;

  -- Get tag IDs
  SELECT id INTO tag_winterreifen_id FROM blog_tags WHERE slug = 'winterreifen';
  SELECT id INTO tag_stuttgart_id FROM blog_tags WHERE slug = 'stuttgart';
  SELECT id INTO tag_sicherheit_id FROM blog_tags WHERE slug = 'sicherheit';
  SELECT id INTO tag_werkstatt_id FROM blog_tags WHERE slug = 'werkstatt-tipps';
  SELECT id INTO tag_tipps_id FROM blog_tags WHERE slug = 'ratgeber';
  SELECT id INTO tag_gesetzgebung_id FROM blog_tags WHERE slug = 'gesetzgebung';

  -- Create unique IDs for posts
  post_1_id := gen_random_uuid()::text;
  post_2_id := gen_random_uuid()::text;
  post_3_id := gen_random_uuid()::text;
  post_4_id := gen_random_uuid()::text;
  post_5_id := gen_random_uuid()::text;

  -- Article 1: Winterreifen in Stuttgart
  INSERT INTO blog_posts (
    id, slug, title, excerpt, content, "metaTitle", "metaDescription",
    keywords, "categoryId", "targetAudience", status, "authorId", "readTime", "createdAt", "updatedAt"
  ) VALUES (
    post_1_id,
    'winterreifen-pflicht-stuttgart-baden-wuerttemberg',
    'Winterreifen-Pflicht in Baden-Württemberg: Was Autofahrer in Stuttgart wissen müssen',
    'Die Winterreifen-Pflicht gilt auch in Stuttgart. Erfahren Sie alles über die gesetzlichen Vorgaben, den richtigen Zeitpunkt für den Reifenwechsel und wichtige Tipps für die kalte Jahreszeit.',
    '<h2>Winterreifen-Pflicht in Baden-Württemberg</h2><p>Seit 2010 gilt in Deutschland die situative Winterreifenpflicht. Das bedeutet: Bei winterlichen Straßenverhältnissen wie Glatteis, Schneeglätte, Schneematsch, Eis- oder Reifglätte müssen Sie mit Winterreifen oder Ganzjahresreifen fahren.</p><h3>Was gilt in Stuttgart?</h3><p>Auch in Stuttgart und der Region Baden-Württemberg gelten die bundesweiten Regelungen. Besonders in den Wintermonaten von Oktober bis Ostern sollten Sie auf Winterreifen setzen – die bekannte O-bis-O-Regel ist hier ein guter Richtwert.</p>',
    'Winterreifen-Pflicht Stuttgart: Alles zur Winterreifenpflicht in BW',
    'Winterreifen-Pflicht in Stuttgart und Baden-Württemberg: Gesetzliche Regelungen, Bußgelder, O-bis-O-Regel und wichtige Tipps für die kalte Jahreszeit.',
    ARRAY['Winterreifen', 'Stuttgart', 'Winterreifenpflicht', 'Baden-Württemberg', 'O-bis-O-Regel'],
    cat_regional_id,
    'CUSTOMER',
    'DRAFT',
    admin_id,
    5,
    NOW(),
    NOW()
  );

  -- Tags for Article 1
  INSERT INTO "_BlogPostToTag" ("A", "B") VALUES
    (post_1_id, tag_winterreifen_id),
    (post_1_id, tag_stuttgart_id),
    (post_1_id, tag_sicherheit_id),
    (post_1_id, tag_gesetzgebung_id);

  -- Article 2: Reifenlagerung
  INSERT INTO blog_posts (
    id, slug, title, excerpt, content, "metaTitle", "metaDescription",
    keywords, "categoryId", "targetAudience", status, "authorId", "readTime", "createdAt", "updatedAt"
  ) VALUES (
    post_2_id,
    'reifen-richtig-lagern-tipps',
    'Reifenlagerung: So bewahren Sie Ihre Reifen optimal auf',
    'Die richtige Lagerung von Reifen verlängert deren Lebensdauer erheblich. Erfahren Sie, wie Sie Sommer- und Winterreifen korrekt lagern und worauf Sie achten müssen.',
    '<h2>Warum ist die richtige Reifenlagerung wichtig?</h2><p>Reifen sind aus Gummi und unterliegen natürlichem Alterungsprozess. Die richtige Lagerung kann die Lebensdauer Ihrer Reifen um bis zu 2 Jahre verlängern und Ihnen bares Geld sparen.</p><h3>Die 5 goldenen Regeln der Reifenlagerung</h3><h4>1. Reifen gründlich reinigen</h4><p>Entfernen Sie vor der Einlagerung Schmutz, Steine und Bremsstaub. Trocknen Sie die Reifen vollständig ab, um Schimmelbildung zu vermeiden.</p>',
    'Reifen richtig lagern: 5 goldene Regeln für lange Lebensdauer',
    'Reifen richtig lagern und Geld sparen: Die 5 wichtigsten Tipps für die optimale Lagerung von Sommer- und Winterreifen.',
    ARRAY['Reifenlagerung', 'Reifenpflege', 'Reifen lagern', 'Reifenhotel', 'Tipps'],
    cat_reifenwissen_id,
    'BOTH',
    'DRAFT',
    admin_id,
    4,
    NOW(),
    NOW()
  );

  -- Tags for Article 2
  INSERT INTO "_BlogPostToTag" ("A", "B") VALUES
    (post_2_id, tag_tipps_id),
    (post_2_id, tag_sicherheit_id);

  -- Article 3: Werkstatt-Effizienz
  INSERT INTO blog_posts (
    id, slug, title, excerpt, content, "metaTitle", "metaDescription",
    keywords, "categoryId", "targetAudience", status, "authorId", "readTime", "createdAt", "updatedAt"
  ) VALUES (
    post_3_id,
    'reifenwechsel-werkstatt-effizienz-steigern',
    '10 Tipps für Werkstätten: So optimieren Sie den Reifenwechsel',
    'Der Reifenwechsel ist für Werkstätten ein wichtiges Saisongeschäft. Mit diesen 10 Profi-Tipps steigern Sie Effizienz, Kundenzufriedenheit und Umsatz während der Hochsaison.',
    '<h2>Reifenwechsel-Saison optimal nutzen</h2><p>Die Reifenwechsel-Saison im Frühjahr und Herbst ist für Werkstätten eine der umsatzstärksten Zeiten. Mit der richtigen Planung und Organisation können Sie Ihre Kapazitäten optimal nutzen und gleichzeitig die Kundenzufriedenheit steigern.</p><h3>1. Frühzeitige Terminplanung</h3><p>Ermöglichen Sie Ihren Kunden bereits 6-8 Wochen im Voraus Termine zu buchen. Online-Buchungssysteme wie Bereifung24 automatisieren diesen Prozess und reduzieren Telefonanrufe um bis zu 70%.</p>',
    'Reifenwechsel-Effizienz: 10 Profi-Tipps für Werkstätten',
    'Reifenwechsel optimal organisieren: 10 bewährte Tipps für Werkstätten zur Steigerung von Effizienz und Umsatz.',
    ARRAY['Werkstatt', 'Reifenwechsel', 'Effizienz', 'Organisation', 'Business'],
    cat_werkstatt_id,
    'WORKSHOP',
    'DRAFT',
    admin_id,
    7,
    NOW(),
    NOW()
  );

  -- Tags for Article 3
  INSERT INTO "_BlogPostToTag" ("A", "B") VALUES
    (post_3_id, tag_werkstatt_id),
    (post_3_id, tag_tipps_id);

  -- Article 4: Reifendruck
  INSERT INTO blog_posts (
    id, slug, title, excerpt, content, "metaTitle", "metaDescription",
    keywords, "categoryId", "targetAudience", status, "authorId", "readTime", "createdAt", "updatedAt"
  ) VALUES (
    post_4_id,
    'reifendruck-pruefen-warum-wichtig',
    'Reifendruck prüfen: Warum es so wichtig ist und wie oft Sie es tun sollten',
    'Der richtige Reifendruck ist entscheidend für Sicherheit, Kraftstoffverbrauch und Reifenlebensdauer. Erfahren Sie, wie Sie den Reifendruck korrekt prüfen und einstellen.',
    '<h2>Warum ist der richtige Reifendruck so wichtig?</h2><p>Der Reifendruck beeinflusst drei wesentliche Faktoren beim Autofahren: Sicherheit, Kraftstoffverbrauch und Reifenverschleiß. Bereits 0,5 bar Abweichung können erhebliche Auswirkungen haben.</p><h3>Auswirkungen von falschem Reifendruck</h3><h4>Zu niedriger Reifendruck:</h4><ul><li>Bis zu 15% höherer Kraftstoffverbrauch</li><li>30% kürzere Reifenlebensdauer</li></ul>',
    'Reifendruck prüfen: Der ultimative Guide für optimale Sicherheit',
    'Reifendruck richtig prüfen und einstellen: Warum es so wichtig ist, wie oft Sie es tun sollten.',
    ARRAY['Reifendruck', 'Sicherheit', 'Reifenpflege', 'Kraftstoffverbrauch', 'RDKS'],
    cat_reifenwissen_id,
    'CUSTOMER',
    'DRAFT',
    admin_id,
    6,
    NOW(),
    NOW()
  );

  -- Tags for Article 4
  INSERT INTO "_BlogPostToTag" ("A", "B") VALUES
    (post_4_id, tag_sicherheit_id),
    (post_4_id, tag_tipps_id);

  -- Article 5: Stuttgart Werkstätten
  INSERT INTO blog_posts (
    id, slug, title, excerpt, content, "metaTitle", "metaDescription",
    keywords, "categoryId", "targetAudience", status, "authorId", "readTime", "createdAt", "updatedAt"
  ) VALUES (
    post_5_id,
    'beste-werkstaetten-reifenwechsel-stuttgart',
    'Die besten Werkstätten für Reifenwechsel in Stuttgart und Umgebung',
    'Suchen Sie eine zuverlässige Werkstatt für den Reifenwechsel in Stuttgart? Erfahren Sie, worauf Sie achten sollten und wie Sie die beste Werkstatt für Ihre Bedürfnisse finden.',
    '<h2>Reifenwechsel in Stuttgart - Darauf kommt es an</h2><p>Stuttgart und die umliegenden Regionen bieten zahlreiche Werkstätten für den Reifenwechsel. Doch welche ist die richtige für Sie? In diesem Ratgeber erfahren Sie, worauf Sie achten sollten.</p><h3>Was macht eine gute Reifenwechsel-Werkstatt aus?</h3><h4>1. Professionelle Ausstattung</h4><ul><li>Moderne Montiermaschinen</li><li>Digitale Auswuchtmaschinen</li></ul>',
    'Reifenwechsel Stuttgart: Die besten Werkstätten im Vergleich',
    'Die besten Werkstätten für Reifenwechsel in Stuttgart finden: Tipps zur Auswahl, Preisvergleich und regionale Besonderheiten.',
    ARRAY['Stuttgart', 'Werkstatt', 'Reifenwechsel', 'Preisvergleich', 'Werkstattsuche'],
    cat_regional_id,
    'CUSTOMER',
    'DRAFT',
    admin_id,
    6,
    NOW(),
    NOW()
  );

  -- Tags for Article 5
  INSERT INTO "_BlogPostToTag" ("A", "B") VALUES
    (post_5_id, tag_stuttgart_id),
    (post_5_id, tag_tipps_id);

  -- Update tag usage counts
  UPDATE blog_tags SET "usageCount" = (
    SELECT COUNT(*) FROM "_BlogPostToTag" WHERE "B" = blog_tags.id
  );

  RAISE NOTICE 'Successfully created 5 blog posts, 3 categories, and 6 tags!';
END $$;
