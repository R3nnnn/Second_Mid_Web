const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const https = require("https");
const allCharacters = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  const charactersURL = "https://thronesapi.com/api/v2/Characters";
  https.get(charactersURL, (response) => {
    if (response.statusCode === 200) {
      let tempRes = '';
      response.on("data", (data) => {
        tempRes += data;
      });
      response.on("end", () => {
        try {
          allCharacters.length = 0; // Limpia el array antes de asignar los nuevos personajes.
          Array.prototype.push.apply(allCharacters, JSON.parse(tempRes)); // Agrega los personajes al array existente.
          const itemsPerPage = 8;
          const totalPages = Math.ceil(allCharacters.length / itemsPerPage);
          let currentPage = parseInt(req.query.page) || 1;
          currentPage = Math.max(1, Math.min(currentPage, totalPages));
    
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const characters = allCharacters.slice(startIndex, endIndex);

          res.render("index", { characters: characters, currentPage: currentPage, totalPages: totalPages });
        } catch (error) {
          console.error(error.message);
          res.status(500).send("Error interno del servidor");
        }
      });
    } else {
      res.status(response.statusCode).send("Error al obtener datos de la API");
    }
  });
});

app.get("/character/:id", (req, res) => {
  const id = req.params.id;
  const selected = `https://thronesapi.com/api/v2/Characters/${id}`;
  https.get(selected, (response) => {
    let tempRes = '';
    response.on("data", (data) => {
      tempRes += data;
    });
    response.on("end", () => {
      const characterData = JSON.parse(tempRes);
        res.render("char", { character: characterData });
    });
  }).on("error", (error) => {
    console.error(error.message);
    res.status(500).send("Error, couldn't get character");
  });
});

app.get("/search", (req, res) => {
  const Search = req.query.q;
  if (!Search) {
      res.redirect("/");
  } else {
      const searchResults = allCharacters.filter(character => {
          return character.fullName.toLowerCase().includes(Search.toLowerCase());
      });
      
      res.render("index", { characters: searchResults, currentPage: 1, totalPages: 7 });
  }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", {
        message: err.message,
    });
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});
