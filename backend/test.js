const express = require("express");
const app = express();

app.get("/api/users", (req, res) => {
  console.log("Petición GET /api/users recibida");
  res.json([{ name: "Test User" }]);
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));
