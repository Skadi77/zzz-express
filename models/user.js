// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// 定义用户的 Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // 邮箱唯一
  },
  name: {
    type: String,
    default: "市民", // 默认名字为“游客”
  },
  password: {
    type: String,
    required: true, // 密码必填
  },
  usersign: {
    type: String,
    default: "", // 默认签名
  },
  registrationIp: {
    type: String,
    required: true, // 注册时的 IP 地址
  },
  registrationTime: {
    type: Date,
    default: Date.now, // 注册时间，默认当前时间
  },
  avatar: {
    type: String,
    default: "", // 头像链接，默认为空
  },
  role: {
    type: String,
    enum: ["user", "admin"], // 角色类型：用户或管理员
    default: "user", // 默认角色为 'user'
  },
  isDeleted: {
    type: Boolean,
    default: false, // 是否删除，默认未删除
  },
});

// 实例方法：验证密码
userSchema.methods.verifyPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

// 静态方法：注册用户
userSchema.statics.registerUser = async function (
  email,
  password,
  registrationIp
) {
  try {
    // 检查用户是否已存在
    const existingUser = await this.findOne({ email });
    if (existingUser) {
      throw new Error("用户已存在");
    }

    // 对密码进行哈希处理
    const salt = await bcrypt.genSalt(10); // 默认10
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建新用户
    const newUser = new this({
      email: email,
      password: hashedPassword,
      registrationIp,
    });

    // 保存到数据库
    await newUser.save();
    console.log("用户注册成功！");
    return true;
  } catch (error) {
    console.error("注册用户时出错：", error.message);
    throw error;
  }
};

// 静态方法：用户登录
userSchema.statics.verifyLogin = async function (email, inputPassword) {
  try {
    // 查询用户信息
    const user = await this.findOne({ email }).select("+password"); // 包含密码字段

    if (!user) {
      return null; // 用户不存在
    }

    // 验证输入的密码是否与存储的哈希密码匹配
    const isPasswordMatch = await user.verifyPassword(inputPassword);

    if (isPasswordMatch) {
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        usersign: user.usersign, // 签名
        avatar: user.avatar, // 头像
        registrationTime: user.registrationTime, // 注册时间
      }; // 返回用户信息
    }

    return null; // 密码不匹配
  } catch (error) {
    console.error("登录验证时出错：", error.message);
    throw error;
  }
};

// 创建模型并导出
const User = mongoose.model("User", userSchema);

module.exports = User;
