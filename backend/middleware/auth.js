const jwt=require('jsonwebtoken');
const JWT_SECRET=process.env.JWT_SECRET;

function requireAuth(req,res,next){    
    const authHeader=req.headers.authorization || '';
    const token=authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if(!token){
        return res.status(401).json({message:'Please log in to continue.'});
    }

    try{
        const payload = jwt.verify(token,JWT_SECRET);
        req.userId=payload.userId;
        next();
    }catch(err){
        console.error(err);
        res.status(401).json({message:'Your session has expired. Please login again.'});
    }
}

module.exports={requireAuth,JWT_SECRET};