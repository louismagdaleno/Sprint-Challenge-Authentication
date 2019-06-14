const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('knex')(require('../knexfile').development);



const { authenticate } = require('../auth/authenticate');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function createJWT(payload, fn){
  jwt.sign(payload, jwtKey, { expiresIn: '1h' }, fn);
}

function register(req, res) {

  // grab username and password from request body
  let { username, password } = req.body;

  // hash password
  password = bcrypt.hashSync(password);

  // insert into db
  db('users').insert({ username, password: password });

  // create JWT
  createJWT({username}, (err, token) => {
    if (err){
      throw err;
    } else {
      res.status(200).json(token);
    }
  });
}

function login(req, res) {
  // implement user login
  let { username, password } = req.body;
  db('users')
    .select('password')
    .where('username', '=', username)
    .first()
    .then(hash => bcrypt.compare(password, hash.password))
    .then((verdict) => {
      if (verdict) {
        makeJWT({ username }, (err, token) => {
          if (err) {
            throw err;
          } else {
            res.status(200).json(token);
          }
        });
      } else {
        res.status(402).json({ message: 'Incorrect username or password' });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({ message: 'We cant log you in right now, please try again later' });
    });

}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
