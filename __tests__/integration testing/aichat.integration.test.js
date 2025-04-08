// test/labs.test.js
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import request from 'supertest';
import mongoose from 'mongoose';

import LabRouter from '../../routes/lab.routes.js';
import { connectDB } from '../../config/database.js';
import { getSessionMiddleware } from '../../middleware/session-middleware.js';

let app;

const baseRoute = '/api/ai-chat';
const cookieHeader = [
  'connect.sid=s%3AWRjEdPcniRj5nUxmkg4L9v9pTcP9zwIT.uX5E6zAGLv3vLHTTK4umdd4%2FLcUuGleOg13XMNSfJqs;',
];

beforeAll(async () => {
  await connectDB();

  app = express();
  app.use(express.json());

  app.use(getSessionMiddleware());

  app.use(baseRoute, LabRouter);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/ai-chat', () => {
  const endpoint = `${baseRoute}/`;

  const postAIChat = async (data) => {
    return await request(app).post(endpoint).set('Cookie', cookieHeader).send(data);
  };

  it('should return a valid AI response for a valid chat request', async () => {
    const postData = {
      messages: [
        { role: 'user', message: 'What are the lab timings?' },
      ],
    };

    const res = await postAIChat(postData);
    console.log(res.error)
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.any(String),
        }),
      })
    );
  });

  it('should fail with invalid message schema', async () => {
    const postData = {
      messages: [
        { role: 'invalid-role', message: 'What are the lab timings?' },
      ],
    };

    const res = await postAIChat(postData);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        error: expect.objectContaining({
          messages: expect.any(String),
        }),
      })
    );
  });

  it('should fail when messages array is empty', async () => {
    const postData = {
      messages: [],
    };

    const res = await postAIChat(postData);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        error: expect.objectContaining({
          messages: expect.any(String),
        }),
      })
    );
  });

  it('should fail when OpenAI API key is missing', async () => {
    const originalApiKey = process.env.OPEN_AI_API_KEY;
    delete process.env.OPEN_AI_API_KEY;

    const postData = {
      messages: [
        { role: 'user', message: 'What are the lab timings?' },
      ],
    };

    const res = await postAIChat(postData);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'No response from OpenAI API',
      })
    );

    process.env.OPEN_AI_API_KEY = originalApiKey; // Restore API key
  });

  it('should fail when knowledge base file is missing', async () => {
    jest.spyOn(fsPromises, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const postData = {
      messages: [
        { role: 'user', message: 'What are the lab timings?' },
      ],
    };

    const res = await postAIChat(postData);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Internal Server Error',
      })
    );
  });
});
