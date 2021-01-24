const mongoose = require('mongoose')
const path = require('path')
const imageBasePath = 'uploads/images'



// Post schema
const postSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String
        
    },
    createdAt:{
        type: Date,
        required: true,
        default: Date.now
    },
    image:{
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }

})

postSchema.virtual('imagePath').get(function() {
    if (this.image != null) {
      return path.join('/', imageBasePath, this.image)
    }
    else{
        console.log('fiodor')
    }
})

module.exports = mongoose.model('Post', postSchema)
module.exports.imageBasePath = imageBasePath