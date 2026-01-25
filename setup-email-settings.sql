-- Check if email settings exist, if not create default one for Bereifung24
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM email_settings LIMIT 1) THEN
    INSERT INTO email_settings (
      id,
      "imapHost",
      "imapPort",
      "imapUser",
      "imapPassword",
      "imapTls",
      "smtpHost",
      "smtpPort",
      "smtpUser",
      "smtpPassword",
      "smtpSecure",
      "syncEnabled",
      "createdAt",
      "updatedAt"
    ) VALUES (
      'default-email-settings',
      'smtp.hetzner.de',
      993,
      'buchhaltung@bereifung24.de',
      'PLACEHOLDER_PASSWORD', -- Needs to be updated manually
      true,
      'smtp.hetzner.de',
      465,
      'buchhaltung@bereifung24.de',
      'PLACEHOLDER_PASSWORD', -- Needs to be updated manually
      true,
      false, -- Sync disabled by default
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Email settings created. Please update SMTP password!';
  ELSE
    RAISE NOTICE 'Email settings already exist';
  END IF;
END $$;
