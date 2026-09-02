const express=require('express');
const jwt=require('jsonwebtoken');
const User=require('../models/User');
const {JWT_SECRET} = require('../middleware/auth');


const router=express.Router();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function signToken(userId){
    return jwt.sign({userId},JWT_SECRET,{expiresIn:'7d'});
}

router.post('/signup',async (req,res)=>{
    try{
        const {email,password} = req.body;

        if(!email || !isValidEmail(email)){
            return res.status(400).json({message:'Please provide valid email.'});
        }

        if(!password || password.length < 6){
            return res.status(400).json({message:'password must be at least 6 characters'})
        }

        const existing=await User.findOne({email:email.toLowerCase()})
        if(existing){
            return res.status(409).json({message:'An account with that email alredy exists.'});
        }

        const user=new User({email:email.toLowerCase(), password})
        await user.save();

        const token=signToken(user._id);
        res.status(201).json({token,email:user.email});
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error during signup.'});
    }
});

router.post('/login',async (req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:'Please provide email and password.'});
        }

        const user=await User.findOne({email:email.toLowerCase()});
        if(!user){
            return res.status(401).json({message:'Invalid email or password.'});
        }

        const match=await user.comparePassword(password);
        if(!match){
            return res.status(401).json({message:'Invalid email or passsword'});
        }

        const token = signToken(user._id);
        res.json({token,email:user.email});
    }catch(err){
        console.error(err);
        res.status(500).json({message:'Server error during login'})
    }
})

module.exports=router;