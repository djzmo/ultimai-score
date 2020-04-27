import Ultimai from "./src/Ultimai";

(async() => {
    const ultimai = new Ultimai;
    await ultimai.handle(process.argv.slice(2));
})();
