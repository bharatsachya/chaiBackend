import mongoose,{Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = new Schema({
      isPublished:{
            type:Boolean,
            default:true
      },
      title:{
                type:String,
                required:true
        },
        description:{
                type:String,
                required:true
        },
        duration:{
                type:Number,
                required:true
        },
        views:{
                type:Number,
                default:0
        },
        videoFile:{
            type:String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
             ref:"User"
        }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model('Video',videoSchema);