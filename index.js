import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import {createRemoteJWKSet, jwtVerify} from "jose";


const PORT = 5000;

const app = express();
// app.use(cors());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
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


// middleware

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).send({
      message: "Unauthorized access",
    });
  }

  const token = authHeader.split(" ")[1]; 
  console.log("JWT Token:", token);

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
   const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))
 
   try {
    const {payload} = await jwtVerify (token, JWKS)
    req.user = payload;
    next();
   } catch (error) {
   return res.status(401).send({msg:"Invalid token"});
    
   }

};



app.post("/add-events", verifyToken, async (req, res) => {
  const eventData = req.body;
  const result = await eventsCollection.insertOne(eventData);
  console.log(result);
  res.send(result);
});



// Upcoming Events page api 
 
// app.get('/upcoming-events', async(req, res) =>{
//   const result = await eventsCollection.find().toArray();
//   res.send(result);

// })

app.get("/upcoming-events", async (req, res) => {
  try {
    const result = await eventsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Upcoming Events Error:", error);
    res.status(500).send({
      message: "Failed to fetch upcoming events",
    });
  }
});


// recent-upcoming-events
app.get("/recent-upcoming-events", async (req, res) => {
  try {
    const result = await eventsCollection
      .find({ eventDate: { $exists: true, $ne: null } })
      .sort({ eventDate: 1 }) 
      .limit(6)
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch events" });
  }
});



// Detale page api
app.get('/upcoming-events/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const result = await eventsCollection.find({ _id: new ObjectId(id) }).toArray();
    res.send(result[0]);
    
})


app.patch('/upcoming-events/join/:id', verifyToken,  async (req, res) => {
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


// ManageEvents api
app.get('/manage-events/:email', verifyToken, async (req, res) => {
  const { email } = req.params;

  
// Ekhane organizerEmail ba email jekono ekta match korlei data dibe
  const result = await eventsCollection.find({ 
    $or: [
      { organizerEmail: email },
      { email: email }
    ] 
  }).toArray();
  
  res.send(result);
});

// Edit ManageEvents api
app.patch('/manage-events/:id', verifyToken, async (req, res) =>{
  const {id}= req.params
  const updatedData = req.body
  const result = await eventsCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set:updatedData}
  )
  res.send(result);
})


// Delete ManageEvents api
app.delete('/manage-events/:id', verifyToken, async(req, res) =>{
 const {id}= req.params 
 const result = await eventsCollection.deleteOne({_id: new ObjectId(id)})
 res.json(result)
})


// joined-events page api
// joined-events page api
app.get("/joined-events/:email", verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    const joinedEvents = await eventsCollection
      .find({
        "volunteers.email": email,
      })
      .toArray();

    res.send(joinedEvents);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Failed to fetch joined events",
    });
  }
});



// Gallery  api 
// app.get("/gallery-events", async (req, res) => {
//   try {
//     const result = await eventsCollection
//       .find()
//       .sort({ _id: -1 })
//       .limit(6)
//       .toArray();

//     res.send(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       message: "Failed to fetch gallery events",
//     });
//   }
// });
app.get("/gallery-events", async (req, res) => {
  try {
    const result = await eventsCollection
      .find()
      .sort({ _id: -1 })
      .limit(6)
      .toArray();

    res.send(result);
  } catch (error) {
    console.error("Gallery Error:", error);

    res.status(500).send({
      message: "Failed to fetch gallery events",
      error: error.message,
    });
  }
});





app.get("/", (req, res) => {
  res.send({ message: "server is running fine" });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});


 export default app;