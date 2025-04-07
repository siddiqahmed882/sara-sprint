// test/labs.test.js
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import request from 'supertest';
import mongoose from 'mongoose';

import LabRouter from '../routes/lab.routes.js';
import { connectDB } from '../config/database.js';
import { getSessionMiddleware } from '../middleware/session-middleware.js';

let app;

const baseRoute = '/api/labs';
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

describe('Integration tests for the labs API', () => {
  it('GET /api/labs - should return all labs', async () => {
    const res = await request(app).get(baseRoute).set('Cookie', cookieHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: expect.any(String),
            labName: expect.any(String),
            testType: expect.any(String),
            bookingDateTime: expect.any(String),
            patient: expect.objectContaining({
              name: expect.any(String),
            }),
          }),
        ]),
      })
    );
  });

  describe('POST /api/labs/create-appointment', () => {
    const endpoint = `${baseRoute}/create-appointment`;

    const postAppointment = async (data) => {
      return await request(app).post(endpoint).set('Cookie', cookieHeader).send(data);
    };

    it('should create a new lab appointment with valid data', async () => {
      const postData = {
        appointmentDateTime: 'Mon, 07 Apr 2025 08:30:00 GMT',
        patientId: '67d558aa89f0026ff98fb588',
        testType: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
        labName: 'WAREED',
      };

      const res = await postAppointment(postData);
      expect(res.statusCode).toBe(201);
    });

    it('should fail with missing labName and invalid date format', async () => {
      const postData = {
        appointmentDateTime: 'invalid-date-format',
        patientId: '67d558aa89f0026ff98fb588',
        testType: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
      };

      const res = await postAppointment(postData);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
          error: expect.objectContaining({
            labName: expect.any(String),
            appointmentDateTime: expect.any(String),
          }),
        })
      );
    });

    it('should fail with invalid patientId', async () => {
      const postData = {
        appointmentDateTime: 'Mon, 07 Apr 2025 08:30:00 GMT',
        patientId: 'invalid-patient-id',
        testType: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
        labName: 'WAREED',
      };

      const res = await postAppointment(postData);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
          error: expect.objectContaining({
            patientId: expect.any(String),
          }),
        })
      );
    });

    it('should fail when patientId does not exist', async () => {
      const postData = {
        appointmentDateTime: 'Mon, 07 Apr 2025 08:30:00 GMT',
        patientId: '67d77b6bdf1591dfb78c7857',
        testType: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
        labName: 'WAREED',
      };

      const res = await postAppointment(postData);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });
});
