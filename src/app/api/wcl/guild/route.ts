import { queryWclWithCache } from "@/library/wcl/api";
import { gql } from "graphql-request";

export const query = gql`
  query guild($id: Int, $name: String, $server: String, $region: String) {
    guildData {
      guild(id: $id, name: $name, serverSlug: $server, serverRegion: $region) {
        description
        id
        name
        server {
          id
          name
          slug
          region {
            id
            slug
          }
        }
      }
    }
  }
`;

export type GuildResponse = {
  guildData: {
    guild: {
      description: string;
      id: number;
      name: string;
      server: {
        id: number;
        name: string;
        slug: string;
        region: {
          id: number;
          slug: string;
        };
      };
    };
  };
};

export type Guild = {
  id: number;
  name: string;
  server: string;
  region: string;
};

type QueryVariables = Partial<{
  id: number;
  name: string;
  server: string;
  region: string;
}>;

function parseGuildResponse(data: GuildResponse): Guild {
  return {
    id: data.guildData.guild.id,
    name: data.guildData.guild.name,
    server: data.guildData.guild.server.name,
    region: data.guildData.guild.server.region.slug,
  };
}

function getVariablesFromBody(body: QueryVariables) {
  if (!body) {
    return new Response(JSON.stringify({ error: "Missing body" }), {
      status: 400,
    });
  }
  const { id, name, server, region } = body;

  if (id) {
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      return new Response(
        JSON.stringify({ error: "Param: 'id' must be a number" }),
        {
          status: 400,
        }
      );
    }
    return { id: parsedId };
  }

  if (!name) {
    return new Response(
      JSON.stringify({ error: "Param: 'name' is required" }),
      {
        status: 400,
      }
    );
  }
  if (!server) {
    return new Response(
      JSON.stringify({ error: "Param: 'server' is required" }),
      {
        status: 400,
      }
    );
  }
  if (!region) {
    return new Response(
      JSON.stringify({ error: "Param: 'region' is required" }),
      {
        status: 400,
      }
    );
  }

  return { name, server, region };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const maybeVariables = getVariablesFromBody(body);
    if (maybeVariables instanceof Response) {
      return maybeVariables;
    }

    const data = await queryWclWithCache<GuildResponse, QueryVariables>(
      "guild",
      query,
      maybeVariables
    );
    const guild = parseGuildResponse(data);

    return new Response(JSON.stringify(guild), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}
