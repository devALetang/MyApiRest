const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt =require('bcryptjs');

dotenv.config({ path: './.env'});

const app = express();
app.use(express.json());

// Configuration de la connexion MySQL
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

// configuration des tokens
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  }

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN
  }
  return jwt.sign(payload, process.env.JWT_SECRET, options)
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization

  if(!token) {
    return res.status(401).json({ error: 'Access denied. Token missing.'})
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'invalid token.'})
    }

    req.user = decoded
    next()

  })
}



// Établir la connexion à la base de données MySQL
db.connect(err => {
  if (err) {
    console.log(err)
  } else {
  console.log('Connecté à la base de données MySQL');
  }
});

// Récupérer tous les utilisateurs
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, rows) => {
    if (err) throw err;
    res.json(rows);
  });
});

// Récupérer un utilisateur spécifique
app.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query('SELECT * FROM users WHERE userId = ?', [userId], (err, rows) => {
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
  const { lastName, firstName, email, password, role } = req.body

  bcrypt.hash(password, 10, (error, hashedPassword) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: "Operation failed" });
    } else {
      const newUser = { lastName, firstName, password: hashedPassword, role, email };
      db.query("INSERT INTO users SET ?", newUser, (error, result) => {
        if (error) {
          console.log(error);
          res.status(500).json({ error: "Operation failed" });
        } else {
          const user = { id: result.insertId, ...newUser };
          const token = generateToken(user);
          res.status(201).json({
            message: "User created successfully",
            token: token
          });
        }
      });
    }
  });
});


// Mettre à jour un utilisateur existant
app.put('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const updatedUser = req.body;
  db.query('UPDATE users SET ? WHERE userId = ?', [updatedUser, userId], (err, result) => {
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
  db.query('DELETE FROM users WHERE userId = ?', [userId], (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) {
      res.status(404, { message: 'user not found' });
    } else {
      res.json({ message: "user successfully deleted" });
      res.status(200)
    }
  });
});

// Connexion d'un utilisateur
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Operation failed" });
    } else {
      if (rows.length === 0) {
        res.status(404).json({ message: "User not found" });
    } else {
        const user = rows[0];
        bcrypt.compare(password, user.password, (error, result) => {
          if (error) {
            console.log(error);
            res.status(500).json({ error: "Operation failed" });
          } else {
            if (result) {
              const token = generateToken(user);
              res.status(200).json({
                message: "User logged in successfully",
                token: token
              });
            } else {
              res.status(401).json({ message: "Invalid credentials" });
            }
          }
        });
      }
    }
  });
});

// Récupérer les informations de l'utilisateur connecté
app.get('/me', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT * FROM users WHERE userId = ?', [userId], (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Operation failed" });
    } else {
      if (rows.length === 0) {
        res.status(404).json({ message: "User not found" });
      } else {
        const user = rows[0];
        res.status(200).json(user);
      }
    }
  });
});


// Démarrer le serveur
app.listen(4000, () => {
  console.log('Serveur démarré sur le port 4000')
});