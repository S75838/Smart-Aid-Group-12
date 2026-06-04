/*
====================================================
 SMART-AID USER SERVICE
 Microservice: User Management
 Technology: Node.js + Express + SQLite
 Purpose: Handle user registration, login, and retrieval
====================================================
*/

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// Enable JSON request body parsing
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});
/*
====================================================
 1. DATABASE CONNECTION (User Service SQLite)
====================================================
 - This connects to local SQLite database file (user.sqlite)
 - Isolated database specific for User Service only
*/
const db = new sqlite3.Database('./user.sqlite', (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to User Service SQLite database (user.sqlite)");
    }
});

/*
====================================================
 2. CREATE USERS TABLE
====================================================
 - This table stores all system users
 - Roles: victim, volunteer, admin
*/
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL
)
`);

/*
====================================================
 3. REGISTER USER API
 Endpoint: POST /users
 Purpose: Register new user into system
====================================================
*/
app.post('/users', (req, res) => {
    const { name, role, phone } = req.body;

    // Validation check
    if (!name || !role || !phone) {
        return res.status(400).json({
            status: "Failed",
            message: "All fields are required"
        });
    }

    const sql = `INSERT INTO users (name, role, phone) VALUES (?, ?, ?)`;

    db.run(sql, [name, role, phone], function (err) {
        if (err) {
            return res.status(500).json({
                status: "Error",
                message: err.message
            });
        }

        res.json({
            status: "Success",
            message: "User registered successfully",
            userId: this.lastID
        });
    });
});

/*
====================================================
 4. GET ALL USERS API
 Endpoint: GET /users
 Purpose: Retrieve all registered users
====================================================
*/
app.get('/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                status: "Error",
                message: err.message
            });
        }

        res.json({
            status: "Success",
            data: rows
        });
    });
});

/*
====================================================
 5. LOGIN USER API (SIMPLE AUTH FOR DEMO PURPOSE)
 Endpoint: POST /login
 Purpose: Validate user credentials
====================================================
*/
app.post('/login', (req, res) => {
    const { name, phone } = req.body;

    db.get(
        `SELECT * FROM users WHERE name = ? AND phone = ?`,
        [name, phone],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    status: "Error",
                    message: err.message
                });
            }

            // If user not found
            if (!row) {
                return res.status(401).json({
                    status: "Failed",
                    message: "Invalid credentials"
                });
            }

            res.json({
                status: "Success",
                message: "Login successful",
                user: row
            });
        }
    );
});

/*
====================================================
 6. START SERVER
====================================================
 - Service runs on port 3001
 - Acts as independent microservice in SMART-AID system
*/
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`);
});