var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors"); // 跨域
require("dotenv").config(); // 环境变量

require("./models/database");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var articleRouter = require("./routes/article");

var app = express();

// 跨域，允许来自 localhost:3000 的请求
app.use(
  cors({
    // origin: "http://localhost:3000", // 或者 '*' 允许所有源
    origin: "*", // 允许所有域
    credentials: true, // 允许携带凭证
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/article", articleRouter);

module.exports = app;
