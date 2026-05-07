const cloud = require('wx-server-sdk')
const jwt = require('jsonwebtoken')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const APP_ID = process.env.APP_ID
const APP_SECRET = process.env.APP_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your-strong-secret'

exports.main = async (event, context) => {
  const { code } = event

  if (!code) { return { code: 400, message: 'missing code' } }

  try {
    const res = await cloud.openapi.auth.code2Session({
      js_code: code,
      appid: APP_ID,
      secret: APP_SECRET
    })

    if (res.errcode) {
      console.error('code2Session failed', res)
      return { code: 401, message: 'auth failed' }
    }

    const { openid, session_key } = res

    const db = cloud.database()
    const userCollection = db.collection('users_info')
    let userRecord = await userCollection.where({open_id : openid}).get()

    if (userRecord.data.length === 0) {
      return { code: 401, message: 'signup frist.' }
    }

    const token = jwt.sign(
      { user_id: userRecord.user_id, open_id: openid },
      JWT_SECRET,
      { expiresIn: '2d' }
    )

    return {
      code: 0,
      message: 'success',
      data: {
        token: token,
        userID: userRecord.user_id,
      }
    }
  } catch (err) {
    console.error('Login error:', err)
    return { code: 500, message: 'server error' }
  }
}
