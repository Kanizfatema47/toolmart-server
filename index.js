const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { system } = require('nodemon/lib/config');


require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

const app = express()

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e4yaz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




app.get('/', (req, res) => {
  res.send("Hello from server")
})



function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];


  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }

    req.decoded = decoded;

    next();
  });
}



async function run() {

  try {
    await client.connect();
    const toolsCollection = client.db('db-tools').collection('tools');
    const orderCollection = client.db('db-tools').collection('order');
    const reviewCollection = client.db('db-tools').collection('review');
    const userCollection = client.db('db-tools').collection('users');
    const userCollectionFull = client.db('db-tools').collection('usersinfo');
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


    // getting user information

    app.get("/userInfo", async (req, res) => {
      const email = req.query.email;

      console.log(email);

      const query = { email: email };
      const cursor = userCollectionFull.find(query);
      const user = await cursor.toArray();
      return res.send(user);

      // const decodedEmail = req.decoded.email;
      // console.log(decodedEmail);

      // if (email === decodedEmail) {
      //   const query = { email: email };
      //   const cursor = userCollection.find(query);
      //   const user = await cursor.toArray();
      //   return res.send(user);
      // } else {
      //   return res.status(403).send({ message: "Forbidden Access" });
      // }
    });

    // getting all admin users

    app.get("/adminusers", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // making an user to admin
    app.put("/adminusers/admin/:email", verifyJWT, async (req, res) => {


      const email = req.params.email;

      const requester = req.decoded.email;

      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };

        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        res.send(result);
      } else {
        res.status(401).send({ message: "forbidden" });
      }
    });


    // getting all orders

    app.get('/neworder', async (req, res) => {
      const query = {};
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders)
    })

    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });


    // Deleting the order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = orderCollection.deleteOne(query);
      res.send(result);
    });


    // post a data
    app.post("/newproduct", async (req, res) => {
      const newproduct = req.body;
      const result = await toolsCollection.insertOne(newproduct);
      res.send(result);
    });


    // Deleting the product
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = toolsCollection.deleteOne(query);
      res.send(result);
    });

    // checking ig the user is a admin or not
    app.get("/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // getting order for payment
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    });

    // stripe payment
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const service = req.body;
      const price = service.newPrice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.patch("/order/:id",verifyJWT, async (req,res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = {_id:ObjectId(id)}
      const updatedDoc = {
        $set:{
          paid:true,
          transactionId : payment.transactionId
        }
      }
    //  const result = await paymentscollection.insertOne(payment);
      const updateorder = await orderCollection.updateOne(filter,updatedDoc);
   
      res.send({updateorder})
 })





  }
  finally {

  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Port ${port}`)
})