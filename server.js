const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

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

const logSchema = new mongoose.Schema({
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true },
});

const exerciseSchema = new mongoose.Schema({
    username: { type: String, required: true },
    log: { type: [logSchema] },
});

exerciseSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        delete returnedObject.__v;
    },
});

const Ex = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/exercise/new-user', async (req, res) => {
    const { username } = req.body;
    const newUser = new Ex({ username });
    const n = await newUser.save();
    res.json({ username: n.username, id: n._id });
});

app.get('/api/exercise/users', async (req, res) => {
    const result = await Ex.find({});
    const send = result.map(user => {
        return { _id: user.id, username: user.username };
    });
    res.json(send);
});

app.post('/api/exercise/add', async (req, res) => {
    const { id, description, duration, date } = req.body;
    const logEntry = {
        description,
        duration,
        date: date || new Date(),
    };
    const result = await Ex.updateOne(
        { _id: id },
        { $push: { log: logEntry } }
    );
    res.json(result);
});

app.get('/api/exercise/log', (req, res) => {
    const { userId, from, to, limit } = req.query;
    const queryObj = {
        _id: userId,
        from,
        to,
        limit,
    };
    console.log(queryObj);

    res.json(queryObj);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});

// http://localhost:3000/api/exercise/log?userId=5fff0060ddb90ee714021b59&from=2020-01-01&to=2020-02-02&limit=2

// on live 5ffef77d0aa40e05f2b89265
