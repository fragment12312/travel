import express from 'express';
import travelRouter from './route/travel.js';
import 'dotenv/config';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3300;

//允许跨域请求
app.use(cors());

//解析JSON请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//创建心跳接口
app.post('/api/heartbeat', (req, res) => {
  console.log(req.query);
  console.log(req.body);
  res.json({
    message: 'Server is alive',
    timestamp: new Date().toISOString(),
  })
}),

//创建一个中间件
app.use('/api/travel', travelRouter);

app.use((err,req,res,next) => {
  res.status(500).json({
    success:false,
    message:`服务端内部错误：${err.message}`
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  
});