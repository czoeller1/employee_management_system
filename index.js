const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");

const connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Be sure to update with your own MySQL password!
  password: "root",
  database: "employees_db",
});

// Connect to the DB
connection.connect((err) => {
  if (err) throw err;
  console.log(`connected as id ${connection.threadId}\n`);
  menuPrompt();
});

// Runs choice prompt on start and after each action
function menuPrompt() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "What would you like to do?",
        name: "type",
        choices: [
          "View employees",
          "Add a new employee",
          "Delete an employee",
          "Change an employee's role",
          "View roles",
          "Add a new role",
          "Delete a role",
          "View departments",
          "Add a new department",
          "Delete a department",
          "View budget for each department",
          "Exit",
        ],
      },
    ])
    .then((response) => {
      // runs the correct method based on user choice
      switch (response.type) {
        case "View employees":
          viewEmployees();
          break;
        case "Add a new employee":
          newEmployee();
          break;
        case "Delete an employee":
          deleteEmployee();
          break;
        case "Change an employee's role":
          updateRole();
          break;
        case "View roles":
          viewRoles();
          break;
        case "Add a new role":
          newRole();
          break;
        case "Delete a role":
          deleteRole();
          break;
        case "View departments":
          viewDepartments();
          break;
        case "Add a new department":
          newDepartment();
          break;
        case "Delete a department":
          deleteDepartment();
          break;
        case "View budget for each department":
          departmentBudgets();
          break;
        case "Exit":
          connection.end();
          return;
      }
    });
}

// outputs the list of all employees along with the relevant information from their role and department
function viewEmployees() {
  let query = `SELECT employee.id, employee.first_name, employee.last_name, title, department.name AS department, salary, CONCAT(manager.first_name, " ", manager.last_name) AS manager FROM
  employee INNER JOIN role ON employee.role_id = role.id 
  INNER JOIN department ON role.department_id = department.id 
  LEFT JOIN employee AS manager ON employee.manager_id = manager.id
 ORDER BY employee.id`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    console.table(res);
    menuPrompt();
  });
}

// Uses mysql to select all available roles and employees (to be a manager),
// Then prompts the user to input a name for the new employee,
// Then lets the user select their role and manager, if any
function newEmployee() {
  // Selects all available roles from the table
  connection.query("SELECT title, id FROM role", (err, res) => {
    if (err) throw err;
    let titles = res;
    //console.log(titles);
    // Selects all available employees to be candidates for manager
    // Could update table to have a value set for manager candidates
    connection.query(
      `SELECT CONCAT(first_name, " ", last_name) AS name, id FROM employee`,
      (err, res) => {
        if (err) throw err;

        let managers = res;
        // Adds an option for no manager to be selected
        managers.unshift({ name: "None", id: 0 });
        //console.log(managers);

        // Prompts the user for the information of the new employee
        inquirer
          .prompt([
            {
              type: "input",
              message: "What is the first name of the new employee?",
              name: "first",
            },
            {
              type: "input",
              message: "What is the last name of the new employee?",
              name: "last",
            },
            {
              type: "list",
              message: "What role does the new employee have?",
              choices: titles.map((el) => el.title),
              name: "title",
            },
            {
              type: "list",
              message: "Who is the manager of the new employee?",
              choices: managers.map((el) => el.name),
              name: "manager",
            },
          ])
          .then((response) => {
            //console.log(titles, managers);

            // gets the id of the chosen role
            let roleId = titles.filter((el) => el.title === response.title)[0]
              .id;

            // gets the id of the chosen role
            let managerId = managers.filter(
              (el) => el.name === response.manager
            )[0].id;

            // makes an object containing the correct format for the table
            let emp = {
              first_name: response.first,
              last_name: response.last,
              role_id: roleId,
            };
            // adds the manager id if one was selected
            if (managerId != 0) {
              emp.manager_id = managerId;
            }
            // adds the employee to the table
            connection.query("INSERT INTO employee SET ?", emp, (err, res) => {
              if (err) throw err;
              console.log(
                `Added ${emp.first_name} ${emp.last_name} to the database`
              );
              // Call updateProduct AFTER the INSERT completes

              menuPrompt();
            });
          });
      }
    );
  });
}

