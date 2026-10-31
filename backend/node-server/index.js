const dotenv = require("dotenv");
const path = require("path");

dotenv.config({path: path.resolve(__dirname, ".env")});

const app = require("./app");
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {console.log(`NETRA server running on port ${PORT}`);});