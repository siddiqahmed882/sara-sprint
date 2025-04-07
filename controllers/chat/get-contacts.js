import { MatchModel } from '../../models/match.model.js';
import { UserModel } from '../../models/user.model.js';
import { ApiSuccessResponse } from '../../lib/api-response.js';
import { checkAuth } from '../../lib/check-auth.js';

/**
 * Get chat contacts
 * @type {import('../../types.js').RequestController}
 */
export async function getChatContacts(request) {
  const authUser = await checkAuth(request, ['doctor', 'patient']);

  const currentUserId = authUser.id;

  const myMatches = await MatchModel.find({
    $or: [{ user1: currentUserId }, { user2: currentUserId }],
    status: { $ne: 'rejected' },
  });

  const myMatchedUserIdsToMatchIdsMap = new Map();

  myMatches.forEach((match) => {
    if (match.user1.toString() === currentUserId) {
      myMatchedUserIdsToMatchIdsMap.set(match.user2.toString(), { matchId: match.id, status: match.status });
    } else {
      myMatchedUserIdsToMatchIdsMap.set(match.user1.toString(), { matchId: match.id, status: match.status });
    }
  });

  const myMatchedUserIds = Array.from(myMatchedUserIdsToMatchIdsMap.keys());
  const users = await UserModel.find({
    _id: { $in: myMatchedUserIds },
  });

  const contacts = users.map((user) => ({
    userId: user.id,
    name: user.name,
    matchId: myMatchedUserIdsToMatchIdsMap.get(user.id).matchId,
    status: myMatchedUserIdsToMatchIdsMap.get(user.id).status,
  }));

  return new ApiSuccessResponse({ data: contacts });
}
