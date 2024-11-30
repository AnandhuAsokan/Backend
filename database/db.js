const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/vipralapta');
const db = mongoose.connection;

db.on('error',()=>{
    console.log('connection error');
});

db.once('open',()=>{
    console.log('Connected to db');
});

module.exports = db;