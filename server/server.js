require("dotenv").config();

const app = require("./app");
const { initDB } = require("./config/db");

const port = process.env.PORT || 5000;

initDB();

app.listen(port, () => {
  console.log(`Server dang chay tai http://localhost:${port}`);
});
