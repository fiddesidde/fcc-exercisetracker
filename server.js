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
    res.json({ username: n.username, _id: n._id });
});

app.get('/api/exercise/users', async (req, res) => {
    const result = await Ex.find({});
    const send = result.map(user => {
        return { _id: user.id, username: user.username };
    });
    res.json(send);
});

app.post('/api/exercise/add', async (req, res) => {
    const { userId, description, duration, date } = req.body;
    const logEntry = {
        description,
        duration,
        date: date ? new Date(date) : new Date(),
    };

    try {
        await Ex.updateOne(
            { _id: userId },
            { $push: { log: logEntry } },
            { runValidators: true }
        );
        const user = await Ex.findById(userId);
        const output = {
            _id: user._id,
            username: user.username,
            date: logEntry.date.toDateString(),
            duration: Number(duration),
            description,
        };
        res.json(output);
    } catch (error) {
        console.error(error);
        res.json({ error: 'bad format' });
    }
});

app.get('/api/exercise/log', async (req, res) => {
    const { userId, from, to, limit } = req.query;
    const user = await Ex.findById(userId).lean();
    const queryObj = {
        userId,
        from: from ? Date.parse(from) : Date.parse('1900-01-01'),
        to: to ? Date.parse(to) : Date.now(),
        limit: limit ? limit : user.log.length,
    };
    const logsToShow = user.log
        .filter(
            log =>
                Date.parse(log.date) > queryObj.from &&
                Date.parse(log.date) < queryObj.to
        )
        .slice(0, limit)
        .map(log => {
            return {
                description: log.description,
                duration: log.duration,
                date: log.date.toDateString(),
            };
        });
    const outputObj = {
        _id: userId,
        username: user.username,
        count: logsToShow.length,
        log: logsToShow,
    };
    res.json(outputObj);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});