// Allows the user to delete an employee from the table
function deleteEmployee() {
  // Gets a list of all employees from the table
  connection.query(
    `SELECT CONCAT(first_name, " ", last_name) AS name, id FROM employee`,
    (err, res) => {
      if (err) throw err;

      let employees = res;
      //managers.unshift({ name: "None", id: 0 });
      //console.log(managers);
      // Presents the user with a list of employees to delete then
      // Makes sure they want to delete them
      inquirer
        .prompt([
          {
            type: "list",
            message: "Select an employee to delete:",
            choices: employees.map((el) => el.name),
            name: "employee",
          },

          {
            type: "confirm",
            message: "Are you sure you want to delete this employee?",
            default: true,
            name: "confirm",
          },
        ])
        .then((response) => {
          //console.log(titles, managers);
          // Makes sure the user wants to delete someone
          if (response.confirm) {
            // Selects the id of the employee
            let empId = employees.filter(
              (el) => el.name === response.employee
            )[0].id;

            // Deletes the employee from the table
            connection.query(
              "DELETE FROM employee WHERE ?",
              [{ id: empId }],
              (err, res) => {
                if (err) throw err;
                console.log(`Removed ${response.employee} from the database`);
                // Call updateProduct AFTER the INSERT completes

                menuPrompt();
              }
            );
          }
        });
    }
  );
}

// Updates the role of a selected user
function updateRole() {
  // Selects all the available roles in the table
  connection.query("SELECT title, id FROM role", (err, res) => {
    if (err) throw err;
    let titles = res;

    //console.log(titles);
    // Selects all the available employees in the table
    connection.query(
      `SELECT CONCAT(first_name, " ", last_name) AS name, id FROM employee`,
      (err, res) => {
        if (err) throw err;

        let employees = res;
        //managers.unshift({ name: "None", id: 0 });
        //console.log(managers);
        // Uses the mysql query responses to display options to the user
        inquirer
          .prompt([
            {
              type: "list",
              message: "Select an employee to change the role of:",
              choices: employees.map((el) => el.name),
              name: "employee",
            },

            {
              type: "list",
              message: "Select a new role for this employee:",
              choices: titles.map((el) => el.title),
              name: "title",
            },
          ])
          .then((response) => {
            //console.log(titles, managers);
            // Gets the id of the selected role
            let roleId = titles.filter((el) => el.title === response.title)[0]
              .id;

            // gets the id of the selected employee
            let empId = employees.filter(
              (el) => el.name === response.employee
            )[0].id;

            //sets the new role for the selected employee using the selected options
            connection.query(
              "UPDATE employee SET ? WHERE ?",
              [{ role_id: roleId }, { id: empId }],
              (err, res) => {
                if (err) throw err;
                console.log(
                  `Updated ${response.employee}'s role in the database`
                );
                // Call updateProduct AFTER the INSERT completes

                menuPrompt();
              }
            );
          });
      }
    );
  });
}

// Shows all the roles and their associated department
function viewRoles() {
  let query = `SELECT 
  role.id, title, salary, name AS department
FROM
  role
  INNER JOIN department ON role.department_id = department.id
ORDER BY role.id`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    console.table(res);
    menuPrompt();
  });
}

// Lets the user select a department to add a role to,
// Then lets the user enter a new role and salary
function newRole() {
  // Gets all the departmetns in the table
  connection.query("SELECT name, id FROM department", (err, res) => {
    if (err) throw err;
    // Prompts the user to select a department then enter a new role and salary
    inquirer
      .prompt([
        {
          type: "list",
          message: "What department is the new role under?",
          choices: res.map((el) => el.name),
          name: "department",
        },
        {
          type: "input",
          message: "What is the new role called?",
          name: "role",
        },
        {
          type: "input",
          message: "What is the salary of the new role?",
          name: "salary",
        },
      ])
      .then((response) => {
        //console.log(titles, managers);

        // gets the id of the department
        let deptId = res.filter((el) => el.name === response.department)[0].id;

        // Makes an object to be added to the role table
        let dept = {
          title: response.role,
          salary: Number.parseFloat(response.salary),
          department_id: deptId,
        };

        // adds the role to the table
        connection.query("INSERT INTO department SET ?", dept, (err, res) => {
          if (err) throw err;
          console.log(`Added ${dept.title} to the database`);
          // Call updateProduct AFTER the INSERT completes

          menuPrompt();
        });
      });
  });
}

