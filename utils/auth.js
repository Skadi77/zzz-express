const jwt = require("jsonwebtoken");

// 中间件：验证 Token
const authenticateToken = (req, res, next) => {
  try {
    // 获取 Authorization 头部信息
    const authHeader = req.headers["authorization"];

    // 检查 Authorization 是否存在且以 Bearer 开头
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "未提供有效 token" });
    }

    // 提取 Token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "无效的 token 格式" });
    }

    // 验证 Token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "无效的 token" });
      }

      // 将解码后的 _id 存入 req.user
      req.zzzToken = {
        userId: decoded.userId,
      };

      // 继续执行下一个中间件或路由处理
      next();
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "服务器错误", error: error.message });
  }
};

module.exports = authenticateToken;
