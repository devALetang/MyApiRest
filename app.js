const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.json());

// Configuration de la connexion MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'apirest'
});

// Établir la connexion à la base de données MySQL
connection.connect(err => {
  if (err) throw err;
  console.log('Connecté à la base de données MySQL');
});

// Récupérer tous les utilisateurs
app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, rows) => {
    if (err) throw err;
    res.json(rows);
  });
});

// Récupérer un utilisateur spécifique
app.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  connection.query('SELECT * FROM users WHERE userId = ?', [userId], (err, rows) => {
    if (err) throw err;
    res.status(400, {message: "an error occurred"})
    if (rows.length === 0) {
      res.status(404).json({ message: 'User was not found' });
    } else {
      res.json(rows[0]);
      res.status(200)
    }
  });
});

// Ajouter un nouvel utilisateur
app.post('/users', (req, res) => {
  const newUser = req.body;
  connection.query('INSERT INTO users SET ?', newUser, (err, result) => {
    if (err) {
        throw err;
        res.status(400, {message: "an error occurred"})
    } else {
    newUser.userId = result.insertId;
    res.status(200).json({message: "user successfully created"})
    }
  });
});

// Mettre à jour un utilisateur existant
app.put('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const updatedUser = req.body;
  connection.query('UPDATE users SET ? WHERE userId = ?', [updatedUser, userId], (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) {
        res.status(400, {message: "an error occurred"})
    } else {
      res.json(updatedUser);
      res.status(200,{message: "user successfully modified"})
    }
  });
});

// Supprimer un utilisateur existant
app.delete('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  connection.query('DELETE FROM users WHERE userId = ?', [userId], (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) {
      res.status(404, { message: 'user not found' });
    } else {
      res.json({ message: "user successfully deleted" });
      res.status(200)
    }
  });
});

// Démarrer le serveur
app.listen(4000, () => {
  console.log('Serveur démarré sur le port 4000');
});