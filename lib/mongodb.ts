import { MongoClient, Db } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const uri = process.env.MONGODB_URI;

const options = {
  maxPoolSize: 5, // small pool per function instance[reference:7]
  minPoolSize: 0, // don't keep idle connections alive
  maxIdleTimeMS: 10000, // close idle connections quickly
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Cache the client on global so warm invocations reuse it[reference:8]
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(uri, options);
  attachDatabasePool(client); // Vercel-managed pool cleanup[reference:9]
  return client.connect();
}

if (!globalWithMongo._mongoClientPromise) {
  globalWithMongo._mongoClientPromise = createClientPromise();
}

const clientPromise = globalWithMongo._mongoClientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db("stock_serious");
}
