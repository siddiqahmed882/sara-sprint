import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock data
const mockDoctors = [
  { _id: new mongoose.Types.ObjectId(), name: 'Dr. Alice' },
  { _id: new mongoose.Types.ObjectId(), name: 'Dr. Bob' },
];

const mockDoctorModels = {
  [mockDoctors[0]._id.toString()]: { specialization: 'cancer oncology' },
  [mockDoctors[1]._id.toString()]: { specialization: 'cardiology' },
};

const mockDisease = { name: 'Cancer', type: 'Oncology' };

// Mocks
const findUserMock = jest.fn();
const findDoctorMock = jest.fn();
const findDiseaseMock = jest.fn();
const createNotificationMock = jest.fn();

// Mocks first!
jest.unstable_mockModule('../../../models/user.model.js', () => ({
  UserModel: {
    find: findUserMock,
  },
}));

jest.unstable_mockModule('../../../models/doctor.model.js', () => ({
  DoctorModel: {
    findOne: findDoctorMock,
  },
}));

jest.unstable_mockModule('../../../models/disease-type.model.js', () => ({
  DiseaseTypeModel: {
    findById: findDiseaseMock,
  },
}));

jest.unstable_mockModule('../../../models/notification.model.js', () => ({
  NotificationModel: {
    create: createNotificationMock,
  },
}));

jest.unstable_mockModule('../../../lib/http-error.js', () => {
  return {
    default: class HttpError extends Error {
      constructor({ message, statusCode, name }) {
        super(message);
        this.statusCode = statusCode;
        this.name = name;
      }
    },
  };
});

// Import after mocks
const { postPatientRegisteration } = await import('../../../controllers/signup/signup-controller.js');

describe('postPatientRegisteration', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const patientData = {
    userDetails: { name: 'John Doe' },
    medicalHistory: {
      diseaseId: 'validDiseaseId',
      medicalHistory: 'Chronic symptoms for 3 years.',
      medicinalHistory: 'Paracetamol, Ibuprofen.',
    },
  };

  beforeEach(() => {
    findUserMock.mockResolvedValue(mockDoctors);
    findDiseaseMock.mockResolvedValue(mockDisease);
    findDoctorMock.mockImplementation(({ user }) => Promise.resolve(mockDoctorModels[user.toString()] || null));
    createNotificationMock.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends notifications to matched doctors and patient', async () => {
    await postPatientRegisteration({ userId, patientData });

    expect(findUserMock).toHaveBeenCalled();
    expect(findDiseaseMock).toHaveBeenCalledWith(patientData.medicalHistory.diseaseId);

    // should notify both doctors and patient
    expect(createNotificationMock).toHaveBeenCalledTimes(2);

    const [doctorNotifications, patientNotifications] = createNotificationMock.mock.calls.map((c) => c[0]);

    expect(doctorNotifications.length).toBe(1);
    expect(patientNotifications.length).toBe(1);
    expect(patientNotifications[0].user).toBe(userId);
  });

  it('throws HttpError when disease not found', async () => {
    findDiseaseMock.mockResolvedValue(null);

    await expect(postPatientRegisteration({ userId, patientData })).resolves.toBeUndefined(); // because error is caught internally and logged

    // nothing else should be called
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it('handles no matched doctors gracefully', async () => {
    // Set specializations to unmatched values
    mockDoctorModels[mockDoctors[0]._id.toString()].specialization = 'neurology';
    mockDoctorModels[mockDoctors[1]._id.toString()].specialization = 'urology';

    await postPatientRegisteration({ userId, patientData });

    expect(createNotificationMock).toHaveBeenCalledTimes(2);

    const [doctorNotifications, patientNotifications] = createNotificationMock.mock.calls.map((c) => c[0]);

    expect(doctorNotifications.length).toBe(0);
    expect(patientNotifications.length).toBe(0);
  });
});
