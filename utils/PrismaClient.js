import { PrismaClient } from "@prisma/client";
let prisma;
function getPrismaInstance() {
  console.log("connected to DB ✅");
  return new PrismaClient();
}

export default getPrismaInstance;
