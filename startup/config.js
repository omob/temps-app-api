module.exports = function() {
  if (!process.env.SECRET_KEY) {
    throw new Error('FATAL ERROR: jwtPrivateKey SECRET_KEY is not defined.');
  }
  if(!process.env.DB_CONN) {
    throw new Error('FATAL ERROR: DB_CONN is not defined.');
  }
  if(!process.env.PORT) {
    throw new Error('FATAL ERROR: PORT is not defined.');
  }
  if(!process.env.HOST) {
    throw new Error('FATAL ERROR: HOST is not defined.');
  }
}