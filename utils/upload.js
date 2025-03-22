const OSS = require("ali-oss");
const { v4: uuidv4 } = require("uuid"); // 唯一名称库，比如上传保存的文件名字
const moment = require("moment"); // 时间日期库

// 阿里云配置信息
const config = {
  region: process.env.ALIYUN_REGION,
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  bucket: process.env.ALIYUN_BUCKET,
};

const client = new OSS(config);

/**
 * 获取直传阿里云 OSS 授权信息
 * @param {string} fileType - 文件类型（image、video、audio、other）
 * @returns {Promise<Object>} - 返回授权信息对象
 */
async function getAliyunDirectUploadParams(fileType) {
  try {
    if (!fileType) {
      throw new Error("请提供有效的文件类型（fileType）.");
    }

    // 有效期
    const date = moment().add(1, "days");

    // 允许的文件夹范围
    const allowedFolders = ["images", "videos", "audios", "others"]; // 定义允许的文件夹
    const folderMap = {
      image: "images",
      video: "videos",
      audio: "audios",
      other: "others",
    };

    // 根据 fileType 确定文件夹
    const folder = folderMap[fileType.toLowerCase()] || "others"; // 默认为 others
    if (!allowedFolders.includes(folder)) {
      throw new Error("不支持的文件类型，请选择 image、video、audio 或 other.");
    }

    // 动态生成文件名
    const fileName = `${uuidv4()}`; // 使用 UUID 生成唯一文件名
    const key = `${folder}/${fileName}`; // 文件路径

    // 上传安全策略
    const policy = {
      expiration: date.toISOString(), // 限制有效期
      conditions: [
        ["content-length-range", 0, 500 * 1024 * 1024], // 调整为 500MB，适合视频和音频
        { bucket: client.options.bucket }, // 限制上传的 bucket
        ["eq", "$key", key], // 限制上传的文件名
        [
          "in",
          "$content-type",
          [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp", // 图片
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/mkv", // 视频
            "audio/mpeg",
            "audio/wav",
            "audio/ogg",
            "audio/aac", // 音频
          ],
        ], // 扩展文件类型支持
      ],
    };

    // 签名
    const formData = await client.calculatePostSignature(policy);

    // bucket 域名（阿里云上传地址）
    const host = `https://${config.bucket}.${
      (await client.getBucketLocation()).location
    }.aliyuncs.com`.toString();

    // 返回参数
    return {
      expire: date.format("YYYY-MM-DD HH:mm:ss"),
      policy: formData.policy,
      signature: formData.Signature,
      accessid: formData.OSSAccessKeyId,
      host,
      key, // 后端生成的文件名
      url: host + "/" + key, // 文件最终访问 URL
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAliyunDirectUploadParams,
};
