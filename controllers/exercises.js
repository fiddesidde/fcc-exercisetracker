const Ex = require('../models/exercise');

module.exports.createUser = async (req, res) => {
    const { username } = req.body;
    const newUser = new Ex({ username });
    const n = await newUser.save();
    res.json({ username: n.username, _id: n._id });
};

module.exports.getUsers = async (req, res) => {
    const result = await Ex.find({});
    const send = result.map(user => {
        return { _id: user.id, username: user.username };
    });
    res.json(send);
};

module.exports.addExercise = async (req, res) => {
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
};

module.exports.getExerciseLog = async (req, res) => {
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
                Date.parse(log.date) >= queryObj.from &&
                Date.parse(log.date) <= queryObj.to
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
};
