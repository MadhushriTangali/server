const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')

const app = express()
app.use(express.json())
let db = null

const dbPath = path.join(__dirname, 'todoApplication.db')

const initializeDb = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('server started at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB has error: ${e.message}`)
  }
}

initializeDb()

const checkRequestsQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formatedDate = format(myDate, 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q

  next()
}

const checkRequestsBody = async (request, response, next) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatedDate = format(myDate, 'yyyy-MM-dd')
      const result = toDate(new Date(formatedDate))
      const isValidDate = isValid(result)
      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todo = todo
  request.id = id

  request.todoId = todoId

  next()
}

app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {status = '', search_q = '', priority = '', category = ''} = request
  const getTodoQuery = `
    SELECT id,todo,priority,status,category,due_date AS dueDate
    FROM todo
    WHERE category LIKE '%${category}%' AND status LIKE '%${status}%' AND priority LIKE '%${priority}%' AND todo LIKE '%${search_q}%';`
  let result = await db.all(getTodoQuery)
  response.send(result)
})

app.get('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  const {todoId} = request
  const getTodoWithTodoidQuery = `
  SELECT id,todo,priority,status,category,due_date AS dueDate
  FROM todo
  WHERE id=${todoId};`

  let result = await db.get(getTodoWithTodoidQuery)
  response.send(result)
})

app.get('/agenda/', checkRequestsQueries, async (request, response) => {
  const {date} = request
  const getWithdatequery = `
  SELECT id,todo,priority,status,category,due_date as dueDate
  FROM todo
  WHERE due_date='${date}';`
  let result = await db.all(getWithdatequery)
  if (result === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(result)
  }
})

app.post('/todos/', checkRequestsBody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request
  const postTodoWithQuery = `
  INSERT INTO todo(id,todo,priority,status,category,due_date)
  VALUES(
    ${id},
    '${todo}',
    '${priority}',
    '${status}',
    '${category}',
    '${dueDate}'
  );`
  let user = await db.run(postTodoWithQuery)
  console.log(user)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', checkRequestsBody, async (request, response) => {
  const {todoId} = request
  const {todo, priority, status, category, dueDate} = request
  if (status !== undefined) {
    const putTodoWithQuerystatus = `
      UPDATE todo 
      SET status='${status}'
      WHERE id=${todoId}
      ;`
    await db.run(putTodoWithQuerystatus)
    response.send('Status Updated')
  }
  else if (priority !== undefined) {
    const putTodoWithQuerypriority = `
      UPDATE todo 
      SET priority='${priority}'
      WHERE id=${todoId}
      ;`
    await db.run(putTodoWithQuerypriority)
    response.send('Priority Updated')
  }
  else if (todo !== undefined) {
    const putTodoWithQueryTodo = `
      UPDATE todo 
      SET todo='${todo}'
      WHERE id=${todoId}
      ;`
    await db.run(putTodoWithQueryTodo)
    response.send('Todo Updated')
  }
  else if (category !== undefined) {
    const putTodoWithQuerycategory = `
      UPDATE todo 
      SET category='${category}'
      WHERE id=${todoId}
      ;`
    await db.run(putTodoWithQuerycategory)
    response.send('Category Updated')
  }
  else if (dueDate !== undefined) {
    const putTodoWithQueryduedate = `
      UPDATE todo 
      SET due_date='${dueDate}'
      WHERE id=${todoId}
      ;`
    await db.run(putTodoWithQueryduedate)
    response.send('Due Date Updated')
  }
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    DELETE FROM todo
    WHERE id=${todoId};
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
