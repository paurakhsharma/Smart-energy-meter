const express = require('express')
const app = express()
const path = require('path')
const httpserver = require('http-server')

const PORT = process.env.PORT || 5000

app.use(express.static('public'))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

let data = 'No data'

const bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/',(req, res) => {
    res.render('index', {
        data
    })
})

app.post('/post', (req, res) => {
    console.log(req.body.data)
    data = req.body.data
    // res.send(`Thank you for ${req.body.data}`)
    res.render('index', {
        data
    })
})

app.get('/data', (req,res) => {
    var query = url.parse(req.url, true).query;
     
if (typeof query.file === 'undefined') {
    //specify Content will be an attachment
    res.setHeader('Content-disposition', 'attachment; filename=theDocument.txt');
    res.setHeader('Content-type', 'text/plain');
    res.end("Hello, here is a file for you!");
} else {
    //read the image using fs and send the image content back in the response
    fs.readFile('/' + query.file, function (err, content) {
        if (err) {
            res.writeHead(400, {'Content-type':'text/html'})
            console.log(err);
            res.end("No such file");    
        } else {
            //specify Content will be an attachment
            res.setHeader('Content-disposition', 'attachment; filename='+query.file);
            res.end(content);
        }
    });
}
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`))