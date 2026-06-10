/*
====================================================
 SMART-AID REQUEST SERVICE (FIXED)
====================================================
*/

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// JSON parser
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

// DB connection
const db = new sqlite3.Database('./request.sqlite', (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to request.sqlite");
    }
});

/*
====================================================
 TABLE
====================================================
*/
db.run(`
CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester TEXT NOT NULL,
    item_bantuan TEXT NOT NULL,
    kuantiti INTEGER NOT NULL,
    lokasi TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    volunteerName TEXT,
    progress TEXT DEFAULT 'Waiting'
)
`);

/*
====================================================
 CREATE REQUEST
====================================================
*/
app.post('/requests', (req, res) => {
    const { requester, item_bantuan, kuantiti, lokasi } = req.body;

    if (!requester || !item_bantuan || !kuantiti || !lokasi) {
        return res.status(400).json({
            status: "Failed",
            message: "Missing required fields"
        });
    }

    const sql = `
        INSERT INTO help_requests
        (requester, item_bantuan, kuantiti, lokasi)
        VALUES (?,?,?,?)
    `;

    db.run(sql, [requester, item_bantuan, kuantiti, lokasi], function (err) {
        if (err) {
            return res.status(500).json({ status: "Error", message: err.message });
        }

        res.status(201).json({
            status: "Success",
            requestId: this.lastID
        });
    });
});

/*
====================================================
 GET ALL
====================================================
*/
app.get('/requests', (req, res) => {
    db.all(`SELECT * FROM help_requests`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ status: "Error", message: err.message });
        }

        res.json({ status: "Success", data: rows });
    });
});

/*
====================================================
 GET BY USER
====================================================
*/
app.get('/requests/user/:name', (req, res) => {
    db.all(
        `SELECT * FROM help_requests WHERE requester=? ORDER BY id DESC`,
        [req.params.name],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "Error", message: err.message });
            }

            res.json({ status: "Success", data: rows });
        }
    );
});

/*
====================================================
 CANCEL
====================================================
*/
app.put('/requests/cancel/:id', (req, res) => {
    db.run(
        `UPDATE help_requests SET status='Cancelled' WHERE id=? AND status='Pending'`,
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "Error", message: err.message });
            }

            res.json({ status: "Success" });
        }
    );
});

/*
====================================================
 🔥 FIXED: ACCEPT REQUEST (IMPORTANT PART)
====================================================
*/
app.put('/requests/accept/:id', (req, res) => {

    const { volunteerName } = req.body;

    console.log("🔥 ACCEPT API HIT");
    console.log("Request ID:", req.params.id);
    console.log("Volunteer:", volunteerName);
    console.log("BODY:", req.body);
    console.log("NAME:", req.body.volunteerName);

    if (!volunteerName) {
        return res.status(400).json({
            status: "Failed",
            message: "volunteerName is required"
        });
    }

    db.run(
        `
        UPDATE help_requests
        SET status='Accepted',
            volunteerName=?
        WHERE id=?
        `,
        [volunteerName, req.params.id],
        function (err) {

            if (err) {
                console.log("DB ERROR:", err.message);
                return res.status(500).json({
                    status: "Error",
                    message: err.message
                });
            }

            console.log("✔ Updated rows:", this.changes);

            res.json({
                status: "Success",
                message: "Request accepted + volunteer assigned"
            });
        }
    );

    console.log("Rows affected:", this.changes);
});

/*
====================================================
 UPDATE PROGRESS
====================================================
*/
app.put('/requests/progress/:id', (req, res) => {

    const { progress } = req.body;

    db.run(
        `UPDATE help_requests SET progress=? WHERE id=?`,
        [progress, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "Error", message: err.message });
            }

            res.json({ status: "Success" });
        }
    );
});

/*
====================================================
 GET VOLUNTEER TASKS
====================================================
*/
app.get('/requests/volunteer/:name', (req, res) => {

    db.all(
        `SELECT * FROM help_requests WHERE volunteerName=?`,
        [req.params.name],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "Error" });
            }

            res.json({ status: "Success", data: rows });
        }
    );
});

/*
====================================================
 START SERVER
====================================================
*/
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Request Service running on port ${PORT}`);
});