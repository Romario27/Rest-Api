import express, { json } from 'express'
import pkg from 'jsonwebtoken';
const { verify, sign } = pkg;
//import { verify, sign } from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import { findAvailablePort } from './free-port.js'

import accounts from './accounts.json' assert {type: 'json'}
import movies from './movies.json' assert {type: 'json'}
import { validateMovie, validatePartialMovie } from './schemas/movies.js'
import { validateUserData } from './schemas/newUser.js'
const desiredPort = process.env.PORT ?? 3000

const SECRET = 'kungfu_Key'

const app = express()
app.use(json())
//app.use(cors())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'https://appfrontend-yme6.onrender.com',
      'http://localhost:3000',
      'http://localhost:8080',
      'https://movies.com',
      'https://midu.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))
app.disable('x-powered-by') // deshabilitar el header X-Powered-By: Express

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS

function verifyToken(req, res, next) {
  const auth = req.headers.authorization

  if (!auth) return res.status(401).json({ error: 'No token' })

  const token = auth.split(' ')[1]

  try {
    const decoded = verify(token, SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(403).json({ error: 'Token inválido' })
  }
}

// Todos los recursos que sean MOVIES se identifica con /movies
app.get('/movies', verifyToken, (req, res) => { // este metodo se usa tambien para obtener peli x genero
  
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  
  
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

app.get('/movies/title/:title', (req, res) => {
  const { title } = req.params
  const movie = movies.find(movie => movie.title === title)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies',verifyToken, (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en base de datos
  const newMovie = {
    id: randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = { // este paso lo que hace es como copiar los parametros, que coinciden, q esta en result en movies[index] 
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.post('/login', (req,res) => {
  const {username, password} = req.body

  const user= accounts.find(user => user.username === username && user.password === password)

  if (!user){
    return res.status(401).json({error: 'User Invalid. Please try again!!'})
  }

  const token = sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: '1h' }
  )

  res.json({ token })

})

app.post('/newAcc' , (req,res) =>{
  const result = validateUserData(req.body)
  

  if (!result.success) {
    console.log(result.error.message)
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  console.log("No fail")
   // en base de datos
  const newUser = {
    id: randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  accounts.push(newUser)

  res.status(201).json(newUser)

})


/*findAvailablePort(desiredPort).then(port => {
  app.listen(port, () => {
    console.log(`server listening on port http://localhost:${port}`)
  })
})*/

app.listen(desiredPort, () => {
  console.log(`server listening on port http://localhost:${desiredPort}`)
})
