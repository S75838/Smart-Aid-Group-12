/*
====================================================
 SMART-AID USER SERVICE
====================================================
*/

const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    next();
});

/*
====================================================
 DATABASE CONNECTION
====================================================
*/
const db = new sqlite3.Database('./user.sqlite', (err) => {

    if (err) {
        console.error("Database connection failed:", err.message);
    }
    else {
        console.log("Connected to User Service SQLite database");
    }

});

/*
====================================================
 CREATE TABLE
====================================================
*/
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    experience TEXT,
    status TEXT DEFAULT 'Active'
)
`);

/*
====================================================
 REGISTER USER
====================================================
*/
app.post('/users', (req, res) => {

    const { name, role, phone, experience } = req.body;

    if (!name || !role || !phone) {

        return res.status(400).json({
            status: "Failed",
            message: "All fields are required"
        });

    }

    const status = (role === "volunteer")
        ? "Pending"
        : "Active";

    const sql = `
        INSERT INTO users
        (name, role, phone, experience, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, role, phone, experience, status],
        function (err) {

            if (err) {

                return res.status(500).json({
                    status: "Error",
                    message: err.message
                });

            }

            res.json({
                status: "Success",
                message: "Registration successful"
            });

        }
    );

});

/*
====================================================
 GET ALL USERS
====================================================
*/
app.get('/users', (req, res) => {

    db.all(
        `SELECT * FROM users`,
        [],
        (err, rows) => {

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

        }
    );

});

/*
====================================================
 LOGIN
====================================================
*/
app.post('/login', (req, res) => {

    const { name, phone } = req.body;

    // Admin login
    if (name === "admin" && phone === "01126059118") {

        return res.json({
            status: "Success",
            user: {
                id: 0,
                name: "admin",
                role: "admin",
                phone: "01126059118"
            }
        });

    }

    db.get(
        `SELECT * FROM users WHERE name=? AND phone=?`,
        [name, phone],
        (err, row) => {

            if (err) {

                return res.status(500).json({
                    status: "Error"
                });

            }

            if (!row) {

                return res.status(401).json({
                    status: "Failed",
                    message: "Invalid credentials"
                });

            }

            // Volunteer waiting approval
            if (
                row.role === "volunteer" &&
                row.status === "Pending"
            ) {

                return res.status(403).json({
                    status: "Failed",
                    message: "Waiting for admin approval"
                });

            }

            // Volunteer rejected
            if (
                row.role === "volunteer" &&
                row.status === "Rejected"
            ) {

                return res.status(403).json({
                    status: "Failed",
                    message: "Your volunteer application has been rejected by the admin."
                });

            }

            res.json({
                status: "Success",
                user: row
            });

        }
    );

});

/*
====================================================
 GET PENDING VOLUNTEERS
====================================================
*/
app.get('/volunteers/pending', (req, res) => {

    db.all(
        `
        SELECT *
        FROM users
        WHERE role='volunteer'
        AND status='Pending'
        `,
        [],
        (err, rows) => {

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

        }
    );

});

/*
====================================================
 APPROVE VOLUNTEER
====================================================
*/
app.put('/volunteers/approve/:id', (req, res) => {

    db.run(
        `
        UPDATE users
        SET status='Active'
        WHERE id=?
        `,
        [req.params.id],
        function (err) {

            if (err) {

                return res.status(500).json({
                    status: "Error",
                    message: err.message
                });

            }

            res.json({
                status: "Success",
                message: "Volunteer approved"
            });

        }
    );

});

/*
====================================================
REJECT VOLUNTEER
====================================================
*/
app.put('/volunteers/reject/:id', (req, res) => {

    db.run(
        `UPDATE users SET status='Rejected' WHERE id=?`,
        [req.params.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    status: "Error",
                    message: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    status: "Failed",
                    message: "Volunteer not found or already updated"
                });
            }

            res.json({
                status: "Success",
                message: "Volunteer rejected"
            });
        }
    );
});

/*
====================================================
 START SERVER
====================================================
*/
const PORT = 3001;

app.listen(PORT, () => {

    console.log(`User Service is running on port ${PORT}`);

});