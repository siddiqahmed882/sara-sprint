import { z } from 'zod';
import { MatchModel } from '../../models/match.model.js';
import { ApiSuccessResponse } from '../../lib/api-response.js';
import { checkAuth } from '../../lib/check-auth.js';
import { createNotification } from '../../lib/create-notification.js';

const requestSchema = z.object({
  userId: z.string(),
});
/**
 * Create chat only match controller
 * @type {import('../../types.js').RequestController}
 */
export async function createChatOnlyMatchController(request) {
  const authUser = await checkAuth(request, ['patient', 'doctor']);
  const currentUserId = authUser._id.toString();

  const requestBody = requestSchema.parse(request.body);

  // check if the match already exists between the users
  const existingMatch = await MatchModel.findOne({
    $or: [
      { user1: currentUserId, user2: requestBody.userId },
      { user1: requestBody.userId, user2: currentUserId },
    ],
  });

  if (existingMatch) {
    return new ApiSuccessResponse({
      message: 'Match already exists',
      statusCode: 200,
      data: existingMatch,
    });
  }

  const newMatch = new MatchModel({
    user1: currentUserId,
    user2: requestBody.userId,
    status: 'chat-only',
  });

  await newMatch.save();

  createNotification({
    receiverId: requestBody.userId,
    senderId: currentUserId,
    eventType: 'match-request',
    relatedId: newMatch._id.toString(),
  });

  return new ApiSuccessResponse({
    message: 'Match created successfully',
    statusCode: 201,
    data: newMatch,
  });
}
