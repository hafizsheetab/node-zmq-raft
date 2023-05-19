const mongoose = require('mongoose')


const connectDB = async (url) => {
    try{
        await mongoose.connect("mongodb://localhost:27017/db1?retryWrites=true&w=majority",{
            useNewUrlParser: true,
			useUnifiedTopology: true
        })
        console.log('MongoDB connected')
    }

    catch(err){
        console.error(err.message)
        process.exit(1)
    }
}

module.exports = connectDB