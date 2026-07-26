const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config();


const app = express();

app.use(cors({origin :'http://localhost:5173'}))
app.use(express.json());

app.get('/' , (req ,res)=>{
    res.json({
        message: 'finSight AI - Node.js is running',
        status : 'ok'
    })
})

const transactionRoutes = require('./routes/transaction.routes')
app.use('/api/transactions', transactionRoutes)

mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log('mongodb connected');
    })
    .catch((err)=>{
        console.log("mongodb connection fail  ",err.message)   
    }) 

const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`)
    })

    

