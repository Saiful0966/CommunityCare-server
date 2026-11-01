import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient } from "mongodb";

const PORT = 5000;

const app = express();
app.use(cors());
app.use(express.json());

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

const database = client.db("communityCareDB");
const eventsCollection = database.collection("events");

app.post("/add-events", async (req, res) => {
  const eventData = req.body;
  const result = await eventsCollection.insertOne(eventData);
  console.log(result);
  res.send(result);
});



app.get('/upcoming-events', async(req, res) =>{
  const result = await eventsCollection.find().toArray();
  res.send(result);

})














app.get("/", (req, res) => {
  res.send({ message: "server is running fine" });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
