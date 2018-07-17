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

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('Connection has been established successfully.');
//   })
//   .catch(err => {
//     console.error('Unable to connect to the database:', err);
//   });

// const Customers = sequelize.define('customers', {
// name: {
//     type: Sequelize.STRING
//     },
// address: {
//     type: Sequelize.STRING
//     },
// loadtype: {
//     type: Sequelize.INTEGER,
//     },    
// phasetype: {
//     type: Sequelize.INTEGER,
//     validate: {isIn: [[1,3]]}
//     },
// status: {
//     type: Sequelize.BOOLEAN
// }    
// });

// const Consumption = sequelize.define('consumption', {
// userid: {
//     type: Sequelize.INTEGER
// },
// previousunit: {
//     type: Sequelize.STRING,
//     defaultValue: 0,
//     },
// totalunit: {
//     type: Sequelize.INTEGER
//     },    
// currentunit: {
//     type: Sequelize.INTEGER
//     }
// }); 
  
// Customers.sync().then(() => {
//     // Table created
//     return Customers.create({
//       name: 'Braz',
//       address: 'Batulechour',
//       loadtype: '5',
//       phasetype: '1',
//       status: 'yes'
//     })
//   })

// Consumption.sync().then(() => {
//     return Consumption.create({
//         userid: 1,
//         previousunit: 0,
//         totalunit: 200,
//         currentunit: 200
//     })
// })


let data = 'No data'

rootUrl = "https://smartmeterwrc.herokuapp.com";

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

// },10000)

app.get('/addcustomer', (req, res) => {

})

app.post('/post', (req, res) => {
    console.log(req.body.data)
    data = req.body.data
    // res.send(`Thank you for ${req.body.data}`)
    res.send(JSON.stringify({data: req.body}))
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
            newCurrentunit = newTotalunit - newPreviousunit
            date = new Date()
            stringDate = date.toString()
            updatedtime = stringDate.slice(0,24)
            client.query("INSERT INTO consumption(userid, previousunit, totalunit, currentunit, updatedtime) VALUES($1, $2, $3, $4, $5)", 
            [userid, newPreviousunit, newTotalunit, newCurrentunit, newUpdatedtime]);
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
    res.send(JSON.stringify({
        previousunit: Number.parseFloat(newPreviousunit).toFixed(2),
        totalunit: Number.parseFloat(newTotalunit).toFixed(2),
        currentunit: Number.parseFloat(newCurrentunit).toFixed(2)
    }))
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

app.listen(PORT, () => console.log(`listening on port ${PORT}`))