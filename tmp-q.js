const {PrismaClient} = require("@prisma/client");
const p = new PrismaClient();
p.directBooking.findFirst({orderBy:{createdAt:"desc"},select:{id:true,tireSize:true,tireBrand:true,tireModel:true,tireLoadIndex:true,tireSpeedIndex:true,tireData:true}}).then(b=>{console.log(JSON.stringify(b,null,2));p.$disconnect()})
