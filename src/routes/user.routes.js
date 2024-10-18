import {Router} from 'express';
import {loginUser, registerUser,logoutUser} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();

router.route("/register").post(registerUser)

router.route("/register").get((req,res)=>{
   res.send("Hello world")
})

router.route('/login').post(loginUser)

router.route('/logout').get(verifyJWT,logoutUser)

export default router;