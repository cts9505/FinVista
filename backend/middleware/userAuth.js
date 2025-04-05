import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
  
    const {token} = req.cookies;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized !' });
    }
    
    try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if(decoded.id){
        req.body.userId = decoded.id;
        req.userId=decoded.id;
    }
    else{
        return res.status(401).json({ success: false, message: 'Unauthorized !' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export default userAuth;