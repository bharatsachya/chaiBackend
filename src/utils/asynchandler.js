const asynchandler = (requestHandler)=>{
    (req,res,next) =>{
        Promise.resolve(
            requestHandler(req,res,next)    
        ).catch((err)=>next(err));
    }
}


// const asynchandler = (fn)=>async () =>{
//      try{
//          await fn(req,res,next);
//      }
//      catch(error){
//         res.status(error.code || 500).json({
//             sucess:false,
//             message:error.message || "Internal Server Error"
//         })
//      }
// }

export default asynchandler;