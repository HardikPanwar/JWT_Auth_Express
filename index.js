const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const server = http.createServer(app);
const bodyParser = require('body-parser');
const User = require('./model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
require('./config/db').connect();

const port = process.env.PORT || 2000;
app.use(bodyParser.json());
app.use(express.json());

app.post('/register', async (req, res) => {
  console.log(req.body);
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!(first_name && last_name && email && password)) {
      res.status(400).json('Enter all the details');
    }
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      res.status(409).json('User already exist, Please Login');
    }
    let encryptedPassword = await bcrypt.hash(password, 10);
    console.log(encryptedPassword);
    const user = await User.create({
      first_name,
      last_name,
      email: email,
      password: encryptedPassword,
    });

    const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, { expiresIn: '2h' });
    user.token = token;

    res.status(201).json(user);
  } catch (error) {
    console.log(error);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).json('Enter all the details');
    }
    const user = await User.findOne({ email });
    if (user && bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, { expiresIn: '2h' });
      user.token = token;
      return res.status(200).json(user);
    }
    res.status(400).json('Invalid Credentials');
  } catch (error) {
    console.log(error);
  }
});

const auth = require('./middleware/auth');

app.post('/home', auth, (req, res) => {
  res.status(200).send('Verified ');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
