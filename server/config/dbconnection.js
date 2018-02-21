const mysql = require('mysql');

export const connection = (hostname, username, pass, databaseName) => {
    let connection = mysql.createConnection({host: hostname, user: username, password: pass, database: databaseName});

    try {
        connection.connect();
        console.log('Connected to the MYSQL database');

    } catch (e) {
        console.log('Database Connetion failed:' + e);
    }
    return connection;

}
