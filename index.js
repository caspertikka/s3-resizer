import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from '@aws-sdk/lib-storage';
import Sharp from 'sharp';

const s3Client = new S3Client();

export const handler = async (event) => {
    try {
        const { bucket, object } = event.Records[0].s3;

        const originImage = await s3Client.send(new GetObjectCommand({
            Bucket: bucket.name,
            Key: object.key,
        }));

        const sharp = Sharp({ failOn: 'none' })
            .resize(500, null, { withoutEnlargement: true })

        const newKey = `500/${object.key}`

        // This does not work: await s3Client.send(new PutObjectCommand({params})
        // Solution: https://github.com/aws/aws-sdk-js-v3/issues/1920#issuecomment-761298908
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.BUCKET,
                Key: newKey,
                Body: originImage.Body.pipe(sharp),
                ContentType: originImage.ContentType,
                CacheControl: 'public, max-age=86400'
            },
        });
        await upload.done();

        return {
            statusCode: 200,
        };
    } catch (e) {
        return errorResponse('Exception: ' + e.message, e.statusCode || 400);
    }
}

function errorResponse(body, statusCode = 400) {
    return {
        statusCode,
        body,
        headers: {"Content-Type": "text/plain"}
    }
}
