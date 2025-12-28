import React, { useMemo } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';

import { SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { tables } from '@/module_bindings';
import { type LeaderboardEntry } from '@/types';

function LeaderboardRow({
  rank,
  username,
  score,
}: LeaderboardEntry & { rank: number }) {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 shadow-sm shadow-blue-100">
      <View className="mr-3 size-10 items-center justify-center rounded-full">
        <Text className="text-sm font-semibold text-blue-900">#{rank}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-blue-900">{username}</Text>
      </View>
      <View className="items-end">
        <Text className="text-xl font-bold text-blue-700">{score}</Text>
        <Text className="text-[10px] text-blue-400">pts</Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const { isActive } = useSpacetimeDB();

  const [leaderboard] = useTable(tables.leaderboard) ?? [[]];
  const sortedLeaderboard = useMemo(
    () => [...leaderboard].sort((a, b) => a.rank - b.rank),
    [leaderboard]
  );

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 20, flexGrow: 1 }}
      >
        <View className="overflow-hidden rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-md shadow-blue-100">
          <Text className="text-xs uppercase tracking-[3px] text-blue-500">
            Standings
          </Text>
          <Text className="mt-1 text-3xl font-bold text-blue-900">
            Leaderboard
          </Text>
          <View className="mt-4 flex-row items-center self-start rounded-full bg-blue-100 px-3 py-1">
            <View
              className={`mr-2 size-2 rounded-full ${
                isActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <Text className="text-[11px] uppercase tracking-[1px] text-blue-700">
              {isActive ? 'Live data' : 'Connecting…'}
            </Text>
          </View>
        </View>

        {sortedLeaderboard.length === 0 ? (
          <View className="mt-10 items-center rounded-3xl border border-blue-200 bg-blue-100 p-8 shadow-sm shadow-blue-100">
            <Text className="text-xl font-semibold text-blue-900">
              No scores yet
            </Text>
            <Text className="mt-2 text-center text-blue-600">
              Play a match to make your mark on the leaderboard.
            </Text>
          </View>
        ) : (
          <View className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm shadow-blue-100">
            {sortedLeaderboard.map((winner) => (
              <LeaderboardRow
                key={String(winner.playerId ?? '')}
                rank={winner.rank}
                identity={null}
                username={winner.username}
                score={winner.score}
                id={winner.playerId}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
