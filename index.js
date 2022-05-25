const express = require('express')
const cors = require('cors')
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
    const ordercollection = client.db('db-tools').collection('order');
    const reviewcollection = client.db('db-tools').collection('review');
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
      const result = await ordercollection.insertOne(newService);
      res.send(result);
    });

    //Dashboard review
    app.post("/review", async (req, res) => {
      const newReview = req.body;
      const result = await reviewcollection.insertOne(newReview);
      res.send(result);
    });


  }
  finally {

  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Port ${port}`)
})