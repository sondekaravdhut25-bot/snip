const express=require('express');
const {nanoid}=require('nanoid');
const QRCode=require('qrcode');
const router=express.Router();
const Url= require('../models/Url');
const {requireAuth}=require('../middleware/auth')

const BASE_URL=process.env.BASE_URL || "http://localhost:5000";
const MAX_URLS_PER_USER=50;

const isValidUrl = (value)=>{
    try{
        new URL(value);
        return true;
    }catch(err){
        return false;
    }
};

const buildQrCode = async (shortUrl) => {
    return await QRCode.toDataURL(shortUrl, {
        width: 240,
        margin: 1,
        color: {
            dark: '#0F3D3E',
            light: '#F6F1E7',
        },
    });
};

router.use(requireAuth);

router.post('/shorten', async (req, res) => {
  try {
    const { originalUrl, customCode } = req.body;

    if (!originalUrl || !isValidUrl(originalUrl)) {
      return res.status(400).json({ message: 'Please provide a valid URL.' });
    }

    const urlCount = await Url.countDocuments({ owner: req.userId });
    if (urlCount >= MAX_URLS_PER_USER) {
      return res.status(403).json({
        message: `You've reached the limit of ${MAX_URLS_PER_USER} short URLs. Delete an old one to make room.`,
      });
    }

    // If this user already shortened the same URL (and isn't requesting a custom code), reuse it
    const existing = await Url.findOne({ originalUrl, owner: req.userId });
    if (existing && !customCode) {
      const existingShortUrl = `${BASE_URL}/${existing.shortCode}`;
      return res.json({
        id: existing._id,
        originalUrl: existing.originalUrl,
        shortUrl: existingShortUrl,
        shortCode: existing.shortCode,
        clicks: existing.clicks,
        qrCode: await buildQrCode(existingShortUrl),
      });
    }

    let shortCode = customCode ? customCode.trim() : nanoid(7);

    if (customCode) {
      const codeTaken = await Url.findOne({ shortCode });
      if (codeTaken) {
        return res.status(409).json({ message: 'That custom code is already taken.' });
      }
    }

    const url = new Url({ originalUrl, shortCode ,owner: req.userId });
    await url.save();
    

    const shortUrl = `${BASE_URL}/${url.shortCode}`;

    res.status(201).json({
      id: url._id,
      originalUrl: url.originalUrl,
      shortUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      qrCode: await buildQrCode(shortUrl),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while shortening URL.' });
  }
});

router.get('/urls',async (req,res)=>{
    try{
        const urls=await Url.find({owner:req.userId}).sort({createdAt:-1});
       
        const formatted = urls.map((url)=>({
            id:url._id,
            originalUrl:url.originalUrl,
            shortUrl:`${BASE_URL}/${url.shortCode}`,
            shortCode:url.shortCode,
            clicks:url.clicks,
            ceatedAt:url.createdAt,
        }));
        res.json({urls:formatted, count:formatted.length, limit:MAX_URLS_PER_USER});
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error while fetching urls.'});
    }
});

router.get('/urls/:id/qr',async (req,res)=>{
    try{
         const url=await Url.findOne({_id:req.params.id,owner:req.userId});
    if(!url){
        return res.status(404).json({message:'Short URL not found'});
    }

    const shortUrl=`${BASE_URL}/${url.shortCode}`;
    res.json({qrCode:await buildQrCode(shortUrl)});
    }catch(err){
        console.error(err);
        res.status(500).json({message:'Server error while generating QR code.'});
    }
})

router.delete('/urls/:id', async (req,res)=>{
    try{
        const url=await Url.findOne({ _id:req.params.id,owner:req.userId});
        if(!url){
            return res.status(404).json({message:'short url not found'});
        }

        await url.deleteOne();
        res.json({message:'Deleted',id:req.params.id})

    }catch(err){
        console.error(err);
        res.status(500).json({message:'Server error while deleting URL.'})
    }
});

router.delete('/urls',async(req,res)=>{
    try{
        await Url.deleteMany({owner:req.userId});
        res.json({message:'History cleared.'})
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error while clearing history.'})
    }
});

module.exports = router;