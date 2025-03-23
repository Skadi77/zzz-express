// routes/article.js
var express = require("express");
var router = express.Router();
const Article = require("../models/article"); // 引入 Article 模型
const User = require("../models/user"); // 引入 User 模型
const authenticateToken = require("../utils/auth"); //身份验证
const { setKey, getKey } = require("../utils/redis"); // 缓存

// 添加新文章的路由
router.post("/add-article", authenticateToken, async (req, res) => {
  try {
    console.log("打印用户_id", req.zzzToken.userId);

    // 根据 userId 获取用户的头像和名字
    const userProfile = await User.getUserProfile(req.zzzToken.userId);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "用户信息未找到。",
      });
    }

    // 构造文章数据
    const data = {
      userId: req.zzzToken.userId, // 当前登录用户的 ID
      avatar: userProfile.avatar, // 用户头像
      name: userProfile.name, // 用户名字
      title: req.body.title || "默认标题", // 文章标题（从前端传入）
      description: req.body.description || "默认简介", // 文章简介（从前端传入）
      coverUrl: req.body.coverUrl || "", // 文章封面 URL（从前端传入）
      resources: req.body.resources || [], // 文章资源（从前端传入）
    };

    // 调用静态方法 addNewArticle 添加新文章
    const newArticle = await Article.addNewArticle(
      data.userId,
      data.avatar,
      data.name,
      data.title,
      data.description,
      data.coverUrl,
      data.resources
    );

    // 返回统一的成功响应
    return res.status(201).json({
      success: true,
      message: "新文章添加成功！",
      data: newArticle,
    });
  } catch (error) {
    // 捕获异常并返回错误信息
    console.error("添加文章时出错：", error.message);
    return res.status(400).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    });
  }
});

// 更新指定文章的 updatedAt 字段的路由（用户评论后就调用）
router.post("/update-updated-at/:articleId", async (req, res) => {
  try {
    const { articleId } = req.params;

    // 调用静态方法更新 updatedAt 字段
    const isUpdated = await Article.updateUpdatedAtById(articleId);

    if (isUpdated) {
      return res.status(200).json({
        success: true,
        message: "updatedAt 字段已成功更新！",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "未找到对应的文章。",
      });
    }
  } catch (error) {
    console.error("更新 updatedAt 时出错：", error.message);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    });
  }
});

// 分页查询文章的路由
router.get("/get-articles/:page", async (req, res) => {
  try {
    const { page } = req.params;

    // 校验页数参数是否为正整数
    if (!/^\d+$/.test(page) || parseInt(page) < 1) {
      return res.status(400).json({
        success: false,
        message: "页数参数无效，必须是大于等于 1 的正整数。",
      });
    }

    const currentPage = parseInt(page);
    const limit = 2; // 每页返回的文章数量

    // 定义缓存的最大页数 key
    const maxPageCacheKey = "articles:max-page";

    // 尝试从 Redis 中读取最大页数
    let maxPage = await getKey(maxPageCacheKey);

    // 如果缓存中没有最大页数，则从数据库计算总页数
    if (maxPage === null) {
      const totalArticles = await Article.getTotalArticlesCount(); // 获取未删除文章的总数
      maxPage = Math.ceil(totalArticles / limit); // 计算总页数
      await setKey(maxPageCacheKey, maxPage, 300); // 更新最大页数缓存
    } else {
      maxPage = parseInt(maxPage); // 确保 maxPage 是数字类型
    }

    // 如果请求的页数大于最大页数，直接返回空数组
    if (currentPage > maxPage) {
      return res.status(200).json({
        success: true,
        message: "当前页无数据（来自缓存）！",
        data: [],
      });
    }

    // 定义缓存的 key，格式为 articles:page:<页数>
    const cacheKey = `articles:page:${currentPage}`;

    // 尝试从 Redis 中读取缓存数据
    let cachedArticles = await getKey(cacheKey);

    if (cachedArticles !== null) {
      // 如果缓存中存在数据，直接返回缓存结果
      return res.status(200).json({
        success: true,
        message: "文章查询成功（来自缓存）！",
        data: cachedArticles,
      });
    }

    // 如果缓存中没有数据，则从数据库中查询
    const articles = await Article.getArticlesByPage(currentPage);

    // 将查询到的数据存入 Redis 缓存，设置过期时间为 5 分钟（300 秒）
    await setKey(cacheKey, articles, 300);

    // 返回统一的成功响应
    return res.status(200).json({
      success: true,
      message: "文章查询成功！",
      data: articles,
    });
  } catch (error) {
    // 捕获异常并返回错误信息
    console.error("查询文章时出错：", error.message);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    });
  }
});

module.exports = router;
