const sharp = require("sharp");
sharp("public/bereifung24-hero-bg.jpg")
  .resize(1920)
  .webp({ quality: 82 })
  .toFile("public/bereifung24-hero-bg.webp")
  .then(info => {
    console.log("Converted:", JSON.stringify(info));
  })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
