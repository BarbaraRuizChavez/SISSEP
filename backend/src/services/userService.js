const { pool } = require("./db");

const getUsers = async () => {
  try {
    const result = await pool.query("SELECT * FROM users");
    console.log("Resultado query users:", result.rows);
    return result.rows;
  } catch (error) {
    console.error("Error en getUsers:", error);
    throw error;
  }
};

module.exports = { getUsers };