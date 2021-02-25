DROP DATABASE IF EXISTS employees_db;

CREATE DATABASE employees_db;

USE employees_db;



CREATE TABLE department (
	id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(30),
    PRIMARY KEY(id)
);

CREATE TABLE role (
id INT AUTO_INCREMENT NOT NULL,
title VARCHAR(30) NOT NULL,
salary DECIMAL(9,2) NOT NULL,
department_id INTEGER NOT NULL,
PRIMARY KEY(id),
FOREIGN KEY(department_id) REFERENCES department(id)

);
    
CREATE TABLE employee (
id INT AUTO_INCREMENT NOT NULL,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INTEGER NOT NULL,
    manager_id INTEGER,
    PRIMARY KEY(id),
    FOREIGN KEY(manager_id) REFERENCES employee(id),
    FOREIGN KEY(role_id) REFERENCES role(id)
);


INSERT INTO department (name) VALUES ("Engineering"),("Sales"),("Legal");
INSERT INTO role (title, salary, department_id) VALUES ("Lead Engineer", 90000, 1), ("Junior Engineer", 70000, 1), ("Sales Lead", 55000, 2), ("Sales Associate", 40000, 2), ("Lawyer", 65000, 3);
INSERT INTO employee (first_name, last_name, role_id) VALUES ("John", "Smith", 3), ("Sam", "Cohen", 1), ("Anna", "Collins", 5);
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("Chloe", "Naylor", 2, 2), ("Ben", "Johnson", 4, 1), ("Denise", "Jacobs", 2,2);
