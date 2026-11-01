import { viewUserProfile } from '../repositories/users.ts';
import { recordCompletedMatch } from '../repositories/stats.ts';
import * as grpc from '@grpc/grpc-js';

type RpcCallback = (error: grpc.ServiceError | null, response?: object) => void;
type UserStatsCall = RpcCall<{ user_id: number }>;
type MatchCall = RpcCall<{
  match_id: string;
  players?: Array<{
    user_id: number;
    score: number;
    words_unscrambled: number;
    won: boolean;
  }>;
}>;
interface RpcCall<T> {
  request: T;
}

export async function getUserStats(call: UserStatsCall, callback: RpcCallback) {
  try {
    const user = await viewUserProfile(call.request.user_id);
    if (!user) {
      callback(null, { error: 'Not found' });
      return;
    }

    callback(null, {
      id: user.id,
      name: user.username,
      level: user.playerLevel,
      rank: user.rank,
      stats: {
        wins: user.wins,
        accuracy: user.accuracy,
      },
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve user stats',
    } as unknown as grpc.ServiceError);
  }
}

export async function recordMatch(call: MatchCall, callback: RpcCallback) {
  try {
    const request = call.request;
    const players = (request.players ?? []).map((player) => ({
      userId: Number(player.user_id),
      score: Number(player.score),
      wordsUnscrambled: Number(player.words_unscrambled),
      won: Boolean(player.won),
    }));

    const result = await recordCompletedMatch({
      matchId: String(request.match_id ?? ''),
      players,
    });
    callback(null, result);
  } catch (error) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: error instanceof Error ? error.message : 'Failed to record completed match',
    } as grpc.ServiceError);
  }
}
