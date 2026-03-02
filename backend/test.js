import express from "express";

const app = express();
const PORT = 4000;

app.get("/", (req, res) => {
  res.send("Hola mundo, backend funcionando!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});