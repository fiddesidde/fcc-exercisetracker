const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const exercises = require('./controllers/exercises');

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error connecting to MongoDB:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/exercise/new-user', exercises.createUser);

app.get('/api/exercise/users', exercises.getUsers);

app.post('/api/exercise/add', exercises.addExercise);

app.get('/api/exercise/log', exercises.getExerciseLog);

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});
