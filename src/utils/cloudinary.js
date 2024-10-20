import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async(localPathfile) => {
    try{
       if(!localPathfile){
           return null
       }

       const response = await cloudinary.uploader.upload(localPathfile,{
              resource_type:"auto",
       })

    // console.log(response.url);

    fs.unlinkSync(localPathfile)
    return response;
    }catch(error){
        fs.unlinkSync(localPathfile)
        console.log(error);
    }
}

export {uploadOnCloudinary};


// (async function(localPathfile) {

    //     // Configuration
    //     cloudinary.config({ 
    //         cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Click 'View API Keys' above to copy your cloud name
    //         api_key: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API key
    //         api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
    //     });
        
    //     // Upload an image
    //      const uploadResult = await cloudinary.uploader
    //        .upload(
    //            localPathfile, {
    //                resource_type: "auto",
    //                public_id: 'shoes',
    //            }
    //        )
    //        .catch((error) => {
    //            fs.unlinkSync(localPathfile);
    
    //            console.log(error);
    //        });
    //     console.log(uploadResult);
        
    //     // Optimize delivery by resizing and applying auto-format and auto-quality
    //     // const optimizeUrl = cloudinary.url('shoes', {
    //     //     fetch_format: 'auto',
    //     //     quality: 'auto'
    //     // });
        
    //     // console.log(optimizeUrl);
        
    //     // Transform the image: auto-crop to square aspect_ratio
    //     // const autoCropUrl = cloudinary.url('shoes', {
    //     //     crop: 'auto',
    //     //     gravity: 'auto',
    //     //     width: 500,
    //     //     height: 500,
    //     // });
        
    //     // console.log(autoCropUrl);
        
        
    // })();