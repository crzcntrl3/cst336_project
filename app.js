const express = require("express");
const app = express();
const fetch = require("node-fetch");
const session = require("express-session");
const bcrypt = require("bcrypt");
const pool =require("./dbPool.js");


app.set("view engine","ejs");
app.use(express.static("public"));

app.use(session({
    secret:"top secret!",
    resave: true,
    saveUninitialized: true
}));


//routes
app.get("/", function(req, res){
    res.render("index");
});

//about
app.get("/about",function(req,res){
    res.render("about");
});

//register
app.get("/register",function(req, res) {
    res.render("register");
});

//contact
app.get("/contact",function(req, res) {
    res.render("contact");
});

app.get("/account",function(req,res){
    res.render("account");
});

//hunters
app.get("/hunters",function(req,res){
    res.render("hunters");
});


//starting server
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Express server is running...");
});


//destroy current session if the user logs out    
app.get("/logout", function(req, res){
    req.session.destroy();
    res.redirect("/");
})

//verify username against the database    
function checkUsername(username){
    let sql = "SELECT * FROM users WHERE username = ?";
    return new Promise(function(resolve, reject){
        pool.query(sql, [username], function (err, rows, fields){
            if (err) throw err;
            console.log("Rows found: " + rows.length);
            resolve(rows);
        });
    });
}

//check to see if any user is logged on 
function isAuthenticated(req, res, next) {
    if (typeof(req.session.userLogged) == "undefined"){
        res.redirect("/login");
    }else{
        next()
    }
}    

//check a passord against the hash
function checkPassword(password, hashedValue){
    return new Promise( function(resolve, reject){
        bcrypt.compare(password, hashedValue, function(err, result){
            console.log("Result: " + result);
            resolve(result);
        })
    })
}

//hash a password, add it to the database
function hashPassword(password){
    return new Promise(function(resolve, reject){
        bcrypt.hash(password, saltRounds, function(err, hash) {
            console.log("Hash: " + hash);
            resolve(hash);
        });
    })
}