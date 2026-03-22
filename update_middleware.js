const fs = require('fs');
const path = '/var/www/bereifung24/middleware.ts';
let content = fs.readFileSync(path, 'utf8');

// Add /admin/legal-texts to ROUTE_TO_APPLICATION_MAP
if (!content.includes("'/admin/legal-texts'")) {
  content = content.replace(
    "'/admin/feedback': 'feedback',",
    "'/admin/feedback': 'feedback',\n  '/admin/legal-texts': 'legal-texts',"
  );
}

// Add /api/admin/legal-texts to API_ROUTE_TO_APPLICATION_MAP
if (!content.includes("'/api/admin/legal-texts'")) {
  content = content.replace(
    "'/api/admin/push-notifications': 'push-benachrichtigungen',",
    "'/api/admin/push-notifications': 'push-benachrichtigungen',\n  '/api/admin/legal-texts': 'legal-texts',"
  );
}

fs.writeFileSync(path, content);
console.log('Middleware updated successfully');
console.log('Route map has legal-texts:', content.includes("'/admin/legal-texts'"));
console.log('API map has legal-texts:', content.includes("'/api/admin/legal-texts'"));
