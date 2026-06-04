/*
====================================================
 SMART-AID VOLUNTEER SERVICE
 Microservice: Volunteer Task & Job Management
 Technology: Node.js + Express + SQLite
 Purpose: Track volunteer job acceptance and updates
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
 1. DATABASE CONNECTION (Volunteer Service SQLite)
====================================================
 - This connects to local SQLite database file (volunteer.sqlite)
 - Isolated database specific for Volunteer Tasks only
*/
const db = new sqlite3.Database('./volunteer.sqlite', (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to Volunteer Service SQLite database (volunteer.sqlite)");
    }
});

/*
====================================================
 2. CREATE VOLUNTEER TASKS TABLE
====================================================
 - Stores tasks assigned to or accepted by volunteers
 - Relates to requestId from Request Service
*/
db.run(`
CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requestId INTEGER NOT NULL,
    volunteerName TEXT NOT NULL,
    status TEXT DEFAULT 'Accepted'
)
`);

/*
====================================================
 3. ACCEPT HELP REQUEST API
 Endpoint: POST /volunteer/accept
 Purpose: Allow a volunteer to accept a disaster relief request
====================================================
*/
app.post('/volunteer/accept', (req, res) => {
    const { requestId, volunteerName } = req.body;

    // Validation check
    if (!requestId || !volunteerName) {
        return res.status(400).json({
            status: "Failed",
            message: "RequestId and volunteerName are required"
        });
    }

    const sql = `INSERT INTO volunteer_tasks (requestId, volunteerName) VALUES (?, ?)`;

    db.run(sql, [requestId, volunteerName], function (err) {
        if (err) {
            return res.status(500).json({
                status: "Error",
                message: err.message
            });
        }

        res.status(201).json({
            status: "Success",
            message: "Volunteer successfully accepted the task",
            taskId: this.lastID
        });
    });
});

/*
====================================================
 4. START SERVER
====================================================
 - Service runs on port 3003
 - Acts as independent microservice in SMART-AID system
*/
const PORT = 3003;
app.listen(PORT, () => {
    console.log(`Volunteer Service is running on port ${PORT}`);
});