/*
====================================================
 SMART-AID REQUEST SERVICE
 Microservice: Disaster Relief Help Request Management
 Technology: Node.js + Express + SQLite
 Purpose: Handle aid creation, status updates, and tracking
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
 1. DATABASE CONNECTION (Request Service SQLite)
====================================================
 - This connects to local SQLite database file (request.sqlite)
 - Isolated database specific for Help Requests only
*/
const db = new sqlite3.Database('./request.sqlite', (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to Request Service SQLite database (request.sqlite)");
    }
});

/*
====================================================
 2. CREATE HELP REQUESTS TABLE
====================================================
 - This table stores help requests from disaster victims
 - Status: Pending, Approved, Completed
*/
db.run(`
CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_bantuan TEXT NOT NULL,
    kuantiti INTEGER NOT NULL,
    lokasi TEXT NOT NULL,
    status TEXT DEFAULT 'Pending'
)
`);

/*
====================================================
 3. CREATE HELP REQUEST API
 Endpoint: POST /requests
 Purpose: Allow disaster victims to request for aid
====================================================
*/
app.post('/requests', (req, res) => {
    const { item_bantuan, kuantiti, lokasi } = req.body;

    // Validation check (Basic Edge Case Testing)
    if (!item_bantuan || !kuantiti || !lokasi) {
        return res.status(400).json({
            status: "Failed",
            message: "Item bantuan, kuantiti, and lokasi are required"
        });
    }

    const sql = `INSERT INTO help_requests (item_bantuan, kuantiti, lokasi) VALUES (?, ?, ?)`;

    db.run(sql, [item_bantuan, kuantiti, lokasi], function (err) {
        if (err) {
            return res.status(500).json({
                status: "Error",
                message: err.message
            });
        }

        res.status(201).json({
            status: "Success",
            message: "Disaster help request submitted successfully",
            requestId: this.lastID
        });
    });
});

/*
====================================================
 4. GET ALL HELP REQUESTS API
 Endpoint: GET /requests
 Purpose: Retrieve all requests for victims & volunteers to review
====================================================
*/
app.get('/requests', (req, res) => {
    db.all(`SELECT * FROM help_requests`, [], (err, rows) => {
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
 5. START SERVER
====================================================
 - Service runs on port 3002
 - Acts as independent microservice in SMART-AID system
*/
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Request Service is running on port ${PORT}`);
});