import { z } from 'zod';
import { LabModel } from '../../models/lab.model.js';
import { ApiSuccessResponse } from '../../lib/api-response.js';
import { checkAuth } from '../../lib/check-auth.js';
import { createNotification } from '../../lib/create-notification.js';
import mongoose from 'mongoose';
import HttpError from '../../lib/http-error.js';
import { UserModel } from '../../models/user.model.js';

const requestSchema = z.object({
  patientId: z.string().refine((val) => mongoose.isValidObjectId(val), {
    message: 'Invalid patient ID',
  }),
  testType: z.string(),
  labName: z.string(),
  appointmentDateTime: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    {
      message: 'Invalid date format',
    }
  ),
});

/**
 * Create a lab appointment
 * @type {import('../../types.js').RequestController}
 */
export async function createLabAppointment(request) {
  const authUser = await checkAuth(request, 'doctor');

  const requestBody = requestSchema.parse(request.body);

  const patientExists = await UserModel.findOne({
    _id: requestBody.patientId,
  });

  if (!patientExists) {
    throw new HttpError({
      statusCode: 404,
      message: 'Patient not found',
      name: 'NotFoundError',
    });
  }

  const labAppointment = new LabModel({
    labName: requestBody.labName,
    testType: requestBody.testType,
    bookingDateTime: new Date(requestBody.appointmentDateTime),
    doctor: authUser._id,
    patient: requestBody.patientId,
  });

  await labAppointment.save();

  createNotification({
    receiverId: requestBody.patientId,
    senderId: authUser._id.toString(),
    eventType: 'lab-appointment',
    relatedId: labAppointment._id.toString(),
  });

  return new ApiSuccessResponse({
    data: null,
    statusCode: 201,
  });
}
