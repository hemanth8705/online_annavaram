const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;
let connectionPromise;

mongoose.set('strictQuery', true);

async function connectToDatabase() {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const envUri = process.env.MONGODB_URI;
      let connectionUri = envUri;
      let usedMemoryServer = false;

      if (connectionUri) {
        try {
          await mongoose.connect(connectionUri);
          console.log('MongoDB connection established');
          return mongoose.connection;
        } catch (error) {
          console.error(
            'MongoDB connection failed for configured URI, falling back to in-memory server.',
            error
          );
        }
      }

      if (!connectionUri) {
        console.warn(
          'MONGODB_URI not set. Starting in-memory MongoDB instance for development.'
        );
      }

      memoryServer = await MongoMemoryServer.create();
      usedMemoryServer = true;
      connectionUri = memoryServer.getUri();

      await mongoose.connect(connectionUri);
      console.log(
        `MongoDB connection established${usedMemoryServer ? ' (in-memory)' : ''}`
      );
      return mongoose.connection;
    } catch (error) {
      console.error('MongoDB connection failed', error);
      throw error;
    }
  })();

  return connectionPromise;
}

async function disconnectFromDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
  connectionPromise = undefined;
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};
