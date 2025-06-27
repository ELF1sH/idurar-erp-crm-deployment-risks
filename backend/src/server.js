require('module-alias/register');
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  console.log('Please upgrade your node.js version at least 20 or greater. 👌\n ');
  process.exit();
}

// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
};

async function connectWithRetry(retries = 5, delay = 2000) {
  try {
    await mongoose.connect(process.env.DATABASE, options);
    console.log('MongoDB подключился');

    logger.info('[server.js] MongoDB has been successfully connected')
  } catch (err) {
    console.error(`Ошибка подключения к MongoDB: ${err.message}. Повторная попытка через ${delay} мс...`);
    logger.error(`[server.js] Error connecting to MongoDB: ${err.message}. Another attempt in ${delay} ms...`)
    if (retries > 0) {
      setTimeout(() => connectWithRetry(retries - 1, delay * 2), delay);
    } else {
      console.error('Слишком много пытлся. MongoDB не работает, чини!!!');
      logger.error(`[server.js] Too many attempts connecting to MongoDB: ${err.message}`);

      process.exit(1);
    }
  }
}
mongoose.connection.on('disconnected', () => {
  console.warn('[server.js] MongoDB отключился. Попытка переподключения...');

  logger.warn(`MongoDB has been disconnected. Trying to reconnect`);
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB переподключился');

  logger.info(`[server.js] MongoDB has been successfully reconnected`)
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB ошибка подключения:', err);

  logger.error(`[server.js] Error connecting to MongoDB: ${err.message}`);
});
connectWithRetry();

const modelsFiles = globSync('./src/models/**/*.js');

for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

// Start our app!
const app = require('./app');
const logger = require("@/utils/logger");
app.set('port', process.env.PORT || 8888);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → On PORT : ${server.address().port}`);
});
