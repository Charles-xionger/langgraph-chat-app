import OSS from "ali-oss";

export class OSSClient {
  private client: OSS;

  constructor() {
    this.client = new OSS({
      region: process.env.OSS_REGION!,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: process.env.OSS_BUCKET_NAME!,
    });
  }

  /**
   * 上传文件到 OSS
   * @param objectKey OSS 中的文件路径（不包含 Bucket 名称）
   * @param content 文件内容，可以是 Buffer、string 或本地文件路径
   * @param headers 自定义请求头
   */
  async uploadObject(
    objectKey: string,
    content: Buffer | string,
    headers?: Record<string, any>
  ) {
    try {
      const result = await this.client.put(objectKey, content, { headers });
      console.log(`上传成功: ${objectKey}`);
      return result;
    } catch (error) {
      console.error("上传对象失败:", error);
      throw error;
    }
  }

  /**
   * 下载文件从 OSS
   * @param objectKey OSS 中的文件路径
   * @param localPath 本地保存路径（可选）
   */
  async downloadObject(objectKey: string, localPath?: string) {
    try {
      const result = await this.client.get(objectKey, localPath);
      console.log(`下载成功: ${objectKey}`);
      return result;
    } catch (error) {
      console.error("下载对象失败:", error);
      throw error;
    }
  }

  /**
   * 获取文件内容（返回 Buffer）
   * @param objectKey OSS 中的文件路径
   */
  async getObjectContent(objectKey: string): Promise<Buffer> {
    try {
      const result = await this.client.get(objectKey);
      return result.content as Buffer;
    } catch (error) {
      console.error("获取对象内容失败:", error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param objectKey OSS 中的文件路径
   */
  async deleteObject(objectKey: string) {
    try {
      const result = await this.client.delete(objectKey);
      console.log(`删除成功: ${objectKey}`);
      return result;
    } catch (error) {
      console.error("删除对象失败:", error);
      throw error;
    }
  }

  /**
   * 批量删除文件
   * @param objectKeys OSS 中的文件路径数组
   */
  async deleteMultipleObjects(objectKeys: string[]) {
    try {
      const result = await this.client.deleteMulti(objectKeys);
      console.log(`批量删除成功: ${objectKeys.length} 个文件`);
      return result;
    } catch (error) {
      console.error("批量删除对象失败:", error);
      throw error;
    }
  }

  /**
   * 列出文件列表
   * @param prefix 文件前缀（可选）
   * @param maxKeys 最大返回数量，默认 100
   */
  async listObjects(
    prefix?: string,
    maxKeys: number = 100
  ): Promise<OSS.ListObjectResult> {
    try {
      const query: any = {};
      if (prefix) query.prefix = prefix;
      if (maxKeys) query["max-keys"] = maxKeys;

      const result = await this.client.list(query, {});
      console.log(`列出文件成功: 共 ${result.objects?.length || 0} 个文件`);
      return result;
    } catch (error) {
      console.error("列出对象失败:", error);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   * @param objectKey OSS 中的文件路径
   */
  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.head(objectKey);
      return true;
    } catch (error: any) {
      if (error.code === "NoSuchKey") {
        return false;
      }
      throw error;
    }
  }

  /**
   * 获取文件元信息
   * @param objectKey OSS 中的文件路径
   */
  async getObjectMeta(objectKey: string) {
    try {
      const result = await this.client.head(objectKey);
      return result;
    } catch (error) {
      console.error("获取对象元信息失败:", error);
      throw error;
    }
  }

  /**
   * 生成签名 URL（用于临时访问）
   * @param objectKey OSS 中的文件路径
   * @param expires 过期时间（秒），默认 3600 秒（1小时）
   */
  async generateSignedUrl(
    objectKey: string,
    expires: number = 3600
  ): Promise<string> {
    try {
      const url = this.client.signatureUrl(objectKey, { expires });
      console.log(`生成签名 URL: ${objectKey}`);
      return url;
    } catch (error) {
      console.error("生成签名 URL 失败:", error);
      throw error;
    }
  }

  /**
   * 复制文件
   * @param sourceKey 源文件路径
   * @param targetKey 目标文件路径
   */
  async copyObject(sourceKey: string, targetKey: string) {
    try {
      const result = await this.client.copy(targetKey, sourceKey);
      console.log(`复制成功: ${sourceKey} -> ${targetKey}`);
      return result;
    } catch (error) {
      console.error("复制对象失败:", error);
      throw error;
    }
  }
}
