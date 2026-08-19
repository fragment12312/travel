import express from "express";
import travelService from "../services/travelService.js";
import { createStreamResponse } from "../utils/streamUtils.js";

const router = express.Router();

router.post('/recommend',async (req,res) => {
    const { city, days ,budget} = req.body;
    if(!city || !days || !budget) {
        return res.status(400).json({
            success:false,
            message:'缺少必要参数：city、days、budget'
        })
    }
    const result = await travelService.recommend(city, days, budget);
    return res.json(result)
    // return res.json({
    //     message:'推荐地点',
    //     timestamp: new Date().toISOString()
    // })
})


router.post('/chat',async (req,res) => {
    const { message } = req.body;
    if(!message) {
        return res.status(400).json({
            success:false,
            message:'缺少必要参数：message'
        })
    }
    //SSE返回
    const stream = createStreamResponse(res);

    const result = await travelService.chat(message,(chunk)=>{
        stream.send({type:'chunk',data: chunk});
    });

    stream.send({type:'complete',data: result});
    stream.end();
})

export default router;