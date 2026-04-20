INSERT INTO legal_texts (id, key, title, content, version, target, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'agb', 'Allgemeine Geschäftsbedingungen', '<h2>Allgemeine Geschäftsbedingungen</h2><p>Die AGB werden in Kürze hier veröffentlicht.</p>', 1, 'app', NOW(), NOW()),
  (gen_random_uuid()::text, 'datenschutz', 'Datenschutzerklärung', '<h2>Datenschutzerklärung</h2><p>Die Datenschutzerklärung wird in Kürze hier veröffentlicht.</p>', 1, 'app', NOW(), NOW()),
  (gen_random_uuid()::text, 'impressum', 'Impressum', '<h2>Impressum</h2><p>Bereifung24 GmbH</p><p>Das Impressum wird in Kürze hier veröffentlicht.</p>', 1, 'app', NOW(), NOW()),
  (gen_random_uuid()::text, 'agb', 'Allgemeine Geschäftsbedingungen', '<h2>Allgemeine Geschäftsbedingungen</h2><p>Die AGB werden in Kürze hier veröffentlicht.</p>', 1, 'web', NOW(), NOW()),
  (gen_random_uuid()::text, 'datenschutz', 'Datenschutzerklärung', '<h2>Datenschutzerklärung</h2><p>Die Datenschutzerklärung wird in Kürze hier veröffentlicht.</p>', 1, 'web', NOW(), NOW()),
  (gen_random_uuid()::text, 'impressum', 'Impressum', '<h2>Impressum</h2><p>Bereifung24 GmbH</p><p>Das Impressum wird in Kürze hier veröffentlicht.</p>', 1, 'web', NOW(), NOW())
ON CONFLICT (key, target) DO NOTHING;
