// test/labs.test.js
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import session from 'express-session';
import request from 'supertest';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';

import DonationRouter from '../routes/donation.routes.js';
import { connectDB } from '../config/database.js';

let app;

const baseRoute = '/api/donations';
const cookieHeader = [
  'connect.sid=s%3AnqeH2HmnjvgnN1JpFb3Tf383f_67E0TK.rtSrDc56CbSqgdkM7Ic%2B7Z8jDQYnNZnVJdhzJl83DbA;',
];

beforeAll(async () => {
  await connectDB();

  app = express();
  app.use(express.json());

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'test_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        collectionName: 'sessions',
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  app.use(baseRoute, DonationRouter);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Integration tests for the donations API', () => {
  it('GET /api/donations - should return all donations', async () => {
    const res = await request(app).get(baseRoute).set('Cookie', cookieHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: expect.any(String),
            equipmentType: expect.any(String),
            equipmentName: expect.any(String),
            equipmentDescription: expect.any(String),
            yearsOfUse: expect.any(Number),
            warrantyDetails: expect.any(String),
            defects: expect.any(String),
            pointOfContact: expect.any(String),
            details: expect.any(String),
            userId: expect.any(String),
            isTaken: expect.any(Boolean),
          }),
        ]),
      })
    );
  });

  describe('POST /api/donations/create', () => {
    const endpoint = `${baseRoute}`;

    const postDonation = async (data) => {
      return await request(app).post(endpoint).set('Cookie', cookieHeader).send(data);
    };

    it('should create a new donation with valid data', async () => {
      const postData = {
        equipmentType: 'Medical',
        equipmentName: 'X-Ray Machine',
        equipmentDescription: 'A high-quality X-Ray machine.',
        yearsOfUse: 5,
        warrantyDetails: '2 years remaining',
        defects: 'None',
        pointOfContact: 'John Doe',
        details: 'Available for immediate pickup',
        userId: '67d558aa89f0026ff98fb588',
      };

      const res = await postDonation(postData);
      expect(res.statusCode).toBe(201);
    });

    it('should fail with missing required fields', async () => {
      const postData = {
        equipmentName: 'X-Ray Machine',
        yearsOfUse: 5,
        userId: '67d558aa89f0026ff98fb588',
      };

      const res = await postDonation(postData);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
          error: expect.objectContaining({
            equipmentType: expect.any(String),
            equipmentDescription: expect.any(String),
          }),
        })
      );
    });

    it('should fail with invalid userId', async () => {
      const postData = {
        equipmentType: 'Medical',
        equipmentName: 'X-Ray Machine',
        equipmentDescription: 'A high-quality X-Ray machine.',
        yearsOfUse: 5,
        warrantyDetails: '2 years remaining',
        defects: 'None',
        pointOfContact: 'John Doe',
        details: 'Available for immediate pickup',
        userId: 'invalid-user-id',
      };

      const res = await postDonation(postData);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
          error: expect.objectContaining({
            userId: expect.any(String),
          }),
        })
      );
    });

    it('should fail when userId does not exist', async () => {
      const postData = {
        equipmentType: 'Medical',
        equipmentName: 'X-Ray Machine',
        equipmentDescription: 'A high-quality X-Ray machine.',
        yearsOfUse: 5,
        warrantyDetails: '2 years remaining',
        defects: 'None',
        pointOfContact: 'John Doe',
        details: 'Available for immediate pickup',
        userId: '67d77b6bdf1591dfb78c7857',
      };

      const res = await postDonation(postData);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });
});
