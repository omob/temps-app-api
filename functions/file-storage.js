const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const path = require("path");

class FileStorage {
  #client;
  #space_end_point = process.env.SPACE_ENDPOINT;
  #accessKeyId = process.env.MLS_SPACE_KEY;
  #secretAccessKey = process.env.MLS_SPACE_SECRET_KEY;
  #space_region = process.env.SPACE_REGION;
  #spaceBaseUrl = process.env.MLS_SPACE_URL;
  #bucket = "mls-storage";

  constructor() {
    this.initialize();
  }

  initialize() {
    const s3Client = new S3Client({
      endpoint: this.#space_end_point, // Find your endpoint in the control panel, under Settings. Prepend "https://".
      region: this.#space_region, // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (e.g. nyc3).
      credentials: {
        accessKeyId: this.#accessKeyId, // Access key pair. You can create access key pairs using the control panel or API.
        secretAccessKey: this.#secretAccessKey, // Secret access key defined through an environment variable.
      },
    });
    this.#client = s3Client;
    return this.#client;
  }

  getInstance() {
    if (this.#client) return this.#client;
    return this.initialize();
  }

  async upload(path, key, body, mode) {
    try {
      const params = this.#getParams(path, key, body, mode);
      const data = await this.#client.send(new PutObjectCommand(params));
      console.log(
        "Successfully uploaded object: " + params.Bucket + "/" + params.Key
      );
      return data;
    } catch (err) {
      console.log("Error", err);
    }
  }

  #getParams(path, key, body, mode) {
    return {
      Bucket: this.#bucket, // The path to the directory you want to upload the object to, starting with your Space name.
      Key: `${path}/${key}`, // Object key, referenced whenever you want to access this file later.
      Body: body, // The object's contents. This variable is an object, not a string.
      ACL: mode ?? "private", // Defines ACL permissions, such as private or public.
      Metadata: {
        // Defines metadata tags.
        "x-amz-meta-my-key": "your-value",
      },
    };
  }

  multerS3(keyPath) {
    const spaceBaseUrl = this.#spaceBaseUrl;

    const cloudStorage = multerS3({
      s3: this.getInstance(),
      bucket: this.#bucket,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        console.log(req.user);
        const extName = path.extname(file.originalname).toLowerCase();
        const spacePath = `${keyPath}/${file.fieldname}${Date.now()}${extName}`;

        const fileUrl = `${spaceBaseUrl}/${spacePath}`;
        req.filePath = fileUrl;

        cb(null, spacePath);
      },
    });

    return cloudStorage;
  }
}

module.exports = FileStorage;
