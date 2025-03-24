import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface UploadResumeProps {
  apiToken: () => Promise<string>;
  apiEndpoints: {
    UPLOAD: string;
    RETRIEVE: string;
    SEARCH: string;
  };
  username: string;
}

const UploadResume: React.FC<UploadResumeProps> = ({ apiToken, apiEndpoints, username }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      return;
    }

    setUploading(true);
    try {
      const token = await apiToken();
      console.log('Token received:', token ? 'Yes' : 'No');
      
      const formData = new FormData();
      
      // Add all files with the same field name 'document'
      fileList.forEach(file => {
        formData.append('document', file.originFileObj as File);
      });
      
      formData.append('username', username);
      formData.append('category', 'resumes'); 

      // Add more detailed logging
      console.log('Full upload URL:', apiEndpoints.UPLOAD);
      console.log('Files to upload:', fileList.length);
      console.log('Username:', username);
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const response = await fetch(apiEndpoints.UPLOAD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      message.success('Upload completed successfully');
      setFileList([]);
      return data;
    } catch (error) {
      console.error('Upload error full details:', error);
      console.error('API Endpoint:', apiEndpoints.UPLOAD);
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <h2>Upload Resume</h2>
      <Upload
        multiple
        accept=".pdf,.docx"
        fileList={fileList}
        onChange={({ fileList }) => setFileList(fileList)}
        beforeUpload={() => false}
      >
        <Button icon={<UploadOutlined />}>Select Files</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: '16px' }}
      >
        Upload Resumes
      </Button>
    </div>
  );
};

export default UploadResume; 