// Lets the user delete a role fro the table
// Only roles with no employees assigned to them can be deleted
function deleteRole() {
  // Selects all the roles in the table as choices
  connection.query(`SELECT title, id FROM role`, (err, res) => {
    if (err) throw err;

    let roles = res;
    //managers.unshift({ name: "None", id: 0 });
    //console.log(managers);
    inquirer
      .prompt([
        {
          type: "list",
          message: "Select a role to delete:",
          choices: roles.map((el) => el.title),
          name: "role",
        },

        {
          type: "confirm",
          message: "Are you sure you want to delete this role?",
          default: true,
          name: "confirm",
        },
      ])
      .then((response) => {
        //console.log(titles, managers);

        if (response.confirm) {
          // Gets the id of the chosen role
          let roleId = roles.filter((el) => el.title === response.role)[0].id;
          // Checks if any employees have the chosen role
          connection.query(
            "SELECT COUNT(*) FROM employee GROUPBY role_id WHERE role_id = ?",
            roleId,
            (err, res) => {
              if (err) throw err;

              // If an employee has the role it tells the user and sends them to the menu
              if (res.length > 0) {
                console.log(
                  "You cannot delete a role while an employee is assigned to it"
                );
                menuPrompt();
                // Otherwise it removes the role from the table
              } else {
                connection.query(
                  "DELETE FROM role WHERE ?",
                  [{ id: roleId }],
                  (err, res) => {
                    if (err) throw err;
                    console.log(`Removed ${response.role} from the database`);
                    // Call updateProduct AFTER the INSERT completes

                    menuPrompt();
                  }
                );
              }
            }
          );
        }
      });
  });
}

// Selects all the departments to show the user
function viewDepartments() {
  let query = `SELECT * FROM department ORDER BY id`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    console.table(res);
    menuPrompt();
  });
}

// Lets the user create new departments
function newDepartment() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "What is the name of the new department?",
        name: "name",
      },
    ])
    .then((response) => {
      //console.log(titles, managers);

      connection.query(
        "INSERT INTO department SET ?",
        { name: response.name },
        (err, res) => {
          if (err) throw err;
          console.log(`Added ${response.name} department to the database`);
          // Call updateProduct AFTER the INSERT completes

          menuPrompt();
        }
      );
    });
}

// Allows the user to delete a department if no user works in it
function deleteDepartment() {
  // Selects all the departments to show the users
  connection.query(`SELECT name, id FROM department`, (err, res) => {
    if (err) throw err;

    let depts = res;
    //managers.unshift({ name: "None", id: 0 });
    //console.log(managers);
    inquirer
      .prompt([
        {
          type: "list",
          message: "Select a department to delete:",
          choices: depts.map((el) => el.name),
          name: "dept",
        },

        {
          type: "confirm",
          message: "Are you sure you want to delete this department?",
          default: true,
          name: "confirm",
        },
      ])
      .then((response) => {
        //console.log(titles, managers);
        if (response.confirm) {
          // Gets the id of the selected department
          let deptId = depts.filter((el) => el.name === response.dept)[0].id;
          // Checks to make sure no employees work in the deartment
          connection.query(
            `SELECT COUNT(*) FROM
          employee INNER JOIN role ON employee.role_id = role.id 
          INNER JOIN department ON role.department_id = department.id 
          LEFT JOIN employee AS manager ON employee.manager_id = manager.id
          WHERE department_id = ?
         GROUP BY department.id;`,
            deptId,
            (err, res) => {
              if (err) throw err;

              // If any employees work in that department, tell the user and send them to the menu
              if (res.length > 0) {
                console.log(
                  "You cannot delete a department while an employee is assigned to it"
                );
                menuPrompt();
                // Otherwise delete the department from the table
              } else {
                connection.query(
                  "DELETE FROM department WHERE ?",
                  [{ id: deptId }],
                  (err, res) => {
                    if (err) throw err;
                    console.log(`Removed ${response.dept} from the database`);
                    // Call updateProduct AFTER the INSERT completes

                    menuPrompt();
                  }
                );
              }
            }
          );
        }
      });
  });
}

// Gets the budget of each created department where the budget is the sum of all employee salaries
function departmentBudgets() {
  let query = `SELECT department.name, SUM(salary) AS budget FROM
  employee INNER JOIN role ON employee.role_id = role.id 
  RIGHT JOIN department ON role.department_id = department.id 
 GROUP BY department.name
 ORDER BY SUM(salary) DESC`;

  connection.query(query, (err, res) => {
    if (err) throw err;

    console.table(res);
    menuPrompt();
  });
}
