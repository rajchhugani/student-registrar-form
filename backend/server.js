require('dotenv').config(); 

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Lets your frontend talk to this backend

const app = express();
app.use(express.json()); // Allow the server to read JSON data
app.use(cors()); // Allow requests from any frontend

// --- 1. Database Connection ---
const db = mysql.createConnection({
    host: '127.0.0.1',       // Your MySQL server address (localhost)
    user: 'root',              // Your MySQL username
    password: process.env.DB_PASSWORD, 
    database: 'registrar_db'   
}).promise(); // --- Add .promise() to use modern async/await ---



// --- NEW: Check connection function ---
async function checkConnection() {
    try {
        await db.connect();
        console.log('Connected to MySQL database (registrar_db)!');
    } catch (err) {
        console.error('Error connecting to MySQL:', err);
    }
}
checkConnection();




// --- 2. API Endpoints ---



// --- GET ALL FACULTY ---
app.get('/api/faculty', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM faculty');
        res.json(results);
    } catch (err) {
        res.status(500).send(err);
    }
});




// --- ADD NEW FACULTY ---
app.post('/api/faculty', async (req, res) => {
    try {
        const [results] = await db.query('INSERT INTO faculty (name) VALUES (?)', [req.body.name]);
        res.json({ newId: results.insertId });
    } catch (err) {
        res.status(500).send(err);
    }
});




// --- NEW: DELETE FACULTY ---
app.delete('/api/faculty/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM faculty WHERE faculty_id = ?', [req.params.id]);
        res.json({ message: 'Faculty deleted' });
    } catch (err) {
        // Handle foreign key constraints error
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete faculty: they are assigned as an advisor or to a course.' });
        }
        res.status(500).send(err);
    }
});




// --- NEW: GET ALL COURSES (with JOIN) ---
app.get('/api/courses', async (req, res) => {
    try {
        const sql = `
            SELECT c.course_id, c.title, f.name AS faculty_name 
            FROM course c 
            LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).send(err);
    }
});








// --- NEW: ADD NEW COURSE ---
app.post('/api/courses', async (req, res) => {
    try {
        const { title, facultyId } = req.body;
        const [results] = await db.query('INSERT INTO course (title, faculty_id) VALUES (?, ?)', [title, facultyId]);
        res.json({ newId: results.insertId });
    } catch (err) {
        res.status(500).send(err);
    }
});









// --- NEW: DELETE COURSE ---
app.delete('/api/courses/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM course WHERE course_id = ?', [req.params.id]);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete course: students are enrolled in it.' });
        }
        res.status(500).send(err);
    }
});








// --- GET ALL STUDENTS (with JOINS) ---
app.get('/api/students', async (req, res) => {
    const sql = `
        SELECT 
            s.student_id, 
            s.name AS student_name, 
            f.name AS advisor_name,
            GROUP_CONCAT(c.title SEPARATOR ', ') AS courses
        FROM 
            student s
        LEFT JOIN 
            faculty f ON s.advisor_id = f.faculty_id
        LEFT JOIN 
            student_courses sc ON s.student_id = sc.student_id
        LEFT JOIN 
            course c ON sc.course_id = c.course_id
        GROUP BY
            s.student_id, s.name, f.name
    `;
    try {
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).send(err);
    }
});








// --- NEW: GET ONE STUDENT (for the UPDATE form) ---
app.get('/api/students/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // 1. Get student basic info
        const [studentResult] = await db.query('SELECT student_id, name, advisor_id FROM student WHERE student_id = ?', [studentId]);
        
        if (studentResult.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // 2. Get their enrolled courses
        const [coursesResult] = await db.query('SELECT course_id FROM student_courses WHERE student_id = ?', [studentId]);
        
        const student = studentResult[0];
        student.courseIds = coursesResult.map(c => c.course_id);
        
        res.json(student);
    } catch (err) {
        res.status(500).send(err);
    }
});








// --- ADD NEW STUDENT (INSERT) ---
app.post('/api/students', async (req, res) => {
    const { name, advisorId, courseIds } = req.body;
    
    try {
        // 1. Insert the student
        const [results] = await db.query('INSERT INTO student (name, advisor_id) VALUES (?, ?)', [name, advisorId || null]);
        const newStudentId = results.insertId;
        
        // 2. Insert into the 'student_courses' join table
        if (courseIds && courseIds.length > 0) {
            const courseValues = courseIds.map(courseId => [newStudentId, courseId]);
            await db.query('INSERT INTO student_courses (student_id, course_id) VALUES ?', [courseValues]);
        }
        
        res.json({ newStudentId });
    } catch (err) {
        res.status(500).send(err);
    }
});







// --- NEW: UPDATE A STUDENT (UPDATE) ---
app.put('/api/students/:id', async (req, res) => {
    const { name, advisorId, courseIds } = req.body;
    const studentId = req.params.id;

    // We use a transaction to make sure ALL or NOTHING updates
    const connection = await db.getConnection(); // Get a connection from the pool
    try {
        await connection.beginTransaction();

        // 1. Update the student table
        await connection.query('UPDATE student SET name = ?, advisor_id = ? WHERE student_id = ?', [name, advisorId || null, studentId]);
        
        // 2. Delete all their old courses
        await connection.query('DELETE FROM student_courses WHERE student_id = ?', [studentId]);
        
        // 3. Insert their new courses
        if (courseIds && courseIds.length > 0) {
            const courseValues = courseIds.map(courseId => [studentId, courseId]);
            await connection.query('INSERT INTO student_courses (student_id, course_id) VALUES ?', [courseValues]);
        }
        
        // If everything worked, commit the changes
        await connection.commit();
        res.json({ message: 'Student updated successfully' });
    } catch (err) {
        // If anything failed, roll back the changes
        await connection.rollback();
        res.status(500).send(err);
    } finally {
        // ALWAYS release the connection back to the pool
        connection.release();
    }
});





// --- DELETE A STUDENT ---
app.delete('/api/students/:id', async (req, res) => {
    const studentId = req.params.id;
    try {
        // Because we set 'ON DELETE CASCADE' in our SQL,
        // deleting the student will automatically delete their 'student_courses' records.
        await db.query('DELETE FROM student WHERE student_id = ?', [studentId]);
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).send(err);
    }
});





// --- 3. Start the Server ---
const port = 8000;
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});