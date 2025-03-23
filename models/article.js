// models/article.js
const mongoose = require("mongoose");

// 定义文章的 Schema
const articleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // 关联用户字段，使用 _id
      ref: "User", // 引用 User 模型
      required: true,
      index: true, // 添加索引
    },
    avatar: {
      type: String,
      default: "", // 用户头像链接，默认为空
    },
    name: {
      type: String,
      required: true, // 用户名字必填
    },
    title: {
      type: String,
      required: true, // 文章标题必填
    },
    description: {
      type: String,
      default: "", // 文章简介，默认为空
    },
    coverUrl: {
      type: String,
      default: "", // 文章封面 URL，默认为空
    },
    isDeleted: {
      type: Boolean,
      default: false, // 是否被删除，默认未删除
    },
    resources: [
      {
        type: {
          type: String,
          enum: ["image", "video", "audio"], // 资源类型：图片、视频或音频
        },
        url: String, // 资源 URL
        subtitleUrl: {
          type: String,
          default: "", // 视频或音频的字幕 URL，默认为空
        },
      },
    ],
    views: {
      type: Number,
      default: 0, // 观看次数，默认为 0
    },
    favorites: {
      type: Number,
      default: 0, // 收藏数量，默认为 0
    },
  },
  { timestamps: true } // 自动添加 createdAt 和 updatedAt 字段
);

// 静态方法：添加新文章
articleSchema.statics.addNewArticle = async function (
  userId,
  avatar,
  name,
  title,
  description,
  coverUrl,
  resources
) {
  try {
    const newArticle = new this({
      userId, // 关联用户 ID
      avatar, // 用户头像
      name, // 用户名字
      title, // 文章标题
      description, // 文章简介
      coverUrl, // 文章封面 URL
      resources, // 资源数据
    });

    await newArticle.save();
    console.log("新文章添加成功！");
    return newArticle; // 返回新创建的文章对象
  } catch (error) {
    console.error("添加新文章时出错：", error.message);
    throw error;
  }
};

// 静态方法：增加观看次数
articleSchema.statics.incrementViewsById = async function (articleId) {
  try {
    // 使用 $inc 原子操作直接更新 views 字段
    await this.findByIdAndUpdate(
      articleId,
      { $inc: { views: 1 } }, // 将 views 字段的值增加 1。
      { new: true } // 返回更新后的文档
    );
    console.log("观看次数已更新！");
  } catch (error) {
    console.error("更新观看次数时出错：", error.message);
    throw error;
  }
};
// 静态方法：增加收藏数量
articleSchema.statics.incrementFavoritesById = async function (articleId) {
  try {
    // 使用 $inc 原子操作直接更新 favorites 字段
    await this.findByIdAndUpdate(
      articleId,
      { $inc: { favorites: 1 } }, // 对 favorites 字段进行 +1 操作
      { new: true } // 返回更新后的文档
    );
    console.log("收藏数量已更新！");
  } catch (error) {
    console.error("更新收藏数量时出错：", error.message);
    throw error;
  }
};

// 静态方法：单独更新 updatedAt 字段
articleSchema.statics.updateUpdatedAtById = async function (articleId) {
  try {
    // 使用 $set 操作符仅更新 updatedAt 字段
    const result = await this.updateOne(
      { _id: articleId }, // 查询条件
      { $set: { updatedAt: new Date() } } // 仅更新 updatedAt 字段
    );

    if (result.modifiedCount > 0) {
      console.log("updatedAt 字段已成功更新！");
      return true; // 返回更新成功的标志
    } else {
      console.log("未找到对应的文章或无需更新。");
      return false; // 返回更新失败的标志
    }
  } catch (error) {
    console.error("更新 updatedAt 时出错：", error.message);
    throw error;
  }
};

// 静态方法：分页查询文章（比如返回最新前20篇）
articleSchema.statics.getArticlesByPage = async function (page) {
  try {
    const limit = 2; // 每页返回 20 条数据
    const skip = (page - 1) * limit; // 计算跳过的文档数

    // 查询文章，按 updatedAt 字段降序排序
    const articles = await this.find({ isDeleted: false }) // 只查询未删除的文章
      .select(
        "userId avatar name title description coverUrl resources views favorites"
      ) // 选择需要的字段
      .sort({ updatedAt: -1 }) // 按照 updatedAt 字段降序排序
      .skip(skip) // 跳过前面的文档
      .limit(limit); // 限制返回的数量

    return articles;
  } catch (error) {
    console.error("分页查询文章时出错：", error.message);
    throw error;
  }
};

// 新增静态方法：获取未删除文章的总数
articleSchema.statics.getTotalArticlesCount = async function () {
  try {
    const total = await this.countDocuments({ isDeleted: false }); // 获取未删除文章的总数
    return total;
  } catch (error) {
    console.error("获取文章总数时出错：", error.message);
    throw error;
  }
};

// 创建模型并导出
const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
