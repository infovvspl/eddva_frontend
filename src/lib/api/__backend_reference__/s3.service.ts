/**
 * BACKEND REFERENCE — NestJS S3 Service
 * Copy into your NestJS project: src/upload/s3.service.ts
 *
 * Dependencies:
 *   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * .env variables required:
 *   AWS_REGION=ap-south-1
 *   AWS_ACCESS_KEY_ID=...
 *   AWS_SECRET_ACCESS_KEY=...
 *   AWS_S3_BUCKET=eddva-assets
 *   AWS_S3_PRESIGN_EXPIRY_SECONDS=600
 */

import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export type UploadType = "profile" | "thumbnail" | "material" | "source";

export interface GenerateUploadUrlInput {
  tenantId: string;
  type: UploadType;
  courseId?: string;
  fileName: string;
  contentType: string;
}

export interface GenerateUploadUrlOutput {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly expiresIn: number;
  private readonly cdnBase: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: config.getOrThrow("AWS_REGION"),
      credentials: {
        accessKeyId: config.getOrThrow("AWS_ACCESS_KEY_ID"),
        secretAccessKey: config.getOrThrow("AWS_SECRET_ACCESS_KEY"),
      },
    });
    this.bucket = config.getOrThrow("AWS_S3_BUCKET");
    this.expiresIn = Number(config.get("AWS_S3_PRESIGN_EXPIRY_SECONDS") ?? 600);
    // CDN base — e.g. https://eddva-assets.s3.ap-south-1.amazonaws.com
    this.cdnBase = `https://${this.bucket}.s3.${config.getOrThrow("AWS_REGION")}.amazonaws.com`;
  }

  // ── Key builder ──────────────────────────────────────────────────────────────

  buildKey(input: GenerateUploadUrlInput): string {
    const { tenantId, type, courseId, fileName } = input;
    // Sanitise filename: remove path traversal chars, collapse spaces
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    switch (type) {
      case "profile":
        return `tenants/${tenantId}/admin/profile/${safeFileName}`;
      case "thumbnail":
        if (!courseId) throw new BadRequestException("courseId required for thumbnail uploads");
        return `tenants/${tenantId}/courses/${courseId}/thumbnail/${safeFileName}`;
      case "material":
        if (!courseId) throw new BadRequestException("courseId required for material uploads");
        return `tenants/${tenantId}/courses/${courseId}/materials/${safeFileName}`;
      case "source":
        if (!courseId) throw new BadRequestException("courseId required for source uploads");
        return `tenants/${tenantId}/courses/${courseId}/source/${safeFileName}`;
      default:
        throw new BadRequestException(`Unknown upload type: ${type}`);
    }
  }

  // ── Generate pre-signed PUT URL ──────────────────────────────────────────────

  async generateUploadUrl(input: GenerateUploadUrlInput): Promise<GenerateUploadUrlOutput> {
    this.validateContentType(input.type, input.contentType);

    const key = this.buildKey(input);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
      // Enforce exact Content-Type at upload time
      Metadata: { tenantId: input.tenantId, uploadType: input.type },
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: this.expiresIn });
    const fileUrl = `${this.cdnBase}/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  // ── Delete a file ────────────────────────────────────────────────────────────

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  // ── Generate pre-signed GET URL (for private buckets) ────────────────────────

  async generateViewUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  // ── Content-type allow-list ──────────────────────────────────────────────────

  private readonly ALLOWED_CONTENT_TYPES: Record<UploadType, string[]> = {
    profile:   ["image/jpeg", "image/png", "image/webp"],
    thumbnail: ["image/jpeg", "image/png", "image/webp"],
    material:  ["application/pdf", "image/jpeg", "image/png", "image/webp",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    source:    [], // unrestricted for source files
  };

  private validateContentType(type: UploadType, contentType: string): void {
    const allowed = this.ALLOWED_CONTENT_TYPES[type];
    if (allowed.length > 0 && !allowed.includes(contentType)) {
      throw new BadRequestException(
        `Content type "${contentType}" is not allowed for upload type "${type}".`
      );
    }
  }
}
