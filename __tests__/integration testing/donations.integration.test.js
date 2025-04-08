// test/labs.test.js
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import request from 'supertest';
import mongoose from 'mongoose';

import DonationRouter from '../../routes/donation.routes.js';
import { connectDB } from '../../config/database.js';
import { getSessionMiddleware } from '../../middleware/session-middleware.js';

let app;
let donationId;

const baseRoute = '/api/donations';
const cookieHeader = ['connect.sid=s%3AeThje9B40c7JeKJc02fi1G_lXVMO3cwT.q1dUdgTkhLl2iEvtNMxEd07vryKzZJFAZTeN1tAgwgw;'];

beforeAll(async () => {
  await connectDB();

  app = express();
  app.use(express.json());

  app.use(getSessionMiddleware());

  app.use(baseRoute, DonationRouter);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Integration tests for the donations API', () => {
  it('GET /api/donations - should return all donations', async () => {
    const res = await request(app).get(`${baseRoute}/?type=by-me`).set('Cookie', cookieHeader);

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
      };

      const res = await postDonation(postData);
      expect(res.statusCode).toBe(201);

      donationId = res.body.data._id;
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
  });

  describe('PUT /api/donations/:donationId', () => {
    const postData = {
      equipmentType: 'Medical',
      equipmentName: 'X-Ray Machine',
      equipmentDescription: 'A high-quality X-Ray machine.',
      yearsOfUse: 3,
      warrantyDetails: '2 years remaining',
      defects: 'None',
      pointOfContact: 'John Doe',
      details: 'Available for immediate pickup',
    };

    it('should update an existing donation with valid data', async () => {
      const res = await request(app).put(`${baseRoute}/${donationId}`).set('Cookie', cookieHeader).send(postData);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe('DELETE /api/donations/:donationId', () => {
    it('should delete an existing donation', async () => {
      const res = await request(app).delete(`${baseRoute}/${donationId}`).set('Cookie', cookieHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Donation deleted successfully',
        })
      );
    });
  });
});
