const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const path = require('path');

const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { getFileStream, uploadFile } = require("./util/s3")
const User = require('./models/user.model')

const dbURI = process.env.MONGOURI;
app.use(express.json());
app.use(cors());

app.disable('etag');

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection

db.on("error", (err) => { console.error(err) })
db.once("open", () => { console.log("DB started successfully") })


const userId = { _id: "636f62494fc3a4078cc054c6" }

app.post('/update', upload.single('image'), async (req, res) => {
  const file = req.file
  const result = await uploadFile(file)
  await unlinkFile(file.path)
  console.log(result.key)

  const newUser = {
    name: req.body.name,
    desc: req.body.desc,
    imageKey: result.key,
  };
  await User.findOneAndUpdate(
    userId,
    newUser,
    { runValidators: true, context: 'query' }
  );
  let updatedUser = await User.findOne(userId);
  res.json(updatedUser);
})

app.get('/user', async (req, res) => {
  const user = await User.find(userId).populate();
  // console.log(user);
  res.send(user)
})


app.get('/allUser', async (req, res) => {
  const user = await User.find().populate();
  console.log(user);
  res.send(user)
})


//get s3 image by image Key
app.get('/images/:key', (req, res) => {
  console.log(req.params)
  const key = req.params.key
  const readStream = getFileStream(key)
  readStream.pipe(res)
})


app.get('/testinsert', async (req, res) => {

  const users = [
    {
      "_id": "636f62494fc3a4078cc054c6",
      "name": "test 123 test",
      "desc": "fffffg test",
      "imageKey": "DSC_8903.jpg",

    },
    {
      "name": "test 2",
      "desc": "fffffg test 2",
      "createdAt": "2022-11-08T09:53:37.376+00:00",
      "imageKey": "c4f5f9a6d78370b4d600b4cca03ef23e",
    },
    {
      "name": "test 3",
      "desc": "fffffg test 2",
      "createdAt": "2022-11-08T09:53:37.376+00:00",
      "imageKey": "3.PNG",
    },
    {
      "name": "test 4",
      "desc": "fffffg test 4",
      "imageKey": "DSC_8903.jpg",

    },
  ]

  User.insertMany(users).then(result => {
    console.log(result)
  })

})


//Serve static assets in production
if (process.env.NODEENV === 'PRODUCTION') {
  //Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}


app.listen(3000, () => { console.log("Server started: 3000") })