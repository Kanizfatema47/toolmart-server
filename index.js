const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express()

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e4yaz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




app.get('/', (req, res) => {
  res.send("Hello from server")
})

async function run() {

  try {
    await client.connect();
    const toolsCollection = client.db('db-tools').collection('tools');
    const orderCollection = client.db('db-tools').collection('order');
    const reviewCollection = client.db('db-tools').collection('review');
    const userCollection = client.db('db-tools').collection('users');
    console.log('db is connected');

    //tools

    app.get('/tools', async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query)
      const tools = await cursor.toArray()
      res.send(tools)
    })

    //toolsDetails

    app.get('/toolDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const toolDetails = await toolsCollection.findOne(query);
      res.send(toolDetails)
    })

    //update Increase Quantity

    app.put('/increase/:id', async (req, res) => {
      const id = req.params.id;
      const increasedQuantity = req.body;
      const newQuantity = increasedQuantity.updatedQuantity;
      const filter = {
        _id: ObjectId(id)
      }
      const options = { upsert: true }
      const updatedDoc = {
        $set: {
          min_order_quantity: newQuantity
        }
      }
      const result = await toolsCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })


    // Decrease quantity


    app.put('/decrease/:id', async (req, res) => {
      const id = req.params.id;
      const decreasedQuantity = req.body;
      const newQuantity = decreasedQuantity.updatedQuantity;
      const filter = {
        _id: ObjectId(id)
      }
      const options = { upsert: true }
      const updatedDoc = {
        $set: {
          min_order_quantity: newQuantity
        }
      }
      const result = await toolsCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })
    

    //order

    app.post("/order", async (req, res) => {
      const newService = req.body;
      const result = await orderCollection.insertOne(newService);
      res.send(result);
    });

    //Dashboard review
    app.post("/review", async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    // getting individual orders
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // Deleting the order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = orderCollection.deleteOne(query);
      res.send(result);
    });


    // storing all user to the server
      app.put("/users/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const userInfo = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            name: userInfo.name,
            email: user.email || userInfo.email,
            location: userInfo.location,
            phone: userInfo.phone,
            linkedin: userInfo.linkedin,
          },
        };
        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        const token = jwt.sign(
          { email: email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "2h",
          }
        );
        res.send({ result, token });
      });


  }
  finally {

  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Port ${port}`)
})