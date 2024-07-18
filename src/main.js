/* Cloud Payments */


const express = require('express')
const path = require('path')
const app = express()
const frontApp = express();
const hbs = require('hbs')
const cors = require('cors');

const cookieParser = require('cookie-parser');

/* Config system */
require('module-alias/register');
require('dotenv').config()
require('colors')

/* Middleware to process JSON */
app.use(express.json());
frontApp.use(express.json());

app.use(cors())

const PORT = process.env.API_BACKEND || 3001
const FRONT_PORT = process.env.API_FRONTEND || 3000
const API_HOST = process.env.API_HOST || 'api.cloud-payments.net'

app.timeout = 0;

/* Database */
const connection = require("@database")

/* Route for access website */
frontApp.set('views', path.join(__dirname, 'views'));

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

frontApp.set('view engine', 'hbs');
frontApp.use(cookieParser());
frontApp.use(express.static(path.join(__dirname, 'public')));

/* Route frontend / Api */
frontApp.use('/',require("./routes/frontend"))
frontApp.use('/api',require("./routes/admin"))

/* Route company */
frontApp.use('/api/company',require("./routes/company"))

/* Route admin */
app.use('/api/administrator',require("./routes/admin"))

/* Route payment */
app.use('/api/v1',require("./routes/payments"))

/* listen server */
app.listen(PORT, ()=>{
    connection.sync().then(() =>{
        console.clear()
        frontApp.listen(FRONT_PORT, () => {
            return console.debug(`
            Frontend application running on the port: ${FRONT_PORT} 
            Backend application running on the port ${PORT}
            Database application running successfully
            Website application running on http://${API_HOST}
        `)
        });
    }).catch((err) =>{
        console.error(`${err}`.red)
        console.log('[-] Mysql connection error'.red)
        process.exit();
    })
})