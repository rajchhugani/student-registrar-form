-- Create a new database for your project
CREATE DATABASE IF NOT EXISTS `registrar_db`;
USE `registrar_db`;

-- 1. The 'faculty' table
-- This holds the professors/advisors
CREATE TABLE IF NOT EXISTS `faculty` (
    `faculty_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL
);

-- 2. The 'course' table
-- This holds the courses.
-- It has a Foreign Key to 'faculty' (a course is taught by one faculty member)
CREATE TABLE IF NOT EXISTS `course` (
    `course_id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `faculty_id` INT,
    FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`faculty_id`)
);

-- 3. The 'student' table
-- This holds the students.
-- It has a Foreign Key to 'faculty' (a student has one advisor)
CREATE TABLE IF NOT EXISTS `student` (
    `student_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `advisor_id` INT,
    FOREIGN KEY (`advisor_id`) REFERENCES `faculty`(`faculty_id`)
);

-- 4. The 'student_courses' (JOIN Table)
-- This table solves the "Many-to-Many" problem.
-- One student can have many courses.
-- One course can have many students.
CREATE TABLE IF NOT EXISTS `student_courses` (
    `student_id` INT,
    `course_id` INT,
    PRIMARY KEY (`student_id`, `course_id`), -- This prevents duplicate entries
    FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE CASCADE,
    FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE CASCADE
);

-- Insert some sample data to get started (optional)
INSERT INTO `faculty` (name) VALUES ('Dr. Smith'), ('Prof. Jones');
INSERT INTO `course` (title, faculty_id) VALUES ('Database Systems', 1), ('Web Development', 2);
INSERT INTO `student` (name, advisor_id) VALUES ('Alice Johnson', 1), ('Bob Williams', 2);
INSERT INTO `student_courses` (student_id, course_id) VALUES (1, 1), (1, 2), (2, 2);