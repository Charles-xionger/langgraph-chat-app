import { OSSClient } from "@/services/ossService";

// Upload a file to OSS
export async function uploadFileToOSS(
  file: File,
  onProgress?: (percent: number) => void
) {
  const ossClient = new OSSClient();

  // 生成唯一的文件路径
  const timestamp = Date.now();
  const objectKey = `uploads/${timestamp}-${file.name}`;

  // 将 File 转换为 Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 上传文件
  const result = await ossClient.uploadObject(objectKey, buffer, {
    progress: (p: number) => {
      if (onProgress) {
        onProgress(p * 100);
      }
    },
  });

  return result;
}
