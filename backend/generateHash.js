import bcrypt from "bcrypt";

const password = "admin123";

const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);

console.log("--- COPY THIS HASH ---");
console.log(hash);
console.log("----------------------");