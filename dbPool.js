const mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit: 10,
    host: "ixnzh1cxch6rtdrx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "uswna38vrei41zfw",
    password: "is4ehvjxjm1qvgbn",
    database: "ebodqtxrobm93mta"
});

module.exports = pool;
