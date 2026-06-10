/*
====================================================
 SMART-AID VOLUNTEER SERVICE (FIXED)
====================================================
*/

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();

app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

/*
====================================================
 DB CONNECTION
====================================================
*/
const db = new sqlite3.Database('./volunteer.sqlite', (err) => {
    if (err) {
        console.error("DB Error:", err.message);
    } else {
        console.log("Connected to volunteer.sqlite");
    }
});

/*
====================================================
 TABLE
====================================================
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
 ACCEPT REQUEST (FIXED FLOW)
====================================================
*/
app.post('/volunteer/accept', async (req, res) => {

    const { requestId, volunteerName } = req.body;

    console.log("🔥 VOLUNTEER ACCEPT REQUEST");
    console.log("RequestId:", requestId);
    console.log("Volunteer:", volunteerName);

    if (!requestId || !volunteerName) {
        return res.status(400).json({
            status: "Failed",
            message: "requestId and volunteerName required"
        });
    }

    try {
        // 1. Save into volunteer database first
        const insertSql = `
            INSERT INTO volunteer_tasks (requestId, volunteerName)
            VALUES (?, ?)
        `;

        const taskId = await new Promise((resolve, reject) => {
            db.run(insertSql, [requestId, volunteerName], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        console.log("✔ Saved volunteer task ID:", taskId);

        // 2. Update request-service (IMPORTANT PART)
        const response = await axios.put(
            `http://localhost:3002/requests/accept/${requestId}`,
            { volunteerName }
        );

        console.log("✔ Request-service updated:", response.data);

        // 3. Send final response ONLY after both succeed
        return res.status(201).json({
            status: "Success",
            message: "Volunteer accepted request successfully",
            taskId
        });

    } catch (err) {

        console.error("❌ ERROR:", err.message);

        return res.status(500).json({
            status: "Error",
            message: "Failed to accept request",
            error: err.message
        });
    }
});

/*
====================================================
 START SERVER
====================================================
*/
const PORT = 3003;
app.listen(PORT, () => {
    console.log(`Volunteer Service running on port ${PORT}`);
});