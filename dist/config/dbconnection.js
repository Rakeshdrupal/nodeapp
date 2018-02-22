'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var mysql = require('mysql');

var connection = exports.connection = function connection(hostname, username, pass, databaseName) {
    var connection = mysql.createConnection({ host: hostname, user: username, password: pass, database: databaseName });

    try {
        connection.connect();
        console.log('Connected to the MYSQL database');
    } catch (e) {
        console.log('Database Connetion failed:' + e);
    }
    return connection;
};