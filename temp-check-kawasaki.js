const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const v=await p.vehicle.findFirst({where:{manufacturer:'Kawasaki',model:{contains:'Ninja'}},include:{vehicleTires:true}});
  console.log('Vehicle:', JSON.stringify(v,null,2));
  process.exit(0);
})()
