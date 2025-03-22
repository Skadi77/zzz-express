// models/database.js
const mongoose = require("mongoose"); // 数据库模块

// 从环境变量中读取 MongoDB 连接字符串
const mongoURI = process.env.MONGODB_URI;

// 连接到 MongoDB
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("成功连接到 zzz 数据库！");
  })
  .catch((err) => {
    console.error("连接数据库时出错：", err);
  });

module.exports = mongoose;
