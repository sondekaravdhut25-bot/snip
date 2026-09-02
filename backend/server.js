const dotenv=require('dotenv');
dotenv.config();
const express=require('express');
const cors=require('cors');
const mongoose=require('mongoose');

const apiRoutes=require('./routes/api');
const authRoutes=require('./routes/auth');
const redirectRoutes=require('./routes/redirect');

const app=express();
const PORT=process.env.PORT || 5000
const MONGO_URI=process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

app.use('/api/auth',authRoutes);
app.use('/api',apiRoutes);
app.use('/',redirectRoutes);

mongoose.connect(MONGO_URI).then(() =>{
    console.log('connected to mongoDB');
    app.listen(PORT,() => console.log(`server running on port ${PORT}`));
})
.catch((err)=>{
    console.error('mongoDB connection error: ',err);
    process.exit(1);
})
