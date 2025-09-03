import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel,ContentModel, LinkModel} from "./db"     
import { JWT_PASSWORD } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";
import cors from "cors"


const app = express();
app.use(express.json());
app.use(cors());
app.get('/' ,(req, res) =>{
  res.send("Brainly works fine!")
})



app.post("/api/v1/signup", async (req, res) => {
    // add zod validation , hash the password
 const username = req.body.username;
 const password = req. body.password;

 try{
   await UserModel.create({
    username: username,
    password: password
 })

 res.json({
    message: "user signed up"
 })

 } catch(e){
    res.status(411).json({
      message: "User already exists!"
    })
 }

});


app.post('/api/v1/signin', async(req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const existingUser = await UserModel.findOne({
    username,
    password
  })
  if(existingUser){
    const token = jwt.sign({
        id: existingUser._id
    }, JWT_PASSWORD)
    res.json({
        token
    })
  } else{
    res.status(403).json({
        message: "Incorrect credentials"
    })
  }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const link = req.body.link;
  const type = req.body.type;
  const title = req.body.title;
await  ContentModel.create({
    link,
    type,
    title,
    // @ts-ignore
    userId: req.userId,
    tags: []
    
  })
  return res.json({
    message: "Content added!"
  })
  
});

app.get("/api/v1/content", userMiddleware, async (req, res) =>{
   //@ts-ignore
  const userId = req.userId;
  const content = await ContentModel.find({
   userId:userId
  }).populate("userId", "username");
  res.json({
    content
  })
});

app.delete('/api/v1/content', userMiddleware, async (req, res)=>{
  const {contentId} = req.body.contentId;

  await ContentModel.deleteMany({
    contentId,
    // @ts-ignore
    userId: req.userId  
  });
  res.json({
    messgage: "content deleted!"
  })
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const share = req.body.share;
  if(share){
    const existingLink = await LinkModel.findOne({
      //@ts-ignore
      userId: req.useId
    });

    if(existingLink){
      res.json({
        hash: existingLink.hash
      })
      return;
    }
    const hash = random(10)
   await LinkModel.create({
      //@ts-ignore
      userId: req.userId,
      hash: hash
    })

    res.json({
      message: "/share/" +  hash
    })
  } else{
  await  LinkModel.deleteOne({
      //@ts-ignore
      userId : req.userId
    });

    res.json({
      message: "Remove Link!"
    })
  }



} );

app.get("/api/v1/brain/:shareLink", async (req, res) =>{
  const hash = req.params.shareLink;

const Link =  await LinkModel.findOne({
   hash
  });

  if(!Link) {
    res.status(411).json({
      message: "Sorry incorrect input"
    });
    return;
  }

  //useId
  const content = await ContentModel.find({
    userId: Link.userId
  });
  const user = await UserModel.findOne({
    _id: Link.userId
  });

  if(!user){
    res.status(411).json({
      Message: "user not found, error should ideally not happen"

    })
    return;
  }

  res.json({
    username: user.username,
    content: content


  })
})

app.listen(3000, () => {
    console.log("server is running on port 3000");
});