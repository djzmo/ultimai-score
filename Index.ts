import Mymai from "./src/Mymai";

(async() => {
    const mymai = new Mymai;
    await mymai.handle(process.argv.slice(2));
})();
