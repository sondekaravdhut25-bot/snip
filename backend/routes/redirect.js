const express=require('express');
const Url=require('../models/Url');

const router=express.Router();

router.get('/:shortCode',async(req,res)=>{
    try{
        const {shortCode} = req.params;
        const url = await Url.findOne({shortCode});

        if(!url){
            return res.status(404).json({message:'Short url not found.'});
        }

        url.clicks += 1;
        await url.save();

        return res.redirect(url.originalUrl);


    }catch(err){
        console.error(err);
        res.status(500).json({message:'Server error during redirect'})
    }
});

module.exports=router;