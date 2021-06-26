const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectID;

const app = express()
require('dotenv').config()
const port = 5000

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gqnhb.mongodb.net/${process.env.DB_NAME}retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const blogs = client.db(process.env.DB_NAME).collection("blogs");
  const admin = client.db(process.env.DB_NAME).collection("admin");

  app.get('/blogs', (req, res) => {
    blogs.find({})
    .toArray((err,document)=>{
      res.send(document)
    })
  })

  app.get('/blog/:id', (req, res)=>{
    const id = req.params.id;
    blogs.findOne({_id: new ObjectID(id)})
  })

  app.post('/loginAdmin', (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;

    console.log("Hello ",email, password)

    admin.findOne({$or: [{email: email}, {password: password}]})
    .then(user=>{
      if(user){
        res.send(user.email===email && user.password===password)
      }
    })

  })

  app.post('/addBlog', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;

    const newImg = file.data;
    const encImg = newImg.toString('base64');

    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    }

    blogs.insertOne({ title, description, img: image })
      .then(response => {
        res.send(response.insertedCount > 0)
      })
      .catch(error => {
        res.send(false)
      })
  })

  app.delete('/deleteBlog/:id', (req, res)=> {
    const id = req.params.id;
    blogs.deleteOne({_id: new ObjectID(id)})
    .then(response=>{
      res.send(response.deletedCount>0)
    })
    .catch(err=>res.send(err))
  })

});

app.get('/', (req, res) => {
  res.send("Hello World I am Blog App")
})

app.listen(port)