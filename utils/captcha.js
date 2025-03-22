const {
  default: CaptchaClient,
  VerifyIntelligentCaptchaRequest, // 从 SDK 解构请求类
} = require("@alicloud/captcha20230305");
const OpenApi = require("@alicloud/openapi-client");
const Util = require("@alicloud/tea-util");

// 创建阿里云客户端
function createClient() {
  const config = new OpenApi.Config({
    accessKeyId: process.env.ALICLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALICLOUD_ACCESS_KEY_SECRET,
  });
  config.endpoint = "captcha.cn-shanghai.aliyuncs.com";
  return new CaptchaClient(config);
}

async function verifyCaptcha(captchaVerifyParam, sceneId = "ql545gof") {
  if (!captchaVerifyParam) {
    throw new Error("缺少必要参数: captchaVerifyParam");
  }

  const client = createClient();

  // 构造请求对象
  const verifyRequest = new VerifyIntelligentCaptchaRequest({
    captchaVerifyParam,
    sceneId,
  });

  try {
    const response = await client.verifyIntelligentCaptchaWithOptions(
      verifyRequest,
      new Util.RuntimeOptions({})
    );

    // 根据响应结果返回成功或失败
    if (response.body.result.verifyResult) {
      return {
        success: true,
        message: "验证通过",
        data: response.body,
      };
    } else {
      return {
        success: false,
        message: "验证未通过",
        data: response.body,
      };
    }
  } catch (error) {
    console.error("Captcha Verification Error:", error);

    // 捕获并格式化错误信息
    const errorMsg = error.message || "未知错误";
    const errorCode = error.code || "InternalError";

    throw {
      code: errorCode,
      message: errorMsg,
      detail: error.data?.Recommend || error.stack,
    };
  }
}

module.exports = {
  verifyCaptcha, // 导出验证方法
};
