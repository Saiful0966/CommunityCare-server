import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";


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

// Detale page 


app.get('/upcoming-events/:id', async (req, res) => {
    const { id } = req.params;
    const result = await eventsCollection.find({ _id: new ObjectId(id) }).toArray();
    res.send(result[0]);
})

app.patch('/upcoming-events/join/:id', async (req, res) => {
  const id = req.params.id;
  const volunteer = req.body;
  
  try {
    const query = { _id: new ObjectId(id) };
    const event = await eventsCollection.findOne(query);
    
  
    const alreadyJoined = event?.volunteers?.some(v => v.email === volunteer.email);
    if (alreadyJoined) {
      return res.status(400).json({ message: "You have already joined this event!" });
    }

    const updateDoc = {
      $push: { volunteers: volunteer },
    };

    const result = await eventsCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});







app.get("/", (req, res) => {
  res.send({ message: "server is running fine" });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
