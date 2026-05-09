const cloud = require('wx-server-sdk');
const JWT=require('jsonwebtoken')
const JWT_SECRET='f3a2b8c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8'

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

function varifyToken(token) {
  try{
    const result = JWT.verify(token, JWT_SECRET);
    return {success:true, message:'correct'}
  }catch(err) {
    if (err.name == 'TokenExpiredError') {
      console.log('varify error:',err) 
    } else if (err.name == 'JsonWebTokenError') {
      console.log('varify error:',err) 
    }
    return {success:false, message:err.name}
  }
}

exports.main = async (event, context) => {
  const token = event.token
  console.log('checkToken:', token)
  const res = varifyToken(token)
  console.log('result:', res)
  if (res.success) {
    return {
      code: 0,
      data: {
        code: 0,
        message: res.message
      }
    }
  } else {
    return {
      code: -1,
      data: {
        code: -1,
        message: res.message
      }
    }
  }
};
