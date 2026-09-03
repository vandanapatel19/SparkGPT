import express, { application } from 'express';
import 'dotenv/config';
import cors from 'cors'
import connectDB from './configs/db.js';
import userRouter from './routes/userRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import imagekit from './configs/imagekit.js';
import creditRouter from './routes/creditRoutes.js';
import { stripeWebHooks } from './controllers/webhooks.js';

const app = express();

//Middleware
app.use(cors())

await connectDB();

//stripe webhooks
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebHooks)
app.use(express.json())

//Routes
app.get('/', (req, res) => { res.send("Server is Live!") })
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on the port ${PORT}`)
})