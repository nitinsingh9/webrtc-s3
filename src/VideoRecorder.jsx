import React, { useRef, useState, useCallback } from 'react';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

const S3_BUCKET_NAME = process.env.REACT_APP_S3_BUCKET_NAME;
const MIN_PART_SIZE = 5 * 1024 * 1024;
const s3Client = new S3Client({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
});

const VideoRecorder = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const uploadedPartsRef = useRef({});
  const accumulatedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const uploadId = useRef(null);
  const setVideoKey = useRef(null);
  const partNumberRef = useRef(1);

  const uploadChunk = useCallback(async (chunks, currentPartNumber) => {
    if (chunks.length === 0 || !uploadId.current) return;
    
    const blob = new Blob(accumulatedChunksRef.current, { type: 'video/webm' });
    const arrayBuffer = await blob.arrayBuffer();

    try {
      const { ETag } = await s3Client.send(new UploadPartCommand({
        Bucket: S3_BUCKET_NAME,
        Key: setVideoKey.current,
        UploadId: uploadId.current,
        PartNumber: currentPartNumber,
        Body: arrayBuffer,
      }));

      uploadedPartsRef.current[currentPartNumber] = { ETag, PartNumber: currentPartNumber };
      console.log(`Part ${currentPartNumber} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading chunk ${currentPartNumber}:`, error);
    }
    accumulatedChunksRef.current = [];
  }, [uploadId, setVideoKey]);

  // The rest of your component remains unchanged

  return (
    <div>
      <video ref={videoRef} autoPlay muted />
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default VideoRecorder;
