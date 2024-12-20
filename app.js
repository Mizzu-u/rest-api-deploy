const express = require("express"); //* require -> commonJS
const crypto = require("node:crypto");
const cors = require("cors");
const path = require("path");

const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();
app.use(express.json());
app.use(cors());
app.disable("x-powered-by"); //! Deshabilitar el header X-Powered-By: Express

//* métodos normales: GET/HEAD/POST
//* métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS
app.use(express.static(path.join(__dirname, "web")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
//? Todos los recursos que sean MOVIES se identifica con /movies
app.get("/movies", (req, res) => {
  const { genre } = req.query; //?--> En la req podemos haceder a la propiedad query
  if (genre) {
    const filteredMovies = movies.filter((movie) => movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())); //?--> Tranformamos todo a LowerCase para evitar problemas con el KeySensivity
    return res.json(filteredMovies);
  }
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  const { id } = req.params; //? --> Aquí practicamente lo que esta pasando es que de la req.params = de la request y de los parametros me recupere los datos que le pase en { id }

  const movie = movies.find((movie) => movie.id === id); //?--> Recuperamos la movie

  if (movie) return res.json(movie); //?--> Si la encuentra la devuelve en el JSON

  res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), //* uuid v4 --> Unidentificador Unico Universal
    ...result.data,
  };

  //! Esto no sería REST, porque estamos guardando el estado de la aplicación en memoria
  movies.push(newMovie);

  res.status(201).json(newMovie);
});

app.delete("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movies.splice(movieIndex, 1);

  return res.json({ message: "Movie deleted" });
});

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
