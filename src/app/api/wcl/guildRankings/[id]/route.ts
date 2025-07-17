import { gql } from "graphql-request";
import { queryWcl } from "@/library/wcl/api";

const query = gql`
  query guildRankings(
    $id: Int
    $limit: Int
    $page: Int
    $difficulty: Int
    $partition: Int
  ) {
    guildData {
      guild(id: $id) {
        members(limit: $limit, page: $page) {
          current_page
          has_more_pages
          from
          last_page
          per_page
          to
          total
          data {
            classID
            name
            id
            zoneRankings(difficulty: $difficulty, partition: $partition)
          }
        }
      }
    }
  }
`;

export type GuildMemberData = {
  classID: number;
  name: string;
  id: number;
  zoneRankings: {
    progress?: {
      completeRaidSpeed?: number;
      progress?: number;
    };
    speed?: number;
    completeRaidSpeed?: number;
  };
};

type GuildRankingsResponse = {
  guildData: {
    guild: {
      members: {
        /** Number of total items selected by the query */
        total: number;
        /** Number of items returned per page */
        per_page: number;
        /** Current page of the cursor */
        current_page: number;
        /** Number of the first item returned */
        from: number;
        /** Number of the last item returned */
        to: number;
        /** The last page (number of pages) */
        last_page: number;
        /** Determines if cursor has more pages after the current page */
        has_more_pages: boolean;
        data: GuildMemberData[];
      };
    };
  };
};

const membersTotalQuery = gql`
  query guildMemberTotal($id: Int) {
    guildData {
      guild(id: $id) {
        members {
          total
        }
      }
    }
  }
`;

type GuildMemberTotalResponse = {
  guildData: {
    guild: {
      members: {
        total: number;
      };
    };
  };
};

type QueryVariables = {
  id: number;
  page?: number;
  limit?: number;
  difficulty?: number;
  partition?: number;
};

const PAGE_SIZE = 100;

const BASE_VARIABLES = {
  //limit: 100,
  difficulty: 5, // Mythic
  partition: -1, // All partitions
};

async function getGuildMembersTotal(id: number): Promise<number> {
  try {
    const data = await queryWcl<GuildMemberTotalResponse, QueryVariables>(
      membersTotalQuery,
      {
        id,
      }
    );

    return data?.guildData?.guild?.members?.total ?? 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
}

async function fetchGuildMembers(id: number): Promise<GuildMemberData[]> {
  const total = await getGuildMembersTotal(id);

  if (total === 0) {
    throw new Error("No Guild Members found for id: " + id);
  }

  const pageCount = Math.ceil(total / PAGE_SIZE);
  const promises: Promise<GuildMemberData[]>[] = [];
  for (let i = 1; i <= pageCount; i++) {
    promises.push(fetchGuildMembersAsync(id, i));
  }

  return (await Promise.all(promises)).flat();
}

async function fetchGuildMembersAsync(
  id: number,
  page: number
): Promise<GuildMemberData[]> {
  const variables = {
    id,
    page,
    ...BASE_VARIABLES,
  };

  console.log("[fetchGuildMembersAsync] page:", page);
  const data = await queryWcl<GuildRankingsResponse, QueryVariables>(
    query,
    variables
  );

  const members = data?.guildData?.guild?.members;
  if (!members) {
    return [];
  }

  return members.data;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Missing guild id" }, { status: 400 });
  }

  try {
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      return Response.json({ error: "Invalid guild id" }, { status: 400 });
    }

    const data = await fetchGuildMembers(parsedId);
    return Response.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    return Response.json({ error: message }, { status: 500 });
  }
}
