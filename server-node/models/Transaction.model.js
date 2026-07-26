const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema(
    {
        userId:{
            type: String,
            required:[true, 'userId is required'],
            index : true
        },
        amount : {
            type : Number,
            required:[true, 'amount is required'],
            min:[1, 'amount must be greater than 0']
        },
        category:{
            type: String,
            enum:['food','rent','entertainment','emi','salary','shopping','health','transport','other'],
            default:'other'
        },
        description:{
            type: String ,
            required:[true, 'description is required'],
            trim : true
        },
        date:{
            type: Date ,
            default: Date.now
        },
        type:{
            type: String ,
            enum: ['expenses', 'income'],
            default : 'expenses'
        },
        isAnomaly:{
            type: Boolean,
            default: false
        },
        anomalyScore:{
            type: Number,
            default:0
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Transaction', TransactionSchema)