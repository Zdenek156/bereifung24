const sharp = require("sharp");
sharp("public/bereifung24-hero-bg.webp")
  .resize(20)
  .blur(2)
  .webp({ quality: 20 })
  .toBuffer()
  .then(b => console.log("data:image/webp;base64," + b.toString("base64")));
