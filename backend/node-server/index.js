const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./app");
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PATCH"],
        credentials: true
    }
});

// Make Socket.IO accessible inside Express routes
app.set("io", io);

// Authenticate socket connections using existing JWT
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication token is required."));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id || decoded.role !== "EXAMINER") {
            return next(new Error("Unauthorized socket connection."));
        }

        socket.data.examinerId = decoded.id;
        next();

    } catch (error) {
        next(new Error("Invalid or expired token."));
    }
});

io.on("connection", (socket) => {
    const examinerId = socket.data.examinerId;

    // Each examiner joins their own private room
    socket.join(`examiner_${examinerId}`);

    console.log(`Examiner ${examinerId} connected:`, socket.id);

    socket.on("disconnect", () => {
        console.log(`Examiner ${examinerId} disconnected.`);
    });
});

server.listen(PORT, () => {
    console.log(`NETRA server running on port ${PORT}`);
});
