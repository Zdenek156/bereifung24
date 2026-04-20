SELECT id, key, title, LEFT(content, 100) as content_preview, version, target, updated_at FROM legal_texts ORDER BY key, target;
