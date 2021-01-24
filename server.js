require('dotenv').config()

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const path = require('path')
const fs = require('fs')
const Post = require('./models/post')
const uploadPath = path.join('public', Post.imageBasePath)
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
const multer = require('multer')

const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})



const router = express.Router()
app.set('view-engine', 'ejs')
app.set('views', __dirname+ '/views');
app.use(bodyParser.urlencoded({limit: '10mb', extended: false}))
//app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))


// database
const mongoose = require('mongoose')
const User = require('./models/user')
const Friend = require('./models/friend')
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser:true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log("Connected to mongoose"))


app.get('/', async (req, res) => {
    res.render('signin.ejs')
})

app.get('/signin', async (req, res) => {
    res.render('signin.ejs', {user: new User() })
})
app.post('/signin', async (req, res) => {
    const user = await User.findOne({email: req.body.email})
    
    if(await bcrypt.compare(req.body.password, user.password)){
        console.log('logged in')
        
        res.redirect(`/${user.id}`)
    }

})

app.get('/signup', async (req, res) => {
    res.render('signup.ejs', {user: new User() })
})

app.post('/signup', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = new User({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: hashedPassword
        
    })

    try{
        const newUser = await user.save()
        
        res.redirect('/signin')
    }catch(err){
        console.error(err)
        res.redirect('/signup')
    }

    //for debug
    const users = await User.find({})
    console.log(users)
})

app.get('/:id', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)
        const friends = await Friend.find({user: user.id})
        
        var friends_id = []
        friends.forEach(friend => {
            friends_id.push(friend.friend)
        })
        friends_id.push(user.id)

        const allMyPosts = await Post.find({user : {$in: friends_id} })

        res.render('index.ejs', {user: user, posts: allMyPosts})

        console.log(user.first_name)
    }catch(e){
        console.log(e)
    }
    
    
})

app.get('/:id/posts/new', async (req, res) => {
    const user = await User.findById(req.params.id)
    renderNewPage(res, new Post(), user)
})

app.post('/:id/posts/new', upload.single('image'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null
    const user = await User.findById(req.params.id)
    const post = new Post({
        title: req.body.title,
        user: user.id,
        image: fileName,
        description: req.body.description
    })

    try{
        const newPost = await post.save()
        res.redirect(`/${user.id}/myposts`)
    }catch(e){
        console.log(e)
    }

    
})

app.get('/:id/myposts', async(req, res) => {
    const user = await User.findById(req.params.id)
    const posts = await Post.find({user: user.id})

    res.render('myposts.ejs', {
        user: user,
        posts: posts
    })

})

app.get('/:id/friends/new', async (req, res) => {

    try{
        const user = await User.findById(req.params.id)
        const users = await User.find({_id: { $ne: req.params.id }})
        const friends = await Friend.find({id: user.id})
        
        const params = {
            myuser: user,
            allusers: users
        }
    
        res.render('showusers.ejs', params)
    }catch(e){
        console.log("/////////////"+e+"//////////////////")
    }
      
})

app.get('/:id/friends/new/:friend_id', async (req, res) => {

    try{
        const user = await User.findById(req.params.id)
        const friend = await User.findById(req.params.friend_id)
        
        const myfriend = new Friend({
            user: user.id,
            friend: friend.id
        })
    
        
        const newFriend = await myfriend.save()
        console.log(newFriend)
    
        res.redirect(`/${user.id}/friends/new`)

    }catch(e){
        console.log("/////////////"+e+"//////////////////")
    }
      
})

app.get('/:id/myfriends', async (req, res) => {

    try{
        const user = await User.findById(req.params.id)
        const friends = await Friend.find({user: user.id})
        
        var friends_id = []
        friends.forEach(friend => {
            friends_id.push(friend.friend)
        })

        const myfriends = await User.find({_id : {$in: friends_id} })
        const params = {
            user: user,
            friends: myfriends
        }
    
        console.log(friends_id)
        res.render('showfriends.ejs', params)
    }catch(e){
        console.log("/////////////"+e+"//////////////////")
    }
      
})


async function renderNewPage(res, post, user) {
    try{
        const params = {
            user: user,
            post: post
        }
        res.render('newpost.ejs', params)
    }catch{
        
    } 
}


function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath, fileName), err => {
        if(err) console.error(err)
    })
}

module.exports = router

app.listen(4000)