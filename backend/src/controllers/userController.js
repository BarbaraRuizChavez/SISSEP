const userService = require("../services/userService");

const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error) {
    console.error("ERROR REAL:", error); // 👈 AGREGA ESTO
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = { getUsers };