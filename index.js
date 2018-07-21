const express = require('express')
const app = express()
const path = require('path')
const httpserver = require('http-server')
const axios = require('axios')
// const Sequelize = require('sequelize');
const { Client } = require('pg')
// const sequelize = new Sequelize('postgres://smartmeter:smartmeter@localhost:5432/smartmeter');

const PORT = process.env.PORT || 5000

let newPreviousunit,
    newTotalunit,
    newCurrentunit

app.use(express.static('public'))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://smartmeter:smartmeter@localhost:5432/smartmeter',
    ssl: true,      
});

client.connect((err, client, done) => {
    if(err) {
        console.error(err);
        return
    }
});

let data = 'No data'

rootUrl = "http://localhost:5000";

const bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/',(req, res) => {
    res.render('layout')
})
// let counter = 205;
// setInterval(function(){
//     counter = (counter + Math.random() * (10 - 1) + 1)
//     // Make a request for a user with a given ID
//     axios.get(`${rootUrl}/post/${counter}`)
//     .catch(function (error) {
//     // handle error
//     // console.log(error);
//     });
// },1000)

app.get('/chart', (req, res) => {
    client.query("SELECT currentunit, updatedtime from consumption ORDER BY id desc limit 10", (err, result) => {
        res.send(JSON.stringify({
            'chartdata' : result.rows
        }))
    })
})
app.get('/post/:data', (req, res) => {
    (async () => {   
    console.log(req.params.data)
    data = req.params.data
    try { await client.query("SELECT id from customers WHERE name='Braz'",function(err, result){
        if(err){
            client.end()
            return console.error('error running query', err);
        }
        userid = result.rows[0].id
        
        client.query("SELECT * from consumption WHERE id=(SELECT max(id) from consumption)", function(err, result){
            if(err){
                client.end()
                return console.error('error running query', err);
            }
            const {previousunit, totalunit, currentunit, updatedtime} = result.rows[0];
            console.log(previousunit, totalunit, currentunit, updatedtime)
            newPreviousunit = totalunit
            newTotalunit = data
            newCurrentunit = Math.abs(newTotalunit - newPreviousunit)
            client.query("INSERT INTO consumption(userid, previousunit, totalunit, currentunit, updatedtime) VALUES($1, $2, $3, $4, $5)", 
            [userid, newPreviousunit, newTotalunit, newCurrentunit, new Date()]);
        })
      });} finally {
       
      }

    res.send(JSON.stringify({
        previousunit: newPreviousunit,
        totalunit: newTotalunit,
        currentunit: newCurrentunit
    }))
    })().catch(e => console.error(e.stack))
})

app.get('/data', (req,res) => {
    client.query("SELECT status from customers WHERE id=1", function(err, result){
        if(err) {
                console.error("Unable to enable user", err)
                res.sendStatus(401)
        } else {
            if(result.rows[0].status) {
                userStatus = 'yes'
            }
            else{
                userStatus = 'no'
            }
            client.query("SELECT * from consumption WHERE id=( SELECT max(id) from consumption)", function(err, result){
                if(err) {
                        console.error("Unable to enable user", err)
                        res.sendStatus(401)
                } else {
                    res.send(JSON.stringify({
                        cunit: Number.parseFloat(result.rows[0].currentunit).toFixed(2),
                        state: userStatus
                    }))
             }
    })
    }    

})
})

app.get('/dataforlayout', (req,res) => {
    client.query("SELECT status from customers WHERE id=1", function(err, result){
        if(err) {
                console.error("Unable to enable user", err)
                res.sendStatus(401)
        } else {
            if(result.rows[0].status) {
                userStatus = 'yes'
            }
            else{
                userStatus = 'no'
            }
            client.query("SELECT * from consumption WHERE id=( SELECT max(id) from consumption)", function(err, result){
                if(err) {
                        console.error("Unable to enable user", err)
                        res.sendStatus(401)
                } else {
                    res.send(JSON.stringify({
                        previousunit: Number.parseFloat(result.rows[0].previous).toFixed(2),
                        currentunit: Number.parseFloat(result.rows[0].currentunit).toFixed(2),
                        cost: Number.parseFloat(result.rows[0].currentunit * 7.5).toFixed(2),
                        state: userStatus
                    }))
             }
    })
    }    

})
})

app.get('/dataforadmin', (req,res) => {
        client.query("SELECT * from consumption ORDER BY id desc LIMIT 5", function(err, result){
            if(err){
                client.end()
                return console.error('error running query', err);
            }
            allCurrentUnit = []
            for(i=0; i<result.rows.length; i++) {
                allCurrentUnit.push(parseFloat(result.rows[i].currentunit))

            }
            allCurrentUnit = allCurrentUnit.filter(function(e){return e});
            var sum, avarageCurrentUnit = 0;
            if (allCurrentUnit.length) {
                sum = allCurrentUnit.reduce(function(a, b) { return a + b; });
                avarageCurrentUnit = sum / allCurrentUnit.length;
            } else {
                avarageCurrentUnit = allCurrentUnit[0]
            }
            peakValue = Math.max.apply(Math, allCurrentUnit)
            res.send(JSON.stringify({prevoius: Number.parseFloat(result.rows[0].previousunit).toFixed(2),
                                    totalunit: Number.parseFloat(result.rows[0].totalunit).toFixed(2),
                                    currentunit: Number.parseFloat(result.rows[0].currentunit).toFixed(2),
                                    peak: Number.parseFloat(peakValue).toFixed(2),
                                    cost: Number.parseFloat(result.rows[0].totalunit * 7.5).toFixed(2),
                                    avarageCurrentUnit: Number.parseFloat(avarageCurrentUnit).toFixed(2) }))    
        })
    })       

app.get('/admin', (req, res) =>{
    res.render('admin')
})

app.get('/getusertable', (req, res) => {
    client.query("SELECT * from customers ORDER BY id",function(err, result){
        if(err) {
            return console.error('error getting data for admin', err);
        }
        res.send(JSON.stringify({userdata: result.rows}))
    })
})

app.get('/user/disable/:id', (req, res)=> {
    client.query("UPDATE customers SET status=false WHERE id=$1", 
        [req.params.id],
        function(err, result) {
            if(err) {
                console.err("Unable to disable user", err)
                res.sendStatus(500)
            }
            res.sendStatus(200)
        })
})

app.get('/user/enable/:id', (req, res)=> {
    client.query("UPDATE customers SET status=true WHERE id=$1", 
        [req.params.id],
        function(err, result) {
            if(err) {
                console.err("Unable to enable user", err)
                res.sendStatus(500)
            }
            res.sendStatus(200)
        })
})

app.get('/:id',(req, res) => {
    if(req.params.id == 1){
    res.render('user')
    } else {
        res.render('otheruser')
    }
})


app.listen(PORT, () => console.log(`listening on port ${PORT}`))