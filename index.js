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
          "Delete an Employee",
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

function newEmployee() {
  connection.query("SELECT title, id FROM role", (err, res) => {
    if (err) throw err;
    let titles = res;

    //console.log(titles);
    connection.query(
      `SELECT CONCAT(first_name, " ", last_name) AS name, id FROM employee`,
      (err, res) => {
        if (err) throw err;

        let managers = res;
        managers.unshift({ name: "None", id: 0 });
        //console.log(managers);
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

            let roleId = titles.filter((el) => el.title === response.title)[0]
              .id;

            let managerId = managers.filter(
              (el) => el.name === response.manager
            )[0].id;

            let emp = {
              first_name: response.first,
              last_name: response.last,
              role_id: roleId,
            };
            if (managerId != 0) {
              emp.manager_id = managerId;
            }
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

function deleteEmployee() {
  connection.query(
    `SELECT CONCAT(first_name, " ", last_name) AS name, id FROM employee`,
    (err, res) => {
      if (err) throw err;

      let employees = res;
      //managers.unshift({ name: "None", id: 0 });
      //console.log(managers);
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

          let empId = employees.filter((el) => el.name === response.employee)[0]
            .id;

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
        });
    }
  );
}

function updateRole() {
  connection.query("SELECT title, id FROM role", (err, res) => {
    if (err) throw err;
    let titles = res;

    //console.log(titles);
    connection.query(
      `SELECT CONCAT(first_name, " ", last_name) AS name, id FROM employee`,
      (err, res) => {
        if (err) throw err;

        let employees = res;
        //managers.unshift({ name: "None", id: 0 });
        //console.log(managers);
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

            let roleId = titles.filter((el) => el.title === response.title)[0]
              .id;

            let empId = employees.filter(
              (el) => el.name === response.employee
            )[0].id;

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

function newRole() {
  connection.query("SELECT name, id FROM department", (err, res) => {
    if (err) throw err;
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

        let deptId = res.filter((el) => el.name === response.department)[0].id;

        let dept = {
          title: response.role,
          salary: Number.parseFloat(response.salary),
          department_id: deptId,
        };

        connection.query("INSERT INTO department SET ?", dept, (err, res) => {
          if (err) throw err;
          console.log(`Added ${dept.title} to the database`);
          // Call updateProduct AFTER the INSERT completes

          menuPrompt();
        });
      });
  });
}

function deleteRole() {
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

        let roleId = roles.filter((el) => el.title === response.role)[0].id;
        connection.query(
          "SELECT COUNT(*) FROM employee GROUPBY role_id WHERE role_id = ?",
          roleId,
          (err, res) => {
            if (err) throw err;

            if (res.length > 0) {
              console.log(
                "You cannot delete a role while an employee is assigned to it"
              );
              menuPrompt();
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
      });
  });
}

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

function deleteDepartment() {
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

        let deptId = depts.filter((el) => el.name === response.dept)[0].id;
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

            if (res.length > 0) {
              console.log(
                "You cannot delete a department while an employee is assigned to it"
              );
              menuPrompt();
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
      });
  });
}
