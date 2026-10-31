import express from "express";
import 'dotenv/config'
import cors from "cors";
import { MongoClient } from 'mongodb';


const PORT = 5000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/",(req, res) =>{
    res.send("Hello")
})

const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {

  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}


connectToMongoDB();














app.listen(PORT,() =>{
    console.log(`server is running on port ${PORT}`);
});