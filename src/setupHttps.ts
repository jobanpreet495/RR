import fs from 'fs';
import path from 'path';
import https from 'https';
import { Express } from 'express';

const certOptions = {
  key: fs.readFileSync(path.resolve('./cert/key.pem')),
  cert: fs.readFileSync(path.resolve('./cert/cert.pem'))
};

export default function setupHttps(app: Express) {
  return https.createServer(certOptions, app);
} 