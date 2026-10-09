import { MongoClient, Db } from 'mongodb';

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://clientUser:eC03qWMMsdFkuNqN@sajjadjim15.ac97xgz.mongodb.net/?appName=SajjadJim15';

const dbName = process.env.MONGODB_DB || 'expence_tracker_smart';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Connect to MongoDB and return the connected MongoClient instance
 */
export async function connectToMongoDB(): Promise<MongoClient> {
  try {
    const connectedClient = await clientPromise;
    console.log('Successfully connected to MongoDB Atlas!');
    return connectedClient;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}

/**
 * Get the MongoDB database instance (default: 'expence_tracker_smart')
 */
export async function getDatabase(customDbName?: string): Promise<Db> {
  const client = await connectToMongoDB();
  return client.db(customDbName || dbName);
}

/**
 * Disconnect from MongoDB (call when terminating process or running scripts)
 */
export async function disconnectFromMongoDB(): Promise<void> {
  if (client) {
    await client.close();
  }
}

export default clientPromise;
