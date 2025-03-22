var express = require("express");
var router = express.Router();
const User = require("../models/user"); // 引入 User 模型
const z = require("zod");
const jwt = require("jsonwebtoken");
// const authenticateToken = require("../utils/auth"); 身份验证

// 定义表单验证规则
const formSchema = z.object({
  email: z
    .string() // 确保是字符串类型
    .min(1, "邮箱不能为空") // 邮箱不能为空
    .max(50, "邮箱长度不能超过50个字符") // 邮箱长度限制为最多50个字符
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // 邮箱格式正则表达式
      "请输入有效的邮箱地址"
    ),
  password: z
    .string() // 确保是字符串类型
    .min(6, "密码长度不能少于6个字符") // 密码长度最少为6个字符
    .max(12, "密码长度不能超过12个字符") // 密码长度最多为12个字符
    .regex(
      /^[a-zA-Z0-9]+$/, // 只允许数字和大小写字母
      "密码只能包含数字和大小写字母"
    ),
});

// 注册路由
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 使用 Zod 验证规则进行校验
    formSchema.parse({ email, password });

    // 获取用户的真实 IP 地址
    let registrationIp;
    if (req.headers["x-forwarded-for"]) {
      registrationIp = req.headers["x-forwarded-for"].split(",")[0].trim();
    } else {
      registrationIp = req.socket.remoteAddress;
    }

    // 调用静态方法 registerUser
    const isRegistered = await User.registerUser(
      email,
      password,
      registrationIp
    );

    // 返回统一的成功响应
    return res.status(201).json({
      success: true,
      message: "注册成功！",
    });
  } catch (error) {
    // 如果 Zod 验证失败，返回详细的错误信息
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "表单验证失败",
        error: error.issues.map((issue) => issue.message).join(", "),
      });
    }

    // 其他错误（如数据库错误）
    console.log(error.message);
    return res.status(400).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    });
  }
});

// 用户登录
router.post("/login", async (req, res) => {
  try {
    // 解析请求体中的数据
    const { email, password } = req.body;

    // 使用 Zod 验证规则进行校验
    formSchema.parse({ email, password });

    // 调用静态方法 verifyLogin
    const user = await User.verifyLogin(email, password);

    if (!user) {
      // 如果用户不存在或密码不匹配
      return res.status(401).json({
        success: false,
        message: "邮箱或密码错误",
      });
    }

    // 使用环境变量中的密钥来生成和验证 JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // 添加 role 字段
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // 设置过期时间为 30 天
    );

    // 返回统一的成功响应
    return res.status(200).json({
      success: true,
      message: "登录成功！",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          usersign: user.usersign, // 签名
          avatar: user.avatar, // 头像
          registrationTime: user.registrationTime, // 注册时间
        },
        token: token, // 返回生成的 JWT 令牌
      },
    });
  } catch (error) {
    // 如果 Zod 验证失败，返回详细的错误信息
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "表单验证失败",
        error: error.issues.map((issue) => issue.message).join(", "),
      });
    }

    // 捕获其他异常（如数据库错误）
    console.error("登录时出错：", error.message);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    });
  }
});

module.exports = router;
