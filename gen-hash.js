const bcrypt = require('/var/www/bereifung24/node_modules/bcryptjs');
(async () => {
  const hash = await bcrypt.hash('GoogleReview2026!', 12);
  console.log(hash);
})();
