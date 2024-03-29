import { hasEnvironmentAccess } from "@/app/lib/api/apiHelper";
import { prisma } from "@formbricks/database";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const environmentId = req.query.environmentId?.toString();

  if (!environmentId) {
    return res.status(400).json({ message: "Missing environmentId" });
  }

  const hasAccess = await hasEnvironmentAccess(req, res, environmentId);
  if (!hasAccess) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // GET
  if (req.method === "GET") {
    const people = await prisma.person.findMany({
      where: {
        environment: {
          id: environmentId,
        },
      },
      include: {
        attributes: {
          select: {
            id: true,
            value: true,
            attributeClass: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    return res.json(people);
  }

  // Unknown HTTP Method
  else {
    throw new Error(`The HTTP ${req.method} method is not supported by this route.`);
  }
}
