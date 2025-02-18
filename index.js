const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const port = process.env.PORT || 3000;
app.use(express.json());
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
  await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const texcollection= client.db('JobPortal').collection('tex-calculate');
//jwt 
app.post('/jwt',async(req,res)=>{
  const useremail=req.body
  console.log(useremail)
  const token=jwt.sign(useremail, process.env.ACESS_TOKEN_SECRET, { expiresIn: '365d' });
  res.send({ token });
})

app.post('/calculate',async(req,res)=>{
  const { annualincome, investment, deduction, otherincome}=req.body
  console.log(annualincome, investment, deduction, otherincome)
const taxableIncome=annualincome-investment-deduction+otherincome
const date=new Date().toLocaleDateString()

let taxPayable = 0;
if (taxableIncome <= 250000) {
  taxPayable = 0;
} else if (taxableIncome <= 500000) {
  taxPayable = (taxableIncome - 250000) * 0.05;
} else if (taxableIncome <= 1000000) {
  taxPayable = 12500 + (taxableIncome - 500000) * 0.2;
} else {
  taxPayable = 112500 + (taxableIncome - 1000000) * 0.3;
}

const suggestions = [];
if (investment < 150000) {
  suggestions.push("Consider investing more in 80C to save tax.");
}
if (investment < 100000) {
  suggestions.push("Explore other tax-saving instruments like ELSS or PPF.");
}
if (investment < 50000) {
  suggestions.push("You may also consider NPS for additional tax benefits.");
}
 const formdata= {date, annualincome, investment, deduction, otherincome,taxableIncome, taxPayable,suggestions }

 const result=await texcollection.insertOne(formdata)
 res.json({ taxableIncome, taxPayable, suggestions });

})

app.get("/tax-records", async (req, res) => {

    const records = await texcollection.find().sort({ _id: -1 }).toArray()
    res.json(records);

});







    //  Server test route
    app.get('/', async (req, res) => {
      res.send('Server running');
    });

  } finally {
   //  await client.close(); //
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
