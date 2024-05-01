import inquirer from 'inquirer';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Create a connection to database 
const dbconnect = async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('Connected to database');
    return connection;
  } catch (error) {
    console.error('Cannot connect to database', error);
    process.exit(1);
  }
};
// create event in the application
const startevent = async () => {
  const db = await dbconnect();
  menu(db);
};
// Show main menu and take selection
const menu = async (db) => {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      'View All Departments', 
      'View All Roles',
      'View All Employees',
      'Add a Department', 
      'Add a Role', 
      'Add an Employee',
      'Update an Employee Role',
      'Nothing'
    ],
  });

  databases(db, action);
};
// Use input and push it to the respective function
const databases = async (db, action) => {
  switch (action) {
    case 'View All Departments':
      await departmentbase(db);
      break;
    case 'View All Roles':
      await rolebase(db);
      break;
    case 'View All Employees':
      await employeebase(db);
      break;
    case 'Add a Department':
      await adddepartments(db);
      break;
    case 'Add a Role':
      await addroles(db);
      break;
    case 'Add an Employee':
      await addemployees(db);
      break;
    case 'Update an Employee Role':
      await updateroles(db);
      break;
    case 'Nothing':
      console.log('Select an option');
      await db.end();
      break;
    default:
      console.log('Invalid request?');
      // return to menu again
      await menu(db); 
  }
};
// look at the departments
const departmentbase = async (db) => {
  const [departments] = await db.query('SELECT * FROM department');
  console.table(departments);
  menu(db);
};
// look at the roles
const rolebase = async (db) => {
  const [roles] = await db.query(`
    SELECT role.id, role.title, department.name AS department, role.salary
    FROM role
    INNER JOIN department ON role.department_id = department.id`);
  console.table(roles);
  menu(db);
};
// look at the employees
const employeebase = async (db) => {
  const [employees] = await db.query(`
    SELECT employee.id, 
    employee.first_name, 
    employee.last_name, 
    role.title, 
    department.name AS department, 
    role.salary, 
    CONCAT(manager.first_name, ' ', manager.last_name) AS manager
    FROM employee
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id
    LEFT JOIN employee manager ON employee.manager_id = manager.id`);
  console.table(employees);
  menu(db);
};
// add a new department to the db
const adddepartments = async (db) => {
  const { departmentarea } = await inquirer.prompt({
    type: 'input',
    name: 'departmentarea',
    message: 'Enter the name of the new department:',
  });

  await db.query('INSERT INTO department (name) VALUES (?)', [departmentarea]);
  console.log(`'${departmentarea}' was added`);
  menu(db);
};
// add new roles to db
const addroles = async (db) => {
  const [departments] = await db.query('SELECT id, name FROM department');
  // set formatting for display
  const departmentselect = departments.map(({ id, name }) => ({
    name,
    value: id,
  }));
// ask for an input if selecting a new input
  const { title, salary, departmentID } = await inquirer.prompt([
    { type: 'input',
     name: 'title',
     message: 'Enter the title of the new role:'
     },
    { type: 'input', name: 'salary', message: 'Enter the salary for this role:' },
    { type: 'list', name: 'department_id', message: 'Which department does this role belong to?', choices: departmentselect },
  ]);
// push the created identity to the db; return to menu again
  await db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [title, salary, departmentID]);
  console.log(`'${title}' was added`);
  menu(db);
};
startevent();