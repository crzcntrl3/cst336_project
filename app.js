const express = require("express");
const app = express();
const fetch = require("node-fetch");
const session = require("express-session");
const bcrypt = require("bcrypt");
const pool =require("./dbPool.js");
const saltRound = 10;


app.set("view engine","ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

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
app.get("/about",isAuthenticated, function(req,res){
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

app.get("/account", function(req,res){
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

app.get("/login",function(req, res) {
    res.render("about");
});
//when the user submits the form to log in
app.post("/login", async function(req, res){
    console.log(req.session.authenticated);
    let username = req.body.username;
    let password = req.body.password;
    
    let result = await usernameCheck(username);
    console.dir(result);
    let hashedPwd = "";
    
    if (result.length > 0){
        hashedPwd = result[0].password;
    }else{
        res.render("index", {"loginError":true});
        return;
    }
    
    let passwordMatch = await passwordCheck(password, hashedPwd);
    console.log("passwordMatch:" + passwordMatch);
    
    if (passwordMatch) {
        req.session.userLogged = username;
        req.session.votedItems = [];
        
        console.log("User logged in is " + req.session.userLogged);
        console.log("Is authenticated is " + (typeof(req.session.userLogged) != "undefined"));
        
        res.redirect("/about");
    }else{
        res.render("index", {"loginError":true});
    }
});

//register new account
//new issue, cannot INSERT into db
app.post("/register", async function(req, res){
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let gender = req.body.gender;
    let fname = req.body.fname;
    let lname = req.body.lname;
    let state = req.body.state;
    let county = req.body.county;
    
    let confirmPassword = req.body.confirmPassword;
    
    if(username == "" || password == ""){
        res.render("register", {"emptyError":true});
        return;
    }
    
    let result = await usernameCheck(username);
    console.dir(result);
    if (result.length > 0){
        res.render("register", {"existsError":true});
        return;
    }
    
    if (password != confirmPassword){
        res.render("register", {"retypeError":true});
        return;
    }
    
    let hashedPwd = await hashPassword(password);
    
    let sql = "INSERT INTO users (username, password, fname, lname, email, gender, state, county) VALUES (?,?,?,?,?,?,?,?)";
    let sqlParams = [username, hashedPwd, fname, lname, email, gender, state, county];
    
    pool.query(sql, sqlParams, function (err, rows,fields) {
        if (err) throw err;
        console.log(rows);
  });
  res.render("login", {"accountSuccess":true});
});


//logout  
app.get("/logout", function(req, res){
    req.session.destroy();
    res.redirect("/");
});

//to change the current user's password
app.post("/changePassword", async function(req, res){
    let oldPass = req.body.currentPassword;
    let newPass = req.body.newPassword;
    let cnewPass = req.body.cNewPassword;
    let username = req.session.userLogged;
    
    if(oldPass == "" || newPass == "" ||  cnewPass == ""){
        res.render("index", {"emptyError": true});
        return;
    }
    let result = await usernameCheck(username);
    console.dir(result);
    if (result.length <= 0){
        res.render("index", {"notExistsError":true});
        return;
    }
    let hashedPwd = result[0].password;
    let passwordMatch = await passwordCheck(oldPass, hashedPwd);
    console.log("passwordMatch:" + passwordMatch);
    
    if (!passwordMatch) {
      res.render("index", {"oldError":true});
      return;
    }
    
    if (newPass != cnewPass){
        res.render("register", {"confirmError":true});
        return;
    }
    
    let newHashedPwd = await hashPassword(newPass);
    
    let sql = "UPDATE users SET password = ? WHERE username = ?";
    let sqlParams = [newHashedPwd, username];
    
    pool.query(sql, sqlParams, function (err, rows, fields) {
        if (err) throw err;
        console.log(rows);
  });
  res.render("index", {"changeSuccess":true});
});

//to remove account
app.post("/removeAccount", async function(req, res){
    let username = req.session.userLogged;
    let password = req.body.deletionPassword;
    
    if(username == "" || password == ""){
        res.render("index", {"emptyError":true});
        return;
    }
    
    let result = await usernameCheck(username);
    console.dir(result);
    if (result.length <= 0){

        res.render("index", {"notExistsError":true});
        return;
    }
    let hashedPwd = result[0].password;
    let passwordMatch = await passwordCheck(password, hashedPwd);
    console.log("passwordMatch:" + passwordMatch);
    
    if (!passwordMatch) {

      res.render("index", {"oldError":true});
      return;
    }
    
    let userId = result[0].userID;
    

    let sql = "DELETE FROM users WHERE userID = ?";
    let sqlParams = [userId];
    
    await pool.query(sql, sqlParams, function (err, rows, fields) {
        if (err) throw err;
  });
  
  //force the user to log out
  req.session.destroy();  
  res.render("passResult", {"deleteSuccess":true});
});

/* Could not implement/test due to time constaints 
//internal api to get data from db
app.get("/api/getHunters",function(req,res){
   let sql = "SELECT * FROM hunters";
   pool.query(sql,isAuthenticated,function(err, rows, fields) {
       if(err) throw err;
       res.send(rows);
   });
});

//internal api to get data from contact
app.get("/api/getContacts",function(req, res) {
    let sql = "SELECT * FROM contact";
    pool.query(sql,isAuthenticated,function(err, rows, fields) {
        if(err) throw err;
        res.send(rows);
    });
});
*/


//verify username against the database    
function usernameCheck(username){
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
        next();
    }
}    

//check a passord against the hash
function passwordCheck(password, hashedValue){
    return new Promise( function(resolve, reject){
        bcrypt.compare(password, hashedValue, function(err, result){
            console.log("Result: " + result);
            resolve(result);
        });
    });
}

//hash a password, add it to the database
function hashPassword(password){
    return new Promise(function(resolve, reject){
        bcrypt.hash(password, saltRound, function(err, hash) {
            console.log("Hash: " + hash);
            resolve(hash);
        });
    });
}