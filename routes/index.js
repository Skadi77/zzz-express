var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

/* POST 验证验证码 */
const { verifyCaptcha } = require("../utils/captcha");
router.post("/verify", async function (req, res, next) {
  try {
    const { captchaVerifyParam } = req.body;

    if (!captchaVerifyParam) {
      return res.status(400).json({ message: "缺少验证码参数" });
    }

    const result = await verifyCaptcha(captchaVerifyParam);

    console.log("result!!!", result);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "验证码验证失败", error: error.message });
  }
});
/**
 * 获取直传阿里云 OSS 授权信息
 * GET /uploads/aliyun_direct
 */
const { getAliyunDirectUploadParams } = require("../utils/upload");
router.get("/aliyun_direct", async function (req, res, next) {
  try {
    const fileType = req.query.fileType;

    const params = await getAliyunDirectUploadParams(fileType);

    res.status(200).json({
      success: true,
      message: "获取阿里云 OSS 授权信息成功。",
      data: params,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "服务器错误", error: error.message });
  }
});

module.exports = router;
