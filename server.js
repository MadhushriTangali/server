const express = require('express')
const path = require('path')

const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

const app = express()
app.use(express.json())
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')
app.use(cors())

let db

const dbPath = path.join(__dirname, 'tasksApp.db')

const initializeDb = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(4000, () => {
      console.log('server started at port 4000')
    })
  } catch (e) {
    console.error(e)
  }
}
initializeDb()

const authenticationToken = async (request, response, next) => {
  let jwtToken
  let header = request.headers['authorization']
  if (header !== undefined) {
    jwtToken = header.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'SECREAT_KEY', (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

app.get('/tasks', authenticationToken, async (request, response) => {
  const getTasks = `SELECT * FROM tasks`
  const tasksArray = await db.all(getTasks)
  response.send(tasksArray)
})

app.post('/tasks', authenticationToken, async (request, response) => {
  const {title, description, status, due_date, user_id} = request.body
  const postTasks = `INSERT INTO tasks(title,description,status,due_date,user_id) VALUES(
    '${title}','${description}','${status}','${due_date}',${user_id});`
  await db.run(postTasks)
  response.send('Task Added')
})

app.delete('/tasks/:id', authenticationToken, async (request, response) => {
  const {id} = request.params
  const deleteTask = `DELETE FROM tasks WHERE id=${id};`
  await db.run(deleteTask)
  response.send('Task Deleted')
})

app.put('/tasks/:id', authenticationToken, async (request, response) => {
  const {id} = request.params
  const {title, description, due_date} = request.body
  let updateTaskTitle = `
        UPDATE tasks
        SET title='${title}',
        description='${description}',
        due_date='${due_date}'
        WHERE id=${id};`
  await db.run(updateTaskTitle)
  response.send('Task updated')
})

app.put('/tasks/status/:id', authenticationToken, async (request, response) => {
  const {id} = request.params
  const {status} = request.body
  let updateTask = `
        UPDATE tasks
        SET status='${status}'
        WHERE id=${id};`
  await db.run(updateTask)
  response.send('Task status updated')
})

app.post('/signup', async (request, response) => {
  const {name, email, password, created_at} = request.body
  let hashedpassword = await bcrypt.hash(password, 10)
  let dbUserquery = `SELECT * FROM users WHERE email='${email}';`
  let dbUser = await db.get(dbUserquery)
  if (dbUser === undefined) {
    let createquery = `
            INSERT INTO
            users(name,email,password,created_at)
            VALUES(
              '${name}',
              '${email}',
              '${hashedpassword}',
              '${created_at}'
            );`
    await db.run(createquery)
    response.status(200)
    response.send('User created successfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  let {email, password} = request.body
  let getUserQuery = `
      SELECT *
      FROM users
      WHERE email='${email}';`
  let dbUser = await db.get(getUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    let isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      let payload = {email: email}
      let jwtToken = jwt.sign(payload, 'SECREAT_KEY')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
