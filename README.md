Student Registration System (RDBMS Project)
A full-stack web application designed to manage student registrations, faculty assignments, and course enrollments. This project demonstrates core Relational Database Management System (RDBMS) concepts including table relationships, foreign keys, and complex SQL joins.

🚀 Features
Student Management: Register new students, update existing information, and view a comprehensive list of all registered students.
Relational Data: Implements Many-to-One (Student to Advisor) and Many-to-Many (Student to Courses) relationships.
Joined Views: The student list view performs complex SQL joins to display advisor names and course titles instead of raw IDs.
Management Portal: Dedicated interface to manage Faculty members and Course listings.
Single-Page UI: A clean, responsive interface built with Tailwind CSS.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Tailwind CSS), JavaScript (Vanilla ES6+)
Backend: Node.js, Express.js
Database: MySQL (Workbench)
Security: Environment variables (dotenv) for database credential protection

📊 Database Schema
The project uses four tables to maintain relational integrity:
Faculty: Stores professor details (faculty_id, name).
Course: Stores course information (course_id, title, faculty_id).
Student: Stores student details (student_id, name, advisor_id).
Student_Courses: A junction table for the many-to-many relationship between students and courses.

⚙️ Setup Instructions
To run this project locally, follow these steps:
1. Prerequisites
Node.js installed on your machine.
MySQL Server and MySQL Workbench installed.
2. Database Setup
Open MySQL Workbench.
Run the provided database_setup.sql script located in the backend/ folder to create the database and tables.
3. Backend Setup
Navigate to the backend folder:
cd backend


Install dependencies:
npm install


Create a .env file in the backend directory and add your MySQL password:
DB_PASSWORD=your_mysql_password_here


Start the server:
node server.js


4. Frontend Setup
Open the project in VS Code.
Ensure the Live Server extension is installed.
Right-click frontend/student_registrar.html and select "Open with Live Server".
The application will open in your browser at http://127.0.0.1:5500.
📂 Project Structure
student-registrar-form/
├── backend/
│   ├── database_setup.sql  # SQL script for MySQL
│   ├── server.js           # Node.js/Express server logic
│   ├── .env                # Secret credentials (ignored by Git)
│   └── package.json        # Dependencies
└── frontend/
    └── student_registrar.html # The UI and Frontend logic


📝 License
This project was created as part of an RDBMS learning journey. Feel free to use and modify it for educational purposes.
